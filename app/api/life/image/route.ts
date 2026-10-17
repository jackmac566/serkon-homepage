import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { lifePhotos } from "../../../../db/schema";

export const dynamic = "force-dynamic";

/**
 * D1 在不同运行时下会把 BLOB 交回 ArrayBuffer、Uint8Array 或数字数组。
 * 统一收敛成 Uint8Array 再交给 Blob，避免 `new Response(ArrayBuffer)` 在
 * 中间层被当作空 body 处理（线上曾出现 200 + 0 字节的空白照片）。
 */
function toBytes(value: unknown): Uint8Array | null {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  if (Array.isArray(value)) return Uint8Array.from(value as number[]);
  return null;
}

export async function GET(request: Request) {
  try {
    const { env } = await import("cloudflare:workers");
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return new Response("Missing image id", { status: 400 });

    const [photo] = await getDb(env.DB).select().from(lifePhotos).where(eq(lifePhotos.id, id)).limit(1);
    if (!photo) return new Response("Image not found", { status: 404 });

    const object = await env.DB.prepare("SELECT image_data FROM life_photo_blobs WHERE photo_id = ?")
      .bind(photo.id).first<{ image_data: unknown }>();
    const bytes = toBytes(object?.image_data);
    if (!bytes || bytes.byteLength === 0) return new Response("Image not found", { status: 404 });

    const body = new Blob([bytes], { type: photo.contentType });
    return new Response(body, {
      headers: {
        "Content-Type": photo.contentType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Image unavailable", { status: 503 });
  }
}
