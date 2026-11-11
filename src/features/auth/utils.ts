import type { User } from "./types";

export function initialsOf(user: Pick<User, "firstName" | "lastName">): string {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
}
