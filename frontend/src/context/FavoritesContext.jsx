import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { addFavorite, removeFavorite, syncFavorites } from '../api/favorites';
import { USE_API } from '../api/config';
import { fetchPropertiesByIds } from '../api/properties';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'saved_properties';
const FavoritesContext = createContext(null);

function readStored() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saved ("favourite") properties.
 *
 * - Anonymous visitors (and local demo mode): kept in the browser (localStorage).
 * - Signed in with the API on: kept in the account. On sign-in, whatever the visitor had saved
 *   in the browser is merged into the account, and the browser copy then just mirrors it.
 *   On sign-out the copy is cleared so the next person on a shared device starts empty.
 */
export function FavoritesProvider({ children }) {
  const { user, loading } = useAuth();
  const [ids, setIds] = useState(readStored);
  const serverMode = USE_API && Boolean(user);
  const wasSignedIn = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Storage can be unavailable (private mode); favourites then last for the session only.
    }
  }, [ids]);

  // Signed in: adopt the account's list (merging in what was saved before signing in).
  // Signed out after being signed in: forget the account's list on this device.
  useEffect(() => {
    if (loading) return undefined;
    let cancelled = false;

    if (serverMode) {
      wasSignedIn.current = true;
      syncFavorites(readStored())
        .then((slugs) => {
          if (!cancelled) setIds(slugs);
        })
        .catch(() => {
          // Offline or a server error: keep what is on this device rather than lose it.
        });
    } else if (wasSignedIn.current) {
      wasSignedIn.current = false;
      setIds([]);
    }

    return () => {
      cancelled = true;
    };
  }, [loading, serverMode]);

  // Anonymous only: drop saved ids whose listing no longer exists (renamed slug, removed
  // listing), so the header count and the Saved page agree. The account list is already
  // filtered by the server. Ids saved while this runs are kept.
  useEffect(() => {
    if (loading || serverMode) return undefined;
    const stored = readStored();
    if (!stored.length) return undefined;
    let cancelled = false;
    fetchPropertiesByIds(stored)
      .then((found) => {
        if (cancelled) return;
        const valid = new Set(found.map((p) => p.id));
        setIds((current) => {
          const next = current.filter((id) => valid.has(id) || !stored.includes(id));
          return next.length === current.length ? current : next;
        });
      })
      .catch(() => {
        // If the lookup fails we keep everything rather than risk deleting real favourites.
      });
    return () => {
      cancelled = true;
    };
  }, [loading, serverMode]);

  const toggle = useCallback(
    (id) => {
      const adding = !ids.includes(id);
      setIds((current) => {
        if (adding) return current.includes(id) ? current : [id, ...current];
        return current.filter((x) => x !== id);
      });

      if (!serverMode) return;

      // Optimistic: the heart flips at once; if the server refuses, put it back.
      (adding ? addFavorite(id) : removeFavorite(id)).catch(() => {
        setIds((current) => {
          const has = current.includes(id);
          if (adding) return has ? current.filter((x) => x !== id) : current;
          return has ? current : [id, ...current];
        });
      });
    },
    [ids, serverMode]
  );

  const value = useMemo(
    () => ({ ids, count: ids.length, isSaved: (id) => ids.includes(id), toggle }),
    [ids, toggle]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
