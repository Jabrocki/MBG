# Małopolska bez granic (MBG): zmodyfikowany plan implementacji

Aktualizacja marki i mockupów: właściciel nadał nazwę **Małopolska bez granic (MBG)**. Pełny prototyp ekranów znajduje się w `frontend/front`, atlas pod `/mockupy`, logo pod `/marka`; dokumentacja zakresu w [mbg-v3](frontend/front/mockups/mbg-v3/README.md). Późniejsza inspiracja: plansza właściciela z boczną nawigacją, pastelowymi skrótami i regionalną ilustracją. To interaktywne mockupy, bez integracji backendu i AI.

Data analizy: 3 października 2026. Plan wykonawczy dla trzech osób, z analizą stron i zasadami przyszłych mockupów. Nie potwierdza wdrożenia funkcji. Lista zadań i odpowiedzialności: [tasks.md](tasks.md).

**Późniejsza aktualizacja kierunku strony głównej, 3 października 2026:** właściciel zamówił minimalistyczny landing jako wizytówkę inicjatywy, z inspiracją Dribbble/21st.dev/React Bits, bardziej charakterystyczną typografią i bez gradientów na przyciskach. [Mockupy i brief landing-v2](frontend/front/mockups/landing-v2/README.md) opisują tę informacyjną stronę przed logowaniem. Funkcje aplikacji nadal wymagają sesji; `/start` pozostaje pulpitem użytkownika. Ten nowszy brief ma pierwszeństwo przy projektowaniu landingu przed wcześniejszą propozycją przekierowania `/`.

## 1. Wnioski i hierarchia dokumentów

Podstawą zachowania produktu jest [README.md](README.md). [tasks.md](tasks.md) dobrze rozdziela frontend, backend aplikacyjny i AI, ale wymaga konkretnych ekranów, zależności i punktów integracji. [FRONTEND_KIERUNEK.md](frontend/front/FRONTEND_KIERUNEK.md) dostarcza spójnego języka wizualnego, lecz opisuje częściowo inny produkt: platformę obsługi gminnych wdrożeń, z dodatkową rolą urzędnika i crowdfundingiem.

Zmodyfikowany kierunek: **przyjazna aplikacja społeczna, w której użytkownik sam opisuje problem i otrzymuje istniejące rozwiązania; administrator moderuje i zatwierdza dalsze działania.** Lokalizacja pomaga dopasować potrzeby i rozwiązania, a nie zamyka produktu w sztywnym obiegu urzędowym.

Kolejność rozstrzygania rozbieżności:

1. Aktualne polecenia właściciela projektu.
2. Uzgodnione zachowania i ograniczenia w `README.md`.
3. Ten plan i `tasks.md` jako proponowana organizacja implementacji.
4. Kierunek frontendu w zakresie zgodnym z produktem.
5. Skille i katalogi komponentów jako narzędzia projektowe, bez prawa do zmiany zakresu produktu.

W tym zadaniu nie zmieniono `README.md` ani oryginalnego kierunku frontendu. Proponowane adresy, biblioteki, szczegóły kontraktu i reguły otwartych decyzji poniżej pozostają propozycjami implementacyjnymi.

### Stan repozytorium ustalony z plików

| Obszar | Obecny stan | Konsekwencja |
| --- | --- | --- |
| Frontend | `App.tsx` i CSS to ekran startowy Vite z licznikiem; React, TypeScript, Vite | Budujemy interfejs produktu od podstaw; szablon nie stanowi jego tożsamości wizualnej |
| Zależności frontendowe | React i React DOM; brak routera, bibliotek formularzy, map, 3D i komponentów UI | Żadnego z wymienionych komponentów nie traktujemy jako zainstalowanego |
| Komendy frontendowe | `dev`, `build`, `lint`, `preview`; brak `test:unit` i `test:e2e` | Test runner i skrypty trzeba dopiero dodać |
| Scraper | `backend/scrap`, testy offline i dokumentacja | Wykorzystujemy istniejący kod, bez przenoszenia katalogów |
| Dane | W `backend/data` jest 115 plików Markdown; zbadana karta BaWita zawiera metadane, kategorie, opis i źródłowe linki | Audytować pokrycie i jakość całego korpusu przed indeksowaniem; liczba plików nie dowodzi kompletności ani jakości indeksu |
| Materiały | Scraper zapisuje odnośniki, nie pobiera powiązanych PDF/ZIP/wideo i nie potwierdza ich dostępności | Rozszerzenie o tekst PDF/OCR jest osobnym zadaniem ingestion |
| Backend aplikacji i AI | Brak katalogów implementacji `backend/app`, `backend/ai`, `integration` w zbadanym drzewie | Schemat bazy, API, kolejka i usługi AI są pracą do wykonania |

Analiza repozytorium była odczytem kodu i dokumentacji. Nie uruchamiano aplikacji, modeli, scrapowania ani testów funkcjonalnych.

## 2. Korekty kierunku frontendu

| Kierunek frontendu | Aktualny produkt z README | Zmiana w implementacji |
| --- | --- | --- |
| Mieszkaniec, urzędnik, admin | Dwie role: użytkownik i administrator | Dwa konta demo; usunąć osobną przestrzeń `/urzednik` z planowanego zakresu |
| Decyzja urzędnika przed dopasowaniem | Użytkownik otrzymuje propozycje rozwiązań po zgłoszeniu i potwierdzeniu grupowania | Administrator nie blokuje pierwszego dopasowania; nowe potrzeby są widoczne od razu i podlegają moderacji |
| Potrzeba przypisana sztywno do gminy | Grupowanie semantyczne i geograficzne, także przez granice gmin | Pokazać obszar i dystans; gmina jest kontekstem, nie granicą tożsamości problemu |
| Publiczna strona główna i katalog | Wszystkie funkcje aplikacji po zalogowaniu | `/` to wejście/ przekierowanie; katalog i wszystkie dane chronione sesją |
| Crowdfunding i symulowana wpłata | Deklaracje budżetu, czasu, sprzętu i lokalu; bez płatności | Zakładka „Zasoby i budżet”; brak zbiórek, checkoutu, salda wpłat i potwierdzeń przelewów |
| Trzy konta demo | Użytkownik i administrator | Wybór roli demo uruchamia sesję backendu; lokalny przełącznik nie daje uprawnień |
| „Mam zastrzeżenia” jako lewy gest i osobny „Pomiń” | Prawo: poparcie; pominięcie z opcjonalnym uzasadnieniem | Przyciski `Popieram`, `Pomijam`, `Cofnij`; nie tworzyć odrębnego głosu negatywnego ani procentu ocen pozytywnych |
| Trend zgłoszeń jako wykres zmian | Najczęstsze problemy według liczby unikalnych zgłaszających | Nazwa „Najczęściej zgłaszane”; nie prezentować wzrostu w czasie bez takiej funkcji |
| Wszystkie deklaracje wolontariatu potwierdza koordynator | Zapisy otwarte; administrator potwierdza wymagane umiejętności | Rozróżnić zwykły zapis, weryfikację kwalifikacji, listę oczekujących i ofertę miejsca |
| Automatyczne przekazanie po progu | Pilne przypadki: wskazówki i jawnie symulowany status skierowania | Żadnej sugestii, że powiadomiono urząd lub służby; progi eskalacji nie są uzgodnioną funkcją |
| Profile gmin, partnerów, zarządzanie rolami i mentor | Brak uzgodnionego osobnego modułu takich profili/uprawnień | Partnerzy i właściciel jako dane adaptacji/pilotażu; komunikacja w wątkach pomysłów |
| Animowane komponenty, upload, tablica zadań | Narzędzia pomocnicze, nie wymagania produktu | Nie dodawać załączników, Kanbanu lub efektów tylko dlatego, że są w katalogu komponentów |
| Brak osobnych ekranów pomysłu, kolejki AI i ewaluacji | Są częścią uzgodnionego procesu | Dodać je jako pełne przepływy i stany w mapie stron |
| Matchmaking eksponowany w panelu urzędnika | Główna funkcja dla zgłaszającego; obowiązkowa lista i 3D | Wyniki jako osobny ekran użytkownika, dostępny bez czekania na decyzję administratora |

