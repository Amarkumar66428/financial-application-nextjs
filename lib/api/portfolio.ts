import { headers } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth/token";
import { logger } from "@/lib/logger";
import { isHoldingList, type Holding } from "@/lib/portfolio";

async function getBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// Server-side call to our own /api/portfolio, forwarding just the auth cookie.
export async function fetchPortfolio(token: string): Promise<Holding[]> {
  const res = await fetch(`${await getBaseUrl()}/api/portfolio`, {
    cache: "no-store",
    headers: { cookie: `${AUTH_COOKIE}=${token}` },
  });

  if (!res.ok) {
    logger.error("dashboard", "Portfolio API request failed", {
      status: res.status,
    });
    throw new Error(`Portfolio API responded with ${res.status}`);
  }

  const data: unknown = await res.json();
  if (!isHoldingList(data)) {
    logger.error("dashboard", "Portfolio API returned an unexpected shape");
    throw new Error("Unexpected portfolio response");
  }
  return data;
}
