# Uruchomienie wersji serwerowej MBG

Wersja bazuje na `codex/integracja` i zachowuje istniejący backend, logowanie, mapę Esri, graf dopasowań oraz tytuły z Ollamy. Publiczny frontend: `http://179.255.106.231:26260`; obecne API: `http://179.255.106.231:26224/api/v1`. Adresy odpowiadają obecnemu mapowaniu portów instancji, po zmianie instancji trzeba je zaktualizować.

## Aktualizacja istniejącego serwera

Sklonuj repozytorium `https://github.com/Jabrocki/hubmi.git`, przejdź na branch `codex/integracja`, wejdź do `frontend/front`, wykonaj `npm ci`, a następnie `bash scripts/deploy-server.sh`; skrypt korzysta z istniejącego aliasu SSH `hackyeah`, uruchamia testy, lint i build z adresem obecnego API, przesyła frontend do `/root/hubmi/frontend/front`, zachowuje kopię poprzedniej wersji, publikuje `index.html` na końcu i sprawdza `/healthz`; po zakończeniu otwórz `http://179.255.106.231:26260/start` i zaloguj się istniejącym kontem, a identyfikator wdrożenia sprawdź pod `/release.json`. Backend i jego procesy pozostają istniejące; skrypt aktualizuje frontend na działającym serwerze, nie provisionuje nowego serwera GPU. Dla innych adresów ustaw `VITE_API_BASE_URL`, `MBG_SSH_TARGET` i `MBG_REMOTE_FRONTEND` przed uruchomieniem skryptu.

## Lokalny rozwój z API

Uruchom backend według `backend/app/README.md` na porcie 8000, potem w `frontend/front` wykonaj `npm ci` i `npm run dev`. Vite przekazuje `/api` do `http://127.0.0.1:8000`. Do podglądu produkcyjnego z obecnym zdalnym API zbuduj `VITE_API_BASE_URL=http://179.255.106.231:26224/api/v1 npm run build`, a następnie `npm run preview`. Ewentualne dodatkowe originy muszą być już dopuszczone w konfiguracji CORS backendu.

## Cofnięcie samego frontendu

Skrypt wypisuje katalog `ui-backup-<data>-<commit>`. Przy problemie przywróć z niego plik `dist/index.html` do `/root/hubmi/frontend/front/dist/index.html` (najpierw do pliku tymczasowego, następnie `mv`). Poprzednie hashowane zasoby pozostają dostępne w `dist/assets`. To nie jest cofnięcie danych ani operacji API.

Kopia wdrożenia znajduje się na tej samej instancji. Nie zastępuje niezależnego backupu bazy danych ani zabezpieczenia danych przed usunięciem instancji.
