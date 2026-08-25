import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
  // Password reset. Separate columns from the verification pair above: a
  // reset must not consume or interfere with a pending email verification,
  // and the two have very different lifetimes (24h vs 1h).
  resetToken: text("reset_token"),
  resetTokenExpiresAt: text("reset_token_expires_at"),
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
    // Personalization, so a profile follows the account across devices
    // instead of living only in one browser's localStorage. All nullable:
    // an account that has never finished the avatar/tracks flow simply has
    // none, and the client treats that as "still owed".
    avatar: text("avatar"),
    /** JSON array of TrackId strings. */
    tracksJson: text("tracks_json"),
    major: text("major"),
    experience: text("experience"),
    ageBand: text("age_band"),
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

// Per-game scores, one row per completed run.
//
// Separate from `drill_runs`, which is specific to the arithmetic race and
// carries its own ghost-replay columns (splits, card times, seed). This one
// is deliberately game-agnostic: every game reduces to a single ranked
// `score`, with accuracy and duration as optional secondary stats, and
// anything game-specific goes in `metaJson` rather than earning a column.
//
// Boards rank each player's BEST run, not every run — otherwise whoever
// replays the most floods the top of the table, which measures persistence
// rather than skill. The aggregation happens in the query; every run is
// still stored so a personal best can be recomputed.
export const gameScores = sqliteTable(
  "game_scores",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    gameId: text("game_id").notNull(),
    score: integer("score").notNull(),
    // 0-100, or null for games with no notion of right/wrong.
    accuracy: integer("accuracy"),
    // Null for untimed games. Lower is better where it applies, so it is a
    // display/tiebreak stat rather than the ranked one.
    durationMs: integer("duration_ms"),
    metaJson: text("meta_json"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    // The leaderboard query: filter by game, order by score.
    gameScoreIdx: index("game_scores_game_score_idx").on(table.gameId, table.score),
    // "my best at this game", and the per-user aggregation behind ranking.
    userGameIdx: index("game_scores_user_game_idx").on(table.userId, table.gameId),
  }),
);

// News fed by the daily cron (worker/news.ts), not by the build.
//
// Stored as rows rather than one JSON blob so the API can filter and page
// server-side, and so a partially-failed refresh (one firm's board down)
// leaves the rest of the feed intact instead of replacing everything with a
// short list.
//
// `externalId` is the source's own id (e.g. "gh-janestreet-8631912002"), so
// re-running the cron updates a posting in place rather than duplicating it
// every day.
export const newsItems = sqliteTable(
  "news_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    externalId: text("external_id").notNull(),
    /** "job" or "article" — the two scraped kinds. */
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    /** Firm name for a job, publication for an article. */
    source: text("source").notNull(),
    /** Job location; null for articles. */
    location: text("location"),
    /** Job category (trading/research/...) or article topic. */
    category: text("category").notNull(),
    summary: text("summary"),
    /** Source's own timestamp, ISO-ish text as the source gave it. */
    postedAt: text("posted_at"),
    /** When the cron last saw this item. */
    fetchedAt: text("fetched_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    externalIdx: uniqueIndex("news_items_external_id_idx").on(table.externalId),
    kindPostedIdx: index("news_items_kind_posted_idx").on(table.kind, table.postedAt),
  }),
);
