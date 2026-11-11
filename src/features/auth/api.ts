import { apiRequest } from "@/lib/api/client";
import type { LoginInput, SignupInput } from "./schemas";
import type { AuthResult, User } from "./types";

export const authApi = {
  register: (input: SignupInput) => apiRequest<AuthResult>("/auth/register", { method: "POST", body: input }),
  login: (input: LoginInput) => apiRequest<AuthResult>("/auth/login", { method: "POST", body: input }),
  logout: (token: string) => apiRequest<{ loggedOut: true }>("/auth/logout", { method: "POST", token }),
  me: (token: string) => apiRequest<{ user: User }>("/auth/me", { token }),
};
