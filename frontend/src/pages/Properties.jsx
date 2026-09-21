import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FilterPanel from '../components/FilterPanel';
import Modal from '../components/Modal';
import PropertyCard from '../components/PropertyCard';
import { PropertyGridSkeleton } from '../components/PropertyCardSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { CloseIcon, FilterIcon } from '../components/icons';
import { AREAS, SORT_OPTIONS, TYPE_LABELS } from '../data/constants';
import { fetchProperties } from '../api/properties';
import { USE_API } from '../api/config';
import { useProfile } from '../context/ProfileContext';
import { useAsync } from '../hooks/useAsync';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatTZS } from '../utils/format';

const CARD_SIZES = '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw';

/** "3" -> "3"; anything that is not a whole number >= 1 (or is above `max`) -> "". */
function positiveInt(value, max = Infinity) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= max ? String(n) : '';
}

/** Filters live in the URL, so results can be shared, bookmarked and survive a refresh. */
function readFilters(params) {
  return {
    q: params.get('q') ?? '',
    types: (params.get('type') ?? '').split(',').filter(Boolean),
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    beds: params.get('beds') ?? '',
    status: params.get('status') ?? '',
    sort: params.get('sort') ?? 'recommended',
    // Pagination lives in the URL too, so a copied link opens the same page of results.
    page: positiveInt(params.get('page')),
    // Optional page size (1-50, the API maximum). The UI does not expose it; it lets a link
    // or a test ask for smaller pages.
    perPage: positiveInt(params.get('per_page'), 50),
  };
}

function writeFilters(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.types.length) params.set('type', filters.types.join(','));
  if (filters.min) params.set('min', filters.min);
  if (filters.max) params.set('max', filters.max);
  if (filters.beds) params.set('beds', filters.beds);
  if (filters.status) params.set('status', filters.status);
  if (filters.sort && filters.sort !== 'recommended') params.set('sort', filters.sort);
  if (filters.page && filters.page !== '1') params.set('page', filters.page);
  if (filters.perPage) params.set('per_page', filters.perPage);
  return params;
}

function toQuery(filters) {
  return {
    q: filters.q,
    types: filters.types,
    minPrice: filters.min !== '' ? Number(filters.min) : null,
    maxPrice: filters.max !== '' ? Number(filters.max) : null,
    bedrooms: filters.beds !== '' ? Number(filters.beds) : null,
    status: filters.status,
    sort: filters.sort,
    page: filters.page !== '' ? Number(filters.page) : undefined,
    perPage: filters.perPage !== '' ? Number(filters.perPage) : undefined,
  };
}

function countActive(f) {
  return (
    (f.q ? 1 : 0) +
    f.types.length +
    (f.min ? 1 : 0) +
    (f.max ? 1 : 0) +
    (f.beds ? 1 : 0) +
    (f.status ? 1 : 0)
  );
}

