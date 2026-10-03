# Małopolska bez granic (MBG): instrukcje dla przyszłych mockupów i frontendu

Aktualna marka: **Małopolska bez granic**, skrót **MBG**. Aktualny kierunek: `mockups/mbg-v4/README.md`, `mockups/mbg-v4/brief.md`, root DESIGN.md oraz `src/index.css` i nowsze reguły `src/Civic.css`. Landing odtwarza kompozycję pierwszego kadru planszy właściciela. Rysunkowy świat bez zdjęć prawdziwych ludzi, biały dashboard, boczna nawigacja i pastelowe skróty. Dostarczone logo krajobrazowe (`public/brand/mbg-landscape.webp`, oryginalny PNG obok) zastępuje wcześniejszy znak SVG. Nie zmieniaj artworku właściciela bez polecenia. Bricolage Grotesque + IBM Plex Sans pozostają. Dawne wersje nie zastępują tego kierunku.

## Kontekst i zakres

Przed planowaniem lub zmianą UI przeczytaj główny `../../README.md`, `../../PLAN_IMPLEMENTACJI.md`, `../../tasks.md` i lokalny `FRONTEND_KIERUNEK.md`.

README opisuje aktualny produkt. PLAN_IMPLEMENTACJI rozstrzyga wykryte rozbieżności i proponuje strony, stany oraz kolejność. Kierunek frontendu jest źródłem estetyki tylko w zakresie zgodnym z README. Adresy i narzędzia z planu są propozycjami, nie istniejącymi interfejsami. Nowe polecenia użytkownika mają pierwszeństwo.

- Interfejs po polsku; React + TypeScript + Vite. Sprawdź `package.json` przed proponowaniem/importowaniem zależności.
- Dwie role i dwa syntetyczne konta: użytkownik oraz administrator. Adaptacja dla instytucji działa w roli użytkownika.
- Wszystkie funkcje aplikacji wymagają sesji. Uprawnienia i publiczna/anonimowa projekcja danych są egzekwowane na backendzie. Aktualne polecenie właściciela z 3 października 2026 dodaje informacyjny landing jako wizytówkę inicjatywy przed logowaniem; nie udostępnia prywatnych spraw ani katalogu bez sesji.
- Pierwszy kompletny przepływ: opis/lokalizacja → korekta kategorii → jawne potwierdzenie potrzeby lub nowa potrzeba → maksymalnie 10 trafnych istniejących innowacji, źródła, ograniczenia, lista i semantyczne 3D.
- Mapa geograficzna nie jest wizualizacją semantyczną. Promień odkrywania nie zmienia grupowania; liczba zgłaszających oznacza unikalne osoby.
- Pomysł: AI → potwierdzenie autora → administrator → publikacja. Awaria AI oznacza kolejkę, bez omijania tego przepływu.
- `Popieram` / `Pomijam` i cofnięcie; poparcie nie oznacza satysfakcji ani decyzji o pilotażu.
- Finansowanie to deklaracje zasobów/budżetu. Bez płatności, zbiórek i symulowanych przelewów.
- Nie dodawaj roli urzędnika, profili gmin/CRM partnerów, mentora, skanów dokumentów, Kanbanu lub publicznego katalogu na podstawie starszego kierunku.

## Skille wskazane przez użytkownika

Przy projektowaniu przyszłych mockupów stosuj dostępne skille i przeczytaj ich aktualne SKILL.md:

1. **Impeccable**: https://github.com/pbakaus/impeccable. Kontekst, hierarchia, stany, accessibility, krytyka i dopracowanie. Aplikacja/panel działają w trybie Operate; objaśnienia i źródła w Read.
2. **UI UX Pro Max**: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill. Sprawdzaj odpowiednie wzorce nawigacji, formularzy, dotyku i dostępności; wyszukuj pod realny React/Vite. Nie nadpisuj briefu automatyczną paletą/fontem/layoutem z wyszukiwarki.
3. **Taste / design-taste-frontend**: https://github.com/leonxlnx/taste-skill. Stosuj w zakresie zgodnym z aktualnym skillem, szczególnie do ekranów wprowadzających, kompozycji i antygenerycznych detali. Jego reguł landing page nie narzucaj dashboardom, tabelom i wielokrokowym formularzom.

