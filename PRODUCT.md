# Małopolska bez granic — MBG

Produkt: polskojęzyczna inicjatywa łącząca potrzeby mieszkańców Małopolski z istniejącymi innowacjami społecznymi. Nazwa i skrót pochodzą z polecenia właściciela z 3 października 2026. Pełna prawda produktowa pozostaje w README.md; architektura w PLAN_IMPLEMENTACJI.md. Ten plik nie zastępuje tych dokumentów.

Odbiorcy: mieszkańcy, organizacje i instytucje w roli użytkownika; administrator moderujący treści i podejmujący decyzje o pilotażach. Dwa syntetyczne konta demo. Publiczny landing jest wizytówką inicjatywy; funkcje docelowej aplikacji wymagają sesji.

Priorytet: zgłoszenie → korekta sugestii AI → jawne potwierdzenie potrzeby albo nowa potrzeba → do dziesięciu trafnych innowacji ze źródłami i ograniczeniami. Następnie katalog, potrzeby lokalne, pomysły, poparcie, adaptacje, pilotaże, udział i ewaluacja. Pomysł przechodzi AI, potwierdzenie autora i decyzję administratora. Brak płatności, prawdziwego uwierzytelniania, powiadomień zewnętrznych i integracji służb.

Aktualny interfejs: responsywna aplikacja React dla mieszkańca i administratora, z pełnymi ścieżkami UI opartymi na syntetycznych potrzebach, zgłoszeniach, kontach i pilotażach. To działający frontend demonstracyjny: logowanie, AI, geokodowanie oraz operacje biznesowe wymagają integracji z backendem.

Zatwierdzone wymagania estetyczne: rysunkowy, animowany styl zgodny z pierwszym kadrem planszy właściciela; dostarczone logo krajobrazowe; płaskie przyciski bez gradientów; biały dashboard i granatowy tekst; rzeczywiste komponenty React Bits na landingu; stosowanie Impeccable, UI/UX Pro oraz Taste. Ostatnie polecenie zastępuje wcześniejszą zgodę na fotografie: interfejs używa lokalnych ilustracji, bez zdjęć prawdziwych ludzi. Lokalnie hostowana typografia z polskimi znakami. Dostępność i spokojne formularze mają pierwszeństwo przed dekoracją; reduced-motion wyłącza ruch, zachowując treść.

Kierunek wykonania: kodowy, klikalny prototyp React/TypeScript/Vite z atlasem ekranów. Istniejące home-v1 i landing-v2 zachowujemy jako historyczne wersje. Właściciel określił zakres i kierunek wprost; nie otwieramy ponownie decyzji o nazwie, rolach ani zakresie.
