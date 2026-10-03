---
name: "Małopolska bez granic — MBG"
description: "Regionalny, minimalistyczny system łączący potrzeby mieszkańców z innowacjami społecznymi."
colors:
  paper: "#fff"
  surface: "#fff"
  ink: "#0c2941"
  muted: "#56665c"
  green: "#00834a"
  green-hover: "#006238"
  sage: "#e0f3df"
  dashboard: "#fff"
  landing-paper: "#fffefa"
  sidebar-surface: "#fbfffb"
  sidebar-active: "#d4efce"
  sidebar-active-ink: "#005c34"
  quick-green: "#ddf3d7"
  rust: "#a8492f"
  line: "#e1e5e3"
  input: "#77867b"
  focus: "#1e40af"
  badge-green-ink: "#235540"
  badge-yellow: "#faf0cf"
  badge-yellow-ink: "#76520b"
  badge-blue: "#e7eef5"
  badge-blue-ink: "#224966"
  badge-lavender: "#eee8f7"
  badge-lavender-ink: "#634876"
  badge-neutral: "#eeefea"
  notice-info: "#eaf0ed"
  notice-warning: "#faf0d7"
  notice-warning-ink: "#67470e"
  notice-success: "#e4eee4"
  notice-success-ink: "#1d503b"
  notice-error: "#f9e9e6"
  notice-error-ink: "#84271f"
  quick-blue: "#ddedff"
  quick-blue-ink: "#335e7b"
  quick-lavender: "#eee0fa"
  quick-lavender-ink: "#735284"
  quick-yellow: "#fff0bf"
  quick-yellow-ink: "#967021"
  nav-hover: "#f0f3eb"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, sans-serif"
    fontSize: "clamp(3.5rem, 6.15vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, sans-serif"
    fontSize: "clamp(2rem, 3.6vw, 3.35rem)"
    fontWeight: 600
    lineHeight: 1.13
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque Variable, sans-serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.13
    letterSpacing: "-0.025em"
  subheading:
    fontFamily: "Bricolage Grotesque Variable, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 600
    lineHeight: 1.13
    letterSpacing: "-0.025em"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.55
  metadata:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  button:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.25
  badge:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  badge: "6px"
  control: "8px"
  overlay: "10px"
  panel: "12px"
  hero: "22px"
  circle: "50%"
spacing:
  space-8: "8px"
  space-12: "12px"
  space-16: "16px"
  space-20: "20px"
  space-24: "24px"
  space-28: "28px"
  space-32: "32px"
  space-40: "40px"
  space-64: "64px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.sage}"
  button-icon:
    backgroundColor: "transparent"
    rounded: "{rounded.control}"
    width: "44px"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 13px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "28px"
  badge-green:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.badge-green-ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  badge-yellow:
    backgroundColor: "{colors.badge-yellow}"
    textColor: "{colors.badge-yellow-ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  badge-blue:
    backgroundColor: "{colors.badge-blue}"
    textColor: "{colors.badge-blue-ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  badge-lavender:
    backgroundColor: "{colors.badge-lavender}"
    textColor: "{colors.badge-lavender-ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  badge-neutral:
    backgroundColor: "{colors.badge-neutral}"
    textColor: "{colors.muted}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  notice-info:
    backgroundColor: "{colors.notice-info}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "18px 20px"
  sidebar-active:
    backgroundColor: "{colors.sidebar-active}"
    textColor: "{colors.sidebar-active-ink}"
    rounded: "{rounded.control}"
    padding: "13px 14px"
  quick-action:
    backgroundColor: "{colors.quick-green}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "23px 20px"
---

# Design System: Małopolska bez granic — MBG

## Overview

**Creative North Star: "Plakat domu kultury"**

MBG łączy lokalny charakter Małopolski z prostym, czytelnym interfejsem usług społecznych. Biel, wyraźna zieleń działań, granatowy atrament, szałwia i ceglasty detal tworzą spokojne tło dla charakterystycznej humanistycznej typografii. Lokalne rysunkowe ilustracje nadają marce konkretne miejsce. Dostarczone przez właściciela logo krajobrazowe jest aktualnym znakiem; interfejs nie używa zdjęć prawdziwych ludzi.

Na ekranach wprowadzających większą rolę mają obraz i duży tytuł. W aplikacji ciężar przechodzi na nazwy zadań, listy, pola formularzy i jawne stany. Minimalizm oznacza oszczędność dekoracji oraz jednoznaczne działania, przy zachowaniu potrzebnych etykiet, źródeł i objaśnień. Ten zapis opisuje istniejący prototyp, a nie pełną bibliotekę wszystkich przyszłych komponentów.

**Key Characteristics:**

