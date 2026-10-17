import { and, count, desc, eq, gte } from "drizzle-orm";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { ADMIN_COOKIE_NAME, isAdminCredential } from "../../../device-identity";
import { getDb } from "../../../../db";
import { lifePhotos } from "../../../../db/schema";

export const dynamic = "force-dynamic";

// 图片以 BLOB 直接存在 D1 里，没有 R2。1MB 是权衡出来的上限：
// 再大就会明显吃掉 D1 的单库容量与请求体积，而照片墙本来只需要小图。
const MAX_FILE_SIZE = 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_CATEGORIES = new Set(["访客影像", "日常", "旅行", "朋友", "人物", "随手拍"]);
const MAX_VISITOR_PHOTOS = 50;
const MAX_UPLOADS_PER_HOUR = 16;
const MAX_TOTAL_PHOTOS = 300;

function isAdminEmail(email: string, env: CloudflareEnv) {
  return Boolean(env.ADMIN_EMAIL && email.toLowerCase() === String(env.ADMIN_EMAIL).toLowerCase());
}

/**
 * 站长通道：`/lobby/manage` 页面已经把站长密钥放在 `X-Serkon-Admin-Key` 头里，
 * 照片墙沿用同一套密钥；同时接受 `serkon_admin_key` cookie，方便站长在浏览器里直接管理。
 * 设备身份是 `{uuid}@device.serkon.local`，永远不可能等于 ADMIN_EMAIL，
 * 所以只靠邮箱判断会让站长彻底失去管理权限。
 */
function adminKeySupplied(request: Request): string {
  const header = request.headers.get("X-Serkon-Admin-Key")?.trim();
  if (header) return header;
  const cookie = request.headers.get("Cookie") ?? "";
  for (const pair of cookie.split(";")) {
    const [key, ...value] = pair.trim().split("=");
    if (key === ADMIN_COOKIE_NAME) return decodeURIComponent(value.join("=")).trim();
  }
  return "";
}

async function isAdminRequest(request: Request, env: CloudflareEnv) {
  // header 里可放密钥原文；cookie 里只放 HMAC 派生票据，密钥不进浏览器存储。
  return isAdminCredential(adminKeySupplied(request), env);
}

function cleanText(value: FormDataEntryValue | null, fallback: string, max: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, max);
}

function validImageSignature(type: string, buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === "image/gif") return String.fromCharCode(...bytes.slice(0, 6)) === "GIF87a" || String.fromCharCode(...bytes.slice(0, 6)) === "GIF89a";
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function GET(request: Request) {
  try {
    const { env } = await import("cloudflare:workers");
    const [user, adminByKey] = await Promise.all([getChatGPTUser(), isAdminRequest(request, env)]);
    const rows = await getDb(env.DB).select().from(lifePhotos).orderBy(desc(lifePhotos.createdAt)).limit(200);
    return Response.json({
      signedIn: Boolean(user),
      displayName: user?.displayName ?? null,
      isAdmin: adminByKey,
      photos: rows.map((photo) => ({
        id: photo.id,
        src: `/api/life/image?id=${encodeURIComponent(photo.id)}`,
        alt: photo.note || `${photo.category}照片`,
        category: photo.category,
        note: photo.note,
        ownerName: photo.ownerName,
        createdAt: photo.createdAt,
        canDelete: Boolean(adminByKey || (user && (photo.ownerEmail === user.email || isAdminEmail(user.email, env)))),
      })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "共享影像正在连接，请稍后刷新页面" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { env } = await import("cloudflare:workers");
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录后再上传" }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });

  try {
    const form = await request.formData();
    const file = form.get("photo");
    if (!(file instanceof File)) return Response.json({ error: "请选择照片" }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return Response.json({ error: "仅支持 JPG、PNG、WEBP 或 GIF" }, { status: 415 });
    if (!file.size) return Response.json({ error: "照片文件为空" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return Response.json({ error: "单张照片不能超过 1MB，请压缩后重试" }, { status: 413 });

    const db = getDb(env.DB);
    // 影像墙是公开写入的，总量必须设顶，否则数据库会被慢慢塞满。
    const [overall] = await db.select({ value: count() }).from(lifePhotos);
    if ((overall?.value ?? 0) >= MAX_TOTAL_PHOTOS) {
      return Response.json({ error: "共享影像空间已满，请等站长清理后再来" }, { status: 507 });
    }

    if (!isAdminEmail(user.email, env) && !await isAdminRequest(request, env)) {
      const [total] = await db.select({ value: count() }).from(lifePhotos).where(eq(lifePhotos.ownerEmail, user.email));
      if ((total?.value ?? 0) >= MAX_VISITOR_PHOTOS) {
        return Response.json({ error: `每位访客最多保留 ${MAX_VISITOR_PHOTOS} 张照片，请先删除旧照片` }, { status: 429 });
      }
      const hourAgo = Date.now() - 60 * 60 * 1000;
      const [recent] = await db.select({ value: count() }).from(lifePhotos)
        .where(and(eq(lifePhotos.ownerEmail, user.email), gte(lifePhotos.createdAt, hourAgo)));
      if ((recent?.value ?? 0) >= MAX_UPLOADS_PER_HOUR) {
        return Response.json({ error: "上传过于频繁，请一小时后再试" }, { status: 429 });
      }
    }

    const buffer = await file.arrayBuffer();
    if (!validImageSignature(file.type, buffer)) {
      return Response.json({ error: "文件内容与图片格式不一致" }, { status: 415 });
    }

    const id = crypto.randomUUID();
    const objectKey = `d1/${id}`;
    await env.DB.prepare("INSERT INTO life_photo_blobs (photo_id, image_data) VALUES (?, ?)")
      .bind(id, new Uint8Array(buffer)).run();

    try {
      const submittedCategory = cleanText(form.get("category"), "访客影像", 20);
      await db.insert(lifePhotos).values({
        id,
        objectKey,
        ownerEmail: user.email,
        ownerName: cleanText(form.get("ownerName"), "一位来访者", 20),
        originalName: file.name.slice(0, 120),
        contentType: file.type,
        category: ALLOWED_CATEGORIES.has(submittedCategory) ? submittedCategory : "访客影像",
        note: cleanText(form.get("note"), "一张来自访客的生活切片", 80),
        createdAt: Date.now(),
      });
    } catch (error) {
      await env.DB.prepare("DELETE FROM life_photo_blobs WHERE photo_id = ?").bind(id).run();
      throw error;
    }

    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "上传失败，请稍后重试" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { env } = await import("cloudflare:workers");
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return Response.json({ error: "缺少照片编号" }, { status: 400 });

  const [photo] = await getDb(env.DB).select().from(lifePhotos).where(eq(lifePhotos.id, id)).limit(1);
  if (!photo) return Response.json({ error: "照片不存在" }, { status: 404 });
  if (photo.ownerEmail !== user.email && !isAdminEmail(user.email, env) && !await isAdminRequest(request, env)) {
    return Response.json({ error: "你只能删除自己上传的照片" }, { status: 403 });
  }

  await env.DB.prepare("DELETE FROM life_photo_blobs WHERE photo_id = ?").bind(id).run();
  await getDb(env.DB).delete(lifePhotos).where(eq(lifePhotos.id, id));
  return Response.json({ ok: true });
}
