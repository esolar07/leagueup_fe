/**
 * Emailed links carry a single-purpose token in the URL fragment (`#token=…`), so it never
 * reaches a server log or Referer header. We move it out of the address bar immediately
 * and keep it in sessionStorage (this tab only) so a refresh still works. Tokens never go
 * into query strings, logs, analytics or error reports.
 */
const STORAGE_PREFIX = "lu:token:";

const TOKEN_ROUTES: { pattern: RegExp; scope: (match: RegExpExecArray) => string }[] = [
  { pattern: /^\/games\/verify\/?$/, scope: () => "verify" },
  { pattern: /^\/games\/([^/]+)\/manage\/?$/, scope: (match) => `manage:${match[1]}` },
  { pattern: /^\/games\/[^/]+\/participation\/([^/]+)\/?$/, scope: (match) => `participation:${match[1]}` },
];

export function tokenScopeFor(pathname: string): string | null {
  for (const route of TOKEN_ROUTES) {
    const match = route.pattern.exec(pathname);
    if (match) return route.scope(match);
  }
  return null;
}

function tokenFromHash(hash: string): string | null {
  return new URLSearchParams(hash.replace(/^#/, "")).get("token");
}

export function readStoredToken(scope: string): string | null {
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + scope);
  } catch {
    return null;
  }
}

export function storeToken(scope: string, token: string): void {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + scope, token);
  } catch {}
}

export function forgetToken(scope: string): void {
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + scope);
  } catch {}
}

/** Clears `#token=…` from the address bar first, then files the token under its route's scope. */
export function captureHashToken(): void {
  const token = tokenFromHash(window.location.hash);
  if (!token) return;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, "", pathname + search);
  const scope = tokenScopeFor(pathname);
  if (scope) storeToken(scope, token);
}
