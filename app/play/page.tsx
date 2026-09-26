import type { Metadata } from "next";
import Link from "next/link";
import Playground from "../Playground";

export const metadata: Metadata = {
  title: "互动档案｜Serkon 侯世康",
  description: "把 Serkon 的 AI、影像、游戏、音乐与个人线索变成可以亲自体验的互动档案。",
  alternates: { canonical: "/play" },
};

export default function PlayPage() {
  return (
    <main className="play-page-shell">
      <header className="subpage-nav">
        <Link href="/">← 返回个人主页</Link>
        <span>SERKON / PLAYABLE ARCHIVE</span>
        <Link href="/cosmos">动态思想档案 ↗</Link>
      </header>
      <section className="play-page-intro section-pad">
        <small>NO DOWNLOAD · NO ACCOUNT · LOCAL FIRST</small>
        <h1>互动档案</h1>
        <p>第一次来，任选一项开始。每个玩法都有独立说明；除全站排行榜外，操作主要保存在当前浏览器，不需要下载应用。</p>
      </section>
      <Playground />
    </main>
  );
}
