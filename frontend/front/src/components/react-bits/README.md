# React Bits w MBG

Komponenty pobrano z oficjalnego [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) (gałąź main, 2026-10-03):

- [AnimatedContent TS-CSS](https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Animations/AnimatedContent/AnimatedContent.tsx), GSAP + ScrollTrigger.
- [CountUp TS-CSS](https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/CountUp/CountUp.tsx), Motion.

Lokalne poprawki: widoczny domyślny stan AnimatedContent, gsap.matchMedia reagujące na reduced-motion, cleanup; CountUp z końcowymi wartościami bez ruchu i osobnym stabilnym tekstem dla czytnika ekranu. Zależności gsap i motion w package.json. Landing jest ładowany osobno przez React.lazy. Kopia licencji MIT + Commons Clause w LICENSE.md; komponenty są częścią aplikacji, nie odrębnym produktem bibliotecznym.