Zachować: Friendly Civic Tech, ciepłe tło, zieleń głównych działań, pomarańczowy akcent, Source Sans 3, polskie teksty, umiarkowane zaokrąglenia, dotykowe cele 44 × 44 px, wspólne szablony listy/szczegółów/formularza i zakładki z własnymi adresami.

## 3. Obiekty i procesy, które muszą pozostać rozdzielone

| Obiekt | Znaczenie w UI | Kluczowa reguła |
| --- | --- | --- |
| Zgłoszenie | Pojedynczy opis i lokalizacja od użytkownika | Zachować oryginał oddzielnie od tekstu AI; anonimowość dotyczy prezentacji innym użytkownikom |
| Potrzeba | Kanoniczny problem skupiający zgłoszenia | Licznik oznacza unikalnych zgłaszających; powtórne zgłoszenie tej samej osoby nie zwiększa go |
| Innowacja/rozwiązanie | Materiał z katalogu albo rozwiązanie powiązane z potrzebą | Zachować źródła i jawne braki wiedzy; status testowania wynika z danych |
| Pomysł | Nowa propozycja autora | Prywatny do przejścia AI, potwierdzenia autora i akceptacji administratora |
| Adaptacja | Robocze dostosowanie wybranej innowacji do warunków instytucji | To ścieżka zwykłego użytkownika, nie trzecia rola i nie automatyczny start wdrożenia |
| Pilotaż | Lokalne testowanie rozwiązania | Start zależy od warunków gotowości i decyzji administratora |
| Poparcie | Wybór dotyczący rozwiązania dla konkretnej lokalnej potrzeby | Jeden bieżący głos na `(użytkownik, rozwiązanie, lokalny problem)`; zmiana i cofnięcie dozwolone |
| Satysfakcja | Ocena efektów przez beneficjenta/wolontariusza | Oddzielna od poparcia, frekwencji i liczby zgłoszeń |

Nie tworzyć jednej uniwersalnej osi statusu dla wszystkich obiektów. Etapy przetwarzania zgłoszenia, publikacji pomysłu, uczestnictwa i pilotażu mają inne znaczenia.

Główny przepływ:

```text
Sesja demo → opis i lokalizacja → analiza + korekta kategorii
→ propozycje potrzeb → potwierdzenie albo nowa potrzeba
→ lista maksymalnie 10 trafnych innowacji + semantyczny widok 3D
→ szczegóły i źródła
→ opcjonalnie pomysł / adaptacja / poparcie / udział w zatwierdzonym pilotażu
```

Publikacja pomysłu:

```text
Formularz lub rozmowa → kolejka AI → tekst po opracowaniu
→ potwierdzenie autora → akceptacja administratora → publiczna karta i głosowanie
```

Pilotaż: `Szkic → Weryfikacja → Rekrutacja / Finansowanie → Pilotaż → Ewaluacja → Upowszechnianie`. Rekrutacja i deklaracje finansowania mogą działać równolegle; dokładne przejścia wymagają ustalenia. „Niedostępny” wymaga jawnej decyzji i przyczyny; zasad odzyskania/pauzy nie należy dopowiadać bez rozstrzygnięcia.

## 4. Mapa stron i podstron

Adresy są **propozycją nowej architektury**, nie migracją działających adresów. Warianty stanów nie wymagają odrębnych stron. „Publiczna karta” oznacza widoczną innym zalogowanym użytkownikom, nie dostęp bez sesji.

### Wejście i przestrzeń użytkownika

| Adres | Widok i główne działanie | Najważniejsze dane/relacje | Etap |
| --- | --- | --- | --- |
| `/` | Landing prezentujący inicjatywę, proces i wejście do aplikacji | Treści informacyjne, CTA do wyboru konta; bez ujawniania danych aplikacji | E0 mockupy / E1 implementacja |
| `/logowanie` | Wybrać konto demo | Dwie syntetyczne tożsamości, stan tworzenia sesji | E1 |
| `/start` | Rozpocząć zgłoszenie; wrócić do spraw | Skróty do potrzeb, katalogu, pomysłów i pilotaży | E1 |
| `/zgloszenia/nowe` | Opisać problem i wskazać miejsce | Tekst, lokalizacja problemu, anonimowa prezentacja | E1 |
| `/zgloszenia/:id/potwierdzenie` | Skorygować kategorie i wybrać powiązanie | Kategorie wielokrotne, szacunki AI, kandydaci potrzeb | E1 |
| `/zgloszenia/:id/wyniki` | Ocenić dopasowane istniejące rozwiązania | Maksymalnie 10 innowacji, wyjaśnienia, ograniczenia, źródła, współrzędne 3D | E1 |
| `/zgloszenia` | Wrócić do własnych zgłoszeń | Data, etap przetwarzania, powiązana potrzeba | E1 |
| `/zgloszenia/:id` | Zrozumieć stan sprawy i przejść do potrzeby/wyników | Dane własnego zgłoszenia, moderator, stan powiązania | E1 |
| `/innowacje` | Szukać niezależnie od zgłoszenia | Kategorie, zapytanie, materiały, paginacja | E2; szczegóły używane w E1 |
| `/innowacje/:id` | Przeczytać źródła i wybrać adaptację | Opis, odbiorcy, wymagania, koszty jeśli znane, dowody testów | E1 |
| `/potrzeby` | Zobaczyć potrzeby blisko wybranego obszaru | Punkt/obszar, promień odkrywania, dystans, unikalne osoby | E2 |
| `/potrzeby/najczestsze` | Poznać najczęściej zgłaszane potrzeby | Algorytmiczne liczby i jawny zakres, nie wykres wzrostu | E2 |
| `/potrzeby/:id` | Zrozumieć potrzebę i wybrać dalsze działanie | Podsumowanie, obszar, rozwiązania, pomysły, pilotaże | E1 podstawowe szczegóły; E2 pełny widok |
| `/pomysly/nowy` | Wypełnić formularz albo rozpocząć rozmowę | Kontekst potrzeby/innowacji, wejściowe pola autora | E3 |
| `/pomysly` | Śledzić własne i zaakceptowane pomysły | Jasne rozdzielenie prywatnych szkiców od publicznych propozycji | E3/E4 |
| `/pomysly/:id` | Przejrzeć pomysł i jego stan publikacji | Wynik AI, potwierdzenie autora, decyzja administratora | E3 |
| `/pomysly/:id/dyskusja` | Uczestniczyć w wątku | Komentarze, odbiorcy, uprawnienia do odczytu i zapisu | E4 |
| `/poparcie` | Poprzeć lub pominąć rozwiązanie | Zatwierdzone karty dla nierozwiązanych potrzeb, liczniki | E4 |
| `/adaptacje/nowa?innowacja=:id` | Opisać warunki instytucji | Odbiorcy, lokalizacja, zasoby, budżet, ograniczenia | E4 |
| `/adaptacje/:id` | Przejrzeć roboczą adaptację | Wybrana innowacja, wynik AI, źródła i niewiadome | E4 |
| `/pilotaze` | Znaleźć zatwierdzony pilotaż | Obszar, etap, zadania i możliwości udziału | E5 |
| `/pilotaze/:id` | Sprawdzić cel i warunki pilotażu | Właściciel, partnerzy, plan testów, status | E5 |
| `/pilotaze/:id/zasoby` | Zadeklarować czas, budżet, sprzęt lub lokal | Wymagania, deklaracje, zaakceptowany budżet i luki | E5 |
| `/pilotaze/:id/udzial` | Zapisać się, zrezygnować lub przyjąć miejsce | Limity, kwalifikacje, kolejka, oferta miejsca | E5 |
| `/pilotaze/:id/ewaluacja` | Wyrazić satysfakcję i zgłosić poprawki | Uprawnienie do oceny, formularz, historia własnego zapisu | E5 |
| `/powiadomienia` | Zareagować na zdarzenie w aplikacji | Decyzje, komentarze, oferta miejsca, link do działania | E4/E5 |
| `/moje-aktywnosci` | Wrócić do zgłoszeń, pomysłów i udziałów | Istniejące relacje użytkownika; bez rozbudowanego profilu | E5 |

