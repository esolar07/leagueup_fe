import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Optimistic gate only: it checks that a session cookie exists, so signed-out
 * visitors skip a wasted render. Pages still verify the session with the backend
 * (requireUser), and the backend authorizes every request.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

/** Routes that require a signed-in user. Must be a static literal for Next to analyze. */
export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*"],
};
