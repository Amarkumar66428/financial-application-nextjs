import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth/token";
import { logger } from "@/lib/logger";

// proxy.ts replaces middleware.ts in Next 16.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const result = await verifyToken(request.cookies.get(AUTH_COOKIE)?.value);

  // Already signed in, so skip the login page.
  if (pathname === "/login") {
    return result.ok
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();
  }

  if (!result.ok) {
    logger.warn("proxy", "Unauthorized access attempt", {
      path: pathname,
      reason: result.reason,
    });

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname + search);

    const response = NextResponse.redirect(loginUrl);

    // Clear a bad or expired cookie so we don't keep re-checking it.
    if (result.reason !== "missing") response.cookies.delete(AUTH_COOKIE);

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/news/:path*", "/login"],
};
