import Modal from './Modal';
import { SafetyReminder } from './SafetyNotice';
import { VerifiedBadge } from './Badges';
import { InfoIcon, MessageIcon, PhoneIcon } from './icons';
import { USE_API } from '../api/config';
import { DEMO_MODE } from '../config';
import InquiryForm from './InquiryForm';

function formatPhone(e164) {
  // +255700000101 -> +255 700 000 101
  return e164.replace(/^(\+255)(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
}

/**
 * Contact dialog. Phone and WhatsApp numbers are optional: the Laravel API deliberately
 * does not return them yet, so without them the dialog explains that instead of showing
 * call / WhatsApp buttons.
 */
export default function ContactOwnerModal({ open, onClose, property }) {
  const { owner } = property;
  const phone = owner.phone || null;
  const firstName = owner.name.split(' ')[0];
  const message = `Hello ${firstName}, I saw "${property.title}" in ${property.location.area} on Affordable Housing and I'm interested. Is it still available?`;
  const whatsappUrl = phone ? `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}` : null;
  const isDemo = property.isDemo ?? DEMO_MODE;

  const replies = owner.responseTime ? `Usually replies ${owner.responseTime}. ` : '';
  const speaks = owner.languages ? `Speaks ${owner.languages}. ` : '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Contact the owner"
      description={`About: ${property.title}, ${property.location.area}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
          {owner.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold text-stone-900 dark:text-white">{owner.name}</p>
          <p className="flex flex-wrap items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            {owner.role}
            {owner.verified && <VerifiedBadge label="Verified owner" />}
          </p>
        </div>
      </div>

      {phone ? (
        <>
          <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
            {replies}
            {speaks}Mention that you found this home on Affordable Housing.
          </p>

          <div className="mt-5 grid gap-3">
            <a href={`tel:${phone}`} className="btn btn-primary btn-lg">
              <PhoneIcon className="h-5 w-5" />
              Call {formatPhone(phone)}
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-lg">
              <MessageIcon className="h-5 w-5" />
              Message on WhatsApp
            </a>
          </div>
        </>
      ) : USE_API ? (
        <>
          <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
            {replies}
            {speaks}
          </p>
          <InquiryForm property={property} onDone={onClose} />
        </>
      ) : (
        <div className="mt-5 flex gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-300">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-stone-500 dark:text-stone-400" />
          <div>
            <p className="font-semibold text-stone-900 dark:text-white">Contact details aren’t available yet</p>
            <p className="mt-1">
              {replies}
              {speaks}
              Direct calling and WhatsApp for this listing are coming soon. Save this home and check back.
            </p>
          </div>
        </div>
      )}

      <SafetyReminder className="mt-5" />

      {isDemo && phone && (
        <p className="mt-4 text-xs text-stone-500 dark:text-stone-500">
          Demo listing: this contact number is a placeholder.
        </p>
      )}
    </Modal>
  );
}