- Lokalna rysunkowa ilustracja, logo krajobrazowe właściciela i animowane wejście landingu.
- Bricolage Grotesque w tytułach oraz IBM Plex Sans w tekście i kontrolkach.
- Białe płótno landingu i dashboardu, neutralne podziały, jednolite przyciski.
- Spokojne formularze, tekstowe statusy i wyraźny fokus klawiatury.

## Colors

Paleta jest ciepła i roślinna; pastelowe powierzchnie organizują zadania i stany, a ciemne kolory utrzymują czytelność tekstu. Normatywne wartości są w frontmatterze; nazwy odpowiadają aktualnym zmiennym lub zastosowaniom w CSS.

### Primary

- **Zieleń działania** (`green`, `green-hover`): główne przyciski, aktywne kroki, kontrolki wyboru i wskazanie bieżącego miejsca.
- **Szałwia** (`sage`): panele kontekstowe i wybrane filtry; aktywny sidebar ma odrębną parę `sidebar-active` / `sidebar-active-ink`, a zielony skrót własne tło `quick-green`.

### Secondary

- **Cegła** (`rust`): drobny regionalny akcent i wskaźnik nowych powiadomień.
- **Pastele zadań** (`quick-blue`, `quick-lavender`, `quick-yellow`): rozróżnienie skrótów; odpowiadające im ciemne tony służą ikonom na kołach.
- **Pastele statusów** (`badge-*`, `notice-*`): warianty małych etykiet i większych komunikatów. Odcienie skrótów oraz statusów są oddzielnymi istniejącymi wartościami; nie należy ich automatycznie scalać.

### Neutral

- **Białe tło** (`paper`, `dashboard`): wspólne płótno ekranów publicznych, aplikacji i stopki.
- **Biała powierzchnia** (`surface`): panele i pola. Nawigacja boczna pozostaje biała.
- **Granatowy atrament** (`ink`): podstawowy tekst i ciemne powierzchnie podpisów.
- **Przygaszony tekst** (`muted`): objaśnienia i metadane.
- **Neutralna linia podziału** (`line`): granice sekcji i powierzchni; **obrys pola** (`input`) jest mocniejszy, żeby kontrolkę dało się rozpoznać.
- **Niebieski fokus** (`focus`) i **czerwień komunikatu błędu** (`notice-error-ink`): stany funkcjonalne, niezależne od dekoracyjnego akcentu marki.

**The Jednolity Przycisk Rule.** Główne działania mają jednolite zielone wypełnienie; gradienty, połysk i shimmer nie należą do zatwierdzonego systemu przycisków.

## Typography

**Display Font:** Bricolage Grotesque Variable, fallback sans-serif.

**Body Font:** IBM Plex Sans, fallback sans-serif.

Fonty są importowane lokalnie przez Fontsource; IBM Plex Sans ma jawne pliki `latin-ext` oraz `latin` dla grubości 400, 500 i 600. Bricolage nadaje tytułom humanistyczny, plakatowy charakter. Plex utrzymuje spokojną czytelność dłuższych treści, pól i tabel. System nie wydziela rodziny monospace.

### Hierarchy

- **Display:** obietnica landingu; wariant `display` w frontmatterze opisuje bazowy desktop. Obowiązuje późniejszy override Civic.css: wariant 761–1100 px oraz mobilny do 760 px. Te warianty są zapisane w sidecarze.
- **Headline:** bazowy `h1` ekranów aplikacji. Do 760 px nagłówek strony ma 34 px; tytuł powitania jest osobnym wariantem.
- **Title / Subheading:** bazowe `h2` i `h3`. Panele, listy katalogu i sekcje landingu mają lokalne, udokumentowane w CSS korekty wielkości; nie wszystkie tytuły mają identyczny rozmiar.
- **Body:** tekst podstawowy. Objaśnienia stron i paneli mają zwykle maksymalnie 72ch, opisy katalogu 70ch, a powierzchnia strony do czytania 75ch.
- **Label / Metadata:** etykiety pól są wyraźniejsze od wskazówek. Drobny tekst zachowuje spokojniejszą grubość i większą interlinię.
- **Button / Badge:** kontrolki mają własne proporcje typograficzne; status pozostaje krótką etykietą tekstową.

**The Dwa Głosy Rule.** Tytuły korzystają z Bricolage Grotesque; treści oraz kontrolki z IBM Plex Sans. Dostarczone logo zachowuje własną typografię. Nowe ekrany kontynuują ten podział.

## Layout

