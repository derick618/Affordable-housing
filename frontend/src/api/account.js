import client, { publicClient } from './client';
import {
  affordabilityToPayload,
  inquiryToPayload,
  listingToPayload,
  mapAffordabilityProfile,
  mapInquiry,
  mapMyListing,
  mapMyListingPage,
  mapOwnerProfile,
  ownerProfileToPayload,
} from './accountMapper.js';

/**
 * Signed-in marketplace calls: the landlord's profile, listings, photos and inbox, and the
 * renter's budget profile. They need the Laravel API (VITE_USE_API=true) and a signed-in user;
 * the pages that use them are only reachable in that case. Everything is mapped to the
 * camelCase shapes in accountMapper.js. Failures throw the axios error (see errors.js).
 */

const listingUrl = (slug) => `/api/landlord/properties/${encodeURIComponent(slug)}`;

// ---------------------------------------------------------------- reference data (public)

/** Places a listing can be in: [{ slug, name, type, parentName }] sorted for a <select>. */
export async function fetchLocationOptions({ signal } = {}) {
  const { data } = await publicClient.get('/api/locations', { signal });
  const byId = new Map(data.data.map((l) => [l.slug, l]));

  return data.data
    .map((l) => ({
      slug: l.slug,
      name: l.name,
      type: l.type,
      parentName: byId.get(l.parent_slug)?.name ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Amenities a listing can offer: [{ slug, label, category }] in display order. */
export async function fetchAmenityOptions({ signal } = {}) {
  const { data } = await publicClient.get('/api/amenities', { signal });
  return data.data.map((a) => ({ slug: a.slug, label: a.label, category: a.category }));
}

// ---------------------------------------------------------------- landlord profile

/** The signed-in user's landlord profile, or null if they have not created one. */
export async function fetchOwnerProfile({ signal } = {}) {
  const { data } = await client.get('/api/landlord/profile', { signal });
  return mapOwnerProfile(data.data);
}

export async function saveOwnerProfile(form) {
  const { data } = await client.put('/api/landlord/profile', ownerProfileToPayload(form));
  return mapOwnerProfile(data.data);
}

// ---------------------------------------------------------------- landlord listings

export async function fetchMyListings({ status, page } = {}, { signal } = {}) {
  const { data } = await client.get('/api/landlord/properties', {
    params: { ...(status ? { status } : {}), ...(page > 1 ? { page } : {}) },
    signal,
  });
  return mapMyListingPage(data);
}

export async function fetchMyListing(slug, { signal } = {}) {
  try {
    const { data } = await client.get(listingUrl(slug), { signal });
    return mapMyListing(data.data);
  } catch (error) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function createListing(form) {
  const { data } = await client.post('/api/landlord/properties', listingToPayload(form));
  return mapMyListing(data.data);
}

export async function updateListing(slug, form) {
  const { data } = await client.patch(listingUrl(slug), listingToPayload(form));
  return mapMyListing(data.data);
}

/** Only the availability (available / reserved / rented), for a quick change from the list. */
export async function setListingAvailability(slug, availability) {
  const { data } = await client.patch(listingUrl(slug), { availability_status: availability });
  return mapMyListing(data.data);
}

export async function deleteListing(slug) {
  await client.delete(listingUrl(slug));
}

/** action: submit | withdraw | archive | reopen */
export async function runListingAction(slug, action) {
  const { data } = await client.post(`${listingUrl(slug)}/${action}`);
  return mapMyListing(data.data);
}

// ---------------------------------------------------------------- photos

/** Uploads one or more photos; resolves with the new images `[{ id, url, thumbUrl, alt, position }]`. */
export async function uploadImages(slug, files) {
  const body = new FormData();
  for (const file of files) body.append('images[]', file);

  const { data } = await client.post(`${listingUrl(slug)}/images`, body, { timeout: 120000 });
  return data.data.map((image) => ({
    id: image.id,
    url: image.url,
    thumbUrl: image.thumb_url ?? image.url,
    alt: image.alt_text ?? '',
    position: image.position ?? 0,
  }));
}

export async function deleteImage(slug, imageId) {
  await client.delete(`${listingUrl(slug)}/images/${imageId}`);
}

export async function reorderImages(slug, ids) {
  await client.put(`${listingUrl(slug)}/images/order`, { ids });
}

export async function saveImageAlt(slug, imageId, alt) {
  await client.patch(`${listingUrl(slug)}/images/${imageId}`, { alt_text: alt || null });
}

// ---------------------------------------------------------------- inquiries

/** { data: inquiries, unread } for the signed-in landlord, newest first. */
export async function fetchMyInquiries({ status } = {}, { signal } = {}) {
  const { data } = await client.get('/api/landlord/inquiries', { params: status ? { status } : {}, signal });
  return { data: data.data.map(mapInquiry), unread: data.unread_count ?? 0, meta: data.meta };
}

export async function setInquiryStatus(id, status) {
  const { data } = await client.patch(`/api/landlord/inquiries/${id}`, { status });
  return mapInquiry(data.data);
}

/** A renter's message to a listing's owner. Works signed in or not. */
export async function sendInquiry(slug, form) {
  await client.post(`/api/properties/${encodeURIComponent(slug)}/inquiries`, inquiryToPayload(form));
}

// ---------------------------------------------------------------- renter budget profile

export async function fetchAffordabilityProfile({ signal } = {}) {
  const { data } = await client.get('/api/profile/affordability', { signal });
  return mapAffordabilityProfile(data.data);
}

export async function saveAffordabilityProfile(form) {
  const { data } = await client.put('/api/profile/affordability', affordabilityToPayload(form));
  return mapAffordabilityProfile(data.data);
}

export async function deleteAffordabilityProfile() {
  await client.delete('/api/profile/affordability');
}
