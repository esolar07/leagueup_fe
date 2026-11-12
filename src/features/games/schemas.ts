import { z } from "zod";
import { LISTABLE_CAMPAIGN } from "@/config/campaigns";
import { easternToUtcIso, utcToEasternParts } from "@/lib/datetime/eastern-time";
import { centsToDollars, dollarsToCents, DOLLARS_PATTERN } from "@/lib/money";
import { SKILL_LEVELS } from "./filters";
import type { CostBasis, Game, GuestIdentity, SkillLevel, SubmitGameInput, UpdateGameInput } from "./types";

/** Kept in step with leagueup_be/src/modules/games/game.schemas.ts. The backend remains authoritative. */
const SINGLE_LINE = /^[^\r\n]*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const requiredLine = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `Keep it to ${max} characters or fewer.`).regex(SINGLE_LINE, "Keep it on one line.");
const optionalLine = (max: number) => z.string().trim().max(max, `Keep it to ${max} characters or fewer.`).regex(SINGLE_LINE, "Keep it on one line.");
const email = z.string().trim().toLowerCase().min(1, "Email is required.").email("Enter a valid email address.");

const gameFieldsShape = {
  title: requiredLine("Game name", 120),
  description: z.string().trim().max(2000, "Keep it to 2000 characters or fewer."),
  date: z.string().regex(DATE_PATTERN, "Pick a date."),
  startTime: z.string().regex(TIME_PATTERN, "Pick a start time."),
  endTime: z.string().regex(/^(\d{2}:\d{2})?$/, "Pick an end time."),
  venueName: requiredLine("Park or field", 120),
  address: optionalLine(200),
  city: requiredLine("City", 120),
  state: z.string().trim().regex(/^[A-Za-z]{2}$/, "Use the 2-letter state code, like FL."),
  postalCode: z.string().trim().regex(/^(\d{5})?$/, "Use a 5-digit ZIP code."),
  registrationType: z.enum(["PLAYER", "TEAM"]),
  capacity: z.string().trim().regex(/^\d+$/, "Enter a whole number.").refine((value) => Number(value) >= 1 && Number(value) <= 200, "Between 1 and 200."),
  skillLevel: z.enum(["", ...SKILL_LEVELS]),
  /** "" = not listed (only for older games); "free" = $0; "paid" = `cost` dollars. */
  costType: z.enum(["", "free", "paid"]),
  cost: z.string().trim().refine((value) => value === "" || DOLLARS_PATTERN.test(value), "Enter an amount like 10 or 10.50."),
  /** Only sent when the game has a price above $0. */
  costBasis: z.enum(["PER_PLAYER", "PER_TEAM"], "Choose per player or per team."),
};

type ScheduleValues = { date: string; startTime: string; endTime: string };
type CostValues = { costType: "" | "free" | "paid"; cost: string };

/** Paid needs a price above $0. */
function checkCost({ costType, cost }: CostValues, context: z.RefinementCtx) {
  if (costType !== "paid" || (DOLLARS_PATTERN.test(cost) && dollarsToCents(cost) > 0)) return;
  context.addIssue({ code: "custom", path: ["cost"], message: "Enter a price, like 10 or 10.50." });
}

function checkGame(values: ScheduleValues & CostValues, context: z.RefinementCtx) {
  checkSchedule(values, context);
  checkCost(values, context);
}

export function costCentsOf({ costType, cost }: CostValues): number | null {
  if (costType === "free") return 0;
  return costType === "paid" && DOLLARS_PATTERN.test(cost) ? dollarsToCents(cost) : null;
}

/** The API requires a basis on priced games and rejects one on free or unlisted games. */
export function costBasisOf(values: CostValues & { costBasis: CostBasis }): CostBasis | null {
  return (costCentsOf(values) ?? 0) > 0 ? values.costBasis : null;
}

/** True once a date and time are complete enough to convert (half-typed input never throws). */
export function isScheduleReady(date: string, time: string): boolean {
  return DATE_PATTERN.test(date) && TIME_PATTERN.test(time) && !Number.isNaN(Date.parse(`${date}T${time}:00Z`));
}

function startIsoOf({ date, startTime }: ScheduleValues): string {
  return easternToUtcIso(date, startTime);
}

function endIsoOf({ date, endTime }: ScheduleValues): string | null {
  return isScheduleReady(date, endTime) ? easternToUtcIso(date, endTime) : null;
}

/** Start must be in the future and end after start, both read as Eastern Time. */
function checkSchedule(values: ScheduleValues, context: z.RefinementCtx) {
  if (!isScheduleReady(values.date, values.startTime)) return;
  const start = startIsoOf(values);
  if (Date.parse(start) <= Date.now()) context.addIssue({ code: "custom", path: ["startTime"], message: "Pick a time in the future." });
  const end = endIsoOf(values);
  if (end && end <= start) context.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after the start time." });
}

