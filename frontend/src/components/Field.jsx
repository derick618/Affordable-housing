import { useId } from 'react';

/**
 * A labelled form control with an optional hint and error. `children` is a function that
 * receives the props the control needs (id, aria-describedby, aria-invalid), so the label,
 * hint and error are always wired to the input:
 *
 *   <Field label="Title" error={errors.title}>
 *     {(props) => <input className="field-input" {...props} value=… onChange=… />}
 *   </Field>
 */
export default function Field({ label, hint, error, optional = false, className = '', children }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="font-normal text-stone-500 dark:text-stone-400"> (optional)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-rose-700 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

/** A red box for a form-level failure ("couldn't reach the server"). */
export function FormError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
      {children}
    </p>
  );
}
