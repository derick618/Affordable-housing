import { useId } from 'react';
import { AREAS, AVAILABILITY_OPTIONS, BEDROOM_OPTIONS, BUDGET_CAPS, CITIES, PROPERTY_TYPES } from '../data/constants';
import { formatTZSShort } from '../utils/format';

function Group({ title, children }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="field-label">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * All search filters. Stateless: `filters` and `onChange(patch)` come from the page
 * (which keeps them in the URL), so the same panel works in the sidebar and the mobile sheet.
 */
export default function FilterPanel({ filters, onChange, onReset, activeCount }) {
  const id = useId();

  function toggleType(value) {
    const next = filters.types.includes(value)
      ? filters.types.filter((t) => t !== value)
      : [...filters.types, value];
    onChange({ types: next });
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor={`${id}-q`} className="field-label">
          Location
        </label>
        <input
          id={`${id}-q`}
          list={`${id}-areas`}
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="City, area or street"
          autoComplete="off"
          className="field-input"
        />
        <datalist id={`${id}-areas`}>
          {[...CITIES.map((c) => c.name), ...AREAS].map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <Group title="Your monthly budget">
        <label htmlFor={`${id}-max`} className="sr-only">
          Maximum monthly rent in TZS
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-stone-500"
          >
            Up to TZS
          </span>
          <input
            id={`${id}-max`}
            type="number"
            inputMode="numeric"
            min="0"
            step="50000"
            placeholder="e.g. 500,000"
            value={filters.max}
            onChange={(e) => onChange({ max: e.target.value })}
            className="field-input !pl-[5.75rem]"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {BUDGET_CAPS.map((cap) => (
            <button
              key={cap}
              type="button"
              aria-pressed={filters.max === String(cap)}
              className="min-h-9 rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:border-brand-600 hover:text-brand-800 aria-pressed:border-brand-700 aria-pressed:bg-brand-700 aria-pressed:text-white dark:border-stone-700 dark:text-stone-400"
              onClick={() => onChange({ max: filters.max === String(cap) ? '' : String(cap) })}
            >
              {formatTZSShort(cap)}
            </button>
          ))}
        </div>

        <label htmlFor={`${id}-min`} className="field-label mt-4 !mb-1 !font-medium text-stone-600 dark:text-stone-400">
          Minimum rent <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <input
          id={`${id}-min`}
          type="number"
          inputMode="numeric"
          min="0"
          step="50000"
          placeholder="TZS"
          value={filters.min}
          onChange={(e) => onChange({ min: e.target.value })}
          className="field-input"
        />
      </Group>

      <Group title="Property type">
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className="pill"
              aria-pressed={filters.types.includes(t.value)}
              onClick={() => toggleType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Bedrooms">
        <div className="flex flex-wrap gap-2">
          {BEDROOM_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="pill min-w-12 px-3"
              aria-pressed={filters.beds === o.value}
              onClick={() => onChange({ beds: o.value })}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Availability">
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="pill"
              aria-pressed={filters.status === o.value}
              onClick={() => onChange({ status: o.value })}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Group>

      {activeCount > 0 && (
        <button type="button" onClick={onReset} className="btn btn-ghost w-full">
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );
}
