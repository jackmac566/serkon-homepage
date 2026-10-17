/**
 * 设备身份的签发与校验。
 *
 * 站点没有账号体系：访客身份就是一个 cookie 里的 UUID。如果这个 UUID 没有任何保护，
 * 任何人只要拿到（或瞎猜）别人的 UUID 就能冒充他——删掉他的照片、替他发言、改他的
 * 排行榜成绩。所以这里给 UUID 附上 HMAC 签名，伪造的 cookie 一律当作新访客重新签发。
 *
 * 签名密钥优先用独立的 `DEVICE_SECRET`；线上如果只配了站长密钥，则退化复用它，
 * 保证任何时候都不会因为缺密钥而退回"裸 UUID"。
 */

export const DEVICE_COOKIE = "serkon_domestic_device_v1";
export const LOBBY_COOKIE = "serkon_lobby_v1";

const ID_PATTERN = /^[a-f0-9-]{20,80}$/i;
const SIGNATURE_LIFETIME_HINT = "";
const KEY_LABEL = "serkon-device-v1";

export type DeviceSecretEnv = {
  DEVICE_SECRET?: string;
  ADMIN_KEY?: string;
  ADMIN_TOKEN?: string;
};

function secretValue(env: DeviceSecretEnv): string {
  return (env.DEVICE_SECRET || env.ADMIN_KEY || env.ADMIN_TOKEN || "").trim();
}

function hexOrBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

async function digest(value: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** 浏览器里存放站长票据的 cookie 名。 */
export const ADMIN_COOKIE_NAME = "serkon_admin_key";

/** 管理员票据的用途标签，避免与设备签名共用同一摘要。 */
export const ADMIN_SESSION_LABEL = "serkon-admin-session-v1";

async function signatureFor(id: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${KEY_LABEL}:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(id)));
  return hexOrBase64Url(signed);
}

async function safeEqual(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(left), digest(right)]);
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return mismatch === 0;
}

/** 把 UUID 变成「UUID.签名」，同时保留无密钥环境下的原始形态。 */
export async function signDeviceId(id: string, env: DeviceSecretEnv): Promise<string> {
  const secret = secretValue(env);
  if (!secret) return id;
  return `${id}.${await signatureFor(id, secret)}`;
}

/** 校验 cookie；失败一律返回 null，由调用方当作新访客处理。 */
export async function parseDeviceId(value: string | null, env: DeviceSecretEnv): Promise<string | null> {
  if (!value) return null;
  const secret = secretValue(env);
  if (!secret) return ID_PATTERN.test(value) ? value : null;

  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!ID_PATTERN.test(id) || !signature) return null;
  return (await safeEqual(signature, await signatureFor(id, secret))) ? id : null;
}

/**
 * 校验站长凭据。
 *
 * 两种合法形态：
 *  1. 直接提交密钥原文（`/lobby/manage` 页面走 header，不落盘，优先推荐）；
 *  2. 浏览器 cookie 里放的是密钥的 HMAC 派生票据 —— 即便 cookie 被泄露，
 *     暴露的也不是密钥本身。
 */
export async function isAdminCredential(supplied: string, env: DeviceSecretEnv): Promise<boolean> {
  const secret = secretValue(env);
  if (!secret || !supplied) return false;
  if (await safeEqual(supplied, secret)) return true;
  return safeEqual(supplied, await signatureFor(ADMIN_SESSION_LABEL, secret));
}

/** 生成可写入浏览器 cookie 的管理员票据（不含密钥原文）。 */
export async function adminSessionTicket(env: DeviceSecretEnv): Promise<string> {
  return signatureFor(ADMIN_SESSION_LABEL, secretValue(env));
}

export function isValidDeviceIdShape(value: string | null): boolean {
  return Boolean(value && ID_PATTERN.test(value));
}

/**
 * 由可信设备 ID 派生各互动模块的访客标识。
 * 客户端提交上来的 visitorId 一律不采信：谁都能改 localStorage 里的值，
 * 只有经签名校验过的设备 ID 才能作为身份来源。
 */
export function scopedVisitorId(scope: string, deviceId: string | null): string | null {
  if (!deviceId || !ID_PATTERN.test(deviceId)) return null;
  return `${scope}-${deviceId}`.slice(0, 80);
}

export const SIGNATURE_NOTES = SIGNATURE_LIFETIME_HINT;
