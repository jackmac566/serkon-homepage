# Serkon Homepage

Serkon（侯世康）的双语个人网站源码：个人档案、作品案例、公共大厅、共享影像、互动实验、无障碍模式、机器可读资料、内容来源档案与自动版本记录。

- 国内正式站：[serkon-homepage-cn.pages.dev](https://serkon-homepage-cn.pages.dev/)
- 当前源码基线：第 34 版
- 运行原则：尽可能保持 0 成本；不把会暗中产生费用的能力接入生产环境

## 为什么公开

这份仓库用于技术交流、问题审查和后续协作，也让未来的开发者或 AI 能在完整上下文中继续维护。仓库只包含代码与站长已公开展示的素材，不包含：

- Cloudflare 项目 ID、账号信息或 OAuth 凭证
- `ADMIN_KEY`、`ADMIN_EMAIL` 等生产环境变量
- D1 中的访客照片、留言、排行榜、在线状态或管理日志
- 任何数据库导出、备份和本地缓存

## 主要能力

- 中英文界面与移动端适配
- 作品案例、NOW 状态、站长随笔与版本档案
- 公共大厅：持久留言、回复、举报、限流与管理员处理
- 共享影像：登录上传、真实格式校验、限额和服务端删除权限
- 互动档案、斗地主、记忆翻牌与沉浸式动态模块
- 高对比度、字号、减少动画与键盘可访问性
- `sitemap.xml`、`robots.txt`、`llms.txt`、JSON-LD 和公开身份资料
- 内容来源与 0 成本边界说明

## 技术结构

- Next.js 16 + React 19
- Vinext + Vite
- Cloudflare Workers / Pages
- Cloudflare D1 + Drizzle ORM
- TypeScript

关键目录：

| 路径 | 用途 |
|---|---|
| `app/` | 页面、组件及 API 路由 |
| `worker/` | Cloudflare Worker 入口与静态资源路由 |
| `db/`、`drizzle/` | 数据结构和增量迁移 |
| `data/` | 版本、来源、机器可读及零成本策略源数据 |
| `public/` | 公开静态文件和站长素材 |
| `scripts/` | 构建校验、来源生成和版本记录 |
| `tests/` | 页面、接口、搜索资料与安全边界回归测试 |
| `docs/AI-HANDOFF.md` | 后续开发者或 AI 的接手约束 |

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm ci
npm run dev
```

`vite.config.ts` 在没有私人托管配置时，会自动读取 `.openai/hosting.example.json`，因此公开仓库可以直接启动开发服务器。完整构建、测试或生产部署前，请复制示例并在本地填写真实配置：

```bash
cp .openai/hosting.example.json .openai/hosting.json
```

`.openai/hosting.json` 已被 Git 忽略，禁止提交真实 `project_id`。

完整测试：

```bash
npm test
```

构建脚本使用 GNU `timeout`。macOS 可通过 Homebrew 安装 GNU coreutils，或在 Linux/CI 环境运行测试。

## 生产环境变量

生产环境至少需要：

| 名称 | 类型 | 用途 |
|---|---|---|
| `DB` | D1 binding | 大厅、共享影像、排行榜与互动数据 |
| `ADMIN_EMAIL` | secret | 共享影像管理员身份 |
| `ADMIN_KEY` | secret | 国内版大厅管理密钥 |
| `BUCKET` | R2 binding | 预留的对象存储绑定；当前主要影像数据仍由既有后端处理 |

不要把值写进源码、Issue、日志或截图。公开仓库只描述变量名称。

## 数据与部署边界

这是源码仓库，不是生产数据库备份。部署到新环境前应：

1. 创建自己的 D1 数据库并绑定为 `DB`。
2. 按顺序应用 `drizzle/` 中的迁移。
3. 在部署平台设置管理员 secret。
4. 先在空白测试数据库验证，再连接生产资源。

维护现有 Serkon 正式站时，必须复用既有 Pages 项目与 D1 数据，禁止重建、清空或覆盖线上数据。详见 [AI 接手说明](docs/AI-HANDOFF.md)。

## 内容审核的真实边界

共享影像当前会检查登录身份、请求来源、文件大小、MIME 类型、文件头、上传频率和删除权限；这些检查不能判断图片是否拥有版权，也不能自动识别所有违规内容。

照片版权和公开授权由上传者负责，站长进行事后人工处理。当前仓库没有接入付费版权识别库或第三方自动内容审核服务。若用于更大规模的公开社区，应先增加照片举报、管理员审核队列、处置记录和申诉流程。

## 许可

源代码按 [MIT License](LICENSE) 开放。Serkon / 侯世康的姓名、品牌、文字作品、照片、音乐、肖像和其他个人素材不随代码授权，详见 [素材与品牌许可](ASSET-LICENSE.md)。

开源不等于允许复制个人身份或把本项目冒充为自己的作品。

## 安全

请不要在公开 Issue 中提交密钥、完整日志、访客信息或数据库内容。漏洞报告方式见 [SECURITY.md](SECURITY.md)。
