import { Link } from 'react-router-dom';
import PropertyImage from './PropertyImage';
import FavoriteButton from './FavoriteButton';
import AffordabilityTag from './AffordabilityTag';
import { AvailabilityBadge, VerifiedBadge } from './Badges';
import { ArrowRightIcon, MapPinIcon } from './icons';
import { formatTZS, specsLine } from '../utils/format';

/**
 * Reusable listing card. The whole card is clickable through the stretched title link;
 * the save button sits above it (z-20) so it stays independently clickable.
 *
 * `budget` (TZS per month, optional) enables the "Within your budget" tag. Without it
 * no affordability message is shown.
 */
export default function PropertyCard({ property, budget = null, sizes, className = '' }) {
  const { id, title, price, location, status } = property;
  const isRented = status === 'rented';

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10 motion-reduce:transform-none motion-reduce:transition-none dark:border-stone-800 dark:bg-stone-900 dark:hover:shadow-black/40 ${className}`}
    >
      <div className="relative">
        <PropertyImage
          src={property.images[0]}
          alt={`${title} in ${location.area}, ${location.city}`}
          size="sm"
          sizes={sizes}
          className="aspect-[4/3]"
          imgClassName={`transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none ${
            isRented ? 'grayscale-[0.5]' : ''
          }`}
        />
        {property.verified && (
          <div className="absolute top-3 left-3">
            <VerifiedBadge overlay />
          </div>
        )}
        <div className="absolute bottom-3 left-3">
          <AvailabilityBadge status={status} availableFrom={property.availableFrom} overlay />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-2xl font-extrabold tracking-tight text-brand-800 dark:text-brand-200">
            {formatTZS(price)}
          </span>
          <span className="text-sm font-medium text-stone-500 dark:text-stone-400">/ month</span>
        </p>

        <h3 className="mt-2 text-base font-bold text-stone-900 dark:text-white">
          <Link
            to={`/properties/${id}`}
            className="after:absolute after:inset-0 after:z-10 focus-visible:outline-none"
            aria-label={`View details for ${title}, ${location.area}`}
          >
            {title}
          </Link>
        </h3>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400">
          <MapPinIcon className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
          <span className="truncate">
            {location.area}, {location.city}
          </span>
        </p>

        <p className="mt-2.5 text-sm font-medium text-stone-700 dark:text-stone-300">{specsLine(property)}</p>

        <AffordabilityTag price={price} budget={budget} className="mt-2.5" />

        <div className="mt-auto flex items-center gap-3 pt-5">
          <FavoriteButton propertyId={id} title={title} />
          <span
            aria-hidden="true"
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white transition group-hover:bg-brand-800 dark:bg-brand-600 dark:group-hover:bg-brand-500"
          >
            View Details
            <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