/** API field (from `body.<field>` errors) → form field. */
export const API_FIELD_TO_FORM_FIELD: Record<string, keyof ListingValues> = {
  title: "title",
  description: "description",
  startDateTime: "startTime",
  endDateTime: "endTime",
  venueName: "venueName",
  address: "address",
  city: "city",
  state: "state",
  postalCode: "postalCode",
  registrationType: "registrationType",
  capacity: "capacity",
  skillLevel: "skillLevel",
  costCents: "cost",
  costBasis: "costBasis",
  organizerName: "organizerName",
  organizerEmail: "organizerEmail",
  campaignSlug: "joinCampaign",
};

export const editGameSchema = z.object(gameFieldsShape).superRefine(checkGame);

export const listingSchema = z
  .object({ ...gameFieldsShape, joinCampaign: z.boolean(), organizerName: requiredLine("Your name", 120), organizerEmail: email })
  .superRefine(checkGame);

export const guestJoinSchema = z.object({ name: requiredLine("Your name", 120), email });
export const teamNameSchema = z.object({ teamName: requiredLine("Team name", 120) });
/** TEAM games: the captain's name and email plus the team. */
export const teamJoinSchema = z.object({ name: requiredLine("Captain name", 120), email, ...teamNameSchema.shape });
export const resendLinkSchema = z.object({ email });
export const emailCaptureSchema = z.object({ email });

export type GameFieldValues = z.infer<typeof editGameSchema>;
export type ListingValues = z.infer<typeof listingSchema>;
export type GuestJoinValues = GuestIdentity & { teamName?: string };

export const EMPTY_LISTING: ListingValues = {
  title: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  venueName: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  registrationType: "PLAYER",
  capacity: "",
  skillLevel: "",
  costType: "free",
  cost: "",
  costBasis: "PER_PLAYER",
  joinCampaign: false,
  organizerName: "",
  organizerEmail: "",
};

const blankToNull = (value: string) => value.trim() || null;

/** The flat, nullable shape PATCH /games/:id speaks, built from form values. */
function toFlatGame(values: GameFieldValues): Required<Omit<UpdateGameInput, "status">> {
  return {
    title: values.title,
    description: blankToNull(values.description),
    startDateTime: startIsoOf(values),
    endDateTime: endIsoOf(values),
    venueName: values.venueName,
    address: blankToNull(values.address),
    city: values.city,
    state: values.state.toUpperCase(),
    postalCode: blankToNull(values.postalCode),
    registrationType: values.registrationType,
    capacity: Number(values.capacity),
    skillLevel: (values.skillLevel || null) as SkillLevel | null,
    costCents: costCentsOf(values),
    costBasis: costBasisOf(values),
  };
}

/** Optional fields are left out (not null) on create; JSON.stringify drops the undefined keys. */
export function toSubmitGameInput(values: ListingValues): SubmitGameInput {
  const flat = toFlatGame(values);
  const optional = Object.fromEntries(Object.entries(flat).map(([key, value]) => [key, value ?? undefined]));
  const campaignSlug = values.joinCampaign ? LISTABLE_CAMPAIGN.slug : undefined;
  return { ...optional, sport: "FLAG_FOOTBALL", organizerName: values.organizerName, organizerEmail: values.organizerEmail, campaignSlug } as SubmitGameInput;
}

export function gameToFormValues(game: Game): GameFieldValues {
  const start = utcToEasternParts(game.startDateTime);
  const { location } = game;
  return {
    title: game.title,
    description: game.description ?? "",
    date: start.date,
    startTime: start.time,
    endTime: game.endDateTime ? utcToEasternParts(game.endDateTime).time : "",
    venueName: location.venueName,
    address: location.address ?? "",
    city: location.city,
    state: location.state,
    postalCode: location.postalCode ?? "",
    registrationType: game.registrationType,
    capacity: String(game.capacity),
    skillLevel: game.skillLevel ?? "",
    costType: game.costCents === null ? "" : game.costCents === 0 ? "free" : "paid",
    cost: game.costCents ? centsToDollars(game.costCents) : "",
    costBasis: game.costBasis ?? "PER_PLAYER",
  };
}

/**
 * Only fields that changed, so an unchanged (and possibly soon) start time is never re-validated as "future".
 * A price change carries its basis; making a game free sends only the price, and the API clears the basis.
 */
export function diffGameChanges(game: Game, values: GameFieldValues): UpdateGameInput {
  const original = toFlatGame(gameToFormValues(game));
  const { costCents, costBasis, ...edited } = toFlatGame(values);
  const changed = Object.entries(edited).filter(([key, value]) => original[key as keyof typeof original] !== value);
  const priceChanged = costCents !== original.costCents || costBasis !== original.costBasis;
  return { ...Object.fromEntries(changed), ...(priceChanged && priceChanges(costCents, costBasis)) } as UpdateGameInput;
}

function priceChanges(costCents: number | null, costBasis: CostBasis | null): UpdateGameInput {
  return costBasis ? { costCents, costBasis } : { costCents };
}
