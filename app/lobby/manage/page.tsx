import type { Metadata } from "next";
import Link from "next/link";
import LobbyAdmin from "./LobbyAdmin";

export const metadata: Metadata = {
  title: "公共大厅管理｜Serkon",
  robots: { index: false, follow: false },
};

export default function LobbyManagePage() {
  return <main className="lobby-page lobby-admin-page">
    <header className="lobby-nav"><Link href="/lobby">← 返回公共大厅</Link><span>OWNER MODERATION</span><Link href="/">个人主页</Link></header>
    <section className="lobby-admin-hero"><small>站长专用</small><h1>大厅管理台</h1><p>管理能力由服务器验证。访问此页面本身不会获得站长权限。</p></section>
    <LobbyAdmin />
  </main>;
}
