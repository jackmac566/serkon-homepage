import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const lifePhotos = sqliteTable("life_photos", {
  id: text("id").primaryKey(),
  objectKey: text("object_key").notNull().unique(),
  ownerEmail: text("owner_email").notNull(),
  ownerName: text("owner_name").notNull(),
  originalName: text("original_name").notNull(),
  contentType: text("content_type").notNull(),
  category: text("category").notNull().default("访客影像"),
  note: text("note").notNull().default("一张来自访客的生活切片"),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("life_photos_owner_created_idx").on(table.ownerEmail, table.createdAt),
]);

export const inspirationScores = sqliteTable("inspiration_scores", {
  visitorId: text("visitor_id").primaryKey(),
  playerName: text("player_name").notNull(),
  bestScore: integer("best_score").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

export const inspirationChallenges = sqliteTable("inspiration_challenges", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  startedAt: integer("started_at").notNull(),
  consumedAt: integer("consumed_at"),
}, (table) => [
  index("inspiration_challenges_visitor_started_idx").on(table.visitorId, table.startedAt),
  index("inspiration_challenges_started_idx").on(table.startedAt),
]);

export const communityVotes = sqliteTable("community_votes", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  roundKey: text("round_key").notNull(),
  optionKey: text("option_key").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  index("community_votes_round_option_idx").on(table.roundKey, table.optionKey),
  index("community_votes_visitor_round_idx").on(table.visitorId, table.roundKey),
]);

export const planetContributions = sqliteTable("planet_contributions", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  dayKey: text("day_key").notNull(),
  mood: text("mood").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("planet_contributions_day_mood_idx").on(table.dayKey, table.mood),
  index("planet_contributions_visitor_day_idx").on(table.visitorId, table.dayKey),
]);

export const lobbyMessages = sqliteTable("lobby_messages", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  visitorCode: text("visitor_code").notNull(),
  nickname: text("nickname").notNull(),
  body: text("body").notNull(),
  replyTo: text("reply_to"),
  status: text("status").notNull().default("visible"),
  moderationReason: text("moderation_reason"),
  createdAt: integer("created_at").notNull(),
  moderatedAt: integer("moderated_at"),
}, (table) => [
  index("lobby_messages_status_created_idx").on(table.status, table.createdAt),
  index("lobby_messages_visitor_created_idx").on(table.visitorId, table.createdAt),
  index("lobby_messages_reply_idx").on(table.replyTo),
]);

export const lobbyRateEvents = sqliteTable("lobby_rate_events", {
  id: text("id").primaryKey(),
  deviceKey: text("device_key").notNull(),
  networkKey: text("network_key").notNull(),
  action: text("action").notNull(),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
}, (table) => [
  index("lobby_rate_device_action_created_idx").on(table.deviceKey, table.action, table.createdAt),
  index("lobby_rate_network_action_created_idx").on(table.networkKey, table.action, table.createdAt),
  index("lobby_rate_expires_idx").on(table.expiresAt),
]);

export const lobbyReports = sqliteTable("lobby_reports", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull(),
  reporterKey: text("reporter_key").notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  uniqueIndex("lobby_reports_message_reporter_unique").on(table.messageId, table.reporterKey),
  index("lobby_reports_message_created_idx").on(table.messageId, table.createdAt),
]);

export const lobbyModerationLog = sqliteTable("lobby_moderation_log", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull(),
  action: text("action").notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("lobby_moderation_message_created_idx").on(table.messageId, table.createdAt),
]);

export const lobbyPresence = sqliteTable("lobby_presence", {
  visitorKey: text("visitor_key").primaryKey(),
  lastSeen: integer("last_seen").notNull(),
}, (table) => [
  index("lobby_presence_last_seen_idx").on(table.lastSeen),
]);
