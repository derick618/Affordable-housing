import { useEffect, useRef } from 'react';
import { CloseIcon } from './icons';

/**
 * Accessible modal built on the native <dialog> element (focus trap, Escape to close and
 * inert background come from the browser). Children are only mounted while open, so
 * forms inside reset each time.
 *
 * variant="center" is a dialog; variant="sheet" is a bottom sheet for small screens.
 */
export default function Modal({ open, onClose, title, description, children, variant = 'center', className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }
    if (!open && dialog.open) dialog.close();
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const shape =
    variant === 'sheet'
      ? 'm-0 mt-auto h-[88svh] w-full max-w-none rounded-t-3xl'
      : 'm-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl max-h-[90svh]';

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-label={title}
      className={`${shape} overflow-hidden border-0 bg-white p-0 text-stone-800 shadow-2xl dark:bg-stone-900 dark:text-stone-200 ${className}`}
    >
      {open && (
        <div className="flex h-full max-h-[90svh] flex-col">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 dark:border-stone-800">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900 dark:text-white">{title}</h2>
              {description && (
                <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mt-1 -mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
