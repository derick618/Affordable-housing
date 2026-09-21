import { useState } from 'react';
import { describeApiError } from '../api/errors';
import { submitReport } from '../api/engagement';
import Modal from './Modal';
import { CheckIcon } from './icons';

// `value` is what the API accepts; `label` is what people read.
const REASONS = [
  { value: 'scam', label: 'It looks like a scam, or asks for money upfront' },
  { value: 'misrepresented', label: 'The property does not exist or is misrepresented' },
  { value: 'already_rented', label: 'The property has already been rented' },
  { value: 'wrong_details', label: 'The price or photos are wrong' },
  { value: 'other', label: 'Something else' },
];

/**
 * Report a listing. Sends the report to the API when it is enabled (VITE_USE_API); with the
 * local demo data it only shows the confirmation.
 */
export default function ReportListingModal({ open, onClose, property }) {
  const [reason, setReason] = useState(REASONS[0].value);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleClose() {
    onClose();
    setSent(false);
    setDetails('');
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReport(property.id, { reason, details: details.trim() });
      setSent(true);
    } catch (err) {
      const { message, fields } = describeApiError(err, "We couldn't send your report. Please try again.");
      setError(fields.details || fields.reason || message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Report this listing" description={property.title}>
      {sent ? (
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckIcon className="h-6 w-6" />
          </span>
          <h3 className="mt-3 text-lg font-bold text-stone-900 dark:text-white">Thank you for telling us</h3>
          <p className="mt-1 max-w-sm text-sm text-stone-600 dark:text-stone-400">
            Reports help keep the platform safe. Our team reviews every report about a listing.
          </p>
          <button type="button" className="btn btn-primary mt-5" onClick={handleClose}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2 border-0 p-0">
            <legend className="field-label">What is wrong with this listing?</legend>
            {REASONS.map((r) => (
              <label
                key={r.value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-3 py-2 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 dark:border-stone-700 dark:has-[:checked]:bg-brand-950/50"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="h-4 w-4 accent-brand-700"
                />
                {r.label}
              </label>
            ))}
          </fieldset>

          <div>
            <label htmlFor="report-details" className="field-label">
              More details <span className="font-normal text-stone-500">(optional)</span>
            </label>
            <textarea
              id="report-details"
              rows={3}
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="field-input"
              placeholder="Tell us what happened"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Sending…' : 'Submit report'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
