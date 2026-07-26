import { and, asc, count, desc, eq, gt, lt } from "drizzle-orm";
import { lobbyMessages, lobbyPresence, lobbyReports } from "../../../db/schema";
import {
  cleanMessage,
  cleanNickname,
  cleanReplyTo,
  cleanReportReason,
  jsonBodyAllowed,
  lobbyDb,
  lobbyIdentity,
  rateLimit,
  recordRateEvent,
  sameOrigin,
  withLobbyCookie,
} from "./shared";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;
const MAX_INCREMENTAL = 60;
const PRESENCE_ACTIVE_WINDOW_MS = 2 * 60 * 1000;
const PRESENCE_WRITE_INTERVAL_MS = 60 * 1000;
const PRESENCE_RETENTION_MS = 24 * 60 * 60 * 1000;

async function onlinePresence(
  db: Awaited<ReturnType<typeof lobbyDb>>["db"],
  visitorKey: string,
  trackVisitor: boolean,
) {
  const now = Date.now();
  if (trackVisitor) {
    const [current] = await db.select({ lastSeen: lobbyPresence.lastSeen })
      .from(lobbyPresence).where(eq(lobbyPresence.visitorKey, visitorKey)).limit(1);
    if (!current || current.lastSeen <= now - PRESENCE_WRITE_INTERVAL_MS) {
      await db.insert(lobbyPresence).values({ visitorKey, lastSeen: now }).onConflictDoUpdate({
        target: lobbyPresence.visitorKey,
        set: { lastSeen: now },
      });
      await db.delete(lobbyPresence).where(lt(lobbyPresence.lastSeen, now - PRESENCE_RETENTION_MS));
    }
  }
  const [result] = await db.select({ total: count() }).from(lobbyPresence)
    .where(gt(lobbyPresence.lastSeen, now - PRESENCE_ACTIVE_WINDOW_MS));
  return {
    onlineCount: Number(result?.total ?? 0),
    onlineWindowSeconds: PRESENCE_ACTIVE_WINDOW_MS / 1000,
  };
}

function publicMessage(row: typeof lobbyMessages.$inferSelect) {
  return {
    id: row.id,
    visitorCode: row.visitorCode,
    nickname: row.nickname,
    body: row.body,
    replyTo: row.replyTo,
    createdAt: row.createdAt,
  };
}

function noStore(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return Response.json(data, { ...init, headers });
}

export async function GET(request: Request) {
  const identity = await lobbyIdentity(request);
  try {
    const { db } = await lobbyDb();
    const url = new URL(request.url);
    const presence = await onlinePresence(db, identity.deviceKey, url.searchParams.get("presence") !== "0");
    const since = Number(url.searchParams.get("since"));
    const before = Number(url.searchParams.get("before"));
    let rows: (typeof lobbyMessages.$inferSelect)[];

    if (Number.isFinite(since) && since > 0) {
      rows = await db.select().from(lobbyMessages)
        .where(and(eq(lobbyMessages.status, "visible"), gt(lobbyMessages.createdAt, since)))
        .orderBy(asc(lobbyMessages.createdAt)).limit(MAX_INCREMENTAL);
    } else if (Number.isFinite(before) && before > 0) {
      rows = await db.select().from(lobbyMessages)
        .where(and(eq(lobbyMessages.status, "visible"), lt(lobbyMessages.createdAt, before)))
        .orderBy(desc(lobbyMessages.createdAt)).limit(PAGE_SIZE);
      rows.reverse();
    } else {
      rows = await db.select().from(lobbyMessages)
        .where(eq(lobbyMessages.status, "visible"))
        .orderBy(desc(lobbyMessages.createdAt)).limit(PAGE_SIZE);
      rows.reverse();
    }

    const totalResult = (!Number.isFinite(since) || since <= 0)
      ? await db.select({ total: count() }).from(lobbyMessages).where(eq(lobbyMessages.status, "visible"))
      : null;
    const response = noStore({
      messages: rows.map(publicMessage),
      visitorCode: identity.visitorCode,
      total: totalResult ? Number(totalResult[0]?.total ?? 0) : undefined,
      serverTime: Date.now(),
      hasOlder: rows.length === PAGE_SIZE,
      ...presence,
    });
    return withLobbyCookie(response, identity);
  } catch {
    return withLobbyCookie(noStore({ error: "公共大厅暂时无法连接，请稍后再来" }, { status: 503 }), identity);
  }
}

