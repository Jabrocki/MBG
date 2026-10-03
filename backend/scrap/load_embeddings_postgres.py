"""Załaduj lokalne embeddingi JSONL do PostgreSQL z rozszerzeniem pgvector."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
DIMENSIONS = 512


def identifier(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def rows(directory: Path):
    for path in sorted(directory.glob("*.jsonl")):
        for line in path.read_text(encoding="utf-8").splitlines():
            row = json.loads(line)
            if row.get("dimensions") != DIMENSIONS or len(row.get("embedding", [])) != DIMENSIONS:
                raise ValueError(f"Nieprawidłowy wymiar w {path.name}")
            yield row


def vector(values: list[float]) -> str:
    return "[" + ",".join(format(value, ".8g") for value in values) + "]"


def load(directory: Path, dry_run: bool) -> int:
    records = list(rows(directory))
    if dry_run:
        print(f"Zweryfikowano {len(records)} embeddingów; bez połączenia z PostgreSQL")
        return 0
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise ValueError("Brak DATABASE_URL")
    # Prisma uses `schema=public` in DATABASE_URL; libpq/psycopg does not
    # recognize that query parameter and PostgreSQL defaults to public here.
    url = url.split("?schema=", 1)[0]
    import psycopg
    documents: dict[str, dict] = {}
    for row in records:
        # This identifier stays stable when a source file changes, so each run
        # replaces its chunks instead of accumulating stale vectors.
        document_id = identifier(f'{row["collection"]}:{row["path"]}')
        documents[document_id] = {**row, "database_document_id": document_id}
    with psycopg.connect(url) as connection, connection.cursor() as cursor:
        for row in documents.values():
            cursor.execute(
                '''INSERT INTO embedding_documents
                   (id, collection, source_path, title, content_hash, model, task_prefix, dimensions, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, now())
                   ON CONFLICT (id) DO UPDATE SET
                     collection = EXCLUDED.collection, source_path = EXCLUDED.source_path,
                     title = EXCLUDED.title, content_hash = EXCLUDED.content_hash, model = EXCLUDED.model,
                     task_prefix = EXCLUDED.task_prefix, dimensions = EXCLUDED.dimensions, updated_at = now()''',
                (row["database_document_id"], row["collection"], row["path"], row["title"],
                 row["content_sha256"], row["model"], row["task_prefix"], row["dimensions"]),
            )
        cursor.execute(
            "DELETE FROM embedding_chunks WHERE document_id = ANY(%s)",
            (list(documents),),
        )
        for row in records:
            document_id = identifier(f'{row["collection"]}:{row["path"]}')
            cursor.execute(
                '''INSERT INTO embedding_chunks
                   (id, document_id, chunk_index, content, content_hash, embedding)
                   VALUES (%s, %s, %s, %s, %s, %s::vector)
                   ON CONFLICT (document_id, chunk_index, content_hash) DO UPDATE SET
                     content = EXCLUDED.content, embedding = EXCLUDED.embedding''',
                (row["id"], document_id, row["chunk_index"], row["content"], row["content_sha256"], vector(row["embedding"])),
            )
    print(f"Załadowano {len(records)} embeddingów do PostgreSQL")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DATA / "embeddings")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    try:
        return load(args.input, args.dry_run)
    except Exception as error:
        print(f"Import PostgreSQL przerwany: {type(error).__name__}", file=os.sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
