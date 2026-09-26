#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 Serkon 交互视觉改版预览 HTML 构建成可上线的静态站点包。"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

SITE = Path("/Users/macjack622/WorkBuddy/2026-09-26-13-20-36/site")
OLD_PUBLIC = Path("/Users/macjack622/WorkBuddy/2026-07-30-00-23-28/serkon-homepage/public")
LIVE = "https://serkon-homepage-cn.pages.dev"
ORIGIN = "https://serkon-homepage-cn.pages.dev"

TITLE = "Serkon 侯世康 — 好奇，成为作品"
DESC = ("Serkon（侯世康）个人网站：可探索的个人档案、真实作品与互动实验。"
        "Serkon 是侯世康长期使用的网络身份与创作名。")

# 1) 需要随站点一起发布的静态素材（改版页里引用的全部资源）
ASSETS = [
    "serkon-hero.jpg",
    "work-color-system.webp",
    "archive/genesis-music-release.webp",
    "archive/london-ai-workspace.webp",
    "archive/polaroid-collage.webp",
    "archive/serkon-first-build.webp",
    "archive/lixiang-brand-mark.webp",
    "archive/london-video-export.webp",
    "creation-fk.mp3",
]

# 2) 旧站路由 —— 新版是单页，这些路径 302 回首页，避免访客遇到 404
LEGACY_ROUTES = [
    "/serkon", "/life", "/lobby", "/play", "/cosmos", "/updates",
    "/accessibility", "/privacy", "/provenance", "/zero-cost", "/lite",
    "/notes", "/system", "/games/doudizhu",
]


def curl_download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["curl", "-fsSL", "--retry", "3", "-o", str(dest), url],
        check=True, capture_output=True,
    )


def step_assets() -> None:
    for rel in ASSETS:
        dest = SITE / rel
        src = OLD_PUBLIC / rel
        if dest.exists() and dest.stat().st_size > 0:
            print(f"  cached {rel}")
            continue
        if src.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            print(f"  local  {rel}")
        else:
            curl_download(f"{LIVE}/{rel}", dest)
            print(f"  remote {rel}")


JSONLD = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Person",
            "@id": f"{ORIGIN}/#person",
            "name": "侯世康",
            "alternateName": "Serkon",
            "description": "Serkon 是侯世康长期使用的网络身份与创作名。",
            "url": f"{ORIGIN}/",
            "image": f"{ORIGIN}/serkon-hero.jpg",
            "sameAs": [
                "https://github.com/jackmac566",
                "https://personal-homepage.maxc565.chatgpt.site/",
            ],
            "identifier": {
                "@type": "PropertyValue",
                "propertyID": "online identity",
                "value": "Serkon",
            },
            "homeLocation": {"@type": "Place", "name": "中国北京"},
            "knowsAbout": ["AI 创作", "视觉设计", "个人网站", "互动体验", "影像记录"],
            "subjectOf": [
                {"@type": "CreativeWork", "name": "强鹰彩色胶·产品视觉系统",
                 "url": "https://qiangying-color-sealant-cn.pages.dev/"},
                {"@type": "CreativeWork", "name": "妙笔 AI 全能文案助手",
                 "url": "https://miaobi-appl-serkon.pages.dev/"},
                {"@type": "CreativeWork", "name": "微信年轮",
                 "url": "https://github.com/jackmac566/wechat-yearbook"},
            ],
        },
        {
            "@type": "WebSite",
            "@id": f"{ORIGIN}/#website",
            "url": f"{ORIGIN}/",
            "name": "Serkon 侯世康",
            "alternateName": ["Serkon", "侯世康个人主页"],
            "author": {"@id": f"{ORIGIN}/#person"},
            "inLanguage": ["zh-CN", "en"],
        },
        {
            "@type": "ProfilePage",
            "@id": f"{ORIGIN}/#profile-page",
            "url": f"{ORIGIN}/",
            "name": TITLE,
            "description": DESC,
            "inLanguage": ["zh-CN", "en"],
            "mainEntity": {"@id": f"{ORIGIN}/#person"},
        },
    ],
}

