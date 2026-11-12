import { apiRequest } from "@/lib/api/client";
import type {
  GameDetail,
  Game,
  GuestJoinInput,
  JoinResult,
  ListingReceipt,
  ManagedParticipant,
  OwnParticipation,
  ParticipantStatus,
  SubmitGameInput,
  UpdateGameInput,
} from "./types";

const gamePath = (gameId: string) => `/games/${encodeURIComponent(gameId)}`;
const participantPath = (gameId: string, participantId: string) => `${gamePath(gameId)}/participants/${encodeURIComponent(participantId)}`;
const manageHeaders = (manageToken: string) => ({ "X-Manage-Token": manageToken });

/** Who is cancelling a join request: a signed-in player (bearer) or a guest holding the emailed link. */
export type ParticipationCredentials = { bearer: string } | { participationToken: string };

function credentialOptions(credentials: ParticipationCredentials) {
  if ("bearer" in credentials) return { token: credentials.bearer };
  return { headers: { "X-Participation-Token": credentials.participationToken } };
}

export const gamesApi = {
  list: (query: Record<string, string>, signal?: AbortSignal) => apiRequest<{ games: Game[] }>("/games", { query, signal }),
  detail: (slug: string, bearer?: string) => apiRequest<GameDetail>(`/games/${encodeURIComponent(slug)}`, { token: bearer }),
  submit: (input: SubmitGameInput) => apiRequest<ListingReceipt>("/games", { method: "POST", body: input }),
  verify: (token: string) => apiRequest<ListingReceipt>("/games/verify", { method: "POST", body: { token } }),
  resendLink: (gameId: string, email: string) =>
    apiRequest<{ accepted: true }>(`${gamePath(gameId)}/resend-link`, { method: "POST", body: { email } }),
  joinAsGuest: (gameId: string, guest: GuestJoinInput) =>
    apiRequest<JoinResult>(`${gamePath(gameId)}/join`, { method: "POST", body: guest }),
  joinAsMember: (gameId: string, bearer: string, teamName?: string) =>
    apiRequest<JoinResult>(`${gamePath(gameId)}/join`, { method: "POST", token: bearer, body: teamName ? { teamName } : undefined }),
  update: (gameId: string, changes: UpdateGameInput, manageToken: string) =>
    apiRequest<{ game: Game }>(gamePath(gameId), { method: "PATCH", body: changes, headers: manageHeaders(manageToken) }),
  cancel: (gameId: string, manageToken: string) =>
    apiRequest<{ game: Game }>(gamePath(gameId), { method: "DELETE", headers: manageHeaders(manageToken) }),
  participants: (gameId: string, manageToken: string, query: Record<string, string>) =>
    apiRequest<{ participants: ManagedParticipant[] }>(`${gamePath(gameId)}/participants`, { query, headers: manageHeaders(manageToken) }),
  decide: (gameId: string, participantId: string, status: "APPROVED" | "REJECTED", manageToken: string) =>
    apiRequest<{ participant: ManagedParticipant }>(participantPath(gameId, participantId), {
      method: "PATCH",
      body: { status },
      headers: manageHeaders(manageToken),
    }),
  cancelParticipation: (gameId: string, participantId: string, credentials: ParticipationCredentials) =>
    apiRequest<{ participant: OwnParticipation & { status: ParticipantStatus } }>(participantPath(gameId, participantId), {
      method: "PATCH",
      body: { status: "CANCELLED" },
      ...credentialOptions(credentials),
    }),
};