`/potrzeby/najczestsze` należy rozróżnić od parametru `:id` w routerze. Formularz nowego zgłoszenia przed zapisem przechowuje kroki lokalnie; trwałe adresy `:id` pojawiają się dopiero po utworzeniu zasobu w backendzie.

Pomoc, prywatność i dostępność mogą otrzymać `/pomoc`, `/prywatnosc`, `/dostepnosc` jako pomocnicze strony po zalogowaniu. Krótkie objaśnienie konta demo i anonimowej prezentacji jest konieczne już przy wejściu/formularzu. Nie deklarować pełnej zgodności WCAG ani fikcyjnego kanału kontaktu. Wyjątek dla publicznych stron informacyjnych wymaga osobnej decyzji.

### Administrator

| Adres | Widok i główne działanie | Wymagania | Etap |
| --- | --- | --- | --- |
| `/admin` | Wybrać sprawę wymagającą decyzji | Kolejki moderacji, pomysłów, pilotaży; liczby z API | E1 minimum, potem rozbudowa |
| `/admin/zgloszenia` | Przeglądać zgłoszenia | Filtry, syntetyczna tożsamość autora, decyzje moderacji | E1/E6 |
| `/admin/zgloszenia/:id` | Ocenić zgłoszenie i powiązanie | Oryginał, tekst AI oddzielnie, kontekst, uzasadnienie | E1/E6 |
| `/admin/potrzeby` | Obsłużyć grupowanie i duplikaty | Kanoniczne potrzeby, unikalne osoby, obszary | E6 |
| `/admin/potrzeby/:id` | Scalić/rozdzielić potrzebę | Podgląd skutków dla zgłoszeń, powiązań, liczników i głosów | E6 |
| `/admin/innowacje` | Utrzymywać bazę wiedzy | Wyszukiwanie, kompletność, źródło i aktywność | E2/E6 |
| `/admin/innowacje/:id` | Edytować kartę i dane źródłowe | Braki, pochodzenie, stan indeksowania, skutki usunięcia źródła | E6 |
| `/admin/rozwiazania/duplikaty` | Rozstrzygnąć podobieństwo rozwiązań | Kandydaci AI, różnice, głosy i powiązane pilotaże | E6 |
| `/admin/pomysly` | Rozpatrzyć potwierdzone pomysły | Stan AI i zgoda autora; nieprzetworzony pomysł nie kwalifikuje się do publikacji | E3 |
| `/admin/pomysly/:id` | Zatwierdzić lub zwrócić do poprawy | Roboczy budżet, źródła, różnice po redakcji AI, uzasadnienie decyzji | E3 |
| `/admin/pilotaze` | Wybrać inicjatywę do decyzji | Etap, właściciel, kompletność warunków | E5 |
| `/admin/pilotaze/:id` | Obsłużyć etapy i gotowość | Weryfikacja, rekrutacja/zasoby, start, niedostępność, ewaluacja, upowszechnienie | E5 |
| `/admin/pilotaze/:id/budzet` | Zatwierdzić przygotowany budżet | Szacunek AI, koszt zatwierdzony, deklaracje oddzielnie | E5 |
| `/admin/pilotaze/:id/uczestnicy` | Potwierdzić umiejętności i obsadzić miejsca | Limity, zapisy, oferty, ręczna promocja z kolejki | E5 |

Panel nie potrzebuje osobnych modułów kont, ról, gmin, mentorów czy partnerów. Statystyki są dostępne użytkownikowi i administratorowi zgodnie z README; to zachowana, jawna rozbieżność z ograniczeniem z dokumentu wyzwania.

### Nawigacja i szablony

- Użytkownik, desktop: stała nawigacja „Start”, „Potrzeby”, „Innowacje”, „Pomysły”, „Pilotaże”; `Poparcie` jako działanie kontekstowe i skrót. Powiadomienia oraz „Moje aktywności” w nagłówku/menu konta.
- Telefon: maksymalnie pięć pozycji głównych; widoczna etykieta, aktywna pozycja i miejsce pod dolnym paskiem. Oferta miejsca jest widoczna także z powiadomienia, nie tylko z pilotażu.
- Administrator: boczne menu z kolejkami; powrót do przestrzeni użytkownika w ramach sesji administratora, bez nadawania zwykłemu kontu uprawnień.
- Szczegóły mają breadcrumbs lub jasny „Wróć”, zachowują filtry listy i obsługują odświeżenie adresu.
- Zakładki pilotażu/adaptacji/szczegółów mają własne adresy. Filtry list przechowujemy w query string, bez surowych opisów problemów i danych tożsamości w URL.
- Szablony: shell, lista z filtrami, formularz krokowy, szczegóły z zakładkami, kolejka admina z panelem decyzji. Jedna rodzina komponentów, różna gęstość treści.

## 5. Specyfikacja najważniejszych ekranów

