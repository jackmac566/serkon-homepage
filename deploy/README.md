# 共存部署（Cloudflare Pages Advanced Mode）

这个目录存放「新首页 + 第 35 版整站共存」上线方式所需的全部自定义文件。
正式站 `https://serkon-homepage-cn.pages.dev/` 就是这么部署的。

## 结构

| 路径 | 由谁响应 |
|---|---|
| `/`、`/index.html`、`/home` | `serkon-home.html`（仓库根目录）——交互视觉改版新首页 |
| 其余全部路径（`/serkon`、`/lobby`、`/life`、`/play`、`/updates`、`/cosmos`、`/api/*` …） | 第 35 版完整应用，功能与数据完全不变 |

同一个 Cloudflare Pages 项目、同一个域名、同一套 D1 数据库，**不新建项目**。

## 本目录的三个文件都是必需的

| 文件 | 作用 | 少了会怎样 |
|---|---|---|
| `_worker.js` | Pages Advanced Mode 入口：首页路径交给新首页，其余转发给旧应用；另外补齐 `/assets/*` 直出与媒体 Range | 新首页不生效 |
| `_routes.json` | 把 `/assets/*`、`/archive/*`、图片等静态资源排除在 Worker 之外，交给 Pages 静态资源服务 | **旧站所有子页面变成无样式纯文本**（见坑 1） |
| `../serkon-home.html` | 新首页实体（单文件自包含） | 首页 404 |

## 打包与部署

```bash
npm run build                              # 产出 dist/client 与 dist/server
bash scripts/build-pages-advanced.sh       # 生成 dist/pages-advanced（含 _routes.json）
wrangler pages deploy dist/pages-advanced \
  --project-name=serkon-homepage-cn --branch=main --commit-dirty=true
```

首次部署前，Pages 项目需在生产与预览环境都启用 `nodejs_compat` 兼容标志；
预览环境**不要**绑定 D1（否则预览流量会读写生产数据库，且 `/api/*` 在预览本来就会 503，属正常）。

部署后跑一遍自检：

```bash
bash scripts/verify-deployment.sh
```

---

# 两个已经踩过的坑（改这个站之前务必先读）

## 坑 1：旧站子页面「有内容、没样式」

**症状**：新首页完全正常，但 `/life`、`/serkon` 等子页面打开后是无样式的纯文本，
手机上尤其明显（会看到 `LOADING` 之类没被 JS 替换掉的占位文案）。

**原因**：旧站 HTML 引用的是 `/assets/<hash>.css`、`/assets/<hash>.js` 这类构建产物。
这些 hash 文件不在旧应用的 `public/` 清单里，旧应用内部路由层**不分发 `/assets/*`**，
遇到就直接渲染自己的 404 页面。只有 Pages 侧用 `_routes.json` 把 `/assets/*` 排除在
Worker 之外，交给静态资源服务，才拿得到真正的 CSS/JS。

**判别**：

```bash
curl -s -D - -o /dev/null "https://serkon-homepage-cn.pages.dev/assets/index-DNJ8VZBo.css" | head -4
# 正常：200  content-type: text/css  cache-control: …immutable   且没有 set-cookie
# 出错：404  content-type: text/html  有 set-cookie / vary: RSC…  ← 请求落进 Worker 了
```

**保证不复发**：`_routes.json` 必须在部署目录里；`scripts/build-pages-advanced.sh` 已经
把它一起拷进去，`_worker.js` 里也做了 `/assets/`、`/archive/` 前缀直出 `env.ASSETS` 的兜底。

## 坑 2：音频「电脑能播、iPhone / 微信里播不了」

**症状**：首页左下角 GENESIS、`/cosmos`、`/play` 的背景音乐在电脑上正常，
iPhone 上点了没反应、也不报错（代码里 `play()` 的 reject 被 catch 吞掉了，控制台是干净的）。

**原因**：**Cloudflare Pages 的静态资源服务不处理 HTTP Range**。实测带 `Range` 的请求
（HTTP/1.1 与 HTTP/2、单区间/多区间/越界）一律返回 `200` + 整个文件，没有 `accept-ranges`、
没有 `content-range`、越界也不返 416。

而 iOS Safari / 所有 WKWebView（微信内置浏览器就是）播放 `<audio>` 时**强制要求**服务端
支持字节范围：它先发 `Range: bytes=0-1`，拿不到 `206 Partial Content` 就静默放弃播放。
桌面 Chrome / Edge 能容忍 200，Android 一般也正常，所以表现为「只有 iPhone 不行」。

**判别**：

```bash
curl -s --noproxy '*' -D - -o /dev/null -H "Range: bytes=0-1" \
  "https://serkon-homepage-cn.pages.dev/creation-fk.mp3" | head -4
# 正常：HTTP/2 206 + content-range: bytes 0-1/4478973 + accept-ranges: bytes
# 出错：HTTP/2 200 + content-length: 4478973（整包）
```

**保证不复发**：`_worker.js` 里已经自己实现了 Range（无 Range 时流式直出，有 Range 时
整包读入再切片返回 206）。注意两点容易漏的地方：

1. 媒体后缀**不能**放进 `_routes.json` 的 `exclude`，否则请求根本进不到 Worker。
2. `Cache-Control` 必须由 Worker 自己设置 —— Pages 的 `_headers` 只作用于静态资源直出路径，
   对 Worker 生成的响应不生效。

改动音频相关代码后，**只跑 Chromium 是复现不出这个问题的**，要用 WebKit 验证（见
`scripts/verify-deployment.sh` 末尾的提示）。

## 回滚

三层，从快到慢：

1. Cloudflare Pages 控制台把某次历史部署重新提升为生产。
2. 仓库里有 tag：`edition-35`（第 35 版纯净基线）、`edition-36`。
3. 共存方案本身可移除：删掉 `serkon-home.html` 与 `deploy/` 的引用即回到纯第 35 版；
   `app/`、`worker/`、`db/`、`drizzle/`、`public/` 从未被改动过。

> 注意：旧站依赖 D1 与管理员 secret，这些都挂在现有 Pages 项目设置里。
> **换项目部署会丢配置**，所以永远在同一个项目里做共存，不要新开项目。
