/**
 * Property data access: the single seam between the UI and property data.
 *
 * Pages call these functions and never know where the data comes from:
 *   VITE_USE_API=true   -> ./propertiesRemote.js  (the Laravel API)
 *   otherwise (default) -> ./propertiesLocal.js   (built-in demo listings, no backend)
 *
 * Both implementations return the same shape, so components stay unchanged. The chosen
 * implementation is loaded on demand, so API mode never downloads the bundled demo data.
 *
 * Signatures (each takes an optional trailing `{ signal }`):
 *   fetchProperties(filters)            -> { data, total, meta }
 *   fetchProperty(slug)                 -> property | null
 *   fetchPropertiesByIds(slugs)         -> property[]   (missing ids are absent)
 *   fetchFeatured(limit)                -> property[]
 *   fetchRecent(limit, excludeSlugs)    -> property[]
 *   fetchSimilar(slugOrProperty, limit) -> property[]
 *   fetchBudgetBands(caps)              -> [{ cap, count }]
 *   fetchCityCounts()                   -> { [cityName]: count }
 */
import { USE_API } from './config';

const load = () => (USE_API ? import('./propertiesRemote') : import('./propertiesLocal'));

export async function fetchProperties(...args) {
  return (await load()).fetchProperties(...args);
}

export async function fetchProperty(...args) {
  return (await load()).fetchProperty(...args);
}

export async function fetchPropertiesByIds(...args) {
  return (await load()).fetchPropertiesByIds(...args);
}

export async function fetchFeatured(...args) {
  return (await load()).fetchFeatured(...args);
}

export async function fetchRecent(...args) {
  return (await load()).fetchRecent(...args);
}

export async function fetchSimilar(...args) {
  return (await load()).fetchSimilar(...args);
}

export async function fetchBudgetBands(...args) {
  return (await load()).fetchBudgetBands(...args);
}

export async function fetchCityCounts(...args) {
  return (await load()).fetchCityCounts(...args);
}
