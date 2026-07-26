import type { Metadata } from "next";
import Link from "next/link";
import LobbyClient from "./LobbyClient";

export const metadata: Metadata = {
  title: "Serkon 公共大厅｜世界频道",
  description: "进入 Serkon 个人网站的公共大厅，与所有访客共享一条安静、真实、不会随手撤回的世界频道。",
  alternates: { canonical: "/lobby" },
  openGraph: {
    title: "Serkon 公共大厅｜世界频道",
    description: "有人路过，就可以留下一句话。所有公开留言由全站访客共同看到。",
    url: "/lobby",
    images: ["/serkon-share.jpg"],
  },
};

export default function LobbyPage() {
  return (
    <main className="lobby-page">
      <header className="lobby-nav">
        <Link href="/">← 返回个人主页</Link>
        <span>SERKON / WORLD CHANNEL</span>
        <Link href="/privacy">大厅规则</Link>
      </header>
      <section className="lobby-hero" aria-labelledby="lobby-title">
        <div>
          <small>PUBLIC LOBBY / DEVICE-PSEUDONYMOUS</small>
          <p>这里也许很安静，但不是一间空房。</p>
          <h1 id="lobby-title">公共大厅</h1>
          <p className="lobby-lead">所有访客看到同一个频道。你可以匿名留下一句话；内容会写入全站共享数据库并长期保留，退出、刷新或换设备都不会让它消失。发布后不能自行编辑或删除，站长只会为隐私、安全和公共规则进行必要处理。</p>
        </div>
        <aside className="lobby-rule-card" aria-label="大厅核心规则">
          <span>WORLD / 001</span>
          <strong>公开可见<br />发布即锁定</strong>
          <ul>
            <li>不要求实名，不显示真实账号</li>
            <li>历史留言长期保留，可持续读取更早内容</li>
            <li>实时在线按最近 2 分钟活跃统计，不公开名单</li>
            <li>不允许联系方式、外链与私人号码</li>
            <li>管理员可处理举报、侵权与不适内容</li>
          </ul>
        </aside>
      </section>
      <LobbyClient />
      <footer className="lobby-footer">
        <p>在线人数来自真实活跃状态；安静也是真实状态。</p>
        <div><Link href="/accessibility">无障碍说明</Link><Link href="/zero-cost">0 元运营承诺</Link><Link href="/">返回主页 →</Link></div>
      </footer>
    </main>
  );
}
