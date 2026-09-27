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

# 4) ★ 必须一起带上：把 /assets/* 等静态资源排除在 Worker 之外，交给 Pages 静态资源服务。
#    少了它，旧站所有子页面会因为 /assets/*.css 与 /assets/*.js 被旧应用路由吞掉而变成
#    「有内容、没样式」的纯文本页。详见 deploy/README.md 的坑 1。
cp "${root}/deploy/_routes.json" "${out}/_routes.json"

# 5) 新版首页实体文件（放在不会与旧站路由冲突的名称下）
cp "${home}" "${out}/serkon-home.html"

# 6) server/ 只参与 Worker 打包，不作为静态资源上传，避免服务端源码被下载
printf 'server/\n.wrangler/\n' > "${out}/.assetsignore"

# 自检：这三样缺一不可
for required in _worker.js _routes.json serkon-home.html .assetsignore; do
  [[ -f "${out}/${required}" ]] || {
    echo "打包结果缺少 ${required}，部署会导致线上故障。" >&2
    exit 70
  }
done

case "$(cat "${out}/_routes.json")" in
  *'"/assets/*"'*) ;;
  *)
    echo 'deploy/_routes.json 的 exclude 里必须包含 "/assets/*"，否则旧站子页面会丢样式。' >&2
    exit 70
    ;;
esac

echo "已生成 ${out}"
echo
echo "部署（Pages 项目需已启用 nodejs_compat）："
echo "  wrangler pages deploy ${out} --project-name=serkon-homepage-cn --branch=main"
echo
echo "部署后请运行自检："
echo "  bash scripts/verify-deployment.sh"
