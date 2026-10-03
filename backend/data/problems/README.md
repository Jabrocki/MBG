# Materiał o problemach społecznych

Ten katalog zawiera źródła i szkice problemów dla HUBMI. Nie zawiera innowacji; te są w sąsiednim katalogu [`../innovations`](../innovations). Żaden plik tutaj nie przypisuje problemu do innowacji.

## Struktura

```text
problems/
  _sources/
    <source_id>.json  odczytana treść źródła, metadane i ostrzeżenia
    <source_id>.pdf   zachowany oryginalny PDF, gdy źródłem jest PDF
  <source_id>.md      szkice AI po zatwierdzonym użyciu Gemini
```

`source_id` jest skrótem SHA-256 kanonicznego URL źródła. Plik JSON zawiera `text_sha256`, dzięki czemu importer wykrywa zmianę odczytanej treści. Pole `pages` ma numery stron PDF albo `null` dla HTML.


## Co może trafić do szkicu

Importer przyjmuje wyłącznie materiał mający cytowany dowód, że konkretny wynik dotyczy Małopolski.

- `problems` zawiera problemy wynikające ze statystyk lub agregacji doświadczeń opisanej w źródle.
- `synthetic_reports` zawiera zanonimizowane persony potraktowane jako syntetyczne zgłoszenia.

Persony nie są prawdziwymi zgłoszeniami, nie zwiększają liczby zgłaszających i nie mogą służyć jako statystyka. Persony spoza Małopolski oraz materiały bez potwierdzonego regionalnego zasięgu są pomijane. Dane ogólnopolskie nie stają się danymi Małopolski tylko dlatego, że opublikował je ROPS.

Każdy wygenerowany plik Markdown ma status `ai_draft_requires_review`, tekstowe cytaty dowodowe oraz numery stron. Model wskazuje pozycje cytatów, a importer wycina je z pobranej treści; człowiek nadal weryfikuje ich znaczenie i poprawność wniosku.

## Prywatność i źródła

Przed wysłaniem treści do Gemini importer lokalnie usuwa nazwiska, adresy e-mail, telefony i jedenastocyfrowe identyfikatory. Nie zapisuj klucza Gemini w tym katalogu ani w repozytorium.

`_sources` zawiera także Mapę Wyzwań Społecznych ROPS. Jej własny opis wskazuje zakres ogólnopolski, dlatego jest technicznie zablokowana w trybie `generate`. Lista pięciu przejrzanych raportów regionalnych oraz źródeł wyłączonych z interpretacji jest w [`SOURCES_REVIEW.md`](./SOURCES_REVIEW.md).

Źródła są pobierane przez [`../../scrap/scrape_problems.py`](../../scrap/scrape_problems.py). Instrukcje uruchamiania i ograniczenia opisuje [`../../scrap/README.md`](../../scrap/README.md).
