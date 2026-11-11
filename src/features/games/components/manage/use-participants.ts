"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { gamesApi } from "../../api";
import { gameKeys } from "../../hooks";
import type { ParticipantStatus } from "../../types";

export const PARTICIPANTS_PER_PAGE = 20;

/**
 * One page of join requests. The first page of PENDING doubles as the manage-token check:
 * the API answers 404 when the token is wrong. The token itself stays out of the query key.
 */
export function useParticipants(gameId: string | undefined, manageToken: string | null, status: ParticipantStatus, page: number) {
  return useQuery({
    queryKey: [...gameKeys.participants(gameId ?? ""), status, page],
    queryFn: () => gamesApi.participants(gameId as string, manageToken as string, { status, page: String(page), perPage: String(PARTICIPANTS_PER_PAGE) }),
    enabled: Boolean(gameId && manageToken),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
