import { HttpInterceptorFn } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';

/**
 * User-Agent advertised to Wikimedia APIs during server-side rendering.
 *
 * Provided only in app.config.server.ts, so the (personal) contact address
 * never reaches the browser bundle. It is left null in the browser, where the
 * platform sets the User-Agent itself and it cannot be overridden anyway
 * (User-Agent is a forbidden header for fetch/XHR). SSR requests run in Node
 * with no User-Agent unless we add one, which Wikimedia's policy blocks:
 * https://meta.wikimedia.org/wiki/User-Agent_policy
 *
 * We deliberately do NOT set `Api-User-Agent` on browser calls: it's a
 * non-safelisted header that would trigger a CORS preflight on every
 * origin=* request, and the browser's own User-Agent is policy-acceptable
 * for in-browser clients.
 */
export const WIKIMEDIA_USER_AGENT = new InjectionToken<string | null>(
  'WIKIMEDIA_USER_AGENT',
  { providedIn: 'root', factory: () => null },
);

// Only stamp the header onto Wikimedia-owned hosts; leave our own Toolforge API
// (and anything else) untouched.
const WIKIMEDIA_HOST =
  /(^|\.)(wikipedia\.org|wikimedia\.org|wikidata\.org|wmcloud\.org|wmflabs\.org)$/i;

export const wikimediaUserAgentInterceptor: HttpInterceptorFn = (req, next) => {
  const userAgent = inject(WIKIMEDIA_USER_AGENT);
  if (!userAgent) return next(req);

  let host: string;
  try {
    host = new URL(req.url).hostname;
  } catch {
    return next(req);
  }
  if (!WIKIMEDIA_HOST.test(host)) return next(req);

  return next(req.clone({ setHeaders: { 'User-Agent': userAgent } }));
};
