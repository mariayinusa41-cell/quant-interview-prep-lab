CREATE TABLE `game_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`game_id` text NOT NULL,
	`score` integer NOT NULL,
	`accuracy` integer,
	`duration_ms` integer,
	`meta_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `game_scores_game_score_idx` ON `game_scores` (`game_id`,`score`);--> statement-breakpoint
CREATE INDEX `game_scores_user_game_idx` ON `game_scores` (`user_id`,`game_id`);