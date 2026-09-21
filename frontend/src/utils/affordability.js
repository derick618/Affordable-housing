/**
 * Affordability, relative to a budget the visitor has told us about.
 *
 * We deliberately do NOT judge a price as "affordable" in general, since that depends
 * on the person. Today the only input is the monthly budget a visitor sets in the
 * search; when the user has a saved budget or income on their profile, pass that in
 * here (and extend this function) without touching the components that display it.
 *
 * Returns null when no budget is known, so callers show nothing.
 */
export function getAffordability(price, budget) {
  const cap = Number(budget);
  if (budget == null || budget === '' || !Number.isFinite(cap) || cap <= 0) return null;
  if (price <= cap) return { status: 'within', label: 'Within your budget', remaining: cap - price };
  return { status: 'above', label: 'Above your budget', over: price - cap };
}
