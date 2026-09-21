import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PROPERTIES } from '../src/data/properties.js';
import { mapProperty, mapPropertyPage, paymentTermsLabel } from '../src/api/propertyMapper.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const details = fixture('api-properties-detail.json'); // slug -> { data }
const list = fixture('api-properties-list.json');

// ---------------------------------------------------------------- parity with the demo data

test('the API fixtures contain all 12 demo listings', () => {
  assert.equal(Object.keys(details).length, 12);
  assert.equal(list.meta.total, 12);
  assert.deepEqual(Object.keys(details).sort(), PROPERTIES.map((p) => p.id).sort());
});

for (const local of PROPERTIES) {
  test(`API detail maps to the same shape and content as the local demo data: ${local.id}`, () => {
    const mapped = mapProperty(details[local.id].data);

    // Identity and the fields every card and page reads.
    assert.equal(mapped.id, local.id);
    for (const field of ['title', 'type', 'price', 'bedrooms', 'bathrooms', 'sizeSqm', 'furnished', 'water', 'power',
      'status', 'featured', 'verified', 'paymentTerms', 'summary', 'description']) {
      assert.deepEqual(mapped[field], local[field], `${local.id}.${field}`);
    }

    assert.deepEqual(mapped.location, local.location, 'location { area, city, address }');
    assert.deepEqual(mapped.nearby, local.nearby, 'nearby');

    // Amenity wording survives (order follows the backend's canonical order, so compare as sets).
    assert.deepEqual([...mapped.amenities].sort(), [...local.amenities].sort(), 'amenities');

    // Owner: same public fields, and never a phone number.
    assert.equal(mapped.owner.name, local.owner.name);
    assert.equal(mapped.owner.role, local.owner.role);
    assert.equal(mapped.owner.verified, local.owner.verified);
    assert.equal(mapped.owner.responseTime, local.owner.responseTime);
    assert.equal(mapped.owner.memberSince, local.owner.memberSince);
    assert.equal(mapped.owner.languages, local.owner.languages);
    assert.equal('phone' in mapped.owner, false);
    assert.equal('whatsapp' in mapped.owner, false);

    // Images: same photos in the same order, exposed as { url, thumbUrl }.
    assert.equal(mapped.images.length, local.images.length);
    mapped.images.forEach((image, i) => {
      assert.ok(image.url.endsWith(`/images/${local.images[i]}.jpg`), `${image.url} vs ${local.images[i]}`);
      assert.ok(image.thumbUrl.endsWith(`/images/${local.images[i]}-sm.jpg`), image.thumbUrl);
    });
    assert.equal(mapped.images[0].position, 0);

    // Dates are ISO strings the UI can parse.
    assert.ok(!Number.isNaN(Date.parse(mapped.listedAt)), 'listedAt');
    assert.ok(!Number.isNaN(Date.parse(mapped.updatedAt)), 'updatedAt');
    assert.ok(!Number.isNaN(new Date(mapped.availableFrom).getTime()), 'availableFrom');
    assert.equal(mapped.isDemo, true);
  });
}

// ---------------------------------------------------------------- list responses

test('list items map to card-ready properties with a cover image only', () => {
  const page = mapPropertyPage(list);

  assert.equal(page.data.length, 12);
  assert.equal(page.total, 12);

  for (const item of page.data) {
    assert.equal(item.images.length, 1, `${item.id} should have exactly its cover`);
    assert.ok(item.images[0].thumbUrl.endsWith('-sm.jpg'));
    assert.equal(typeof item.verified, 'boolean');
    assert.equal(item.owner, null); // list responses do not include the owner
    assert.deepEqual(item.amenities, []);
    assert.deepEqual(item.nearby, []);
    assert.equal(item.description, '');
    assert.ok(item.location.area && item.location.city, `${item.id} location`);
    assert.ok(item.paymentTerms.endsWith('rent in advance'));
  }
});

test('list covers are the same first photos as the local demo data', () => {
  const page = mapPropertyPage(list);

  for (const item of page.data) {
    const local = PROPERTIES.find((p) => p.id === item.id);
    assert.ok(item.images[0].url.endsWith(`/images/${local.images[0]}.jpg`), item.id);
    assert.equal(item.price, local.price);
    assert.equal(item.status, local.status);
  }
});

test('pagination meta is passed through with Laravel names, as <Pagination> expects', () => {
  const page = mapPropertyPage({
    data: [],
    meta: { current_page: 2, last_page: 5, from: 13, to: 24, total: 57, per_page: 12 },
  });

  assert.deepEqual(page.meta, { current_page: 2, last_page: 5, from: 13, to: 24, total: 57, per_page: 12 });
  assert.equal(page.total, 57);
});

test('a response with no meta or data still maps safely', () => {
  const page = mapPropertyPage({});
  assert.deepEqual(page.data, []);
  assert.equal(page.total, 0);
  assert.equal(page.meta.last_page, 1);
  assert.equal(page.meta.from, null);
});

// ---------------------------------------------------------------- field-level behaviour

const base = {
  slug: 'x',
  title: 'X',
  property_type: 'apartment',
  monthly_rent: 400000,
  bedrooms: 1,
  bathrooms: 1,
  furnishing: 'semi_furnished',
  availability_status: 'available',
  rent_advance_months: 3,
  location: { slug: 'mikocheni', name: 'Mikocheni', type: 'area' },
  location_path: [
    { slug: 'dar', name: 'Dar es Salaam', type: 'city' },
    { slug: 'mikocheni', name: 'Mikocheni', type: 'area' },
  ],
};

