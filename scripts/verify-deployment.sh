#!/usr/bin/env bash
#
# 共存部署上线自检。覆盖两个已经踩过的坑：
#   坑 1 —— 旧站子页面的 /assets/*.css 与 /assets/*.js 必须 200
#   坑 2 —— 媒体文件必须支持 HTTP Range（iOS / 微信才能播音乐）
#
# 用法：
#   bash scripts/verify-deployment.sh
#   bash scripts/verify-deployment.sh https://某个预览分支.serkon-homepage-cn.pages.dev
#
set -uo pipefail

BASE="${1:-https://serkon-homepage-cn.pages.dev}"
BASE="${BASE%/}"

pass=0
fail=0

ok()   { pass=$((pass + 1)); printf '  \033[32m✓\033[0m %s\n' "$1"; }
bad()  { fail=$((fail + 1)); printf '  \033[31m✗\033[0m %s\n' "$1"; }
note() { printf '\n== %s ==\n' "$1"; }

# 取状态码与 content-type
probe() {
  curl -s -o /dev/null -w '%{http_code} %{content_type}' "$1"
}
code_of() { printf '%s' "${1%% *}"; }
type_of() { printf '%s' "${1#* }"; }

note "0. 站点可访问"
root="$(probe "${BASE}/")"
if [[ "$(code_of "$root")" == "200" ]]; then ok "首页 200"; else bad "首页返回 $(code_of "$root")"; fi

note "1. 首页是新版首页"
title="$(curl -s "${BASE}/" | grep -o '<title>[^<]*</title>' | head -1)"
if [[ "$title" == *"好奇，成为作品"* ]]; then
  ok "首页标题：${title}"
else
  bad "首页标题不是新版首页，拿到：${title:-（空）}"
fi

note "2. 新首页实体路径应 302 回 /"
sc="$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/serkon-home.html")"
[[ "$sc" == "302" ]] && ok "/serkon-home.html → 302" || bad "/serkon-home.html → ${sc}（应为 302）"

note "3. 旧站子页面（坑 1：缺 _routes.json 时会变成无样式纯文本）"
for p in /life /play /lobby /serkon /updates /cosmos /notes /system /zero-cost /privacy; do
  r="$(probe "${BASE}${p}")"
  c="$(code_of "$r")"
  t="$(type_of "$r")"
  if [[ "$c" == "200" && "$t" == text/html* ]]; then ok "${p} 200 text/html"; else bad "${p} → ${c} ${t}"; fi
done

note "4. 子页面引用的每个 /assets/* 都必须 200（坑 1 的核心）"
assets="$(curl -s "${BASE}/life" | grep -o '/assets/[A-Za-z0-9_.-]*' | sort -u)"
if [[ -z "$assets" ]]; then
  bad "没能从 /life 里解析出 /assets/* 引用，页面结构可能变了"
else
  while IFS= read -r a; do
    [[ -z "$a" ]] && continue
    r="$(probe "${BASE}${a}")"
    c="$(code_of "$r")"
    t="$(type_of "$r")"
    case "$a" in
      *.css)
        if [[ "$c" == "200" && "$t" == text/css* ]]; then ok "${a} 200 text/css"; else bad "${a} → ${c} ${t}（应为 200 text/css；若为 404 text/html 说明请求落进了 Worker）"; fi
        ;;
      *.js)
        if [[ "$c" == "200" && "$t" == *javascript* ]]; then ok "${a} 200 ${t}"; else bad "${a} → ${c} ${t}"; fi
        ;;
      *)
        [[ "$c" == "200" ]] && ok "${a} 200" || bad "${a} → ${c}"
        ;;
    esac
  done <<< "$assets"
fi

note "5. 媒体 Range 支持（坑 2：iPhone / 微信播音乐的前提）"
media="$(curl -s "${BASE}/" | grep -o '/[A-Za-z0-9._-]*\.mp3' | sort -u | head -1)"
media="${media:-/creation-fk.mp3}"
hdrs="$(curl -s -D - -o /dev/null -H 'Range: bytes=0-1' "${BASE}${media}")"
if printf '%s' "$hdrs" | head -1 | grep -q '206'; then
  ok "${media} Range → 206"
  printf '%s' "$hdrs" | grep -qi 'accept-ranges: bytes' && ok "带 accept-ranges: bytes" || bad "缺少 accept-ranges: bytes"
  printf '%s' "$hdrs" | grep -qi 'content-range: bytes 0-1/' && ok "content-range 正确" || bad "content-range 不正确"
else
  bad "${media} Range 返回 $(printf '%s' "$hdrs" | head -1 | tr -d '\r')（应为 206；返回 200 表示没有 Range 支持，iPhone 会静默播不了）"
fi
sc="$(curl -s -o /dev/null -w '%{http_code}' -H 'Range: bytes=99999999-' "${BASE}${media}")"
[[ "$sc" == "416" ]] && ok "越界 Range → 416" || bad "越界 Range → ${sc}（应为 416）"

note "6. 后端接口与 D1 数据"
r="$(probe "${BASE}/api/lobby")"
if [[ "$(code_of "$r")" == "200" && "$(type_of "$r")" == application/json* ]]; then
  ok "/api/lobby 200 application/json"
elif [[ "$(code_of "$r")" == "503" ]]; then
  printf '  \033[33m!\033[0m /api/lobby 503 —— 预览环境没有绑定 D1 时属正常；如果在正式域名上出现，说明 D1 出问题了\n'
else
  bad "/api/lobby → $(code_of "$r") $(type_of "$r")"
fi

note "7. 安全边界"
for p in /server/index.js /_worker.js; do
  sc="$(curl -s -o /dev/null -w '%{http_code}' "${BASE}${p}")"
  [[ "$sc" == "404" ]] && ok "${p} → 404（源码未泄露）" || bad "${p} → ${sc}（应为 404）"
done

printf '\n----------------------------------------\n'
printf '通过 %d 项，失败 %d 项\n' "$pass" "$fail"
if (( fail > 0 )); then
  printf '\n排查顺序：\n'
  printf '  1) 部署目录里有没有 _routes.json，且 exclude 含 "/assets/*"（deploy/README.md 坑 1）\n'
  printf '  2) 媒体后缀没被 _routes.json 的 exclude 排除，且 _worker.js 里有 Range 实现（坑 2）\n'
  printf '  3) 音频问题必须用 WebKit 验证，Chromium 复现不出来\n'
  exit 1
fi
printf '\n全部通过。\n'
printf '提示：音频类改动请额外用 WebKit（真机 iPhone 或 Playwright WebKit）点一次播放按钮确认。\n'
