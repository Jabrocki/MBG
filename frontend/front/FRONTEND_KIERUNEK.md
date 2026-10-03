# HubMI — kierunek frontendu

Dokument projektowy do prototypu aplikacji Małopolskiego Hubu Innowacji Społecznych.

## 1. Cel i główny proces

Aplikacja łączy potrzeby mieszkańców z istniejącymi innowacjami społecznymi, dostosowuje rozwiązanie do warunków gminy i pomaga zebrać partnerów oraz zasoby do pilotażu. Wolontariat i crowdfunding uzupełniają brakujące zasoby.

**Proces:** zgłoszenie mieszkańca → wspólna potrzeba gminy → analiza i decyzja urzędnika → dopasowanie innowacji → karta adaptacji → koalicja i finansowanie → potwierdzenie gotowości → pilotaż.

Rozróżniamy trzy obiekty:

- **Zgłoszenie:** pojedynczy sygnał mieszkańca.
- **Potrzeba:** sprawa skupiająca podobne zgłoszenia z konkretnej gminy.
- **Wdrożenie:** wybrana innowacja, lokalna adaptacja, partnerzy, zadania i finansowanie dla danej potrzeby.

W interfejsie używamy nazw „Zgłoszenie”, „Potrzeba”, „Rozwiązanie” i „Pilotaż”. Słowo „request” pozostaje poza tekstami dla użytkowników.

## 2. Kierunek wizualny

**Styl: Friendly Civic Tech — przyjazna platforma społecznościowa z uporządkowanymi panelami operacyjnymi.**

- Jasne, ciepłe tło; białe powierzchnie kart; ciemnozielone działania główne.
- Pomarańczowy akcent do wybranych wyróżnień, np. zachęty do udziału lub wsparcia.
- Czytelna typografia, proste ikony liniowe i umiarkowane zaokrąglenia.
- Mieszkaniec: duże karty, krótkie formularze, jedno główne działanie w sekcji.
- Urzędnik i admin: boczne menu, filtry, tabele oraz szczegóły sprawy.
- Jeden system wizualny dla wszystkich ról; różnią się nawigacja, dostępne działania i ilość informacji na ekranie.
- Animacje pomagają zrozumieć zmianę kroku, ocenę karty lub aktualizację statusu. Formularze i kolejki spraw pozostają spokojne.

Hasła do szukania inspiracji: `community platform UI`, `civic engagement app`, `social impact dashboard`, `volunteer platform UI`, `crowdfunding dashboard`, `clean admin dashboard`.

## 3. Kolorystyka

Kolory zapisujemy jako wspólne tokeny, wykorzystywane przez wszystkie komponenty.

| Token | Kolor | Zastosowanie |
|---|---|---|
| `background` | `#FAF8F3` | Ciepłe tło aplikacji |
| `surface` | `#FFFFFF` | Karty, formularze, okna dialogowe |
| `foreground` | `#172B26` | Nagłówki i tekst główny |
| `muted-foreground` | `#52645B` | Opisy pomocnicze, metadane |
| `primary` | `#146B52` | Główne przyciski i wybrane elementy |
| `primary-foreground` | `#FFFFFF` | Tekst na przycisku głównym |
| `primary-hover` | `#105740` | Przycisk główny po wskazaniu |
| `accent` | `#B84A1B` | Wyróżnienia i wybrane działania wspierające |
| `accent-foreground` | `#FFFFFF` | Tekst na tle akcentowym |
| `subtle-green` | `#E7F2EC` | Tła informacyjne i pozytywne statusy |
| `border` | `#D5DDD6` | Dekoracyjne podziały i obramowania kart |
| `input-border` | `#76877C` | Obramowania pól formularzy |
| `focus` | `#1E40AF` | Widoczny pierścień fokusu |
| `success` | `#146B52` | Potwierdzony udział, ukończony etap |
| `warning` | `#8A4B08` | Brak zasobu, oczekujące potwierdzenie |
| `danger` | `#B42318` | Błędy i działania wymagające ostrożności |

Sprawdzone kontrasty dla jednolitych kolorów, bez przezroczystości:

| Zestawienie | Kontrast |
|---|---|
| Tekst główny / tło aplikacji | 14,03:1 |
| Tekst pomocniczy / tło aplikacji | 5,94:1 |
| Biały tekst / zieleń główna | 6,45:1 |
| Biały tekst / pomarańczowy akcent | 5,21:1 |
| Obramowanie pola / biała powierzchnia | 3,80:1 |