Interfejs aplikacji ma boczną nawigację i płynną kolumnę treści. Na desktopie pasek boczny ma 224 px, a treść maksymalnie 1420 px z paddingiem 42px 46px 64px; administrator stosuje 36px 38px 64px. Do 1200 px pasek zwęża się do 190 px. Od 1700 px układ aplikacji jest ograniczony do 1700 px. Landing ma osobną ramę o maksimum 1600 px, szerokości calc(100% - 28px) i marginesie 14 px auto; do 760 px rama ma margines 8 px i szerokość calc(100% - 16px). W pierwszym widoku tekst i scena tworzą wspólne płótno, z belką danych demonstracyjnych na dole. Na telefonie kolejność to tekst i działania, scena, dane; dalsze sekcje zachowują lokalne marginesy.

Szczegóły stosują główną kolumnę i panel kontekstowy 240–310 px, oddzielone odstępem 28 px. Do 960 px układ przechodzi w jedną kolumnę. Skróty zadań przechodzą z czterech do dwóch kolumn; treści wprowadzające układają tytuł, wyjaśnienie i obraz pionowo. Do 760 px znika sidebar, pojawiają się menu mobilne i dolna nawigacja, treść ma padding 28px 20px 60px, pola dwukolumnowe stają się jednokolumnowe, a główne akcje formularza zajmują pełną szerokość. Do 360 px treść ma boczne marginesy 16 px.

Zapisana skala odstępów jest ekstraktem powtarzanych długości, nie nową matematyczną siatką. Układ nadal używa potrzebnych wartości lokalnych, m.in. paddingu pól i nawigacji. Typowa pionowa grupa treści ma gap 24 px; panel ma padding 28 px na desktopie, 22 px na telefonie i 18 px przy najmniejszym progu.

## Elevation & Depth

Większość powierzchni jest płaska. Głębię tworzą zmiany tonu, białe panele i cienkie neutralne obrysy. Karty skrótów reagują na hover małym przesunięciem, bez dodawanego cienia. Istnieją rozmyte cienie pod komunikatem toast i belką danych landingu; ta ostatnia znika na telefonie. Ich dokładne wartości i źródła zapisano w sidecarze; nie wyznaczają ogólnej skali cieni dla kart.

**The Płaska Powierzchnia Rule.** Zwykłe panele, listy i kontrolki budują hierarchię kolorem oraz obrysem. Cień istniejącego overlay nie jest domyślną dekoracją kolejnego ekranu.

## Shapes

Kontrolki, pozycje aktywnej nawigacji i komunikaty mają łagodne narożniki (`control`). Małe statusy są ciaśniejsze (`badge`), większe powierzchnie mają promień `panel`, a toast i popover `overlay`. Wspólna rama landingu ma na desktopie promień `hero`, na telefonie 16 px; sama ilustracja jest przycinana przez ramę. Koła są zarezerwowane przez istniejącą implementację dla awatarów, małych nośników ikon i numerów kroków. Grafiki, litery katalogu i niektóre karty mają lokalne warianty promienia; frontmatter nie udaje kompletnego katalogu każdej jednorazowej długości.

Obrysy paneli i pól są cienkie, jednolite i rozróżnione kolorem. Aktualny znak to dostarczone logo krajobrazowe: `frontend/front/public/brand/mbg-landscape.webp` jest optymalizowanym plikiem navbaru, a `mbg-landscape-original.png` zachowuje oryginał właściciela. Zachowuj proporcje i obraz źródłowy; nie zastępuj go tracingiem ani odtworzonym SVG. Standardowy logo-box ma 212 × 58 px, kompaktowy 168 × 48 px; warianty tablet/telefon mają osobne szerokości w Civic.css.

## Components

### Buttons

Przyciski są spokojne, płaskie i jednoznaczne. Primary używa zieleni oraz białego tekstu; secondary jest przezroczysty, z ciemnym tekstem i obrysem w kolorze pola. Oba mają wspólny padding i narożniki z frontmatteru, minimum wysokości 48 px, odstęp 12 px między tekstem i ikoną oraz grubość 600. Hover przyciemnia primary lub podkłada szałwię pod secondary; active przesuwa o 1 px. Zmiany tła i transformacji trwają 180 ms. Wyłączony przycisk ma opacity 0.5 i kursor `not-allowed`.

Przycisk ikony ma 44 × 44 px, transparentne tło i szałwiowy hover. Tekstowe odnośniki i działania mają zwykle minimum 44 px wysokości. Wspólna rodzina ikon to Phosphor, wariant regular; komponent `Icon` domyślnie ma 20 px i ukrywa dekoracyjną ikonę przed czytnikiem.

### Chips

Status `Badge` jest tekstową etykietą, nie przyciskiem. Warianty green, yellow, blue, lavender i neutral mają własne pary tła i tekstu. Filtry wyboru są osobną kontrolką: etykieta z checkboxem, promień control, obrys input i szałwiowe zaznaczenie. Kolor uzupełnia napis oraz stan kontrolki.

