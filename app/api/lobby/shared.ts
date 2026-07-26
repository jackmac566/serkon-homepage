import { and, count, eq, gt, lt } from "drizzle-orm";
import { ensureLobbyTables, getDb } from "../../../db";
import { lobbyRateEvents } from "../../../db/schema";

export const LOBBY_COOKIE = "serkon_lobby_v1";
export const LOBBY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const OWNER_EMAIL = "shikanghou4@gmail.com";

export type LobbyEnv = {
  DB: D1Database;
  ADMIN_KEY?: string;
};

const ALLOWED_REPORT_REASONS = new Set(["个人信息", "骚扰攻击", "广告引流", "不适内容", "其他"]);
const RESERVED_NAME_PATTERN = /(serkon|侯世康|站长|管理员|管理員|官方|系统|系統|客服)/iu;
const EXTERNAL_LINK_PATTERN = /(https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:com|cn|net|org|io|me|top|xyz)\b)/iu;
const EMAIL_PATTERN = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[a-z]{2,}/iu;
const PHONE_PATTERN = /(?<!\d)1[3-9]\d{9}(?!\d)/u;
const ID_CARD_PATTERN = /(?<!\d)\d{17}[\dXx](?!\d)/u;
const CONTACT_PATTERN = /(?:微信|微\s*信|vx|v信|qq|扣扣|加我|联系我|聯繫我)[：:\s_-]*[a-z0-9_-]{4,}/iu;
const SYSTEM_IMPERSONATION_PATTERN = /^\s*[【\[]?(?:系统|系統|官方|管理员|管理員|站长|SERKON)[】\]]?\s*[:：]/iu;
const HIGH_RISK_PATTERN = /(人肉搜索|开盒|買賣個資|买卖个资|身份证大全|代开票|裸聊|儿童色情|兒童色情|出售枪支|出售槍支|制作炸弹|製作炸彈)/iu;

export function sameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

export function jsonBodyAllowed(request: Request) {
  const contentType = request.headers.get("Content-Type") ?? "";
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  return contentType.toLowerCase().includes("application/json") && (!contentLength || contentLength <= 4096);
}

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("Cookie") ?? "";
  for (const pair of cookie.split(";")) {
    const [key, ...value] = pair.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

function validDeviceId(value: string | null) {
  return Boolean(value && /^[a-f0-9-]{20,80}$/i.test(value));
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function lobbyIdentity(request: Request) {
  const current = cookieValue(request, LOBBY_COOKIE);
  const isNew = !validDeviceId(current);
  const deviceId = isNew ? crypto.randomUUID() : current!;
  const deviceKey = await digest(`serkon-lobby-device:${deviceId}`);
  const visitorCode = `CN-${deviceKey.slice(0, 6).toUpperCase()}`;
  const ip = (request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0] || "unknown").trim();
  const day = new Date().toISOString().slice(0, 10);
  const networkKey = await digest(`serkon-lobby-network:${day}:${ip}`);
  const reporterKey = await digest(`serkon-lobby-reporter:${deviceKey}:${networkKey}`);
  return { deviceId, deviceKey, visitorCode, networkKey, reporterKey, isNew };
}

export function withLobbyCookie(response: Response, identity: Awaited<ReturnType<typeof lobbyIdentity>>) {
  if (!identity.isNew) return response;
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", `${LOBBY_COOKIE}=${encodeURIComponent(identity.deviceId)}; Path=/; Max-Age=${LOBBY_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.normalize("NFKC").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").replace(/\r\n?/g, "\n").trim()
    : "";
}

export function cleanNickname(value: unknown, visitorCode: string) {
  const fallback = `访客-${visitorCode.slice(-4)}`;
  const raw = normalizeText(value).replace(/\s+/g, " ");
  const safe = raw.replace(/[^\p{L}\p{N}_·\- ]/gu, "").trim();
  const nickname = Array.from(safe).slice(0, 12).join("");
  if (!nickname) return { value: fallback, error: null };
  if (RESERVED_NAME_PATTERN.test(nickname)) return { value: fallback, error: "昵称不能冒充站长、管理员或系统" };
  return { value: nickname, error: null };
}

