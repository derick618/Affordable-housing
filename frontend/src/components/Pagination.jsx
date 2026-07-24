export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-between">
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Showing {meta.from}–{meta.to} of {meta.total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
