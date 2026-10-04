# Małopolska bez granic (MBG)

MBG, wcześniej HUBMI, to polskojęzyczny projekt hackathonowy łączący potrzeby mieszkańców Małopolski z istniejącymi innowacjami społecznymi. Użytkownik opisuje problem, potwierdza jego przypisanie do potrzeby i otrzymuje propozycje rozwiązań ze źródłami. Może również zgłosić pomysł, poprzeć propozycję lub uczestniczyć w pilotażu.

Repozytorium zawiera działający frontend z API, backend aplikacyjny, warstwę AI oraz narzędzia pozyskiwania danych. Dane demonstracyjne są syntetyczne. To prototyp, nie system gotowy do obsługi wrażliwych danych produkcyjnych.

## Implementacja

| Część | Technologia i odpowiedzialność |
| --- | --- |
| [Frontend](frontend/front) | React 19, TypeScript, Vite; interfejs mieszkańca i administratora, formularze, katalog, mapa, wizualizacja dopasowań. |
| [Backend](backend/app) | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic; konta, sesje, uprawnienia, zgłoszenia, grupowanie, głosy, moderacja, pilotaże i zasoby. |
| [AI aplikacji](backend/app/src/adapters) | Wymienialny gateway: deterministyczny tryb `fake` do rozwoju/testów oraz `ollama` na obecnym serwerze. |
| [Niezależny pakiet AI](backend/ai) | Python 3.14+, lokalne embeddingi Nomic z Hugging Face i klient Gemini; adapter repozytorium dostarcza aplikacja. |
| [Pozyskiwanie danych](backend/scrap) | Scrapy, normalizacja opisów ROPS, generowanie embeddingów i import do PostgreSQL. |
| [Dane](backend/data) | Opisy innowacji, źródła problemów, syntetyczne zgłoszenia, wektory JSONL i zrzut tabel embeddingów. |

Frontend komunikuje się z REST API pod `/api/v1`. Kontrakt znajduje się w [backend/app/contracts](backend/app/contracts). Mapa geograficzna używa Leaflet i kafelków Esri; widok semantyczny pokazuje przybliżoną bliskość rozwiązań, a nie ich lokalizację.

Podstawowy przepływ: opis i lokalizacja → sugestie klasyfikacji → korekta użytkownika → potwierdzenie istniejącej albo utworzenie nowej potrzeby → maksymalnie 10 trafnych innowacji. Wynik może być pusty. Źródło, ograniczenia i propozycja AI nie są dowodem skuteczności rozwiązania.

Są dwie role: użytkownik i administrator. Instytucje korzystają z roli użytkownika i ścieżki adaptacji innowacji. Landing jest publiczny; funkcje aplikacji wymagają logowania. Pomysły przechodzą przetwarzanie AI, potwierdzenie autora i moderację. Awaria AI pozostawia pomysł w kolejce.

Pilotaże mają etapy: szkic → przegląd → rekrutacja/zasoby → pilotaż → ewaluacja → upowszechnienie. Poparcie nie jest oceną satysfakcji ani zgodą na rozpoczęcie pilotażu. Zasoby i budżet są deklaracjami; projekt nie obsługuje płatności ani powiadamiania służb.

## Uruchomienie lokalne

Wymagania: Git, Node.js zgodny z Vite 8 (np. Node 24), npm i Python 3.11+. Szybki start korzysta z SQLite i trybu AI `fake`, więc nie wymaga GPU ani kluczy usług zewnętrznych. Polecenia poniżej zakładają terminal POSIX.

```bash
git clone https://github.com/Jabrocki/hubmi.git
cd hubmi/backend/app
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
export DATABASE_URL="sqlite:///./hubmi.db"
export AI_PROVIDER="fake"
export ENVIRONMENT="development"
uvicorn src.main:app --reload --port 8000
```

