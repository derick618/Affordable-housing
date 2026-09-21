import { isTruthyFlag, normalizeBaseUrl } from './baseUrl.js';

/**
 * VITE_USE_API
 *   unset / false : the marketplace uses the built-in demo listings (no backend needed)
 *   true          : the marketplace reads properties from the Laravel API
 */
export const USE_API = isTruthyFlag(import.meta.env.VITE_USE_API);

/** Origin of the Laravel API, from VITE_API_URL, without trailing slash or "/api". */
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);
