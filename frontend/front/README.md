# MBG — frontend z API

React, TypeScript i Vite; baza tej wersji to aktualna integracja serwerowa. Logowanie, katalog, mapa, raporty i graf dopasowań korzystają z istniejącego API. Zmiany po audycie dodają szkic w sesji przypisany do konta, wspólny postęp, mobilne tabele, ilustracje, lazy loading oraz debounce wyszukiwania.

Rozwój: `npm ci`, `npm run dev`; backend na porcie 8000 według `../../backend/app/README.md`. Weryfikacja: `npm run test:unit`, `npm run lint`, `npm run build`. Ikony: `npm run icons:build` regeneruje oryginalne kształty Phosphor regular wraz z licencją.

[Instrukcja serwerowa](../../docs/URUCHOMIENIE_SERWER.md). Aktualizacja działającego serwera: `bash scripts/deploy-server.sh`. Nie używaj starszego lokalnego prototypu do nadpisania wersji z API.

[Audyt na serwerze](../../docs/audyt-serwera/AUDYT.md), [kosztorys](../../docs/KOSZTORYS.md). Sesyjny szkic nie zastępuje trwałego zapisu konta; po wysłaniu API odpowiada za zapis raportu. Widoczność autora wynika z istniejącego ustawienia konta; frontend nie obiecuje nieobsługiwanego przez API ustawienia pojedynczego raportu.
