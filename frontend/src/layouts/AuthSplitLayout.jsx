import HouseRow from '../components/illustrations/HouseRow';

export default function AuthSplitLayout({ children }) {
  return (
    <div className="flex min-h-svh w-full">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-amber-600 p-12 text-amber-50 lg:flex dark:bg-amber-800">
        <div>
          <div className="text-lg font-bold">Affordable Housing</div>
          <p className="mt-1 text-sm text-amber-100/80">Dar es Salaam</p>
        </div>

        <div>
          <h2 className="text-3xl leading-tight font-semibold text-white">
            Fair access to housing,
            <br />
            from application to move-in.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-amber-100/80">
            Apply for housing, track your application, and manage allocations — all in one
            place.
          </p>
        </div>

        <HouseRow className="h-40 w-full text-amber-100/90" />
      </div>

      <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="text-lg font-bold text-stone-900 dark:text-white">
              Affordable Housing
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">Dar es Salaam</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
