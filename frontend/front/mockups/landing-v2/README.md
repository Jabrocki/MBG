# HUBMI: minimalistyczny landing, kierunek v2

Aktualizacja z 3 października 2026 na podstawie nowego polecenia właściciela projektu. [Desktop](desktop.png), [telefon](mobile.png), [prompty generacji i korekt](prompts.md).

## Cel i zmiana względem v1

Landing jest wizytówką inicjatywy przed wejściem do aplikacji. Wyjaśnia potrzeby mieszkańców, dopasowanie istniejących innowacji, rozwijanie pomysłów i lokalne pilotaże. Wcześniejszy [home-v1](../home-v1/README.md) pozostaje koncepcją pulpitu po zalogowaniu. Nie zastępujemy nim obecnej strony prezentacyjnej.

Nowe polecenie autoryzuje stronę informacyjną przed logowaniem. Zgłoszenia, rzeczywisty katalog, prywatne sprawy i funkcje aplikacji nadal wymagają sesji. `Wypróbuj HUBMI` oraz `Zaloguj się` prowadzą do wyboru konta demo; pozostałe pozycje nawigacji są kotwicami tej strony.

## Kompozycja

- Prosta nawigacja i hero z hasłem „Potrzeby ludzi. Pomysły, które pomagają.”
- Krótkie przedstawienie inicjatywy i główne działanie widoczne od początku.
- Fotografia rozmowy w lokalnej bibliotece, ilustrująca społeczny kontekst.
- Trzy kroki: opis potrzeby, poznanie innowacji, dalsze działanie.
- Perspektywa mieszkańca i instytucji, bez wprowadzania nowej roli.
- Krótkie FAQ, ponowienie głównego działania i spokojna stopka.
- Telefon: jedna kolumna, brak nawigacji aplikacyjnej u dołu; zdjęcie procesu pominięte, tekst procesu zachowany.

## Typografia i powierzchnie

Nowa propozycja dla landingu: Bricolage Grotesque w nagłówkach i IBM Plex Sans w tekście. Wyraziste nagłówki bez dekoracyjnego szeryfu, czytelny tekst, duże odstępy między sekcjami i niewiele obramowań. W implementacji trzeba hostować faktyczne fonty z polskimi znakami; obraz generowany nie gwarantuje identycznego odwzorowania fontu.

Paleta zachowuje Friendly Civic Tech: ivory `#FAF8F3`, tekst `#172B26`, główna zieleń `#146B52`, pale mint `#E7F2EC`. Motyw jasny. Przyciski mają jednolite zielone wypełnienie, bez gradientów, połysku, shimmeru, poświaty i tekstur. W kodzie użyć `background-color: #146B52; background-image: none;`; kolor hover zmienia się równomiernie na `#105740`. Generator pozostawia drobne odchylenia pikseli; specyfikacja CSS jest docelową regułą.

Proponowane parametry Taste: `DESIGN_VARIANCE=4`, `MOTION_INTENSITY=2`, `VISUAL_DENSITY=3`. Minimalizm ma wspierać zrozumienie inicjatywy, nie usuwać treści procesu.

## Inspiracje i ich zastosowanie

- [Government Service Website for Award Management, Saimun Jubayer Shoyeb / Nodus Labs](https://dribbble.com/shots/26886767-Government-Service-Website-for-Award-Management): spokojna zieleń, hierarchia i objaśnienie procesu jako inspiracja. Bez kopiowania treści, gradientów przycisków, statystyk, opinii czy oznaczeń administracji publicznej. Odczytano opis, paletę i informacje o wizualizacji z indeksu obrazów.
- [21st.dev: Hero with image, text and two buttons](https://21st.dev/@tommyjepsen/components/hero-with-image-text-and-two-buttons): rozdzielenie zdjęcia, komunikatu i działań. [Navigation Menus](https://21st.dev/community/components/s/navigation-menu) i [Accordions](https://21st.dev/community/components/s/accordion): inspiracja dla nagłówka i FAQ, dostosowana do tokenów HUBMI.
- [React Bits: Split Text](https://reactbits.dev/text-animations/split-text): ewentualne krótkie odsłonięcie nagłówka według linii zamiast animowania każdej litery. [Animated Content](https://reactbits.dev/animations/animated-content): ewentualne delikatne wejście treści procesu. Przejrzano kod źródłowy obu komponentów; obsługę reduced motion i domyślną widoczność treści należy dodać podczas adaptacji. Makieta przedstawia stan statyczny, nie wdrożone animacje.

Skille: Taste dla wizytówki i kompozycji, Impeccable w trybie Persuade dla hierarchii i selekcji elementów, UI UX Pro Max dla czytelności, nawigacji i responsywności. Wyszukiwarka UI UX Pro Max wskazała Minimalism & Swiss Style; automatyczna niebieska paleta nie zastąpiła palety HUBMI. Wyniki doboru fontów potraktowano krytycznie: ogólne pary szeryfowe nie pasowały; Bricolage jest świadomą propozycją projektową, nie zweryfikowanym wynikiem tego wyszukiwania.

Nie instalowano komponentów 21st.dev/React Bits. To mockupy obrazowe i wskazówki do przyszłej implementacji, nie claim o działającym kodzie.

## Zasady treści i wdrożenia

Fotografie zostały wygenerowane jako ilustracje scen współpracy. Nie przedstawiają rzeczywistych beneficjentów ani świadectw działania HUBMI. Brak fikcyjnych liczb, ocen, rekomendacji, płatności i afiliacji. Stopka opisuje prototyp wspierający hub, nie oficjalną stronę instytucji.

FAQ: istniejące pomysły nie są konieczne; funkcje aplikacji wymagają logowania; AI sugeruje, człowiek potwierdza powiązania, a administrator zatwierdza publikację i start pilotażu. Rozwinięte pytanie ma dostępne przyciski i jawny stan `aria-expanded` w przyszłym kodzie.

Przy implementacji: mobile reflow do 320 CSS px, cele dotykowe minimum 44 × 44 px, widoczny fokus, kontrast, alternatywy zdjęć, menu klawiaturą, `prefers-reduced-motion`, treść widoczna również bez animacji/JS. Kolor hover i stany loading/error logowania muszą być jednoznaczne. Nie deklarować zgodności WCAG na podstawie obrazów.

Wbudowane ImageGen: wygenerowano desktop i mobile, następnie po jednej korekcie każdego obrazu dotyczącej wypełnienia przycisków. Przejrzano finalne obrazy pod kątem tekstów, układu i kluczowych ograniczeń. Nie wykonywano audytu działającego UI ani testów przeglądarkowych. Poprzednie pliki zachowano.

