import { CheckIcon } from './icons';
import { getAffordability } from '../utils/affordability';

/**
 * Shows "Within your budget" only when the visitor has given a budget and the price fits.
 * Renders nothing otherwise, so there is never a made-up affordability claim.
 */
export default function AffordabilityTag({ price, budget, className = '' }) {
  const result = getAffordability(price, budget);
  if (result?.status !== 'within') return null;

  return (
    <p
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 ${className}`}
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
        <CheckIcon className="h-2.5 w-2.5" />
      </span>
      {result.label}
    </p>
  );
}
