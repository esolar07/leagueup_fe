import { vi } from "vitest";

export interface MockRoute {
  method: string;
  path: string | RegExp;
  status?: number;
  body: unknown;
}

export interface RecordedCall {
  method: string;
  url: URL;
  headers: Headers;
  body: unknown;
}

function matches(route: MockRoute, method: string, url: URL): boolean {
  const path = url.pathname.replace("/api/v1", "");
  return route.method === method && (typeof route.path === "string" ? route.path === path : route.path.test(path));
}

/** Stubs global fetch with the backend envelope. Records every call so tests can assert headers and bodies. */
export function mockApi(routes: MockRoute[]) {
  const calls: RecordedCall[] = [];
  const fetchMock = vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    const method = init.method ?? "GET";
    calls.push({ method, url, headers: new Headers(init.headers), body: init.body ? JSON.parse(String(init.body)) : undefined });
    const route = routes.find((candidate) => matches(candidate, method, url));
    if (!route) return new Response(JSON.stringify(failure("NOT_FOUND", "No mock route")), { status: 404 });
    return new Response(JSON.stringify(route.body), { status: route.status ?? 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

export const success = (data: unknown, meta?: unknown) => ({ success: true, data, meta });
export const failure = (code: string, message: string, details: unknown[] = []) => ({ success: false, error: { code, message, details } });
