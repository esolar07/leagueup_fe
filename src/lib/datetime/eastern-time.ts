/**
 * Games are on Eastern Time and the API has no timezone field, so every game time is
 * shown in, and every form time is read as, America/New_York — whatever the viewer's
 * device timezone is.
 */
export const GAME_TIME_ZONE = "America/New_York";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const offsetFormat = new Intl.DateTimeFormat("en-US", { timeZone: GAME_TIME_ZONE, timeZoneName: "longOffset" });
const partsFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: GAME_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Minutes the game timezone is ahead of UTC at an instant (e.g. -300 for EST, -240 for EDT). */
export function easternOffsetMinutes(instant: Date): number {
  const label = offsetFormat.formatToParts(instant).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(label);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}

/** Converts a wall-clock date ("2026-11-26") and time ("09:00") in Eastern Time to a UTC ISO string. */
export function easternToUtcIso(date: string, time: string): string {
  const wallClockAsUtc = Date.parse(`${date}T${time}:00Z`);
  const firstGuess = wallClockAsUtc - easternOffsetMinutes(new Date(wallClockAsUtc)) * MINUTE_MS;
  const corrected = wallClockAsUtc - easternOffsetMinutes(new Date(firstGuess)) * MINUTE_MS;
  return new Date(corrected).toISOString();
}

/** The UTC instants that bound a whole Eastern Time calendar day, for the API's `from` / `to`. */
export function easternDayRange(date: string): { from: string; to: string } {
  const nextDay = new Date(Date.parse(`${date}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);
  const end = Date.parse(easternToUtcIso(nextDay, "00:00")) - 1;
  return { from: easternToUtcIso(date, "00:00"), to: new Date(end).toISOString() };
}

/** Splits a UTC instant into Eastern Time wall-clock values for prefilling date and time inputs. */
export function utcToEasternParts(iso: string): { date: string; time: string } {
  const parts = Object.fromEntries(partsFormat.formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function todayInEastern(now = new Date()): string {
  return utcToEasternParts(now.toISOString()).date;
}

const dayFormat = new Intl.DateTimeFormat("en-US", { timeZone: GAME_TIME_ZONE, weekday: "short", month: "short", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: GAME_TIME_ZONE, hour: "numeric", minute: "2-digit" });

/** "Thu, Nov 26" */
export function formatGameDay(iso: string): string {
  return dayFormat.format(new Date(iso));
}

/** "9:00 AM" */
export function formatGameTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** "9:00 AM – 11:30 AM", or just the start time when there is no end. */
export function formatGameTimeRange(startIso: string, endIso: string | null): string {
  const start = formatGameTime(startIso);
  return endIso ? `${start} – ${formatGameTime(endIso)}` : start;
}
