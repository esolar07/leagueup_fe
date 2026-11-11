import { gamesApi } from "./api";
import type { ListingReceipt } from "./types";

/**
 * POST /games/verify burns its token: a second call answers 422. One in-flight or settled
 * promise per token, kept at module level, so StrictMode's double effects, remounts and
 * refetches all share the first call.
 */
const verifications = new Map<string, Promise<ListingReceipt>>();

export function verifyListingOnce(token: string): Promise<ListingReceipt> {
  const existing = verifications.get(token);
  if (existing) return existing;
  const verification = gamesApi.verify(token).then(({ data }) => data);
  verifications.set(token, verification);
  return verification;
}

const VERIFIED_KEY = "lu:verified-listing";

/** Remembers a confirmed listing for this tab, so a refresh after the token is spent still shows success. */
export function rememberVerifiedListing(receipt: ListingReceipt): void {
  try {
    sessionStorage.setItem(VERIFIED_KEY, JSON.stringify(receipt));
  } catch {}
}

export function recallVerifiedListing(): ListingReceipt | null {
  try {
    return JSON.parse(sessionStorage.getItem(VERIFIED_KEY) ?? "null") as ListingReceipt | null;
  } catch {
    return null;
  }
}
