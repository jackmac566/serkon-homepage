#!/usr/bin/env bash
#
# 组装 Cloudflare Pages Advanced Mode 部署目录：
#   「交互视觉改版」新前端作为网站首页 + 第 35 版完整应用继续承接其余所有路径。
#
# 用法：
#   npm run build                              # 先产出 dist/client 与 dist/server
#   bash scripts/build-pages-advanced.sh       # 生成 dist/pages-advanced
#   wrangler pages deploy dist/pages-advanced \
#     --project-name=serkon-homepage-cn --branch=main
#
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="${root}/dist/pages-advanced"
worker="${root}/dist/server/index.js"
home="${root}/serkon-home.html"

[[ -f "${worker}" ]] || {
  echo "缺少构建产物 dist/server/index.js，请先运行 npm run build。" >&2
  exit 69
}

[[ -f "${home}" ]] || {
  echo "缺少新版首页 serkon-home.html。" >&2
  exit 69
}

rm -rf "${out}"
mkdir -p "${out}"

# 1) 第 35 版应用的静态资源，原样保留（_headers、图片、机器可读文件等）
cp -R "${root}/dist/client/." "${out}/"

# 2) 第 35 版应用的 Worker：公共大厅、共享影像、互动游戏等全部后端逻辑
cp -R "${root}/dist/server" "${out}/server"

# 3) 路由分发入口：/ 交给新首页，其余全部交给第 35 版应用
cp "${root}/deploy/_worker.js" "${out}/_worker.js"

# 4) 新版首页实体文件（放在不会与旧站路由冲突的名称下）
cp "${home}" "${out}/serkon-home.html"

# 5) server/ 只参与 Worker 打包，不作为静态资源上传，避免服务端源码被下载
printf 'server/\n.wrangler/\n' > "${out}/.assetsignore"

echo "已生成 ${out}"
echo
echo "部署（Pages 项目需已启用 nodejs_compat）："
echo "  wrangler pages deploy ${out} --project-name=serkon-homepage-cn --branch=main"
