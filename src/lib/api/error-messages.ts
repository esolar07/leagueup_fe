import { isApiError } from "./client";
import type { ApiErrorCode } from "./types";

export type ErrorMessageOverrides = Partial<Record<ApiErrorCode, string>>;

/** Codes whose server message is written for people and safe to show as-is. */
const SHOW_SERVER_MESSAGE: ApiErrorCode[] = ["CONFLICT", "UNPROCESSABLE", "VALIDATION_ERROR", "NETWORK_ERROR", "INVALID_RESPONSE"];

const FRIENDLY_MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION_ERROR: "Check the highlighted fields and try again.",
  UNAUTHENTICATED: "You need to sign in, or open the link from your email again.",
  FORBIDDEN: "This link doesn’t give access to that. Open the latest link from your email.",
  NOT_FOUND: "We couldn’t find that. It may have been removed.",
  CONFLICT: "That conflicts with something that already exists.",
  UNPROCESSABLE: "That can’t be done right now.",
  RATE_LIMITED: "Too many attempts. Wait a few minutes, then try again.",
  INTERNAL_ERROR: "Something went wrong on our side. Try again in a moment.",
  NETWORK_ERROR: "We couldn’t reach LeagueUp. Check your connection and try again.",
  INVALID_RESPONSE: "The server sent an unexpected response.",
};

/** One message for any thrown value. Branches on the API error code, never on the message text. */
export function friendlyErrorMessage(error: unknown, overrides: ErrorMessageOverrides = {}): string {
  if (!isApiError(error)) return FRIENDLY_MESSAGES.INTERNAL_ERROR;
  const override = overrides[error.code];
  if (override) return override;
  if (SHOW_SERVER_MESSAGE.includes(error.code) && error.message) return error.message;
  return FRIENDLY_MESSAGES[error.code] ?? FRIENDLY_MESSAGES.INTERNAL_ERROR;
}

/** Backend validation paths look like `body.title`; forms want `title`. */
export function bodyFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error)) return {};
  const entries = Object.entries(error.fieldErrors).filter(([path]) => path.startsWith("body."));
  return Object.fromEntries(entries.map(([path, message]) => [path.slice("body.".length), message]));
}