### Zgłoszenie i potwierdzenie

Główny przycisk: „Znajdź rozwiązania”. Formularz prowadzi przez opis, lokalizację/anonimowość, analizę i potwierdzenie. Krok opisuje czynność, nie tylko numer.

AI nie może ustalać miejsca problemu na podstawie telefonu bez potwierdzenia. Mapa ma równoważny wybór ręczny; brak zgody na geolokalizację nie blokuje zgłoszenia. Lokalizacja poza Małopolską otrzymuje konkretny komunikat i możliwość korekty. Obsługę granicy regionu określa kontrakt backendu.

Na potwierdzeniu: wielokrotny wybór kategorii, informacja „Szacunek AI” przy odbiorcach/pilności/czasie trwania, kandydaci potrzeb z opisem i kontekstem miejsca, działania „To ta potrzeba” i „Żadna nie pasuje”. Potwierdzenie niskiej pewności jest zawsze świadome. Brak kandydatów pozwala utworzyć nową potrzebę.

Błędny tekst: wyjaśnienie i poprawka przy zachowaniu danych. Pilny przypadek: wskazówki kontaktowe, status „Symulacja skierowania”; treść i adresaci wskazówek pozostają do ustalenia, bez wymyślania kontaktów.

### Wyniki dopasowania i szczegóły innowacji

Hierarchia: opis/potrzeba → liczba znalezionych rozwiązań → lista rekomendacji → szczegóły → dalsze działania. Przy każdej rekomendacji: źródło, „Dlaczego pasuje”, ograniczenia, odbiorcy i dostępne metadane kosztów/testów. Brak danych ma jawny tekst, nie wartość zero ani dane wygenerowane dla wypełnienia karty.

Lista ma 0-10 wyników; mniej niż dziesięć jest normalnym rezultatem. Przy braku dopasowania zaproponować zmianę opisu, katalog albo opracowanie pomysłu. Nie wymuszać tworzenia pomysłu zamiast skorzystania z istniejącej innowacji.

Widok 3D: problem i kandydaci z API, legenda, opis przybliżenia, wybór punktu otwierający tę samą kartę co lista. To podobieństwo semantyczne, nie mapa Małopolski. Ranking pochodzi z pełnych embeddingów i filtrów backendu. Awaria WebGL/projekcji nie może zasłonić listy; lista działa również klawiaturą i na telefonie. Nie generować atrap współrzędnych jako docelowych wyników.

Karta innowacji oddziela treść ze źródła od interpretacji AI. Odnośnik do PDF/wideo nie oznacza, że materiał został pobrany, odczytany lub sprawdzony. Adaptacja wybranej innowacji zachowuje jej identyfikator i pochodzenie.

### Potrzeby blisko mnie i najczęstsze

Wybór obszaru i promienia dotyczy odkrywania. Zmiana promienia nie zmienia grupowania, zgłoszenia ani liczników. Karta: podsumowanie potrzeby, obszar, dystans, liczba unikalnych osób, status, dalszy krok. Szczegóły mogą prowadzić do zgłoszenia tej potrzeby przez pełny proces, do pomysłu lub pilotażu; samo „Mnie też dotyczy” nie może podbijać licznika bez zapisu i deduplikacji zgłoszenia w API.

„Najczęściej zgłaszane” to sortowanie liczb z backendu. Okres zliczania pozostaje otwarty, należy go podpisać po ustaleniu. Nie tworzyć wykresu wzrostu ani wyniku ważności na podstawie LLM.

### Pomysł i asystent

Formularz jest zawsze dostępny jako alternatywa rozmowy: potrzeba, beneficjenci, rozwiązanie, partnerzy, koszty/zasoby, etapy. Rozmowa dotyczy bieżącej sesji; nie planujemy wznawiania wcześniejszych rozmów ani współedycji.

Szkic po AI umożliwia sprawdzenie treści i potwierdzenie autora. Widoki muszą rozróżniać: szkic prywatny, oczekiwanie na AI, przetwarzanie, błąd z możliwością ponowienia, oczekiwanie na autora, ocenę administratora, publikację/konieczność poprawki. Nazwy stanów są propozycją kontraktu, nie nową decyzją o cyklu produktu.

Przy awarii API: zapis do kolejki i komunikat o oczekiwaniu. Przyciski publikacji nie mogą omijać AI lub zgody autora. Dyskusja i karta publiczna nie udostępniają niezatwierdzonego szkicu. Zasady zwrotu do poprawy i ponownego przetwarzania po zmianie treści muszą określić Osoby 2 i 3.

### Poparcie i komunikacja

Karta zawsze pokazuje lokalną potrzebę, rodzaj propozycji („Pomysł”, „W testach”, „Sprawdzona innowacja” zgodnie z danymi), źródła, bariery i liczbę poparć. Prawo/`Popieram`, lewo/`Pomijam`; opcjonalny powód pominięcia, cofnięcie, szczegóły. Status „sprawdzona” wymaga dowodów, nie samej akceptacji pomysłu.

Karty są dopuszczone przez administratora i związane z odpowiednią nierozwiązaną potrzebą lokalną lub regionalną. Nowe pomysły porządkujemy według liczby poparć wewnątrz tego dopuszczalnego, trafnego zbioru. Nie podmieniamy go globalną listą popularnych pomysłów. Reguły remisów pozostają otwarte.

Gest i przycisk wywołują tę samą mutację. W stanie zapisu blokować powtórny gest; błąd zapisu nie może pozostawić pozornego poparcia. Koniec kart ma czytelne zakończenie i link do potrzeb/katalogu. Nie zatwierdzać startu pilotażu wynikiem głosowania.

Wątek przypięty do pomysłu, z widocznym kontekstem i stanem wysyłania. Zakres czytających, udział ekspertów i widoczność wymagają ustalenia przed udostępnieniem wątku. Powiadomienia są wyłącznie w aplikacji.

### Adaptacja dla instytucji

Rozpoczęcie z karty innowacji lub formularza z jej wyborem. Użytkownik podaje odbiorców, miejsce, zasoby, budżet i ograniczenia. Wynik to robocza adaptacja; opcjonalna kompozycja „Przenosimy wprost”, „Zmieniamy lokalnie”, „Do ustalenia” pomaga czytać materiał, ale nie zastępuje wymaganych pól i źródeł.

Nie wymaga konta instytucjonalnego, katalogu partnerów ani przypisania do gminy. Ewentualne przekazanie adaptacji do pomysłu/pilotażu jest do ustalenia; szkic nie przechodzi automatycznie w zatwierdzone wdrożenie.

### Pilotaż, zasoby, wolontariat, ewaluacja

Przegląd pokazuje etap i najbliższe możliwe działanie. Warunki startu: zatwierdzony budżet, odpowiedzialny właściciel, wymagani partnerzy, plan testów, wystarczający udział. API zwraca niespełnione warunki; administrator zatwierdza start na serwerze.

