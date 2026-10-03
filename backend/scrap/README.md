# Scraper biblioteki innowacji ROPS

Python 3.9+ i Scrapy. Każda innowacja trafia do osobnego pliku Markdown
w `backend/data` (ścieżka wyznaczana względem skryptu, niezależnie od katalogu uruchomienia).

## Instalacja

Uruchom w `backend/scrap`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Jedna innowacja — test

```bash
python scrape.py --url 'https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow,bawita'
```

Zapisuje `backend/data/bawita.md`. Pobiera jedną stronę innowacji i `robots.txt`.
Kategorie w tym trybie pochodzą ze wskazanej strony; pełny zbiór przypisań
kategorii wymaga `--all`.

## Wszystkie innowacje

```bash
python scrape.py --all
```

Odkrywa kategorie z katalogu, odwiedza listy (z obsługą paginacji), pobiera
szczegóły innowacji. Wpisy o tym samym identyfikatorze (slug po przecinku
w adresie ROPS) są scalane; plik zawiera wszystkie odkryte kategorie.

Opcjonalny katalog docelowy: `--output /sciezka/do/danych`.
Tryby `--all` i `--url` wykluczają się, trzeba wybrać jeden.

## Zawartość plików

- Metadane YAML: identyfikator, tytuł, źródło, URL, data pobrania UTC,
  kategorie (nazwa, slug, URL).
- Sekcje: Dowiedz się więcej, Zobacz film, Pobierz materiały,
  Zasady wykorzystania, Pozostałe linki.
- Opis z oryginalnymi nagłówkami, autorami i grupą docelową.
- Brakujące linki są oznaczone. Adresy względne są zamieniane na pełne.

Scraper zapisuje **linki**, nie pobiera PDF-ów, ZIP-ów ani filmów i nie
sprawdza ich dostępności. ROPS informuje, że część linków jest nieaktywna
podczas przebudowy biblioteki.

Powtórne uruchomienie aktualizuje pliki tych samych innowacji, nie usuwa
pozostałych plików. Zapis jest atomowy. Przy błędach poprawnie pobrane wpisy
zostają zapisane, ale proces zwraca kod 1 (również przy pustym wyniku).
Scraper respektuje robots.txt, ogranicza częstotliwość zapytań i ponawia
przejściowe błędy. Pełnego pobrania nie uruchamiano w ramach testu.

## Testy offline

```bash
python -m unittest discover -s tests -v
```

Fixture pochodzi ze strony BaWita. Testy nie pobierają innych innowacji.
