/**
 * Translates the frontend's filter object into Laravel query parameters for
 * GET /api/properties. Pure (no imports), so it is unit-tested with `node --test`.
 *
 * Frontend filter keys      ->  API parameter
 *   q                       ->  q
 *   location (slug)         ->  location
 *   minPrice / maxPrice     ->  min_price / max_price
 *   types (array)           ->  property_type (comma list)
 *   bedrooms (minimum)      ->  bedrooms
 *   status                  ->  availability
 *   featured (boolean)      ->  featured (1 / 0)
 *   slugs / exclude (arrays)->  slugs / exclude (comma lists)
 *   sort                    ->  sort ("price-asc" becomes "price_asc")
 *   page / perPage          ->  page / per_page
 *
 * Empty, undefined and no-op values are left out, so URLs stay short and the API's own
 * defaults apply.
 */

const SORTS = {
  recommended: null, // the API default
  newest: 'newest',
  'price-asc': 'price_asc',
  price_asc: 'price_asc',
  'price-desc': 'price_desc',
  price_desc: 'price_desc',
};

function nonNegativeInt(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

function csv(value) {
  const items = (Array.isArray(value) ? value : String(value ?? '').split(','))
    .map((item) => String(item).trim())
    .filter(Boolean);
  return items.length ? items.join(',') : undefined;
}

export function buildPropertyParams(filters = {}) {
  const params = {};

  const q = String(filters.q ?? '').trim();
  if (q) params.q = q;

  const location = String(filters.location ?? '').trim();
  if (location) params.location = location;

  const min = nonNegativeInt(filters.minPrice);
  if (min !== undefined) params.min_price = min;

  const max = nonNegativeInt(filters.maxPrice);
  if (max !== undefined) params.max_price = max;

  const types = csv(filters.types);
  if (types) params.property_type = types;

  const bedrooms = nonNegativeInt(filters.bedrooms);
  if (bedrooms) params.bedrooms = bedrooms; // 0 means "any", so it is omitted

  if (filters.status) params.availability = String(filters.status);

  if (filters.featured === true) params.featured = 1;
  else if (filters.featured === false) params.featured = 0;

  const slugs = csv(filters.slugs);
  if (slugs) params.slugs = slugs;

  const exclude = csv(filters.exclude);
  if (exclude) params.exclude = exclude;

  const sort = SORTS[filters.sort];
  if (sort) params.sort = sort;

  const page = nonNegativeInt(filters.page);
  if (page && page > 1) params.page = page;

  const perPage = nonNegativeInt(filters.perPage);
  if (perPage) params.per_page = perPage;

  return params;
}
