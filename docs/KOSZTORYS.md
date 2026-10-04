# Kosztorys — 4 października 2026

Kwoty prac to szacunek odtworzenia zakresu przez wykonawcę przy założeniu **200 zł/h**, nie faktura za tę sesję i nie oferta dostawcy. Podatki/VAT zależą od sposobu rozliczenia. Nie przeliczamy USD po niezweryfikowanym kursie. Stawki serwera odczytano z API istniejącej instancji Vast.ai; dowód: audyt-serwera/instance-cost.json.

## Prace jednorazowe

| Zakres | Godziny | Koszt przy 200 zł/h |
|---|---:|---:|
| Projekt UI/UX i audyt | 24–40 | 4800–8000 zł |
| Frontend i responsywność | 40–80 | 8000–16 000 zł |
| Backend i integracje API | 32–64 | 6400–12 800 zł |
| AI i crawler | 16–32 | 3200–6400 zł |
| Wdrożenie i testy | 8–24 | 1600–4800 zł |
| **Odtworzenie obecnego zakresu razem** | **120–240** | **24 000–48 000 zł** |

Sam obecny pakiet audytu, poprawek UI/UX, optymalizacji i wdrożenia: orientacyjnie 12–24 h, **2400–4800 zł**. Ta kwota jest częścią wyceny pełnego zakresu, nie należy doliczać jej drugi raz. Koszt korzystania z Codex zależy od planu i rozliczeń konta; nie został odczytany i nie jest ujęty jako fikcyjna należność.

## Utrzymanie

| Pozycja | Kwota | Podstawa |
|---|---:|---|
| Obecna instancja 4 × RTX 5090 wraz z dyskiem | 1,95605 USD/h; 46,95 USD/dobę; **1427,92 USD/730 h** | Bieżąca stawka instancji, dysk już wliczony |
| Ruch sieciowy | około 6,67 USD/TB w każdym kierunku | Rozliczany według faktycznego transferu |
| Utrzymanie programistyczne | **800–1600 zł/mies.** | Założenie 4–8 h × 200 zł, zakres umowny |
| Niezależny backup | **20–100 zł/mies.** | Rezerwa budżetowa, nie potwierdzona oferta |
| Domena, jeśli potrzebna | **100–200 zł/rok** | Rezerwa budżetowa, nie potwierdzona oferta |
| TLS / licencje użytych komponentów open source | **0 zł dodatkowej opłaty licencyjnej** | Wdrożenie TLS wymaga czasu prac |
| Lokalne inferencje Ollama | W koszcie instancji GPU | Brak dodatkowej opłaty tokenowej dla lokalnej Ollamy; płatne usługi zewnętrzne osobno |

**Łącznie miesięcznie:** około **1427,92 USD + 820–1700 zł**, plus transfer, ewentualna domena i podatki. Przy innej liczbie godzin rachunek instancji się zmieni; samo zamknięcie przeglądarki nie zatrzymuje naliczania. Kwoty nie obejmują nieznanych płatnych integracji. Obecnej instancji nie skalowano ani nie zmieniano jej konfiguracji GPU. Docelową tańszą architekturę należy dobrać po pomiarze ruchu i wymagań modelu.
