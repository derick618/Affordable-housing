import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyInquiries, setInquiryStatus } from '../../api/account';
import { describeApiError } from '../../api/errors';
import EmptyState from '../../components/EmptyState';
import { FormError } from '../../components/Field';
import { PhoneIcon } from '../../components/icons';
import { useAsync } from '../../hooks/useAsync';
import { timeAgo } from '../../utils/format';

const STATUS = {
  new: { label: 'New', className: 'badge badge-brand' },
  read: { label: 'Read', className: 'badge' },
  replied: { label: 'Replied', className: 'badge badge-good' },
  closed: { label: 'Closed', className: 'badge' },
};

const CONTACT_LABEL = { phone: 'a phone call', whatsapp: 'WhatsApp', email: 'email' };

function InquiryCard({ inquiry, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const status = STATUS[inquiry.status] ?? STATUS.read;

  async function mark(next) {
    setBusy(true);
    setError(null);
    try {
      onChange(await setInquiryStatus(inquiry.id, next));
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  const tel = inquiry.phone.replace(/\s+/g, '');

  return (
    <li className="card !p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={status.className}>{status.label}</span>
        <span className="text-sm text-stone-500 dark:text-stone-400">{timeAgo(inquiry.createdAt)}</span>
        {inquiry.propertySlug && (
          <Link to={`/landlord/listings/${inquiry.propertySlug}`} className="ml-auto truncate text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {inquiry.propertyTitle}
          </Link>
        )}
      </div>

      <p className="mt-2 font-bold text-stone-900 dark:text-white">{inquiry.name}</p>
      <p className="mt-1 whitespace-pre-line text-sm text-stone-700 dark:text-stone-300">{inquiry.message}</p>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
        Prefers {CONTACT_LABEL[inquiry.preferredContact] ?? 'a phone call'}
        {inquiry.email && ` · ${inquiry.email}`}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`tel:${tel}`} className="btn btn-primary" onClick={() => inquiry.status === 'new' && mark('read')}>
          <PhoneIcon className="h-4 w-4" />
          Call {inquiry.phone}
        </a>
        {inquiry.status !== 'replied' && (
          <button type="button" className="btn" disabled={busy} onClick={() => mark('replied')}>
            Mark as replied
          </button>
        )}
        {inquiry.status === 'new' && (
          <button type="button" className="btn" disabled={busy} onClick={() => mark('read')}>
            Mark as read
          </button>
        )}
        {inquiry.status !== 'closed' ? (
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => mark('closed')}>
            Close
          </button>
        ) : (
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => mark('read')}>
            Reopen
          </button>
        )}
      </div>
      <div className="mt-2">
        <FormError>{error}</FormError>
      </div>
    </li>
  );
}

/** Messages renters sent about your listings. Their contact details are only visible here. */
export default function Inbox({ onUnread }) {
  const state = useAsync(({ signal }) => fetchMyInquiries({}, { signal }), []);
  const [updated, setUpdated] = useState({});

  const rows = (state.data?.data ?? []).map((i) => updated[i.id] ?? i);
  const unread = rows.filter((i) => i.status === 'new').length;

  // Tell the tab bar how many are new (after render, never during it).
  useEffect(() => {
    onUnread?.(unread);
  }, [unread, onUnread]);

  if (state.loading && !state.data) {
    return (
      <div role="status" aria-label="Loading messages" className="space-y-3">
        <div className="skeleton h-28 w-full rounded-2xl" />
        <div className="skeleton h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (state.error) {
    return (
      <EmptyState
        title="We couldn’t load your messages"
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
        title="No messages yet"
        message="When a renter contacts you about one of your homes, their message and phone number will appear here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((inquiry) => (
        <InquiryCard key={inquiry.id} inquiry={inquiry} onChange={(next) => setUpdated((u) => ({ ...u, [next.id]: next }))} />
      ))}
    </ul>
  );
}
