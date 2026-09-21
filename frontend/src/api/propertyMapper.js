/**
 * Maps Laravel's snake_case property JSON onto the camelCase shape the React components
 * already use (the same shape as the local demo data in src/data/properties.js).
 * Pure (no imports), so it is unit-tested with `node --test`.
 *
 *   Laravel                  Frontend
 *   slug                     id            (the URL key and the saved-homes key)
 *   monthly_rent             price
 *   property_type            type
 *   availability_status      status
 *   available_from           availableFrom
 *   rent_advance_months      paymentTerms  ("3 months rent in advance")
 *   published_at             listedAt
 *   updated_at               updatedAt
 *   size_sqm                 sizeSqm
 *   water_details            water
 *   power_details            power
 *   furnishing               furnished     ("Semi-furnished", ...)
 *   location + location_path location      { area, city, address }
 *   cover_image / images[]   images        [{ url, thumbUrl, alt }]
 *   amenities[]              amenities     ["Parking for 2 cars", ...]  (note ?? label)
 *   owner                    owner         (no phone / WhatsApp: the API never sends them)
 *
 * List responses carry a cover image only, no description, amenities, owner or utilities.
 * Those fields are mapped to empty values so components never see `undefined`.
 */

const FURNISHING_LABELS = {
  furnished: 'Furnished',
  semi_furnished: 'Semi-furnished',
  unfurnished: 'Unfurnished',
};

const OWNER_ROLES = {
  landlord: 'Landlord',
  agent: 'Property agent',
};

/** "3 months rent in advance" (or "1 month ..."), matching the wording used across the UI. */
export function paymentTermsLabel(months) {
  const n = Number(months);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${n} ${n === 1 ? 'month' : 'months'} rent in advance`;
}

/** A date-only string ("2026-09-30") is read as local midnight, not UTC, so it never shifts a day. */
function toLocalDate(value) {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
}

function mapImage(image) {
  return {
    url: image.url,
    thumbUrl: image.thumb_url ?? image.url,
    alt: image.alt_text ?? null,
    position: image.position ?? 0,
  };
}

function mapLocation(api) {
  const path = Array.isArray(api.location_path) ? api.location_path : [];
  const leaf = api.location ?? path[path.length - 1] ?? null;
  const cityNode = path.find((node) => node.type === 'city');
  const parentNode = path.length > 1 ? path[path.length - 2] : null;

  return {
    area: leaf?.name ?? '',
    // Nearest city; without one, the immediate parent; without that, the place itself.
    city: cityNode?.name ?? parentNode?.name ?? leaf?.name ?? '',
    address: api.address_line ?? '',
  };
}

function mapOwner(owner) {
  if (!owner) return null;

  return {
    name: owner.name,
    role: OWNER_ROLES[owner.type] ?? 'Owner',
    verified: Boolean(owner.verified),
    responseTime: owner.response_time ?? null,
    memberSince: owner.member_since ?? null,
    languages: owner.languages ?? null,
    // phone / whatsapp are deliberately absent: the API does not expose them yet.
  };
}

export function mapProperty(api) {
  if (!api) return null;

  const images = Array.isArray(api.images)
    ? api.images.map(mapImage)
    : api.cover_image
      ? [mapImage(api.cover_image)]
      : [];

  return {
    id: api.slug,
    title: api.title,
    type: api.property_type,
    price: api.monthly_rent,
    currency: api.currency ?? 'TZS',
    location: mapLocation(api),
    locationPath: Array.isArray(api.location_path) ? api.location_path : [],
    bedrooms: api.bedrooms,
    bathrooms: api.bathrooms,
    sizeSqm: api.size_sqm ?? null,
    furnished: FURNISHING_LABELS[api.furnishing] ?? 'Unfurnished',
    water: api.water_details ?? null,
    power: api.power_details ?? null,
    waterIncluded: Boolean(api.water_included),
    powerIncluded: Boolean(api.power_included),
    status: api.availability_status,
    availableFrom: toLocalDate(api.available_from),
    featured: Boolean(api.featured),
    verified: Boolean(api.verified ?? api.owner?.verified),
    isDemo: Boolean(api.is_demo),
    listedAt: api.published_at ?? null,
    updatedAt: api.updated_at ?? null,
    paymentTerms: paymentTermsLabel(api.rent_advance_months),
    rentAdvanceMonths: api.rent_advance_months ?? null,
    images,
    summary: api.summary ?? '',
    description: api.description ?? '',
    amenities: Array.isArray(api.amenities) ? api.amenities.map((a) => a.note || a.label) : [],
    nearby: Array.isArray(api.nearby) ? api.nearby : [],
    owner: mapOwner(api.owner),
    latitude: api.latitude ?? null,
    longitude: api.longitude ?? null,
  };
}

/**
 * A paginated list response -> { data, total, meta }. `meta` keeps Laravel's names
 * (current_page, last_page, from, to, total, per_page), which is what the existing
 * <Pagination> component reads.
 */
export function mapPropertyPage(response) {
  const items = Array.isArray(response?.data) ? response.data : [];
  const meta = response?.meta ?? {};

  return {
    data: items.map(mapProperty),
    total: meta.total ?? items.length,
    meta: {
      current_page: meta.current_page ?? 1,
      last_page: meta.last_page ?? 1,
      from: meta.from ?? (items.length ? 1 : null),
      to: meta.to ?? (items.length || null),
      total: meta.total ?? items.length,
      per_page: meta.per_page ?? items.length,
    },
  };
}
