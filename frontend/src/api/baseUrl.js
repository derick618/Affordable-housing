/**
 * Pure helpers for API configuration. No imports and no `import.meta`, so they can be
 * unit-tested with `node --test` (see frontend/tests).
 */

const DEFAULT_BASE_URL = 'http://localhost:8000';

/**
 * Turns whatever is in VITE_API_URL into a clean origin such as "http://localhost:8000".
 *
 * Trailing slashes are removed, and so is a trailing "/api", because request paths already
 * start with "/api/..." and would otherwise become ".../api/api/properties" or
 * "http://localhost:8000//api/properties".
 */
export function normalizeBaseUrl(url, fallback = DEFAULT_BASE_URL) {
  let value = String(url ?? '').trim();
  if (!value) value = fallback;
  return value.replace(/\/+$/, '').replace(/\/api$/i, '').replace(/\/+$/, '');
}

/** "true", "1", "yes" and "on" (any case) are on; everything else, including unset, is off. */
export function isTruthyFlag(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase());
}
