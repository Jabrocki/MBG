# Małopolska bez granic — pełny zestaw mockupów

> Aktualny kierunek: [mbg-v4](../mbg-v4/README.md). Poniższy opis stylu i fotografii dokumentuje wcześniejszą wersję. Galeria, screenshoty i raporty w tym katalogu zostały odświeżone do obecnego rysunkowego frontendu. Aktywny interfejs nie używa zdjęć Pexels ani dawnego znaku SVG.

Interaktywny prototyp React/TypeScript/Vite: **44 strony i podstrony z planu + ekran marki = 45 widoków**, dodatkowo atlas `/mockupy`. Każdy widok ma układ komputerowy i mobilny. Wersja zastępuje kierunek wizualny wcześniejszych obrazów, które zachowano jako historię.

## Oglądanie

- `npm install` i `npm run dev` w `frontend/front`; Vite poda adres i dostępny port.
- `/` — landing; `/logowanie` — wybór konta demo; `/mockupy` — atlas z prawdziwymi podglądami; `/marka` — logo, paleta i pobieranie SVG.
- [Galeria lokalna](index.html) działa też bez uruchomienia React. Kliknięcie obrazu otwiera pełny screenshot. Folder `screenshots` zawiera 90 podstawowych PNG i dodatkowe stany.
- Narzędzie „Mockupy” pozwala przełączyć rolę / stan podglądu. Jest elementem przeglądu projektu, nie planowaną funkcją aplikacji dla mieszkańców.

## Co obejmuje

Wejście i Start; cały przepływ zgłoszenia (opis, miejsce, korekta kategorii, jawne powiązanie lub nowa potrzeba, wyniki, historia i szczegóły); katalog i karty źródłowe; potrzeby, najczęstsze potrzeby i szczegóły; formularz i rozmowa asystenta; szkice, publikacja oraz dyskusja; poparcie i cofnięcie; adaptacja i wynik; lista pilotaży, szczegóły, zasoby, udział, kolejka, oferta miejsca i ewaluacja; powiadomienia i moje aktywności; pomoc, prywatność i dostępność.

Administrator: przegląd, kolejki i szczegóły zgłoszeń, grupowanie potrzeb z podglądem skutków, baza wiedzy i redakcja, duplikaty, kolejka i ocena pomysłów, lista i prowadzenie pilotaży, budżet, uczestnicy oraz bramki gotowości. Wszystkie planowane adresy mają reprezentatywną instancję danych; to nie zestaw kart zmieniających tylko tytuł.

Atlas zawiera także wejścia do stanów: ładowanie, pusta lista, błąd i retry, brak AI, oczekiwanie na autora, prywatna kolejka, brak wyników, brak wizualizacji, miejsce poza regionem, pilna sprawa z symulacją skierowania, oferta miejsca i blokada startu.

## Kierunek

Silna inspiracja dostarczoną przez właściciela planszą: boczna nawigacja, pastelowe skróty, regionalna ilustracja i przyjazne formularze. Minimalistyczny landing, duże nagłówki Bricolage Grotesque, tekst IBM Plex Sans, szałwia / ciepła biel / leśna zieleń. Oba fonty z polskimi znakami są lokalnie hostowane. Przyciski nie mają gradientów. Ikony pochodzą z jednej rodziny Phosphor.

Znak MBG jest autorską geometrią dwóch otwartych przęseł: litera M, wzgórza i łączenie ponad barierami. Logotyp SVG zawiera litery zamienione na krzywe. Pliki `public/brand`: wersja podstawowa, jasna, jednobarwna, monogram oraz same znaki; dodatkowo przezroczysty PNG. Nie wykonano analizy dostępności znaku towarowego.

