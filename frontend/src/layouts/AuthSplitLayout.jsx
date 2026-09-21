import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import PropertyImage from '../components/PropertyImage';
import { ArrowLeftIcon, CheckIcon } from '../components/icons';

const BENEFITS = ['Apply for affordable housing programmes', 'Track your application status', 'Save homes and contact owners'];

export default function AuthSplitLayout({ children }) {
  return (
    <div className="flex min-h-svh w-full">
      <div className="relative isolate hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <PropertyImage
          src="properties/sinza-family-house"
          alt=""
          eager
          sizes="50vw"
          className="absolute inset-0 -z-20"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/85 via-brand-950/55 to-brand-950/90" />

        <Logo light />

        <div>
          <h2 className="text-4xl leading-tight font-extrabold tracking-tight text-balance">
            Fair access to housing, from search to move-in.
          </h2>
          <ul className="mt-6 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-white/90">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-white/70">Affordable, decent homes for everyone in Tanzania.</p>
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="lg:hidden">
              <Logo />
            </div>
            <Link
              to="/"
              className="ml-auto inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to homepage
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
