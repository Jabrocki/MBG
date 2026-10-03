import tempfile
import unittest
from pathlib import Path
from scrapy.http import HtmlResponse
from scrape import BASE, PREFIX, InnovationsSpider, extract_item, render

URL = BASE + PREFIX + 'dla-seniorow,bawita'


class ScraperTests(unittest.TestCase):
    def response(self, body=None, url=URL):
        if body is None:
            body = Path(__file__).with_name('fixtures').joinpath('bawita.html').read_text()
        return HtmlResponse(url=url, body=body.encode(), encoding='utf-8')

    def test_bawita_links_and_markdown(self):
        item = extract_item(self.response())
        self.assertEqual(item['title'], 'BaWita')
        self.assertEqual(item['links']['video'][0]['url'], 'https://www.youtube.com/watch?v=o7UhDlebLJo')
        self.assertEqual(item['links']['materials'][0]['url'], BASE + '/pliki/IS/bibloteka/bawita.zip')
        self.assertTrue(item['links']['learn_more'][0]['url'].endswith('ROPS_Folder_IN_BaWita_v15_www.pdf'))
        self.assertEqual(item['links']['license'][0]['url'], 'https://creativecommons.org/licenses/by/4.0/deed.pl')
        md = render(item, [{'name': 'Dla seniorów', 'slug': 'dla-seniorow', 'url': URL.split(',')[0]}])
        self.assertIn('### 6. Autorzy', md)
        self.assertIn('Maria Lorenc', md)
        self.assertIn('categories:', md)
        self.assertNotIn('lupa.png', md)

    def test_missing_link_is_explicit(self):
        item = extract_item(self.response())
        item['links']['video'] = []
        self.assertIn('### Zobacz film\n\nBrak linku', render(item, []))

    def test_duplicate_category_membership_and_pagination(self):
        spider = InnovationsSpider()
        body = '<h2 class="page-title">Dla seniorów</h2><a class="news-list__title" href="' + URL + '">BaWita</a>'
        # Fixtures use the same innovation only, no network access.
        body = '<div class="content__main">' + body + '</div><div class="pagination"><a href="?page=2">2</a></div>'
        requests = list(spider.parse_category(self.response(body, URL.split(',')[0])))
        self.assertEqual(len(requests), 2)
        second = BASE + PREFIX + 'dla-zdrowia-i-medycyny'
        list(spider.parse_category(self.response(body, second)))
        self.assertEqual(len(spider.scheduled), 1)
        self.assertEqual(len(spider.categories['bawita']), 2)

    def test_wrong_html_fails(self):
        with self.assertRaises(ValueError):
            extract_item(self.response('<html>Maintenance</html>'))


if __name__ == '__main__':
    unittest.main()