export function cleanMessage(value: unknown) {
  const normalized = normalizeText(value).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
  const body = Array.from(normalized).slice(0, 120).join("");
  if (Array.from(normalized).length < 2) return { value: body, error: "至少写 2 个字再发送" };
  if (Array.from(normalized).length > 120) return { value: body, error: "每条留言最多 120 个字" };
  if (EXTERNAL_LINK_PATTERN.test(body)) return { value: body, error: "公共大厅暂不允许发布外部链接" };
  if (EMAIL_PATTERN.test(body) || PHONE_PATTERN.test(body) || ID_CARD_PATTERN.test(body) || CONTACT_PATTERN.test(body)) {
    return { value: body, error: "为了保护隐私，大厅不能发布联系方式或身份号码" };
  }
  if (SYSTEM_IMPERSONATION_PATTERN.test(body)) return { value: body, error: "留言不能冒充系统、站长或管理员公告" };
  if (HIGH_RISK_PATTERN.test(body)) return { value: body, error: "这条内容不适合在公共大厅发布" };
  if (/(.)\1{11,}/u.test(body)) return { value: body, error: "请减少连续重复字符" };
  return { value: body, error: null };
}

export function cleanReplyTo(value: unknown) {
  return typeof value === "string" && /^[a-f0-9-]{20,80}$/i.test(value) ? value : null;
}

export function cleanReportReason(value: unknown) {
  return typeof value === "string" && ALLOWED_REPORT_REASONS.has(value) ? value : null;
}

export function cleanAdminReason(value: unknown) {
  const reason = Array.from(normalizeText(value)).slice(0, 80).join("");
  return reason || "站长依据公共大厅规则处理";
}

export async function lobbyDb() {
  const { env } = await import("cloudflare:workers");
  const typedEnv = env as unknown as LobbyEnv;
  await ensureLobbyTables(typedEnv.DB);
  return { env: typedEnv, db: getDb(typedEnv.DB) };
}

export async function rateLimit(
  db: ReturnType<typeof getDb>,
  identity: Awaited<ReturnType<typeof lobbyIdentity>>,
  action: "message" | "report",
) {
  const now = Date.now();
  await db.delete(lobbyRateEvents).where(lt(lobbyRateEvents.expiresAt, now));
  const shortWindow = action === "message" ? 12_000 : 3_000;
  const hourDeviceMax = action === "message" ? 6 : 10;
  const dayDeviceMax = action === "message" ? 20 : 30;
  const hourNetworkMax = action === "message" ? 24 : 40;

  const [recent, deviceHour, deviceDay, networkHour] = await Promise.all([
    db.select({ total: count() }).from(lobbyRateEvents).where(and(
      eq(lobbyRateEvents.deviceKey, identity.deviceKey),
      eq(lobbyRateEvents.action, action),
      gt(lobbyRateEvents.createdAt, now - shortWindow),
    )),
    db.select({ total: count() }).from(lobbyRateEvents).where(and(
      eq(lobbyRateEvents.deviceKey, identity.deviceKey),
      eq(lobbyRateEvents.action, action),
      gt(lobbyRateEvents.createdAt, now - 60 * 60 * 1000),
    )),
    db.select({ total: count() }).from(lobbyRateEvents).where(and(
      eq(lobbyRateEvents.deviceKey, identity.deviceKey),
      eq(lobbyRateEvents.action, action),
      gt(lobbyRateEvents.createdAt, now - 24 * 60 * 60 * 1000),
    )),
    db.select({ total: count() }).from(lobbyRateEvents).where(and(
      eq(lobbyRateEvents.networkKey, identity.networkKey),
      eq(lobbyRateEvents.action, action),
      gt(lobbyRateEvents.createdAt, now - 60 * 60 * 1000),
    )),
  ]);

  if (Number(recent[0]?.total ?? 0) > 0) return "操作太快，请稍等一会儿";
  if (Number(deviceHour[0]?.total ?? 0) >= hourDeviceMax) return "本设备本小时操作次数已达上限";
  if (Number(deviceDay[0]?.total ?? 0) >= dayDeviceMax) return "本设备今天操作次数已达上限";
  if (Number(networkHour[0]?.total ?? 0) >= hourNetworkMax) return "当前网络操作较频繁，请稍后再试";
  return null;
}

export async function recordRateEvent(
  db: ReturnType<typeof getDb>,
  identity: Awaited<ReturnType<typeof lobbyIdentity>>,
  action: "message" | "report",
) {
  const now = Date.now();
  await db.insert(lobbyRateEvents).values({
    id: crypto.randomUUID(),
    deviceKey: identity.deviceKey,
    networkKey: identity.networkKey,
    action,
    createdAt: now,
    expiresAt: now + 25 * 60 * 60 * 1000,
  });
}

async function equalSecret(first: string, second: string) {
  const [left, right] = await Promise.all([digest(first), digest(second)]);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export async function isLobbyAdmin(request: Request, env: LobbyEnv) {
  const authenticatedEmail = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  if (authenticatedEmail === OWNER_EMAIL) return true;
  const supplied = request.headers.get("X-Serkon-Admin-Key")?.trim();
  return Boolean(supplied && env.ADMIN_KEY && await equalSecret(supplied, env.ADMIN_KEY));
}