Skille są pomocą projektową. Zachowanie produktu i jawnie ustalona estetyka mają pierwszeństwo przed ich domyślnymi wartościami, frameworkami, animacjami lub zaleceniami zmieniającymi zakres. Nie wymagaj ponownego potwierdzania decyzji już ustalonych przez użytkownika. Nie instaluj/aktualizuj skillów bez potrzeby.

## System wizualny

Aktualny kierunek i podglądy: `mockups/mbg-v4/README.md` oraz `../../DESIGN.md`. Użytkownik wskazał minimalistyczny wygląd, inspirację Government Service Website for Award Management, 21st.dev i React Bits, a następnie regionalną planszę dziewięciu ekranów. Zakazał gradientów na przyciskach. Fonty to Bricolage Grotesque (nagłówki) i IBM Plex Sans (tekst), oba lokalne. Przyciski: jednolity kolor, bez gradientu, połysku lub shimmeru. Landing działa w trybie Persuade; start po zalogowaniu w Operate.

Obowiązujące tokeny z `src/index.css`: białe tło i powierzchnie `#FFFFFF`, tekst `#0C2941`, primary `#00834A`, szałwia `#E0F3DF`, akcent `#A8492F`, neutralne obramowania `#E1E5E3`, fokus `#1E40AF`. Promienie, typografię i responsywność bierz z kodu oraz DESIGN.md.

Jedna rodzina ikon i jeden zestaw prymitywów UI. Główne działanie czytelne w pierwszym widoku, proste formularze, spokojne kolejki. Proponowane parametry mockupów: variance 3, motion 2, density 4 dla użytkownika; admin density 6. Nie są blokadą poleceń użytkownika ani ustawieniem biblioteki animacji.

## Mockupy i weryfikacja

- Zacznij od M1 z planu, nie od galerii dashboardów. Przed ekranem określ rolę, URL, główne działanie, dane, źródła i stany.
- Każda seria: desktop i telefon, polskie realistyczne teksty, ładowanie/pusto/błąd/retry oraz krytyczne stany domenowe. Dane osobowe/zgłoszenia demo są syntetyczne i oznaczone.
- Fixtures zgodne z kontraktem są narzędziem rozwoju; finalne działanie wymaga realnego API. Obraz mockupu nie dowodzi działania ani dostępności.
- WCAG 2.1 AA jako cel, bez deklaracji zgodności przed audytem. Etykiety, fokus, klawiatura, kontrast, reflow, reduced motion, projektowe cele dotykowe 44 × 44 px. Lista alternatywna dla 3D, ręczny wybór lokalizacji, przyciski zamiast konieczności gestu.
- Nie wymyślaj efektów społecznych, kosztów, afiliacji i danych źródłowych. „Brak danych” różni się od zera; szacunek AI, deklaracja i zatwierdzenie są odrębne.
- Wykonaj zbiorczą inspekcję desktop/telefon, popraw wykryte problemy w partii i potwierdź jedną dodatkową rundą; unikaj nieograniczonych pętli dopracowywania.
- Obecny zestaw jest interaktywnym prototypem React z atlasem, statycznymi screenshotami oraz rzeczywistymi komponentami React Bits na landingu (Animated Content i Count Up, osobny lazy chunk, reduced-motion); rozwijaj go według aktualnego polecenia użytkownika i workflow skilla.

Cały frontend, także administrator, należy do Osoby 1 w podziale `tasks.md`. Osoba 2 publikuje kontrakt HTTP i migracje, Osoba 3 kontrakt AI. Nie implementuj biznesowych bramek publikacji, uprawnień i gotowości pilotażu wyłącznie w UI.
