"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const chapters = [
  {
    code: "01 / FRAME",
    eyebrow: "FIRST IMPRESSION",
    word: "FRAME",
    title: "先看到，\n后理解。",
    copy: "第一幕先制造冲击：文字、人物和空间不是排成一页，而是像镜头一样同时进入视野。",
    signal: "VISUAL IMPACT / 00:01",
  },
  {
    code: "02 / ROUTE",
    eyebrow: "CONNECT THE CLUES",
    word: "ROUTE",
    title: "兴趣不是清单，\n是一条路线。",
    copy: "AI、影像、产品视觉、音乐与网页彼此连接；滚动不是翻页，而是在 Serkon 的线索之间移动。",
    signal: "FIVE CLUES / ONE DIRECTION",
  },
  {
    code: "03 / VERIFY",
    eyebrow: "MOTION WITH A REASON",
    word: "VERIFY",
    title: "真正好看的，\n不只是效果。",
    copy: "每一次放大、遮罩与转场都必须解释内容：强调什么、隐藏什么，以及下一步为什么出现。",
    signal: "FORM FOLLOWS MEANING",
  },
  {
    code: "04 / REMIX",
    eyebrow: "THE PAGE RESPONDS",
    word: "REMIX",
    title: "页面应该，\n回应你的动作。",
    copy: "移动指针、使用键盘或触碰卡片，画面会重新编排。你不是旁观者，而是这一刻的共同导演。",
    signal: "POINTER / FOCUS / TOUCH",
  },
  {
    code: "05 / NEXT",
    eyebrow: "ALWAYS IN PROGRESS",
    word: "NEXT",
    title: "第一版，\n从来不是终点。",
    copy: "这不是一个模板的复刻，而是一份持续生长的个人动态作品。下一次更新，会从这一次继续向前。",
    signal: "KEEP MOVING",
  },
] as const;

const visualClues = [
  { label: "AI / 想象", src: "/work-color-system.webp", tone: "blue" },
  { label: "视觉 / 秩序", src: "/work-packaging-system.webp", tone: "amber" },
  { label: "工程 / 真实", src: "/work-engineering-system.webp", tone: "red" },
  { label: "生活 / 感受", src: "/serkon-moment-wave.jpg", tone: "violet" },
] as const;

const thoughtGroups = [
  [
    { index: 1, title: "我不想只做一张漂亮的电子名片" },
    { index: 11, title: "先做出第一版，比等一个完美答案更重要" },
    { index: 17, title: "比别人早想到，还要比别人早做出" },
    { index: 20, title: "网站没有最终版，我也没有" },
  ],
  [
    { index: 5, title: "AI 最有意思的地方，不是替我完成" },
    { index: 7, title: "有些友谊，就是从一句“开一把”开始" },
    { index: 8, title: "照片替我们记住了当时没有注意的东西" },
    { index: 15, title: "好产品应该允许人先玩，再慢慢理解" },
  ],
  [
    { index: 9, title: "一个网站为什么要反复修改" },
    { index: 12, title: "我追求的完美，不是永远不出错" },
    { index: 13, title: "零成本不是廉价，而是一种设计限制" },
    { index: 18, title: "失败不是暂停键，它只是下一次判断的线索" },
  ],
  [
    { index: 2, title: "十九岁，不急着把自己定义清楚" },
    { index: 4, title: "凌晨两点以后，很多想法都会变得认真" },
    { index: 6, title: "北京傍晚的风，总是比计划先到" },
    { index: 14, title: "我给网站加上大厅，是因为不想让它太孤独" },
  ],
  [
    { index: 3, title: "我们舍不得的，也许不是那个旧账号" },
    { index: 10, title: "希望未来的我，还愿意推翻今天的答案" },
    { index: 16, title: "愿意分享，不代表什么都应该公开" },
    { index: 19, title: "大众想到的问题要解决，没想到的也要预留位置" },
  ],
] as const;

type FieldPoint = { x: number; y: number; speed: number; size: number; phase: number };

