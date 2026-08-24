import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
