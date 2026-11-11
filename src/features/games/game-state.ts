import type { Game, ParticipantStatus, SkillLevel } from "./types";

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

export function spotsLabel(game: Pick<Game, "availableSpots">): string {
  if (game.availableSpots === 0) return "Full";
  return `${game.availableSpots} ${game.availableSpots === 1 ? "spot" : "spots"} left`;
}

export function locationLine({ location }: Pick<Game, "location">): string {
  return `${location.venueName}, ${location.city}`;
}
