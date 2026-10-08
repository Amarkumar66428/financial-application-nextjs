export const AUTH_COOKIE = "amk-token";
export const TOKEN_TTL_SECONDS = 60 * 60;

export type TokenPayload = {
  sub: string; // user id
  exp: number; // unix seconds
};

export type VerifyResult =
  | { ok: true; payload: TokenPayload }
  | {
      ok: false;
      reason: "missing" | "malformed" | "bad-signature" | "expired";
    };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return "dev-only-secret";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// Token format: base64url(payload).base64url(hmac)
export async function createToken(userId: string): Promise<string> {
  const payload: TokenPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));

  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    encoder.encode(body),
  );

  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyToken(
  token: string | undefined,
): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: "missing" };

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: "malformed" };
  }
  const [body, signature] = parts;

  let payload: unknown;
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = fromBase64Url(signature);
    payload = JSON.parse(decoder.decode(fromBase64Url(body)));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const valid = await crypto.subtle.verify(
    "HMAC",
    await getKey(),
    signatureBytes as Uint8Array<ArrayBuffer>,
    encoder.encode(body),
  );
  if (!valid) return { ok: false, reason: "bad-signature" };

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as TokenPayload).sub !== "string" ||
    typeof (payload as TokenPayload).exp !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }

  const { sub, exp } = payload as TokenPayload;
  if (exp <= Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, payload: { sub, exp } };
}

export function authCookieOptions(maxAge = TOKEN_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
