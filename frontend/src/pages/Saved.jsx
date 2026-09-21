import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PropertyCard from '../components/PropertyCard';
import { PropertyGridSkeleton } from '../components/PropertyCardSkeleton';
import { useFavorites } from '../context/FavoritesContext';
import { fetchPropertiesByIds } from '../api/properties';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Saved() {
  usePageTitle('Saved homes');
  const { ids } = useFavorites();
  const saved = useAsync(({ signal }) => fetchPropertiesByIds(ids, { signal }), [ids]);
  // Hide a home the moment it is un-saved, without waiting for the refetch to come back.
  const homes = saved.data?.filter((property) => ids.includes(property.id));

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">Saved homes</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Homes you have saved on this device. Compare prices side by side and contact the owners when you are ready.
      </p>

      <div className="mt-8">
        {ids.length === 0 ? (
          <EmptyState
            title="No saved homes yet"
            message="Tap the heart on any home to keep it here. Saved homes stay on this device, so you can come back and compare them later."
            action={
              <Link to="/properties" className="btn btn-primary btn-lg">
                Browse affordable homes
              </Link>
            }
          />
        ) : saved.error ? (
          <EmptyState
            title="We couldn’t load your saved homes"
            message="Your saved homes are safe on this device. Check your connection and try again."
            action={
              <button type="button" className="btn btn-primary btn-lg" onClick={saved.reload}>
                Try again
              </button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {saved.loading && !saved.data ? (
              <PropertyGridSkeleton count={Math.min(ids.length, 3)} />
            ) : (
              homes?.map((property) => <PropertyCard key={property.id} property={property} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
