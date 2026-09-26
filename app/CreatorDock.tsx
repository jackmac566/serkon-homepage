"use client";

import { useEffect, useState } from "react";
import { awardArchiveStamp } from "./archive-client";

type Tool = "create" | "match" | "visit" | "progress";
type Template = "怀旧文案" | "诗词对仗" | "短视频口播" | "网站与代码";
type QuizQuestion = { q: string; options: string[]; answer: number };

const templates: { name: Template; desc: string; placeholder: string }[] = [
  { name: "怀旧文案", desc: "旧时光、青春与回忆氛围", placeholder: "例如：高中最后一个夏天" },
  { name: "诗词对仗", desc: "生成有画面感的对仗句式", placeholder: "例如：美女、晚霞、江水" },
  { name: "短视频口播", desc: "口播开头、正文与朋友圈", placeholder: "例如：第一次用 AI 做个人网站" },
  { name: "网站与代码", desc: "搭建需求与排错提示模板", placeholder: "例如：手机端导航错位" },
];

const questions: QuizQuestion[] = [
  { q: "站长最喜欢研究的新东西是？", options: ["球鞋收藏", "AI 工具", "咖啡拉花"], answer: 1 },
  { q: "站长放松时更常玩的游戏是？", options: ["赛车游戏", "音游", "王者荣耀"], answer: 2 },
  { q: "站长公开写下的城市是？", options: ["北京", "上海", "成都"], answer: 0 },
  { q: "这个网站最想长期记录什么？", options: ["纯技术文档", "消费账单", "作品与真实日常"], answer: 2 },
  { q: "站长目前处于哪个阶段？", options: ["高中", "大一", "毕业工作"], answer: 1 },
  { q: "站长更喜欢哪种网站感觉？", options: ["杂志感里带一点科技", "纯商务蓝", "极简表格"], answer: 0 },
  { q: "站长还喜欢哪种线下娱乐？", options: ["高尔夫", "滑雪", "扑克牌"], answer: 2 },
  { q: "网站里播放的原创歌曲是？", options: ["旧日来信", "创世纪", "朝阳晚风"], answer: 1 },
  { q: "站长公开的抖音号是？", options: ["SKGing1973", "SerkonDaily", "AIshikang"], answer: 0 },
  { q: "站长更愿意如何描述现在的自己？", options: ["停止探索", "只专注游戏", "持续成长中"], answer: 2 },
];

function shuffledQuestions() {
  return questions.map((question) => {
    const correct = question.options[question.answer];
    const options = [...question.options];
    for (let index = options.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
    }
    return { ...question, options, answer: options.indexOf(correct) };
  });
}

function makeContent(template: Template, topic: string) {
  const subject = topic.trim() || "那段没有说完的青春";
  if (template === "怀旧文案") return `后来再想起「${subject}」，记住的已经不是某一天发生了什么，而是风吹过走廊时的声音，是放学后迟迟不肯散去的人群。我们以为那只是普通的一天，很多年以后才明白，那就是青春本身。`;
  if (template === "诗词对仗") return `${subject}共晚风一色，旧梦与星河同眠。\n眉间藏三分春意，眼底落万里人间。`;
  if (template === "短视频口播") return `开头：你有没有想过，「${subject}」也能做得这么有意思？\n正文：我没有照着现成答案走，而是把它拆成最真实的体验，一点点做成现在看到的样子。\n结尾：如果你也有类似想法，评论区告诉我，下一个就来试试你的。\n朋友圈：把想法真正做出来，比只停留在脑海里酷多了。`;
  return `请帮我处理这个网站/代码任务：${subject}。\n先复现问题并判断根因，再给出最小可行修改；保留现有视觉与功能，不改无关代码。完成后检查电脑和手机布局，并说明修改结果与仍需注意的边界。`;
}

function downloadTextCard(title: string, main: string, lines: string[], filename: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, "#111929"); gradient.addColorStop(1, "#2454ff");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = "#ffd447"; ctx.fillRect(74, 74, 130, 12);
  ctx.fillStyle = "#ffffff"; ctx.font = "36px sans-serif"; ctx.fillText(title, 74, 160);
  ctx.font = "bold 100px serif"; ctx.fillText(main, 74, 330);
  ctx.font = "34px sans-serif";
  lines.forEach((line, index) => ctx.fillText(line, 74, 500 + index * 70));
  ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = "28px sans-serif";
  ctx.fillText("由 Serkon 侯世康的个人 AI 站点生成", 74, 1260);
  const link = document.createElement("a"); link.download = filename; link.href = canvas.toDataURL("image/png"); link.click();
}

