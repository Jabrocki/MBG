"""Create 512-dimensional JSONL embeddings through Ollama."""
from __future__ import annotations
import argparse, hashlib, json, math, re, urllib.request
from pathlib import Path
DATA = Path(__file__).resolve().parent.parent / "data"
MODEL = "nomic-embed-text"
DIM = 512

def body(v):
    if v.startswith("---"):
        p = v.split("---", 2)
        if len(p) == 3: v = p[2]
    return re.sub(r"\s+", " ", v).strip()

def title(v, fallback):
    m = re.search(r"^#\s+(.+)$", v, re.M)
    return m.group(1).strip() if m else fallback

def docs(collection, data):
    root = data / collection
    paths = [root / "synthetic_reports.md"] if collection == "submissions" else sorted(root.glob("*.md"))
    out = []
    for path in paths:
        if path.name in {"README.md", "SOURCES_REVIEW.md"}: continue
        value = path.read_text(encoding="utf-8")
        if collection == "submissions":
            parts = re.split(r"^##\s+(\d+\.\s+.+)$", value, flags=re.M)
            for heading, text in zip(parts[1::2], parts[2::2]):
                out.append({"id": f"{collection}:{path.name}:{heading}", "title": heading,
                            "text": body(text), "path": str(path.relative_to(data))})
        else:
            out.append({"id": f"{collection}:{path.name}", "title": title(value, path.stem),
                        "text": body(value), "path": str(path.relative_to(data))})
    return out

def chunks(record):
    text, out, start = record["text"], [], 0
    while start < len(text):
        end = min(start + 4000, len(text))
        if end < len(text):
            boundary = text.rfind(" ", start + 2000, end)
            if boundary > start: end = boundary
        value = text[start:end].strip()
        if value: out.append({**record, "chunk_index": len(out), "text": value})
        start = end - 400 if end < len(text) else end
    return out

def embed(texts):
    payload = json.dumps({"model": MODEL, "input": ["search_document: " + text for text in texts]}).encode()
    req = urllib.request.Request("http://127.0.0.1:11434/api/embed", payload, {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        values = json.loads(r.read())["embeddings"]
    return [[x / (math.sqrt(sum(v*v for v in row[:DIM])) or 1.0) for x in row[:DIM]] for row in values]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=DATA)
    ap.add_argument("--collection", action="append", choices=["innovations", "problems", "submissions"])
    a = ap.parse_args()
    for collection in a.collection or ["innovations", "problems", "submissions"]:
        records = [c for d in docs(collection, a.data) for c in chunks(d)]
        rows = []
        for start in range(0, len(records), 32):
            batch = records[start:start + 32]
            vectors = embed([r["text"] for r in batch])
            for i, (r, vector) in enumerate(zip(batch, vectors), start + 1):
                content, digest = r["text"], hashlib.sha256(r["text"].encode()).hexdigest()
                row = {"id": hashlib.sha256(f"{r['id']}:{r['chunk_index']}:{digest}".encode()).hexdigest(),
                       "collection": collection, "document_id": r["id"], "chunk_index": r["chunk_index"],
                       "path": r["path"], "title": r["title"], "content": content,
                       "content_sha256": digest, "model": MODEL, "task_prefix": "search_document",
                       "dimensions": DIM, "embedding": vector}
                rows.append(json.dumps(row, ensure_ascii=False))
                if i % 25 == 0 or i == len(records): print(f"{collection}: {i}/{len(records)}", flush=True)
        target = a.data / "embeddings" / f"{collection}.jsonl"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("\n".join(rows) + "\n", encoding="utf-8")
        print(f"zapisano {target}", flush=True)

if __name__ == "__main__":
    main()