export default function CosmosExperience({ edition }: { edition: number }) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [active, setActive] = useState(0);
  const [selectedClue, setSelectedClue] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sections = [...root.querySelectorAll<HTMLElement>("[data-motion-chapter]")];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(Number((visible.target as HTMLElement).dataset.motionChapter ?? 0));
    }, { threshold: [0.28, 0.5, 0.72] });
    sections.forEach((section) => observer.observe(section));

    let scheduled = 0;
    const syncScroll = () => {
      scheduled = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const overall = Math.min(1, Math.max(0, window.scrollY / max));
      const current = sections[active];
      const rect = current?.getBoundingClientRect();
      const local = rect
        ? Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)))
        : 0;
      root.style.setProperty("--motion-scroll", overall.toFixed(4));
      root.style.setProperty("--motion-local", local.toFixed(4));
    };
    const onScroll = () => {
      if (!scheduled) scheduled = window.requestAnimationFrame(syncScroll);
    };
    syncScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(scheduled);
      window.removeEventListener("scroll", onScroll);
    };
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !root || !context) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches || document.documentElement.dataset.a11yMotion === "reduce";
    let width = 0;
    let height = 0;
    let time = 0;
    let animation = 0;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let points: FieldPoint[] = [];
    const accents = [[90, 133, 255], [218, 255, 86], [255, 92, 82], [177, 100, 255], [245, 238, 219]];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(96, Math.max(38, Math.floor((width * height) / 17000)));
      points = Array.from({ length: count }, (_, index) => ({
        x: ((index * 41.73) % 101) / 100,
        y: ((index * 67.21 + 13) % 101) / 100,
        speed: 0.18 + ((index * 17) % 29) / 40,
        size: 0.6 + ((index * 11) % 13) / 8,
        phase: ((index * 23) % 100) / 100,
      }));
    };

    const onPointer = (event: PointerEvent) => {
      pointerX = event.clientX / Math.max(width, 1);
      pointerY = event.clientY / Math.max(height, 1);
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);
      root.style.setProperty("--pointer-nx", (pointerX - 0.5).toFixed(3));
      root.style.setProperty("--pointer-ny", (pointerY - 0.5).toFixed(3));
    };

    const draw = () => {
      if (!reduced) time += 0.006;
      context.clearRect(0, 0, width, height);
      const accent = accents[active];
      const wash = context.createRadialGradient(pointerX * width, pointerY * height, 0, pointerX * width, pointerY * height, Math.max(width, height) * 0.68);
      wash.addColorStop(0, `rgba(${accent.join(",")},.16)`);
      wash.addColorStop(0.42, `rgba(${accent.join(",")},.035)`);
      wash.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);

      context.save();
      context.translate((pointerX - 0.5) * 22, (pointerY - 0.5) * 18);
      context.strokeStyle = `rgba(${accent.join(",")},.11)`;
      context.lineWidth = 0.8;
      for (let line = -4; line < 13; line += 1) {
        const offset = ((time * 90 + line * 110) % (width + 260)) - 130;
        context.beginPath();
        context.moveTo(offset, -40);
        context.lineTo(offset - height * 0.42, height + 40);
        context.stroke();
      }
      for (const point of points) {
        const x = ((point.x * width + time * 120 * point.speed) % (width + 20)) - 10;
        const y = point.y * height + Math.sin(time * 5 + point.phase * 8) * 10;
        context.beginPath();
        context.arc(x, y, point.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(${accent.join(",")},${0.18 + point.phase * 0.4})`;
        context.fill();
      }
      context.restore();
      if (!reduced) animation = window.requestAnimationFrame(draw);
    };

    const syncMotion = () => {
      const next = media.matches || document.documentElement.dataset.a11yMotion === "reduce";
      if (next === reduced) return;
      reduced = next;
      window.cancelAnimationFrame(animation);
      draw();
    };
    const preferenceObserver = new MutationObserver(syncMotion);
    preferenceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-a11y-motion"] });
    media.addEventListener("change", syncMotion);
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    draw();
    return () => {
      window.cancelAnimationFrame(animation);
      preferenceObserver.disconnect();
      media.removeEventListener("change", syncMotion);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [active]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const next = Math.min(chapters.length - 1, Math.max(0, active + (event.key === "ArrowDown" ? 1 : -1)));
      rootRef.current?.querySelector<HTMLElement>(`[data-motion-chapter="${next}"]`)?.scrollIntoView({
        behavior: document.documentElement.dataset.a11yMotion === "reduce" ? "auto" : "smooth",
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  async function toggleSound() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); setSoundOn(true); } catch { setSoundOn(false); }
    } else {
      audio.pause();
      setSoundOn(false);
    }
  }

  return (
    <main
      className="motion-lab"
      ref={rootRef}
      data-motion-active={active}
      data-motion-tone={visualClues[selectedClue].tone}
    >
      <canvas ref={canvasRef} className="motion-field" aria-hidden="true" />
      <div className="motion-grain" aria-hidden="true" />
      <a className="skip-link" href="#motion-story">跳到动态叙事</a>

      <header className="motion-header">
        <Link href="/" className="motion-back">← 返回个人主页</Link>
        <div className="motion-wordmark"><b>SERKON</b><span>MOTION LAB / COSMOS</span></div>
        <button type="button" className="motion-sound" onClick={toggleSound} aria-pressed={soundOn}>
          <span aria-hidden="true">{soundOn ? "◉" : "○"}</span>{soundOn ? "声音已开启" : "播放原创音乐"}
        </button>
        <audio ref={audioRef} src="/creation-fk.mp3" loop preload="none" onEnded={() => setSoundOn(false)} />
      </header>

      <aside className="motion-progress" aria-label="动态章节">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.code}
            type="button"
            className={index === active ? "active" : ""}
            aria-label={`前往第 ${index + 1} 幕：${chapter.code}`}
            aria-current={index === active ? "step" : undefined}
            onClick={() => rootRef.current?.querySelector<HTMLElement>(`[data-motion-chapter="${index}"]`)?.scrollIntoView({ behavior: "smooth" })}
          ><span>{String(index + 1).padStart(2, "0")}</span><i /></button>
        ))}
      </aside>

      <div className="motion-stage" aria-hidden="true">
        {chapters.map((chapter, index) => <div className="motion-kinetic-word" data-word-index={index} key={chapter.word}>{chapter.word}</div>)}
        <div className="motion-portrait">
          <Image src="/serkon-hero.jpg" alt="" fill priority sizes="(max-width: 760px) 68vw, 34vw" />
          <span className="motion-scan" />
        </div>
        <div className="motion-stack">
          {visualClues.map((clue) => <figure key={clue.src}>
            <Image src={clue.src} alt="" fill sizes="24vw" unoptimized /><figcaption>{clue.label}</figcaption>
          </figure>)}
        </div>
        <div className="motion-verifier"><span>INPUT</span><i /><b>MEANING</b><i /><strong>OUTPUT</strong></div>
        <div className="motion-final-mark"><span>S</span><i /><b>{edition}</b></div>
      </div>

      <div className="motion-story" id="motion-story">
        {chapters.map((chapter, index) => (
          <section
            className={`motion-chapter ${index === active ? "active" : ""}`}
            data-motion-chapter={index}
            data-side={index % 2 === 0 ? "left" : "right"}
            key={chapter.code}
            aria-labelledby={`motion-title-${index}`}
          >
            <div className="motion-copy">
              <div className="motion-meta"><span>{chapter.code}</span><i /><small>{chapter.eyebrow}</small></div>
              {index === 0
                ? <h1 id={`motion-title-${index}`}>{chapter.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
                : <h2 id={`motion-title-${index}`}>{chapter.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h2>}
              <p>{chapter.copy}</p>
              <small className="motion-signal">{index === chapters.length - 1 ? `EDITION ${edition} / ${chapter.signal}` : chapter.signal}</small>
              <div className="motion-thoughts" aria-label={`第 ${index + 1} 幕关联站长随笔`}>
                <small>THOUGHT SIGNALS / 20 NOTES</small>
                {thoughtGroups[index].map((thought) => <Link key={thought.index} href={`/notes#note-${String(thought.index).padStart(2, "0")}`}>
                  <span>{String(thought.index).padStart(2, "0")}</span><b>{thought.title}</b><i aria-hidden="true">↗</i>
                </Link>)}
              </div>
              {index === 3 && <div className="motion-clue-picker" aria-label="选择一种个人视觉线索">
                {visualClues.map((clue, clueIndex) => <button
                  key={clue.label}
                  type="button"
                  className={clueIndex === selectedClue ? "active" : ""}
                  aria-pressed={clueIndex === selectedClue}
                  onPointerEnter={() => setSelectedClue(clueIndex)}
                  onFocus={() => setSelectedClue(clueIndex)}
                  onClick={() => setSelectedClue(clueIndex)}
                ><span>{String(clueIndex + 1).padStart(2, "0")}</span>{clue.label}</button>)}
              </div>}
              {index === chapters.length - 1 && <div className="motion-final-actions"><Link href="/notes" className="motion-notes-link">安静阅读全部 20 条随笔 <span aria-hidden="true">↗</span></Link><Link href="/" className="motion-return">带着新的尺度返回主页 <span aria-hidden="true">↗</span></Link></div>}
            </div>
          </section>
        ))}
      </div>

      <div className="motion-hint" aria-hidden="true"><span>滚动推进镜头</span><i /></div>
      <p className="sr-only" aria-live="polite">{`当前第 ${active + 1} 幕，共 ${chapters.length} 幕。`}</p>
      <noscript><p className="motion-noscript">动态实验室包含五幕文字与作品线索。开启 JavaScript 可观看本地滚动、指针与画面重组效果。</p></noscript>
    </main>
  );
}
