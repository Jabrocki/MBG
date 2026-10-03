# MBG — aktualizacja według planszy właściciela

## THESIS

Potrzeba mieszkańca prowadzi do istniejącego rozwiązania; wizytówka MBG ma zapraszać do wspólnego działania w rysunkowej Małopolsce.

## OWN-WORLD

Kierunek wskazany wprost przez właściciela: regionalny flat cartoon, dostarczone logo krajobrazowe, granat/zieleń/pastelowe powierzchnie. Nie wybieramy nowego świata z seeda.

## STORY

Obietnica wspólnego rozwiązywania → zgłoszenie lub biblioteka → wybór konta z zachowaną intencją → istniejący przepływ zgłoszenia i potwierdzenia. Prototyp nie udaje rzeczywistych efektów społecznych.

## FIRST VIEWPORT

Logo i nawigacja u góry; duży granatowo-zielony nagłówek oraz dwa przyciski po lewej; rysunkowa panorama i postacie po prawej; biała belka informacji w dolnej części. Telefon zachowuje kolejność treści i głównych działań.

## FORM

Przekład pierwszego kadru planszy na responsywny React/CSS z lokalnym rastrowym artworkiem, a nie screen jako płaski obraz. Przyciski są jednolite; formularze i panele służą obsłudze, bez ciągłej choreografii.

## QUALITY BAR

Bez zdjęć prawdziwych osób i zewnętrznych żądań obrazów; dostarczone logo zamiast dawnego znaku; czytelne tło dashboardu; odnajdywalne CTA i zachowana intencja po wyborze konta; działające React Bits z końcowymi wartościami i widoczną treścią w reduced-motion. Wzorcem kompozycji i medium jest pierwszy kadr planszy właściciela. Zgodność geometrii jest oceniana wizualnie, bez twierdzenia o kopii pixel-perfect ani pełnym audycie WCAG.

Aktualne polecenie ma pierwszeństwo przed mbg-v3. Pierwszy kadr dostarczonej planszy określa landing: granatowo-zielony nagłówek po lewej, rysunkowi mieszkańcy i panorama Krakowa po prawej, biała belka informacji na dole, jasny header we wspólnej zaokrąglonej ramie. Dostarczone logo krajobrazowe zastępuje poprzedni znak. Lokalnie hostowane Bricolage Grotesque i IBM Plex Sans pozostają.

Zamiast fotografii: lokalna rysunkowa scena wygenerowana według planszy, żadnych zewnętrznych zdjęć. Na telefonie zachowana kolejność celu, przycisków, sceny i informacji. Liczby odzwierciedlają demonstracyjne fixtures (3 innowacje,4 potrzeby,2 konta,1 pilotaż), nie fikcyjne osiągnięcia. Nie kopiujemy niepopartych źródłami procentów dopasowania ani ról/operacji niezgodnych z README.

Ruch: komponenty Animated Content (GSAP) i Count Up (Motion) z oficjalnego repozytorium React Bits. Jedna sekwencja wejścia ilustracji, nagłówka i informacji, bez nieskończonych efektów na formularzach. Wszystkie elementy mają widoczny stan bazowy; żywa zmiana preferencji reduced-motion jest obsługiwana. Kod animacji ładowany osobno, tylko na landingu. Przyciski bez gradientów.

UI/UX: białe płótno landingu i dashboardu, neutralne obramowania; primary #00834a, tekst #0c2941, boczna nawigacja i pastelowe skróty. Intencja z landingu (zgłoszenie, innowacje, mapa) jest zachowana po wyborze profilu. Istniejące bramki publikacji, walidacja i alternatywne ścieżki pozostają.

Tryb: rozwój istniejącego prototypu React/Vite; operacyjne widoki są nadal demonstracyjne. Cała macierz45 ekranów × desktop/mobile; atlas i lokalna galeria aktualizowane po zmianie stylu. Nie jest to audyt WCAG ani gotowa integracja z backendem. Odniesienie: plik planszy codex-clipboard-2930af2d-a517-42f2-a40b-98c0b1350936.png i logo krajobrazowe właściciela. Ilustracja odtwarza język planszy, nie jest kopią pikselową całego UI.
