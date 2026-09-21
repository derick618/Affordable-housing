import { useEffect } from 'react';

const SITE = 'Affordable Housing Tanzania';

/** Sets document.title for the current page, e.g. "Saved homes · Affordable Housing Tanzania". */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} · Find a home you can afford`;
  }, [title]);
}
