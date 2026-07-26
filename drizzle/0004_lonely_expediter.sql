CREATE TABLE `lobby_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`visitor_code` text NOT NULL,
	`nickname` text NOT NULL,
	`body` text NOT NULL,
	`reply_to` text,
	`status` text DEFAULT 'visible' NOT NULL,
	`moderation_reason` text,
	`created_at` integer NOT NULL,
	`moderated_at` integer
);
--> statement-breakpoint
CREATE INDEX `lobby_messages_status_created_idx` ON `lobby_messages` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `lobby_messages_visitor_created_idx` ON `lobby_messages` (`visitor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `lobby_messages_reply_idx` ON `lobby_messages` (`reply_to`);--> statement-breakpoint
CREATE TABLE `lobby_moderation_log` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`action` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `lobby_moderation_message_created_idx` ON `lobby_moderation_log` (`message_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `lobby_rate_events` (
	`id` text PRIMARY KEY NOT NULL,
	`device_key` text NOT NULL,
	`network_key` text NOT NULL,
	`action` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `lobby_rate_device_action_created_idx` ON `lobby_rate_events` (`device_key`,`action`,`created_at`);--> statement-breakpoint
CREATE INDEX `lobby_rate_network_action_created_idx` ON `lobby_rate_events` (`network_key`,`action`,`created_at`);--> statement-breakpoint
CREATE INDEX `lobby_rate_expires_idx` ON `lobby_rate_events` (`expires_at`);--> statement-breakpoint
CREATE TABLE `lobby_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`reporter_key` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lobby_reports_message_reporter_unique` ON `lobby_reports` (`message_id`,`reporter_key`);--> statement-breakpoint
CREATE INDEX `lobby_reports_message_created_idx` ON `lobby_reports` (`message_id`,`created_at`);