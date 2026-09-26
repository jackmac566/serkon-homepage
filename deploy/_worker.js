/**
 * Cloudflare Pages Advanced Mode 入口。
 *
 * 作用：把「交互视觉改版」新前端设为网站首页，
 * 其它所有路径原样交给第 35 版完整应用（含公共大厅、共享影像、互动游戏等）。
 */
import oldWorker from "./server/index.js";

const NEW_HOME_ASSET = "/serkon-home.html";
const NEW_HOME_PATHS = new Set(["/", "/home", "/index.html"]);
const ASSET_PATH = "/serkon-home.html";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Cross-Origin-Opener-Policy": "same-origin",
};

async function serveNewHome(request, env, url) {
  const assetRequest = new Request(new URL(NEW_HOME_ASSET, url.origin).toString(), {
    method: "GET",
    headers: request.headers,
  });
  const asset = await env.ASSETS.fetch(assetRequest);
  if (asset.status !== 200) return asset;

  const headers = new Headers(asset.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  headers.delete("Content-Length");
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  return new Response(asset.body, { status: 200, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "GET" || request.method === "HEAD") {
      if (NEW_HOME_PATHS.has(pathname)) {
        return serveNewHome(request, env, url);
      }
      // 新版首页的实体文件不单独暴露，避免同一内容出现两个地址
      if (pathname === ASSET_PATH) {
        return Response.redirect(new URL("/", url.origin).toString(), 302);
      }
    }

    return oldWorker.fetch(request, env, ctx);
  },
};
