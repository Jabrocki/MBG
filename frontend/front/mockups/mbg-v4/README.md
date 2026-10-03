# MBG — rysunkowy frontend

Aktualny kierunek właściciela: landing odtwarza kompozycję pierwszego kadru planszy, używa dostarczonego logo krajobrazowego i rysunkowej ilustracji. Bez zdjęć prawdziwych ludzi. Aplikacja ma białe tło dashboardu, granatowy tekst, neutralne obramowania i pastelowe skróty. Obowiązują [brief.md](brief.md), root DESIGN.md i frontend AGENTS.md.

Podgląd: `npm run dev -- --host 127.0.0.1 --port 5175`; `/` landing, `/start` dashboard, `/mockupy` atlas 45 ekranów, `/marka` logo i pobieranie. [Galeria wszystkich ekranów](../mbg-v3/index.html), screenshoty i raporty w katalogu mbg-v3 są odświeżone do bieżącego interfejsu; numer katalogu jest historyczny.

## Ruch i przepływ

Rzeczywiste komponenty [React Bits](https://github.com/DavidHDev/react-bits): Animated Content (GSAP/ScrollTrigger) i Count Up (Motion). Źródła, adaptacje i kopia licencji są w `src/components/react-bits`. Dodano widoczny stan bazowy, cleanup i reakcję na prefers-reduced-motion. Kod animacji ładowany osobno na landingu; panele robocze go nie pobierają. Przyciski są bez gradientów. Nie ma ciągłej choreografii formularzy.

Zgłoś problem, Poznaj innowacje i Mapa potrzeb zachowują cel podczas wyboru konta demo. Nie jest to rzeczywista rejestracja ani autoryzacja. Liczby 3 innowacje, 4 potrzeby, 2 konta i 1 pilotaż opisują fixtures, nie osiągnięcia inicjatywy.

## Materiały

- `public/brand/mbg-landscape-original.png`: logo właściciela skopiowane z dostarczonego pliku, grafika zachowana. `mbg-landscape.webp`: ten sam asset z przyciętymi przezroczystymi marginesami i zoptymalizowaną wielkością. Logo jest rastrowe. Dawne SVG nie są aktywną marką.
- `public/images/małopolska-hero.webp`: rysunkowa scena według planszy; [prompt](illustration-prompt.txt), oryginał `cartoon-source.png`. `community.webp` jest kadrem tego artworku. Ilustracje nie dokumentują prawdziwych osób ani wydarzeń. Nie ma zewnętrznych źródeł obrazów.
- `scripts/build-cartoon-assets.cjs`: odtwarzanie optymalizacji z zapisanych źródeł, wymaga Sharp jak skrypt galerii. Pochodzenie zapisane przy assetach.

## Weryfikacja

Build i lint; [90 capture / 8 przepływów](../mbg-v3/verification.json), [9 kontroli regresji](../mbg-v3/review-fixes-verification.json), [6 kontroli ruchu i wejścia](verification.json). Odtworzenie: `node scripts/check-cartoon.cjs`, `node scripts/check-mockups.cjs`, `node scripts/check-review-fixes.cjs`. Adres przez MBG_PREVIEW_URL, runtime przez MBG_RUNTIME_MODULES. Capture czekają na h1 strony ładowanej osobno, fonty i obrazy.

[Niezależny przegląd](finish-review.md) obejmuje referencję i 14 aktualnych viewportów. Świeży oddzielny agent użył instrukcji zastępczej Impeccable finish-reviewer, ponieważ runtime nie zawierał definicji shipped agent. Nie zadeklarowano kopii pixel-perfect ani pełnej zgodności WCAG. Backend, AI, bezpieczne sesje i operacje biznesowe pozostają do integracji.
