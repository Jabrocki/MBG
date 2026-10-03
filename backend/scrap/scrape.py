"""Biblioteka ROPS → jeden plik Markdown na innowację."""
import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urldefrag, urlsplit, urlunsplit

import scrapy
from scrapy.crawler import CrawlerProcess
from markdownify import markdownify

BASE = "https://rops.krakow.pl"
PREFIX = "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/"
INDEX = BASE + PREFIX + "kategorie"
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "data"
LINK_TYPES = {
    "learn_more": "Dowiedz się więcej",
    "video": "Zobacz film",
    "materials": "Pobierz materiały",
    "license": "Zasady wykorzystania",
    "other": "Pozostałe linki",
}


def clean(value):
    return " ".join(value.split())


def text(node):
    return clean(" ".join(node.xpath(".//text()").getall()))


def canonical(url):
    parts = urlsplit(urldefrag(url)[0])
    return urlunsplit(("https", parts.netloc.lower(), parts.path.rstrip("/"), parts.query, ""))


def innovation_id(url):
    return urlsplit(url).path.rsplit(",", 1)[-1]


def is_library(url):
    parts = urlsplit(url)
    return parts.netloc == "rops.krakow.pl" and parts.path.startswith(PREFIX)


def extract_links(content, response):
    links = {key: [] for key in LINK_TYPES}
    for anchor in content.css("a[href]"):
        href = anchor.attrib["href"].strip()
        if not href or href.startswith("#"):
            continue
        url = response.urljoin(href)
        if urlsplit(url).scheme not in ("https", "http"):
            continue
        label = text(anchor)
        icons = " ".join(anchor.css("img::attr(src)").getall()).lower()
        hint = (label + " " + icons).lower()
        if "lupa" in hint or "dowiedz" in hint:
            kind = "learn_more"
        elif "play" in icons or "zobacz" in hint or "youtu" in url:
            kind = "video"
        elif "read2" in icons or "pobierz" in hint:
            kind = "materials"
        elif any(s in hint for s in ("cc_by", "symbol-c", "zasady", "licenc")) or "creativecommons.org" in url:
            kind = "license"
        else:
            kind = "other"
        if not any(link["url"] == url for link in links[kind]):
            links[kind].append({"label": label or LINK_TYPES[kind], "url": url})
    return links


def extract_item(response):
    title = response.css(".content__main .page-title")
    content = response.css(".content__main > .text-content")
    if not title or not content:
        raise ValueError(f"Brak tytułu lub treści innowacji: {response.url}")
    links = extract_links(content, response)
    # Tabele z ikonami są reprezentowane przez osobne sekcje linków.
    html = content[0].root
    for table in list(html.xpath(".//table[.//img]")):
        table.getparent().remove(table)
    description = markdownify(
        scrapy.Selector(root=html).get(), heading_style="ATX", strip=["img"]
    ).strip()
    # Nagłówki opisu umieszczamy pod nadrzędną sekcją Opis.
    description = re.sub(r"(?m)^#{1,6} ", "### ", description)
    return {
        "id": innovation_id(response.url),
        "title": text(title),
        "source_url": canonical(response.url),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "description": description,
        "links": links,
    }


def render(item, categories):
    metadata = {
        "id": item["id"], "title": item["title"],
        "source": "Regionalny Ośrodek Polityki Społecznej w Krakowie",
        "source_url": item["source_url"], "catalog_url": INDEX,
        "fetched_at": item["fetched_at"], "categories": categories,
        "links_checked": False,
    }
    # JSON values are valid YAML: no extra YAML dependency or escaping rules.
    lines = ["---"] + [f"{key}: {json.dumps(value, ensure_ascii=False)}" for key, value in metadata.items()]
    lines += ["---", "", f"# {item['title']}", "", "## Metadane", "",
              f"- Źródło: <{item['source_url']}>", f"- Pobrano (UTC): {item['fetched_at']}"]
    lines += [f"- Kategoria: [{c['name']}](<{c['url']}>)" for c in categories]
    lines += ["", "## Linki", ""]
    for key, heading in LINK_TYPES.items():
        lines += [f"### {heading}", ""]
        entries = item["links"][key]
        lines += [f"- [{entry['label'].replace('[', '').replace(']', '')}](<{entry['url']}>)" for entry in entries] or ["Brak linku na stronie źródłowej."]
        lines += [""]
    lines += ["Linki zapisano ze strony źródłowej; nie weryfikowano dostępności plików ani filmów.",
              "", "## Opis", "", item["description"], ""]
    return "\n".join(lines)


