import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "网站系统层｜Serkon 侯世康",
  description: "Serkon 个人网站的无障碍、低带宽、机器可读、来源、零成本与版本记录入口。",
  alternates: { canonical: "/system" },
};

const layers = [
  ["01", "ACCESSIBILITY", "阅读辅助", "字号、高对比度、减少动画、链接标识与键盘焦点。", "/accessibility", "打开阅读辅助"],
  ["02", "LOW BANDWIDTH", "纯文字轻量版", "不加载大图、音乐和游戏，低带宽与旧设备也能阅读。", "/lite", "进入轻量版"],
  ["03", "IDENTITY + MACHINE", "身份与机器可读资料", "公开 Serkon 与侯世康的身份关联，以及个人、项目、RSS、llms.txt 和结构化数据。", "/serkon", "查看身份说明"],
  ["04", "PROVENANCE", "内容来源档案", "公开人工与 AI 分工、文件摘要、参考来源与 SHA-256。", "/provenance", "查看来源"],
  ["05", "ZERO COST", "0 元运营原则", "记录免费额度、降级边界和不会暗中产生费用的设计选择。", "/zero-cost", "查看规则"],
  ["06", "RELEASE LEDGER", "版本更新记录", "按日期记录每一版真正的改动，不回放可能泄露隐私的旧页面。", "/updates", "查看版本"],
] as const;

export default function SystemPage() {
  return (
    <main className="system-page">
      <header className="subpage-nav">
        <Link href="/">← 返回个人主页</Link>
        <span>SERKON / PUBLIC SYSTEM</span>
        <Link href="/privacy">隐私规则 ↗</Link>
      </header>
      <section className="system-hero section-pad">
        <small>THE SITE BEHIND THE SITE</small>
        <h1>网站系统层</h1>
        <p>把技术能力从首页的视觉噪音中移出来，集中说明它们解决什么问题、现在能做什么，以及公开入口在哪里。</p>
      </section>
      <section className="system-layer-grid" aria-label="网站公开能力">
        {layers.map(([number, english, title, copy, href, action]) => (
          <a href={href} key={number} data-spotlight data-signal-border>
            <small>{number} / {english}</small>
            <strong>{title}</strong>
            <p>{copy}</p>
            <span>{action} ↗</span>
          </a>
        ))}
      </section>
      <section className="system-promise section-pad">
        <small>DESIGN RULE</small>
        <p>能力必须真实存在、说明必须可以验证、成本边界必须公开；如果某项服务需要付费或无法确认，就不把它包装成已经上线。</p>
      </section>
    </main>
  );
}
