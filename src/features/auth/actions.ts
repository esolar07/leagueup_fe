"use server";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/client";
import { clearSessionCookie, getSessionToken, setSessionCookie } from "@/lib/auth/session";
import { authApi } from "./api";
import { loginSchema, safeRedirectPath, signupSchema } from "./schemas";
import type { AuthResult } from "./types";

export interface AuthActionFailure {
  message: string;
  fieldErrors?: Record<string, string>;
}

const GENERIC_FAILURE: AuthActionFailure = { message: "Something went wrong. Please try again." };

function toFailure(error: unknown): AuthActionFailure {
  if (!isApiError(error)) return GENERIC_FAILURE;
  return { message: error.message, fieldErrors: error.fieldErrors };
}

async function startSession(request: () => Promise<{ data: AuthResult }>): Promise<AuthActionFailure | null> {
  try {
    const { data } = await request();
    await setSessionCookie(data.token, data.expiresAt);
    return null;
  } catch (error) {
    return toFailure(error);
  }
}

/** Server actions re-validate: the client form is a convenience, not a gate. */
export async function loginAction(input: unknown, next?: string): Promise<AuthActionFailure> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { message: "Check the highlighted fields." };
  const failure = await startSession(() => authApi.login(parsed.data));
  if (failure) return failure;
  redirect(safeRedirectPath(next));
}

export async function signupAction(input: unknown, next?: string): Promise<AuthActionFailure> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { message: "Check the highlighted fields." };
  const failure = await startSession(() => authApi.register(parsed.data));
  if (failure) return failure;
  redirect(safeRedirectPath(next));
}

/** Revokes the backend session, then drops the cookie even if the backend call fails. */
export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) await authApi.logout(token).catch(() => undefined);
  await clearSessionCookie();
  redirect("/");
}
