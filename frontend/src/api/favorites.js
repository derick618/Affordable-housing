import client from './client';

/**
 * Server-side favourites for the signed-in user (Laravel API). Only used when VITE_USE_API is
 * on and someone is signed in; otherwise favourites live in the browser (see FavoritesContext).
 */

/** Merge slugs saved in the browser into the account. Returns every saved slug, newest first. */
export async function syncFavorites(slugs) {
  const { data } = await client.post('/api/favorites/sync', { slugs });
  return data.data;
}

export async function addFavorite(slug) {
  await client.put(`/api/favorites/${encodeURIComponent(slug)}`);
}

export async function removeFavorite(slug) {
  await client.delete(`/api/favorites/${encodeURIComponent(slug)}`);
}
