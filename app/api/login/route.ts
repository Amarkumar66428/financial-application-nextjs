import { NextResponse, type NextRequest } from "next/server";
import { authenticate } from "@/lib/auth/credentials";
import { AUTH_COOKIE, authCookieOptions, createToken } from "@/lib/auth/token";
import { logger } from "@/lib/logger";
import { validateLogin } from "@/lib/validation";

export async function POST(request: NextRequest) {
  // Browsers always send Origin on cross-site POSTs, so reject mismatches.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    logger.warn("auth", "Login rejected: cross-origin request", { origin });
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  // A plain HTML form can't send JSON, which closes off form-based CSRF.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { data, errors } = validateLogin(body);

  if (!data) {
    logger.warn("auth", "Login failed: validation error", {
      fields: Object.keys(errors).join(","),
    });
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", errors },
      { status: 400 },
    );
  }

  const user = authenticate(data.email, data.password);
  if (!user) {
    logger.warn("auth", "Login failed: invalid credentials", {
      email: data.email,
    });
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  response.cookies.set(
    AUTH_COOKIE,
    await createToken(user.id),
    authCookieOptions(),
  );
  logger.info("auth", "Login success", { userId: user.id });

  return response;
}
