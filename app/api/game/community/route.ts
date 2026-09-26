import { and, count, eq } from "drizzle-orm";
import { ensureCommunityTables, getDb } from "../../../../db";
import { communityVotes, planetContributions } from "../../../../db/schema";

export const dynamic = "force-dynamic";

const ROUND_KEY = "archive-001";
const OPTION_KEYS = new Set(["qq-archive", "music-game", "city-map"]);
const MOODS = new Set(["spark", "memory", "courage", "calm"]);

function cleanVisitorId(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9-]{12,80}$/.test(value) ? value : null;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function communitySnapshot(db: ReturnType<typeof getDb>, visitorId: string | null) {
  const voteRows = await db.select({ key: communityVotes.optionKey, total: count() })
    .from(communityVotes)
    .where(eq(communityVotes.roundKey, ROUND_KEY))
    .groupBy(communityVotes.optionKey);
  const planetRows = await db.select({ key: planetContributions.mood, total: count() })
    .from(planetContributions)
    .groupBy(planetContributions.mood);
  const [{ totalPlanet }] = await db.select({ totalPlanet: count() }).from(planetContributions);

  let myVote: string | null = null;
  let contributedToday = false;
  if (visitorId) {
    const [vote] = await db.select({ optionKey: communityVotes.optionKey }).from(communityVotes)
      .where(and(eq(communityVotes.visitorId, visitorId), eq(communityVotes.roundKey, ROUND_KEY))).limit(1);
    const [today] = await db.select({ id: planetContributions.id }).from(planetContributions)
      .where(and(eq(planetContributions.visitorId, visitorId), eq(planetContributions.dayKey, dayKey()))).limit(1);
    myVote = vote?.optionKey ?? null;
    contributedToday = Boolean(today);
  }

  return {
    votes: Object.fromEntries(voteRows.map((row) => [row.key, row.total])),
    myVote,
    planet: Object.fromEntries(planetRows.map((row) => [row.key, row.total])),
    totalPlanet,
    contributedToday,
  };
}

export async function GET(request: Request) {
  try {
    const visitorId = cleanVisitorId(new URL(request.url).searchParams.get("visitorId"));
    const { env } = await import("cloudflare:workers");
    await ensureCommunityTables(env.DB);
    return Response.json(await communitySnapshot(getDb(env.DB), visitorId), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "全站灵感信号暂时无法连接" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
    const body = await request.json() as { action?: unknown; visitorId?: unknown; optionKey?: unknown; mood?: unknown };
    const visitorId = cleanVisitorId(body.visitorId);
    if (!visitorId) return Response.json({ error: "访客标识无效" }, { status: 400 });
    const { env } = await import("cloudflare:workers");
    await ensureCommunityTables(env.DB);
    const db = getDb(env.DB);

    if (body.action === "vote") {
      if (typeof body.optionKey !== "string" || !OPTION_KEYS.has(body.optionKey)) return Response.json({ error: "投票选项无效" }, { status: 400 });
      await db.insert(communityVotes).values({
        id: `${visitorId}:${ROUND_KEY}`,
        visitorId,
        roundKey: ROUND_KEY,
        optionKey: body.optionKey,
        updatedAt: Date.now(),
      }).onConflictDoUpdate({ target: communityVotes.id, set: { optionKey: body.optionKey, updatedAt: Date.now() } });
    } else if (body.action === "planet") {
      if (typeof body.mood !== "string" || !MOODS.has(body.mood)) return Response.json({ error: "能量类型无效" }, { status: 400 });
      const today = dayKey();
      const id = `${visitorId}:${today}`;
      const [existing] = await db.select({ id: planetContributions.id }).from(planetContributions).where(eq(planetContributions.id, id)).limit(1);
      if (existing) return Response.json({ error: "今天已经给星球留下过能量了" }, { status: 409 });
      await db.insert(planetContributions).values({ id, visitorId, dayKey: today, mood: body.mood, createdAt: Date.now() });
    } else {
      return Response.json({ error: "请求无效" }, { status: 400 });
    }

    return Response.json(await communitySnapshot(db, visitorId), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "全站灵感信号写入失败，请稍后再试" }, { status: 500 });
  }
}