function downloadVisitLetter(nickname: string, lines: string[]) {
  let serial = 1;
  try {
    serial = Number(window.localStorage.getItem("serkon_visit_serial") || "0") + 1;
    window.localStorage.setItem("serkon_visit_serial", String(serial));
  } catch {
    // 无本地存储时从当前会话的第一张开始编号。
  }
  const serialLabel = `NO. ${String(serial).padStart(4, "0")}`;
  const completedCount = lines.filter((line) => line.startsWith("✓")).length;
  const seed = [...nickname].reduce((total, char) => total + char.charCodeAt(0), 0) + serial * 17 + completedCount * 31;
  const openings = ["今天的风，把你带到了这里。", "在许多个普通时刻里，你点开了这一页。", "谢谢你愿意在这里慢一点。", "这封信写给此刻路过的你。", "屏幕亮起的时候，我们短暂相遇。", "今天的网站，因为你多了一位读者。", "也许是好奇，让你走到了这里。", "这一刻没有预告，却值得被留住。", "欢迎你，远道而来的屏幕旅人。", "很高兴，这页文字最终被你看见。"];
  const middles = ["你的停留让普通页面有了人的温度。", "有些相遇很短，却仍然会留下回声。", "每一次点击，都像给旧信笺落下一点墨。", "我们隔着网络，却共享了同一小段时间。", "生活总往前走，好在瞬间还能被认真收藏。", "这里没有宏大故事，只有正在发生的生活。", "愿这次浏览成为今天温柔的小插曲。", "你看过的文字，也悄悄记住了你的到来。", "网页不会说话，但它知道有人认真读过。", "这座小站因为被看见，才真正开始存在。"];
  const endings = ["愿你回去以后，也遇见一点小小的好事。", "愿旧时光有回声，新故事正在发生。", "愿你的下一段路，有晚风也有灯火。", "愿平凡的日子，也经得起以后怀念。", "愿你永远保留重新出发的勇气。", "愿今天没有说完的话，来日都有答案。", "愿生活偶尔慢下来，等一等你的心。", "愿每一份认真，都在未来收到回信。", "愿我们下一次相遇时，都有新的故事。", "愿你收藏的不是卡片，而是此刻的心情。"];
  const letter = [openings[seed % 10], middles[(seed * 3) % 10], middles[(seed * 7 + 2) % 10], endings[(seed * 9 + 1) % 10]];
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1440;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e7dfd2"; ctx.fillRect(0, 0, 1080, 1440);
  const wash = ctx.createRadialGradient(780, 220, 0, 780, 220, 820);
  wash.addColorStop(0, "rgba(159,132,103,.22)"); wash.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = wash; ctx.fillRect(0, 0, 1080, 1440);
  for (let index = 0; index < 4200; index += 1) {
    const shade = 90 + Math.floor(Math.random() * 80);
    ctx.fillStyle = `rgba(${shade},${shade - 10},${shade - 20},${Math.random() * 0.045})`;
    ctx.fillRect(Math.random() * 1080, Math.random() * 1440, 1.5, 1.5);
  }
  ctx.strokeStyle = "rgba(112,91,69,.38)"; ctx.lineWidth = 2; ctx.strokeRect(54, 54, 972, 1332);
  ctx.strokeStyle = "rgba(139,30,45,.55)"; ctx.beginPath(); ctx.moveTo(90, 210); ctx.lineTo(990, 210); ctx.stroke();
  ctx.fillStyle = "#6d5f50"; ctx.font = "28px Georgia"; ctx.fillText("SERKON · A LETTER FROM THE SITE", 90, 128);
  ctx.fillStyle = "#8b1e2d"; ctx.font = "20px sans-serif"; ctx.fillText(`${serialLabel} / BEIJING / LOCAL EDITION`, 90, 176);
  ctx.fillStyle = "#302a25"; ctx.font = "56px KaiTi, STKaiti, serif"; ctx.fillText(`给 ${nickname}：`, 100, 330);
  ctx.font = "42px KaiTi, STKaiti, serif";
  letter.forEach((line, index) => ctx.fillText(line, 110, 440 + index * 78));
  ctx.font = "26px sans-serif";
  lines.forEach((line, index) => {
    const done = line.startsWith("✓"); const y = 816 + index * 52;
    ctx.strokeStyle = done ? "#8b1e2d" : "#85796c"; ctx.lineWidth = 3; ctx.strokeRect(112, y - 23, 26, 26);
    if (done) { ctx.beginPath(); ctx.moveTo(117, y - 10); ctx.lineTo(125, y - 2); ctx.lineTo(138, y - 20); ctx.stroke(); }
    ctx.fillStyle = done ? "#554b42" : "#85796c"; ctx.fillText(line.slice(2), 158, y);
  });
  ctx.fillStyle = "#8b1e2d"; ctx.font = "40px KaiTi, serif"; ctx.fillText(endings[(seed + 4) % 10], 110, 1100);
  ctx.fillStyle = "#4f463e"; ctx.font = "26px Georgia"; ctx.fillText(new Date().toLocaleString("zh-CN"), 110, 1190);
  ctx.save(); ctx.translate(846, 1184); ctx.rotate(-0.08);
  ctx.strokeStyle = "rgba(139,30,45,.84)"; ctx.fillStyle = "rgba(139,30,45,.88)"; ctx.lineWidth = 9;
  ctx.strokeRect(-88, -88, 176, 176); ctx.lineWidth = 3; ctx.strokeRect(-73, -73, 146, 146);
  ctx.textAlign = "center"; ctx.font = "bold 48px STKaiti, KaiTi, serif";
  ctx.fillText("侯　世", 0, -13); ctx.fillText("康　印", 0, 47);
  ctx.globalAlpha = .24; for (let index = 0; index < 65; index += 1) ctx.clearRect(-80 + Math.random() * 160, -80 + Math.random() * 160, 2 + Math.random() * 5, 2 + Math.random() * 4);
  ctx.globalAlpha = 1; ctx.font = "17px Georgia"; ctx.fillText("SERKON · PERSONAL SEAL", 0, 112); ctx.restore();
  ctx.fillStyle = "rgba(75,65,55,.72)"; ctx.textAlign = "left"; ctx.font = "23px sans-serif";
  ctx.fillText("由 Serkon 侯世康的个人 AI 站点生成 · 此刻仅此一张", 90, 1350);
  const link = document.createElement("a"); link.download = "serkon-visit-letter.png"; link.href = canvas.toDataURL("image/png"); link.click();
}

