/** Mirrors leagueup_be/src/modules/games/game.serializer.ts. The API never returns organizer or player emails. */
export type Sport = "FLAG_FOOTBALL";
export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type GameStatus = "PUBLISHED" | "CLOSED" | "CANCELLED";
export type CostBasis = "PER_PLAYER" | "PER_TEAM";
export type RegistrationType = "PLAYER" | "TEAM";
export type ParticipantStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface GameLocation {
  venueName: string;
  address: string | null;
  city: string;
  state: string;
  postalCode: string | null;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sport: Sport;
  status: GameStatus;
  skillLevel: SkillLevel | null;
  costCents: number | null;
  costBasis: CostBasis | null;
  startDateTime: string;
  endDateTime: string | null;
  /** PLAYER: capacity and availableSpots count players. TEAM: they count teams, and each request is one team. */
  registrationType: RegistrationType;
  capacity: number;
  availableSpots: number;
  location: GameLocation;
  campaign: { slug: string; name: string } | null;
  organizer: { name: string };
}

export interface OwnParticipation {
  id: string;
  status: ParticipantStatus;
  requestedAt: string;
}

export interface ManagedParticipant extends OwnParticipation {
  name: string;
  /** The team on TEAM games, where `name` is its captain. */
  teamName: string | null;
}

export interface GameDetail {
  game: Game;
  myParticipation: OwnParticipation | null;
}

/** Response of POST /games and POST /games/verify. */
export interface ListingReceipt {
  game: { id: string; slug: string; status: GameStatus | "PENDING_VERIFICATION" };
  emailSent: boolean;
}

export interface JoinResult {
  participant: OwnParticipation;
  emailSent: boolean;
}

/** Body of POST /games. Only these keys: the API rejects unknown fields. */
export interface SubmitGameInput {
  title: string;
  description?: string;
  sport: Sport;
  startDateTime: string;
  endDateTime?: string;
  venueName: string;
  address?: string;
  city: string;
  state: string;
  postalCode?: string;
  registrationType?: RegistrationType;
  capacity: number;
  skillLevel?: SkillLevel;
  costCents?: number;
  costBasis?: CostBasis;
  organizerName: string;
  organizerEmail: string;
  campaignSlug?: string;
}

/** Body of PATCH /games/:id. Flat, unlike the nested `location` in responses; `null` clears a field. */
export interface UpdateGameInput {
  title?: string;
  description?: string | null;
  startDateTime?: string;
  endDateTime?: string | null;
  venueName?: string;
  address?: string | null;
  city?: string;
  state?: string;
  postalCode?: string | null;
  registrationType?: RegistrationType;
  capacity?: number;
  skillLevel?: SkillLevel | null;
  costCents?: number | null;
  costBasis?: CostBasis | null;
  status?: "PUBLISHED" | "CLOSED";
}

export type GameSort = "startDateTime" | "-startDateTime" | "createdAt" | "-createdAt";

export interface GuestIdentity {
  name: string;
  email: string;
}

/** Body of POST /games/:id/join for guests. `teamName` is required on TEAM games and rejected on PLAYER games. */
export interface GuestJoinInput extends GuestIdentity {
  teamName?: string;
}
