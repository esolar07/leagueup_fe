import type { Game, ManagedParticipant, ParticipantStatus, RegistrationType, SkillLevel } from "./types";

export type GameAvailability = "open" | "full" | "closed" | "cancelled" | "started";

export function hasStarted(game: Pick<Game, "startDateTime">, now = new Date()): boolean {
  return new Date(game.startDateTime) <= now;
}

/** One answer for "can anyone join this?", checked in the order the backend rejects. */
export function availabilityOf(game: Game, now = new Date()): GameAvailability {
  if (game.status === "CANCELLED") return "cancelled";
  if (hasStarted(game, now)) return "started";
  if (game.status === "CLOSED") return "closed";
  return game.availableSpots > 0 ? "open" : "full";
}

export function canJoin(game: Game, now = new Date()): boolean {
  return availabilityOf(game, now) === "open";
}

/** Organizers can edit until the game is cancelled or has started. */
export function isEditable(game: Game, now = new Date()): boolean {
  return game.status !== "CANCELLED" && !hasStarted(game, now);
}

export const AVAILABILITY_COPY: Record<Exclude<GameAvailability, "open">, { title: string; description: string }> = {
  full: { title: "This game is full", description: "Every spot has been approved. Check back in case one opens up." },
  closed: { title: "Requests are closed", description: "The organizer isn’t taking new requests for this game." },
  cancelled: { title: "This game was cancelled", description: "The organizer cancelled it. Find another game nearby." },
  started: { title: "This game has started", description: "Requests close at kickoff. Find another game coming up." },
};

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function skillLevelLabel(skillLevel: SkillLevel | null): string {
  return skillLevel ? SKILL_LEVEL_LABELS[skillLevel] : "All levels";
}

export const SPORT_LABEL = "Flag football";

export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Declined",
  CANCELLED: "Cancelled",
};

export function isTeamGame(game: Pick<Game, "registrationType">): boolean {
  return game.registrationType === "TEAM";
}

/** "player" / "teams": what capacity counts on this kind of game. */
export function spotUnit(registrationType: RegistrationType, count: number): string {
  const unit = registrationType === "TEAM" ? "team" : "player";
  return count === 1 ? unit : `${unit}s`;
}

/** "12 of 40 players left", "3 of 8 teams left", or "Full". */
export function spotsLabel(game: Pick<Game, "availableSpots" | "capacity" | "registrationType">): string {
  if (game.availableSpots === 0) return "Full";
  return `${game.availableSpots} of ${game.capacity} ${spotUnit(game.registrationType, game.capacity)} left`;
}

/** The team on TEAM-game requests, otherwise the player. */
export function participantLabel(participant: Pick<ManagedParticipant, "name" | "teamName">): string {
  return participant.teamName ?? participant.name;
}

export const TEAM_REGISTRATION_LABEL = "Team registration";

export function locationLine({ location }: Pick<Game, "location">): string {
  return `${location.venueName}, ${location.city}`;
}
