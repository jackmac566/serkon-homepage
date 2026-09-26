/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const DEVICE_COOKIE = "serkon_domestic_device_v1";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const GOOGLE_VERIFICATION_BODY = "google-site-verification: google0145912d521186e0.html";
const GOOGLE_VERIFICATION_PATHS = new Set([
  "/google0145912d521186e0.html",
  "/google0145912d521186e0",
]);

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("Cookie") ?? "";
  for (const pair of cookie.split(";")) {
    const [key, ...value] = pair.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

function domesticIdentity(request: Request) {
  const current = cookieValue(request, DEVICE_COOKIE);
  const isNew = !current || !/^[a-f0-9-]{20,80}$/i.test(current);
  const id = isNew ? crypto.randomUUID() : current;
  return { id, isNew };
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' mailto:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (GOOGLE_VERIFICATION_PATHS.has(url.pathname)) {
      return new Response(GOOGLE_VERIFICATION_BODY, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
          "Content-Security-Policy": "default-src 'none'",
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        },
      });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const identity = domesticIdentity(request);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("oai-authenticated-user-email", `${identity.id}@device.serkon.local`);
    requestHeaders.set("oai-authenticated-user-full-name", encodeURIComponent("本设备访客"));
    requestHeaders.set("oai-authenticated-user-full-name-encoding", "percent-encoded-utf-8");
    const appRequest = new Request(request, { headers: requestHeaders });
    const response = await handler.fetch(appRequest, env, ctx);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    headers.set("X-Frame-Options", "SAMEORIGIN");
    headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    if (identity.isNew) {
      headers.append("Set-Cookie", `${DEVICE_COOKIE}=${encodeURIComponent(identity.id)}; Path=/; Max-Age=${DEVICE_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};

export default worker;
