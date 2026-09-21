import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPropertyParams } from '../src/api/propertyQuery.js';

test('an empty filter object produces no parameters at all', () => {
  assert.deepEqual(buildPropertyParams(), {});
  assert.deepEqual(buildPropertyParams({}), {});
});

test('undefined, null and empty values are never sent', () => {
  assert.deepEqual(
    buildPropertyParams({
      q: '',
      location: undefined,
      minPrice: null,
      maxPrice: '',
      types: [],
      bedrooms: null,
      status: '',
      slugs: [],
      exclude: [],
      page: undefined,
      perPage: undefined,
    }),
    {}
  );
});

test('maps every filter to its Laravel parameter name', () => {
  assert.deepEqual(
    buildPropertyParams({
      q: 'Dar es Salaam',
      location: 'mikocheni',
      minPrice: 300000,
      maxPrice: 800000,
      types: ['house', 'apartment'],
      bedrooms: 2,
      status: 'available',
      featured: true,
      slugs: ['a', 'b'],
      exclude: ['c'],
      sort: 'newest',
      page: 3,
      perPage: 24,
    }),
    {
      q: 'Dar es Salaam',
      location: 'mikocheni',
      min_price: 300000,
      max_price: 800000,
      property_type: 'house,apartment',
      bedrooms: 2,
      availability: 'available',
      featured: 1,
      slugs: 'a,b',
      exclude: 'c',
      sort: 'newest',
      page: 3,
      per_page: 24,
    }
  );
});

test('sort names are translated and the default is omitted', () => {
  assert.equal(buildPropertyParams({ sort: 'price-asc' }).sort, 'price_asc');
  assert.equal(buildPropertyParams({ sort: 'price-desc' }).sort, 'price_desc');
  assert.equal(buildPropertyParams({ sort: 'newest' }).sort, 'newest');
  assert.equal('sort' in buildPropertyParams({ sort: 'recommended' }), false);
  assert.equal('sort' in buildPropertyParams({ sort: 'nonsense' }), false);
});

test('page 1 is the default and is omitted; later pages are sent', () => {
  assert.equal('page' in buildPropertyParams({ page: 1 }), false);
  assert.equal('page' in buildPropertyParams({ page: '' }), false);
  assert.equal(buildPropertyParams({ page: '2' }).page, 2);
});

test('numbers arriving as strings (from the URL) are converted', () => {
  const params = buildPropertyParams({ minPrice: '250000', maxPrice: '500000', bedrooms: '3' });
  assert.deepEqual(params, { min_price: 250000, max_price: 500000, bedrooms: 3 });
});

test('invalid or negative numbers are dropped rather than sent', () => {
  assert.deepEqual(buildPropertyParams({ minPrice: 'abc', maxPrice: -5, bedrooms: NaN, perPage: 'x' }), {});
});

test('bedrooms 0 means "any" and is omitted; a max price of 0 is still a real filter', () => {
  assert.equal('bedrooms' in buildPropertyParams({ bedrooms: 0 }), false);
  assert.equal(buildPropertyParams({ maxPrice: 0 }).max_price, 0);
});

test('featured is only sent when it is explicitly true or false', () => {
  assert.equal(buildPropertyParams({ featured: true }).featured, 1);
  assert.equal(buildPropertyParams({ featured: false }).featured, 0);
  assert.equal('featured' in buildPropertyParams({}), false);
  assert.equal('featured' in buildPropertyParams({ featured: undefined }), false);
});

test('text is trimmed and lists ignore blanks', () => {
  assert.equal(buildPropertyParams({ q: '  studio  ' }).q, 'studio');
  assert.equal('q' in buildPropertyParams({ q: '   ' }), false);
  assert.equal(buildPropertyParams({ types: ['house', '', ' room '] }).property_type, 'house,room');
});

test('a comma string is accepted where a list is expected', () => {
  assert.equal(buildPropertyParams({ slugs: 'a, b ,c' }).slugs, 'a,b,c');
});

test('the homepage budget-band request is exactly max_price + per_page=1', () => {
  assert.deepEqual(buildPropertyParams({ maxPrice: 500000, perPage: 1 }), { max_price: 500000, per_page: 1 });
});

test('the homepage featured and recent requests', () => {
  assert.deepEqual(buildPropertyParams({ featured: true, status: 'available', perPage: 4 }), {
    featured: 1,
    availability: 'available',
    per_page: 4,
  });
  assert.deepEqual(buildPropertyParams({ sort: 'newest', exclude: ['x', 'y'], perPage: 4 }), {
    sort: 'newest',
    exclude: 'x,y',
    per_page: 4,
  });
});