Te wyniki potwierdzają wymienione pary. Pozostałe stany, nakładki, wykresy i kombinacje kolorów sprawdzamy w działającym interfejsie. Jasne obramowanie dekoracyjne nie służy jako jedyny sposób rozpoznania pola formularza.

Status zawsze zawiera tekst, np. „W analizie”, „Brakuje transportu”, „Udział potwierdzony”. Kolor jest dodatkową wskazówką.

## 4. Typografia i układ

**Podstawowy krój: Source Sans 3**, z zestawem znaków obsługującym język polski. Jeden krój w całej aplikacji; lokalnie hostowane pliki fontu. Fallback: `system-ui, sans-serif`.

| Element | Rozmiar | Grubość | Interlinia |
|---|---|---|---|
| Nagłówek strony | 32 px desktop / 28 px telefon | 700 | 1,2 |
| Nagłówek sekcji | 24 px | 600–700 | 1,3 |
| Tytuł karty | 20 px | 600 | 1,3 |
| Tekst podstawowy | 16 px | 400 | 1,5 |
| Etykieta i przycisk | 16 px | 600 | 1,4 |
| Metadane i status | 14 px | 400–600 | 1,5 |

- Liczby kwot i statystyk: cyfry o stałej szerokości (`tabular-nums`).
- Dłuższy tekst: szerokość około 60–75 znaków w wierszu.
- Odstępy: skala 4, 8, 12, 16, 24, 32, 48, 64 px.
- Zaokrąglenia: pola i przyciski 8 px; karty 12 px; dialogi 16 px.
- Cienie delikatne, stosowane do elementów unoszących się nad treścią.
- Ikony liniowe, np. Lucide, o wspólnej grubości i rozmiarze 20–24 px. Przy działaniach tekstowych ikona towarzyszy etykiecie.
- Projektowane obszary dotykowe: minimum 44 × 44 px.
- Telefon: jedna kolumna. Tablet: jedna lub dwie. Desktop: listy z panelem szczegółów albo siatka kart.
- Mieszkaniec na telefonie: maksymalnie pięć głównych pozycji nawigacji. Urzędnik i admin: zwijane menu boczne, na telefonie dostępne z przycisku.
- Pierwsza wersja korzysta z jasnego motywu; motyw ciemny można dodać po weryfikacji głównych procesów.

## 5. Role

| Rola | Odpowiedzialność |
|---|---|
| Mieszkaniec | Zgłasza potrzeby, śledzi sprawy, ocenia propozycje, deklaruje wolontariat i wspiera zbiórki |
| Urzędnik | Obsługuje potrzeby swojej gminy, weryfikuje priorytet, wybiera innowację, akceptuje adaptację i koordynuje pilotaż |
| Admin | Zarządza bazą, źródłami, rolami, profilami gmin, moderacją i regułami platformy |

Wolontariusz to mieszkaniec deklarujący udział w zadaniu. NGO, biblioteki, CUS i inne instytucje mają profile partnerów oraz zasobów. W MVP ich deklaracje i potwierdzenia wprowadza koordynator; samoobsługę partnerów można dodać później.

Demo może zawierać przełącznik trzech syntetycznych kont. Docelowo role i zakres dostępu przypisuje system, a uprawnienia egzekwuje także backend.

## 6. Mapa stron i podstron

### 6.1. Strony wspólne i publiczne

| Adres | Widok | Główna zawartość |
|---|---|---|
| `/` | Strona główna | Wyjaśnienie aplikacji, zgłoszenie potrzeby, lokalne inicjatywy, wolontariat i zbiórki |
| `/logowanie` | Logowanie | Dostęp do panelu; w demo wybór konta syntetycznego |
| `/innowacje` | Katalog innowacji | Wyszukiwanie semantyczne, filtry problemu, odbiorców i wymaganych zasobów |
| `/innowacje/:id` | Karta innowacji | Opis, wymagania, źródła, udokumentowane wyniki i widoczne braki informacji |
| `/pomoc` | Pomoc | Proces obsługi zgłoszeń, znaczenie ocen i kontakt z Hubem |
| `/prywatnosc` | Informacje o danych | Zasady korzystania z danych i kontakt |
| `/dostepnosc` | Informacje o dostępności | Stan dostępności i kanał zgłaszania problemów |

### 6.2. Mieszkaniec

