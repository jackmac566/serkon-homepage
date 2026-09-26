import type { Metadata } from "next";
import Link from "next/link";
import LifeGallery from "./LifeGallery";
import "./life.css";

export const metadata: Metadata = {
  title: "生活影像｜Serkon 侯世康",
  description: "Serkon 的个人瞬间、创作过程、视觉作品与公共生活影像记录。",
  alternates: { canonical: "/life" },
  openGraph: { title: "生活影像｜Serkon 侯世康", description: "一本由站长与访客共同留下的线上生活相册。", url: "/life", images: ["/serkon-share.jpg"] },
};

export default function LifePage() {
  return (
    <main className="life-page">
      <header className="life-nav">
        <Link href="/">← 返回个人主页</Link>
        <span>SERKON / LIFE ARCHIVE</span>
      </header>
      <section className="life-hero">
        <small>NOT EVERYTHING NEEDS A CAPTION</small>
        <h1>生活影像</h1>
        <p>把正式介绍之外的个人瞬间、创作过程、视觉作品与访客记录，整理成一份既有证据也有温度的线上档案。</p>
      </section>
      <LifeGallery />
    </main>
  );
}
