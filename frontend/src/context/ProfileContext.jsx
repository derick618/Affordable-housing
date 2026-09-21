import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { USE_API } from '../api/config';
import { deleteAffordabilityProfile, fetchAffordabilityProfile, saveAffordabilityProfile } from '../api/account';
import { useAuth } from './AuthContext';

const ProfileContext = createContext({ profile: null, enabled: false, save: async () => null, remove: async () => {} });

/**
 * The signed-in renter's saved budget and preferences (Laravel API only). When there is no
 * profile, or nobody is signed in, or the API is off, `profile` is null and the marketplace
 * behaves exactly as before: the only budget is the one in the search filters.
 */
export function ProfileProvider({ children }) {
  const { user, loading } = useAuth();
  const enabled = USE_API && Boolean(user);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (loading) return undefined;
    if (!enabled) {
      setProfile(null);
      return undefined;
    }

    const controller = new AbortController();
    fetchAffordabilityProfile({ signal: controller.signal })
      .then(setProfile)
      .catch(() => {
        // The budget is a convenience: if it cannot be loaded, browse without it.
      });
    return () => controller.abort();
  }, [loading, enabled, user?.id]);

  const save = useCallback(async (form) => {
    const saved = await saveAffordabilityProfile(form);
    setProfile(saved);
    return saved;
  }, []);

  const remove = useCallback(async () => {
    await deleteAffordabilityProfile();
    setProfile(null);
  }, []);

  const value = useMemo(() => ({ profile, enabled, save, remove }), [profile, enabled, save, remove]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
