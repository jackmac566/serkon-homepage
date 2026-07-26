import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(binding: D1Database) {
  if (!binding) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(binding, { schema });
}

let communitySetup: Promise<void> | null = null;

export async function ensureCommunityTables(binding: D1Database) {
  if (communitySetup) return communitySetup;
  communitySetup = binding.batch([
    binding.prepare(`CREATE TABLE IF NOT EXISTS community_votes (
      id text PRIMARY KEY NOT NULL,
      visitor_id text NOT NULL,
      round_key text NOT NULL,
      option_key text NOT NULL,
      updated_at integer NOT NULL
    )`),
    binding.prepare("CREATE INDEX IF NOT EXISTS community_votes_round_option_idx ON community_votes (round_key, option_key)"),
    binding.prepare("CREATE INDEX IF NOT EXISTS community_votes_visitor_round_idx ON community_votes (visitor_id, round_key)"),
    binding.prepare(`CREATE TABLE IF NOT EXISTS planet_contributions (
      id text PRIMARY KEY NOT NULL,
      visitor_id text NOT NULL,
      day_key text NOT NULL,
      mood text NOT NULL,
      created_at integer NOT NULL
    )`),
    binding.prepare("CREATE INDEX IF NOT EXISTS planet_contributions_day_mood_idx ON planet_contributions (day_key, mood)"),
    binding.prepare("CREATE INDEX IF NOT EXISTS planet_contributions_visitor_day_idx ON planet_contributions (visitor_id, day_key)"),
  ]).then(() => undefined).catch((error: unknown) => {
    communitySetup = null;
    throw error;
  });
  return communitySetup;
}

let lobbySetup: Promise<void> | null = null;

export async function ensureLobbyTables(binding: D1Database) {
  if (lobbySetup) return lobbySetup;
  lobbySetup = binding.batch([
    binding.prepare(`CREATE TABLE IF NOT EXISTS lobby_messages (
      id text PRIMARY KEY NOT NULL,
      visitor_id text NOT NULL,
      visitor_code text NOT NULL,
      nickname text NOT NULL,
      body text NOT NULL,
      reply_to text,
      status text DEFAULT 'visible' NOT NULL,
      moderation_reason text,
      created_at integer NOT NULL,
      moderated_at integer
    )`),
    binding.prepare("CREATE INDEX IF NOT EXISTS lobby_messages_status_created_idx ON lobby_messages (status, created_at)"),
    binding.prepare("CREATE INDEX IF NOT EXISTS lobby_messages_visitor_created_idx ON lobby_messages (visitor_id, created_at)"),
    binding.prepare("CREATE INDEX IF NOT EXISTS lobby_messages_reply_idx ON lobby_messages (reply_to)"),
    binding.prepare(`CREATE TABLE IF NOT EXISTS lobby_rate_events (
      id text PRIMARY KEY NOT NULL,
      device_key text NOT NULL,
      network_key text NOT NULL,
      action text NOT NULL,
      created_at integer NOT NULL,
      expires_at integer NOT NULL
    )`),
    binding.prepare("CREATE INDEX IF NOT EXISTS lobby_rate_device_action_created_idx ON lobby_rate_events (device_key, action, created_at)"),
    binding.prepare("CREATE INDEX IF NOT EXISTS lobby_rate_network_action_created_idx ON lobby_rate_events (network_key, action, created_at)"),
    binding.prepare("CREATE INDEX IF NOT EXISTS lobby_rate_expires_idx ON lobby_rate_events (expires_at)"),
    binding.prepare(`CREATE TABLE IF NOT EXISTS lobby_reports (
      id text PRIMARY KEY NOT NULL,
      message_id text NOT NULL,
      reporter_key text NOT NULL,
      reason text NOT NULL,
      created_at integer NOT NULL
    )`),
    binding.prepare("CREATE UNIQUE INDEX IF NOT EXISTS lobby_reports_message_reporter_unique ON lobby_reports (message_id, reporter_key)"),
    binding.prepare("CREATE INDEX IF NOT EXISTS lobby_reports_message_created_idx ON lobby_reports (message_id, created_at)"),
    binding.prepare(`CREATE TABLE IF NOT EXISTS lobby_moderation_log (
      id text PRIMARY KEY NOT NULL,
      message_id text NOT NULL,
      action text NOT NULL,
      reason text NOT NULL,
      created_at integer NOT NULL
    )`),
    binding.prepare("CREATE INDEX IF NOT EXISTS lobby_moderation_message_created_idx ON lobby_moderation_log (message_id, created_at)"),
    binding.prepare(`CREATE TABLE IF NOT EXISTS lobby_presence (
      visitor_key text PRIMARY KEY NOT NULL,
      last_seen integer NOT NULL
    )`),
    binding.prepare("CREATE INDEX IF NOT EXISTS lobby_presence_last_seen_idx ON lobby_presence (last_seen)"),
  ]).then(() => undefined).catch((error: unknown) => {
    lobbySetup = null;
    throw error;
  });
  return lobbySetup;
}