export async function POST(request: Request) {
  const identity = await lobbyIdentity(request);
  try {
    if (!sameOrigin(request)) return withLobbyCookie(noStore({ error: "请求来源无效" }, { status: 403 }), identity);
    if (!jsonBodyAllowed(request)) return withLobbyCookie(noStore({ error: "请求格式无效" }, { status: 415 }), identity);
    const body = await request.json() as Record<string, unknown>;
    const { db } = await lobbyDb();

    if (body.action === "report") {
      const messageId = cleanReplyTo(body.messageId);
      const reason = cleanReportReason(body.reason);
      if (!messageId || !reason) return withLobbyCookie(noStore({ error: "举报信息无效" }, { status: 400 }), identity);
      const limited = await rateLimit(db, identity, "report");
      if (limited) return withLobbyCookie(noStore({ error: limited }, { status: 429 }), identity);
      const [message] = await db.select({ id: lobbyMessages.id, status: lobbyMessages.status }).from(lobbyMessages)
        .where(eq(lobbyMessages.id, messageId)).limit(1);
      if (!message || message.status !== "visible") return withLobbyCookie(noStore({ error: "这条留言已经不在公共区" }, { status: 404 }), identity);
      const reportId = `${messageId}:${identity.reporterKey}`;
      const [existing] = await db.select({ id: lobbyReports.id }).from(lobbyReports).where(eq(lobbyReports.id, reportId)).limit(1);
      if (existing) return withLobbyCookie(noStore({ error: "你已经举报过这条留言" }, { status: 409 }), identity);
      await db.insert(lobbyReports).values({ id: reportId, messageId, reporterKey: identity.reporterKey, reason, createdAt: Date.now() });
      await recordRateEvent(db, identity, "report");
      return withLobbyCookie(noStore({ ok: true, message: "已提交给站长处理" }), identity);
    }

    if (body.action !== "post" || body.accepted !== true) {
      return withLobbyCookie(noStore({ error: "发送前请确认内容将公开且不能自行删除" }, { status: 400 }), identity);
    }

    const limited = await rateLimit(db, identity, "message");
    if (limited) return withLobbyCookie(noStore({ error: limited }, { status: 429 }), identity);
    const nickname = cleanNickname(body.nickname, identity.visitorCode);
    if (nickname.error) return withLobbyCookie(noStore({ error: nickname.error }, { status: 400 }), identity);
    const message = cleanMessage(body.message);
    if (message.error) return withLobbyCookie(noStore({ error: message.error }, { status: 400 }), identity);
    const replyTo = cleanReplyTo(body.replyTo);

    if (replyTo) {
      const [parent] = await db.select({ id: lobbyMessages.id }).from(lobbyMessages)
        .where(and(eq(lobbyMessages.id, replyTo), eq(lobbyMessages.status, "visible"))).limit(1);
      if (!parent) return withLobbyCookie(noStore({ error: "你回复的留言已经不可见" }, { status: 409 }), identity);
    }

    const [duplicate] = await db.select({ id: lobbyMessages.id }).from(lobbyMessages)
      .where(and(
        eq(lobbyMessages.visitorId, identity.deviceKey),
        eq(lobbyMessages.body, message.value),
        gt(lobbyMessages.createdAt, Date.now() - 24 * 60 * 60 * 1000),
      )).limit(1);
    if (duplicate) return withLobbyCookie(noStore({ error: "相同内容今天已经发送过了" }, { status: 409 }), identity);

    const now = Date.now();
    const row = {
      id: crypto.randomUUID(),
      visitorId: identity.deviceKey,
      visitorCode: identity.visitorCode,
      nickname: nickname.value,
      body: message.value,
      replyTo,
      status: "visible",
      createdAt: now,
      moderationReason: null,
      moderatedAt: null,
    } satisfies typeof lobbyMessages.$inferSelect;
    await db.insert(lobbyMessages).values(row);
    await recordRateEvent(db, identity, "message");
    return withLobbyCookie(noStore({ ok: true, message: publicMessage(row) }, { status: 201 }), identity);
  } catch {
    return withLobbyCookie(noStore({ error: "留言没有发送成功，请稍后再试" }, { status: 500 }), identity);
  }
}
