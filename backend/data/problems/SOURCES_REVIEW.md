# Przegląd pobranych źródeł

Data przeglądu: 3 października 2026. Zakres: 33 pliki JSON w `_sources`, z których osiem reprezentuje PDF-y. Ten raport kwalifikuje źródła do późniejszej, ostrożnej interpretacji. Nie tworzy problemów ani syntetycznych zgłoszeń.

## Zasada kwalifikacji

Do późniejszego przetwarzania można przekazać tylko fragment, który sam potwierdza zakres Małopolski. Nazwa ROPS, menu strony, adres w Krakowie oraz informacja o projekcie finansowanym regionalnie nie są samodzielnym dowodem dla każdego twierdzenia w raporcie.

Źródła historyczne zachowują rok badania. Nie opisują automatycznie obecnej sytuacji.

## PDF-y z potwierdzonym regionalnym zakresem

| Źródło | Rok | Zakres i zastosowanie | Status |
| --- | ---: | --- | --- |
| [Monitoring podmiotów ekonomii społecznej w Małopolsce](./_sources/0ee4418d69437924d551a091c4651609f438f435ad10b10cb0766bd537355533.json) | 2011 | Monitoring podmiotów ekonomii społecznej w Małopolsce; dane i wnioski muszą zachować rok. | Kandydat do problemów agregowanych. |
| [Przemoc w rodzinie w opinii Małopolan](./_sources/798ce6001108d312f07953ea7037094f188f81764412f4f4d8b4d73575b948f2.json) | 2011 | Raport wprost dotyczy opinii Małopolan. | Kandydat do problemów agregowanych. |
| [Potencjał małopolskich organizacji pozarządowych](./_sources/a795b2fc2835186a9bd7f6eb39327f8f596c1481818951337ff8884f5c2c452d.json) | 2010 | Raport o organizacjach pozarządowych w Małopolsce. | Kandydat do problemów agregowanych; bardzo historyczny. |
| [Monitoring przedsiębiorstw społecznych w Małopolsce](./_sources/d9eb7378fa26525e0ff0499ae4be1ccc20de9e59fbca2abcfc7ee918db2cdc98.json) | 2010 | Badanie przedsiębiorstw społecznych w Małopolsce. | Kandydat do problemów agregowanych; bardzo historyczny. |
| [Model ewaluacji w pomocy społecznej](./_sources/bdcda3d824aeb4a135d42a7befe5cdb198ac967269ab708549afc6f7a257af58.json) | 2010 | Raport powstał w projekcie Małopolskiego Obserwatorium, ale omawia także ogólnopolski projekt ewaluacji. | Nie wygenerowano szkicu: błąd serwera Gemini; pozostawiony bez częściowego wyniku. |

W plikach PDF z małą ilością tekstu na pojedynczych stronach są ostrzeżenia `warnings`; mogą wskazywać stronę tytułową, pustą stronę albo skan. Nie traktujemy ich automatycznie jako danych wymagających OCR.

## Źródła niekwalifikujące się obecnie

| Źródło | Powód |
| --- | --- |
| [Mapa Wyzwań Społecznych](./_sources/e4e6609faaae40adc457f11c88e7b07d98b5d2d7b0ce610223e931ccd50d7a4f.json) | Dokument wprost deklaruje dane ogólnopolskie. Persony i statystyki nie mogą zostać użyte jako dane Małopolski. |
| [Katalog dobrych praktyk ewaluacji](./_sources/ad74352d97c78ff1cabad5eaff41b50c346dbc72be15c801930b5aab04fb45d8.json) | Materiał metodyczny, nie źródło statystyk ani agregacji problemów regionalnych. |
| Strony HTML katalogów, publikacji, ewaluacji i nawigacji | Odczyt zawiera znaczną część wspólnego menu ROPS. Samo wystąpienie słowa „Małopolska” w menu nie jest dowodem zakresu treści. |
| Strona Obserwatorium i deklaracja dostępności | Punkt wejścia oraz informacja techniczna; wymagają osobnego pozyskania danych z właściwego widoku statystyk. |

## Duplikat źródła

Adresy `...czesc-ilosciowa,852` i `...czesc-jakosciowa,851` mają różne URL-e, ale identyczny `text_sha256`:

`d0cb258b711399abb8e19396c5b7f8db6c1e15200a26f4107656b33bb1d4e380`

W interpretacji należy potraktować je jako jedną treść, aby nie zwielokrotnić tych samych ustaleń. Oba oryginalne pliki pozostają zachowane dla śledzenia źródła.

## Stan danych

- PDF-y mają zapisany oryginał `.pdf` i wyodrębniony tekst `.json`.
- Treść JSON jest kontrolowana hashem `text_sha256`.
- Wygenerowano i lokalnie zweryfikowano szkice dla czterech jednoznacznie regionalnych raportów: `0ee441…5533`, `798ce6…48f2`, `a795b2…452d` i `d9eb73…cdc98`. Nadal wymagają przeglądu merytorycznego.
- Raport `bdcda3…af58` nie ma pliku szkicu, ponieważ obie próby Gemini zakończyły się błędem serwera przed zapisem.
- Nie ma połączeń z katalogiem `../innovations` ani liczników rzeczywistych zgłoszeń.

## Przed generowaniem szkiców

1. Przejrzeć merytorycznie cztery szkice AI, zwłaszcza zgodność opisu z cytatem i historyczny charakter danych.
2. Ewentualnie ponowić raport `bdcda3…af58` wyłącznie po ustabilizowaniu dostępu do Gemini; nadal wolno przyjmować tylko fragmenty jawnie dotyczące Małopolski.
