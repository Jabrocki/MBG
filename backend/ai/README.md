# Hubmi AI

Pakiet dostarcza niezależną od HTTP i bazy warstwę analizy zgłoszeń oraz wyszukiwania. Nie używa Ollamy: embeddingi tworzy lokalny Nomic z Hugging Face, a tekst generuje wymienialny klient Gemini.

`AiService` przyjmuje adapter repozytorium wektorowego od `backend/app`; nie tworzy migracji ani nie zarządza kolejką. Przed każdym wywołaniem Gemini usuwa e-mail, numer telefonu i kod pocztowy. Wyniki są wyłącznie propozycjami: zawierają wynik podobieństwa i źródło, nigdy nie przypisują automatycznie problemu ani nie zatwierdzają pomysłu.

## Konfiguracja

```bash
uv venv --python 3.14
uv pip install -e .
export GEMINI_API_KEY=...
PYTHONPATH=src python -m pytest tests
```

Model embeddingów: `nomic-ai/nomic-embed-text-v1.5`, `search_document:`, 512 wymiarów. Wyszukiwanie powinno używać tego samego modelu i kosinusowego indeksu po stronie adaptera. Produkcyjny adapter ma ograniczać liczbę wyników do 10, stosować filtr Małopolski i nie dopowiadać brakujących kosztów, dostępności ani wyników testów.

Odświeżanie danych jest realizowane przez `backend/scrap`; zapis jest hashowany, więc adapter powinien aktualizować wyłącznie zmienione fragmenty i zachowywać ostatnią poprawną wersję po błędzie źródła.
