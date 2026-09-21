export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Room' },
];

export const TYPE_LABELS = Object.fromEntries(PROPERTY_TYPES.map((t) => [t.value, t.label]));

/** Monthly budget caps (TZS) offered in the search bar and on the home page. */
export const BUDGET_CAPS = [300000, 500000, 800000, 1000000];

export const BUDGET_OPTIONS = [
  { value: '', label: 'Any budget' },
  ...BUDGET_CAPS.map((cap) => ({
    value: String(cap),
    label: `Up to TZS ${cap.toLocaleString('en-US')}`,
  })),
];

export const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
];

export const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'available', label: 'Available now' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'rented', label: 'Rented' },
];

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

/** Cities used for the "Popular locations" section and search suggestions. */
export const CITIES = [
  {
    name: 'Dar es Salaam',
    image: 'locations/dar-es-salaam',
    blurb: 'Kinondoni, Ubungo, Kigamboni and more',
  },
  { name: 'Arusha', image: 'locations/arusha', blurb: 'Njiro, Sakina, Moshono' },
  { name: 'Mwanza', image: 'locations/mwanza', blurb: 'Nyamagana, Ilemela, Capri Point' },
  { name: 'Zanzibar', image: 'locations/zanzibar', blurb: 'Stone Town, Shangani, Mwanakwerekwe' },
];

/** Neighbourhoods offered as quick links and as search suggestions. */
export const AREAS = [
  'Mikocheni',
  'Sinza',
  'Kinondoni',
  'Kigamboni',
  'Ubungo',
  'Mbezi Beach',
  'Mwananyamala',
  'Mwenge',
  'Njiro',
  'Capri Point',
  'Miyuji',
  'Shangani',
];
