import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "无障碍与阅读辅助｜Serkon",
  description: "了解 Serkon 个人网站提供的键盘、对比度、动画、缩放和轻量阅读支持。",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return <main className="capability-page">
    <header className="capability-nav"><Link href="/">← 返回个人主页</Link><span>SERKON / ACCESSIBILITY</span><Link href="/lite">纯文字版</Link></header>
    <section className="capability-hero"><small>ACCESS FOR MORE PEOPLE / V1</small><h1>无障碍与<br />阅读辅助</h1><p>目标不是贴一个“无障碍”标签，而是让更多人能真正读、看、点、玩。当前能力会继续通过真实设备和不同使用方式迭代；本页不宣称已经获得 WCAG 认证。</p></section>
    <section className="capability-grid">
      <article><span>01</span><h2>键盘可达</h2><p>主要链接、按钮、表单和弹窗可以通过键盘获得焦点，页面提供“跳到主要内容”入口，并保留清晰的焦点轮廓。</p></article>
      <article><span>02</span><h2>阅读控制</h2><p>右下角“阅读辅助”可选择 100%、115%、130% 页面缩放，开启增强对比、减少动画和链接下划线。选择只保存在当前浏览器。</p></article>
      <article><span>03</span><h2>系统偏好</h2><p>如果设备已经启用“减少动态效果”，网站会主动降低动画；设置不会上传，也不会用于识别你的身份。</p></article>
      <article><span>04</span><h2>轻量入口</h2><p>纯文字版不加载人物大图、作品图、音乐和游戏，适合网络较慢、流量受限，或只想快速理解网站内容的人。</p><Link href="/lite">打开纯文字版 →</Link></article>
      <article><span>05</span><h2>互动说明</h2><p>公共大厅的状态会通过文字播报；游戏仍会持续补充键盘操作。某个互动若暂时不适合你，可以通过文字版读取其目的与结论。</p></article>
      <article><span>06</span><h2>反馈与边界</h2><p>无障碍不是一次性完成。如果你遇到无法聚焦、对比不足、读屏语义不清或操作困难，可以通过联系区告诉站长具体页面与设备。</p></article>
    </section>
    <footer className="capability-footer"><Link href="/privacy">隐私说明</Link><Link href="/zero-cost">0 元运营原则</Link><Link href="/">返回主页 →</Link></footer>
  </main>;
}
