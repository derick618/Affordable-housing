import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREAS, BUDGET_OPTIONS, CITIES, PROPERTY_TYPES } from '../data/constants';
import { BuildingIcon, MapPinIcon, SearchIcon, WalletIcon } from './icons';

function Field({ icon: Icon, label, htmlFor, children }) {
  return (
    <div className="relative flex-1">
      <label
        htmlFor={htmlFor}
        className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wide text-stone-500 uppercase dark:text-stone-400"
      >
        <Icon className="h-3.5 w-3.5 text-brand-700 dark:text-brand-300" />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full min-h-11 rounded-lg border-0 bg-transparent p-0 text-base font-medium text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:ring-0 focus:outline-none dark:text-white';

const cellClass =
  'rounded-xl px-3 py-2 hover:bg-stone-50 lg:rounded-none lg:hover:bg-transparent dark:hover:bg-stone-800';

/**
 * Hero search: location, monthly budget and property type, in that order of importance.
 * Sends visitors to /properties; the budget becomes the "max" price filter there.
 */
export default function HeroSearch() {
  const navigate = useNavigate();
  const id = useId();
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [type, setType] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set('q', location.trim());
    if (budget) params.set('max', budget);
    if (type) params.set('type', type);
    navigate(`/properties${params.size ? `?${params}` : ''}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search affordable homes"
      className="grid gap-2 rounded-2xl bg-white p-3 shadow-2xl shadow-stone-900/20 sm:p-4 lg:grid-cols-[1.4fr_1.1fr_1fr_auto] lg:items-center lg:gap-0 dark:bg-stone-900"
    >
      <div className={`${cellClass} lg:border-r lg:border-stone-200 dark:lg:border-stone-700`}>
        <Field icon={MapPinIcon} label="Location" htmlFor={`${id}-loc`}>
          <input
            id={`${id}-loc`}
            list={`${id}-areas`}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where do you want to live?"
            autoComplete="off"
            className={inputClass}
          />
          <datalist id={`${id}-areas`}>
            {[...CITIES.map((c) => c.name), ...AREAS].map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </Field>
      </div>

      <div className={`${cellClass} lg:border-r lg:border-stone-200 dark:lg:border-stone-700`}>
        <Field icon={WalletIcon} label="Monthly budget" htmlFor={`${id}-budget`}>
          <select
            id={`${id}-budget`}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {BUDGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className={cellClass}>
        <Field icon={BuildingIcon} label="Property type" htmlFor={`${id}-type`}>
          <select
            id={`${id}-type`}
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button type="submit" className="btn btn-primary btn-lg mt-1 w-full lg:mt-0 lg:ml-2 lg:w-auto">
        <SearchIcon className="h-5 w-5" />
        Search homes
      </button>
    </form>
  );
}
