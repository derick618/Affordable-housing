/**
 * Image helpers.
 *
 * An image "source" can be any of:
 *   - a key such as "properties/sinza-family-house": a local demo photo at
 *     /public/images/<key>.jpg (1200px wide) with <key>-sm.jpg (640px wide) for cards;
 *   - a full URL string;
 *   - an object from the API, { url, thumbUrl }: `url` is the full-size image and
 *     `thumbUrl` the card-size one (see api/propertyMapper.js).
 *
 * To replace a local demo photo, drop a new file with the same name into the same folder.
 */

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const isAbsolute = (value) => /^(https?:)?\/\//.test(value);

/** A stable string for React keys and effect dependencies. Empty when there is no source. */
export function imageKey(src) {
  if (!src) return '';
  return typeof src === 'string' ? src : (src.url ?? '');
}

/** Resolve an image source to a URL. `size` is "lg" (default) or "sm". */
export function imageUrl(src, size = 'lg') {
  if (src && typeof src === 'object') {
    return size === 'sm' ? (src.thumbUrl || src.url) : src.url;
  }
  if (isAbsolute(src)) return src;
  return `${BASE}/images/${src}${size === 'sm' ? '-sm' : ''}.jpg`;
}

/** srcSet for responsive loading: 640w for cards, 1200w for large displays. */
export function imageSrcSet(src) {
  if (!src) return undefined;

  if (typeof src === 'object') {
    return src.thumbUrl && src.url && src.thumbUrl !== src.url
      ? `${src.thumbUrl} 640w, ${src.url} 1200w`
      : undefined;
  }

  if (isAbsolute(src)) return undefined;
  return `${imageUrl(src, 'sm')} 640w, ${imageUrl(src, 'lg')} 1200w`;
}

/** Photos used for housing projects, which have no images of their own in the API yet. */
const PROJECT_IMAGE_POOL = [
  'properties/kigamboni-home',
  'properties/mikocheni-apartment',
  'properties/mwanza-apartment',
  'properties/mbezi-townhouse',
  'properties/kinondoni-apartment',
  'properties/dodoma-bungalow',
];

export function projectImage(id) {
  const index = Math.abs(Number(id) || 0) % PROJECT_IMAGE_POOL.length;
  return PROJECT_IMAGE_POOL[index];
}
