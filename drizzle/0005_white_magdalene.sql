CREATE TABLE `lobby_presence` (
	`visitor_key` text PRIMARY KEY NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `lobby_presence_last_seen_idx` ON `lobby_presence` (`last_seen`);