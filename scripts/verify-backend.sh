#!/usr/bin/env bash
#
# 后端上线验收：只读路径 + 可自清理的写入路径。
#
# 用法：
#   bash scripts/verify-backend.sh
#   bash scripts/verify-backend.sh https://<预览分支>.serkon-homepage-cn.pages.dev
#
# 退出码：0 = 全部通过；非 0 = 存在失败项。
#
# 原则：不留公开垃圾 —— 不发真实留言（只测拒绝路径），
#       上传的测试照片当场删除并复核 404。
#
set -uo pipefail

BASE="${1:-https://serkon-homepage-cn.pages.dev}"
BASE="${BASE%/}"
WORK="$(mktemp -d)"
trap 'rm -rf "${WORK}"' EXIT

pass=0
fail=0

note() { printf '\n== %s ==\n' "$1"; }
chk() {
  if [ "$2" = "$3" ]; then
    pass=$((pass + 1))
    printf '  \033[32m✓\033[0m %-28s %s\n' "$1" "$3"
  else
    fail=$((fail + 1))
    printf '  \033[31m✗\033[0m %-28s 期望=%s 实际=%s\n' "$1" "$2" "$3"
  fi
}

# 状态码，网络抖动时重试一次。响应体落在 ${WORK}/body
code() {
  local out
  out=$(curl -sS --noproxy '*' -m 25 -o "${WORK}/body" -w '%{http_code}' "$@" 2>/dev/null)
  if [ -z "${out}" ] || [ "${out}" = "000" ]; then
    sleep 2
    out=$(curl -sS --noproxy '*' -m 25 -o "${WORK}/body" -w '%{http_code}' "$@" 2>/dev/null)
  fi
  printf '%s' "${out:-000}"
}

note "1. 页面可达性"
for p in / /life /lobby /play /notes /serkon /games/doudizhu; do
  chk "GET $p" 200 "$(code "$BASE$p")"
done

note "2. 只读接口"
chk "大厅读取"   200 "$(code "$BASE/api/lobby")"
chk "排行榜读取" 200 "$(code "$BASE/api/game/ranking")"
chk "社区信号"   200 "$(code "$BASE/api/game/community")"
chk "照片墙读取" 200 "$(code "$BASE/api/life/photos")"

note "3. 安全边界"
chk "跨站留言被拒" 403 "$(code -X POST "$BASE/api/lobby" -H 'Origin: https://evil.example' -H 'Content-Type: application/json' -d '{"action":"post","accepted":true,"message":"x","nickname":"x"}')"
chk "跨站上传被拒" 403 "$(code -X POST "$BASE/api/life/photos" -H 'Origin: https://evil.example' -F 'photo=@/dev/null')"
chk "站长后台无密钥"   401 "$(code "$BASE/api/lobby/admin")"
chk "站长后台错误密钥" 401 "$(code "$BASE/api/lobby/admin" -H 'X-Serkon-Admin-Key: definitely-wrong')"
chk "不存在接口 404"   404 "$(code "$BASE/api/nope")"

note "4. 设备身份签名"
JAR="${WORK}/cj"
curl -sS --noproxy '*' -m 25 -c "${JAR}" "$BASE/api/life/photos" -o /dev/null
DEVICE=$(awk '/serkon_domestic_device_v1/{print $7}' "${JAR}" 2>/dev/null || true)
if [ -z "${DEVICE}" ]; then
  fail=$((fail + 1))
  printf '  \033[31m✗\033[0m %-28s\n' "未拿到设备 cookie"
else
  case "${DEVICE}" in
    *.*) pass=$((pass + 1)); printf '  \033[32m✓\033[0m %-28s %s\n' "cookie 含 HMAC 签名段" "${DEVICE%%.*}…" ;;
    *)   fail=$((fail + 1)); printf '  \033[31m✗\033[0m %-28s\n' "cookie 缺签名段" ;;
  esac

  ( printf '%s' "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==" | base64 -d > "${WORK}/tiny.png" ) 2>/dev/null

  UP=$(code -b "${JAR}" -X POST "$BASE/api/life/photos" \
    -F "photo=@${WORK}/tiny.png;type=image/png" -F "note=验收临时" -H "Origin: $BASE")
  chk "正常设备上传" 201 "$UP"

  PHOTO_ID=$(curl -sS --noproxy '*' -m 25 -b "${JAR}" "$BASE/api/life/photos" 2>/dev/null | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    print([p['id'] for p in d['photos'] if '验收' in (p.get('note') or '')][0])
except Exception:
    print('')" 2>/dev/null || true)

  if [ -n "${PHOTO_ID}" ]; then
    SZ=$(curl -sS --noproxy '*' -m 25 -o "${WORK}/img" -w '%{size_download}' "$BASE/api/life/image?id=${PHOTO_ID}")
    chk "取图字节数" 70 "$SZ"
    chk "伪造 cookie 删他人被拒" 403 "$(code -b "serkon_domestic_device_v1=${PHOTO_ID}" -X DELETE "$BASE/api/life/photos?id=${PHOTO_ID}" -H "Origin: $BASE")"
    chk "本人删除" 200 "$(code -b "${JAR}" -X DELETE "$BASE/api/life/photos?id=${PHOTO_ID}" -H "Origin: $BASE")"
    chk "删除后取图" 404 "$(code "$BASE/api/life/image?id=${PHOTO_ID}")"
  fi
fi

echo
echo "--------------------------------"
echo "通过 ${pass} 项，失败 ${fail} 项"
[ "${fail}" -eq 0 ]
