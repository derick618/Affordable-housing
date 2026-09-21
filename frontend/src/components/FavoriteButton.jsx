import { useFavorites } from '../context/FavoritesContext';
import { HeartIcon } from './icons';

/**
 * Heart toggle.
 * - variant="icon": compact outlined square, used in the footer of property cards.
 * - variant="button": labelled "Save" / "Saved" button, used on the details page.
 */
export default function FavoriteButton({ propertyId, title, variant = 'icon', className = '' }) {
  const { isSaved, toggle } = useFavorites();
  const saved = isSaved(propertyId);

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={() => toggle(propertyId)}
        aria-pressed={saved}
        className={`btn ${saved ? 'border-rose-300 text-rose-600 dark:border-rose-500/50 dark:text-rose-400' : ''} ${className}`}
      >
        <HeartIcon filled={saved} className="h-4 w-4" />
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        // Sits above the card's stretched link, so don't let the click navigate.
        event.preventDefault();
        event.stopPropagation();
        toggle(propertyId);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved homes` : `Save ${title}`}
      title={saved ? 'Saved' : 'Save this home'}
      className={`relative z-20 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition active:scale-95 ${
        saved
          ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400'
          : 'border-stone-300 bg-white text-stone-500 hover:border-rose-300 hover:text-rose-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:text-rose-400'
      } ${className}`}
    >
      <HeartIcon filled={saved} className="h-5 w-5" />
    </button>
  );
}
