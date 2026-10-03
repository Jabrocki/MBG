# Wersjonowany zrzut danych embeddingów

Plik `embedding_store.sql` zawiera wyłącznie dane z tabel `embedding_documents` i
`embedding_chunks`. Nie zawiera haseł, użytkowników PostgreSQL ani lokalnych
ustawień środowiska.

Najpierw zastosuj migrację `backend/prisma/migrations/20261003180000_add_embedding_store/migration.sql`, a następnie zaimportuj zrzut:

```bash
psql "$DATABASE_URL" -f backend/data/database/embedding_store.sql
```

Zrzut można wygenerować ponownie przez `pg_dump --data-only` po uruchomieniu
skryptu `backend/scrap/load_embeddings_postgres.py`.
