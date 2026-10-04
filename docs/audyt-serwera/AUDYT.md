# Audyt wersji serwerowej — 4 października 2026

Badana aplikacja: http://179.255.106.231:26260, rzeczywiste API na porcie 26224. Zmiany bazują na uzgodnionej integracji 77f0ccc, a nie na wcześniejszym lokalnym prototypie. Ocena ekspercka po zmianach: **UI 8/10, UX 8/10**. To ocena jakości interfejsu, nie wynik badań z użytkownikami ani certyfikat dostępności. Nie przypisujemy serwerowi oceny początkowej z audytu innego prototypu.

## Wprowadzone poprawki

- Wyraźna główna akcja i możliwość kontynuacji szkicu na stronie Start; zachowane ilustracje i identyfikacja wizualna.
- Cztery kroki zgłoszenia, fokus przy walidacji, zachowanie opisu, odbiorców, lokalizacji i kroku w sesji danego konta; skuteczny reset. Korekty klasyfikacji pozostają po powrocie.
- Usunięto pozorny wybór anonimowości pojedynczego zgłoszenia, którego API nie obsługuje; interfejs informuje o ustawieniu konta.
- Wyszukiwanie katalogu z opóźnieniem 250 ms i ignorowaniem nieaktualnych odpowiedzi.
- Czytelne mobilne tabele z etykietami, aktywna nawigacja i zamykanie menu klawiszem Escape.
- Podział pakietów paneli, statyczny zestaw ikon, gzip zasobów i roczny cache plików z hashem. Frontend nadzorowany przez Supervisor.

## Zachowane ustalenia

Nie zmieniono backendu, kontraktu API, realnego logowania, mapy Esri, dotychczasowych stylów mapy i grafu ani generowania krótkiego tytułu przez Ollamę. Czerwony punkt potrzeby nadal jest nieklikalny, a tooltip pozostaje zielony. Porównanie z 77f0ccc nie wykazuje zmian w backendzie, api.ts, Public.tsx, App.css ani Civic.css.

## Weryfikacja na serwerze

Sprawdzono 26 istniejących widoków przy szerokości 1280 i 320 px: nagłówki i układ, brak poziomego przepełnienia oraz etykiety tabel. Nie jest to pełny test każdej akcji na każdej stronie. Dziewięć scenariuszy obejmowało szkic, reset, walidację, korektę klasyfikacji, wyszukiwanie, menu oraz zapis i potwierdzenie przez API. Syntetyczne zgłoszenie audytowe ma ID 122; potwierdzenie prowadzi do potrzeby 99 z trzema rzeczywistymi dopasowaniami. Dane testowe pozostawiono, nie kasowano istniejących danych. Użyto istniejącego konta administratora; osobna sesja zwykłego mieszkańca i pełny audyt uprawnień nie były przedmiotem tej weryfikacji.

Testy jednostkowe: 15 zaliczonych, kompilacja produkcyjna poprawna, lint bez błędów, z istniejącymi ostrzeżeniami zależności hooków. Dokumentacja dowodów: [pliki dowodowe](.), w tym desktop.json, mobile.json, flows.json i zrzuty ekranu. Weryfikacja kompresji obejmuje zgodność rozpakowanych zasobów z buildem, nagłówki gzip/cache, odmowę gzip;q=0 oraz działające API /healthz.

## Wydajność

Główny plik JavaScript zmalał z 620 683 do 255 200 B (58,9%). Łącznie główny pakiet, panel mieszkańca i sprite ikon to 515 466 B bez kompresji: około 17% mniej niż dawny monolit. Gzip głównego pliku to 78 479 B, panelu mieszkańca 69 159 B. Jest to pomiar rozmiaru zasobów, a nie dowód przyspieszenia całej aplikacji o 59%. Czasy odpowiedzi zdalnego serwera są zmienne; nie przeprowadzono wiarygodnego pomiaru Core Web Vitals ani optymalizacji czasu inferencji modelu.

## Pozostałe ustalenia audytu

1. **P1 — HTTP:** publiczne logowanie i API nadal korzystają z HTTP. Przed użyciem z realnymi danymi potrzebne HTTPS; HTTP ogranicza także przeglądarkowe GPS. Nie zmieniano samowolnie uzgodnionej konfiguracji adresów serwera.
2. **P2 — tekst AI:** backend może zwracać przepisany opis pod etykietą „Twoje zgłoszenie”; trzeba rozróżnić oryginał i interpretację modelu. Zachowano obecne zachowanie API.
3. **P2 — statusy:** część wartości API pozostaje po angielsku, np. confirmed; potrzebne spójne tłumaczenia.
4. **P2 — filtry:** lista kategorii zależy od otrzymanych wyników i może zmieniać się podczas wyszukiwania; docelowo powinna pochodzić ze stałej listy kategorii.
5. Ocena wymaga uzupełnienia o badania z mieszkańcami, obsługę czytników ekranu i niezależny audyt bezpieczeństwa przed szerszym wdrożeniem.