| Adres | Widok | Główna zawartość i działanie |
|---|---|---|
| `/mieszkaniec` | Moja gmina | Wybór gminy, lokalne potrzeby, inicjatywy i skróty działań |
| `/mieszkaniec/zgloszenia/nowe` | Dodaj zgłoszenie | Formularz krokowy, podobne potrzeby, podsumowanie |
| `/mieszkaniec/zgloszenia` | Moje zgłoszenia | Statusy, daty i powiązane potrzeby |
| `/mieszkaniec/zgloszenia/:id` | Szczegóły zgłoszenia | Oś postępu, odpowiedź urzędu, możliwość uzupełnienia |
| `/mieszkaniec/potrzeby` | Potrzeby w gminie | Zanonimizowane podsumowania, filtry, „Mnie też to dotyczy” |
| `/mieszkaniec/potrzeby/:id` | Szczegóły potrzeby | Problem, propozycje, postęp oraz powiązany wolontariat i zbiórka |
| `/mieszkaniec/ocen` | Oceń rozwiązania | Karty przesuwane prawo–lewo i równoważne przyciski |
| `/mieszkaniec/wolontariat` | Wolontariat | Zadania, lokalizacja, terminy, wymagane umiejętności i wolne miejsca |
| `/mieszkaniec/wolontariat/:id` | Szczegóły zadania | Obowiązki, dostępność, deklaracja udziału i status potwierdzenia |
| `/mieszkaniec/zbiorki` | Zbiórki | Cele, postęp, terminy i filtry gminy |
| `/mieszkaniec/zbiorki/:id` | Szczegóły zbiórki | Cel, budżet, organizator, aktualizacje i symulowana wpłata w demo |
| `/mieszkaniec/profil` | Profil | Gmina, preferencje powiadomień, deklaracje wolontariatu i historia ocen |

### 6.3. Urzędnik

| Adres | Widok | Główna zawartość i działanie |
|---|---|---|
| `/urzednik` | Pulpit gminy | Sprawy wymagające uwagi, oczekujące decyzje, pilotaże i luki zasobów |
| `/urzednik/potrzeby` | Kolejka potrzeb | Grupowanie zgłoszeń, priorytet, liczba sygnałów, filtry i przypisanie odpowiedzialności |
| `/urzednik/potrzeby/nowa` | Potrzeba instytucjonalna | Rozpoczęcie procesu przez urząd lub w imieniu partnera |
| `/urzednik/potrzeby/:id` | Analiza potrzeby | Zgłoszenia składowe, uzasadnienie AI, źródła, niewiadome i decyzja urzędnika |
| `/urzednik/potrzeby/:id/dopasowania` | Dopasowane innowacje | Propozycje, uzasadnienia, bariery, wymagane zasoby i wybór rozwiązania |
| `/urzednik/gmina` | Profil i zasoby gminy | Lokale, kadra, transport, dostępność, budżet i lokalne ograniczenia |
| `/urzednik/partnerzy` | Katalog partnerów | Profile instytucji, zasoby i rzeczywista dostępność |
| `/urzednik/partnerzy/:id` | Profil partnera | Kompetencje, zasoby, terminy, warunki i aktualność deklaracji |
| `/urzednik/wdrozenia` | Lista wdrożeń | Projekty, etapy, koordynatorzy i gotowość |
| `/urzednik/wdrozenia/:id` | Przegląd wdrożenia | Potrzeba, innowacja, gmina, najbliższa decyzja i podsumowanie |
| `/urzednik/wdrozenia/:id/adaptacja` | Karta adaptacji | Co przenieść, co zmienić, bariery, niewiadome, edycja i akceptacja |
| `/urzednik/wdrozenia/:id/koalicja` | Koalicja i zasoby | Macierz wymagań, partnerzy, potwierdzenia, luki i szukanie zastępstwa |
| `/urzednik/wdrozenia/:id/wolontariat` | Obsada zadań | Zadania, deklaracje dostępności, przyjęcie i odrzucenie zgłoszenia |
| `/urzednik/wdrozenia/:id/finansowanie` | Finansowanie | Budżet, środki gminy, luka, przygotowanie i zatwierdzenie zbiórki |
| `/urzednik/wdrozenia/:id/pilotaz` | Tablica pilotażu | Zadania, osoby odpowiedzialne, terminy, potwierdzenia i gotowość startu |
| `/urzednik/wdrozenia/:id/konsultacja` | Mentor i ustalenia | Prośba o konsultację, komentarze i historia decyzji |

