CREATE TABLE `drill_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mode` text DEFAULT 'arithmetic-race' NOT NULL,
	`duration_ms` integer NOT NULL,
	`score` integer NOT NULL,
	`attempts` integer NOT NULL,
	`splits_json` text NOT NULL,
	`seed` integer,
	`deck_size` integer,
	`card_times_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
