# 独立首页源码

`serkon-home.html` 是提交到 Git 的部署产物。编辑这里的源码，再运行 `npm run home:build`；不要直接修改生成的 HTML。

## 文件归属

| 文件 | 用途 |
| --- | --- |
| `template.html` | HTML 外壳、SEO/分享元信息、JSON-LD、无脚本内容；三个占位符插入样式、React 与应用运行时 |
| `style.css` | 从现有正式首页原样提取的样式 |
| `gallery.css` | 可选的新增作品区样式；存在时追加在 `style.css` 后面 |
| `runtime.js` | 原来的浏览器 CommonJS 模块加载器与 React 挂载入口；模块表占位符由构建脚本填入 |
| `modules/components/serkon-homepage.cjs` | 首页主组件、导航、偏好、详情弹窗、联系区 |
| `modules/components/ui/glass-headline-hero.cjs` | 液态金属 WebGL 首屏；保留原来的降级、离屏暂停与减少动画逻辑 |
| `modules/components/ui/stack-spread.cjs` | 散牌档案区及手机平铺布局 |
| `modules/components/ui/icons.cjs` | 图标组件 |
| `modules/data/serkon-experience.cjs` | 作品、档案、联系信息与入口数据 |
| `modules/data/covers.cjs` | 编辑封面 SVG |
| `vendor/react-19.1.1.production.js` | 现有首页使用的 React/ReactDOM 19.1.1 固定运行时；保留内嵌许可说明 |

## 构建与新增模块

```bash
npm run home:build    # 生成 serkon-home.html
npm run home:check    # 只比较，不写文件；不同即失败
npm test             # 先构建首页和旧应用，再运行 tests/*.test.mjs
```

`npm run build` 的 prebuild 第一步也会生成首页。`--check` 不会自动修正漂移，适用于提交前和 CI。产物内容相同时构建不会重写文件。

构建脚本递归发现 `modules/**/*.cjs` 与 `modules/**/*.tsx`，按相对路径排序。模块 ID 是去掉扩展名的路径。例如 `modules/components/work-gallery.tsx` 对应 `components/work-gallery`，主模块使用 `require('./work-gallery')` 即可引用；`quick-index.tsx` 同理。新增模块不需要修改固定名单。

- `.cjs` 内容原样包入函数，不进行格式化或转译。
- `.tsx` 使用仓库已锁定的 TypeScript `transpileModule`，输出 CommonJS、ES2020 和经典 `React.createElement` JSX；组件需显式声明 React，例如 `const React = require('react')`。不额外加载 `react/jsx-runtime`。
- 同一个模块 ID 不能同时有 `.cjs` 和 `.tsx`。替换旧模块时先移除旧文件。
- 模块只能引用打包内的相对模块和提供的 `react`。这不是通用 npm 打包器；新增浏览器依赖需要明确适配加载器。
- TSX 构建检查语法；项目 `tsc --noEmit` 负责完整类型检查。浏览器交互仍需实测。
- 脚本会拒绝模块正文中的未转义 `</script`，避免截断内联脚本。字符串中的结束标签写作 `<\/script`。

## 迁移基线与部署合同

最初提取未改变任何模块行为，六个原模块、原 CSS、原 vendor 与运行时重组后与输入 HTML 逐字节相同：361,448 bytes，SHA-256 `e45a6b27346c316627cb1775f1edca14b7d8f17f14754ac7375495911849f72f`。这是提取时的历史基线；后续功能修改会正常改变产物。

首页的固定 React vendor 与 `package.json` 中旧应用使用的 React 是两个原有运行时。这里的生成步骤没有升级任一运行时；需要升级时单独评估与验证。

此目录只恢复首页可维护性，不改变正式路由。继续使用同一个 Cloudflare Pages 项目、`deploy/_worker.js`、`deploy/_routes.json` 与原 D1。打包方式和音频 Range / WebKit 约束见 [共存部署说明](../deploy/README.md)。