class MarkdownPipeline:
    def __init__(self):
        self.items = {}

    def process_item(self, item, spider):
        self.items[item["id"]] = item
        return item

    def close_spider(self, spider):
        if not self.items:
            return
        spider.output.mkdir(parents=True, exist_ok=True)
        for ident, item in sorted(self.items.items()):
            categories = sorted(spider.categories.get(ident, {}).values(), key=lambda c: c["slug"])
            filename = re.sub(r"[^\w-]", "_", ident) + ".md"
            path = spider.output / filename
            temporary = path.with_suffix(".md.tmp")
            temporary.write_text(render(item, categories), encoding="utf-8")
            temporary.replace(path)
            spider.crawler.stats.inc_value("markdown/written")
            spider.logger.info("Zapisano %s", path)


class InnovationsSpider(scrapy.Spider):
    name = "rops_innovations"
    allowed_domains = ["rops.krakow.pl"]

    def __init__(self, url=None, output=DEFAULT_OUTPUT, **kwargs):
        super().__init__(**kwargs)
        self.single_url = url
        self.output = Path(output).resolve()
        self.categories = {}
        self.scheduled = set()

    async def start(self):
        yield scrapy.Request(self.single_url or INDEX,
                             callback=self.parse_innovation if self.single_url else self.parse,
                             errback=self.failed)

    def failed(self, failure):
        self.crawler.stats.inc_value("scrape/errors")
        self.logger.error("Nie udało się pobrać %s: %s", failure.request.url, failure.value)

    def parse(self, response):
        urls = set()
        for href in response.css(".content__main .text-content a::attr(href)").getall():
            url = canonical(response.urljoin(href))
            if is_library(url) and "," not in urlsplit(url).path and url != INDEX:
                urls.add(url)
        if not urls:
            raise ValueError("Nie znaleziono kategorii — możliwa zmiana HTML")
        for url in sorted(urls):
            yield scrapy.Request(url, callback=self.parse_category, errback=self.failed)

    def add_category(self, ident, url, name):
        url = canonical(url)
        self.categories.setdefault(ident, {})[url] = {
            "slug": urlsplit(url).path.rsplit("/", 1)[-1],
            "name": name, "url": url,
        }

    def parse_category(self, response):
        title = text(response.css(".content__main .page-title"))
        cards = response.css(".news-list__title::attr(href)").getall()
        if not cards:
            raise ValueError(f"Brak innowacji w kategorii: {response.url}")
        category_url = response.url.split("?", 1)[0]
        for href in cards:
            url = canonical(response.urljoin(href))
            if not is_library(url) or "," not in urlsplit(url).path:
                continue
            ident = innovation_id(url)
            self.add_category(ident, category_url, title)
            if ident not in self.scheduled:
                self.scheduled.add(ident)
                yield scrapy.Request(url, callback=self.parse_innovation, errback=self.failed)
        for href in response.css('.pagination a::attr(href), a[rel="next"]::attr(href)').getall():
            url = canonical(response.urljoin(href))
            if is_library(url) and urlsplit(url).path == urlsplit(response.url).path:
                yield scrapy.Request(url, callback=self.parse_category, errback=self.failed)

    def parse_innovation(self, response):
        item = extract_item(response)
        category_url = response.url.split(",", 1)[0]
        names = [text(a) for a in response.css("a[href]")
                 if canonical(response.urljoin(a.attrib["href"])) == canonical(category_url) and text(a) != "Powrót"]
        self.add_category(item["id"], category_url,
                          names[0] if names else category_url.rsplit("/", 1)[-1])
        yield item


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--all", action="store_true", help="Pobierz całą bibliotekę")
    mode.add_argument("--url", help="Pobierz wyłącznie wskazaną innowację")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Domyślnie backend/data")
    args = parser.parse_args()
    if args.url:
        if not is_library(args.url) or "," not in urlsplit(args.url).path or urlsplit(args.url).scheme not in ("http", "https"):
            parser.error("--url musi wskazywać stronę innowacji ROPS (adres z przecinkiem)")
        args.url = canonical(args.url)
    process = CrawlerProcess({
        "USER_AGENT": "ROPSInnovationLibraryScraper/1.0",
        "ROBOTSTXT_OBEY": True, "CONCURRENT_REQUESTS": 2,
        "DOWNLOAD_DELAY": 1, "DOWNLOAD_TIMEOUT": 45, "RETRY_TIMES": 2,
        "AUTOTHROTTLE_ENABLED": True, "LOG_LEVEL": "INFO",
        "ITEM_PIPELINES": {MarkdownPipeline: 300},
        "TELNETCONSOLE_ENABLED": False,
    })
    crawler = process.create_crawler(InnovationsSpider)
    process.crawl(crawler, url=args.url, output=args.output)
    process.start()
    stats = crawler.stats.get_stats()
    count = stats.get("markdown/written", 0)
    errors = stats.get("scrape/errors", 0) + stats.get("log_count/ERROR", 0)
    print(f"Zapisano {count} innowacji w {args.output.resolve()}")
    return 1 if errors or not count or stats.get("finish_reason") != "finished" else 0


if __name__ == "__main__":
    raise SystemExit(main())
