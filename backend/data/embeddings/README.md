# Local Nomic embeddings

Ten katalog przechowuje odtwarzalne sidecary JSONL dla danych w `innovations`, `problems` i `submissions`.

Każdy wiersz zawiera stabilne ID fragmentu, ścieżkę, tekst i hash treści, model `nomic-ai/nomic-embed-text-v1.5`, prefiks zadania `search_document`, wymiar 512 i znormalizowany wektor. Nie jest to kontrakt bazy danych ani indeks osoby 2.

Generowanie lokalne:

```bash
../scrap/.venv/bin/python ../scrap/embed_data.py
```

Ładowanie do lokalnego PostgreSQL z `pgvector` (wymaga `DATABASE_URL` z
`backend/.env`):

```bash
set -a; source ../.env; set +a
../scrap/.venv/bin/python ../scrap/load_embeddings_postgres.py
```
