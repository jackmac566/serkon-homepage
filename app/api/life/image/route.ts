import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { lifePhotos } from "../../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { env } = await import("cloudflare:workers");
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return new Response("Missing image id", { status: 400 });

    const [photo] = await getDb(env.DB).select().from(lifePhotos).where(eq(lifePhotos.id, id)).limit(1);
    if (!photo) return new Response("Image not found", { status: 404 });

    await env.DB.prepare("CREATE TABLE IF NOT EXISTS life_photo_blobs (photo_id TEXT PRIMARY KEY NOT NULL, image_data BLOB NOT NULL)").run();
    const object = await env.DB.prepare("SELECT image_data FROM life_photo_blobs WHERE photo_id = ?")
      .bind(photo.id).first<{ image_data: ArrayBuffer }>();
    if (!object?.image_data) return new Response("Image not found", { status: 404 });

    return new Response(object.image_data, {
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Image unavailable", { status: 503 });
  }
}
