// Real password hashing and server-side sessions, built entirely on Web
// Crypto so it runs in the Cloudflare Workers runtime without any native
// dependency (bcrypt et al need a node addon or a WASM build; PBKDF2 via
// crypto.subtle ships with the platform).
//
// Server-only: this file touches the D1 binding via getDb(), so it must
// never be imported from a "use client" component — only from route.ts
// handlers, which run on the Worker, not the browser.

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { sessions, users } from "../db/schema";

const PBKDF2_ITERATIONS = 100_000;
const HASH_BYTES = 32; // SHA-256 output length
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_COOKIE = "session";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// Constant-time-ish comparison — avoids a naive `===` short-circuit that
// would leak how many leading bytes matched via response timing. Not a
// perfect defense (JS engines can still optimize), but standard practice
// for a hash comparison this cheap.
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    HASH_BYTES * 8
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return { hash, salt: bytesToHex(salt) };
}

export async function verifyPassword(password: string, hash: string, saltHex: string): Promise<boolean> {
  const candidate = await pbkdf2(password, hexToBytes(saltHex));
  return timingSafeEqualHex(candidate, hash);
}

export function generateSessionToken(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateVerificationToken(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(24)));
}

export function newVerificationExpiry(): string {
  return new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
}

// Password resets expire far faster than email verification. A reset link
// is a live key to the account, so a stale one sitting in an inbox is a
// standing risk in a way an unused verification link is not.
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

export function newResetExpiry(): string {
  return new Date(Date.now() + RESET_TTL_MS).toISOString();
}

export function isValidUsername(username: string): boolean {
  // Letters, numbers, underscore, dot, hyphen — 3 to 24 chars. Loose enough
  // for most handles, tight enough to keep it URL/leaderboard-safe.
  return /^[a-zA-Z0-9_.-]{3,24}$/.test(username);
}

export function newSessionExpiry(): string {
  return new Date(Date.now() + SESSION_TTL_MS).toISOString();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Gmail-style providers ignore dots in the local part and treat everything
// after a "+" as a discardable tag, so user+1@gmail.com, user+2@gmail.com,
// and u.s.e.r@gmail.com are all the same real inbox. Plain email uniqueness
// happily accepts all three as separate accounts — which is exactly how
// someone farms the free-tier welcome tokens over and over. This collapses
// them to one canonical string, stored in users.emailNormalized behind a
// unique index so the database refuses the duplicate outright.
//
// Deliberately conservative: the +tag strip is safe for essentially every
// major provider, but dot-collapsing is a Gmail-specific behaviour, so it
// only applies to Google-hosted domains. Applying it universally would
// wrongly merge two genuinely different people at providers where dots are
// significant.
const GOOGLE_MAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export function normalizeEmailForUniqueness(email: string): string {
  const lowered = normalizeEmail(email);
  const at = lowered.lastIndexOf("@");
  if (at === -1) return lowered;

  let local = lowered.slice(0, at);
  const domain = lowered.slice(at + 1);

  const plus = local.indexOf("+");
  if (plus !== -1) local = local.slice(0, plus);

  if (GOOGLE_MAIL_DOMAINS.has(domain)) {
    local = local.replaceAll(".", "");
    // Both Gmail domains are the same mailbox namespace.
    return `${local}@gmail.com`;
  }

  return `${local}@${domain}`;
}

export function isValidEmail(email: string): boolean {
  // Deliberately loose — real validation is "did the confirmation mail
  // land," not a regex. This just rejects obvious junk before it hits the DB.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseSessionCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === SESSION_COOKIE) return rest.join("=");
  }
  return null;
}

export function setSessionCookieHeader(token: string): string {
  const expires = new Date(Date.now() + SESSION_TTL_MS).toUTCString();
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expires}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export type CurrentUser = {
  id: number;
  email: string;
  username: string | null;
  displayName: string | null;
  emailVerified: boolean;
  welcomeBonusClaimed: boolean;
  isPassHolder: boolean;
};

// Looks up the session from the request's cookie, expiring it (and telling
// the caller "no user") rather than trusting an expired token. Every
// authenticated route calls this instead of re-implementing the lookup.
export async function getCurrentUser(request: Request): Promise<CurrentUser | null> {
  const token = parseSessionCookie(request);
  if (!token) return null;

  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user
    ? {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        emailVerified: user.emailVerifiedAt !== null,
        welcomeBonusClaimed: user.welcomeBonusClaimedAt !== null,
        isPassHolder: user.isPassHolder === 1,
      }
    : null;
}
