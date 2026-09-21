import { useCallback, useEffect, useState } from 'react';

/**
 * Runs an async loader whenever `deps` change and tracks { data, loading, error }.
 *
 * - The loader receives `{ signal }`. Passing it to a request lets a superseded request be
 *   cancelled (for example when the filters change before the last search finished).
 * - Stale responses are ignored either way, so out-of-order results are never shown.
 * - While reloading, the previous `data` stays available so screens can dim it instead of
 *   flashing empty.
 * - `reload()` runs the loader again with the same inputs (for "Try again" buttons).
 */
export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => loader({ signal: controller.signal }))()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }));

    return () => {
      cancelled = true;
      controller.abort();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return { ...state, reload };
}
