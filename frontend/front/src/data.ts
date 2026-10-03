// All needs, people, counts, costs and projects below are synthetic demo fixtures.
// Catalogue summaries are grounded in the three cited files in backend/data.
export const illustrations = {
  people: '/images/community.webp',
  hands: '/images/community.webp',
}
export const needs = [
  {
    id: '1',
    title: 'Codzienność z demencją. Więcej wsparcia dla bliskich.',
    place: 'Wieliczka',
    category: 'Dla seniorów',
    people: 18,
    distance: 2.4,
    description:
      'Opiekunowie szukają prostych narzędzi do aktywności pamięciowych w domu i w placówce dziennego wsparcia.',
    status: 'Szukamy rozwiązań',
  },
  {
    id: '2',
    title: 'Miejsce, w którym można spotkać sąsiadów.',
    place: 'Wieliczka',
    category: 'Integracja społeczna',
    people: 14,
    distance: 4.8,
    description: 'Mieszkańcom brakuje dostępnych, regularnych spotkań blisko domu.',
    status: 'Pomysły społeczności',
  },
  {
    id: '3',
    title: 'Łatwiejszy powrót do pracy po kryzysie.',
    place: 'Kraków',
    category: 'Dla rynku pracy',
    people: 11,
    distance: 13.2,
    description: 'Potrzebne są zadania dopasowane do możliwości osób wracających na rynek pracy.',
    status: 'Szukamy rozwiązań',
  },
  {
    id: '4',
    title: 'Przestrzeń na wspólny język.',
    place: 'Niepołomice',
    category: 'Dla cudzoziemców',
    people: 7,
    distance: 17.6,
    description:
      'Rodziny chcą wspierać dzieci w poznawaniu języka polskiego i lokalnej społeczności.',
    status: 'Szukamy rozwiązań',
  },
]
export const innovations = [
  {
    id: 'bawita',
    title: 'BaWita',
    category: 'Dla seniorów',
    description:
      'Drewniana tablica z siedmioma ruchomymi elementami wspierająca pamięć i sprawność manualną dorosłych osób z demencją.',
    audience: 'Osoby z wczesnym stadium otępienia i osoby rehabilitowane pamięciowo po udarach.',
    limitation:
      'Wymaga dobrania aktywności do potrzeb odbiorcy. Koszt wykonania i lokalna dostępność nie są podane w karcie źródłowej.',
    evidence:
      'Źródło opisuje test i poprawę pamięci proceduralnej oraz sprawności manualnej. To opis autorów źródła, nie niezależna ocena MBG.',
    url: 'https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow,bawita',
    file: 'bawita.md',
  },
  {
    id: 'bajkala',
    title: 'Bajkala',
    category: 'Dla cudzoziemców',
    description:
      'Lampka z nagraniami bajek, książeczką i słowniczkiem wspierająca integrację językową dzieci czeczeńskich.',
    audience: 'Dzieci czeczeńskie mieszkające w Polsce z rodziną.',
    limitation:
      'Materiały opisano dla konkretnej grupy i języków. Użycie dla innych odbiorców wymaga adaptacji, nie prostego przeniesienia.',
    evidence:
      'Opisano motywację do słuchania i poszerzanie kompetencji językowych; długofalowe efekty wymagają większej skali i treści.',
    url: 'https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-cudzoziemcow,bajkala',
    file: 'bajkala.md',
  },
  {
    id: 'agencja-pracy-incydentalnej',
    title: 'Agencja pracy incydentalnej',
    category: 'Dla rynku pracy',
    description:
      'Model zadań dopasowanych do możliwości osób, którym wielowymiarowy kryzys utrudnia podjęcie regularnej pracy.',
    audience: 'Osoby w głębokim kryzysie oraz organizacje zajmujące się aktywizacją zawodową.',
    limitation:
      'Przed wdrożeniem potrzebna jest weryfikacja aktualnych warunków prawnych i organizacyjnych.',
    evidence:
      'Pełne informacje o testach należy sprawdzić w oryginalnym opisie; mockup nie nadaje oceny skuteczności.',
    url: 'https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-rynku-pracy,agencja-pracy-incydentalnej',
    file: 'agencja-pracy-incydentalnej.md',
  },
]
export const idea = {
  title: 'Sąsiedzki stół',
  description:
    'Regularne spotkania przy jednym stole: rozmowa, wspólna aktywność i przestrzeń na poznanie sąsiadów.',
  place: 'Wieliczka',
  supports: 24,
}
export const pilot = {
  title: 'Pamięć w dobrych rękach',
  description:
    'Sprawdzamy, jak wykorzystać BaWitę w codziennych aktywnościach niewielkiej grupy seniorów.',
  place: 'Wieliczka',
  owner: 'Koordynator demo',
  budget: 4200,
  declared: 2800,
}
export const reportText =
  'Opiekuję się bliską osobą we wczesnym stadium demencji. W naszej okolicy brakuje prostych narzędzi do codziennych ćwiczeń pamięci i sprawności dłoni. Szukamy czegoś, z czego można korzystać także w domu.'
