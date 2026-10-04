# Plan pełnej integracji MBG

Ten plan przekłada zachowania opisane w `README.md` i zadania z `tasks.md` na kolejne wdrożenia.  Wszystkie dane przykładowe pozostają syntetyczne, ale każdy widok aplikacji ma korzystać z trwałego API zamiast lokalnej symulacji.

## Zasady wspólne

- Rejestracja tworzy wyłącznie konto użytkownika. Administrator jest konfigurowany po stronie serwera i loguje się tym samym formularzem.
- Interfejs nie zawiera przycisku „demo”. Syntetyczne rekordy są zwykłymi rekordami katalogu lub bazy danych widocznymi po zalogowaniu.
- Pojedyncze zgłoszenia oraz ich dokładne pozycje są prywatne. Wspólne potrzeby są prezentowane jako agregaty.
- Każdy widok ma stan ładowania, pusty wynik, błąd i możliwość ponowienia żądania.

## 1. Dostęp i sesja

1. Rejestracja, logowanie hasłem, wylogowanie oraz odtworzenie sesji po odświeżeniu strony.
2. Ochrona wszystkich danych aplikacji przez token Bearer i blokada tras administratora dla użytkownika.
3. Konfigurowane konto administratora na serwerze, bez hasła w repozytorium i bez eskalacji roli przez formularz rejestracji.

**Weryfikacja:** rejestracja → `GET /auth/me` → wylogowanie; osobny login administratora i odmowa dostępu do `/admin/*` dla użytkownika.

## 2. Zgłoszenie, mapa i dopasowanie (E1)

1. Prawdziwy wybór lokalizacji na mapie OpenStreetMap albo telefoniczna geolokalizacja po zgodzie użytkownika; ręczny wybór pozostaje fallbackiem.
2. Wysłanie współrzędnych do API, walidacja Małopolski, korekta kategorii i jawne potwierdzenie grupowania.
3. Mapa potrzeb pobiera markery z API według środka i promienia; widzi wyłącznie własne dokładne zgłoszenia oraz prywatnościowo bezpieczne agregaty.
4. Wyniki używają prawdziwych współrzędnych semantycznych z backendu, a zwykła lista pozostaje dostępna obok wizualizacji 3D.

**Weryfikacja:** kliknięcie punktu → raport → problem → maksymalnie dziesięć wyników; test GPS z odmową pozwolenia i test ochrony prywatności markerów.

## 3. Katalog i źródła

1. Katalog, wyszukiwarka, kategorie i szczegóły pobierają rekordy API.
2. Markdown z materiałów źródłowych jest bezpiecznie zamieniany na czytelne sekcje; metadane techniczne i adresy `local://` nie trafiają do użytkownika.
3. Każdy rekord ma źródło, ograniczenia i działający link zewnętrzny tylko wtedy, gdy źródło rzeczywiście go podaje.

**Weryfikacja:** brak surowych znaków Markdown na kartach, brak zdublowanych fixture’ów oraz test regresji parsera treści.

## 4. Pomysł, kolejka AI i poparcie

1. Draft → kolejka AI → potwierdzenie autora → decyzja administratora → karta publiczna.
2. Publiczne karty i głosowanie `Popieram` / `Pomijam` / cofnięcie korzystają z API oraz respektują jeden głos na użytkownika, rozwiązanie i potrzebę.
3. Wątki dyskusji i powiadomienia pokazują trwałe dane API.

**Weryfikacja:** test integracyjny obejmuje cały łańcuch publikacji, zmianę głosu oraz widoczność publiczną dopiero po decyzji administratora.

## 5. Pilotaże, zasoby i ocena

1. Lista i szczegóły pilotaży są odczytywane z API; administrator tworzy pilotaż i przeprowadza tylko do dozwolonych stanów.
2. Użytkownik zapisuje się jako wolontariusz, rezygnuje, odbiera ofertę miejsca z listy oczekujących i wysyła ocenę satysfakcji.
3. Panel administratora pokazuje niespełnione warunki startu, zatwierdza budżet, właściciela, partnerów i plan testu, a następnie zarządza kolejką wolontariuszy.

**Weryfikacja:** test przejść stanów, pojemności, listy oczekujących, ręcznej promocji i odrębności głosu społeczności od oceny satysfakcji.

## 6. Adaptacje, moderacja i panel administratora

1. Adaptacja wybranej innowacji zapisuje parametry instytucji i pobiera wygenerowany szkic.
2. Administrator używa rzeczywistych akcji: ocena raportu, scalanie/dzielenie problemów, przegląd duplikatów, decyzje dla pomysłów i pilotaży.
3. Autor zgłoszenia jest widoczny wyłącznie administratorowi.

**Weryfikacja:** testy uprawnień dla każdej akcji administracyjnej, odświeżanie widoku bez utraty stanu oraz manualna ścieżka przeglądarkowa.

## 7. Testy końcowe i wdrożenie serwerowe

1. Testy jednostkowe backendu i frontendu dla kontraktów, stanów błędów oraz komponentów mapy.
2. Testy integracyjne HTTP dla E1, kont, pomysłów/głosów oraz pilotaży.
3. Test E2E w przeglądarce na wdrożonym serwerze: rejestracja, mapa, raport, dopasowanie, login administratora, decyzja, pilotaż i wylogowanie.
4. Budowa frontendu i restart API na `hackyeah`; kontrola `/healthz`, API oraz UI z portu publicznego.
