CREATE TABLE `life_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`owner_email` text NOT NULL,
	`owner_name` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`category` text DEFAULT '访客影像' NOT NULL,
	`note` text DEFAULT '一张来自访客的生活切片' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `life_photos_object_key_unique` ON `life_photos` (`object_key`);