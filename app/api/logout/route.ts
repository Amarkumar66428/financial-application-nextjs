import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth/token";
import { logger } from "@/lib/logger";

// POST only, so a third-party page can't log users out with an <img src="/api/logout">.
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(AUTH_COOKIE, "", authCookieOptions(0));
  logger.info("auth", "Logout");
  return response;
}
