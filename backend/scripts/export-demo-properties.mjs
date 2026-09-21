#!/usr/bin/env node
/**
 * One-off export of the frontend demo listings into a JSON file that the Laravel
 * DemoMarketplaceSeeder consumes.
 *
 *   node backend/scripts/export-demo-properties.mjs
 *
 * The frontend file (frontend/src/data/properties.js) stays the source of truth: every
 * title, description, price, amenity, owner and image reference is READ from it, never
 * retyped. This script only reshapes the data (renames fields, splits location into a
 * city/area tree, turns relative dates into day offsets, and maps free-text amenity
 * strings onto canonical amenities). It aborts if any amenity string is not mapped, so
 * nothing can be silently lost.
 *
 * Output: backend/database/seeders/data/demo_properties.json (deterministic apart from
 * the day offsets, which are derived from the "N days ago" values in the source).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const sourceFile = path.join(repoRoot, 'frontend', 'src', 'data', 'properties.js');
const imagesDir = path.join(repoRoot, 'frontend', 'public', 'images');
const outFile = path.join(repoRoot, 'backend', 'database', 'seeders', 'data', 'demo_properties.json');

const { PROPERTIES } = await import(pathToFileURL(sourceFile).href);
const DAY = 86_400_000;
const now = Date.now();

// ---------------------------------------------------------------------------
// Canonical amenities. `test` matches the frontend wording; the original wording is kept
// as the pivot note whenever it differs from the canonical label.
// ---------------------------------------------------------------------------
const AMENITIES = [
  // utilities
  // Borehole first: "Borehole & water tank" is a borehole listing, not a plain tank.
  { slug: 'borehole', label: 'Borehole', category: 'utilities', test: /^borehole/i },
  { slug: 'water-storage-tank', label: 'Water storage tank', category: 'utilities', test: /\b(water storage tanks?|overhead water tank|rooftop water tank|water tank)\b/i },
  { slug: 'water-included', label: 'Water included', category: 'utilities', test: /^water included/i },
  { slug: 'prepaid-electricity', label: 'Prepaid electricity meter', category: 'utilities', test: /(luku|zeco)/i },
  { slug: 'backup-generator', label: 'Backup generator', category: 'utilities', test: /^backup generator/i },
  { slug: 'wifi', label: 'Wi-Fi', category: 'utilities', test: /^wi-?fi/i },
  // security
  { slug: 'security-guard', label: 'Security guard', category: 'security', test: /^(security guard|24-hour security)/i },
  { slug: 'security-lights', label: 'Security lights', category: 'security', test: /^security lights/i },
  { slug: 'fenced-compound', label: 'Fenced compound', category: 'security', test: /^fenced compound/i },
  { slug: 'gate', label: 'Gate', category: 'security', test: /\bgate$/i },
  { slug: 'gated-estate', label: 'Gated estate', category: 'security', test: /^gated estate/i },
  // parking & outdoors
  { slug: 'parking', label: 'Parking', category: 'parking', test: /parking/i },
  { slug: 'driveway', label: 'Driveway', category: 'parking', test: /driveway/i },
  { slug: 'balcony', label: 'Balcony', category: 'outdoors', test: /balcon/i },
  { slug: 'veranda', label: 'Veranda', category: 'outdoors', test: /veranda/i },
  { slug: 'garden', label: 'Garden', category: 'outdoors', test: /(garden|^lawn)/i },
  { slug: 'rooftop-terrace', label: 'Rooftop terrace', category: 'outdoors', test: /rooftop terrace/i },
  { slug: 'servant-quarter', label: 'Servant quarter', category: 'outdoors', test: /servant quarter/i },
  { slug: 'scenic-views', label: 'Views', category: 'outdoors', test: /views?$/i },
  // comfort & interior
  { slug: 'tiled-floors', label: 'Tiled floors', category: 'comfort', test: /^tiled floors/i },
  { slug: 'ceiling-fans', label: 'Ceiling fans', category: 'comfort', test: /^ceiling fans?/i },
  { slug: 'air-conditioning', label: 'Air conditioning', category: 'comfort', test: /air-conditioned/i },
  { slug: 'high-ceilings', label: 'High ceilings', category: 'comfort', test: /^high ceilings/i },
  { slug: 'fitted-kitchen', label: 'Fitted kitchen', category: 'interior', test: /^(fitted kitchen|kitchen cabinets)/i },
  { slug: 'kitchenette', label: 'Kitchenette', category: 'interior', test: /^kitchenette/i },
  { slug: 'built-in-wardrobes', label: 'Built-in wardrobes', category: 'interior', test: /wardrobes?$/i },
  { slug: 'ensuite-bedroom', label: 'En-suite bedroom', category: 'interior', test: /en-suite/i },
  { slug: 'private-bathroom', label: 'Private bathroom', category: 'interior', test: /^own bathroom/i },
  { slug: 'dining-room', label: 'Separate dining room', category: 'interior', test: /^separate dining room/i },
  { slug: 'furniture-included', label: 'Furniture included', category: 'interior', test: /(bed, wardrobe & study desk|^furnished \(|curtains & sofa|partly furnished)/i },
  // location
  { slug: 'walkable-location', label: 'Walkable location', category: 'location', test: /^walkable/i },
];

const norm = (s) => s.trim().toLowerCase();

// Each source string maps to exactly ONE canonical amenity: the first rule that matches.
function canonicalFor(text) {
  const rule = AMENITIES.find((a) => a.test.test(text));
  if (!rule) throw new Error(`Unmapped amenity string: "${text}". Add a rule to AMENITIES.`);
  return rule;
}

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-');

// Read JPEG dimensions from the SOF marker (no image library needed).
function jpegSize(buffer) {
  let i = 2;
  while (i + 9 < buffer.length) {
    if (buffer[i] !== 0xff) break;
    const marker = buffer[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
    }
    i += 2 + buffer.readUInt16BE(i + 2);
  }
  return { width: null, height: null };
}

function imageMeta(key) {
  const file = path.join(imagesDir, `${key}.jpg`);
  if (!fs.existsSync(file)) throw new Error(`Image file missing for key "${key}": ${file}`);
  const buffer = fs.readFileSync(file);
  return { path: key, ...jpegSize(buffer), mime: 'image/jpeg', size_bytes: buffer.length };
}

const FURNISHING = { Furnished: 'furnished', 'Semi-furnished': 'semi_furnished', Unfurnished: 'unfurnished' };
const OWNER_TYPE = { Landlord: 'landlord', 'Property agent': 'agent' };
const daysAgo = (iso) => Math.round((now - Date.parse(iso)) / DAY);
const daysFromNow = (iso) => Math.round((Date.parse(iso) - now) / DAY);

const locations = new Map();
const owners = new Map();
const usedAmenities = new Set();

function ensureLocation(name, type, parentSlug) {
  const slug = slugify(name);
  const existing = locations.get(slug);
  if (existing && (existing.type !== type || existing.parent !== parentSlug)) {
    throw new Error(`Location slug collision for "${name}"`);
  }
  locations.set(slug, { slug, name, type, parent: parentSlug });
  return slug;
}

const properties = PROPERTIES.map((p) => {
  const citySlug = ensureLocation(p.location.city, 'city', null);
  const areaSlug = ensureLocation(p.location.area, 'area', citySlug);

  if (!owners.has(p.owner.phone)) {
    owners.set(p.owner.phone, {
      phone: p.owner.phone,
      name: p.owner.name,
      type: OWNER_TYPE[p.owner.role] ?? (() => { throw new Error(`Unknown owner role ${p.owner.role}`); })(),
      languages: p.owner.languages,
      response_time: p.owner.responseTime,
      verified: p.owner.verified,
      member_since: p.owner.memberSince,
    });
  }

  // Collapse amenity strings onto canonical amenities, never dropping wording.
  const byAmenity = new Map();
  for (const text of p.amenities) {
    const rule = canonicalFor(text);
    usedAmenities.add(rule.slug);
    const note = norm(text) === norm(rule.label) ? null : text;
    const notes = byAmenity.get(rule.slug) ?? [];
    if (note) notes.push(note);
    if (!byAmenity.has(rule.slug) || note) byAmenity.set(rule.slug, notes);
  }
  const amenities = [...byAmenity].map(([slug, notes]) => ({ slug, note: notes.length ? notes.join('; ') : null }));

  const months = p.paymentTerms.match(/^(\d+) months?/);
  if (!months) throw new Error(`Cannot parse paymentTerms "${p.paymentTerms}" for ${p.id}`);
  if (!(p.furnished in FURNISHING)) throw new Error(`Unknown furnished value ${p.furnished}`);

  return {
    slug: p.id,
    title: p.title,
    summary: p.summary,
    description: p.description,
    property_type: p.type,
    monthly_rent: p.price,
    currency: 'TZS',
    rent_advance_months: Number(months[1]),
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    size_sqm: p.sizeSqm ?? null,
    furnishing: FURNISHING[p.furnished],
    address_line: p.location.address,
    latitude: null,
    longitude: null,
    water_details: p.water,
    power_details: p.power,
    water_included: /included/i.test(p.water),
    power_included: /included/i.test(p.power),
    nearby: p.nearby.map(({ kind, text }) => ({ kind, text })),
    availability_status: p.status,
    // Signed day offset from the moment the seeder runs (0 = today, 10 = in ten days).
    available_from_offset_days: daysFromNow(p.availableFrom),
    featured: p.featured,
    published_days_ago: daysAgo(p.listedAt),
    updated_days_ago: daysAgo(p.updatedAt),
    location: areaSlug,
    owner: p.owner.phone,
    images: p.images.map((key, position) => ({ position, ...imageMeta(key) })),
    amenities,
  };
});

// Keep the canonical definition order so amenities.sort_order is stable.
const amenityList = AMENITIES.filter((a) => usedAmenities.has(a.slug)).map((a, i) => ({
  slug: a.slug,
  label: a.label,
  category: a.category,
  sort_order: (i + 1) * 10,
}));

const output = {
  _comment: 'Generated by backend/scripts/export-demo-properties.mjs from frontend/src/data/properties.js. Do not edit by hand; re-run the script.',
  locations: [...locations.values()].sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'city' ? -1 : 1)),
  amenities: amenityList,
  owners: [...owners.values()],
  properties,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`);

// Round-trip check: every source amenity string must be accounted for by a slug + note.
const lost = [];
PROPERTIES.forEach((p, i) => {
  const exported = properties[i].amenities;
  for (const text of p.amenities) {
    const rule = canonicalFor(text);
    const entry = exported.find((e) => e.slug === rule.slug);
    const kept = entry && (norm(text) === norm(rule.label) || (entry.note ?? '').includes(text));
    if (!kept) lost.push(`${p.id}: "${text}"`);
  }
});
if (lost.length) throw new Error(`Amenity wording would be lost:\n${lost.join('\n')}`);

console.log(
  `Exported ${properties.length} properties, ${owners.size} owners, ${locations.size} locations, ` +
    `${amenityList.length} canonical amenities (from ${new Set(PROPERTIES.flatMap((p) => p.amenities)).size} distinct strings), ` +
    `${properties.reduce((n, p) => n + p.images.length, 0)} images -> ${path.relative(repoRoot, outFile)}`
);