### Cards / Containers

`Panel` to biała, obrysowana powierzchnia z promieniem panel; `context-aside` jest szałwiowym panelem towarzyszącym. Katalog i kolejki często korzystają z otwartych wierszy przedzielonych linią zamiast powielania pudełek. Skróty zadań mają pastelowe tło, duży tytuł, koło z ikoną i strzałkę na końcu; hover przesuwa kartę o −3 px w 180 ms. Na telefonie układ skrótów pozostaje dwukolumnowy.

### Inputs / Fields

Pola mają biały środek, mocniejszy obrys input, promień control, padding 11px 13px i minimum wysokości 46 px. Etykieta jest powiązana przez `htmlFor` i `id`; wskazówka ma `aria-describedby`. Textarea pozwala zwiększać wysokość. Checkbox i radio używają zielonego accent-color. Globalny fokus ma niebieski obrys 3 px z odstępem 4 px. Wyszukiwarka przenosi fokus na cały kontener przez `focus-within` z odstępem 3 px. Zestawienie błędów zachowuje widoczny fokus po przejściu do niego.

### Navigation

Desktopowy sidebar używa pozycji o minimalnej wysokości 48 px. Bieżąca pozycja używa pary sidebar-active / sidebar-active-ink oraz grubości 600; hover jest jaśniejszy. Zakładki są poziome, z dolną linią i zielonym podkreśleniem aktualnej pozycji; w wąskim widoku przewijają się poziomo. Nawigacja mobilna ma dolny pasek pięciu pozycji oraz menu pozostałych tras. Bieżące miejsce ma również `aria-current`.

### Notices / Loading

`Notice` łączy ikonę, opcjonalny tytuł i tekst; info, warning, success i error są osobnymi parami kolorów. Błąd ma rolę alert. Stan ładowania ma tekst i kołowy wskaźnik obracający się w 1 s. Globalne `prefers-reduced-motion: reduce` wyłącza animacje oraz przejścia; informacja tekstowa nadal pozostaje.

### Landing / Motion

Rysunkowa scena używa lokalnej ilustracji i rzeczywistych komponentów React Bits: Animated Content (GSAP) oraz Count Up (Motion). Wejście nagłówka trwa 0.85 s, ilustracji 1.1 s, belki danych 0.7 s z opóźnieniem 0.35 s; CountUp używa parametru duration 1.4 s. Ruch pozostaje w landingu ładowanym przez React.lazy, bez przenoszenia go do roboczych formularzy. Zmiany prefers-reduced-motion są obsługiwane na żywo przez gsap.matchMedia i useReducedMotion; treść ma widoczny stan bazowy, a liczba tekstową alternatywę.

Źródła tego zapisu: `frontend/front/src/index.css`, `frontend/front/src/App.css`, późniejszy `frontend/front/src/Civic.css`, `frontend/front/src/ui.tsx`, `frontend/front/src/App.tsx`, `frontend/front/src/pages/Landing.tsx`, `frontend/front/src/components/react-bits`, `PRODUCT.md` i `frontend/front/mockups/mbg-v4/brief.md`. Kod rozstrzyga wartości; brief i zatwierdzone wymagania określają język opisu. Dokumentacja dotyczy aktualnego mbg-v4. Starsze warianty systemu, dawna paleta i Source Sans 3 nie zastępują obecnego kodu i polecenia właściciela. Zadeklarowane, ale nieużywane `--error` nie zostało uznane za normatywny kolor implementacji.

## Do's and Don'ts

### Do:

- **Do** używaj Bricolage Grotesque do tytułów i IBM Plex Sans do treści oraz kontrolek.
- **Do** zachowuj jednolite zielone przyciski i wspólne warianty primary oraz secondary.
- **Do** kontynuuj białe tło dashboardu, granatowy tekst i lokalne rysunkowe ilustracje.
- **Do** pokazuj tekstową etykietę stanu, widoczny fokus oraz powiązaną etykietę pola.
- **Do** dostosowuj układ szczegółów i formularzy do jednej kolumny według istniejących progów.
- **Do** respektuj reduced-motion i pozostawiaj tekstową informację o ładowaniu.

### Don't:

- **Don't** dodawaj gradientu, połysku ani shimmeru do przycisków.
- **Don't** zastępuj aktualnej typografii i palety historycznymi wariantami projektu.
- **Don't** zastępuj dostarczonego logo krajobrazowego starym znakiem, tracingiem ani odtworzonym SVG.
- **Don't** przenoś dekoracyjnej kompozycji landingu do roboczych formularzy i kolejek.
- **Don't** używaj zdjęć prawdziwych ludzi ani przedstawiaj danych syntetycznych lub ilustracji jako dowodu działania inicjatywy.
