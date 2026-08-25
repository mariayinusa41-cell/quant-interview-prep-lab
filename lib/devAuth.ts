// Developer-mode authentication.
//
// Developer mode unlocks every game with no tokens, so it must be gated by
// something the browser cannot forge. Two things follow from that:
//
//   1. The check is server-side. A client-side flag, or a localStorage
//      value, is editable by anyone with devtools — which is precisely the
//      population that would look.
//   2. The cookie is signed and httpOnly, so it can be neither read nor
//      fabricated by page scripts.
//
// The signature uses DEV_PASSWORD as the HMAC key rather than a separate
// secret. That keeps it to one credential to manage, and it means changing
// the password instantly invalidates every existing developer cookie.

const COOKIE_NAME = "outcry_dev";
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function envVar(env: Record<string, unknown>, key: string): string | null {
  const value = env[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function sign(payload: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time compare, so a wrong signature can't be narrowed by timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isDevConfigured(env: Record<string, unknown>): boolean {
  return envVar(env, "DEV_USERNAME") !== null && envVar(env, "DEV_PASSWORD") !== null;
}

/**
 * Checks the submitted credentials. Returns a Set-Cookie value on success.
 *
 * With no DEV_USERNAME/DEV_PASSWORD configured this always fails, so a
 * deployment that forgets to set them has developer mode closed rather than
 * open — the safe direction for a mode that bypasses payment.
 */
export async function createDevCookie(
  env: Record<string, unknown>,
  username: string,
  password: string,
): Promise<string | null> {
  const expectedUser = envVar(env, "DEV_USERNAME");
  const expectedPass = envVar(env, "DEV_PASSWORD");
  if (!expectedUser || !expectedPass) return null;
  if (!safeEqual(username, expectedUser) || !safeEqual(password, expectedPass)) return null;

  const expires = Date.now() + TTL_MS;
  const payload = String(expires);
  const signature = await sign(payload, expectedPass);
  const value = `${payload}.${signature}`;
  const expiryDate = new Date(expires).toUTCString();

  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expiryDate}`;
}

export function clearDevCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Verifies the cookie on a request. Any doubt resolves to "not a developer". */
export async function isDeveloperRequest(
  request: Request,
  env: Record<string, unknown>,
): Promise<boolean> {
  const password = envVar(env, "DEV_PASSWORD");
  if (!password) return false;

  const header = request.headers.get("cookie") ?? "";
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;

  const value = match.slice(COOKIE_NAME.length + 1);
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  const expires = Number(payload);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const expected = await sign(payload, password);
  return safeEqual(signature, expected);
}
