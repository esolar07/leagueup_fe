import type { ApiEnvelope, ApiErrorCode, ApiErrorDetail, ApiMeta } from "./types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field-level messages keyed by request path, for mapping onto form fields. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.filter((d) => d.path).map((d) => [d.path as string, d.message]));
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

type QueryValue = string | number | boolean | undefined | null;

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Bearer access token. Server code reads it from the session cookie. */
  token?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ApiResult<T> {
  data: T;
  meta?: ApiMeta;
}

/**
 * Server code may reach the API on a private address (API_URL); the browser can
 * only use the public one (NEXT_PUBLIC_API_URL).
 */
function apiBaseUrl(): string {
  const base = typeof window === "undefined" ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL) : process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("API base URL is not configured. Set API_URL / NEXT_PUBLIC_API_URL (see .env.example).");
  return base.replace(/\/$/, "");
}

function buildUrl(path: string, query: ApiRequestOptions["query"]): string {
  const url = new URL(`${apiBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function buildHeaders({ body, token, headers }: ApiRequestOptions): Headers {
  const result = new Headers(headers);
  result.set("Accept", "application/json");
  if (body !== undefined) result.set("Content-Type", "application/json");
  if (token) result.set("Authorization", `Bearer ${token}`);
  return result;
}

async function send(url: string, options: ApiRequestOptions): Promise<Response> {
  try {
    return await fetch(url, {
      method: options.method ?? "GET",
      headers: buildHeaders(options),
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(0, "NETWORK_ERROR", "We couldn't reach LeagueUp. Check your connection and try again.");
  }
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(response.status, "INVALID_RESPONSE", "The server sent an unexpected response.");
  }
}

/** The single entry point for talking to the LeagueUp backend. Throws ApiError on any failure. */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResult<T>> {
  const response = await send(buildUrl(path, options.query), options);
  const envelope = await parseEnvelope<T>(response);
  if (!envelope.success) {
    const { code, message, details } = envelope.error;
    throw new ApiError(response.status, code, message, details);
  }
  return { data: envelope.data, meta: envelope.meta };
}
