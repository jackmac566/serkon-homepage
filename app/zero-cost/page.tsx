import type { Metadata } from "next";
import Link from "next/link";
import policy from "../../data/zero-cost-policy.json";

export const metadata: Metadata = {
  title: "0 元运营原则｜Serkon",
  description: "Serkon 个人网站的零成本能力、免费额度边界与未启用服务清单。",
  alternates: { canonical: "/zero-cost" },
};

export default function ZeroCostPage() {
  return <main className="capability-page cost-page">
    <header className="capability-nav"><Link href="/">← 返回个人主页</Link><span>SERKON / ZERO-COST POLICY</span><Link href="/updates">版本记录</Link></header>
    <section className="capability-hero"><small>ZERO-COST BY DESIGN / CHECKED {policy.checkedAt}</small><h1>0 元运营<br />不是一句口号</h1><p>{policy.principle} 网站构建还会扫描常见付费服务 SDK 和代码里的外部运行请求；发现后直接停止构建，要求人工确认。</p></section>
    <section className="cost-columns">
      <div><small>CONFIRMED / 已启用</small><h2>确定为 0 成本的能力</h2>{policy.confirmedFeatures.map((feature) => <article key={feature.name}><strong>{feature.name}</strong><span>{feature.cost} 元</span><p>{feature.basis}</p></article>)}</div>
      <div><small>NOT ENABLED / 未启用</small><h2>不确定或不适合的能力</h2>{policy.notEnabled.map((feature) => <article key={feature.name}><strong>{feature.name}</strong><span>不上线</span><p>{feature.reason}</p></article>)}</div>
    </section>
    <section className="capability-note"><small>FAIL CLOSED</small><h2>免费额度用完时，宁可暂时停，也不自动花钱。</h2><p>公共大厅、实时在线人数、排行榜和共享影像依赖现有免费额度。达到平台限制时，对应动态接口可能暂时不可用；静态主页、文字版、版本档案和机器资料仍可读取。任何升级付费方案都必须由站长主动决定。</p></section>
    <footer className="capability-footer"><Link href="/privacy">隐私规则</Link><Link href="/provenance">内容来源</Link><Link href="/">返回主页 →</Link></footer>
  </main>;
}
