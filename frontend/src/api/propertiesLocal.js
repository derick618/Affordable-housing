/**
 * Property data access, backed by the built-in demo listings (src/data/properties.js).
 * Used when VITE_USE_API is not "true". It has the same function names, arguments and
 * return shapes as ./propertiesRemote.js, which is the Laravel-backed implementation.
 * Pages never import this file directly; they go through ./properties.js.
 *
 * Every function takes an optional trailing `{ signal }` for parity with the remote
 * implementation; local data is instant, so it is ignored here.
 */
import { PROPERTIES } from '../data/properties';

const DEFAULT_PER_PAGE = 12;

function matchesText(property, q) {
  if (!q) return true;
  const haystack = [
    property.title,
    property.location.area,
    property.location.city,
    property.location.address,
  ]
    .join(' ')
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** Pure filter + sort, shared by the list page and the tests. */
export function applyFilters(list, filters = {}) {
  const { q, types = [], minPrice, maxPrice, bedrooms, status, sort = 'recommended' } = filters;

  const result = list.filter((p) => {
    if (!matchesText(p, q)) return false;
    if (types.length && !types.includes(p.type)) return false;
    if (minPrice != null && p.price < minPrice) return false;
    if (maxPrice != null && p.price > maxPrice) return false;
    if (bedrooms != null && p.bedrooms < bedrooms) return false;
    if (status && p.status !== status) return false;
    return true;
  });

  const byNewest = (a, b) => new Date(b.listedAt) - new Date(a.listedAt);
  const sorters = {
    newest: byNewest,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    recommended: (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      Number(b.status === 'available') - Number(a.status === 'available') ||
      byNewest(a, b),
  };
  return result.sort(sorters[sort] ?? sorters.recommended);
}

/** Returns { data, total, meta } where `meta` uses Laravel's pagination field names. */
export async function fetchProperties(filters = {}) {
  const all = applyFilters(PROPERTIES, filters);
  const perPage = Math.max(1, Number(filters.perPage) || DEFAULT_PER_PAGE);
  const lastPage = Math.max(1, Math.ceil(all.length / perPage));
  const page = Math.max(1, Number(filters.page) || 1);
  const start = (page - 1) * perPage;
  const data = all.slice(start, start + perPage);

  return {
    data,
    total: all.length,
    meta: {
      current_page: page,
      last_page: lastPage,
      from: data.length ? start + 1 : null,
      to: data.length ? start + data.length : null,
      total: all.length,
      per_page: perPage,
    },
  };
}

export async function fetchProperty(id) {
  return PROPERTIES.find((p) => p.id === id) ?? null;
}

export async function fetchPropertiesByIds(ids) {
  return PROPERTIES.filter((p) => ids.includes(p.id));
}

export async function fetchFeatured(limit = 4) {
  return applyFilters(PROPERTIES, { status: 'available' })
    .filter((p) => p.featured)
    .slice(0, limit);
}

export async function fetchRecent(limit = 4, excludeIds = []) {
  return applyFilters(PROPERTIES, { sort: 'newest' })
    .filter((p) => !excludeIds.includes(p.id))
    .slice(0, limit);
}

/**
 * Same city or type, similar price band, excluding the property itself. When the property
 * is reserved or rented, only homes that are still available are suggested.
 * Accepts a property object or just its id (slug).
 */
export async function fetchSimilar(propertyOrId, limit = 3) {
  const property =
    typeof propertyOrId === 'string' ? PROPERTIES.find((p) => p.id === propertyOrId) : propertyOrId;
  if (!property) return [];

  const needsAvailable = property.status !== 'available';
  const scored = PROPERTIES.filter((p) => p.id !== property.id && (!needsAvailable || p.status === 'available')).map(
    (p) => {
      let score = 0;
      if (p.location.city === property.location.city) score += 3;
      if (p.type === property.type) score += 2;
      if (Math.abs(p.price - property.price) <= property.price * 0.35) score += 2;
      if (p.status === 'available') score += 1;
      return { p, score };
    }
  );
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
}

/**
 * For each monthly budget cap: how many homes fit under it. Uses the same filter as the
 * results page, so the number on a budget card always equals what its link shows.
 */
export async function fetchBudgetBands(caps) {
  return caps.map((cap) => ({ cap, count: applyFilters(PROPERTIES, { maxPrice: cap }).length }));
}

/** { 'Dar es Salaam': 8, Arusha: 1, ... } */
export async function fetchCityCounts() {
  return PROPERTIES.reduce((counts, p) => {
    counts[p.location.city] = (counts[p.location.city] ?? 0) + 1;
    return counts;
  }, {});
}
