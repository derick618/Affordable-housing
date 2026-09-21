import { useEffect, useState } from 'react';

/**
 * Returns `value`, but only after it has stopped changing for `delay` ms. The first value is
 * returned immediately, and a delay of 0 disables debouncing (used for instant local data).
 */
export function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (delay <= 0) return undefined;
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return delay <= 0 ? value : debounced;
}
