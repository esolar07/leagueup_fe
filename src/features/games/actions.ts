"use server";

import { isApiError } from "@/lib/api/client";
import type { ApiErrorCode } from "@/lib/api/types";
import { getSessionToken } from "@/lib/auth/session";
import { gamesApi } from "./api";
import type { JoinResult, OwnParticipation } from "./types";

/**
 * Signed-in player actions. They run on the server because the session token lives in an
 * httpOnly cookie that browser code cannot read. Guests call the API from the browser.
 */
export type MemberActionResult<T> = { ok: true; data: T } | { ok: false; error: { status: number; code: ApiErrorCode; message: string } };

async function withSession<T>(request: (bearer: string) => Promise<{ data: T }>): Promise<MemberActionResult<T>> {
  const bearer = await getSessionToken();
  if (!bearer) return { ok: false, error: { status: 401, code: "UNAUTHENTICATED", message: "Sign in to continue." } };
  try {
    return { ok: true, data: (await request(bearer)).data };
  } catch (error) {
    if (!isApiError(error)) throw error;
    return { ok: false, error: { status: error.status, code: error.code, message: error.message } };
  }
}

export async function joinAsMemberAction(gameId: string, teamName?: string): Promise<MemberActionResult<JoinResult>> {
  return withSession((bearer) => gamesApi.joinAsMember(gameId, bearer, teamName));
}

export async function cancelMyRequestAction(gameId: string, participantId: string): Promise<MemberActionResult<{ participant: OwnParticipation }>> {
  return withSession((bearer) => gamesApi.cancelParticipation(gameId, participantId, { bearer }));
}
