/**
 * Mirrors the LeagueUp backend response envelope (leagueup_be/src/common/http/response.ts).
 * Every endpoint returns one of these two shapes.
 */
export interface ApiMeta {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

/** Backend error codes (leagueup_be/src/common/errors/app-error.ts), plus client-side transport failures. */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

export interface ApiErrorDetail {
  path?: string;
  message: string;
}

export interface ApiFailure {
  success: false;
  error: { code: ApiErrorCode; message: string; details?: ApiErrorDetail[] };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;
