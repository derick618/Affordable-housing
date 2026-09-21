import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchOwnerProfile } from '../../api/account';
import EmptyState from '../../components/EmptyState';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import Inbox from './Inbox';
import MyListings from './MyListings';
import OwnerProfileForm from './OwnerProfileForm';

const TABS = [
  { id: 'listings', label: 'My homes' },
  { id: 'messages', label: 'Messages' },
  { id: 'profile', label: 'Profile' },
];

/** The landlord's workspace: their homes, the messages about them, and their profile. */
export default function Landlord() {
  usePageTitle('List your home');
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab = TABS.some((t) => t.id === requested) ? requested : 'listings';
  const profileState = useAsync(({ signal }) => fetchOwnerProfile({ signal }), []);
  const [profile, setProfile] = useState(undefined); // undefined = not edited yet, use the loaded one
  const [unread, setUnread] = useState(0);
  const current = profile === undefined ? profileState.data : profile;

  let body;
  if (profileState.loading && profile === undefined) {
    body = <div role="status" aria-label="Loading" className="skeleton h-40 w-full rounded-2xl" />;
  } else if (profileState.error && profile === undefined) {
    body = (
      <EmptyState
        title="We couldn’t load your account"
        message="Check your connection and try again."
        action={
          <button type="button" className="btn btn-primary" onClick={profileState.reload}>
            Try again
          </button>
        }
      />
    );
  } else if (!current) {
    // First visit: everyone starts by telling renters who they are.
    body = (
      <>
        <h2 className="text-xl font-extrabold text-stone-900 dark:text-white">First, tell renters who you are</h2>
        <p className="mb-5 mt-1 max-w-2xl text-stone-600 dark:text-stone-400">
          Create your landlord profile. Your name is shown on your listings. Your phone number stays private and is only
          used to verify you.
        </p>
        <OwnerProfileForm profile={null} onSaved={setProfile} />
      </>
    );
  } else {
    body = (
      <>
        <nav aria-label="Landlord sections" className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="pill"
              aria-pressed={tab === t.id}
              onClick={() => setParams(t.id === 'listings' ? {} : { tab: t.id })}
            >
              {t.label}
              {t.id === 'messages' && unread > 0 && (
                <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
          ))}
        </nav>

        <section aria-label={TABS.find((t) => t.id === tab).label}>
          {tab === 'listings' && <MyListings />}
          {tab === 'messages' && <Inbox onUnread={setUnread} />}
          {tab === 'profile' && <OwnerProfileForm profile={current} onSaved={setProfile} />}
        </section>
      </>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">For landlords and agents</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">List your home</h1>
        </div>
        {current && (
          <Link to="/landlord/listings/new" className="btn btn-primary">
            Add a home
          </Link>
        )}
      </div>
      {body}
    </div>
  );
}
