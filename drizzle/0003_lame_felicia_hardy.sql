CREATE TABLE `community_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`round_key` text NOT NULL,
	`option_key` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `community_votes_round_option_idx` ON `community_votes` (`round_key`,`option_key`);--> statement-breakpoint
CREATE INDEX `community_votes_visitor_round_idx` ON `community_votes` (`visitor_id`,`round_key`);--> statement-breakpoint
CREATE TABLE `planet_contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`day_key` text NOT NULL,
	`mood` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `planet_contributions_day_mood_idx` ON `planet_contributions` (`day_key`,`mood`);--> statement-breakpoint
CREATE INDEX `planet_contributions_visitor_day_idx` ON `planet_contributions` (`visitor_id`,`day_key`);