Podstrony wdrożenia prezentujemy jako zakładki we wspólnej przestrzeni projektu. Każda zakładka ma własny adres, aby można było ją otworzyć bezpośrednio.

### 6.4. Admin

| Adres | Widok | Główna zawartość i działanie |
|---|---|---|
| `/admin` | Przegląd platformy | Sprawy do interwencji i stan bazy |
| `/admin/uzytkownicy` | Konta i role | Role, przypisanie gminy i zakres dostępu |
| `/admin/gminy` | Gminy i odpowiedzialność | Profile gmin i jednostki odpowiedzialne za tematy |
| `/admin/innowacje` | Baza innowacji | Dodawanie i edycja kart, wymagania, kompletność |
| `/admin/innowacje/:id` | Karta i źródła | Dokumenty źródłowe, aktualność, braki i stan indeksowania |
| `/admin/partnerzy` | Instytucje i zasoby | Profile, deklaracje i weryfikacja aktualności |
| `/admin/moderacja` | Moderacja | Zgłoszenia, duplikaty, korekta grupowania i powody decyzji |
| `/admin/reguly` | Reguły priorytetu | Czynniki, progi powiadomień i przypisanie obszarów |
| `/admin/zbiorki` | Nadzór nad zbiórkami | Organizator, zatwierdzenie, status i aktualizacje |
| `/admin/historia` | Historia zmian | Kto zmienił status, priorytet, źródło, kartę lub uprawnienia |

## 7. Kluczowe zachowania

### Zgłoszenia i priorytet

Formularz: opis problemu → gmina i kontekst → podobne potrzeby oraz podsumowanie. Mieszkaniec może dołączyć do istniejącej potrzeby albo utworzyć zgłoszenie dotyczące innej sytuacji.

Panel analizy pokazuje oddzielnie liczbę niezależnych zgłoszeń, pilność, skutki, skalę, lokalny kontekst, źródła i braki danych. LLM z RAG sugeruje grupowanie i ocenę, a urzędnik może je skorygować z uzasadnieniem.

Przekroczenie progu uruchamia skierowanie sprawy do odpowiedzialnego obszaru. Sprawy poniżej progu nadal są widoczne w kolejce; pojedynczy pilny sygnał może zostać przyjęty ręcznie. Głosy poparcia dla rozwiązania nie są automatycznie liczbą zgłoszeń problemu.

### Ocenianie rozwiązań

Karta oceny dotyczy propozycji dla konkretnej potrzeby. Zawiera opis, korzyści, ograniczenia, wymagane zasoby i odnośnik do źródeł.

- Prawo: „Popieram ten pomysł”.
- Lewo: „Mam zastrzeżenia”, z opcjonalnym wyborem przyczyny.
- Dodatkowe działania: „Pomiń”, „Zobacz szczegóły”, „Cofnij ocenę”.
- Równoważne przyciski działają dotykiem, myszą i klawiaturą.
- Wynik oceny to opinia społeczności. Wybór innowacji i akceptacja wdrożenia pozostają decyzjami człowieka.

### Adaptacja i koalicja

Karta adaptacji ma trzy stałe sekcje: „Przenosimy wprost”, „Zmieniamy lokalnie”, „Do ustalenia”. Proponowany pilotaż opisuje zadania, wymagane zasoby i warunki startu. Wyniki skuteczności pojawiają się tylko wtedy, gdy istnieją w źródłach.

Koalicja pokazuje macierz: wymagany zasób → partner → dostępność → stan potwierdzenia. Sprawdzamy także pojemność, miejsce, termin i warunki użycia. Stany: „Deklarowany”, „Zaproponowany do pilotażu”, „Potwierdzony”, „Wycofany”.

Wycofanie partnera lub zasobu aktualizuje gotowość pilotażu, pokazuje konkretną lukę i udostępnia działanie „Znajdź zastępstwo”.

### Wolontariat

Zadanie określa obowiązki, miejsce, termin, czas trwania, umiejętności i liczbę potrzebnych osób. Deklaracja mieszkańca ma status „Oczekuje na potwierdzenie”; koordynator zatwierdza udział. Potwierdzona pomoc może pokrywać odpowiedni zasób pilotażu.

### Crowdfunding

Zbiórka jest powiązana z zatwierdzonym rozwiązaniem lub etapem pilotażu. Pokazuje cel, kwotę zebraną i brakującą, termin, organizatora, budżet, aktualizacje oraz informację o dalszym postępowaniu po osiągnięciu lub nieosiągnięciu celu.

