# Serkon 电脑里的创作世界

独立的 3D 个人世界。此目录的构建和预览不替换正式个人主页，也不使用正式站的数据库、管理员凭据或旧应用 Worker。

入口是一间可点击电脑屏幕的 3D 房间。镜头进入 Serkon OS 后，可以打开真实作品、切换本人照片，拖动、最小化或最大化窗口；“创作后院”应用进入可驾驶的五地点世界，返回桌面时保留窗口状态。音乐在桌面和后院之间共用同一个播放器。

## 开发与构建

```sh
cd world
npm ci
npm run build
npm run dev
```

`scripts/build.mjs` 从仓库已有 `public/` 复制本人公开素材至本项目的 `public/assets/`，随后以 `base: './'` 独立运行 Vite，输出 `world/dist/`。复制源缺失时构建会直接失败。打包不需要运行根目录的构建，也不会更改根目录的版本记录。

媒体路由验证：

```sh
npm test
```

测试覆盖车辆转向、碰撞、绕行、五个停车点，以及 Safari 常用的两字节音频探测、单区间/后缀/开放区间、越界、HEAD、If-Range 与静态转发。真正的桌面操作、播放与拖动仍需浏览器验收，HTTP 测试不代替 WebKit 播放测试。

## 预览部署

使用现有 `serkon-homepage-cn` Pages 项目的**专用预览分支**，部署目录只传本项目 `dist/`。不要把该目录发布到 `main` 或生产环境。不要把根目录 `deploy/_worker.js` 覆盖进本项目，它依赖原应用和后端。

本项目 `public/_worker.js` 只为 `/assets/genesis.mp3` 提供字节范围响应，以兼容 Safari/WKWebView 音频。`public/_routes.json` 只让这一条路由进入 Worker；其余 JavaScript、图片、HTML 由静态资源服务返回。两者都由 Vite 从 `public/` 复制到产物，必须一起发布。Worker 只读取 `env.ASSETS`，没有 D1、R2、账户或写入路径。

部署后至少检查首页、打包 JS、真实图片，以及 `Range: bytes=0-1` 返回 `206`、越界返回 `416`、HEAD 无响应体。用 WebKit 实际点击播放/暂停并尝试拖动进度；同时检查手机竖屏、横屏、键盘、减少动态效果和无 WebGL 时的内容入口。

## 素材与署名

Three.js 等依赖保留各自许可证。代码许可不覆盖侯世康 / Serkon 的照片、音乐、个人资料、品牌或项目素材；素材来自已有公开个人站，仅用于本次获授权的个人网站体验，不代表可被第三方自由复用或商用。伦敦图片是原站 AI 影像过程材料，不是真实旅行摄影。