HEAD_BLOCK = "\n".join([
    f'<link rel="canonical" href="{ORIGIN}/">',
    '<meta property="og:type" content="profile">',
    '<meta property="og:site_name" content="Serkon 侯世康">',
    f'<meta property="og:title" content="{TITLE}">',
    f'<meta property="og:description" content="{DESC}">',
    f'<meta property="og:url" content="{ORIGIN}/">',
    f'<meta property="og:image" content="{ORIGIN}/serkon-hero.jpg">',
    '<meta property="og:locale" content="zh_CN">',
    '<meta property="og:locale:alternate" content="en_US">',
    '<meta name="twitter:card" content="summary_large_image">',
    f'<meta name="twitter:title" content="{TITLE}">',
    f'<meta name="twitter:description" content="{DESC}">',
    f'<meta name="twitter:image" content="{ORIGIN}/serkon-hero.jpg">',
    f'<meta name="author" content="侯世康 (Serkon)">',
    '<script type="application/ld+json">'
    + json.dumps(JSONLD, ensure_ascii=False, separators=(",", ":"))
    + "</script>",
])


def step_patch_html() -> None:
    p = SITE / "index.html"
    s = p.read_text(encoding="utf-8")
    before = s

    # 描述改成正式上线文案（去掉"改版预览"）
    s = re.sub(
        r'<meta name="description" content="[^"]*">',
        f'<meta name="description" content="{DESC}">',
        s, count=1,
    )

    # 生产模式：关掉预览开关（去掉页脚 "体验改版预览…未部署上线" 提示，
    # 并让站内相对路径就地解析）
    s = s.replace("{preview:true,sourceEdition:35}", "{preview:false,sourceEdition:35}", 1)

    # 注入 SEO / 结构化数据
    s = s.replace("</head>", HEAD_BLOCK + "\n</head>", 1)

    assert s != before, "patch 未生效"
    assert "改版预览" not in s.split("</head>")[0], "meta 描述未替换"
    p.write_text(s, encoding="utf-8")
    print("  patched index.html")


def step_meta_files() -> None:
    (SITE / "_redirects").write_text(
        "# 旧版多页路由在新版单页站点上回落到首页\n"
        + "".join(f"{r} / 302\n" for r in LEGACY_ROUTES),
        encoding="utf-8",
    )

    (SITE / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n\n"
        "Sitemap: " + ORIGIN + "/sitemap.xml\n",
        encoding="utf-8",
    )

    (SITE / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"  <url><loc>{ORIGIN}/</loc><changefreq>weekly</changefreq>"
        "<priority>1.0</priority></url>\n"
        "</urlset>\n",
        encoding="utf-8",
    )

    (SITE / "llms.txt").write_text(
        "# Serkon 侯世康\n\n"
        "> Serkon 是侯世康长期使用的网络身份与创作名。\n"
        "> Serkon is the online identity and creator name used by Hou Shikang (侯世康).\n\n"
        "## Identity\n"
        "- Chinese name: 侯世康\n"
        "- Online identity and creator name: Serkon\n"
        "- Preferred public forms: 侯世康 (Serkon); Serkon 侯世康\n"
        f"- Canonical homepage: {ORIGIN}/\n"
        "- This is a first-party identity statement, not third-party verification.\n\n"
        "## Machine-readable resources\n"
        f"- Identity graph (Person / WebSite JSON-LD): {ORIGIN}/identity.json\n"
        f"- Sitemap: {ORIGIN}/sitemap.xml\n\n"
        "## Interpretation notes\n"
        "- AI may assist creation, but the site does not claim that every asset is "
        "fully AI-generated or fully human-made.\n",
        encoding="utf-8",
    )

    (SITE / "identity.json").write_text(
        json.dumps(JSONLD, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # favicon：沿用旧站图形，保证标签页图标不变
    fav = OLD_PUBLIC / "favicon.svg"
    if fav.exists():
        shutil.copy2(fav, SITE / "favicon.svg")


def main() -> None:
    print("[1/4] 同步静态素材")
    step_assets()
    print("[2/4] 打补丁 index.html")
    step_patch_html()
    print("[3/4] 生成 SEO / 机器可读文件")
    step_meta_files()
    print("[4/4] 完成，站点目录内容：")
    for f in sorted(SITE.rglob("*")):
        if f.is_file():
            print(f"  {f.relative_to(SITE)}  {f.stat().st_size} bytes")


if __name__ == "__main__":
    sys.exit(main())
