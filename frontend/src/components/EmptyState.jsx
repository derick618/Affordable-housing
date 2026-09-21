import HouseRow from './illustrations/HouseRow';

/**
 * Friendly empty / not-found state. `action` is the primary button; `children` can hold
 * secondary suggestions (e.g. links to popular areas).
 */
export default function EmptyState({ title, message, action, children }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center sm:py-14 dark:border-stone-700 dark:bg-stone-900">
      <HouseRow className="mb-5 h-24 w-full max-w-xs text-brand-700/25 dark:text-brand-300/20" />
      <h2 className="text-xl font-extrabold text-stone-900 dark:text-white">{title}</h2>
      {message && <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-600 dark:text-stone-400">{message}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
      {children && <div className="mt-6 w-full max-w-md border-t border-stone-200 pt-5 dark:border-stone-800">{children}</div>}
    </div>
  );
}
