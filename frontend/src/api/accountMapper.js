/**
 * Mappers for the signed-in marketplace endpoints (landlord tools, inquiries, budget profile).
 * Like propertyMapper.js this is the only place snake_case (the API) meets camelCase (the UI),
 * and it has no imports so it can be unit-tested in Node.
 */

const orNull = (value) => (value === undefined || value === '' ? null : value);
const toInt = (value) => (value === '' || value == null || Number.isNaN(Number(value)) ? null : Math.round(Number(value)));
const text = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : value;
  return trimmed === '' || trimmed == null ? null : trimmed;
};

export const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'In review',
  published: 'Live',
  archived: 'Archived',
};

// ---------------------------------------------------------------- landlord listings

/** One of the landlord's own listings, in any state. */
export function mapMyListing(raw) {
  if (!raw) return null;

  const images = (raw.images ?? []).map((image) => ({
    id: image.id,
    url: image.url,
    thumbUrl: image.thumb_url ?? image.url,
    alt: image.alt_text ?? '',
    position: image.position ?? 0,
  }));
  const cover = raw.cover_image ?? null;

  return {
    id: raw.slug,
    slug: raw.slug,
    title: raw.title,
    summary: raw.summary ?? '',
    description: raw.description ?? '',
    type: raw.property_type,
    price: raw.monthly_rent,
    advanceMonths: raw.rent_advance_months ?? 1,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    sizeSqm: raw.size_sqm ?? null,
    furnishing: raw.furnishing ?? 'unfurnished',
    locationSlug: raw.location?.slug ?? '',
    locationName: raw.location?.name ?? '',
    address: raw.address_line ?? '',
    water: raw.water_details ?? '',
    power: raw.power_details ?? '',
    waterIncluded: Boolean(raw.water_included),
    powerIncluded: Boolean(raw.power_included),
    nearby: (raw.nearby ?? []).map((n) => ({ kind: n.kind, text: n.text })),
    availability: raw.availability_status ?? 'available',
    availableFrom: raw.available_from ?? '',
    amenities: (raw.amenities ?? []).map((a) => ({ slug: a.slug, label: a.label, note: a.note ?? '' })),
    status: raw.publication_status,
    statusLabel: STATUS_LABELS[raw.publication_status] ?? raw.publication_status,
    moderationNote: raw.moderation_note ?? null,
    submittedAt: raw.submitted_at ?? null,
    verified: Boolean(raw.verified),
    images,
    // List responses carry only the cover; detail responses carry every image.
    cover: images[0]
      ? { url: images[0].url, thumbUrl: images[0].thumbUrl }
      : cover
        ? { url: cover.url, thumbUrl: cover.thumb_url ?? cover.url }
        : null,
    imageCount: raw.images_count ?? images.length,
    inquiryCount: raw.inquiries_count ?? 0,
    newInquiryCount: raw.new_inquiries_count ?? 0,
    updatedAt: raw.updated_at ?? null,
  };
}

export function mapMyListingPage(raw) {
  return {
    data: (raw?.data ?? []).map(mapMyListing),
    meta: raw?.meta ?? { current_page: 1, last_page: 1, from: null, to: null, total: 0, per_page: 20 },
  };
}

/** A blank form for "add a home". Numbers are strings because they come from inputs. */
export function emptyListingForm() {
  return {
    title: '',
    summary: '',
    description: '',
    type: 'apartment',
    price: '',
    advanceMonths: '3',
    bedrooms: '1',
    bathrooms: '1',
    sizeSqm: '',
    furnishing: 'unfurnished',
    locationSlug: '',
    address: '',
    water: '',
    power: '',
    waterIncluded: false,
    powerIncluded: false,
    nearby: [],
    availability: 'available',
    availableFrom: '',
    amenities: [],
  };
}

/** Form values from a saved listing. */
export function listingToForm(listing) {
  return {
    title: listing.title,
    summary: listing.summary,
    description: listing.description,
    type: listing.type,
    price: String(listing.price ?? ''),
    advanceMonths: String(listing.advanceMonths ?? ''),
    bedrooms: String(listing.bedrooms ?? ''),
    bathrooms: String(listing.bathrooms ?? ''),
    sizeSqm: listing.sizeSqm == null ? '' : String(listing.sizeSqm),
    furnishing: listing.furnishing,
    locationSlug: listing.locationSlug,
    address: listing.address,
    water: listing.water,
    power: listing.power,
    waterIncluded: listing.waterIncluded,
    powerIncluded: listing.powerIncluded,
    nearby: listing.nearby.map((n) => ({ ...n })),
    availability: listing.availability,
    availableFrom: listing.availableFrom ? String(listing.availableFrom).slice(0, 10) : '',
    amenities: listing.amenities.map((a) => ({ slug: a.slug, note: a.note })),
  };
}

