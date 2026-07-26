import { count, desc, eq } from "drizzle-orm";
import { lobbyMessages, lobbyModerationLog, lobbyReports } from "../../../../db/schema";
import { cleanAdminReason, cleanReplyTo, isLobbyAdmin, jsonBodyAllowed, lobbyDb, sameOrigin } from "../shared";

export const dynamic = "force-dynamic";

function adminJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return Response.json(data, { ...init, headers });
}

export async function GET(request: Request) {
  try {
    const { env, db } = await lobbyDb();
    if (!await isLobbyAdmin(request, env)) return adminJson({ error: "需要站长权限" }, { status: 401 });
    const [messages, reportRows] = await Promise.all([
      db.select().from(lobbyMessages).orderBy(desc(lobbyMessages.createdAt)).limit(120),
      db.select({ messageId: lobbyReports.messageId, total: count() }).from(lobbyReports).groupBy(lobbyReports.messageId),
    ]);
    const reports = Object.fromEntries(reportRows.map((row) => [row.messageId, Number(row.total)]));
    return adminJson({ messages: messages.map((message) => ({ ...message, visitorId: undefined })), reports });
  } catch {
    return adminJson({ error: "管理列表暂时无法读取" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminJson({ error: "请求来源无效" }, { status: 403 });
    if (!jsonBodyAllowed(request)) return adminJson({ error: "请求格式无效" }, { status: 415 });
    const { env, db } = await lobbyDb();
    if (!await isLobbyAdmin(request, env)) return adminJson({ error: "需要站长权限" }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const messageId = cleanReplyTo(body.messageId);
    const action = typeof body.action === "string" ? body.action : "";
    const reason = cleanAdminReason(body.reason);
    if (!messageId || !["hide", "restore", "delete"].includes(action)) return adminJson({ error: "管理操作无效" }, { status: 400 });
    const [message] = await db.select({ id: lobbyMessages.id }).from(lobbyMessages).where(eq(lobbyMessages.id, messageId)).limit(1);
    if (!message) return adminJson({ error: "留言不存在或已经删除" }, { status: 404 });
    const now = Date.now();

    if (action === "delete") {
      await db.delete(lobbyReports).where(eq(lobbyReports.messageId, messageId));
      await db.delete(lobbyMessages).where(eq(lobbyMessages.id, messageId));
    } else {
      await db.update(lobbyMessages).set({
        status: action === "restore" ? "visible" : "hidden",
        moderationReason: action === "restore" ? null : reason,
        moderatedAt: now,
      }).where(eq(lobbyMessages.id, messageId));
    }

    await db.insert(lobbyModerationLog).values({
      id: crypto.randomUUID(),
      messageId,
      action,
      reason,
      createdAt: now,
    });
    return adminJson({ ok: true });
  } catch {
    return adminJson({ error: "管理操作没有完成" }, { status: 500 });
  }
}
