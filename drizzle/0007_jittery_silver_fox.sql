CREATE TABLE `news_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`source` text NOT NULL,
	`location` text,
	`category` text NOT NULL,
	`summary` text,
	`posted_at` text,
	`fetched_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_items_external_id_idx` ON `news_items` (`external_id`);--> statement-breakpoint
CREATE INDEX `news_items_kind_posted_idx` ON `news_items` (`kind`,`posted_at`);