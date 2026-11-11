import { easternDayRange } from "@/lib/datetime/eastern-time";
import type { GameSort, SkillLevel } from "./types";

/**
 * Find Games filters live in the URL so results can be shared. These helpers convert
 * URL ⇄ filters ⇄ API query, dropping anything empty or invalid: the API answers 400
 * to an empty parameter.
 */
export interface GameFilters {
  q?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  /** Calendar day in game time (Eastern); with `until`, the first day of an inclusive range. */
  date?: string;
  until?: string;
  skillLevel?: SkillLevel;
  hasSpots?: boolean;
  sort?: GameSort;
  page?: number;
}

export const GAMES_PER_PAGE = 12;
export const SKILL_LEVELS: SkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const SORTS: GameSort[] = ["startDateTime", "-startDateTime", "createdAt", "-createdAt"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const POSTAL_CODE_PATTERN = /^\d{5}$/;
const STATE_PATTERN = /^[A-Za-z]{2}$/;

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function matching(value: string | null, pattern: RegExp): string | undefined {
  const trimmed = value?.trim();
  return trimmed && pattern.test(trimmed) ? trimmed : undefined;
}

function textParam(value: string | null): string | undefined {
  return value?.trim().slice(0, 100) || undefined;
}

function pageParam(value: string | null): number | undefined {
  const page = Number(value);
  return Number.isInteger(page) && page > 1 ? page : undefined;
}

export function parseFilters(params: URLSearchParams): GameFilters {
  return {
    q: textParam(params.get("q")),
    city: textParam(params.get("city")),
    state: matching(params.get("state"), STATE_PATTERN)?.toUpperCase(),
    postalCode: matching(params.get("postalCode"), POSTAL_CODE_PATTERN),
    date: matching(params.get("date"), DATE_PATTERN),
    until: matching(params.get("until"), DATE_PATTERN),
    skillLevel: oneOf(params.get("skillLevel"), SKILL_LEVELS),
    hasSpots: params.get("hasSpots") === "true" || undefined,
    sort: oneOf(params.get("sort"), SORTS),
    page: pageParam(params.get("page")),
  };
}

/** Only set values make it into the URL; `sort` defaults to soonest first and is omitted then. */
export function filtersToSearchParams(filters: GameFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== false) params.set(key, String(value));
  }
  if (params.get("sort") === "startDateTime") params.delete("sort");
  return params;
}

/** From the start of `date` to the end of `until` (or of `date` itself), in Eastern Time. */
function dateQuery(date: string | undefined, until: string | undefined): Record<string, string> {
  if (!date) return {};
  const lastDay = until && until >= date ? until : date;
  return { from: easternDayRange(date).from, to: easternDayRange(lastDay).to };
}

export function toGamesQuery(filters: GameFilters, campaignSlug?: string): Record<string, string> {
  const { date, until, page, ...rest } = filters;
  const query: Record<string, string> = { ...Object.fromEntries(filtersToSearchParams(rest)), ...dateQuery(date, until) };
  if (campaignSlug) query.campaign = campaignSlug;
  return { ...query, page: String(page ?? 1), perPage: String(GAMES_PER_PAGE) };
}

export function hasActiveFilters(filters: GameFilters): boolean {
  return [filters.q, filters.city, filters.state, filters.postalCode, filters.date, filters.skillLevel, filters.hasSpots].some(Boolean);
}

type LocationFilters = Pick<GameFilters, "city" | "state" | "postalCode">;

/** One "Location" box → API filters: "33155" → ZIP; "Coral Gables, FL" → city + state; "Coral Gables" → city. */
export function parseLocationInput(text: string): LocationFilters {
  const value = text.trim();
  if (POSTAL_CODE_PATTERN.test(value)) return { postalCode: value };
  const [city, state] = value.split(",").map((part) => part.trim());
  if (!city) return {};
  return STATE_PATTERN.test(state ?? "") ? { city, state: state.toUpperCase() } : { city };
}

export function formatLocation({ city, state, postalCode }: LocationFilters): string {
  if (postalCode) return postalCode;
  return [city, state].filter(Boolean).join(", ");
}
