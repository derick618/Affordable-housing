import { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteListing, fetchMyListings, runListingAction } from '../../api/account';
import { describeApiError } from '../../api/errors';
import EmptyState from '../../components/EmptyState';
import { FormError } from '../../components/Field';
import Pagination from '../../components/Pagination';
import PropertyImage from '../../components/PropertyImage';
import { TYPE_LABELS } from '../../data/constants';
import { useAsync } from '../../hooks/useAsync';
import { formatTZS } from '../../utils/format';

const STATUS_BADGE = {
  draft: 'badge',
  pending_review: 'badge badge-pending',
  published: 'badge badge-good',
  archived: 'badge',
};

/** What a landlord can do next with a listing, by where it is in the review process. */
const ACTIONS = {
  draft: [{ action: 'submit', label: 'Submit for review', primary: true }, { action: 'archive', label: 'Archive' }],
  pending_review: [{ action: 'withdraw', label: 'Withdraw' }],
  published: [{ action: 'archive', label: 'Take offline' }],
  archived: [{ action: 'reopen', label: 'Reopen as draft' }],
};

const HINTS = {
  draft: 'Only you can see this. Add photos and a description, then submit it for review.',
  pending_review: 'Our team is checking this listing. It goes live as soon as it is approved.',
  published: 'Live on the marketplace.',
  archived: 'Not visible to renters.',
};

function ListingRow({ listing, onChanged, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      onChanged(await runListingAction(listing.slug, action));
    } catch (err) {
      const { message, fields } = describeApiError(err, "That didn't work. Please try again.");
      setError(Object.values(fields)[0] ?? message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${listing.title}"? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteListing(listing.slug);
      onDeleted(listing.slug);
    } catch (err) {
      setError(describeApiError(err).message);
      setBusy(false);
    }
  }

  return (
    <li className="card flex flex-col gap-4 !p-4 sm:flex-row">
      <PropertyImage
        src={listing.cover}
        alt=""
        size="sm"
        sizes="(min-width: 640px) 12rem, 100vw"
        className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:w-48"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={STATUS_BADGE[listing.status] ?? 'badge'}>{listing.statusLabel}</span>
          {listing.newInquiryCount > 0 && (
            <Link to="/landlord?tab=messages" className="badge badge-brand">
              {listing.newInquiryCount} new {listing.newInquiryCount === 1 ? 'message' : 'messages'}
            </Link>
          )}
        </div>
        <h3 className="mt-1.5 truncate text-lg font-extrabold text-stone-900 dark:text-white">{listing.title}</h3>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {formatTZS(listing.price)} / month · {TYPE_LABELS[listing.type] ?? listing.type} · {listing.locationName}
        </p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {listing.imageCount} {listing.imageCount === 1 ? 'photo' : 'photos'} · {HINTS[listing.status]}
        </p>
        {listing.moderationNote && listing.status === 'draft' && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Sent back for changes:</strong> {listing.moderationNote}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={`/landlord/listings/${listing.slug}`} className="btn">
            Edit
          </Link>
          {listing.status === 'published' && (
            <Link to={`/properties/${listing.slug}`} className="btn">
              View live
            </Link>
          )}
          {ACTIONS[listing.status]?.map((a) => (
            <button
              key={a.action}
              type="button"
              className={`btn ${a.primary ? 'btn-primary' : ''}`}
              disabled={busy}
              onClick={() => run(a.action)}
            >
              {a.label}
            </button>
          ))}
          <button type="button" className="btn btn-ghost text-rose-700 dark:text-rose-400" disabled={busy} onClick={remove}>
            Delete
          </button>
        </div>
        <div className="mt-2">
          <FormError>{error}</FormError>
        </div>
      </div>
    </li>
  );
}

export default function MyListings() {
  const [page, setPage] = useState(1);
  const state = useAsync(({ signal }) => fetchMyListings({ page }, { signal }), [page]);
  const [overrides, setOverrides] = useState({}); // slug -> updated listing | null (deleted)

  const rows = (state.data?.data ?? []).filter((l) => overrides[l.slug] !== null).map((l) => overrides[l.slug] ?? l);

  if (state.loading && !state.data) {
    return (
      <div role="status" aria-label="Loading your listings" className="space-y-4">
        <div className="skeleton h-40 w-full rounded-2xl" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (state.error) {
    return (
      <EmptyState
        title="We couldn’t load your listings"
        message="Check your connection and try again."
        action={
          <button type="button" className="btn btn-primary" onClick={state.reload}>
            Try again
          </button>
        }
      />
    );
  }

  if (!rows.length) {
    return (
      <EmptyState
        title="You haven’t listed a home yet"
        message="Add your first home. You can save it as a draft, add photos, and submit it for review when it’s ready."
        action={
          <Link to="/landlord/listings/new" className="btn btn-primary">
            Add a home
          </Link>
        }
      />
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {rows.map((listing) => (
          <ListingRow
            key={listing.slug}
            listing={listing}
            // The action response has no message counts; keep the ones already on screen.
            onChanged={(next) =>
              setOverrides((o) => ({
                ...o,
                [next.slug]: { ...next, inquiryCount: listing.inquiryCount, newInquiryCount: listing.newInquiryCount },
              }))
            }
            onDeleted={(slug) => setOverrides((o) => ({ ...o, [slug]: null }))}
          />
        ))}
      </ul>
      <Pagination meta={state.data?.meta} onPageChange={setPage} />
    </>
  );
}