Brak środków pozwala urzędnikowi przygotować zbiórkę; publikacja wymaga świadomego zatwierdzenia. Oznaczenie „Pilne” towarzyszy konkretnemu terminowi i uzasadnieniu. W demo wpłaty i potwierdzenia płatności są symulowane.

## 8. Proponowane komponenty

To elementy UI i podstawy do adaptacji. Obsługa danych, uprawnień, ocen, potwierdzeń i finansowania należy do aplikacji.

| Komponent | Źródło | Zastosowanie | Zakres adaptacji |
|---|---|---|---|
| [Dashboard with Collapsible Sidebar](https://docs.21st.dev/@uniquesonu/components/dashboard-with-collapsible-sidebar) | 21st.dev | Szkielet panelu urzędnika i admina | Menu według roli, aktywny adres, polskie etykiety, wspólne tokeny |
| [Stack](https://reactbits.dev/components/stack) | React Bits | Przesuwane karty oceny | Kierunek głosu, zapis, cofnięcie, przyciski i zakończenie listy |
| [Stepper](https://reactbits.dev/components/stepper) | React Bits | Formularz zgłoszenia | Polskie kroki, walidacja, zachowanie danych i podsumowanie |
| [Advanced File Upload](https://21st.dev/@uniquesonu/components/advanced-file-upload) | 21st.dev | Załączniki i źródła | Typy i limity plików, etykiety, rzeczywisty zapis lub symulacja |
| [Card](https://ui.shadcn.com/docs/components/card) | shadcn/ui | Potrzeby, innowacje, zadania i zbiórki | Warianty wspólnej karty i jedno główne działanie |
| [Data Table](https://ui.shadcn.com/docs/components/data-table) | shadcn/ui | Kolejki spraw, użytkownicy i partnerzy | Kolumny, filtry, sortowanie, paginacja, widok telefonu |
| [Progress](https://ui.shadcn.com/docs/components/progress) | shadcn/ui | Cel zbiórki i pokrycie zasobów | Wartości tekstowe i rzeczywiste dane |
| [Calendar](https://ui.shadcn.com/docs/components/calendar) | shadcn/ui | Termin wolontariatu | Dostępne dni, godziny, pojemność i potwierdzenie |
| [Dialog](https://ui.shadcn.com/docs/components/dialog) | shadcn/ui | Deklaracja udziału, zastrzeżenia i wpłata demo | Krótkie formularze, walidacja i zarządzanie fokusem |
| [Tabs](https://ui.shadcn.com/docs/components/tabs) | shadcn/ui | Sekcje potrzeby i wdrożenia | Powiązanie z adresami podstron |
| [Timeline Rail](https://docs.21st.dev/@nayan_radadiya6/components/timeline-rail) | 21st.dev | Skrót etapów sprawy | Tekstowe statusy i czytelny wariant na telefon |
| [Progress Metric Card](https://docs.21st.dev/@makviesainte/components/progress-metric-card) | 21st.dev | Trend zgłoszeń lub wpłat | Jednostki, zakres dat i dostępny widok danych |
| [Magic Bento](https://reactbits.dev/components/magic-bento) | React Bits | Opcjonalne kafelki startowe mieszkańca | Spokojne efekty i lokalne teksty |
| [Animated List](https://reactbits.dev/components/animated-list) | React Bits | Opcjonalna krótka lista aktualizacji | Ograniczony ruch i zwykły wariant listy |

**Ważne szczegóły:**

- Stack obecnie przenosi przeciągniętą kartę na koniec stosu. Głosowanie prawo–lewo wymaga zmiany obsługi gestu; zobacz [kod źródłowy](https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Components/Stack/Stack.jsx).
- Progress Metric Card przedstawia liczbę i wykres trendu. Do procentu osiągnięcia celu zbiórki używamy komponentu Progress.
- Calendar wybiera daty; dostępność godzin i obsada zadań wymagają dodatkowego interfejsu oraz danych.
- Udostępnienie komponentu w katalogu nie potwierdza dostępności całego ekranu po adaptacji. Weryfikujemy wynikowe widoki.

Komponenty domenowe do złożenia z tych podstaw:

- `NeedCard`: potrzeba, gmina, skala i status.
- `SolutionVoteCard`: propozycja rozwiązania, źródła i działania oceny.
- `MatchExplanation`: dlaczego pasuje, bariery, źródła, niewiadome.
- `AdaptationEditor`: trzy sekcje adaptacji oraz akceptacja.
- `CoalitionResourceMatrix`: wymagania, partnerzy, dostępność, potwierdzenia i luki.
- `VolunteerTaskCard`: obowiązki, termin, liczba miejsc i zgłoszenie udziału.
- `FundraisingCard`: cel, zebrana kwota, termin, organizator i działanie wsparcia.

## 9. Dostępność i stany interfejsu

Cel produktu: WCAG 2.1 AA. W prototypie obowiązkowo sprawdzamy klawiaturę, etykiety i kontrast.

- Widoczny fokus, logiczna kolejność przechodzenia i możliwość zamknięcia dialogu klawiaturą.
- Etykiety pól stale widoczne; błędy przy polu i czytelne podsumowanie.
- Gesty mają alternatywę w postaci przycisków. Zadania pilotażu da się przenieść do etapu bez przeciągania.
- Statusy, priorytety i wykresy nie przekazują informacji wyłącznie kolorem.
- Ograniczenie animacji przy `prefers-reduced-motion`.
- Wykresy mają dostępny odpowiednik tekstowy lub tabelaryczny.
- Powiększenie tekstu i widok telefonu zachowują działania oraz kolejność treści.
- Każda lista i sekcja danych obsługuje ładowanie, brak danych, brak wyników, błąd i ponowienie.
- Formularz zachowuje wpisane wartości po błędzie; po sukcesie pokazuje dalszy krok.
- Szczególne stany: brak dopasowania, brak źródła, wycofany partner, niepotwierdzony wolontariusz, zakończona zbiórka i brak gotowości pilotażu.

## 10. Zakres MVP i demo

Najpierw realizujemy pełny proces na ograniczonej bazie. Liczba adresów nie oznacza osobnego projektu graficznego dla każdego widoku: wykorzystujemy wspólne szablony listy, szczegółów, formularza i przestrzeni wdrożenia.

**MVP:**

1. Wybór syntetycznego konta mieszkańca, urzędnika lub admina.
2. Formularz i status zgłoszenia, grupowanie w potrzeby oraz panel priorytetu.
3. Profil zasobów gminy, katalog innowacji i dopasowania ze źródłami.
4. Edytowalna karta adaptacji i akceptacja człowieka.
5. Koalicja, potwierdzanie zasobów i wykrywanie luki po wycofaniu partnera.
6. Karty oceny rozwiązań i podsumowanie opinii.
7. Deklaracja wolontariatu oraz potwierdzenie koordynatora.
8. Zbiórka z symulowaną wpłatą i aktualizacją postępu.
9. Tablica pilotażu, zgłoszenie do mentora i prosty panel administratora.

Pełny profil użytkownika, rozbudowaną pomoc, historię zmian, automatyczne powiadomienia i samoobsługę partnerów rozwijamy po podstawowym demo. Rzeczywista obsługa płatności wymaga osobnego etapu integracji.

**Dane demo:** 15 opisów innowacji, 12 syntetycznych profili instytucji, dwie gminy i syntetyczne zgłoszenia. Bez prawdziwych danych osobowych i wrażliwych. Karty zaczerpnięte ze źródeł zachowują pochodzenie; materiały syntetyczne są oznaczone.

**Scenariusz:** dwie gminy zgłaszają samotność seniorów. Pierwsza ma bibliotekę i animatora; druga rozproszoną zabudowę i ograniczony transport. System proponuje różne adaptacje, zbiera koalicję, pozwala ocenić pomysły, zadeklarować pomoc i wesprzeć brakujący budżet. Wycofanie transportu ujawnia lukę, uruchamia szukanie zastępstwa i aktualizuje gotowość pilotażu.

## 11. Materiały odniesienia

- [Oficjalny opis wyzwania HubMI na HackYeah 2026](https://innowacyjna.malopolska.pl/pl/aktualnosci/hack-yeah5).
- [React Bits — katalog komponentów](https://www.reactbits.dev/get-started/index).
- [21st.dev — komponenty dashboardów](https://docs.21st.dev/blog/react-dashboard-components).
- [GOV.UK Design System — komponenty](https://design-system.service.gov.uk/components/).
- [USWDS — karty](https://designsystem.digital.gov/components/card/).
- Inspiracje Dribbble: [Community Dashboard](https://dribbble.com/search/community%20dashboard), [Nonprofit Dashboard](https://dribbble.com/search/non-profit-dashboard), [Charity Dashboard](https://dribbble.com/tags/charity%20dashboard).
