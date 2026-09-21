import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLocationOptions } from '../api/account';
import { AFFORDABILITY_FIELD_MAP, mapFieldErrors } from '../api/accountMapper';
import { describeApiError } from '../api/errors';
import Field, { FormError } from '../components/Field';
import { CheckIcon } from '../components/icons';
import { BEDROOM_OPTIONS, BUDGET_CAPS, PROPERTY_TYPES } from '../data/constants';
import { useProfile } from '../context/ProfileContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatTZS } from '../utils/format';

const blank = { monthlyBudget: '', householdSize: '', minBedrooms: '', locationSlug: '', propertyTypes: [] };

function toForm(profile) {
  if (!profile) return blank;
  return {
    monthlyBudget: profile.monthlyBudget == null ? '' : String(profile.monthlyBudget),
    householdSize: profile.householdSize == null ? '' : String(profile.householdSize),
    minBedrooms: profile.minBedrooms == null ? '' : String(profile.minBedrooms),
    locationSlug: profile.locationSlug ?? '',
    propertyTypes: profile.propertyTypes ?? [],
  };
}

/**
 * The signed-in renter's saved budget. It is only used to show "Within your budget" on the
 * homes you browse and to pre-fill nothing else: it never hides or ranks listings.
 */
export default function MyBudget() {
  usePageTitle('My budget');
  const { profile, save, remove } = useProfile();
  const [form, setForm] = useState(() => toForm(profile));
  const [places, setPlaces] = useState([]);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  // The profile arrives after sign-in resolves; fill the form once when it does.
  useEffect(() => setForm(toForm(profile)), [profile]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLocationOptions({ signal: controller.signal })
      .then(setPlaces)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const set = (name) => (event) => {
    setNotice(null);
    setForm((f) => ({ ...f, [name]: event.target.value }));
  };

  const toggleType = (value) => {
    setNotice(null);
    setForm((f) => ({
      ...f,
      propertyTypes: f.propertyTypes.includes(value) ? f.propertyTypes.filter((t) => t !== value) : [...f.propertyTypes, value],
    }));
  };

  async function handleSave(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setFailure(null);
    try {
      await save(form);
      setNotice('Saved. Homes within this budget are now marked as you browse.');
    } catch (error) {
      const { message, fields } = describeApiError(error, "We couldn't save your budget. Please try again.");
      const mapped = mapFieldErrors(fields, AFFORDABILITY_FIELD_MAP);
      setErrors(mapped);
      setFailure(Object.keys(mapped).length ? null : message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await remove();
      setNotice('Your saved budget was removed.');
    } catch (error) {
      setFailure(describeApiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  const budget = Number(form.monthlyBudget);

  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <p className="eyebrow">Your account</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">My budget</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Tell us what you can pay each month. We’ll mark homes that fit while you browse. This is private to you, and we
        never hide homes because of it.
      </p>

      <form onSubmit={handleSave} className="card mt-8 space-y-6" noValidate>
        <Field label="Monthly budget (TZS)" error={errors.monthlyBudget} hint={budget > 0 ? formatTZS(budget) : 'Rent you can pay each month'}>
          {(props) => (
            <input
              {...props}
              className="field-input"
              type="number"
              inputMode="numeric"
              min="10000"
              step="10000"
              value={form.monthlyBudget}
              onChange={set('monthlyBudget')}
            />
          )}
        </Field>
        <div className="-mt-3 flex flex-wrap gap-2" role="group" aria-label="Common budgets">
          {BUDGET_CAPS.map((cap) => (
            <button
              key={cap}
              type="button"
              className="pill"
              aria-pressed={Number(form.monthlyBudget) === cap}
              onClick={() => {
                setNotice(null);
                setForm((f) => ({ ...f, monthlyBudget: String(cap) }));
              }}
            >
              {formatTZS(cap)}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="People in your household" optional error={errors.householdSize}>
            {(props) => (
              <input {...props} className="field-input" type="number" min="1" max="20" value={form.householdSize} onChange={set('householdSize')} />
            )}
          </Field>
          <Field label="Bedrooms needed" optional error={errors.minBedrooms}>
            {(props) => (
              <select {...props} className="field-input" value={form.minBedrooms} onChange={set('minBedrooms')}>
                {BEDROOM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <Field label="Preferred area" optional error={errors.locationSlug}>
          {(props) => (
            <select {...props} className="field-input" value={form.locationSlug} onChange={set('locationSlug')}>
              <option value="">Anywhere</option>
              {places.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.parentName ? `${p.name} (${p.parentName})` : p.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <fieldset className="border-0 p-0">
          <legend className="field-label">
            Home types <span className="font-normal text-stone-500 dark:text-stone-400">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((t) => (
              <button key={t.value} type="button" className="pill" aria-pressed={form.propertyTypes.includes(t.value)} onClick={() => toggleType(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        <FormError>{failure}</FormError>
        {notice && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckIcon className="h-4 w-4 shrink-0" />
            {notice}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button type="button" className="btn btn-ghost" onClick={handleRemove} disabled={busy || !profile}>
            Remove my budget
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/properties" className="btn">
              Browse homes
            </Link>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save budget'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
