import client from './client';
import { USE_API } from './config';

/**
 * Things a visitor sends to the platform about a listing. Unlike browsing, these need the real
 * API: with the local demo data (VITE_USE_API off) they succeed without sending anything, so
 * the interface can still be shown end to end.
 *
 * They use the signed-in client so that, when someone is logged in, the API can link the
 * report or message to their account. A missing or expired token is harmless on these routes.
 */

/** reason: scam | misrepresented | already_rented | wrong_details | other */
export async function submitReport(slug, { reason, details, contact }) {
  if (!USE_API) return;
  await client.post(`/api/properties/${encodeURIComponent(slug)}/reports`, {
    reason,
    details: details || null,
    contact: contact || null,
  });
}
