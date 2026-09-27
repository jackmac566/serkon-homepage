/**
 * Cloudflare Pages Advanced Mode 入口。
 *
 * 作用：把「交互视觉改版」新前端设为网站首页，
 * 其它所有路径原样交给第 35 版完整应用（含公共大厅、共享影像、互动游戏等）。
 *
 * 修正 1（2026-09-27，资源 404）：
 * 旧版 vinext 应用的路由层不分发 /assets/* 这类构建产物（hash 命名的 JS/CSS 不在它的
 * public 清单里），会直接渲染 404 页面。早期部署之所以正常，是因为 Pages 侧的
 * _routes.json 把 /assets/* 排除在 Worker 之外、交给 Pages 静态资源服务返回。
 * 现在两层保障：_routes.json 的 exclude + 下面的 /assets/、/archive/ 兜底。
 *
 * 修正 2（2026-09-27，iOS 音乐不播放）：
 * Cloudflare Pages 的静态资源服务**不支持 HTTP Range**：带 Range 的请求一律返回
 * 200 + 整个文件，既没有 Accept-Ranges 也没有 206/416。桌面浏览器能容忍，但
 * iOS Safari / WKWebView 播放 <audio> 时强制要求字节范围支持（它会先发 bytes=0-1），
 * 拿不到 206 就会静默失败 —— 这就是「电脑能播、iPhone 播不了」的原因。
 * 这里在 Worker 侧自己实现 Range：缓存全量字节后按请求切片返回 206。
 */

import oldWorker from "./server/index.js";

const NEW_HOME_ASSET = "/serkon-home.html";
const NEW_HOME_PATHS = new Set(["/", "/home", "/index.html"]);
const ASSET_PATH = "/serkon-home.html";

// 构建产物前缀：必须直接由静态资源服务返回，不能交给旧版应用路由
const STATIC_ASSET_PREFIXES = ["/assets/", "/archive/"];

// 需要 Range 支持的媒体文件（页面里的三处背景音乐都指向 /creation-fk.mp3）
const MEDIA_RE = /\.(mp3|m4a|mp4|webm|wav|ogg|oga|opus)$/i;
const MEDIA_CACHE_CONTROL = "public, max-age=86400";

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

/** 解析 Range 头；返回 { start, end } 或 null 表示整包，或 "invalid" 表示 416 */
function parseRange(header, total) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
  if (!m) return null; // 多区间等复杂写法：直接返回整包
  const [, rawStart, rawEnd] = m;
  let start;
  let end;
  if (rawStart === "") {
    // bytes=-N 取末尾 N 字节
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return "invalid";
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? total - 1 : Math.min(Number(rawEnd), total - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= total || start > end) return "invalid";
  return { start, end };
}

/** 媒体文件：补上 Pages 缺失的 Range 支持 */
async function serveMedia(request, env, url) {
  const asset = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
  if (asset.status !== 200) return null;

  const headers = new Headers(asset.headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", MEDIA_CACHE_CONTROL);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);

  const rangeHeader = request.headers.get("Range");
  if (!rangeHeader) {
    // 没有 Range：流式直出，不占内存
    headers.delete("Content-Length");
    if (request.method === "HEAD") return new Response(null, { status: 200, headers });
    return new Response(asset.body, { status: 200, headers });
  }

  const buffer = await asset.arrayBuffer();
  const total = buffer.byteLength;
  const parsed = parseRange(rangeHeader, total);

  if (parsed === "invalid") {
    headers.set("Content-Range", `bytes */${total}`);
    headers.delete("Content-Length");
    return new Response(null, { status: 416, headers });
  }

  if (!parsed) {
    headers.set("Content-Length", String(total));
    if (request.method === "HEAD") return new Response(null, { status: 200, headers });
    return new Response(buffer, { status: 200, headers });
  }

  const { start, end } = parsed;
  const chunk = buffer.slice(start, end + 1);
  headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  headers.set("Content-Length", String(chunk.byteLength));
  if (request.method === "HEAD") return new Response(null, { status: 206, headers });
  return new Response(chunk, { status: 206, headers });
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
      // 媒体文件：补齐 Range（iOS 播放必需）
      if (MEDIA_RE.test(pathname)) {
        const media = await serveMedia(request, env, url);
        if (media) return media;
      }
      // 兜底：构建产物静态资源直接由 Pages 静态资源服务返回
      if (STATIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        const asset = await env.ASSETS.fetch(request);
        if (asset.status === 200) return asset;
      }
    }

    return oldWorker.fetch(request, env, ctx);
  },
};
