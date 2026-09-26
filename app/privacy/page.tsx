import type { Metadata } from "next";
import Link from "next/link";
import EmailAction from "../EmailAction";

export const metadata: Metadata = {
  title: "隐私与公共上传规则｜Serkon 侯世康",
  description: "Serkon 个人网站的隐私说明、公共影像墙规则、互动数据用途与删除方式。",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "隐私与公共上传规则｜Serkon 侯世康",
    description: "了解公共影像墙、排行榜、档案章与联系信息如何被使用。",
    url: "/privacy",
    images: ["/serkon-share.jpg"],
  },
};

export default function PrivacyPage() {
  return <main className="privacy-page">
    <header className="privacy-nav"><Link href="/">← 返回个人主页</Link><span>SERKON / PUBLIC RULES</span></header>
    <section className="privacy-hero"><small>PLAIN-LANGUAGE PRIVACY NOTE / 2026.07</small><h1>隐私与公共上传规则</h1><p>这不是一页藏在角落里的套话。下面用尽量清楚的方式说明：网站会保存什么、为什么保存、哪些内容会公开，以及站长怎样处理举报、隐私与删除请求。</p></section>
    <section className="privacy-grid">
      <article><span>01</span><h2>公共影像墙</h2><p>你主动上传的照片、公开昵称、分类和说明会展示给所有访客。上传前请确认拥有图片使用权，不要上传他人隐私、联系方式、未经允许的肖像或不适合公开展示的内容。</p><p>登录身份仅用于服务器核验“谁有权删除这张照片”，不会直接作为公开昵称展示。原始文件名不会显示给访客。</p></article>
      <article><span>02</span><h2>互动与排行榜</h2><p>“捕捉灵感”会用随机访客标识、你填写的昵称和历史最高分维护全站榜单；灵感投票和星球只保存选项，不收集自由文本。随机标识不是实名账号。</p><p>个人档案章、主题、灵感收藏和部分成长进度默认保存在当前浏览器，用于恢复本机体验；清除网站数据后会消失。</p></article>
      <article><span>03</span><h2>公共大厅</h2><p>大厅不要求实名。浏览器会获得一个随机设备凭证，用来生成公开访客编号、限制刷屏并识别重复举报；服务器保存的是哈希后的设备与按日网络标识，不在公开页面展示原始 IP。</p><p>“实时在线”只统计最近 2 分钟保持页面活跃的随机设备哈希，不公开在线名单；在线状态记录最多保留 24 小时。昵称和留言会公开给所有访客。发布前必须确认“公开且不能自行编辑或删除”；站长可以根据举报、隐私、侵权和公共规则隐藏、恢复或删除。请不要填写手机号、邮箱、微信、身份证号或他人隐私。</p></article>
      <article><span>04</span><h2>安全与必要限制</h2><p>上传接口会检查登录状态、请求来源、文件类型、真实文件头、大小、频率和个人总量；大厅限制发送频率、重复内容、联系方式和外链；排行榜会核验有效对局。这些限制用于保护公共空间和其他访客。大厅消息写入共享数据库，不因退出、刷新或更换设备而消失，也没有自动到期时间。</p></article>
      <article><span>05</span><h2>联系与约稿</h2><p>当你主动通过邮箱、微信或抖音联系时，你提供的信息只用于回复咨询与沟通需求。约稿的用途、报价、档期、修改和商用授权以双方实际确认内容为准。</p></article>
      <article><span>06</span><h2>删除与纠错</h2><p>登录后的上传者可以删除自己上传的照片；大厅留言不能由发布者直接撤回，但站长可以处理隐私、侵权、不适或违反规则的内容。若公开内容涉及你的权利，请提供页面位置和必要说明。</p><EmailAction variant="privacy" subject="网站内容删除或隐私问题" /></article>
      <article><span>07</span><h2>本地偏好与阅读辅助</h2><p>主题、档案章、游戏进度、阅读缩放、对比度、动画偏好和大厅昵称可能保存在当前浏览器。它们不会因为打开页面而发送给第三方；清除网站数据后会消失或重新生成。</p></article>
      <article><span>08</span><h2>本页更新</h2><p>当网站新增会保存数据的功能，或处理方式发生明显变化时，这一页会同步更新。最近整理日期：2026 年 7 月。</p></article>
    </section>
    <footer><Link href="/life">前往公共影像墙 →</Link><Link href="/lobby">查看公共大厅规则 →</Link><Link href="/">回到个人主页 →</Link></footer>
  </main>;
}
