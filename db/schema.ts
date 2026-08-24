import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Real accounts. `passwordHash`/`passwordSalt` are PBKDF2-SHA256 output
// (100k iterations) via Web Crypto, not a plaintext or reversibly-encrypted
// password — see lib/auth.ts. Email is stored lowercased so lookups and the
// unique constraint are case-insensitive without a second index.
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    // The uniqueness key that actually matters. `email` uniqueness alone
    // doesn't stop the most common multi-account trick: Gmail routes
    // user+1@gmail.com, user+2@gmail.com, and u.s.e.r@gmail.com all to one
    // inbox, so someone can "verify" a dozen distinct-looking addresses
    // with zero extra effort. This is that same address with the +alias
    // and dots stripped (see lib/auth.ts's normalizeEmailForUniqueness) —
    // unique-indexed, so the DB itself refuses the second account, not just
    // a client-side check that's easy to route around.
    emailNormalized: text("email_normalized").notNull(),
    // Both optional at signup — email is the only required identity field.
    // `username` is unique when set (SQLite unique indexes allow any number
    // of NULLs, so "unique if present" needs no extra handling);
    // `displayName` is free text with no uniqueness constraint at all.
    username: text("username"),
    displayName: text("display_name"),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    // Null until the verification link is clicked. `emailVerifiedAt` is the
    // fact of record; a boolean would only ever restate it.
    emailVerifiedAt: text("email_verified_at"),
    verificationToken: text("verification_token"),
    verificationTokenExpiresAt: text("verification_token_expires_at"),
    // Set the moment the welcome-gift token grant is claimed — server-side
    // so it can't be re-claimed by clearing localStorage (the tokens
    // themselves still live client-side in AccessContext; this column is
    // only the one-time-claim guard).
    welcomeBonusClaimedAt: text("welcome_bonus_claimed_at"),
    // Leaderboard stats — pushed from the client's local ProgressContext
    // (app/progress/ProgressContext.tsx), which stays the source of truth
    // during a session; these columns are just the synced snapshot other
    // players' leaderboards can see. gradedCorrect/gradedTotal reproduce
    // that context's accuracy math (correct / graded * 100) server-side.
    tickets: integer("tickets").notNull().default(0),
    gradedCorrect: integer("graded_correct").notNull().default(0),
    gradedTotal: integer("graded_total").notNull().default(0),
    // True once a real, verified Stripe payment (checkout.session.completed
    // with payment_status "paid", confirmed by re-fetching the session from
    // Stripe — see app/api/billing/verify/route.ts) has been attributed to
    // this account. Not yet wired to subscription-lifecycle events
    // (renewal, cancellation, expiry) — see that route's comments for what
    // "wire up next" means here.
    isPassHolder: integer("is_pass_holder").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    emailNormalizedUnique: uniqueIndex("users_email_normalized_unique").on(table.emailNormalized),
    usernameUnique: uniqueIndex("users_username_unique").on(table.username),
  })
);

// Server-side sessions rather than a stateless signed cookie, so logout and
// (later) "sign out everywhere" are a real DELETE, not a client-side
// promise. `token` is the opaque value that goes in the cookie; nothing
// about the session's identity depends on the client being honest.
export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at").notNull(),
});

// One row per completed Drill Lab run.
//
// A race replays a real past run card-for-card, so a row has to capture the
// deck itself, not just the score: `seed` regenerates the identical card
// sequence, and `cardTimesJson` is a JSON array with one entry per card —
// the elapsed ms at which that card was answered correctly, or -1 if the
// runner never got it. That pair is everything needed to answer "who took
// card 7 first" against a ghost recorded days earlier.
export const drillRuns = sqliteTable("drill_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mode: text("mode").notNull().default("arithmetic-race"),
  durationMs: integer("duration_ms").notNull(),
  score: integer("score").notNull(),
  attempts: integer("attempts").notNull(),
  splitsJson: text("splits_json").notNull(),
  seed: integer("seed"),
  deckSize: integer("deck_size"),
  cardTimesJson: text("card_times_json"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
