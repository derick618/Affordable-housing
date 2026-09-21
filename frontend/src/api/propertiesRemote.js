/**
 * Property data access, backed by the Laravel marketplace API. Used when
 * VITE_USE_API=true. It has the same function names, arguments and return shapes as
 * ./propertiesLocal.js; pages never import this file directly (see ./properties.js).
 *
 * Every function takes an optional trailing `{ signal }` (an AbortSignal) so a request can
 * be cancelled when the user changes the filters before it finishes.
 *
 * Errors: a missing property (404) resolves to null / [] where the UI has a "not found"
 * state. Any other failure (network, 5xx, 422) is thrown, so callers can show an error and
 * so a failed lookup is never mistaken for "no results" (for example, saved homes must not
 * be pruned just because the network dropped).
 */
import { publicClient } from './client';
import { mapProperty, mapPropertyPage } from './propertyMapper.js';
import { buildPropertyParams } from './propertyQuery.js';

const MAX_SLUGS_PER_REQUEST = 50; // the API rejects more than 50 slugs per request

const isNotFound = (error) => error?.response?.status === 404;

export async function fetchProperties(filters = {}, { signal } = {}) {
  const { data } = await publicClient.get('/api/properties', { params: buildPropertyParams(filters), signal });
  return mapPropertyPage(data);
}

export async function fetchProperty(slug, { signal } = {}) {
  try {
    const { data } = await publicClient.get(`/api/properties/${encodeURIComponent(slug)}`, { signal });
    return mapProperty(data.data);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** Resolves saved ids (slugs). Ids that no longer exist or are not published are simply absent. */
export async function fetchPropertiesByIds(ids, { signal } = {}) {
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return [];

  const chunks = [];
  for (let i = 0; i < unique.length; i += MAX_SLUGS_PER_REQUEST) {
    chunks.push(unique.slice(i, i + MAX_SLUGS_PER_REQUEST));
  }

  const pages = await Promise.all(
    chunks.map((slugs) => fetchProperties({ slugs, perPage: MAX_SLUGS_PER_REQUEST }, { signal }))
  );
  return pages.flatMap((page) => page.data);
}

export async function fetchFeatured(limit = 4, { signal } = {}) {
  // Available homes only, matching the demo data's behaviour.
  const page = await fetchProperties({ featured: true, status: 'available', perPage: limit }, { signal });
  return page.data;
}

export async function fetchRecent(limit = 4, excludeIds = [], { signal } = {}) {
  const page = await fetchProperties({ sort: 'newest', exclude: excludeIds, perPage: limit }, { signal });
  return page.data;
}

/** The backend owns the similarity rules; the frontend only passes the slug. */
export async function fetchSimilar(propertyOrId, limit = 3, { signal } = {}) {
  const slug = typeof propertyOrId === 'string' ? propertyOrId : propertyOrId?.id;
  if (!slug) return [];

  try {
    const { data } = await publicClient.get(`/api/properties/${encodeURIComponent(slug)}/similar`, {
      params: { limit },
      signal,
    });
    return (data.data ?? []).map(mapProperty);
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

/** One request per cap; the count is the API's `meta.total` for `?max_price=CAP&per_page=1`. */
export async function fetchBudgetBands(caps, { signal } = {}) {
  return Promise.all(
    caps.map(async (cap) => {
      const page = await fetchProperties({ maxPrice: cap, perPage: 1 }, { signal });
      return { cap, count: page.total };
    })
  );
}

/** { 'Dar es Salaam': 8, Arusha: 1, ... }, from GET /api/locations?type=city&with_counts=1 */
export async function fetchCityCounts({ signal } = {}) {
  const { data } = await publicClient.get('/api/locations', {
    params: { type: 'city', with_counts: 1 },
    signal,
  });

  return Object.fromEntries((data.data ?? []).map((city) => [city.name, city.properties_count ?? 0]));
}
