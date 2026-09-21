import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import Logo from '../components/Logo';
import { CloseIcon, HeartIcon, MenuIcon } from '../components/icons';
import { USE_API } from '../api/config';
import { DEMO_MODE } from '../config';

const NAV = [
  { to: '/properties', label: 'Browse homes' },
  { to: '/#locations', label: 'Locations', hash: true },
  { to: '/#how-it-works', label: 'How it works', hash: true },
  { to: '/#safety', label: 'Safety tips', hash: true },
];

/** The marketplace links, plus the account tools that need the API (landlord listings, saved budget). */
function navFor(user) {
  if (!USE_API) return NAV;
  return [...NAV, { to: '/landlord', label: 'List your home' }, ...(user ? [{ to: '/my-budget', label: 'My budget' }] : [])];
}

function desktopLinkClass({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'text-brand-800 dark:text-brand-200'
      : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'
  }`;
}

/** Scrolls to the top on navigation, or to the #anchor when the URL has one. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait a frame so the target section has rendered.
      const id = requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      );
      return () => cancelAnimationFrame(id);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function SavedLink({ className = '' }) {
  const { count } = useFavorites();
  return (
    <NavLink
      to="/saved"
      className={`relative inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800 ${className}`}
    >
      <HeartIcon className="h-5 w-5" filled={count > 0} />
      <span>Saved</span>
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </NavLink>
  );
}

function Header() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();
  const nav = navFor(user);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname, hash]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) =>
            item.hash ? (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 transition hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <SavedLink />
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              My account
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <NavLink
            to="/saved"
            aria-label="Saved homes"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <SavedBadgeIcon />
          </NavLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-stone-200 bg-white lg:hidden dark:border-stone-800 dark:bg-stone-950"
        >
          <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-stone-800 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-stone-200 pt-4 dark:border-stone-800">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg col-span-2">
                  My account
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-lg">
                    Sign in
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function SavedBadgeIcon() {
  const { count } = useFavorites();
  return (
    <span className="relative">
      <HeartIcon className="h-6 w-6" filled={count > 0} />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </span>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Helping families, students and first-time renters across Tanzania find decent homes that fit their budget.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <li><Link className="hover:text-brand-700 dark:hover:text-brand-300" to="/properties">Browse affordable homes</Link></li>
            <li><Link className="hover:text-brand-700 dark:hover:text-brand-300" to="/properties?q=Dar es Salaam">Dar es Salaam</Link></li>
            <li><Link className="hover:text-brand-700 dark:hover:text-brand-300" to="/properties?q=Arusha">Arusha</Link></li>
            <li><Link className="hover:text-brand-700 dark:hover:text-brand-300" to="/properties?q=Mwanza">Mwanza</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-white">Your account</h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <li><Link className="hover:text-brand-700 dark:hover:text-brand-300" to="/saved">Saved homes</Link></li>
            <li><Link className="hover:text-brand-700 dark:hover:text-brand-300" to="/login">Sign in</Link></li>
            <li><Link className="hover:text-brand-700 dark:hover:text-brand-300" to="/register">Create an account</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-white">Stay safe</h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <li><Link className="hover:text-brand-700 dark:hover:text-brand-300" to="/#safety">Safety tips</Link></li>
            <li>View a home in person before you pay anything.</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-200 dark:border-stone-800">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between dark:text-stone-400">
          <p>© {new Date().getFullYear()} Affordable Housing Tanzania. All rights reserved.</p>
          <p>{DEMO_MODE ? 'Listings shown are demonstration data. ' : ''}Photos courtesy of Unsplash contributors.</p>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
