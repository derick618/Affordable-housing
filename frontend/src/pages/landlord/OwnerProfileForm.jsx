import { useState } from 'react';
import { saveOwnerProfile } from '../../api/account';
import { OWNER_FIELD_MAP, mapFieldErrors } from '../../api/accountMapper';
import { describeApiError } from '../../api/errors';
import Field, { FormError } from '../../components/Field';
import { VerifiedBadge } from '../../components/Badges';
import { CheckIcon } from '../../components/icons';
import { useAuth } from '../../context/AuthContext';

/**
 * Create or edit the signed-in user's landlord / agent profile. The phone number is kept
 * private: it is used by our team to verify you and is never shown on a listing.
 */
export default function OwnerProfileForm({ profile, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name ?? user?.name ?? '',
    type: profile?.type ?? 'landlord',
    phone: profile?.phone ?? user?.phone ?? '',
    whatsapp: profile?.whatsapp ?? '',
    languages: profile?.languages ?? 'Kiswahili, English',
    responseTime: profile?.responseTime ?? '',
  });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (name) => (event) => {
    setSaved(false);
    setForm((f) => ({ ...f, [name]: event.target.value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setFailure(null);
    try {
      const next = await saveOwnerProfile(form);
      setSaved(true);
      onSaved(next);
    } catch (error) {
      const { message, fields } = describeApiError(error, "We couldn't save your profile. Please try again.");
      const mapped = mapFieldErrors(fields, OWNER_FIELD_MAP);
      setErrors(mapped);
      setFailure(Object.keys(mapped).length ? null : message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-5" noValidate>
      {profile && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
          {profile.verified ? (
            <VerifiedBadge label="Verified owner" />
          ) : (
            <span className="badge badge-pending">Not verified yet</span>
          )}
          {profile.verified
            ? 'If you change your name or phone number, our team will need to verify you again.'
            : 'Our team checks your ID before the “Verified” badge appears on your listings.'}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name shown on your listings" error={errors.name}>
          {(props) => <input {...props} className="field-input" value={form.name} onChange={set('name')} maxLength={120} required />}
        </Field>
        <Field label="I am a" error={errors.type}>
          {(props) => (
            <select {...props} className="field-input" value={form.type} onChange={set('type')}>
              <option value="landlord">Landlord</option>
              <option value="agent">Property agent</option>
            </select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" error={errors.phone} hint="Private. Used to verify you; not shown to renters.">
          {(props) => <input {...props} className="field-input" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" required />}
        </Field>
        <Field label="WhatsApp" optional error={errors.whatsapp}>
          {(props) => <input {...props} className="field-input" type="tel" value={form.whatsapp} onChange={set('whatsapp')} />}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Languages" optional error={errors.languages}>
          {(props) => <input {...props} className="field-input" value={form.languages} onChange={set('languages')} maxLength={120} />}
        </Field>
        <Field label="Usually replies" optional error={errors.responseTime} hint="e.g. within a day">
          {(props) => <input {...props} className="field-input" value={form.responseTime} onChange={set('responseTime')} maxLength={60} />}
        </Field>
      </div>

      <FormError>{failure}</FormError>
      {saved && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <CheckIcon className="h-4 w-4" /> Profile saved
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Saving…' : profile ? 'Save profile' : 'Create landlord profile'}
      </button>
    </form>
  );
}