Zasoby i budżet: wymaganie → deklaracja → stan dostępności/potwierdzenia → luka. Kwota deklarowana nie jest wpłatą ani zatwierdzonym kosztem. Macierz koalicji z kierunku frontendu może być układem tej zakładki, bez budowy osobnego CRM partnerów. Wycofanie zasobu powinno ujawniać lukę; dokładne reguły i cofanie etapów pozostają propozycją do ustalenia.

Udział: opis obowiązków, terminy, kwalifikacje, miejsca, zapis, rezygnacja, lista oczekujących. Oferta zwolnionego miejsca zawiera „Przyjmuję miejsce”; nie uznawać użytkownika za zapisanego przed akceptacją i potwierdzeniem API. Stan spóźnionej oferty i równoczesnych akceptacji musi być obsłużony. Tylko syntetyczne potwierdzenia umiejętności, bez skanów dokumentów.

Ewaluacja: satysfakcja, feedback, poprawki, dopuszczona grupa beneficjentów/wolontariuszy. Skala i termin są otwarte. Upowszechnienie zatwierdza administrator. Nawrót potrzeby może rekomendować historycznie dobrze ocenione rozwiązanie; nie uruchamia kolejnego pilotażu.

### Moderacja i scalanie

Najpierw szczegóły i przewidywane skutki, potem świadome zatwierdzenie. Potrzeby i rozwiązania mają odrębne operacje scalania. UI pokazuje obiekty docelowe, przenoszone powiązania i skutki dla liczników/głosów/pilotaży zgodnie z obliczeniami backendu. AI wskazuje kandydatów, nie wykonuje operacji ani akceptacji.

Tożsamość autora tylko w odpowiedzi dla administratora. Ukrycie etykiety w React nie zapewnia anonimowości. Błędny/stary adres, brak uprawnienia i konflikt równoczesnej edycji mają odrębne stany.

## 6. Kierunek wizualny i komponenty

Wszystkie główne powierzchnie to **Operate** według Impeccable: użytkownik wykonuje zadanie. Objaśnienia i źródła mają charakter **Read**. Krótkie wejście wyjaśniające produkt może korzystać z zasad **Persuade**, lecz pulpit nie jest wielosekcyjnym landing page.

Interpretacja briefu: aplikacja civic tech dla mieszkańców, organizacji i administratora, przyjazna i czytelna, z uporządkowaną hierarchią zadań. Friendly Civic Tech to opis estetyki, nie oficjalny framework.

Przenosimy tokeny z kierunku frontendu:

| Zastosowanie | Wartość |
| --- | --- |
| Tło / powierzchnia | `#FAF8F3` / `#FFFFFF` |
| Tekst / opis pomocniczy | `#172B26` / `#52645B` |
| Działanie główne / tekst / hover | `#146B52` / `#FFFFFF` / `#105740` |
| Akcent / tekst na akcencie | `#B84A1B` / `#FFFFFF` |
| Subtelna zieleń / obramowanie | `#E7F2EC` / `#D5DDD6` |
| Obramowanie pola / fokus | `#76877C` / `#1E40AF` |
| Sukces / ostrzeżenie / błąd | `#146B52` / `#8A4B08` / `#B42318` |

Kontrasty podane w źródłowym kierunku są ograniczone do wskazanych par. W implementacji trzeba sprawdzić wszystkie stany, także disabled, hover, overlay, wykresy, mapę i 3D. Kolor nigdy nie zastępuje tekstu statusu.

Source Sans 3, lokalny hosting z polskimi znakami, `font-display: swap`. Tekst 16 px, metadane 14 px, nagłówek strony 32/28 px, sekcji 24 px, karty 20 px. Kwoty/liczniki `tabular-nums`. Tekst dłuższy 60-75 znaków w wierszu. Skala odstępów 4/8/12/16/24/32/48/64 px; promienie 8 px pola/przyciski, 12 px karty, 16 px dialogi. Motyw jasny w pierwszym wydaniu.

Parametry jako wskazówka dla przyszłych mockupów: `DESIGN_VARIANCE=3`, `MOTION_INTENSITY=2`, `VISUAL_DENSITY=4` dla użytkownika. Admin może mieć gęstość 6, z tą samą typografią i tokenami. To propozycja dostosowana do publicznej usługi, nie domyślne 8/6/4 Taste. Nie stosować limitów marketingowych Taste do tabel, formularzy i liczby elementów roboczych.

### Biblioteki: propozycje do zweryfikowania podczas implementacji

- Router dla React/Vite; brak migracji do Next.js i Server Components z powodu domyślnych instrukcji skilla.
- Jeden zestaw dostępnych prymitywów UI, np. shadcn/ui oparty na Radix, dostosowany do tokenów. Tailwind tylko po świadomym wyborze; obecnie projekt ma zwykły CSS.
- Jedna rodzina ikon liniowych. Kierunek sugeruje Lucide; alternatywę z Taste można wybrać przed pierwszym mockupem, bez mieszania zestawów i bez zmiany briefu.
- Formularze i zapytania: narzędzia dopiero po ocenie liczby kroków, walidacji i stanów API. Nie instalować pakietów „na zapas”.
- Mapa geograficzna i renderer 3D to niezależne moduły. Dostawca map, warstwa administracyjnych granic i renderer pozostają do wyboru; sprawdzić wymagania licencyjne/atrybucję i możliwość działania demo.
- React Bits/21st.dev jako inspiracje, nie obowiązkowe zależności. Sprawdzić dostępność i źródłowy kod konkretnego komponentu przed użyciem. Stack wymaga logiki prawdziwego głosowania; Stepper walidacji i zachowania danych; Calendar nie zapewnia listy oczekujących ani limitów.

Komponenty domenowe: `ReportWizard`, `LocationPicker`, `CategoryCorrection`, `ProblemCandidateCard`, `MatchExplanation`, `InnovationCard`, `SemanticMatchView`, `NeedCard`, `IdeaDraftReview`, `SolutionVoteCard`, `AdaptationDraft`, `PilotReadiness`, `ResourceDeclaration`, `VolunteerParticipation`, `PlaceOffer`, `EvaluationForm`, `ModerationDecision`, `MergePreview`.

Wspólne: przyciski/pola, statusy, komunikaty, skeleton, stan pusty/błąd, lista z filtrami, źródła, zakładki z URL, nawigacja. Nie obudowywać każdej sekcji kolejną kartą. Formularze i kolejki mają prostą kompozycję; wyróżniki marki są w kolorze, typografii i dopracowanych detalach.

## 7. Reguły przyszłych mockupów i użycie skillów

Skille są już dostępne w tym środowisku; nie instalowano ani nie aktualizowano ich kopii. Zasady trwałe dla pracy w katalogu frontendu zapisano w [frontend/front/AGENTS.md](frontend/front/AGENTS.md).

