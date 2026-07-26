import type { Metadata } from "next";
import Link from "next/link";
import provenance from "../../data/content-provenance.json";

export const metadata: Metadata = {
  title: "内容来源与哈希档案｜Serkon",
  description: "查看 Serkon 网站公开视觉的 AI 参与说明、人工贡献与 SHA-256 文件指纹。",
  alternates: { canonical: "/provenance" },
};

export default function ProvenancePage() {
  return <main className="capability-page provenance-page">
    <header className="capability-nav"><Link href="/">← 返回个人主页</Link><span>SERKON / PROVENANCE</span><a href="/content-provenance.json">读取 JSON</a></header>
    <section className="capability-hero"><small>CONTENT ORIGIN / HONEST DISCLOSURE</small><h1>内容来源与<br />哈希档案</h1><p>这里公开“人做了什么、AI 参与了什么”以及每个文件的 SHA-256 指纹。它能帮助发现文件是否被替换，但不是受信任机构签发的 C2PA Content Credential，也不会显示虚假的“官方认证”徽章。</p></section>
    <section className="provenance-list" aria-label="公开内容来源记录">
      {provenance.assets.map((asset, index) => <article key={asset.publicUrl}>
        <div><span>{String(index + 1).padStart(2, "0")}</span><small>{asset.kind}</small></div>
        <div><h2>{asset.title}</h2><dl><dt>人工贡献</dt><dd>{asset.humanContribution}</dd><dt>AI 参与</dt><dd>{asset.aiContribution}</dd><dt>公开说明</dt><dd>{asset.disclosure}</dd><dt>文件大小</dt><dd>{asset.bytes.toLocaleString("zh-CN")} bytes</dd><dt>SHA-256</dt><dd><code>{asset.sha256}</code></dd></dl><a href={asset.publicUrl}>查看当前文件 →</a></div>
      </article>)}
    </section>
    <section className="ui-reference-ledger" aria-labelledby="ui-reference-title">
      <div><small>INTERACTION REFERENCES / LOCAL REBUILD</small><h2 id="ui-reference-title">动效灵感公开，<br />实现留在本站。</h2></div>
      <p>界面研究参考了三个公开 UI 社区及 MotionSites 的公开展示与用户提供录屏，但没有购买、复制或接入其付费模板、提示词、代码与素材。流动显影、聚光卡片、点阵光场、信号边框、按钮扫光与 Serkon 动态思想档案均使用本站已有的 React、Canvas、CSS 和浏览器能力原创实现；不产生新的运行费用，也不会把访客数据发送给这些网站。</p>
      <ul>
        <li><a href="https://reactbits.dev/" target="_blank" rel="noopener noreferrer"><strong>React Bits</strong><span>文字、显影与指针互动节奏参考 ↗</span></a></li>
        <li><a href="https://ui.aceternity.com/components" target="_blank" rel="noopener noreferrer"><strong>Aceternity UI</strong><span>仅参考免费组件目录的光场与边框思路 ↗</span></a></li>
        <li><a href="https://uiverse.io/" target="_blank" rel="noopener noreferrer"><strong>Uiverse.io</strong><span>按钮扫光与微交互反馈参考 ↗</span></a></li>
        <li><a href="https://motionsites.ai/" target="_blank" rel="noopener noreferrer"><strong>MotionSites</strong><span>仅参考公开展示的镜头式滚动与层级节奏，本站原创实现 ↗</span></a></li>
      </ul>
    </section>
    <section className="capability-note"><small>CREDENTIAL STATUS</small><h2>为什么暂时不挂 C2PA 认证徽章？</h2><p>{provenance.credentialNote} 等确认到长期免费、可验证且适合个人站点的签发方式后，才会升级为真正可验证的凭证。</p></section>
    <footer className="capability-footer"><a href="/content-provenance.json">下载机器记录</a><a href="/ui-references.json">读取动效参考 JSON</a><Link href="/zero-cost">查看 0 元边界</Link><Link href="/">返回主页 →</Link></footer>
  </main>;
}
