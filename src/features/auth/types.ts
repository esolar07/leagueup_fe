/** Mirrors PublicUser in leagueup_be/src/modules/users/user.serializer.ts. */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

/** Response of POST /auth/register and POST /auth/login. */
export interface AuthResult {
  user: User;
  token: string;
  expiresAt: string;
}
