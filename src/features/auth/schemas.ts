import { z } from "zod";

/** Kept in step with leagueup_be/src/modules/auth/auth.schemas.ts. The backend remains authoritative. */
const email = z.string().trim().toLowerCase().min(1, "Email is required.").email("Enter a valid email address.");
const name = z.string().trim().min(1, "This field is required.").max(80, "Must be 80 characters or fewer.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(200, "Password must be at most 200 characters."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

/** Only allow same-site relative redirects after login, never an attacker-supplied absolute URL. */
export function safeRedirectPath(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