/** API payload from the form. Blank optional fields become null so they can be cleared. */
export function listingToPayload(form) {
  return {
    title: text(form.title) ?? '',
    summary: text(form.summary),
    description: text(form.description),
    property_type: form.type,
    monthly_rent: toInt(form.price),
    rent_advance_months: toInt(form.advanceMonths) ?? 1,
    bedrooms: toInt(form.bedrooms),
    bathrooms: toInt(form.bathrooms),
    size_sqm: toInt(form.sizeSqm),
    furnishing: form.furnishing,
    location: orNull(form.locationSlug),
    address_line: text(form.address),
    water_details: text(form.water),
    power_details: text(form.power),
    water_included: Boolean(form.waterIncluded),
    power_included: Boolean(form.powerIncluded),
    nearby: form.nearby.filter((n) => text(n.text)).map((n) => ({ kind: n.kind, text: n.text.trim() })),
    availability_status: form.availability,
    available_from: orNull(form.availableFrom),
    amenities: form.amenities.map((a) => ({ slug: a.slug, note: text(a.note) })),
  };
}

/** API field name -> form field name, so validation errors land on the right input. */
export const LISTING_FIELD_MAP = {
  title: 'title',
  summary: 'summary',
  description: 'description',
  property_type: 'type',
  monthly_rent: 'price',
  rent_advance_months: 'advanceMonths',
  bedrooms: 'bedrooms',
  bathrooms: 'bathrooms',
  size_sqm: 'sizeSqm',
  furnishing: 'furnishing',
  location: 'locationSlug',
  address_line: 'address',
  water_details: 'water',
  power_details: 'power',
  availability_status: 'availability',
  available_from: 'availableFrom',
  images: 'images',
  amenities: 'amenities',
  nearby: 'nearby',
};

/** Rename the keys of an API `fields` object to form field names. Unknown names are kept. */
export function mapFieldErrors(fields, map = LISTING_FIELD_MAP) {
  const out = {};
  for (const [name, message] of Object.entries(fields ?? {})) {
    const root = name.split('.')[0];
    out[map[root] ?? root] = out[map[root] ?? root] ?? message;
  }
  return out;
}

// ---------------------------------------------------------------- owner profile

export function mapOwnerProfile(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    phone: raw.phone,
    whatsapp: raw.whatsapp ?? '',
    languages: raw.languages ?? '',
    responseTime: raw.response_time ?? '',
    verified: Boolean(raw.verified),
  };
}

export function ownerProfileToPayload(form) {
  return {
    name: text(form.name) ?? '',
    type: form.type,
    phone: text(form.phone) ?? '',
    whatsapp: text(form.whatsapp),
    languages: text(form.languages),
    response_time: text(form.responseTime),
  };
}

export const OWNER_FIELD_MAP = { response_time: 'responseTime' };

// ---------------------------------------------------------------- inquiries

export function mapInquiry(raw) {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    email: raw.email ?? '',
    preferredContact: raw.preferred_contact ?? 'phone',
    message: raw.message,
    status: raw.status,
    createdAt: raw.created_at,
    propertySlug: raw.property?.slug ?? null,
    propertyTitle: raw.property?.title ?? '',
  };
}

export function inquiryToPayload(form) {
  return {
    name: text(form.name) ?? '',
    phone: text(form.phone) ?? '',
    email: text(form.email),
    preferred_contact: form.preferredContact || 'phone',
    message: text(form.message) ?? '',
  };
}

export const INQUIRY_FIELD_MAP = { preferred_contact: 'preferredContact' };

// ---------------------------------------------------------------- affordability profile

/** null until a profile has been saved. */
export function mapAffordabilityProfile(raw) {
  if (!raw) return null;
  return {
    monthlyBudget: raw.monthly_budget ?? null,
    householdSize: raw.household_size ?? null,
    minBedrooms: raw.min_bedrooms ?? null,
    locationSlug: raw.location?.slug ?? '',
    locationName: raw.location?.name ?? '',
    propertyTypes: raw.property_types ?? [],
  };
}

export function affordabilityToPayload(form) {
  return {
    monthly_budget: toInt(form.monthlyBudget),
    household_size: toInt(form.householdSize),
    min_bedrooms: toInt(form.minBedrooms),
    location: orNull(form.locationSlug),
    property_types: form.propertyTypes ?? [],
  };
}

export const AFFORDABILITY_FIELD_MAP = {
  monthly_budget: 'monthlyBudget',
  household_size: 'householdSize',
  min_bedrooms: 'minBedrooms',
  location: 'locationSlug',
  property_types: 'propertyTypes',
};
