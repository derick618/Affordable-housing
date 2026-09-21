/** Placeholder shown while listings load. Mirrors PropertyCard's layout to avoid jumps. */
export default function PropertyCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-6 w-2/5" />
        <div className="skeleton h-5 w-4/5" />
        <div className="skeleton h-4 w-3/5" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="flex items-center justify-between pt-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }) {
  return (
    <div role="status" aria-label="Loading homes" className="contents">
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
