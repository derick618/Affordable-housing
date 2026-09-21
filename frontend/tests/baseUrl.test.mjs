import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isTruthyFlag, normalizeBaseUrl } from '../src/api/baseUrl.js';

test('normalizeBaseUrl leaves a clean origin alone', () => {
  assert.equal(normalizeBaseUrl('http://localhost:8000'), 'http://localhost:8000');
  assert.equal(normalizeBaseUrl('https://api.example.co.tz'), 'https://api.example.co.tz');
});

test('normalizeBaseUrl strips trailing slashes', () => {
  assert.equal(normalizeBaseUrl('http://localhost:8000/'), 'http://localhost:8000');
  assert.equal(normalizeBaseUrl('http://localhost:8000///'), 'http://localhost:8000');
});

test('normalizeBaseUrl strips a trailing /api so paths never become /api/api', () => {
  assert.equal(normalizeBaseUrl('http://localhost:8000/api'), 'http://localhost:8000');
  assert.equal(normalizeBaseUrl('http://localhost:8000/api/'), 'http://localhost:8000');
  assert.equal(normalizeBaseUrl('https://example.com/API'), 'https://example.com');
});

test('normalizeBaseUrl keeps a path prefix that is not /api', () => {
  assert.equal(normalizeBaseUrl('https://example.com/backend/'), 'https://example.com/backend');
});

test('normalizeBaseUrl trims whitespace and falls back when empty', () => {
  assert.equal(normalizeBaseUrl('  http://localhost:8000  '), 'http://localhost:8000');
  assert.equal(normalizeBaseUrl(''), 'http://localhost:8000');
  assert.equal(normalizeBaseUrl(undefined), 'http://localhost:8000');
  assert.equal(normalizeBaseUrl('   '), 'http://localhost:8000');
  assert.equal(normalizeBaseUrl(undefined, 'http://fallback.test/'), 'http://fallback.test');
});

test('joining the normalized base with a request path never produces a double slash', () => {
  for (const input of ['http://localhost:8000', 'http://localhost:8000/', 'http://localhost:8000/api', 'http://localhost:8000/api/']) {
    const url = `${normalizeBaseUrl(input)}/api/properties`;
    assert.equal(url, 'http://localhost:8000/api/properties');
    assert.ok(!url.replace('http://', '').includes('//'), url);
  }
});

test('isTruthyFlag only treats explicit on-values as true', () => {
  for (const on of ['true', 'TRUE', ' True ', '1', 'yes', 'on']) assert.equal(isTruthyFlag(on), true, on);
  for (const off of ['false', '0', '', 'no', 'off', undefined, null, 'maybe']) assert.equal(isTruthyFlag(off), false, String(off));
});
