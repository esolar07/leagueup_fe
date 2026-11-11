import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { isApiError } from "@/lib/api/client";
import { SESSION_COOKIE } from "./constants";

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function setSessionCookie(token: string, expiresAt: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The signed-in user, verified against the backend session (so a logged-out or
 * revoked token is never trusted). Deduplicated per request with React cache.
 * Returns null when signed out; rethrows anything other than an auth failure.
 */
export const getCurrentUser = cache(async () => {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    return (await authApi.me(token)).data.user;
  } catch (error) {
    if (isApiError(error) && error.code === "UNAUTHENTICATED") return null;
    throw error;
  }
});

/** For pages that require a signed-in user. Sends everyone else to login and back. */
export async function requireUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}
