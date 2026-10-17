import { and, count, desc, eq, gt, lt } from "drizzle-orm";
import { getDb } from "../../../../db";
import { inspirationChallenges, inspirationScores } from "../../../../db/schema";
import { scopedVisitorId } from "../../../device-identity";

export const dynamic = "force-dynamic";

const ROUND_MS = 10_000;
const MIN_SUBMIT_MS = 8_500;
const MAX_SUBMIT_MS = 45_000;
const MAX_REASONABLE_SCORE = 80;
const START_COOLDOWN_MS = 1_500;
const CHALLENGE_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_ROUNDS_PER_HOUR = 60;

const RESERVED_NAME_PATTERN = /(serkon|侯世康|站长|管理员|管理員|官方|系统|系統|客服)/iu;

function cleanName(value: unknown) {
  const fallback = "一位路过的朋友";
  const name = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  const safe = name.slice(0, 12);
  // 排行榜是公开页面，昵称里出现站长 / 官方等字样会被误认成站点人员。
  if (!safe || RESERVED_NAME_PATTERN.test(safe)) return fallback;
  return safe;
}

/**
 * 排行榜不再采信客户端提交的 visitorId：它存在 localStorage 里，
 * 谁都能改成别人的值来顶替成绩。身份统一由签名校验过的设备 ID 派生。
 */
async function arcadeVisitorId(request: Request): Promise<string | null> {
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  const suffix = "@device.serkon.local";
  const deviceId = email?.endsWith(suffix) ? email.slice(0, -suffix.length) : null;
  return scopedVisitorId("arcade", deviceId);
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

async function leaderboard(db: ReturnType<typeof getDb>) {
  return db.select({ name: inspirationScores.playerName, score: inspirationScores.bestScore })
    .from(inspirationScores)
    .orderBy(desc(inspirationScores.bestScore), desc(inspirationScores.updatedAt))
    .limit(10);
}

export async function GET() {
  try {
    const { env } = await import("cloudflare:workers");
    return Response.json({ ranking: await leaderboard(getDb(env.DB)) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ranking: [], error: "排行榜暂时无法连接" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
    const { env } = await import("cloudflare:workers");
    const body = await request.json() as { action?: string; visitorId?: unknown; challengeId?: unknown; name?: unknown; score?: unknown };
    const visitorId = await arcadeVisitorId(request);
    if (!visitorId) return Response.json({ error: "访客标识无效" }, { status: 400 });
    const db = getDb(env.DB);

    if (body.action === "start") {
      const now = Date.now();
      const [latest] = await db.select().from(inspirationChallenges)
        .where(eq(inspirationChallenges.visitorId, visitorId))
        .orderBy(desc(inspirationChallenges.startedAt)).limit(1);
      if (latest && now - latest.startedAt < START_COOLDOWN_MS) {
        return Response.json({ error: "操作太快，请稍后再开始" }, { status: 429 });
      }
      // 每开一局都会落一行记录，不限次数的话这张表会被脚本刷成垃圾堆。
      const [hourStarts] = await db.select({ value: count() }).from(inspirationChallenges)
        .where(and(
          eq(inspirationChallenges.visitorId, visitorId),
          gt(inspirationChallenges.startedAt, now - 60 * 60 * 1000),
        ));
      if ((hourStarts?.value ?? 0) >= MAX_ROUNDS_PER_HOUR) {
        return Response.json({ error: "本小时开局次数已达上限，请稍后再来" }, { status: 429 });
      }
      await db.delete(inspirationChallenges).where(lt(inspirationChallenges.startedAt, now - CHALLENGE_RETENTION_MS));
      const challengeId = crypto.randomUUID();
      await db.insert(inspirationChallenges).values({ id: challengeId, visitorId, startedAt: now, consumedAt: null });
      return Response.json({ challengeId, durationMs: ROUND_MS });
    }

    if (body.action !== "submit" || typeof body.challengeId !== "string") {
      return Response.json({ error: "请求无效" }, { status: 400 });
    }
    const score = Number(body.score);
    if (!Number.isInteger(score) || score < 0 || score > MAX_REASONABLE_SCORE) {
      return Response.json({ error: "成绩无效" }, { status: 400 });
    }
    const [challenge] = await db.select().from(inspirationChallenges).where(eq(inspirationChallenges.id, body.challengeId)).limit(1);
    const elapsed = challenge ? Date.now() - challenge.startedAt : 0;
    if (!challenge || challenge.visitorId !== visitorId || challenge.consumedAt || elapsed < MIN_SUBMIT_MS || elapsed > MAX_SUBMIT_MS) {
      return Response.json({ error: "本局记录已失效，请重新挑战" }, { status: 409 });
    }
    await db.update(inspirationChallenges).set({ consumedAt: Date.now() }).where(eq(inspirationChallenges.id, challenge.id));

    const name = cleanName(body.name);
    const [current] = await db.select().from(inspirationScores).where(eq(inspirationScores.visitorId, visitorId)).limit(1);
    if (!current) {
      await db.insert(inspirationScores).values({ visitorId, playerName: name, bestScore: score, updatedAt: Date.now() });
    } else if (score > current.bestScore || name !== current.playerName) {
      await db.update(inspirationScores).set({ playerName: name, bestScore: Math.max(score, current.bestScore), updatedAt: Date.now() })
        .where(eq(inspirationScores.visitorId, visitorId));
    }
    return Response.json({ ranking: await leaderboard(db), personalBest: Math.max(score, current?.bestScore ?? 0) });
  } catch {
    return Response.json({ error: "成绩保存失败，请稍后再试" }, { status: 500 });
  }
}
