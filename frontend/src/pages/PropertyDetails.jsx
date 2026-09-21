import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Gallery from '../components/Gallery';
import ContactOwnerModal from '../components/ContactOwnerModal';
import ReportListingModal from '../components/ReportListingModal';
import FavoriteButton from '../components/FavoriteButton';
import PropertyCard from '../components/PropertyCard';
import EmptyState from '../components/EmptyState';
import { PropertyGridSkeleton } from '../components/PropertyCardSkeleton';
import SafetyNotice, { SafetyReminder } from '../components/SafetyNotice';
import { AvailabilityBadge, TypeBadge, VERIFIED_EXPLAINER, VerifiedBadge } from '../components/Badges';
import {
  ArrowLeftIcon,
  BathIcon,
  BedIcon,
  BookIcon,
  BuildingIcon,
  BusIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  DropletIcon,
  FlagIcon,
  InfoIcon,
  MapPinIcon,
  MessageIcon,
  PlusCrossIcon,
  RulerIcon,
  ShieldCheckIcon,
  SofaIcon,
  StoreIcon,
  WalletIcon,
  ZapIcon,
} from '../components/icons';
import { TYPE_LABELS } from '../data/constants';
import { fetchProperty, fetchSimilar } from '../api/properties';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatDate, formatTZS, timeAgo } from '../utils/format';

const NEARBY_ICONS = { transport: BusIcon, school: BookIcon, market: StoreIcon, health: PlusCrossIcon };

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-stone-900">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</p>
        <p className="text-sm leading-snug font-bold text-stone-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

