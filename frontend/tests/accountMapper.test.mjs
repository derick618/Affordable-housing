import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  affordabilityToPayload,
  emptyListingForm,
  inquiryToPayload,
  listingToForm,
  listingToPayload,
  mapAffordabilityProfile,
  mapFieldErrors,
  mapInquiry,
  mapMyListing,
  mapMyListingPage,
  mapOwnerProfile,
  ownerProfileToPayload,
} from '../src/api/accountMapper.js';

const raw = {
  slug: 'bright-flat-abc123',
  title: 'Bright flat',
  summary: null,
  description: 'Lovely.',
  property_type: 'apartment',
  monthly_rent: 650000,
  rent_advance_months: 3,
  bedrooms: 2,
  bathrooms: 1,
  size_sqm: null,
  furnishing: 'semi_furnished',
  location: { slug: 'mikocheni', name: 'Mikocheni', type: 'area' },
  address_line: null,
  water_details: 'Mains',
  power_details: null,
  water_included: true,
  power_included: false,
  nearby: [{ kind: 'school', text: 'Primary school' }],
  availability_status: 'available',
  available_from: '2026-10-04',
  publication_status: 'draft',
  moderation_note: 'Add a clearer photo.',
  amenities: [{ slug: 'parking', label: 'Parking', category: 'parking', note: 'Room for 2 cars' }],
  images: [
    { id: 7, url: 'http://x/a.jpg', thumb_url: 'http://x/a-sm.jpg', alt_text: null, position: 0 },
    { id: 8, url: 'http://x/b.jpg', thumb_url: 'http://x/b-sm.jpg', alt_text: 'Kitchen', position: 1 },
  ],
  inquiries_count: 3,
  new_inquiries_count: 2,
};

test('mapMyListing renames snake_case fields and keeps nulls out of text values', () => {
  const l = mapMyListing(raw);

  assert.equal(l.id, 'bright-flat-abc123');
  assert.equal(l.price, 650000);
  assert.equal(l.type, 'apartment');
  assert.equal(l.locationSlug, 'mikocheni');
  assert.equal(l.summary, '');
  assert.equal(l.address, '');
  assert.equal(l.sizeSqm, null);
  assert.equal(l.status, 'draft');
  assert.equal(l.statusLabel, 'Draft');
  assert.equal(l.moderationNote, 'Add a clearer photo.');
  assert.equal(l.inquiryCount, 3);
  assert.equal(l.newInquiryCount, 2);
  assert.deepEqual(l.images[1], { id: 8, url: 'http://x/b.jpg', thumbUrl: 'http://x/b-sm.jpg', alt: 'Kitchen', position: 1 });
  assert.deepEqual(l.cover, { url: 'http://x/a.jpg', thumbUrl: 'http://x/a-sm.jpg' });
  assert.deepEqual(l.amenities, [{ slug: 'parking', label: 'Parking', note: 'Room for 2 cars' }]);
  assert.ok(!Object.keys(l).some((key) => key.includes('_')), 'no snake_case keys leak into the UI shape');
});

test('a list item uses the cover image and the image count', () => {
  const l = mapMyListing({ ...raw, images: undefined, cover_image: { url: 'u', thumb_url: 't' }, images_count: 5 });
  assert.deepEqual(l.cover, { url: 'u', thumbUrl: 't' });
  assert.equal(l.imageCount, 5);
  assert.equal(mapMyListing({ ...raw, images: [], cover_image: null }).cover, null);
});

test('page mapping keeps Laravel pagination meta', () => {
  const page = mapMyListingPage({ data: [raw], meta: { current_page: 2, last_page: 3, from: 21, to: 40, total: 55, per_page: 20 } });
  assert.equal(page.data.length, 1);
  assert.equal(page.meta.last_page, 3);
  assert.equal(mapMyListingPage({}).meta.total, 0);
  assert.equal(mapMyListing(null), null);
});

test('form -> payload converts numbers and turns blanks into null so they can be cleared', () => {
  const payload = listingToPayload({
    ...emptyListingForm(),
    title: '  My flat  ',
    price: '650000',
    bedrooms: '2',
    bathrooms: '1',
    locationSlug: 'mikocheni',
    sizeSqm: '',
    summary: '   ',
    nearby: [
      { kind: 'school', text: ' Primary school ' },
      { kind: 'market', text: '' },
    ],
    amenities: [{ slug: 'parking', note: '' }, { slug: 'wifi', note: 'Fibre' }],
  });

  assert.equal(payload.title, 'My flat');
  assert.equal(payload.monthly_rent, 650000);
  assert.equal(payload.bedrooms, 2);
  assert.equal(payload.size_sqm, null);
  assert.equal(payload.summary, null);
  assert.equal(payload.location, 'mikocheni');
  assert.equal(payload.property_type, 'apartment');
  assert.deepEqual(payload.nearby, [{ kind: 'school', text: 'Primary school' }]);
  assert.deepEqual(payload.amenities, [{ slug: 'parking', note: null }, { slug: 'wifi', note: 'Fibre' }]);
});

