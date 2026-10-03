"""Generate Polish synthetic records from scraped innovations through Ollama."""
from __future__ import annotations
import argparse, json, random, re, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
MODEL = "hubmi-synthetic"

def sources(data):
    out = []
    for p in sorted((data / "innovations").glob("*.md")):
        if p.name.startswith("synthetic-"): continue
        value = p.read_text(encoding="utf-8")
        m = re.search(r"^#\s+(.+)$", value, re.M)
        if m: out.append((m.group(1), value[:900]))
    if not out: raise RuntimeError("Brak zescrapowanych innowacji")
    return out

def ask(prompt, temperature=0.9):
    body = json.dumps({"model": MODEL, "prompt": prompt, "stream": False, "format": "json",
                       "options": {"temperature": temperature, "top_p": 0.92, "num_predict": 1800}}).encode()
    req = urllib.request.Request("http://127.0.0.1:11434/api/generate", body,
                                 {"Content-Type": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                raw = json.loads(r.read())["response"]
            cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.M).strip()
            try:
                value = json.loads(cleaned)
            except json.JSONDecodeError:
                left, right = cleaned.find("["), cleaned.rfind("]")
                if left < 0 or right <= left:
                    raise ValueError("Ollama zwróciła niepoprawny JSON")
                value = json.loads(cleaned[left:right + 1])
            if isinstance(value, list): return value
            if isinstance(value, dict):
                for item in value.values():
                    if isinstance(item, list): return item
                if any(key in value for key in ("title", "slug", "report", "description")):
                    return [value]
            raise ValueError("Ollama zwróciła niepoprawny JSON")
        except (OSError, ValueError, json.JSONDecodeError):
            if attempt == 3: raise
            time.sleep(2 ** attempt)
    raise AssertionError

def context(items):
    return "\n\n".join(f"ŹRÓDŁO {i+1}: {title}\n{text}" for i, (title, text) in enumerate(items))

def batches(kind, source, count, batch):
    result = []
    for offset in range(0, count, batch):
        n = min(batch, count - offset)
        if kind == "innovation":
            fields = "slug,title,category,locality,problem,target_group,solution,implementation,evidence,limitations"
            task = f"Wymyśl {n} nowych, fikcyjnych innowacji społecznych."
            rules = "Nie kopiuj nazw, zdań, autorów ani URL. Każdy rekord ma być wyraźnie inny. Lokalizacja wyłącznie w Małopolsce; używaj różnych powiatów, gmin i dzielnic Krakowa."
        elif kind == "problem":
            fields = "slug,title,description,locality,affected_group,urgency,context"
            task = f"Wygeneruj {n} fikcyjnych, anonimowych zgłoszeń problemów społecznych."
            rules = "Brzmij jak naturalne zgłoszenia mieszkańców; zmieniaj wieś, małe miasta i dzielnice Krakowa. Lokalizacja wyłącznie w Małopolsce."
        else:
            fields = "title,locality,report,desired_change"
            task = f"Napisz {n} fikcyjnych, anonimowych zgłoszeń mieszkańców."
            rules = "Report ma mieć 80–150 słów, naturalny styl, bez danych osobowych; lokalizacja wyłącznie w Małopolsce."
        selected = random.Random(offset + len(kind) * 1000).sample(source, min(18, len(source)))
        prompt = f"""Tworzysz dane testowe po polsku. {task}
Inspiruj się tematami ze źródeł ROPS, ale nie twierdź, że rekord pochodzi ze źródła.
{rules} Zwróć wyłącznie JSON array obiektów z polami: {fields}.
Pisz zwięźle: każde pole tekstowe to najwyżej 1–2 konkretne zdania, bez lania wody.

{context(selected)}"""
        try:
            result.extend(ask(prompt, 1.0 if kind != "innovation" else 0.9))
        except ValueError as error:
            print(f"pomijam wadliwą partię {offset + 1}-{offset + n}: {error}", flush=True)
        print(f"{kind}: {min(offset+n,count)}/{count}", flush=True)
    return result[:count]

def write_innovations(records, data):
    root = data / "innovations"
    for p in root.glob("synthetic-innovation-*.md"): p.unlink()
    stamp = datetime.now(timezone.utc).isoformat()
    for i, x in enumerate(records, 1):
        slug = f"synthetic-innovation-{i:04d}"
        text = f"""---
id: "{slug}"
title: {json.dumps(str(x.get("title", slug)), ensure_ascii=False)}
source_url: null
synthetic: true
generation_model: "{MODEL}"
generated_at: "{stamp}"
categories: [{json.dumps({"slug": "synthetic", "name": str(x.get("category", "Innowacje społeczne"))}, ensure_ascii=False)}]
---

# {x.get("title", slug)}

## Lokalizacja

{x.get("locality", "Małopolska")}

## Problem

{x.get("problem", "")}

## Grupa docelowa

{x.get("target_group", "")}

## Na czym polega rozwiązanie?

{x.get("solution", "")}

## Wdrożenie

{x.get("implementation", "")}

## Rezultaty pilotażu

{x.get("evidence", "")}

## Ograniczenia

{x.get("limitations", "")}
"""
        (root / f"{slug}.md").write_text(text, encoding="utf-8")

def write_problems(records, data):
    root = data / "problems"
    for p in root.glob("synthetic-problem-*.md"): p.unlink()
    for i, x in enumerate(records, 1):
        slug = f"synthetic-problem-{i:04d}"
        text = f"""---
id: "{slug}"
synthetic: true
generation_model: "{MODEL}"
---

# {x.get("title", slug)}

## Opis zgłoszenia

{x.get("description", "")}

## Lokalizacja

{x.get("locality", "Małopolska")}

## Dotknięta grupa

{x.get("affected_group", "")}

## Pilność

{x.get("urgency", "")}

## Kontekst

{x.get("context", "")}
"""
        (root / f"{slug}.md").write_text(text, encoding="utf-8")

def write_reports(records, data):
    path = data / "submissions" / "synthetic_reports.md"
    lines = ["---", 'status: "fictional_synthetic_reports"', f'generation_model: "{MODEL}"',
             f'generated_at: "{datetime.now(timezone.utc).isoformat()}"',
             f"report_count: {len(records)}", "counts_as_real_reports: false", "source: null", "---", "",
             "# Fikcyjne syntetyczne zgłoszenia z Małopolski", "",
             "Wygenerowane na podstawie tematów zescrapowanych innowacji; nie opisują prawdziwych osób ani zdarzeń.", ""]
    for i, x in enumerate(records, 1):
        lines += [f"## {i}. {x.get('title', 'Zgłoszenie')}", "",
                  f"**Lokalizacja:** {x.get('locality', 'Małopolska')}", "",
                  x.get("report", ""), "", f"**Oczekiwana zmiana:** {x.get('desired_change', '')}", ""]
    path.write_text("\n".join(lines), encoding="utf-8")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=DATA)
    ap.add_argument("--innovations", type=int, default=300)
    ap.add_argument("--problems", type=int, default=300)
    ap.add_argument("--reports", type=int, default=30)
    ap.add_argument("--batch", type=int, default=6)
    a = ap.parse_args()
    src = sources(a.data)
    print(f"Źródła: {len(src)} zescrapowanych innowacji", flush=True)
    write_innovations(batches("innovation", src, a.innovations, a.batch), a.data)
    write_problems(batches("problem", src, a.problems, a.batch), a.data)
    write_reports(batches("report", src, a.reports, a.batch), a.data)

if __name__ == "__main__":
    main()
