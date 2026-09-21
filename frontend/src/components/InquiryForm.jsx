import { useState } from 'react';
import { sendInquiry } from '../api/account';
import { INQUIRY_FIELD_MAP, mapFieldErrors } from '../api/accountMapper';
import { describeApiError } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import Field, { FormError } from './Field';
import { CheckIcon } from './icons';

/**
 * "Send a message to the owner". The owner's phone number is never shown to the renter:
 * they leave their own details and the owner replies from their dashboard.
 */
export default function InquiryForm({ property, onDone }) {
  const { user } = useAuth();
  const firstName = property.owner?.name?.split(' ')[0] ?? 'there';
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: '',
    preferredContact: 'phone',
    message: `Hello ${firstName}, I saw "${property.title}" in ${property.location.area} and I'm interested. Is it still available?`,
  });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (name) => (event) => setForm((f) => ({ ...f, [name]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors({});
    setFailure(null);
    try {
      await sendInquiry(property.id, form);
      setSent(true);
    } catch (error) {
      const { message, fields } = describeApiError(error, "We couldn't send your message. Please try again.");
      const mapped = mapFieldErrors(fields, INQUIRY_FIELD_MAP);
      setErrors(mapped);
      // A 422 lands on the fields; anything else (offline, throttled, 5xx) is a form-level message.
      setFailure(Object.keys(mapped).length ? null : message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h3 className="mt-3 text-lg font-bold text-stone-900 dark:text-white">Message sent</h3>
        <p className="mt-1 max-w-sm text-sm text-stone-600 dark:text-stone-400">
          {property.owner?.name ?? 'The owner'} will contact you on the number you gave. Never pay before you have
          seen the home in person.
        </p>
        <button type="button" className="btn btn-primary mt-5" onClick={onDone}>
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Leave your details and the owner will contact you. Their phone number isn’t shown on the website.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" error={errors.name}>
          {(props) => (
            <input {...props} className="field-input" value={form.name} onChange={set('name')} autoComplete="name" maxLength={120} required />
          )}
        </Field>
        <Field label="Your phone" error={errors.phone} hint="e.g. +255 712 345 678">
          {(props) => (
            <input {...props} className="field-input" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" required />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" optional error={errors.email}>
          {(props) => (
            <input {...props} className="field-input" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          )}
        </Field>
        <Field label="Best way to reach you" error={errors.preferredContact}>
          {(props) => (
            <select {...props} className="field-input" value={form.preferredContact} onChange={set('preferredContact')}>
              <option value="phone">Phone call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          )}
        </Field>
      </div>

      <Field label="Message" error={errors.message}>
        {(props) => (
          <textarea {...props} className="field-input" rows={4} maxLength={1000} value={form.message} onChange={set('message')} required />
        )}
      </Field>

      <FormError>{failure}</FormError>

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