function ActiveChips({ filters, onChange }) {
  const chips = [];
  if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”`, clear: { q: '' } });
  filters.types.forEach((t) =>
    chips.push({
      key: `t-${t}`,
      label: TYPE_LABELS[t] ?? t,
      clear: { types: filters.types.filter((x) => x !== t) },
    })
  );
  if (filters.min) chips.push({ key: 'min', label: `From ${formatTZS(filters.min)}`, clear: { min: '' } });
  if (filters.max) chips.push({ key: 'max', label: `Budget: up to ${formatTZS(filters.max)}`, clear: { max: '' } });
  if (filters.beds) chips.push({ key: 'beds', label: `${filters.beds}+ bedrooms`, clear: { beds: '' } });
  if (filters.status) {
    chips.push({
      key: 'status',
      label: filters.status === 'available' ? 'Available now' : filters.status === 'reserved' ? 'Reserved' : 'Rented',
      clear: { status: '' },
    });
  }
  if (!chips.length) return null;

  return (
    <ul className="mb-5 flex flex-wrap gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() => onChange(chip.clear)}
            className="badge badge-brand min-h-10 gap-1.5 !py-1 pr-3 pl-3.5 text-[13px] hover:bg-brand-100 dark:hover:bg-brand-900"
            aria-label={`Remove filter ${chip.label}`}
          >
            {chip.label}
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const activeCount = countActive(filters);
  // The budget in the filters wins; otherwise a signed-in renter's saved budget marks affordable
  // homes. A saved budget never filters anything, it only feeds the "Within your budget" tag.
  const { profile } = useProfile();
  const filterBudget = filters.max !== '' && Number(filters.max) > 0 ? Number(filters.max) : null;
  const savedBudget = profile?.monthlyBudget > 0 ? profile.monthlyBudget : null;
  const budget = filterBudget ?? savedBudget;
  usePageTitle(filters.q ? `Affordable homes in ${filters.q}` : 'Affordable homes to rent');

  // Requests are debounced in API mode so typing does not fire one request per keystroke.
  // The URL, inputs and chips still update instantly; only the fetch waits.
  const queryKey = searchParams.toString();
  const fetchKey = useDebouncedValue(queryKey, USE_API ? 250 : 0);
  const pending = fetchKey !== queryKey;
  const results = useAsync(
    ({ signal }) => fetchProperties(toQuery(readFilters(new URLSearchParams(fetchKey))), { signal }),
    [fetchKey]
  );
  const resultsRef = useRef(null);

  function apply(next, options = { replace: true }) {
    setSearchParams(writeFilters(next), options);
  }
  // Any change to the filters or sort starts again from page 1.
  function update(patch) {
    apply({ ...filters, ...patch, page: 'page' in patch ? patch.page : '' });
  }
  function reset() {
    apply({ ...readFilters(new URLSearchParams()), sort: filters.sort, perPage: filters.perPage });
  }
  // Paging adds a history entry so the browser Back button returns to the previous page.
  function goToPage(page) {
    apply({ ...filters, page: String(page) }, { replace: false });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // A link to a page beyond the last one (for example after filtering) lands on the last page.
  const lastPage = results.data?.meta?.last_page;
  const pageNumber = Number(filters.page || 1);
  useEffect(() => {
    if (results.data && results.data.data.length === 0 && results.data.total > 0 && lastPage && pageNumber > lastPage) {
      setSearchParams(writeFilters({ ...readFilters(new URLSearchParams(queryKey)), page: String(lastPage) }), {
        replace: true,
      });
    }
  }, [results.data, lastPage, pageNumber, queryKey, setSearchParams]);

  const refreshing = (results.loading || pending) && results.data != null;

  const total = results.data?.total;
  const heading = filters.q ? `Affordable homes for rent in ${filters.q}` : 'Affordable homes for rent in Tanzania';

  return (
    <>
      <div className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="container-page py-8 sm:py-10">
          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-stone-500 dark:text-stone-400">
            <Link to="/" className="hover:text-brand-700 dark:hover:text-brand-300">Home</Link>
            <span className="mx-2">/</span>
            <span aria-current="page" className="font-medium text-stone-800 dark:text-stone-200">Affordable homes</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl dark:text-white">{heading}</h1>
          <p className="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
            {filterBudget
              ? `Showing homes up to ${formatTZS(filterBudget)} per month. Change your budget in the filters to see more or fewer homes.`
              : 'Budget-friendly homes with clear monthly prices in TZS. Set your monthly budget to see what fits.'}
          </p>
          {!filterBudget && savedBudget && (
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Homes within your saved budget of {formatTZS(savedBudget)} are marked.{' '}
              <Link to="/my-budget" className="font-semibold text-brand-700 underline-offset-2 hover:underline dark:text-brand-300">
                Change it
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[19rem_1fr] lg:items-start">
        <aside className="sticky-aside hidden lg:block">
          <div className="card !p-6">
            <h2 className="mb-5 text-lg font-extrabold text-stone-900 dark:text-white">Filters</h2>
            <FilterPanel filters={filters} onChange={update} onReset={reset} activeCount={activeCount} />
          </div>
        </aside>

        <section ref={resultsRef} aria-label="Search results" className="scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-base font-bold text-stone-900 dark:text-white">
              {results.error ? (
                <span className="text-stone-500">Couldn’t load homes</span>
              ) : (results.loading || pending) && total == null ? (
                <span className="text-stone-500">Searching…</span>
              ) : (
                <>
                  {total ?? 0} {total === 1 ? 'home' : 'homes'} found
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="btn lg:hidden"
                aria-haspopup="dialog"
              >
                <FilterIcon className="h-4 w-4" />
                Filters
                {activeCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[11px] font-bold text-white">
                    {activeCount}
                  </span>
                )}
              </button>
              <label className="sr-only" htmlFor="sort">
                Sort by
              </label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="field-input !w-auto cursor-pointer !pr-8 font-medium"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ActiveChips filters={filters} onChange={update} />

          {results.error ? (
            <EmptyState
              title="We couldn’t load homes right now"
              message="Please check your connection and try again."
              action={
                <button type="button" className="btn btn-primary btn-lg" onClick={results.reload}>
                  Try again
                </button>
              }
            />
          ) : !results.loading && !pending && results.data?.total === 0 ? (
            <EmptyState
              title="No homes found"
              message="Try increasing your budget or expanding your search area."
              action={
                <button type="button" className="btn btn-primary btn-lg" onClick={reset}>
                  Clear filters
                </button>
              }
            >
              <p className="mb-3 text-sm font-semibold text-stone-700 dark:text-stone-300">Or try a popular area</p>
              <div className="flex flex-wrap justify-center gap-2">
                {AREAS.slice(0, 6).map((area) => (
                  <button
                    key={area}
                    type="button"
                    className="pill min-h-10"
                    onClick={() => setSearchParams(writeFilters({ ...readFilters(new URLSearchParams()), q: area }), { replace: true })}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </EmptyState>
          ) : (
            <>
              <div
                aria-busy={refreshing}
                className={`grid gap-5 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3 ${
                  refreshing ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                {(results.loading || pending) && !results.data ? (
                  <PropertyGridSkeleton count={6} />
                ) : (
                  results.data?.data.map((property) => (
                    <PropertyCard key={property.id} property={property} budget={budget} sizes={CARD_SIZES} />
                  ))
                )}
              </div>
              <Pagination meta={results.data?.meta} onPageChange={goToPage} />
            </>
          )}
        </section>
      </div>

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters" variant="sheet">
        <FilterPanel filters={filters} onChange={update} onReset={reset} activeCount={activeCount} />
        <div className="sticky -bottom-5 -mx-5 mt-6 border-t border-stone-200 bg-white px-5 py-4 dark:border-stone-800 dark:bg-stone-900">
          <button type="button" className="btn btn-primary btn-lg w-full" onClick={() => setSheetOpen(false)}>
            {total != null ? `Show ${total} ${total === 1 ? 'home' : 'homes'}` : 'Show homes'}
          </button>
        </div>
      </Modal>
    </>
  );
}
