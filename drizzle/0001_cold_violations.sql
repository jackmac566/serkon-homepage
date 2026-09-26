CREATE TABLE `inspiration_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`consumed_at` integer
);
--> statement-breakpoint
CREATE TABLE `inspiration_scores` (
	`visitor_id` text PRIMARY KEY NOT NULL,
	`player_name` text NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
