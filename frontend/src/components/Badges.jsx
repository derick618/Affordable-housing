import { CalendarIcon, ShieldCheckIcon } from './icons';
import { formatDate } from '../utils/format';
import { TYPE_LABELS } from '../data/constants';

/** What "Verified" means, shown as a tooltip wherever the badge appears. */
export const VERIFIED_EXPLAINER =
  'We checked this owner’s ID. This is not a guarantee, so always view the home before you pay.';

/** `overlay` = sits on top of a photo, so it stays light in both colour schemes. */
export function VerifiedBadge({ label = 'Verified', className = '', overlay = false }) {
  return (
    <span
      title={VERIFIED_EXPLAINER}
      className={`badge badge-brand ${
        overlay ? '!border-white/60 !bg-white/95 !text-brand-800 shadow-sm backdrop-blur' : ''
      } ${className}`}
    >
      <ShieldCheckIcon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function TypeBadge({ type }) {
  return <span className="badge">{TYPE_LABELS[type] ?? type}</span>;
}

/** "Available now" / "Available from 1 Nov" / "Reserved" / "Rented" */
export function AvailabilityBadge({ status, availableFrom, className = '', overlay = false }) {
  const light = overlay ? '!border-white/60 shadow-sm ' : '';
  if (status === 'available') {
    const isFuture = availableFrom && new Date(availableFrom) > new Date(Date.now() + 86_400_000);
    return (
      <span className={`badge badge-good ${light}${overlay ? '!bg-white/95 !text-emerald-800 ' : ''}${className}`}>
        {isFuture ? <CalendarIcon className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
        {isFuture ? `Available from ${formatDate(availableFrom)}` : 'Available now'}
      </span>
    );
  }
  if (status === 'reserved') {
    return <span className={`badge badge-pending ${light}${overlay ? '!bg-amber-100 !text-amber-900 ' : ''}${className}`}>Reserved</span>;
  }
  return <span className={`badge ${light}${overlay ? '!bg-white/95 !text-stone-700 ' : ''}${className}`}>Rented</span>;
}
