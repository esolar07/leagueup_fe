import type { Game } from "@/features/games/types";

export function buildGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "game_1",
    slug: "turkey-bowl-7v7",
    title: "Turkey Bowl 7v7: Morning Kickoff",
    description: "Annual morning flag football game.",
    sport: "FLAG_FOOTBALL",
    status: "PUBLISHED",
    skillLevel: null,
    costCents: 0,
    costBasis: null,
    startDateTime: "2099-11-26T14:00:00.000Z",
    endDateTime: "2099-11-26T16:30:00.000Z",
    registrationType: "PLAYER",
    capacity: 14,
    availableSpots: 4,
    location: { venueName: "Tropical Park", address: "7900 SW 40th St", city: "Miami", state: "FL", postalCode: "33155" },
    campaign: { slug: "turkey-bowl-2026", name: "Turkey Bowl 2026" },
    organizer: { name: "Marcus T." },
    ...overrides,
  };
}
