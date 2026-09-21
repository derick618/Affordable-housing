import { TYPE_LABELS } from '../data/constants';

/** "TZS 650,000" */
export function formatTZS(amount) {
  return `TZS ${Math.round(Number(amount)).toLocaleString('en-US')}`;
}

/** Short form for filter labels: 250000 -> "250K", 1200000 -> "1.2M". */
export function formatTZSShort(amount) {
  const n = Number(amount);
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

/** "Updated today", "3 days ago", "2 weeks ago"... */
export function timeAgo(iso) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

/** "1 Oct 2026" */
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "2 beds" / "Studio" */
export function bedroomLabel(bedrooms) {
  if (bedrooms === 0) return 'Studio';
  return `${bedrooms} ${bedrooms === 1 ? 'bed' : 'beds'}`;
}

/** One-line summary for cards: "2 beds • 1 bath • Apartment", "Studio • 1 bath". */
export function specsLine({ bedrooms, bathrooms, type }) {
  const bath = `${bathrooms} ${bathrooms === 1 ? 'bath' : 'baths'}`;
  if (type === 'studio' || type === 'room') return [TYPE_LABELS[type], bath].join(' • ');
  return [bedroomLabel(bedrooms), bath, TYPE_LABELS[type]].join(' • ');
}
