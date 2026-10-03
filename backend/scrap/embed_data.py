"""Lokalne embeddingi Nomic dla innovations, problems i submissions.

Nie korzysta z Ollama ani z API. Model jest pobierany z Hugging Face do lokalnego
cache biblioteki. Wyniki są sidecarami JSONL i nie ustanawiają kontraktu aplikacji.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import tempfile
import os

MODEL = 'nomic-ai/nomic-embed-text-v1.5'
TASK_PREFIX = 'search_document: '
DIMENSIONS = 512
CHUNK_CHARS = 4_000
CHUNK_OVERLAP = 400
DATA = Path(__file__).resolve().parent.parent / 'data'
COLLECTIONS = ('innovations', 'problems', 'submissions')


def digest(value: str) -> str:
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def body(markdown: str) -> str:
    if markdown.startswith('---'):
        parts = markdown.split('---', 2)
        if len(parts) == 3:
            markdown = parts[2]
    return re.sub(r'\s+', ' ', markdown).strip()


def title(markdown: str, fallback: str) -> str:
    match = re.search(r'^#\s+(.+)$', markdown, re.MULTILINE)
    return match.group(1).strip() if match else fallback


def submission_sections(path: Path) -> list[tuple[str, str]]:
    value = path.read_text(encoding='utf-8')
    sections = re.split(r'^##\s+(\d+\.\s+.+)$', value, flags=re.MULTILINE)
    return [(heading, text) for _, heading, text in zip(sections[1::2], sections[1::2], sections[2::2])]


def documents(collection: str, data: Path) -> list[dict[str, str]]:
    root = data / collection
    if collection == 'submissions':
        path = root / 'synthetic_reports.md'
        return [
            {'id': f'{collection}:{path.name}:{heading}', 'title': heading,
             'text': body(text), 'path': str(path.relative_to(data))}
            for heading, text in submission_sections(path)
        ]
    records = []
    for path in sorted(root.glob('*.md')):
        if path.name in {'README.md', 'SOURCES_REVIEW.md'}:
            continue
        value = path.read_text(encoding='utf-8')
        records.append({'id': f'{collection}:{path.name}', 'title': title(value, path.stem),
                        'text': body(value), 'path': str(path.relative_to(data))})
    return records


def chunks(record: dict[str, str]) -> list[dict[str, str | int]]:
    text = record['text']
    result = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_CHARS, len(text))
        if end < len(text):
            boundary = text.rfind(' ', start + CHUNK_CHARS // 2, end)
            if boundary > start:
                end = boundary
        value = text[start:end].strip()
        if value:
            result.append({**record, 'chunk_index': len(result), 'text': value})
        start = end - CHUNK_OVERLAP if end < len(text) else end
    return result


def atomic_write(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    name = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent,
                                         delete=False) as file:
            name = file.name
            file.write(value)
        os.replace(name, path)
    finally:
        if name and os.path.exists(name):
            os.unlink(name)


def embed(records: list[dict[str, str | int]]) -> list[list[float]]:
    import torch.nn.functional as functional
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(MODEL, trust_remote_code=True)
    vectors = model.encode([TASK_PREFIX + str(record['text']) for record in records],
                           convert_to_tensor=True, show_progress_bar=True)
    vectors = functional.layer_norm(vectors, normalized_shape=(vectors.shape[1],))
    vectors = functional.normalize(vectors[:, :DIMENSIONS], p=2, dim=1)
    return vectors.cpu().tolist()


def run(args: argparse.Namespace) -> int:
    selected = args.collection or list(COLLECTIONS)
    invalid = set(selected) - set(COLLECTIONS)
    if invalid:
        raise ValueError(f'Nieznany katalog: {sorted(invalid)}')
    for collection in selected:
        records = [chunk for document in documents(collection, args.data) for chunk in chunks(document)]
        if not records:
            raise ValueError(f'Brak dokumentów do embeddingu: {collection}')
        if args.dry_run:
            print(f'{collection}: {len(records)} fragmentów; bez pobrania modelu')
            continue
        vectors = embed(records)
        rows = []
        for record, vector in zip(records, vectors):
            content = str(record['text'])
            rows.append(json.dumps({
                'id': digest(f"{record['id']}:{record['chunk_index']}:{digest(content)}"),
                'collection': collection, 'document_id': record['id'],
                'chunk_index': record['chunk_index'], 'path': record['path'],
                'title': record['title'], 'content': content, 'content_sha256': digest(content),
                'model': MODEL, 'task_prefix': 'search_document', 'dimensions': DIMENSIONS,
                'embedding': vector,
            }, ensure_ascii=False))
        target = args.output / f'{collection}.jsonl'
        atomic_write(target, '\n'.join(rows) + '\n')
        print(f'{collection}: zapisano {len(rows)} embeddingów w {target}')
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', type=Path, default=DATA)
    parser.add_argument('--output', type=Path, default=DATA / 'embeddings')
    parser.add_argument('--collection', action='append', choices=COLLECTIONS)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args(argv)
    try:
        return run(args)
    except Exception as error:
        print(f'Embedding przerwany: {type(error).__name__}', file=os.sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
