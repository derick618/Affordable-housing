import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createListing,
  fetchAmenityOptions,
  fetchLocationOptions,
  fetchMyListing,
  runListingAction,
  updateListing,
} from '../../api/account';
import { emptyListingForm, listingToForm, mapFieldErrors } from '../../api/accountMapper';
import { describeApiError } from '../../api/errors';
import EmptyState from '../../components/EmptyState';
import Field, { FormError } from '../../components/Field';
import { ArrowLeftIcon, CheckIcon } from '../../components/icons';
import { AVAILABILITY_OPTIONS, PROPERTY_TYPES } from '../../data/constants';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import PhotoManager from './PhotoManager';

const FURNISHING = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi-furnished' },
  { value: 'furnished', label: 'Furnished' },
];
const NEARBY_KINDS = [
  { value: 'transport', label: 'Transport' },
  { value: 'school', label: 'School' },
  { value: 'health', label: 'Health' },
  { value: 'market', label: 'Market' },
];
const AVAILABILITY = AVAILABILITY_OPTIONS.filter((o) => o.value);
const MAX_NEARBY = 10;

function Section({ title, hint, children }) {
  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-stone-900 dark:text-white">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Add a new home, or edit one of yours. Photos and review actions appear once it is saved. */
export default function ListingEditor() {
  const { slug } = useParams();
  const isNew = !slug;
  const navigate = useNavigate();
  usePageTitle(isNew ? 'Add a home' : 'Edit your home');

  const reference = useAsync(
    async ({ signal }) => {
      const [places, amenities] = await Promise.all([fetchLocationOptions({ signal }), fetchAmenityOptions({ signal })]);
      return { places, amenities };
    },
    []
  );
  const loaded = useAsync(({ signal }) => (isNew ? Promise.resolve(undefined) : fetchMyListing(slug, { signal })), [slug]);

  const [form, setForm] = useState(emptyListingForm);
  const [listing, setListing] = useState(null);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  // Fill the form once the saved listing arrives (or when switching between listings).
  useEffect(() => {
    if (loaded.data) {
      setListing(loaded.data);
      setForm(listingToForm(loaded.data));
    } else if (isNew) {
      setListing(null);
      setForm(emptyListingForm());
    }
    setErrors({});
    setFailure(null);
    setNotice(null);
  }, [loaded.data, isNew]);

  const set = (name) => (event) => {
    setNotice(null);
    setForm((f) => ({ ...f, [name]: event.target.value }));
  };
  const setFlag = (name) => (event) => setForm((f) => ({ ...f, [name]: event.target.checked }));

  const places = reference.data?.places ?? [];
  const groupedAmenities = useMemo(() => {
    const groups = new Map();
    for (const a of reference.data?.amenities ?? []) {
      if (!groups.has(a.category)) groups.set(a.category, []);
      groups.get(a.category).push(a);
    }
    return [...groups.entries()];
  }, [reference.data]);

  function toggleAmenity(slugValue) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.some((a) => a.slug === slugValue)
        ? f.amenities.filter((a) => a.slug !== slugValue)
        : [...f.amenities, { slug: slugValue, note: '' }],
    }));
  }

  const setNearby = (index, patch) =>
    setForm((f) => ({ ...f, nearby: f.nearby.map((n, i) => (i === index ? { ...n, ...patch } : n)) }));

  function reportFailure(error, fallback) {
    const { message, fields } = describeApiError(error, fallback);
    const mapped = mapFieldErrors(fields);
    setErrors(mapped);
    setFailure(Object.keys(mapped).length ? 'Please check the highlighted fields.' : message);
  }

  async function handleSave(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setFailure(null);
    setNotice(null);
    try {
      if (isNew) {
        const created = await createListing(form);
        navigate(`/landlord/listings/${created.slug}`, { replace: true, state: { created: true } });
      } else {
        const saved = await updateListing(slug, form);
        setListing((current) => ({ ...current, ...saved, images: current?.images ?? saved.images }));
        setNotice('Changes saved.');
      }
    } catch (error) {
      reportFailure(error, "We couldn't save your home. Please try again.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  async function handleAction(action) {
    setBusy(true);
    setErrors({});
    setFailure(null);
    setNotice(null);
    try {
      const next = await runListingAction(slug, action);
      setListing(next);
      setNotice(
        action === 'submit' ? 'Submitted. Our team will review it shortly.' : 'Updated.'
      );
    } catch (error) {
      // These are not form submissions, so say what is missing ("Add at least one photo…").
      const { message, fields } = describeApiError(error, "That didn't work. Please try again.");
      setErrors(mapFieldErrors(fields));
      setFailure(Object.values(fields)[0] ?? message);
    } finally {
      setBusy(false);
    }
  }

  // ---------------------------------------------------------------- states

  if (!isNew && loaded.loading && !listing) {
    return (
      <div className="container-page max-w-4xl py-10">
        <div role="status" aria-label="Loading" className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (loaded.error || reference.error) {
    return (
      <div className="container-page max-w-4xl py-10">
        <EmptyState
          title="We couldn’t load this page"
          message="Check your connection and try again."
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                loaded.reload();
                reference.reload();
              }}
            >
              Try again
            </button>
          }
        />
      </div>
    );
  }

  if (!isNew && loaded.data === null) {
    return (
      <div className="container-page max-w-4xl py-10">
        <EmptyState
          title="We couldn’t find that home"
          message="It may have been deleted, or it belongs to a different account."
          action={
            <Link to="/landlord" className="btn btn-primary">
              Back to my homes
            </Link>
          }
        />
      </div>
    );
  }

  const status = listing?.status;

  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <Link to="/landlord" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
        <ArrowLeftIcon className="h-4 w-4" /> My homes
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
        {isNew ? 'Add a home' : listing?.title || 'Edit your home'}
      </h1>

      {listing && (
        <div className="card mt-6 space-y-3">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`badge ${status === 'published' ? 'badge-good' : status === 'pending_review' ? 'badge-pending' : ''}`}>
              {listing.statusLabel}
            </span>
            <span className="text-stone-600 dark:text-stone-400">
              {status === 'draft' && 'Only you can see this. Submit it for review when it’s ready.'}
              {status === 'pending_review' && 'Our team is reviewing this home. You can still make changes.'}
              {status === 'published' && 'Live on the marketplace. Changes you save appear immediately.'}
              {status === 'archived' && 'Not visible to renters.'}
            </span>
          </p>
          {listing.moderationNote && status === 'draft' && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <strong>Sent back for changes:</strong> {listing.moderationNote}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {status === 'draft' && (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => handleAction('submit')}>
                Submit for review
              </button>
            )}
            {status === 'pending_review' && (
              <button type="button" className="btn" disabled={busy} onClick={() => handleAction('withdraw')}>
                Withdraw
              </button>
            )}
            {(status === 'draft' || status === 'published') && (
              <button type="button" className="btn" disabled={busy} onClick={() => handleAction('archive')}>
                {status === 'published' ? 'Take offline' : 'Archive'}
              </button>
            )}
            {status === 'archived' && (
              <button type="button" className="btn" disabled={busy} onClick={() => handleAction('reopen')}>
                Reopen as draft
              </button>
            )}
            {status === 'published' && (
              <Link to={`/properties/${listing.slug}`} className="btn">
                View live
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3" aria-live="polite">
        <FormError>{failure}</FormError>
        {notice && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckIcon className="h-4 w-4 shrink-0" />
            {notice}
          </p>
        )}
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-6" noValidate>
        <Section title="The basics">
          <Field label="Title" error={errors.title} hint="e.g. Modern 2 Bedroom Apartment in Mikocheni">
            {(props) => <input {...props} className="field-input" value={form.title} onChange={set('title')} maxLength={160} required />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type of home" error={errors.type}>
              {(props) => (
                <select {...props} className="field-input" value={form.type} onChange={set('type')}>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Rent per month (TZS)" error={errors.price}>
              {(props) => (
                <input {...props} className="field-input" type="number" inputMode="numeric" min="10000" step="5000" value={form.price} onChange={set('price')} required />
              )}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Rent paid in advance (months)" error={errors.advanceMonths}>
              {(props) => <input {...props} className="field-input" type="number" min="1" max="12" value={form.advanceMonths} onChange={set('advanceMonths')} />}
            </Field>
            <Field label="Availability" error={errors.availability}>
              {(props) => (
                <select {...props} className="field-input" value={form.availability} onChange={set('availability')}>
                  {AVAILABILITY.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Available from" optional error={errors.availableFrom}>
              {(props) => <input {...props} className="field-input" type="date" value={form.availableFrom} onChange={set('availableFrom')} />}
            </Field>
          </div>
        </Section>

        <Section title="The home">
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Bedrooms" error={errors.bedrooms}>
              {(props) => <input {...props} className="field-input" type="number" min="0" max="20" value={form.bedrooms} onChange={set('bedrooms')} required />}
            </Field>
            <Field label="Bathrooms" error={errors.bathrooms}>
              {(props) => <input {...props} className="field-input" type="number" min="0" max="20" value={form.bathrooms} onChange={set('bathrooms')} required />}
            </Field>
            <Field label="Size (m²)" optional error={errors.sizeSqm}>
              {(props) => <input {...props} className="field-input" type="number" min="5" value={form.sizeSqm} onChange={set('sizeSqm')} />}
            </Field>
            <Field label="Furnishing" error={errors.furnishing}>
              {(props) => (
                <select {...props} className="field-input" value={form.furnishing} onChange={set('furnishing')}>
                  {FURNISHING.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <Field label="Short summary" optional error={errors.summary} hint="One line shown on search results.">
            {(props) => <input {...props} className="field-input" value={form.summary} onChange={set('summary')} maxLength={200} />}
          </Field>
          <Field label="Description" error={errors.description} hint="Needed before you can submit. Describe the rooms, the neighbourhood and anything renters should know.">
            {(props) => <textarea {...props} className="field-input" rows={6} value={form.description} onChange={set('description')} maxLength={5000} />}
          </Field>
        </Section>

        <Section title="Where it is">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Area" error={errors.locationSlug}>
              {(props) => (
                <select {...props} className="field-input" value={form.locationSlug} onChange={set('locationSlug')} required>
                  <option value="">Choose an area…</option>
                  {places.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.parentName ? `${p.name} (${p.parentName})` : p.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Street or plot" optional error={errors.address}>
              {(props) => <input {...props} className="field-input" value={form.address} onChange={set('address')} maxLength={255} />}
            </Field>
          </div>
        </Section>

        <Section title="Water and electricity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Water" optional error={errors.water} hint="e.g. DAWASA mains with a storage tank">
              {(props) => <input {...props} className="field-input" value={form.water} onChange={set('water')} maxLength={255} />}
            </Field>
            <Field label="Electricity" optional error={errors.power} hint="e.g. Own prepaid LUKU meter">
              {(props) => <input {...props} className="field-input" value={form.power} onChange={set('power')} maxLength={255} />}
            </Field>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={form.waterIncluded} onChange={setFlag('waterIncluded')} />
              Water is included in the rent
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={form.powerIncluded} onChange={setFlag('powerIncluded')} />
              Electricity is included in the rent
            </label>
          </div>
        </Section>

        <Section title="Features" hint="Tick everything the home has.">
          {groupedAmenities.map(([category, items]) => (
            <fieldset key={category} className="border-0 p-0">
              <legend className="mb-2 text-sm font-bold capitalize text-stone-700 dark:text-stone-300">{category}</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                  <label key={a.slug} className="flex min-h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-700"
                      checked={form.amenities.some((x) => x.slug === a.slug)}
                      onChange={() => toggleAmenity(a.slug)}
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {errors.amenities && <FormError>{errors.amenities}</FormError>}
        </Section>

        <Section title="Nearby" hint="Schools, transport, clinics and markets close to the home.">
          {form.nearby.map((n, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
              <select aria-label={`Nearby place ${index + 1} type`} className="field-input" value={n.kind} onChange={(e) => setNearby(index, { kind: e.target.value })}>
                {NEARBY_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
              <input
                aria-label={`Nearby place ${index + 1} description`}
                className="field-input"
                placeholder="e.g. Daladala stop, 5 min walk"
                value={n.text}
                maxLength={120}
                onChange={(e) => setNearby(index, { text: e.target.value })}
              />
              <button type="button" className="btn btn-ghost" onClick={() => setForm((f) => ({ ...f, nearby: f.nearby.filter((_, i) => i !== index) }))}>
                Remove
              </button>
            </div>
          ))}
          {errors.nearby && <FormError>{errors.nearby}</FormError>}
          {form.nearby.length < MAX_NEARBY && (
            <button type="button" className="btn" onClick={() => setForm((f) => ({ ...f, nearby: [...f.nearby, { kind: 'transport', text: '' }] }))}>
              Add a nearby place
            </button>
          )}
        </Section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to="/landlord" className="btn">
            {isNew ? 'Cancel' : 'Back'}
          </Link>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : isNew ? 'Save and add photos' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <Section
          title="Photos"
          hint={isNew ? 'Save your home first, then you can add photos.' : 'Clear, bright photos of each room. The first photo is the cover.'}
        >
          {!isNew && listing && (
            <PhotoManager
              slug={listing.slug}
              images={listing.images}
              error={errors.images}
              onChange={(images) => setListing((current) => ({ ...current, images, imageCount: images.length, cover: images[0] ?? null }))}
            />
          )}
        </Section>
      </div>
    </div>
  );
}
