import type { Metadata } from "next";
import Link from "next/link";
import profile from "../../data/machine-profile.json";
import releases from "../../data/releases.json";

export const metadata: Metadata = {
  title: "Serkon 个人主页｜纯文字轻量版",
  description: "无需图片、音乐和游戏的 Serkon 个人主页轻量阅读入口。",
  alternates: { canonical: "/lite" },
};

export default function LitePage() {
  const latest = releases.at(-1)!;
  return <main className="lite-page" id="main-content">
    <header><Link href="/">← 返回完整视觉版</Link><span>低带宽 · 纯文字 · 无音乐</span></header>
    <article>
      <small>SERKON / TEXT ONLY</small>
      <h1>侯世康<br /><span>Serkon</span></h1>
      <p className="lite-lead">{profile.person.description}</p>
      <nav aria-label="轻量版目录"><a href="#about">关于</a><a href="#projects">作品</a><a href="#links">入口</a><a href="#machine">机器资料</a></nav>
      <section id="about"><h2>关于我</h2><p><strong>Serkon 是侯世康长期使用的网络身份与创作名。</strong></p><p>我喜欢尝试新的 AI 工具，也喜欢游戏、扑克牌和影像记录。我希望被记住为很早就敢于尝试新技术的人；做作品时更重视前所未见的想法，遇到不会的事会先做第一版，再边学边改。</p><p>当前关注：{profile.person.currentFocus}。</p></section>
      <section id="projects"><h2>公开作品</h2><ol>{profile.projects.map((project) => <li key={project.name}><h3>{project.name}</h3><p>{project.summary}</p><a href={project.url} rel={project.url.startsWith("http") ? "noopener noreferrer" : undefined}>查看项目</a></li>)}</ol></section>
      <section id="links"><h2>功能入口</h2><ul><li><Link href="/serkon">身份说明：Serkon = 侯世康</Link></li><li><Link href="/lobby">公共大厅：所有访客共享的匿名留言频道</Link></li><li><Link href="/updates">版本更新记录：当前第 {latest.edition} 版</Link></li><li><Link href="/notes">站长随笔</Link></li><li><Link href="/privacy">隐私与公共规则</Link></li><li><Link href="/accessibility">无障碍说明</Link></li><li><Link href="/provenance">内容来源与哈希档案</Link></li><li><Link href="/zero-cost">0 元运营原则</Link></li></ul></section>
      <section id="machine"><h2>机器可读入口</h2><ul><li><a href="/identity.json">身份关系 JSON-LD</a></li><li><a href="/profile.json">个人资料 JSON-LD</a></li><li><a href="/projects.json">项目列表 JSON-LD</a></li><li><a href="/now.json">当前关注 JSON</a></li><li><a href="/feed.xml">版本更新 RSS</a></li><li><a href="/llms.txt">llms.txt</a></li><li><a href="/humans.txt">humans.txt</a></li></ul></section>
    </article>
    <footer>最后更新：{profile.lastUpdated} · 本页不加载大图、音乐或游戏脚本。</footer>
  </main>;
}
