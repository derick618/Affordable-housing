import { InfoIcon, ShieldCheckIcon } from './icons';

/**
 * Compact, neutral "before you pay" note used next to contact actions.
 * Deliberately calm in tone: it informs rather than alarms, and never implies that we
 * guarantee any listing.
 */
export function SafetyReminder({ className = '' }) {
  return (
    <p
      className={`flex gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3 text-[13px] leading-snug text-stone-700 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-300 ${className}`}
    >
      <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone-500 dark:text-stone-400" />
      <span>
        <strong className="font-semibold text-stone-900 dark:text-white">Before you pay,</strong> view the home in person
        and meet the owner. We can’t guarantee any listing.
      </span>
    </p>
  );
}

const TIPS = [
  'View the property in person, ideally in daylight, before paying anything.',
  'Ask to see proof of ownership, such as a title deed or Letter of Offer, and check the owner’s ID.',
  'Never pay “viewing”, “booking” or “reservation” fees to someone you have not met.',
  'Sign a written tenancy agreement and pay by traceable methods, always getting a receipt.',
  'A “Verified” badge means we checked the owner’s ID. It is not a guarantee, so still view before you pay.',
  'Bring a friend or family member along, and trust your instincts if a deal feels rushed.',
];

/** Fuller guidance block for the home page and details page. */
export default function SafetyNotice({ id }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">
          <ShieldCheckIcon className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-white">Renting safely in Tanzania</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Most landlords are honest, but scams do happen. A few habits help you make an informed decision.
          </p>
        </div>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {TIPS.map((tip) => (
          <li key={tip} className="flex gap-2.5 text-sm text-stone-700 dark:text-stone-300">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}