test('field names are renamed from snake_case to the existing camelCase shape', () => {
  const p = mapProperty({
    ...base,
    size_sqm: 48,
    water_details: 'Mains',
    power_details: 'LUKU',
    published_at: '2026-09-01T10:00:00.000000Z',
    updated_at: '2026-09-15T10:00:00.000000Z',
  });

  assert.equal(p.id, 'x');
  assert.equal(p.price, 400000);
  assert.equal(p.type, 'apartment');
  assert.equal(p.status, 'available');
  assert.equal(p.sizeSqm, 48);
  assert.equal(p.water, 'Mains');
  assert.equal(p.power, 'LUKU');
  assert.equal(p.listedAt, '2026-09-01T10:00:00.000000Z');
  assert.equal(p.updatedAt, '2026-09-15T10:00:00.000000Z');
  assert.equal(p.furnished, 'Semi-furnished');
});

test('paymentTerms uses the same wording as the demo data, singular and plural', () => {
  assert.equal(paymentTermsLabel(3), '3 months rent in advance');
  assert.equal(paymentTermsLabel(6), '6 months rent in advance');
  assert.equal(paymentTermsLabel(1), '1 month rent in advance');
  assert.equal(paymentTermsLabel(null), '');
  assert.equal(paymentTermsLabel(0), '');
});

test('furnishing values map to the labels the UI shows', () => {
  assert.equal(mapProperty({ ...base, furnishing: 'furnished' }).furnished, 'Furnished');
  assert.equal(mapProperty({ ...base, furnishing: 'semi_furnished' }).furnished, 'Semi-furnished');
  assert.equal(mapProperty({ ...base, furnishing: 'unfurnished' }).furnished, 'Unfurnished');
  assert.equal(mapProperty({ ...base, furnishing: 'unknown' }).furnished, 'Unfurnished');
});

test('a date-only available_from is read as local midnight so it never shifts a day', () => {
  const p = mapProperty({ ...base, available_from: '2026-10-04' });
  assert.equal(p.availableFrom, '2026-10-04T00:00:00');
  const d = new Date(p.availableFrom);
  assert.deepEqual([d.getFullYear(), d.getMonth() + 1, d.getDate()], [2026, 10, 4]);
  assert.equal(mapProperty({ ...base, available_from: null }).availableFrom, null);
});

test('location: city from the path, area from the location', () => {
  const p = mapProperty({ ...base, address_line: 'Plot 1' });
  assert.deepEqual(p.location, { area: 'Mikocheni', city: 'Dar es Salaam', address: 'Plot 1' });
});

test('location: with no city above the area, the parent is used; with nothing, the place itself', () => {
  const noCity = mapProperty({
    ...base,
    location_path: [
      { slug: 'd', name: 'Some District', type: 'district' },
      { slug: 'a', name: 'Kijitonyama', type: 'area' },
    ],
    location: { slug: 'a', name: 'Kijitonyama', type: 'area' },
  });
  assert.equal(noCity.location.city, 'Some District');
  assert.equal(noCity.location.area, 'Kijitonyama');

  const alone = mapProperty({ ...base, location_path: [], location: { slug: 'z', name: 'Zanzibar', type: 'city' } });
  assert.equal(alone.location.city, 'Zanzibar');
  assert.equal(alone.location.area, 'Zanzibar');
});

test('owner roles are mapped to the labels the UI shows', () => {
  const owner = (type) => mapProperty({ ...base, owner: { name: 'A B', type, verified: true } }).owner.role;
  assert.equal(owner('landlord'), 'Landlord');
  assert.equal(owner('agent'), 'Property agent');
});

test('optional owner fields become null, never undefined or invented values', () => {
  const p = mapProperty({ ...base, owner: { name: 'A B', type: 'landlord', verified: false } });
  assert.equal(p.owner.responseTime, null);
  assert.equal(p.owner.memberSince, null);
  assert.equal(p.owner.languages, null);
  assert.equal(p.owner.verified, false);
});

test('phone and whatsapp are dropped even if a response includes them', () => {
  const p = mapProperty({
    ...base,
    owner: { name: 'A B', type: 'landlord', verified: true, phone: '+255700000000', whatsapp: '+255600000000' },
  });
  assert.equal('phone' in p.owner, false);
  assert.equal('whatsapp' in p.owner, false);
});

test('amenities show the pivot note when there is one, else the label', () => {
  const p = mapProperty({
    ...base,
    amenities: [
      { slug: 'parking', label: 'Parking', note: 'Parking for 2 cars' },
      { slug: 'balcony', label: 'Balcony', note: null },
    ],
  });
  assert.deepEqual(p.amenities, ['Parking for 2 cars', 'Balcony']);
});

test('a property with no images maps to an empty list (the UI shows its fallback)', () => {
  assert.deepEqual(mapProperty({ ...base }).images, []);
  assert.deepEqual(mapProperty({ ...base, cover_image: null }).images, []);
});

test('mapProperty(null) is null', () => {
  assert.equal(mapProperty(null), null);
  assert.equal(mapProperty(undefined), null);
});