Zastosowane skille: [Impeccable](https://github.com/pbakaus/impeccable), [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), [Taste](https://github.com/leonxlnx/taste-skill). 21st.dev / React Bits i Dribbble są inspiracjami kompozycji, nie zainstalowanymi bibliotekami. Implementacja używa natywnego CSS i React. Lokalny brief: [brief.md](brief.md).

## Źródła i granice

- Karty BaWita, Bajkala i Agencja pracy incydentalnej: opisy skrócone z odpowiednich `backend/data/*.md`, z linkami do ROPS i jawnymi ograniczeniami. Nie przypisujemy im wymyślonych kosztów ani procentów skuteczności.
- Fotografia seniorek: [Centre for Ageing Better / Pexels](https://www.pexels.com/photo/women-planting-plants-on-the-garden-7849457/). Fotografia wspólnego ogrodnictwa: [cottonbro studio / Pexels](https://www.pexels.com/photo/a-group-of-people-engaged-in-gardening-9725378/). Fotografie ilustracyjne nie przedstawiają uczestników ani osiągnięć MBG. Są ładowane z zewnętrznej domeny; [licencja Pexels](https://www.pexels.com/license/).
- Regionalna ilustracja: wygenerowany autorski asset inspirowany planszą właściciela; [pełny prompt](illustration-prompt.txt), oryginał PNG i zoptymalizowany WebP. Nie jest zdjęciem rzeczywistej inicjatywy.
- Konta, lokalizacje zgłoszeń, osoby, kwoty, głosy i pilotaże są syntetyczne. Zachowanie zapisów jest lokalne, część szkiców przechowuje `sessionStorage`. Tylko dane przykładowe.
- Nie ma integracji z API, AI, bazą danych, autoryzacją, płatnościami, geokoderem, służbami ani powiadomieniami zewnętrznymi. Mapa jest podpisanym schematem; 3D jest syntetyczną projekcją CSS z listą alternatywną, nie wynikiem embeddingów. Bramki UI nie zastępują walidacji backendu.
- Otwarte decyzje README (skala satysfakcji, retencja, progi, głosy po scaleniu, kolejka) nadal pozostają otwarte. Pokazane wartości są przykładami, nie uzgodnieniem kontraktu. Nie zadeklarowano zgodności WCAG przed pełnym audytem.

## Weryfikacja i odtwarzanie

`npm run build`, `npm run lint`; dodatkowo przegląd Playwright. Raport: [verification.json](verification.json). Macierz 1440 × 1000 i 390 × 844; 45 ekranów, 90 przechwyceń. Full-page PNG zachowują stałe paski na wysokości viewportu; to sposób przechwycenia, dlatego przegląd jakości używa również 14 osobnych viewport PNG w `.impeccable/review`.

Końcowy przegląd: [finish-review.md](finish-review.md). Niezależny reviewer ocenił siedem wskazanych poprawek jako rozwiązane (`ship` w zakresie tej partii). Obejmuje to rozdzielenie szkicu od publikacji, dane adaptacji, filtry mapy, fokus i powiązania błędów, prawdziwy komunikat błędu, walidację budżetu oraz mobilny pasek narzędzi. [Dziewięć kontroli regresji](review-fixes-verification.json) odtwarza `node scripts/check-review-fixes.cjs`. Ocena nie jest pełnym audytem dostępności. Ponieważ brakowało dostarczonej definicji agenta finish-reviewer, oddzielny reviewer korzystał z instrukcji zastępczej Impeccable, z nowym kontekstem i bez przeglądarki.

System do dalszego rozwoju: [DESIGN.md](../../../../DESIGN.md) oraz `.impeccable/design.json` w katalogu głównym projektu. Wektorowe logo pozostaje głównym plikiem marki; miniatury atlasu są kadrami faktycznie wyrenderowanego prototypu i mają zapisane pochodzenie.

`node scripts/check-mockups.cjs` sprawdza brak błędów renderowania, overflow, brakujących obrazów i gradientów na przyciskach, oraz osiem istotnych przepływów. `node scripts/capture-review.cjs` odtwarza viewporty; `node scripts/build-gallery.cjs` buduje miniatury i lokalną galerię. Ustaw `MBG_PREVIEW_URL` dla innego portu. Skrypty używają zainstalowanego Playwright/Sharp albo bundla desktop; dla innego komputera ustaw `MBG_RUNTIME_MODULES` lub zainstaluj biblioteki. Dodatkowe instrukcje i końcowe ograniczenia znajdują się w raporcie przeglądu.

Odtworzenie krzywych logotypu jest opcjonalne: `python scripts/build-brand.py`, pakiety `fonttools[woff]` i fonty z `node_modules`. Zapisane SVG nie potrzebują Pythona w przeglądarce.
