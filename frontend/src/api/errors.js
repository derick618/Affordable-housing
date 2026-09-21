/**
 * Turn an axios error from the Laravel API into something a form can show.
 *   message : one sentence for the person
 *   fields  : { fieldName: 'first message' } from a 422 validation response
 *   status  : HTTP status, or 0 when the server could not be reached
 */
export function describeApiError(error, fallback = 'Something went wrong. Please try again.') {
  const status = error?.response?.status ?? 0;
  const data = error?.response?.data;

  if (status === 0) {
    return { status, fields: {}, message: "We couldn't reach the server. Check your connection and try again." };
  }

  if (status === 422) {
    const fields = {};
    for (const [name, messages] of Object.entries(data?.errors ?? {})) {
      fields[name] = Array.isArray(messages) ? messages[0] : String(messages);
    }
    return { status, fields, message: data?.message || fallback };
  }

  if (status === 429) {
    return { status, fields: {}, message: "You've done this a few times already. Please wait a while and try again." };
  }

  if (status === 401) {
    return { status, fields: {}, message: 'Please sign in to continue.' };
  }

  if (status === 403) {
    return { status, fields: {}, message: data?.message || "You don't have permission to do that." };
  }

  return { status, fields: {}, message: fallback };
}
