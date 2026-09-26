import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-code" aria-hidden="true">404</div>
      <section>
        <small>FILE NOT FOUND / 档案未收录</small>
        <h1>这页不在档案里。</h1>
        <p>链接可能已经变化，或者你来到了一个尚未公开的页面。可以从下面三个真实入口继续。</p>
        <nav aria-label="404 页面导航">
          <Link href="/">返回个人主页</Link>
          <Link href="/life">浏览创作与生活影像</Link>
          <Link href="/updates">查看版本记录</Link>
        </nav>
        <p className="not-found-en">This page is not in the archive. Return home, browse the visual journal, or open the release ledger.</p>
      </section>
    </main>
  );
}
