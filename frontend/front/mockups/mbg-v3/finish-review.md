## verdict

Zakres: Verdict Pass siedmiu material_fixes z niezależnego finish review. Ponownie otwarto wszystkie 14 wymaganych viewport PNG; support.png po dodatkowym recapture pokazuje kompletną fotografię. Pozostałe zrzuty są ważne. Sprawdzono odpowiadający poprawkom kod oraz review-fixes-verification.json z dziewięcioma zakończonymi kontrolami regresji. Bez nowego przeglądu całej powierzchni, bez przeglądarki i bez drugiego detektora.

1. **resolved — publikacja pomysłu:** IdeaDetail dla stan=oferta używa tytułu i opisu publicznego fixture; prywatny szkic pozostaje odrębnym odczytem sessionStorage. Kod i kontrola regresji potwierdzają usunięcie mieszania treści.
2. **resolved — adaptacja:** AdaptForm zapisuje wszystkie pola do lokalnego JSON; Adaptation odczytuje organizację, miejsce, odbiorców, budżet, zasoby i ograniczenia. Wynik oraz informacja o deklaracji wykorzystują wprowadzoną kwotę; kontrola regresji potwierdza zachowanie edytowanych wartości.
3. **resolved — mapa:** AreaMap otrzymuje visibleIds z tego samego filtrowanego zestawu co lista i odrzuca pozostałe pinezki. Zaznaczenie przechodzi na dostępną potrzebę po zmianie promienia; kontrola regresji potwierdza spójność.
4. **resolved — błędy zgłoszenia:** Opis i miejscowość mają aria-invalid, opis błędu i wskazówki przez aria-describedby. Nieudany submit fokusuje podsumowanie; przycisk kieruje do odpowiedniego pola. Field zachowuje te powiązania i przypisuje label/htmlFor; kontrole regresji potwierdzają fokus oraz blokadę miejsca poza regionem.
5. **resolved — prawda komunikatu błędu:** DemoStatus nie obiecuje już zachowania niezapisanej treści po zastąpieniu formularza. Obecny komunikat jawnie opisuje ograniczenie tego podglądu; kontrola regresji potwierdza zmianę.
6. **resolved — budżet:** Każda pozycja jest sprawdzana jako skończona i nieujemna. Nieprawidłowe wartości mają błąd, blokują przycisk i handler zatwierdzenia; kontrola regresji potwierdza blokadę ujemnej pozycji.
7. **resolved — mobilne narzędzia przeglądu:** Mockupy zajmuje miejsce w górnym pasku. Ponowne report.png, participants.png i support.png pokazują brak wcześniejszego nakładania przycisku na tekst; CSS i kod potwierdzają usunięcie stałego overlayu.

## remaining

clear. Nie stwierdzono materialnych regresji w ocenionej partii. Ship obejmuje ocenione poprawki, nie całą powierzchnię. Wynik nie jest deklaracją pełnej zgodności WCAG.

disposition: ship
