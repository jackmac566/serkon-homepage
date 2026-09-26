CREATE INDEX `inspiration_challenges_visitor_started_idx` ON `inspiration_challenges` (`visitor_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `inspiration_challenges_started_idx` ON `inspiration_challenges` (`started_at`);--> statement-breakpoint
CREATE INDEX `life_photos_owner_created_idx` ON `life_photos` (`owner_email`,`created_at`);