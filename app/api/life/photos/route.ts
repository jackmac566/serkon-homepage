import { and, count, desc, eq, gte } from "drizzle-orm";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getDb } from "../../../../db";
import { lifePhotos } from "../../../../db/schema";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 1536 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_CATEGORIES = new Set(["访客影像", "日常", "旅行", "朋友", "人物", "随手拍"]);
const MAX_VISITOR_PHOTOS = 50;
const MAX_UPLOADS_PER_HOUR = 16;

function isAdmin(email: string, env: CloudflareEnv) {
  return Boolean(env.ADMIN_EMAIL && email.toLowerCase() === String(env.ADMIN_EMAIL).toLowerCase());
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

export async function GET() {
  try {
    const { env } = await import("cloudflare:workers");
    const user = await getChatGPTUser();
    const rows = await getDb(env.DB).select().from(lifePhotos).orderBy(desc(lifePhotos.createdAt)).limit(200);
    return Response.json({
      signedIn: Boolean(user),
      displayName: user?.displayName ?? null,
      photos: rows.map((photo) => ({
        id: photo.id,
        src: `/api/life/image?id=${encodeURIComponent(photo.id)}`,
        alt: photo.note || `${photo.category}照片`,
        category: photo.category,
        note: photo.note,
        ownerName: photo.ownerName,
        createdAt: photo.createdAt,
        canDelete: Boolean(user && (photo.ownerEmail === user.email || isAdmin(user.email, env))),
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
    if (file.size > MAX_FILE_SIZE) return Response.json({ error: "国内版单张照片不能超过 1.5MB，请压缩后重试" }, { status: 413 });

    const db = getDb(env.DB);
    if (!isAdmin(user.email, env)) {
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
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS life_photo_blobs (photo_id TEXT PRIMARY KEY NOT NULL, image_data BLOB NOT NULL)").run();
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
  if (photo.ownerEmail !== user.email && !isAdmin(user.email, env)) {
    return Response.json({ error: "你只能删除自己上传的照片" }, { status: 403 });
  }

  await env.DB.prepare("DELETE FROM life_photo_blobs WHERE photo_id = ?").bind(id).run();
  await getDb(env.DB).delete(lifePhotos).where(eq(lifePhotos.id, id));
  return Response.json({ ok: true });
}
