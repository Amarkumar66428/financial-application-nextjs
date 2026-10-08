import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth/token";
import { getHoldingsForUser } from "@/lib/data/portfolio";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  // The proxy doesn't match /api, so check the token here too.
  const auth = await verifyToken(request.cookies.get(AUTH_COOKIE)?.value);
  if (!auth.ok) {
    logger.warn("api", "Unauthorized /api/portfolio request", { reason: auth.reason });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const holdings = await getHoldingsForUser(auth.payload.sub);
    return NextResponse.json(holdings, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    logger.error("api", "Failed to load portfolio", { message: (error as Error).message });
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}
