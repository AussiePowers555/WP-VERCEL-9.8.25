/**
 * cookieForwardFetch()
 * Always forwards document cookies for internal client fetches to API routes.
 * Useful when client auth context may not yet be hydrated; API can derive auth from wpa_auth cookie.
 */
export async function cookieForwardFetch(input: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {};

  if (typeof document !== 'undefined') {
    const cookie = document.cookie || '';
    if (cookie) headers['cookie'] = cookie;
  }

  const mergedHeaders = {
    ...(init.headers as Record<string, string> | undefined),
    ...headers,
  };

  return fetch(input, { ...init, headers: mergedHeaders });
}