Przy starcie API tworzy tabele i dane demonstracyjne. Otwórz [Swagger](http://localhost:8000/docs); [healthcheck](http://localhost:8000/healthz) sprawdza odpowiedź procesu API, nie jakość AI ani pełną gotowość bazy.

W drugim terminalu, z katalogu repozytorium:

```bash
cd frontend/front
npm ci
npm run dev
```

Otwórz [frontend](http://localhost:5173) i utwórz konto formularzem rejestracji. Vite przekazuje `/api` do `http://127.0.0.1:8000`. Opcjonalne konto administratora konfiguruje się przez `TEST_ADMIN_EMAIL` i `TEST_ADMIN_PASSWORD` przed startem backendu; danych dostępowych nie zapisuj w repozytorium.

### PostgreSQL i konfiguracja

Ustawienia backendu są w [config.py](backend/app/src/config.py); aplikacja czyta też `.env` w katalogu roboczym. Aby użyć istniejącej bazy PostgreSQL, ustaw własny adres i zastosuj migracje:

```bash
cd backend/app
source .venv/bin/activate
export DATABASE_URL="postgresql+psycopg://USER:PASSWORD@localhost:5432/hubmi"
alembic upgrade head
python -m src.scripts.backfill_geo_locations
uvicorn src.main:app --reload --port 8000
```

Baza musi już istnieć. Backfill lokalizacji jest idempotentny; nierozpoznana miejscowość innowacji nie jest zastępowana fikcyjnym punktem na mapie.

Najważniejsze ustawienia:

| Zmienna | Znaczenie |
| --- | --- |
| `DATABASE_URL` | Adres SQLite lub PostgreSQL aplikacji. |
| `SECRET_KEY` | Sekret podpisywania sesji; zmień wartość deweloperską przed wdrożeniem. |
| `AI_PROVIDER` | `fake` lokalnie albo `ollama` przy uruchomionym serwerze modeli. |
| `OLLAMA_BASE_URL` | Domyślnie `http://127.0.0.1:11434`. |
| `OLLAMA_CHAT_MODEL` | Domyślnie `hubmi-synthetic`; model musi być dostępny w Ollamie. |
| `OLLAMA_EMBEDDING_MODEL` | Domyślnie `nomic-embed-text`. |
| `OLLAMA_INNOVATIONS_INDEX` | Domyślnie `../data/embeddings/innovations.jsonl`, względem katalogu backendu. |
| `VITE_API_BASE_URL` | Adres API używany przy budowaniu frontendu dla zdalnego serwera. |
| `VITE_MAP_TILE_URL`, `VITE_MAP_ATTRIBUTION` | Opcjonalny dostawca kafelków i przypisanie źródła mapy. |
| `REPORT_EXPIRY_DAYS` | Konfiguracja retencji, domyślnie 30 dni; nie zastępuje audytu usuwania danych. |
| `SMTP_*`, `FRONTEND_BASE_URL` | Konfiguracja poczty i odnośników do resetowania hasła. |

## Obecny serwer i wdrożenie

Frontend: [179.255.106.231:26260](http://179.255.106.231:26260). API: [179.255.106.231:26224/api/v1](http://179.255.106.231:26224/api/v1). Dostęp administracyjny: `ssh hackyeah`. Adresy i porty dotyczą obecnej instancji.

Aktualizacja samego frontendu z katalogu repozytorium:

```bash
git switch main
git pull --ff-only origin main
cd frontend/front
npm ci
bash scripts/deploy-server.sh
```

Skrypt wykonuje testy, lint i build, wysyła pliki do `/root/hubmi/frontend/front`, zachowuje kopię poprzedniej wersji, publikuje `index.html` na końcu i restartuje `hubmi-frontend` w Supervisorze. Weryfikuje identyfikator `/release.json` i odpowiedź API `/healthz`. Nie tworzy nowej instancji ani nie aktualizuje backendu lub bazy.

Inny cel wdrożenia można ustawić zmiennymi `MBG_SSH_TARGET`, `MBG_REMOTE_FRONTEND` i `VITE_API_BASE_URL`. Szablon procesu jest w [hubmi-frontend.supervisor.conf](frontend/front/scripts/hubmi-frontend.supervisor.conf).

```bash
ssh hackyeah supervisorctl status hubmi-frontend
ssh hackyeah supervisorctl restart hubmi-frontend
```

Po wdrożeniu sprawdź w przeglądarce logowanie, zgłoszenie, mapę i katalog. Lista potrzeb obok mapy przewija się niezależnie na desktopie; ilustracje kart innowacji mają ograniczoną szerokość.

Cofnięcie wdrożenia skryptu: przywróć `dist/index.html` z wypisanego katalogu `ui-backup-<data>-<commit>`, najpierw do pliku tymczasowego, następnie atomowym `mv`. Skrypt zachowuje starsze hashowane zasoby. Backup na tej samej instancji nie zastępuje niezależnego backupu bazy.

Podgląd lokalnego builda z API serwera:

```bash
cd frontend/front
VITE_API_BASE_URL=http://179.255.106.231:26224/api/v1 npm run build
npm run preview
```

## Dane i AI

Biblioteka pochodzi z [ROPS](https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie). Scraper zapisuje opis, metadane YAML, kategorie, datę pobrania i odnośniki. Nie pobiera automatycznie filmów, ZIP-ów i materiałów pod linkami; aktualizacja zachowuje wcześniej poprawnie zapisane wpisy.

```bash
cd backend/scrap
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scrape.py --all --output ../data/innovations
python -m unittest discover -s tests -v
```

Zamiast `--all` można podać `--url URL`; tryby wykluczają się. Scraper respektuje `robots.txt`, ogranicza zapytania i zwraca błąd również przy częściowym niepowodzeniu.

`backend/data/problems` zawiera źródła i szkice, a `submissions` syntetyczne scenariusze. Persony nie są prawdziwymi zgłoszeniami ani statystyką. [Przegląd źródeł](backend/data/problems/SOURCES_REVIEW.md) zachowuje kwalifikację regionalną i lata badań. Materiał ogólnopolski nie staje się materiałem Małopolski przez sam fakt publikacji przez ROPS. Szkice AI wymagają przeglądu.

Embeddingi JSONL zawierają stabilne ID, ścieżkę, tekst, hash, model i wektor. Importowane i wyszukiwane wektory muszą mieć zgodny model i wymiar. Pipeline Hugging Face używa `nomic-ai/nomic-embed-text-v1.5`, prefiksu `search_document` i 512 wymiarów; nie mieszaj go automatycznie z innym modelem Ollamy.

Z katalogu `backend/app`, po instalacji zależności scrapera:

```bash
../scrap/.venv/bin/python ../scrap/embed_data.py
../scrap/.venv/bin/python ../scrap/load_embeddings_postgres.py --dry-run
../scrap/.venv/bin/python ../scrap/load_embeddings_postgres.py
```

Importer wymaga własnego `DATABASE_URL` w formacie `postgresql://USER:PASSWORD@localhost:5432/hubmi` (bez sufiksu SQLAlchemy `+psycopg`) oraz obsługi pgvector. Przed importem zastosuj [migrację magazynu](backend/prisma/migrations/20261003180000_add_embedding_store/migration.sql), która tworzy osobne tabele `embedding_documents` i `embedding_chunks`. Opcjonalny zrzut [embedding_store.sql](backend/data/database/embedding_store.sql) można załadować przez `psql "$DATABASE_URL" -f backend/data/database/embedding_store.sql` z katalogu repozytorium. To nie jest zrzut kont ani całej bazy aplikacji.

Niezależny pakiet AI jest opcjonalny dla szybkiego startu; wymaga Python 3.14 oraz osobnego środowiska:

```bash
cd backend/ai
python3.14 -m venv .venv
source .venv/bin/activate
pip install -e .
pip install pytest
export GEMINI_API_KEY="WŁASNY_KLUCZ"
PYTHONPATH=src python -m pytest tests
```

Pakiet usuwa wybrane identyfikatory przed wywołaniem Gemini. Sama anonimizacja nie gwarantuje prywatności wszystkich kombinacji lokalizacji i opisów. Klucze i rzeczywiste dane osobowe nie powinny trafiać do wersjonowanych danych.

## Weryfikacja

Frontend, z `frontend/front`:

```bash
npm run test:unit
npm run lint
npm run build
```

Backend, z `backend/app` i aktywnym środowiskiem:

```bash
python -m pytest tests
```

Testy AI i scrapera są opisane wyżej. [Przypadki retrieval](backend/ai/evaluation/retrieval_cases.md) sprawdzają dopasowanie tematu, zakres regionalny, pusty wynik i deduplikację. Testy offline nie dowodzą jakości inferencji na działającym modelu.

Dowody wcześniejszych kontroli UI są w [docs/audyt-serwera](docs/audyt-serwera) oraz JSON-ach i zrzutach w [mockups](frontend/front/mockups). Historyczne makiety i ich liczby nie opisują aktualnego stanu bazy.

## Interfejs, materiały i ograniczenia

Interfejs jest po polsku: biały dashboard, płaskie zielone akcje, granatowy tekst, neutralne obramowania i lokalne ilustracje. Fonty: Bricolage Grotesque i IBM Plex Sans. Logo krajobrazowe pochodzi od właściciela; ilustracje nie przedstawiają prawdziwych uczestników ani udokumentowanych efektów projektu. Zachowuj etykiety, obsługę klawiatury, alternatywną listę dla grafu i `prefers-reduced-motion`.

Animacje landingu pochodzą z [React Bits](https://github.com/DavidHDev/react-bits): AnimatedContent (GSAP) i CountUp (Motion), z lokalnymi poprawkami dostępności i cleanup. [Licencja komponentów](frontend/front/src/components/react-bits/LICENSE.md) pozostaje przy kodzie. Ikony Phosphor regular mają [licencję MIT](frontend/front/public/brand/Phosphor-LICENSE.txt); sprite odtwarza `npm run icons:build`.

Przed użyciem produkcyjnym potrzebne są HTTPS (obecny serwer używa HTTP), przegląd sekretów i CORS, niezależny backup, weryfikacja uprawnień, retencji oraz dostępności. WCAG 2.1 AA jest celem, nie potwierdzonym certyfikatem. Nie ma generatora wniosków grantowych, płatności, weryfikacji tożsamości przez mObywatel ani integracji służb.

Historyczny kosztorys z 4 października 2026 szacował odtworzenie zakresu na 120–240 godzin przy 200 zł/h (24–48 tys. zł), a utrzymanie instancji na 1,95605 USD/h. Są to zapisane założenia i historyczny odczyt, nie aktualna oferta ani gwarancja kosztu. Materiał pomiarowy pozostaje w [instance-cost.json](docs/audyt-serwera/instance-cost.json).

Ten README zastępuje osobne instrukcje modułów, dokumenty produktu, plany i opisy mockupów. Pozostałe pliki Markdown to dane wejściowe, kwalifikacja źródeł, przypadki ewaluacji, licencja oraz instrukcje dla agentów.
