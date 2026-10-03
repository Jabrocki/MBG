# HUBMI: strona główna, mockupy v1

Data: 3 października 2026. Widok użytkownika po zalogowaniu, proponowany adres `/start`. Podstawa: [plan implementacji](../../../../PLAN_IMPLEMENTACJI.md), [README produktu](../../../../README.md), [instrukcje frontendu](../../AGENTS.md) i [kierunek wizualny](../../FRONTEND_KIERUNEK.md).

## Pliki

- [desktop.png](desktop.png): pełny pulpit desktopowy.
- [mobile.png](mobile.png): ta sama strona w jednej kolumnie, z dolną nawigacją.
- [prompts.md](prompts.md): pełne prompty generacji i korekty mobilnej.

Wygenerowano wbudowanym narzędziem ImageGen. Obrazy są referencją do implementacji, nie działającym UI. Sprawdzono wizualnie desktop i telefon; mobilną nawigację poprawiono w jednej dodatkowej rundzie. Nie wykonywano testów przeglądarkowych ani audytu WCAG dla obrazów.

## Hierarchia i zachowanie

1. Nawigacja: Start, Potrzeby, Innowacje, Pomysły, Pilotaże. Konto i powiadomienia w nagłówku.
2. Lokalizacja do odkrywania potrzeb; nie wskazuje automatycznie miejsca nowego zgłoszenia.
3. Główne działanie `Zgłoś problem` prowadzi do `/zgloszenia/nowe`. Nie omija wyboru lokalizacji, analizy, korekty kategorii i potwierdzenia grupowania.
4. `Przeglądaj innowacje` otwiera katalog niezależny od zgłoszenia.
5. Potrzeby w okolicy: dystans i liczba unikalnych zgłaszających, bez procentowego „trendu”.
6. Własne sprawy: zgłoszenie z gotowymi dopasowaniami oraz prywatny pomysł oczekujący na potwierdzenie autora.
7. Desktop: kontekstowy skrót do pilotażu, tworzenia pomysłu i adaptacji dla instytucji.
8. Telefon: główne zadanie na początku; pilot dostępny z dolnej nawigacji. Dolny pasek ma rezerwę przestrzeni, nie zasłania ostatniej aktywności.

Dane zgłoszeń, potrzeby, odległości, liczby i pilotaż są syntetycznymi przykładami, oznaczonymi `Dane demo`. Pomysł oczekujący na potwierdzenie nie oznacza akceptacji administratora i nie jest kartą publiczną.

## Kierunek wizualny

Friendly Civic Tech: tło `#FAF8F3`, białe powierzchnie, tekst `#172B26`, primary `#146B52`, oszczędny akcent `#B84A1B`, jasna zieleń `#E7F2EC`. Typografia referencyjna: Source Sans 3. W implementacji użyć faktycznego lokalnego fontu, dokładnych tokenów i jednej rodziny ikon z biblioteki; ilustracja nie gwarantuje identycznego kroju czy wartości kolorów pikseli.

Użyto zasad Impeccable (Operate, hierarchia i spokojne stany), UI UX Pro Max (czytelność, dotyk i nawigacja) oraz Taste w zakresie zgodnym z aplikacją. Brak osobnej roli urzędnika, płatności i publicznego katalogu bez sesji.

## Stany do zachowania podczas implementacji

- **Pierwsza wizyta / brak aktywności:** zamiast prywatnych wpisów objaśnienie „Tu pojawią się Twoje zgłoszenia i pomysły” i skrót „Zgłoś problem”. Nie wyświetlać fikcyjnych spraw.
- **Ładowanie:** skeleton tylko w regionach listy i aktywności, z zachowaniem wysokości. Główne działanie zgłoszenia nie czeka na załadowanie danych lokalnych.
- **Brak potrzeb w obszarze:** tekst „Nie znaleźliśmy potrzeb w wybranej okolicy”, działania „Zmień obszar” i „Zgłoś problem”.
- **Błąd pobierania:** lokalny komunikat „Nie udało się pobrać potrzeb” i „Spróbuj ponownie”, bez usuwania reszty pulpitu.
- **Brak wyboru lokalizacji:** „Wybierz okolicę” i ręczny selektor. Odmowa geolokalizacji nie blokuje strony.
- **Brak sesji:** przejście do wyboru konta; bez prezentacji prywatnych aktywności.
- **Długie teksty i reflow:** nagłówki/akcje układać w kolejne wiersze na wąskim ekranie, nie kopiować mechanicznie gęstości obrazu.
- **Fokus i dotyk:** widoczny fokus, etykiety ikon, cele dotykowe 44 × 44 px, status z tekstem. Kontrast i zachowanie przy 320 CSS px sprawdzić w działającym UI.

Mockupy obejmują stronę startową. Lista rekomendacji, mapa odkrywania i semantyczne 3D należą do kolejnych ekranów M1/M2.

