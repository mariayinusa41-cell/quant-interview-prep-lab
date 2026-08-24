-- Adding a NOT NULL column to a table that already has rows needs a
-- default, or SQLite rejects the ALTER outright. Add it defaulted, backfill
-- every existing row from its own email, then add the unique index — in
-- that order, because the index would reject a table full of duplicate ''
-- values if it were created first.
ALTER TABLE `users` ADD `email_normalized` text NOT NULL DEFAULT '';--> statement-breakpoint

-- Mirrors lib/auth.ts's normalizeEmailForUniqueness for the existing rows:
-- strip any +tag, and for Gmail/googlemail also strip dots and collapse to
-- gmail.com. SQLite has no regex, so the +tag strip uses instr/substr and
-- the dot strip uses replace, applied only to the local part.
UPDATE `users`
SET `email_normalized` = (
  CASE
    WHEN lower(substr(`email`, instr(`email`, '@') + 1)) IN ('gmail.com', 'googlemail.com')
      THEN replace(
             CASE
               WHEN instr(substr(lower(`email`), 1, instr(`email`, '@') - 1), '+') > 0
                 THEN substr(lower(`email`), 1, instr(substr(lower(`email`), 1, instr(`email`, '@') - 1), '+') - 1)
               ELSE substr(lower(`email`), 1, instr(`email`, '@') - 1)
             END,
             '.', ''
           ) || '@gmail.com'
    ELSE (
      CASE
        WHEN instr(substr(lower(`email`), 1, instr(`email`, '@') - 1), '+') > 0
          THEN substr(lower(`email`), 1, instr(substr(lower(`email`), 1, instr(`email`, '@') - 1), '+') - 1)
        ELSE substr(lower(`email`), 1, instr(`email`, '@') - 1)
      END
    ) || '@' || lower(substr(`email`, instr(`email`, '@') + 1))
  END
);--> statement-breakpoint

CREATE UNIQUE INDEX `users_email_normalized_unique` ON `users` (`email_normalized`);
