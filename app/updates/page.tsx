import type { Metadata } from "next";
import Link from "next/link";
import releases from "../../data/releases.json";

export const metadata: Metadata = {
  title: "版本更新记录｜Serkon 侯世康",
  description: "查看 Serkon 个人网站从首版至今的发布日期、版本编号和主要更新内容。",
  alternates: { canonical: "/updates" },
  openGraph: {
    title: "版本更新记录｜Serkon 侯世康",
    description: "一份可核验、持续自动追加的网站成长档案。",
    url: "/updates",
    images: ["/serkon-share.jpg"],
  },
};

function displayDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

export default function UpdatesPage() {
  const first = releases[0];
  const latest = releases.at(-1)!;
  const newestFirst = [...releases].reverse();

  return (
    <main className="release-page">
      <header className="release-nav">
        <Link href="/">← 返回个人主页</Link>
        <span>SERKON / RELEASE ARCHIVE</span>
      </header>

      <section className="release-hero" aria-labelledby="release-title">
        <div>
          <small>SITE EDITION FILE / SINCE 2026</small>
          <p className="release-kicker">这是一份网站自己的成长档案。</p>
          <h1 id="release-title">版本更新记录</h1>
          <p className="release-intro">
            从第一版到现在，每次正式更新只留下日期、版本号和主要变化。这里不保存可回放的旧页面、旧照片或旧联系方式，避免历史内容重新暴露隐私。
          </p>
        </div>
        <div className="release-current" aria-label={`当前为第 ${latest.edition} 版`}>
          <small>CURRENT EDITION</small>
          <strong>{String(latest.edition).padStart(2, "0")}</strong>
          <span>{displayDate(latest.date)}</span>
          <i>持续更新中</i>
        </div>
      </section>

      <section className="release-stats" aria-label="版本档案概览">
        <article><span>首版日期</span><strong>{displayDate(first.date)}</strong></article>
        <article><span>可核实版本</span><strong>{`${releases.length} 次`}</strong></article>
        <article><span>记录方式</span><strong>源码变化自动追加</strong></article>
      </section>

      <section className="release-ledger" aria-labelledby="release-ledger-title">
        <div className="release-ledger-heading">
          <small>COMPLETE LEDGER</small>
          <h2 id="release-ledger-title">从最新一版往回看</h2>
          <p>同一天可能发布多个版本，因为每一次可独立使用的正式改进都会单独留档。</p>
        </div>

        <ol className="release-list">
          {newestFirst.map((release, index) => (
            <li className={index === 0 ? "latest" : undefined} id={`edition-${release.edition}`} key={release.edition}>
              <div className="release-edition">
                <span>EDITION</span>
                <strong>{String(release.edition).padStart(2, "0")}</strong>
              </div>
              <div className="release-entry">
                <div className="release-entry-meta">
                  <time dateTime={release.date}>{displayDate(release.date)}</time>
                  {index === 0 && <b>当前版本</b>}
                </div>
                <h3>{release.title}</h3>
                <p>{release.summary}</p>
                <ul>
                  {release.changes.map((change) => <li key={change}>{change}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="release-method" aria-labelledby="release-method-title">
        <small>AUTOMATIC RECORDING</small>
        <h2 id="release-method-title">以后更新，档案会跟着长大。</h2>
        <p>
          网站进入构建时会比对真正参与页面运行的源码。内容有变化，就自动追加下一版；同一份内容重复构建，不会重复生成版本。更新摘要会按页面、视觉、互动、数据和维护范围自动归类，也可以在发布时写得更具体。更新记录保留，但明确不提供旧页面“时光机”或按年份回放。
        </p>
      </section>

      <footer className="release-footer">
        <Link href="/">回到个人主页 →</Link>
        <Link href="/privacy">隐私与公共上传规则 →</Link>
      </footer>
    </main>
  );
}
