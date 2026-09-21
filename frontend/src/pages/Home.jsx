import { Link } from 'react-router-dom';
import HeroSearch from '../components/HeroSearch';
import PropertyCard from '../components/PropertyCard';
import { PropertyGridSkeleton } from '../components/PropertyCardSkeleton';
import PropertyImage from '../components/PropertyImage';
import SafetyNotice from '../components/SafetyNotice';
import { VerifiedBadge } from '../components/Badges';
import {
  ArrowRightIcon,
  CheckIcon,
  HeartIcon,
  MessageIcon,
  SearchIcon,
  ShieldCheckIcon,
  WalletIcon,
} from '../components/icons';
import { AREAS, BUDGET_CAPS, CITIES } from '../data/constants';
import { formatTZSShort } from '../utils/format';
import { fetchBudgetBands, fetchCityCounts, fetchFeatured, fetchRecent } from '../api/properties';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

const CARD_SIZES = '(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw';

function SectionHeader({ eyebrow, title, lead, action, titleId }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={titleId} className="section-title">{title}</h2>
        {lead && <p className="section-lead">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

function ViewAll({ to = '/properties', children = 'View all homes' }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-100"
    >
      {children}
      <ArrowRightIcon className="h-4 w-4" />
    </Link>
  );
}

/** A section's cards: skeletons while loading, a retry prompt if the request failed. */
function PropertyGrid({ state, count = 4 }) {
  if (state.error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-stone-300 bg-white p-6 sm:flex-row sm:items-center sm:justify-between dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm text-stone-700 dark:text-stone-300">
          We couldn’t load these homes right now. Check your connection and try again.
        </p>
        <button type="button" className="btn btn-primary" onClick={state.reload}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {state.loading ? (
        <PropertyGridSkeleton count={count} />
      ) : (
        state.data?.map((property) => (
          <PropertyCard key={property.id} property={property} sizes={CARD_SIZES} />
        ))
      )}
    </div>
  );
}

function Hero() {
  const points = [
    { icon: WalletIcon, text: 'Clear monthly prices in TZS' },
    { icon: MessageIcon, text: 'Contact owners directly' },
    { icon: ShieldCheckIcon, text: 'Free to browse' },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-brand-950 text-white">
      <PropertyImage
        src="locations/dar-es-salaam"
        alt=""
        eager
        sizes="100vw"
        className="absolute inset-0 -z-20 !bg-brand-900"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/85 via-brand-950/70 to-brand-950/85 lg:bg-gradient-to-r lg:from-brand-950/90 lg:via-brand-950/65 lg:to-brand-950/30" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-brand-950/60 to-transparent" />

      <div className="container-page pt-12 pb-10 sm:pt-20 sm:pb-14 lg:pt-24 lg:pb-16">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold tracking-wide text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Affordable homes to rent across Tanzania
          </p>
          <h1 className="mt-5 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Find a Home That Fits Your Budget
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            Set your monthly budget and search affordable homes in Dar es Salaam, Arusha, Mwanza and beyond. Compare
            prices in TZS and contact owners directly.
          </p>
        </div>

        <div className="mt-8 max-w-5xl sm:mt-10">
          <HeroSearch />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-white/90">
          <span className="font-semibold">Quick search:</span>
          {BUDGET_CAPS.slice(0, 3).map((cap) => (
            <Link
              key={cap}
              to={`/properties?max=${cap}`}
              className="inline-flex min-h-9 items-center rounded-full bg-white/15 px-3.5 font-semibold backdrop-blur transition hover:bg-white/25"
            >
              Up to {formatTZSShort(cap)}
            </Link>
          ))}
        </div>

        <ul className="mt-8 hidden flex-wrap gap-x-8 gap-y-2 text-sm font-semibold text-white sm:flex">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-emerald-300" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** "Browse by budget": every band links to search with that monthly budget applied. */
function BudgetBands({ bands }) {
  const items = bands ?? BUDGET_CAPS.map((cap) => ({ cap, count: null }));

  return (
    <section aria-labelledby="budget-heading" className="section !pb-0">
      <div className="container-page">
        <SectionHeader
          eyebrow="Browse by budget"
          title="Homes for every monthly budget"
          lead="Start with what you can pay each month, then see the homes that fit."
          titleId="budget-heading"
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {items.map(({ cap, count }) => (
            <Link
              key={cap}
              to={`/properties?max=${cap}`}
              className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg motion-reduce:transform-none sm:p-6 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-brand-700"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">
                <WalletIcon className="h-5 w-5" />
              </span>
              <span className="mt-4 text-xs font-semibold text-stone-500 dark:text-stone-400">Up to</span>
              <span className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl dark:text-white">
                TZS {cap.toLocaleString('en-US')}
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">per month</span>
              <span className="mt-3 text-sm font-semibold text-brand-700 dark:text-brand-300">
                {count == null ? 'See homes' : `${count} ${count === 1 ? 'home' : 'homes'}`}
                <ArrowRightIcon className="ml-1 inline h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularLocations({ counts }) {
  return (
    <section id="locations" className="section scroll-mt-16">
      <div className="container-page">
        <SectionHeader
          eyebrow="Popular locations"
          title="Explore homes by city"
          lead="From the coast of Dar es Salaam to the slopes of Mount Meru, browse homes in the places people are moving to."
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {CITIES.map((city) => {
            const n = counts ? (counts[city.name] ?? 0) : null;
            return (
              <Link
                key={city.name}
                to={`/properties?q=${encodeURIComponent(city.name)}`}
                className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none sm:aspect-[3/4]"
              >
                <PropertyImage
                  src={city.image}
                  alt=""
                  size="sm"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="absolute inset-0 -z-20"
                  imgClassName="transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent" />
                <div className="p-4 text-white sm:p-5">
                  <h3 className="text-lg font-extrabold sm:text-xl">{city.name}</h3>
                  <p className="mt-0.5 hidden text-sm text-white/80 sm:block">{city.blurb}</p>
                  {n !== null && (
                    <p className="mt-1 text-sm font-semibold text-white">
                      {n} {n === 1 ? 'home' : 'homes'}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-stone-600 dark:text-stone-400">Popular neighbourhoods:</span>
          {AREAS.map((area) => (
            <Link
              key={area}
              to={`/properties?q=${encodeURIComponent(area)}`}
              className="pill min-h-10 text-[13px]"
            >
              {area}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: SearchIcon,
      title: 'Search',
      text: 'Pick a location, property type and monthly budget. Filter by bedrooms and availability to see only what fits.',
    },
    {
      icon: HeartIcon,
      title: 'Shortlist & check',
      text: 'Save the homes you like, compare prices and amenities, and look for the verified badge before you call.',
    },
    {
      icon: MessageIcon,
      title: 'Contact & visit',
      text: 'Call or WhatsApp the owner, arrange a viewing, and only pay once you have seen the home and signed an agreement.',
    },
  ];

  return (
    <section id="how-it-works" className="section scroll-mt-16 bg-white dark:bg-stone-900">
      <div className="container-page">
        <SectionHeader
          eyebrow="How it works"
          title="Three simple steps to your next home"
          lead="No agents’ fees to browse, no confusing forms. Just clear listings and direct contact."
        />
        <ol className="grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-950"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-white">
                  <step.icon className="h-6 w-6" />
                </span>
                <span className="text-4xl font-extrabold text-stone-200 dark:text-stone-800">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-stone-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function WhyUs() {
  const points = [
    ['Search by what you can pay', 'Start with your monthly budget, then filter by area, type and bedrooms.'],
    ['Prices that are easy to compare', 'Every listing shows the monthly rent in TZS and how many months are paid in advance.'],
    ['Built around renting in Tanzania', 'See the water source, LUKU meter, compound and transport before you visit.'],
    ['Talk to owners directly', 'Call or WhatsApp the landlord or agent yourself. No middleman fees to browse.'],
  ];

  return (
    <section className="section">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <PropertyImage
            src="interiors/living-1"
            alt="Bright living room with a balcony and plants"
            className="aspect-[4/3] rounded-3xl shadow-xl"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-white p-3.5 pr-5 shadow-xl sm:left-8 dark:bg-stone-900">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">
              <ShieldCheckIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-stone-900 dark:text-white">Verified listing</p>
              <p className="text-xs text-stone-600 dark:text-stone-400">Owner details checked</p>
            </div>
          </div>
        </div>

        <div>
          <p className="eyebrow mb-2">Why use our platform</p>
          <h2 className="section-title">Made for people renting on a budget</h2>
          <ul className="mt-6 space-y-5">
            {points.map(([title, text]) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white">{title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <VerifiedBadge label="Verified owner" />
            <span className="text-sm text-stone-600 dark:text-stone-400">Means we checked the owner’s ID. Not a guarantee, so always view before you pay.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="container-page pb-14 sm:pb-20">
      <div className="relative isolate overflow-hidden rounded-3xl bg-brand-900 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
        <PropertyImage
          src="properties/sinza-family-house"
          alt=""
          className="absolute inset-0 -z-20"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-brand-950/80" />
        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          Ready to find a home that fits your budget?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/85">
          Browse affordable homes today, or create a free account to keep track of your favourites and apply for housing programmes.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/properties" className="btn btn-lg !border-transparent !bg-white !text-brand-900 hover:!bg-brand-50">
            Browse homes
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
          <Link
            to="/register"
            className="btn btn-lg !border-white/40 !bg-transparent !text-white hover:!bg-white/10"
          >
            Create free account
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  usePageTitle();
  const counts = useAsync(fetchCityCounts, []);
  const bands = useAsync(() => fetchBudgetBands(BUDGET_CAPS), []);
  const featured = useAsync(() => fetchFeatured(4), []);
  const recent = useAsync(async ({ signal }) => {
    const featuredList = await fetchFeatured(4, { signal });
    return fetchRecent(4, featuredList.map((p) => p.id), { signal });
  }, []);

  return (
    <>
      <Hero />

      <BudgetBands bands={bands.data} />

      <PopularLocations counts={counts.data} />

      <section className="pb-14 sm:pb-20">
        <div className="container-page">
          <SectionHeader
            eyebrow="Featured"
            title="Featured affordable homes"
            lead="Homes with clear monthly rent and the essentials covered: water, power and security."
            action={<ViewAll />}
          />
          <PropertyGrid state={featured} />
        </div>
      </section>

      <HowItWorks />

      <section className="section">
        <div className="container-page">
          <SectionHeader
            eyebrow="New on the platform"
            title="New affordable listings"
            action={<ViewAll to="/properties?sort=newest">See newest listings</ViewAll>}
          />
          <PropertyGrid state={recent} />
        </div>
      </section>

      <div className="bg-white dark:bg-stone-900">
        <WhyUs />
      </div>

      <section className="section">
        <div className="container-page">
          <SafetyNotice id="safety" />
        </div>
      </section>

      <CallToAction />
    </>
  );
}