| Skill | Zastosowanie w HUBMI | Granica zastosowania |
| --- | --- | --- |
| [Impeccable](https://github.com/pbakaus/impeccable) | Kontekst, hierarchia, stany, krytyka UX, dostępność, spójność, dopracowanie ekranów | Brief produktu ma pierwszeństwo; tryb Operate dla aplikacji |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Weryfikacja wzorców nawigacji, formularzy, dotyku, dostępności i gęstości UI | Wyniki wyszukiwania są rekomendacją; nie zastępują ustalonego fontu i palety |
| [Taste / design-taste-frontend](https://github.com/leonxlnx/taste-skill) | Antygeneryczna kompozycja, rytm, typografia i zasady ekranów wprowadzających | Lokalny skill wyłącza dashboardy, tabele i wielokrokowe formularze ze swojego głównego zakresu; nie narzucać im estetyki landing page |

W tej analizie UI UX Pro Max zwrócił pasujący profil `Accessible & Ethical` dla usług publicznych. Przyjęto nacisk na czytelność, klawiaturę i ograniczenie ruchu. Odrzucono automatyczny układ marketingowy `Minimal Single Column`, granatowo-niebieską paletę i Atkinson Hyperlegible, bo nie odpowiadają ekranom operacyjnym i ustalonemu kierunkowi HUBMI. Wyszukiwania formularzy potwierdziły błędy przy polach, fokusowane podsumowanie błędów i powiązania z polami; wyszukiwanie nawigacji potwierdziło głębokie linki i ochronę treści przed zasłonięciem paskiem.

### Kolejność mockupów

1. **M1: podstawowa ścieżka.** Shell, wybór konta, zgłoszenie, potwierdzenie, wyniki/lista + 3D, karta innowacji. Na końcu tej samej serii: brak trafienia, błąd AI, poprawka opisu, lokalizacja poza regionem.
2. **M2: eksploracja.** Katalog, potrzeby blisko obszaru, najczęstsze potrzeby, szczegóły; warianty filtrów i braku danych.
3. **M3: tworzenie i decyzje.** Formularz/rozmowa, kolejka AI, przegląd autora, kolejka administratora, decyzja publikacji.
4. **M4: społeczność i instytucja.** Poparcie, cofnięcie/błąd zapisu, wątek, formularz adaptacji i roboczy wynik.
5. **M5: pilotaż.** Przegląd, zasoby, warunki gotowości, zapis/lista oczekujących/oferta miejsca, ewaluacja i decyzja administratora.
6. **M6: utrzymanie.** Moderacja, merge/split, duplikaty rozwiązań, edycja katalogu, stary/brakujący zasób.

Projektować M1 przed szeroką galerią dashboardów. Każda seria ma desktop i telefon oraz komplet najważniejszych stanów, nie tylko atrakcyjny ekran sukcesu. Administrator ma własny układ roboczy, ale wspólne tokeny.

Przed mockupem: wskazać rolę, URL, główne działanie, dane wejściowe, źródła i stany. Makieta interaktywna może korzystać z lokalnych fixtures zgodnych z kontraktem; oznaczyć dane syntetyczne i funkcje symulowane. Zdjęcia nie mogą udawać realnych beneficjentów/rekomendacji. Nie wymyślać wskaźników skuteczności, kosztów ani afiliacji.

Forma kolejnej serii mockupów (obraz referencyjny czy interaktywny React) pozostaje otwarta; to zadanie tworzy plan, nie makiety ani trwałe ustawienie sposobu ich generowania. Przy właściwym budowaniu użyć procedury kontekstu i odpowiednich referencji skillów. Nie tworzyć konkurencyjnego opisu produktu wobec README. Jeśli workflow wymaga `PRODUCT.md`, zbudować go na aktualnym README, z jawnymi otwartymi decyzjami; `DESIGN.md` dokumentuje dopiero ustalony system ekranów.

Weryfikacja makiet/ekranów: jedna zbiorcza inspekcja desktop + telefon, poprawki w jednej partii i najwyżej jedna ponowna inspekcja zgodnie z Impeccable. Kontrola klawiatury, fokusu i czytelności musi towarzyszyć ocenie wizualnej; screenshot nie dowodzi działania.

## 8. Etapy implementacji i zależności

Wszystkie etapy są planowane. E1 to pierwszy działający przekrój aplikacji; nie oznacza ograniczenia uzgodnionego zakresu końcowego do samego matchmakingu. Administrator pojawia się już tam, gdzie potrzebna jest jego decyzja, a nie dopiero na końcu projektu.

| Etap | Osoba 1: frontend | Osoba 2: aplikacja i integracja | Osoba 3: dane i AI | Warunek przejścia |
| --- | --- | --- | --- | --- |
| E0 | Inwentaryzacja stanów, M1, tokeny, propozycje URL, fixtures | Kontrakt HTTP, sesje, błędy/job states, schemat domeny i migracje | DTO AI, interfejs repozytorium, audyt korpusu, wymagania embeddingów | Jedne identyfikatory i enumy; przykład każdej odpowiedzi/błędu krytycznej ścieżki |
| E1 | Logowanie, formularz, korekta kategorii, grupowanie, wyniki, źródła, szczegóły, 3D | Baza, autoryzacja, zgłoszenia, kanoniczne problemy, adapter wektorowy, prywatność | Sanitizacja, chunking, Nomic/Ollama, Gemini za adapterem, HyDE, retrieval, projekcja | Rzeczywiste dopasowania ze źródeł przez UI i backend; lista i 3D; odrzucenie grupowania tworzy nową potrzebę |
| E2 | Katalog, potrzeby/obszar/promień, najczęstsze, szczegóły | Filtry, liczniki unikalnych osób, geografia i wyszukiwanie | Taksonomia, rozszerzenie publikacji/obserwatorium/mapy wyzwań, PDF/OCR | Katalog działa bez zgłoszenia; promień odkrywania nie zmienia grupowania |
| E3 | Pomysł/formularz/rozmowa, status kolejki, wynik autora, admin review | Trwała kolejka, retry, job endpoints, bramki publikacji | Struktury pomysłu, redakcja tekstu, podobne rozwiązania do przeglądu | Awaria AI zapisuje oczekujące zadanie, nie publikuje; komplet zgód przed kartą publiczną |
| E4 | Poparcie/przyciski/gest/undo, dyskusja, powiadomienia, adaptacja | Unikalne głosy, filtrowanie kart, wątki, przechowanie adaptacji | Adaptacja z warunków instytucji, źródła i niewiadome | Spójna mutacja głosu; prywatne szkice niedostępne innym; adaptacja pozostaje szkicem |
| E5 | Pilotaże, zasoby, udział, kolejka/oferty, ewaluacja, admin budget/start/dissemination | Warunki startu, lifecycle, deklaracje, kwalifikacje, konkurencja o miejsca, satysfakcja | Rekomendacje i ewentualny nawrót bez samodzielnych decyzji | Brak startu bez gotowości i admina; oferta wymaga przyjęcia; satysfakcja oddzielna od poparcia |
| E6 | Pełna moderacja/merge/split, edycja katalogu, końcowe stany i dostępność | Reconciliation, retencja, usunięcie źródła, testy integracji, wspólny start | Daily refresh, idempotencja, re-embedding, zachowanie ostatniej dobrej kopii, ocena retrieval | Cały zakres sprawdzony na rzeczywistych interfejsach; żadna funkcja docelowa nie opiera się wyłącznie na fixture |

Kontrakty E0 umożliwiają niezależne prace trzech osób. To organizacja zespołu z `tasks.md`, nie polecenie uruchamiania dodatkowych agentów w tej analizie. Migrations, publiczne API i reguły biznesowe mają jednego właściciela. Po publikacji kontraktu frontend pracuje na lokalnych przykładach, AI na własnych provider/repository interfaces, backend na zamienniku AI. Pierwszą integrację wykonać w E1, przed rozbudową pozostałych modułów.

### Zachowany podział własności

| Osoba | Katalogi | Odpowiedzialność |
| --- | --- | --- |
| 1 | `frontend/front` | Cały UI, w tym administrator, mockupy, klient API, lokalne fixtures, UI/e2e |
| 2 | `backend/app`, `integration` | Python API, sesje, uprawnienia, PostgreSQL, wszystkie migracje, kolejka, reguły i integracja |
| 3 | `backend/ai`, `backend/scrap`, `backend/data` | Algorytmy i DTO AI, ingestion, sanitizacja, modele/provider boundary, retrieval i projekcja |

Osoba 2 koordynuje zmiany plików głównych repozytorium. Każdy moduł ma osobne zależności, lockfile, przykładowe środowisko, fixtures i dokumentację. Bez wspólnego pliku zależności backendów i bez przenoszenia scrapera.

`backend/app` konsumuje publiczny pakiet AI. AI nie importuje route handlers, ORM ani sesji aplikacji. Osoba 3 określa operacje wektorowe i wymagania indeksowania; Osoba 2 implementuje adapter PostgreSQL i migracje także dla tabel wektorowych. AI nie tworzy konkurencyjnego publicznego API, kolejki czy lifecycle.

## 9. Kontrakty potrzebne ekranom

Przed implementacją ustalić wersję DTO i opublikować przykładowe odpowiedzi w katalogach właścicieli. Nie zamrażać nazw endpointów bez uzgodnienia; poniższe wiersze opisują operacje i zawartość.

| Granica | Minimum dla frontend/backend |
| --- | --- |
| Sesja | Rola, syntetyczny ID, dozwolone działania; 401 bez sesji i 403 bez uprawnienia |
| Zgłoszenie | `reportId`, oryginał widoczny zgodnie z uprawnieniami, miejsce, anonimowość, kategorie, etap analizy, błędy walidacji |
| AI analiza | Kategorie + korekty, nullable audience/urgency/duration, oznaczenie szacunku, kandydaci `problemId` i pewność/kontekst |
| Potwierdzenie | Jawny wybór potrzeby albo nowa; wynik z trwałym `problemId`; reguły retry bez podwójnego zapisu |
| Dopasowania | `innovationId`, rank, źródła, uzasadnienie, ograniczenia, znane/nieznane metadane; 0-10 rezultatów |
| Projekcja | Typ i ID punktu, `x/y/z`, legenda i wskazanie przybliżenia; ten sam zestaw rezultatów co lista |
| Geografia | Obszar/punkt, promień odkrywania, dystans i unikalne osoby; walidacja regionu po stronie serwera |
| Pomysł/job | Prywatność, etap kolejki, wynik AI, autor confirmation, admin decision, możliwość retry i kolejne dozwolone działanie |
| Głos | `solutionId`, lokalny `problemId`, stan mojego wyboru, aktualny support count, cofnięcie/zmiana |
| Adaptacja | Referencja innowacji, dane warunków, status opracowania, roboczy wynik ze źródłami |
| Pilotaż | Etap, właściciel, budget approved, wymagania, niespełnione warunki, dozwolone działania administratora |
| Wolontariat | Capacity, wymagane kwalifikacje, stan zapisu/kolejki/oferty, identyfikator oferty, akceptacja/anulowanie |
| Ewaluacja | Uprawnienie, przyjęta skala i termin, satysfakcja/feedback niezależne od głosów |
| Moderacja | Cel i skutki merge/split, konflikt/stara wersja, decyzja i uzasadnienie, projekcja danych administratora |
| Błędy | Stabilny kod, komunikat PL lub mapowanie kodu na PL, błędy pól, retryable, rozróżnienie 404/403/conflict/outage |

Kluczowe reguły:

- `null`/„Brak danych” nie znaczy `0`. Treść źródłowa, generacja, szacunek, deklaracja i zatwierdzona wartość są oddzielnymi polami.
- ID dla dokumentu/chunku/innowacji/problemu pozostają stabilne. Zmiana modelu wymaga zgodnej konfiguracji i re-embeddingu; ranking nie bazuje na projekcji 3D.
- Sanitizacja lokalna poprzedza każde zewnętrzne zapytanie AI, także chat, formularz i adaptację. Klucze Gemini/model configuration nie trafiają do frontendu.
- Wszelkie mutacje z retry muszą mieć uzgodnioną ochronę przed duplikatami; „kliknięto dwa razy” nie oznacza dwóch zgłoszeń, zadań ani zapisów.
- Status API jest prawdą o zapisie. UI może pokazać optymistyczne działanie tylko z kontrolą błędu i cofnięciem.
- Retencja surowych zgłoszeń/rozmów około miesiąca nie może przypadkowo usunąć zatwierdzonych pomysłów, aktywnych pilotaży i danych niezbędnych do integralności.

## 10. Dostępność, stany i weryfikacja

Cel z README: WCAG 2.1 AA. Sama lista wymagań nie jest dowodem zgodności. Każdy ekran danych uwzględnia ładowanie, pusto, brak wyników filtrów, błąd, retry, sukces, brak uprawnienia i brak/stary zasób. Formularz zachowuje dane przy błędzie.

- Klawiatura: wszystkie działania, w tym mapa przez ręczny wybór, głosowanie przez przyciski, obsługa zakładek, zapis/akceptacja miejsca, moderacja i dialogi.
- Formularze: etykiety, inline errors związane z polem, podsumowanie po nieudanym submit z fokusem i linkami do pól. Nie przenosić fokusu przy każdym blur.
- Ruch: krótkie informacje o zmianie stanu, obsługa `prefers-reduced-motion`, bez ruchu dekoracyjnego w kolejkach/formularzach.
- Rozmiary: projektowe 44 × 44 px obszary dotykowe, brak utraty działań przy powiększeniu i reflow do 320 CSS px. Sprawdzić telefon, tablet i desktop oraz długie polskie etykiety.
- Dane wizualne: statusy z tekstem, dostępna lista 3D, tabela/opis dla wykresu. Mapa potrzeb i semantyczne 3D mają różne nazwy i legendy.
- Wydajność: moduł mapy/3D ładowany osobno, stabilna przestrzeń skeleton/mediów, brak wykonywania analizy AI lub projekcji w cyklu renderowania React. Weryfikować rzeczywisty koszt po implementacji.

### Testy niezależne i integracja

Zachować model z `tasks.md`: frontend bez Pythona/AI/DB; backend z fake AI i osobną bazą PostgreSQL; AI z fake embedding/generative providers i in-memory repository; scraper na lokalnych fixtures. Domyślne testy nie wywołują płatnych usług ani nie nadpisują korpusu źródeł.

| Obszar | Planowana komenda | Istotna weryfikacja |
| --- | --- | --- |
| Frontend | `npm run test:unit`, `npm run test:e2e`, istniejące `npm run build`, `npm run lint` | Przepływy/stany API, routing, fokus, desktop/telefon, spójność fixture-kontrakt |
| Backend app | `python -m pytest tests` w `backend/app` | Uprawnienia, prywatność, unikalność, publikacja, migracje, konflikty i współbieżność miejsc |
| Backend AI | `python -m pytest tests` w `backend/ai` | Chunking, sanitizacja, źródła, błędne struktury AI, deduplikacja do innowacji, filtry/limity |
| Scraper | `python -m unittest discover -s tests -v` w `backend/scrap` | Istniejące testy offline plus resilience/refresh po rozbudowie |
| Integracja | Komenda ustalona w `integration/README.md` | Najpierw realne moduły z deterministycznym providerem, potem prawdziwy corpus + Nomic + skonfigurowany Gemini |

Komendy nowych runnerów są celami do utworzenia, nie wynikiem wykonanych testów. Mockupy weryfikujemy przez przegląd, nie pisząc testów do statycznego wyglądu. Testy implementacji mają chronić istotne zachowania.

Minimalne scenariusze integracyjne:

1. Zgłoszenie → analiza/korekta → potwierdzenie potrzeby → trafne rozwiązania, źródła i 3D.
2. Odrzucenie wszystkich kandydatów → nowa widoczna potrzeba; powtórne zgłoszenie osoby nie zwiększa licznika.
3. Brak dopasowania, niska pewność, nieodpowiedni tekst, obszar poza regionem, geolokalizacja odrzucona.
4. Anonimowa prezentacja wobec użytkownika i tożsamość dostępna administratorowi; bez dostępu bez sesji.
5. Awaria AI → idea w kolejce → retry → potwierdzenie autora → administrator → publiczna karta. Próby ominięcia blokowane.
6. Jedno bieżące poparcie w danym kontekście, zmiana/cofnięcie, błąd mutacji, kolejność kart w dopuszczalnym zbiorze.
7. Adaptacja z rzeczywistej innowacji i podanych ograniczeń; brak automatycznego przejścia w pilotaż.
8. Pilotaż z luką w gotowości nie startuje; zatwierdzenie budżetu i pełne warunki pozwalają adminowi uruchomić go.
9. Rezygnacja → oferta z listy oczekujących → powiadomienie → akceptacja; równoczesne próby nie przekraczają limitu; ręczna promocja admina.
10. Ewaluacja osobno od głosowania; admin zatwierdza upowszechnienie; nawrót generuje rekomendację, nie start.
11. Merge/split zachowuje uzgodnione powiązania/liczniki/głosy; potwierdzone usunięcie źródła i retencja nie niszczą aktywnych pilotaży.
12. Odświeżenie i głęboki link, mobile, klawiatura, brak WebGL i niedostępne źródło nie blokują podstawowych zadań.

Retrieval quality badać osobno od testów fake embeddings: reprezentatywne syntetyczne opisy, także bez pasującego rozwiązania, z oceną źródeł i trafności. Formalny benchmark, rozmiar zbioru i próg sukcesu pozostają propozycjami. Live checks wymagają modeli i skonfigurowanego limitu API; nie uruchamiają się domyślnie.

## 11. Otwarte decyzje i zakres odłożony

| Decyzja | Kiedy jest potrzebna | Koordynacja |
| --- | --- | --- |
| Nomic tag/config, Gemini model, klucze, limit wydatków | Przed rzeczywistą integracją E1 | Osoba 3; klucze/limit z właścicielem |
| Geografia, granice regionu, progi grupowania/ranking, minimum trafności | Kontrakt E0 i walidacja E1/E2 | Osoby 2 i 3 |
| HyDE pojedynczego opisu i aktualizacja po nowych zgłoszeniach | E1 | Osoba 3; adapter/persistencja Osoba 2 |
| Wytyczne pilnych przypadków i jawna symulacja | E1 | Właściciel + Osoby 1/2 |
| Okres liczenia najczęstszych problemów | Przed E2 | Osoba 2, prezentacja Osoba 1 |
| Odmowa/powrót pomysłu do poprawy i ponowne AI po edycji | Przed E3 | Osoby 2 i 3, prezentacja Osoba 1 |
| Widoczność wątków i udział ekspertów | Przed E4 | Osoba 2 z właścicielem |
| Powiązanie szkicu adaptacji z publikacją/pilotażem | Przed akcją przekazania w E4/E5 | Osoba 2 z właścicielem |
| Popularność między lokalnymi wdrożeniami, remisy, reconciliation głosów | E4/E6 | Osoba 2 |
| Równoległa rekrutacja/finansowanie, niedostępność/pauza/powrót | Przed przejściami E5 | Osoba 2 z właścicielem |
| Kolejka, czas ważności ofert i konkurencja akceptacji | Przed E5 | Osoba 2 |
| Skala i termin satysfakcji, uprawnienie do oceny | Przed E5 | Osoba 2, formularz Osoba 1 |
| Nawrót, epizody i historyczna ocena | Przed recurrence | Osoby 2 i 3 |
| Wycofane źródło z istniejącymi głosami/pilotażem | Przed removal E6 | Osoby 2 i 3 |
| Retencja oryginału i pochodnych/liczników | Przed cleanup E6 | Osoba 2 z Osobą 3 |
| Zastosowanie Social Innovation Canvas po odczytaniu dokumentu | Przed użyciem w promptach/formularzu | Osoba 3; nie zakładać niezweryfikowanej struktury |
| Forma mockupów i biblioteki UI/map/3D | Przy rozpoczynaniu odpowiedniej serii | Osoba 1 |

Nie przyjmować na stałe arbitralnych progów geograficznych, terminów kolejki ani budżetów API. Potrzebne wartości można zaproponować w konfiguracji, ale muszą mieć opis „propozycja” i sposób sprawdzenia. Otwarta decyzja blokuje zależną funkcję, nie całą niezależną pracę.

Poza zakresem obecnego prototypu: mObywatel/PESEL, realna weryfikacja tożsamości, płatności i bramka crowdfundingowa, rzeczywisty dispatch służb, zewnętrzne powiadomienia/integracje, generator wniosku grantowego, wznawianie rozmów AI, współedycja pomysłów. Dodatkowe propozycje kierunku frontendu (rola urzędnika, CRM partnerów/profili gmin, mentor, upload, Kanban, progi automatycznego kierowania) nie wchodzą do zakresu bez odrębnej decyzji.

Materiały formalnego zgłoszenia hackathonowego i koszty operacyjne są osobnym zadaniem, zgodnie z README. Nie zostały przygotowane w tej analizie. Wszystkie uzgodnione funkcje produktu pozostają w planie, w kolejności zaczynającej się od rzeczywistego dopasowania potrzeb do istniejących innowacji.
