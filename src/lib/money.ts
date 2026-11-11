/** Dollar amounts as typed into a form: "10", "10.5", "10.50". */
export const DOLLARS_PATTERN = /^\d{1,5}(\.\d{1,2})?$/;

/** "10.5" → 1050. String arithmetic, so 0.29 never becomes 28.999… cents. */
export function dollarsToCents(dollars: string): number {
  const [whole, fraction = ""] = dollars.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** 1050 → "10.50", 1000 → "10", for prefilling a dollars input. */
export function centsToDollars(cents: number): string {
  const whole = Math.floor(cents / 100);
  const fraction = cents % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, "0")}`;
}

/** Display only — LeagueUp never takes payments. `null` means the organizer did not list a cost. */
export function formatCost(costCents: number | null): string {
  if (costCents === null) return "Cost not listed";
  if (costCents === 0) return "Free";
  return `$${centsToDollars(costCents)}`;
}