export default function CreatorDock() {
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<Tool>("create");
  const [template, setTemplate] = useState<Template>("怀旧文案");
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(questions);
  const [quizReady, setQuizReady] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [peerAnswers, setPeerAnswers] = useState<number[] | null>(null);
  const [shareStatus, setShareStatus] = useState("");
  const [nickname, setNickname] = useState("");
  const [visitedWorks, setVisitedWorks] = useState(false);
  const [visitedPlay, setVisitedPlay] = useState(false);
  const [usedCreator, setUsedCreator] = useState(false);
  const [progress, setProgress] = useState({ generations: 0, match: false, game: false });

  useEffect(() => {
    const onScroll = () => {
      const works = document.getElementById("works"); const play = document.getElementById("play");
      if (works && works.getBoundingClientRect().top < window.innerHeight * 0.8) setVisitedWorks(true);
      if (play && play.getBoundingClientRect().top < window.innerHeight * 0.8) setVisitedPlay(true);
    };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#ai-station") {
        const params = new URLSearchParams(window.location.search);
        const sharedMatch = params.get("match");
        if (sharedMatch && /^[0-2]{10}$/.test(sharedMatch)) {
          setPeerAnswers(sharedMatch.split("").map(Number));
          setQuizQuestions(shuffledQuestions());
          setAnswers([]);
          setQuizReady(true);
          setTool("match");
          setOpen(true);
          return;
        }
        const requestedTopic = params.get("ai");
        if (requestedTopic) { setTopic(requestedTopic); setTemplate("怀旧文案"); }
        setTool("create"); setOpen(true);
      }
    };
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("serkon_progress");
        if (saved) setProgress(JSON.parse(saved));
      } catch {
        // 浏览器禁用本地存储时，仍允许访客正常使用当前会话。
      }
      openFromHash();
    }, 0);
    window.addEventListener("hashchange", openFromHash);
    return () => { window.clearTimeout(timer); window.removeEventListener("hashchange", openFromHash); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const saveProgress = (next: { generations: number; match: boolean; game: boolean }) => {
    setProgress(next);
    try {
      window.localStorage.setItem("serkon_progress", JSON.stringify(next));
    } catch {
      // 私密浏览等环境可能禁用存储；不影响当前页面功能。
    }
  };

  const generate = () => {
    setOutput(`${makeContent(template, topic)}\n\n由 Serkon 侯世康的个人 AI 站点生成`);
    setUsedCreator(true); setCopied(false);
    saveProgress({ ...progress, generations: progress.generations + 1 });
    awardArchiveStamp("ai");
  };

  const score = answers.reduce((total, answer, index) => total + (answer === quizQuestions[index]?.answer ? 1 : 0), 0);
  const answeredCount = quizQuestions.filter((_, index) => answers[index] !== undefined).length;
  const percent = Math.round((score / quizQuestions.length) * 100);
  const matchText = percent >= 75 ? "你和站长很可能在 AI、游戏和氛围感表达上同频。" : percent >= 50 ? "你们已经找到几个共同频道，再逛一会儿会更懂彼此。" : "目前是神秘网友关系，网站里还藏着不少认识站长的线索。";
  const canonicalAnswers = answers.map((answer, index) => questions[index].options.indexOf(quizQuestions[index]?.options[answer]));
  const peerPercent = peerAnswers && answeredCount === questions.length
    ? Math.round(canonicalAnswers.filter((answer, index) => answer === peerAnswers[index]).length / questions.length * 100)
    : null;

  const shareMatch = async () => {
    if (canonicalAnswers.some((answer) => answer < 0)) return;
    const url = new URL(window.location.href);
    url.search = `?match=${canonicalAnswers.join("")}`;
    url.hash = "ai-station";
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareStatus("双人对照链接已复制，发给朋友即可作答 ✓");
    } catch {
      setShareStatus(`复制失败，请手动复制：${url.toString()}`);
    }
  };

  const visitLines = [
    visitedWorks ? "✓ 看过 Serkon 的作品案例" : "○ 还没有浏览作品案例",
    visitedPlay ? "✓ 到过互动实验室" : "○ 还没有进入互动实验室",
    usedCreator ? "✓ 使用过创作工坊" : "○ 还没有使用创作工坊",
    answeredCount === questions.length ? "✓ 完成站长匹配测试" : "○ 还没有完成匹配测试",
  ];

  const openTool = (nextTool: Tool) => {
    if (nextTool === "match" && !quizReady) {
      setQuizQuestions(shuffledQuestions());
      setAnswers([]);
      setQuizReady(true);
    }
    setTool(nextTool);
    setOpen(true);
  };

  useEffect(() => {
    const refresh = () => {
      let played = false;
      try { played = window.localStorage.getItem("serkon_game_played") === "true"; } catch { /* 保持当前会话状态 */ }
      if (played && !progress.game) saveProgress({ ...progress, game: true });
    };
    refresh(); window.addEventListener("serkon-progress", refresh);
    return () => window.removeEventListener("serkon-progress", refresh);
  }, [progress]);

  return (
    <>
      <nav className="creator-rail" aria-label="个人 AI 站点快捷工具">
        <button type="button" className={open && tool === "create" ? "active" : ""} aria-pressed={open && tool === "create"} onClick={() => openTool("create")}><span>AI</span><small>创作</small></button>
        <button type="button" className={open && tool === "match" ? "active" : ""} aria-pressed={open && tool === "match"} onClick={() => openTool("match")}><span>%</span><small>匹配</small></button>
        <button type="button" className={open && tool === "visit" ? "active" : ""} aria-pressed={open && tool === "visit"} onClick={() => openTool("visit")}><span>✦</span><small>纪念卡</small></button>
        <button type="button" className={open && tool === "progress" ? "active" : ""} aria-pressed={open && tool === "progress"} onClick={() => openTool("progress")}><span>↟</span><small>成长</small></button>
      </nav>

      <div className={`creator-dock ${open ? "open" : ""}`} aria-hidden={!open} inert={!open}>
        <header><div><small>SERKON PERSONAL AI STATION</small><strong>{tool === "create" ? "快捷创作工坊" : tool === "match" ? "站长匹配测试" : tool === "visit" ? "到访纪念信笺" : "访客成长手册"}</strong></div><button type="button" onClick={() => setOpen(false)} aria-label="关闭工具栏">×</button></header>

        {tool === "create" && <div className="dock-content">
          <p className="dock-notice">当前使用站内模板引擎，输入内容不会发送给外部模型。适合快速起草，重要内容请自行核对。</p>
          <a className="miaobi-entry" href="https://miaobi-appl-serkon.pages.dev/" target="_blank" rel="noopener noreferrer" data-signal-action>
            <small>MIAOBI AI / FULL WORKSPACE</small>
            <strong>进入妙笔 AI 全能文案助手</strong>
            <span aria-hidden="true">↗</span>
          </a>
          <div className="template-list">{templates.map((item) => <button type="button" key={item.name} className={template === item.name ? "active" : ""} onClick={() => { setTemplate(item.name); setOutput(""); }}><strong>{item.name}</strong><small>{item.desc}</small></button>)}</div>
          <label className="topic-input">输入主题<textarea value={topic} onChange={(event) => setTopic(event.target.value)} placeholder={templates.find((item) => item.name === template)!.placeholder} /></label>
          <button className="dock-primary" type="button" onClick={generate}>生成内容</button>
          {output && <div className="creator-output"><pre>{output}</pre><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(output); setCopied(true); } catch { setCopied(false); } }}>{copied ? "已复制 ✓" : "复制全部"}</button></div>}
        </div>}

        {tool === "match" && <div className="dock-content">
          <div className="match-progress"><span style={{ width: `${answeredCount / questions.length * 100}%` }} /><small>{answeredCount} / {questions.length}</small></div>
          {quizQuestions.map((question, index) => <fieldset key={question.q}><legend>{index + 1}. {question.q}</legend>{question.options.map((option, optionIndex) => <button type="button" key={option} className={answers[index] === optionIndex ? "selected" : ""} onClick={() => setAnswers((current) => { const next = [...current]; next[index] = optionIndex; if (quizQuestions.every((_, questionIndex) => next[questionIndex] !== undefined) && !progress.match) saveProgress({ ...progress, match: true }); return next; })}>{option}</button>)}</fieldset>)}
          {answeredCount === quizQuestions.length && <div className="match-result"><small>{peerPercent === null ? "与站长的契合度报告" : "双人同频报告"}</small><strong>{peerPercent === null ? percent : peerPercent}%</strong><p>{peerPercent === null ? matchText : peerPercent >= 70 ? "你们的选择高度同频，适合一起完成一件有点抽象的新作品。" : peerPercent >= 40 ? "你们有共同频道，也保留了各自不同的观察角度。" : "答案差异很大，反而可能碰撞出意想不到的点子。"}</p><div className="match-actions"><button type="button" onClick={() => downloadTextCard("SERKON MATCH REPORT", `${peerPercent === null ? percent : peerPercent}%`, [peerPercent === null ? matchText : "来自双人同频测试", "完成 10 道站长趣味题"], "serkon-match.png")}>下载测评卡</button><button type="button" onClick={() => void shareMatch()}>生成双人对照链接</button></div>{shareStatus && <p className="match-share-status" role="status">{shareStatus}</p>}</div>}
        </div>}

        {tool === "visit" && <div className="dock-content visit-maker">
          <p>输入昵称，网站会根据本次浏览行为生成一张专属纪念卡。标头会记录这是当前浏览器生成的第几张，以 NO. 0001 的形式呈现；它不是全站访客总数。</p>
          <label>你的昵称<input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="例如：一位路过的朋友" /></label>
          <ul>{visitLines.map((line) => <li key={line}>{line}</li>)}</ul>
          <button className="dock-primary" type="button" disabled={!nickname.trim()} onClick={() => downloadVisitLetter(nickname.trim(), visitLines)}>生成并下载怀旧信笺</button>
        </div>}

        {tool === "progress" && <div className="dock-content progress-book">
          <div className="progress-summary"><small>本地成长等级</small><strong>LV.{Math.min(4, (progress.generations > 0 ? 1 : 0) + (progress.generations >= 3 ? 1 : 0) + (progress.match ? 1 : 0) + (progress.game ? 1 : 0))}</strong><p>进度仅保存在当前浏览器，无需登录。换设备后不会自动同步。</p></div>
          <div className="quest-list">
            <article className={progress.generations > 0 ? "done" : ""}><span>{progress.generations > 0 ? "✓" : "01"}</span><div><strong>完成第一次创作</strong><small>获得：创作初体验徽章</small></div></article>
            <article className={progress.generations >= 3 ? "done" : ""}><span>{progress.generations >= 3 ? "✓" : "02"}</span><div><strong>累计生成 3 篇文案</strong><small>获得：长文本创作徽章</small></div></article>
            <article className={progress.match ? "done" : ""}><span>{progress.match ? "✓" : "03"}</span><div><strong>完成 10 道站长匹配题</strong><small>获得：同频访客徽章</small></div></article>
            <article className={progress.game ? "done" : ""}><span>{progress.game ? "✓" : "04"}</span><div><strong>完成一局捕捉灵感</strong><small>获得：灵感捕手徽章</small></div></article>
          </div>
          <button className="archive-jump" type="button" onClick={() => { setOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>回到顶部查看个人档案局 →</button>
          <a className="notes-link" href="/notes">阅读站长随笔 →</a>
        </div>}
      </div>
      {open && <button className="dock-backdrop" type="button" aria-label="关闭工具栏" onClick={() => setOpen(false)} />}
    </>
  );
}
