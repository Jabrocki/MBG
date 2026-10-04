# HUBMI — Backend Aplikacyjny i Przepływy Pracy (Osoba 2)

Katalog `backend/app` zawiera aplikację backendową HUBMI napisaną w Pythonie (FastAPI + SQLAlchemy 2 + Alembic), odpowiedzialną za:
- Publiczne API HTTP oraz schemat OpenAPI (`contracts/openapi.yaml`, `contracts/openapi.json`)
- Obsługę bazy danych relacyjnych PostgreSQL oraz migracji Alembic (`migrations/`)
- Demo autoryzację i uprawnienia (`user` vs `admin`) oraz anonimizację zgłoszeń
- Zgłaszanie problemów, walidację zasięgu geograficznego (Małopolska), obsługę przypadków pilnych
- Grupowanie problemów z unikalnym zliczaniem zgłaszających
- Wyszukiwanie i rekomendacje innowacji społecznych wraz ze współrzędnymi 3D
- Panel zarządzania pomysłami z asynchroniczną kolejką AI i bramkami publikacji
- Społecznościowe karty swipe do głosowania (Popieram / Pomijam)
- Zarządzanie cyklem życia pilotaży i wolontariatem z ochroną przed wyścigami
- Panel administracyjny: scalanie/dzielenie problemów i duplikatów rozwiązań

---

## 1. Wymagania wstępne

- Python >= 3.11 (zweryfikowano z Python 3.14)
- PostgreSQL (dla środowiska produkcyjnego / deweloperskiego)

---

## 2. Instalacja i konfiguracja

Utwórz wirtualne środowisko i zainstaluj zależności:

```bash
cd backend/app
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Skonfiguruj plik `.env` na podstawie szablonu:

```bash
DATABASE_URL="postgresql+psycopg://kajetanserwecinski@localhost:5432/hubmi"
ENVIRONMENT="development"
REPORT_EXPIRY_DAYS=30
```

---

## 3. Migracje bazy danych

Wszystkie migracje bazy danych w projekcie są zarządzane przez Osobę 2 w folderze `backend/app/migrations`:

```bash
# Wykonanie migracji
alembic upgrade head

# Utworzenie nowej migracji
alembic revision -m "nazwa_migracji"
```

---

## 4. Uruchomienie serwera deweloperskiego

```bash
uvicorn src.main:app --reload --port 8000
```

Dokumentacja interaktywna API:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Kontrakt OpenAPI: `contracts/openapi.yaml` oraz `contracts/openapi.json`

---

## 5. Uruchomienie testów jednostkowych i integracyjnych

Zgodnie z `tasks.md`, testy backendu uruchamia się w pełni offline z wykorzystaniem deterministycznego Fake AI Gateway:

```bash
python -m pytest tests
```

## 6. Integracja embeddingów

`VectorRepositoryAdapter` udostępnia kontrakt `search(collection, vector, limit)` używany
przez `backend/ai`. Kolekcje `problems` i `innovations` są mapowane odpowiednio na
rekordy problemów i rozwiązań w `problem_vector_records`. Produkcyjny model Nomic
używa znormalizowanych wektorów 512-wymiarowych; fake gateway zachowuje ten sam
wymiar, dzięki czemu przepływ można testować bez pobierania modelu.

Weryfikacja lokalnych embeddingów i ich wymiarów:

```bash
../scrap/.venv/bin/python ../scrap/load_embeddings_postgres.py --dry-run
```

## 7. Trwałe lokalizacje geograficzne

Tabela `entity_geo_locations` jest zgodną wstecz projekcją WGS84 dla raportów,
problemów kanonicznych, innowacji oraz pilotaży. Nie zmienia istniejących tabel.
Raporty i problemy kopiują zwalidowane współrzędne, a dla innowacji i pilotaży punkt
powstaje wyłącznie po rozpoznaniu konkretnej miejscowości Małopolski w zapisanym
źródle lub opisie. Brak rozpoznanej miejscowości oznacza brak punktu — aplikacja nie
umieszcza takich rekordów w środku województwa.

Na wdrożeniu zarządzanym migracjami wykonaj przed uruchomieniem aplikacji:

```bash
alembic upgrade head
python -m src.scripts.backfill_geo_locations
```

Na istniejącym wdrożeniu uruchamianym przez `Base.metadata.create_all` wystarczy
bezpieczna, idempotentna komenda (utworzy tylko nową tabelę, a następnie wykona
backfill):

```bash
PYTHONPATH=/root/hubmi/backend/app \
DATABASE_URL=sqlite:////root/hubmi/hubmi.db \
/venv/main/bin/python -m src.scripts.backfill_geo_locations
```

Backfill uruchamia się również przy starcie API. Wynik komendy podaje liczbę rekordów
`created`, `updated`, `unchanged` i `skipped` dla każdego typu encji.