/** One quiet info line: icon + text. Used for all trust information so it reads consistently. */
function InfoLine({ icon: Icon, children, title, muted = false }) {
  return (
    <li title={title} className="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-400">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${muted ? 'text-stone-400' : 'text-brand-700 dark:text-brand-300'}`} />
      <span>{children}</span>
    </li>
  );
}

function OwnerCard({ owner }) {
  const initials = owner.name
    .split(' ')
    .map((n) => n[0])
    .join('');
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
        {initials}
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold text-stone-900 dark:text-white">{owner.name}</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {owner.role}
          {owner.memberSince ? ` · on the platform since ${owner.memberSince}` : ''}
        </p>
      </div>
    </div>
  );
}

/** Explains when a home can't simply be contacted, and where to go instead. */
function AvailabilityNotice({ property }) {
  if (property.status === 'available') return null;
  const rented = property.status === 'rented';

  return (
    <div
      role="status"
      className={`mb-6 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
        rented
          ? 'border-stone-300 bg-stone-100 dark:border-stone-700 dark:bg-stone-800/60'
          : 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
      }`}
    >
      <div className="flex gap-3">
        <InfoIcon
          className={`mt-0.5 h-5 w-5 shrink-0 ${rented ? 'text-stone-500' : 'text-amber-700 dark:text-amber-300'}`}
        />
        <div>
          <h2 className="font-bold text-stone-900 dark:text-white">
            {rented ? 'This home has been rented' : 'This home is currently reserved'}
          </h2>
          <p className="mt-0.5 text-sm text-stone-700 dark:text-stone-300">
            {rented
              ? 'It is no longer available, but we have picked similar homes that still are.'
              : 'Someone has reserved it for now. You can still contact the owner in case it becomes available again.'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <a href="#similar" className="btn btn-primary">
          See similar homes
        </a>
        {rented && (
          <Link to="/properties?status=available" className="btn">
            Browse available homes
          </Link>
        )}
      </div>
    </div>
  );
}

function ContactCard({ property, onContact, onReport }) {
  const rented = property.status === 'rented';
  const { owner } = property;

  return (
    <div className="card !p-6">
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-3xl font-extrabold tracking-tight text-brand-800 dark:text-brand-200">
          {formatTZS(property.price)}
        </span>
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400">/ month</span>
      </p>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{property.paymentTerms}</p>

      <div className="mt-3">
        <AvailabilityBadge status={property.status} availableFrom={property.availableFrom} />
      </div>

      <div className="mt-5 grid gap-2.5">
        {rented ? (
          <a href="#similar" className="btn btn-primary btn-lg">
            See similar available homes
          </a>
        ) : (
          <>
            <button type="button" className="btn btn-primary btn-lg" onClick={onContact}>
              <MessageIcon className="h-5 w-5" />
              Contact owner
            </button>
            <FavoriteButton propertyId={property.id} title={property.title} variant="button" className="min-h-12" />
          </>
        )}
      </div>

      <hr className="my-5 border-stone-200 dark:border-stone-800" />
      <OwnerCard owner={owner} />

      <ul className="mt-4 space-y-2.5">
        {owner.verified ? (
          <InfoLine icon={ShieldCheckIcon} title={VERIFIED_EXPLAINER}>
            Owner ID checked
          </InfoLine>
        ) : (
          <InfoLine icon={InfoIcon} muted>
            Owner not yet verified. Take extra care and view before paying.
          </InfoLine>
        )}
        {owner.responseTime && <InfoLine icon={ClockIcon}>Usually replies {owner.responseTime}</InfoLine>}
        <InfoLine icon={CalendarIcon}>
          Updated {timeAgo(property.updatedAt)} · Listed {timeAgo(property.listedAt)}
        </InfoLine>
      </ul>

      <SafetyReminder className="mt-5" />

      <button
        type="button"
        onClick={onReport}
        className="mx-auto mt-3 flex min-h-10 items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
      >
        <FlagIcon className="h-3.5 w-3.5" />
        Report this listing
      </button>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="container-page py-8" role="status" aria-label="Loading property">
      <div className="skeleton mb-6 h-5 w-64" />
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div>
          <div className="skeleton aspect-[16/10] rounded-2xl" />
          <div className="skeleton mt-6 h-9 w-3/4" />
          <div className="skeleton mt-3 h-5 w-1/2" />
          <div className="skeleton mt-8 h-40 w-full" />
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </div>
  );
}

export default function PropertyDetails() {
  const { id } = useParams();
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const property = useAsync(({ signal }) => fetchProperty(id, { signal }), [id]);
  // The backend owns the similarity rules, so only the slug is needed (no second property fetch).
  const similar = useAsync(({ signal }) => fetchSimilar(id, 3, { signal }), [id]);
  usePageTitle(property.data ? `${property.data.title}, ${property.data.location.area}` : 'Property');

  if (property.loading) return <DetailsSkeleton />;

  if (property.error) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="We couldn’t load this home"
          message="Please check your connection and try again."
          action={
            <>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => {
                  property.reload();
                  similar.reload();
                }}
              >
                Try again
              </button>
              <Link to="/properties" className="btn btn-lg">
                Browse homes
              </Link>
            </>
          }
        />
      </div>
    );
  }

  const p = property.data;
  if (!p) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="We couldn’t find that home"
          message="It may have been removed or rented out. Browse the affordable homes that are available now."
          action={
            <Link to="/properties?status=available" className="btn btn-primary btn-lg">
              Browse available homes
            </Link>
          }
        />
      </div>
    );
  }

  const rented = p.status === 'rented';
  const availableLater = new Date(p.availableFrom) > new Date(Date.now() + 86_400_000);

  return (
    <>
      <div className="container-page pt-6 pb-14">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-x-2 text-sm text-stone-500 dark:text-stone-400">
          <Link to="/properties" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline dark:text-brand-300">
            <ArrowLeftIcon className="h-4 w-4" />
            All homes
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate">{p.location.city}</span>
          <span aria-hidden="true">/</span>
          <span className="truncate font-medium text-stone-800 dark:text-stone-200">{p.location.area}</span>
        </nav>

        <AvailabilityNotice property={p} />

        <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start xl:gap-10">
          <div className="min-w-0">
            <Gallery images={p.images} title={p.title} />

            <header className="mt-7">
              <div className="flex flex-wrap items-center gap-2">
                {p.verified && <VerifiedBadge label="Verified owner" />}
                <AvailabilityBadge status={p.status} availableFrom={p.availableFrom} />
                <TypeBadge type={p.type} />
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl dark:text-white">
                {p.title}
              </h1>
              <p className="mt-2 flex items-start gap-2 text-stone-600 dark:text-stone-400">
                <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" />
                <span>
                  {p.location.area}, {p.location.city}
                  <span className="block text-sm text-stone-500">{p.location.address}</span>
                </span>
              </p>
              <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5 lg:hidden">
                <span className="text-3xl font-extrabold tracking-tight text-brand-800 dark:text-brand-200">
                  {formatTZS(p.price)}
                </span>
                <span className="text-sm font-medium text-stone-500">/ month · {p.paymentTerms}</span>
              </p>
            </header>

            <section aria-label="Key facts" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Fact icon={BuildingIcon} label="Property type" value={TYPE_LABELS[p.type]} />
              <Fact icon={BedIcon} label="Bedrooms" value={p.bedrooms === 0 ? 'Studio' : p.bedrooms} />
              <Fact icon={BathIcon} label="Bathrooms" value={p.bathrooms} />
              {p.sizeSqm && <Fact icon={RulerIcon} label="Size" value={`${p.sizeSqm} m²`} />}
              <Fact icon={SofaIcon} label="Furnishing" value={p.furnished} />
              <Fact
                icon={CalendarIcon}
                label="Available"
                value={availableLater ? formatDate(p.availableFrom) : rented ? 'Rented' : 'Now'}
              />
            </section>

            <section className="mt-9">
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-white">About this home</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-stone-700 dark:text-stone-300">
                {(p.description || p.summary).split('\n\n').map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
              </div>
            </section>

            <section className="mt-9">
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-white">Rent &amp; utilities</h2>
              <dl className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
                {[
                  [WalletIcon, 'Monthly rent', [formatTZS(p.price), p.paymentTerms].filter(Boolean).join(' · ')],
                  [DropletIcon, 'Water', p.water],
                  [ZapIcon, 'Electricity', p.power],
                ]
                  .filter(([, , value]) => value)
                  .map(([Icon, label, value]) => (
                  <div key={label} className="flex items-start gap-3 p-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" />
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</dt>
                      <dd className="text-sm font-semibold text-stone-900 dark:text-white">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-9">
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-white">Amenities</h2>
              <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {p.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2.5 text-stone-700 dark:text-stone-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-9">
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-white">Location &amp; nearby</h2>
              <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="flex items-start gap-3">
                  <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" />
                  <span>
                    <span className="block font-bold text-stone-900 dark:text-white">
                      {p.location.area}, {p.location.city}
                    </span>
                    <span className="text-sm text-stone-600 dark:text-stone-400">{p.location.address}</span>
                  </span>
                </p>
                <ul className="mt-4 space-y-3 border-t border-stone-200 pt-4 dark:border-stone-800">
                  {p.nearby.map((n) => {
                    const Icon = NEARBY_ICONS[n.kind] ?? MapPinIcon;
                    return (
                      <li key={n.text} className="flex items-start gap-3 text-sm text-stone-700 dark:text-stone-300">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="pt-1">{n.text}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-xs text-stone-500">
                  Distances are approximate. Ask the owner for the exact location and directions before visiting.
                </p>
              </div>
            </section>

            <div className="mt-9">
              <SafetyNotice />
            </div>
          </div>

          <aside aria-label="Contact and pricing" className="sticky-aside">
            <ContactCard property={p} onContact={() => setContactOpen(true)} onReport={() => setReportOpen(true)} />
          </aside>
        </div>

        <section id="similar" className="mt-16 scroll-mt-24" aria-labelledby="similar-heading">
          <h2 id="similar-heading" className="text-2xl font-extrabold text-stone-900 dark:text-white">
            {rented ? 'Available homes you may like' : 'Similar affordable homes'}
          </h2>
          <p className="mt-1 text-stone-600 dark:text-stone-400">
            {rented
              ? 'Similar homes in this area and price range that are still available.'
              : 'Other homes in a similar area and price range.'}
          </p>
          {similar.error ? (
            <p className="mt-6 text-sm text-stone-600 dark:text-stone-400">
              We couldn’t load similar homes.{' '}
              <button type="button" className="font-semibold text-brand-700 hover:underline dark:text-brand-300" onClick={similar.reload}>
                Try again
              </button>
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.loading ? (
                <PropertyGridSkeleton count={3} />
              ) : (
                similar.data?.map((s) => (
                  <PropertyCard key={s.id} property={s} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                ))
              )}
            </div>
          )}
        </section>
      </div>

      {/* Mobile action bar: sticks to the bottom of the viewport (but stays above the footer). */}
      <div className="sticky bottom-0 z-30 border-t border-stone-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden dark:border-stone-800 dark:bg-stone-950/95">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex-1">
            <p className="text-lg leading-tight font-extrabold whitespace-nowrap text-brand-800 dark:text-brand-200">{formatTZS(p.price)}</p>
            <p className="text-xs text-stone-500">per month</p>
          </div>
          {rented ? (
            <a href="#similar" className="btn btn-primary min-h-11">
              See similar homes
            </a>
          ) : (
            <>
              <FavoriteButton propertyId={p.id} title={p.title} />
              <button type="button" className="btn btn-primary min-h-11" onClick={() => setContactOpen(true)}>
                Contact owner
              </button>
            </>
          )}
        </div>
      </div>

      <ContactOwnerModal open={contactOpen} onClose={() => setContactOpen(false)} property={p} />
      <ReportListingModal open={reportOpen} onClose={() => setReportOpen(false)} property={p} />
    </>
  );
}
