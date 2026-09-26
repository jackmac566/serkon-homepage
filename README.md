# Serkon Homepage

Serkon（侯世康）的个人网站源码。

- 国内正式站：[serkon-homepage-cn.pages.dev](https://serkon-homepage-cn.pages.dev/)
- 当前版本：第 36 版（交互与视觉改版，单页静态站点）
- 上一版（第 35 版，Next.js 多页应用）：见本仓库 git 历史与 `edition-35` 标签

## 这一版是什么

一次以「体验」为主线的视觉与交互改版。整站是**一个自包含的静态页面**：

- 玻璃折射标题、可探索的个人档案与真实作品
- 中英文切换、无障碍模式（对比度 / 字号 / 减少动画）
- 全部样式与脚本内联在 `index.html` 中，不依赖任何外部 CDN
- 不需要后端、数据库或构建步骤

## 目录结构

| 路径 | 用途 |
|---|---|
| `index.html` | 站点本体（单文件，含内联 CSS / JS / JSON-LD） |
| `_redirects` | 旧版多页路由回落到首页 |
| `robots.txt`、`sitemap.xml` | 搜索引擎收录 |
| `llms.txt`、`identity.json` | 给 AI 的机器可读身份说明 |
| `humans.txt` | 人类可读的作者与身份备注 |
| `serkon-hero.jpg`、`work-color-system.webp`、`archive/` | 页面引用的图片素材 |
| `creation-fk.mp3` | 页面引用的音频素材 |
| `tools/build_site.py` | 从改版设计稿构建本仓库内容的脚本 |

## 部署

本站是 Cloudflare Pages 项目 `serkon-homepage-cn` 的直传内容（Production 分支 `main`）：

```bash
wrangler pages deploy . --project-name=serkon-homepage-cn --branch=main
```

Pages 控制台保留历史部署记录，如需回滚上一版可直接在控制台把旧部署重新提升为生产版本。

## 本地预览

直接双击打开 `index.html` 即可；或起一个静态服务器：

```bash
python3 -m http.server 8080
```

## 版本历史

- 第 36 版：交互与视觉改版，改为单页静态站点
- 第 35 版：Next.js 16 + React 19 多页应用（作品案例、公共大厅留言、共享影像上传、互动游戏、双语与无障碍）
- 第 34 版及更早：见 git 历史

## 许可

代码部分适用根目录 MIT License；个人素材与品牌内容保留权利，详见 `ASSET-LICENSE.md`。