test('the payload never contains fields the landlord may not set', () => {
  const payload = listingToPayload(emptyListingForm());
  for (const forbidden of ['owner_id', 'slug', 'featured', 'is_demo', 'publication_status', 'published_at']) {
    assert.equal(forbidden in payload, false, forbidden);
  }
});

test('an empty location is sent as null, not an empty string', () => {
  assert.equal(listingToPayload(emptyListingForm()).location, null);
});

test('listing -> form -> payload round-trips the values', () => {
  const form = listingToForm(mapMyListing(raw));
  assert.equal(form.price, '650000');
  assert.equal(form.availableFrom, '2026-10-04');
  assert.equal(form.sizeSqm, '');

  const payload = listingToPayload(form);
  assert.equal(payload.monthly_rent, 650000);
  assert.equal(payload.furnishing, 'semi_furnished');
  assert.equal(payload.available_from, '2026-10-04');
  assert.equal(payload.water_included, true);
  assert.deepEqual(payload.amenities, [{ slug: 'parking', note: 'Room for 2 cars' }]);
});

test('validation errors from the API are renamed to form fields', () => {
  assert.deepEqual(
    mapFieldErrors({ monthly_rent: 'Too low', 'nearby.0.kind': 'Bad kind', location: 'Unknown', 'images.1': 'Too big' }),
    { price: 'Too low', nearby: 'Bad kind', locationSlug: 'Unknown', images: 'Too big' }
  );
  assert.deepEqual(mapFieldErrors({ whatever: 'x' }), { whatever: 'x' });
  assert.deepEqual(mapFieldErrors(undefined), {});
});

test('owner profile maps both ways and never invents verification', () => {
  const p = mapOwnerProfile({ id: 1, name: 'Amina', type: 'agent', phone: '+255700000001', whatsapp: null, response_time: 'within a day', verified: false });
  assert.deepEqual(p, { id: 1, name: 'Amina', type: 'agent', phone: '+255700000001', whatsapp: '', languages: '', responseTime: 'within a day', verified: false });
  assert.equal(mapOwnerProfile(null), null);

  const payload = ownerProfileToPayload({ ...p, whatsapp: '', languages: ' English ' });
  assert.deepEqual(payload, { name: 'Amina', type: 'agent', phone: '+255700000001', whatsapp: null, languages: 'English', response_time: 'within a day' });
  assert.equal('verified' in payload, false);
});

test('inquiries map both ways', () => {
  const i = mapInquiry({
    id: 3, name: 'Juma', phone: '+255754111222', email: null, preferred_contact: 'whatsapp', message: 'Hello there', status: 'new',
    created_at: '2026-09-21T10:00:00Z', property: { slug: 'a-b', title: 'A B' },
  });
  assert.equal(i.preferredContact, 'whatsapp');
  assert.equal(i.propertySlug, 'a-b');
  assert.equal(i.email, '');
  assert.deepEqual(
    inquiryToPayload({ name: ' Juma ', phone: '+255754111222', email: '', preferredContact: '', message: ' Hello there ' }),
    { name: 'Juma', phone: '+255754111222', email: null, preferred_contact: 'phone', message: 'Hello there' }
  );
});

test('affordability profile maps both ways', () => {
  assert.equal(mapAffordabilityProfile(null), null);
  const p = mapAffordabilityProfile({ monthly_budget: 600000, household_size: null, min_bedrooms: 2, location: { slug: 'm', name: 'Mikocheni' }, property_types: ['house'] });
  assert.deepEqual(p, { monthlyBudget: 600000, householdSize: null, minBedrooms: 2, locationSlug: 'm', locationName: 'Mikocheni', propertyTypes: ['house'] });

  assert.deepEqual(
    affordabilityToPayload({ monthlyBudget: '600000', householdSize: '', minBedrooms: '2', locationSlug: '', propertyTypes: ['house'] }),
    { monthly_budget: 600000, household_size: null, min_bedrooms: 2, location: null, property_types: ['house'] }
  );
});
