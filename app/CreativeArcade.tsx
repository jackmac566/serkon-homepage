"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { awardArchiveStamp } from "./archive-client";
import Image from "next/image";

type ArcadeTab = "rhythm" | "photo" | "branch" | "community" | "commission";
type RhythmPhase = "idle" | "playing" | "done";

const rhythmBeats = 12;
const rhythmBeatMs = 640;

const photoCases = [
  {
    src: "/serkon-moment-call.jpg",
    crop: "photo-clue-call",
    question: "这张照片里，Serkon 正在做什么手势？",
    options: ["比心", "打电话", "举杯"],
    answer: 1,
    reveal: "是“打电话”。这组照片来自个人介绍视频里更放松的一刻。",
  },
  {
    src: "/serkon-moment-wave.jpg",
    crop: "photo-clue-wave",
    question: "放大后的画面，最接近哪一种瞬间？",
    options: ["向镜头挥手", "看向窗外", "低头读信"],
    answer: 0,
    reveal: "是向镜头挥手。正式之外的轻松表情，也是个人档案的一部分。",
  },
  {
    src: "/serkon-hero.jpg",
    crop: "photo-clue-suit",
    question: "首屏人物照里最明确的服装线索是？",
    options: ["灰色西装", "蓝色球衣", "黑色风衣"],
    answer: 0,
    reveal: "灰色西装是首屏的视觉锚点，克制的灰与暗红档案线形成对比。",
  },
];

const branchQuestions = [
  { q: "凌晨突然有一个好点子，你会？", options: [{ label: "立刻做出第一版", value: 0 }, { label: "先记下来，明天整理", value: 1 }, { label: "发给朋友一起脑暴", value: 2 }] },
  { q: "一张旧照片最打动你的是什么？", options: [{ label: "画面构图", value: 0 }, { label: "当时的故事", value: 1 }, { label: "照片里的人", value: 2 }] },
  { q: "来到一个陌生网站，你最先想点哪里？", options: [{ label: "能玩的按钮", value: 0 }, { label: "作者的作品", value: 1 }, { label: "隐藏的彩蛋", value: 2 }] },
];

const branchResults = [
  { title: "行动派造梦者", text: "你喜欢先把模糊想法做成能看见的东西，再在真实反馈里继续修改。" },
  { title: "情绪档案员", text: "你会记住作品背后的时间、语气和人。对你来说，内容先要有温度。" },
  { title: "同频连接者", text: "你更在意共同完成一件事的过程，灵感在交流里会变得更具体。" },
  { title: "秘密路线探索者", text: "你不会只走明面上的导航。越是藏得深的细节，越能激起你的好奇心。" },
];

const voteOptions = [
  { key: "qq-archive", label: "把旧 QQ 做成可翻阅的数字遗址" },
  { key: "music-game", label: "让一首原创歌变成网页节奏游戏" },
  { key: "city-map", label: "把日常照片拼成城市情绪地图" },
];

const planetMoods = [
  { key: "spark", label: "灵感", mark: "✦" },
  { key: "memory", label: "回忆", mark: "◌" },
  { key: "courage", label: "勇气", mark: "▲" },
  { key: "calm", label: "松弛", mark: "~" },
];

const tabInstructions: Record<ArcadeTab, string> = {
  rhythm: "点击开始后，跟着音乐和收拢的圆环敲 12 下；越接近节拍，得分越高。",
  photo: "观察放大的照片局部，连续回答 3 个问题；答案会揭开照片背后的个人细节。",
  branch: "连续完成 3 个没有标准答案的选择，看看你更接近哪一种创作人格。",
  community: "为最想看到的下一件作品投票；每天还可以给全站灵感星球留下 1 份能量。",
  commission: "依次选择用途、气质、交付和时间，自动生成一份可以复制的约稿需求单。",
};

type CommunityData = {
  votes: Record<string, number>;
  myVote?: string | null;
  planet: Record<string, number>;
  totalPlanet: number;
  contributedToday?: boolean;
};

type CommunityResponse = CommunityData & { error?: string };

const commissionSteps = [
  { key: "purpose", title: "01 / 用途", options: ["个人纪念", "社交发布", "品牌宣传", "商业投放"] },
  { key: "style", title: "02 / 气质", options: ["杂志编辑", "未来科技", "怀旧信笺", "大胆实验"] },
  { key: "format", title: "03 / 交付", options: ["单张主视觉", "系列海报", "短视频视觉", "个人网页"] },
  { key: "pace", title: "04 / 节奏", options: ["先聊想法", "两周内使用", "一个月内使用", "档期可协调"] },
] as const;

export default function CreativeArcade({ visitorId, visitorAlias }: { visitorId: string; visitorAlias: string }) {
  const [tab, setTab] = useState<ArcadeTab>("rhythm");
  const [rhythmPhase, setRhythmPhase] = useState<RhythmPhase>("idle");
  const [rhythmScore, setRhythmScore] = useState(0);
  const [rhythmHits, setRhythmHits] = useState<("perfect" | "good" | "miss")[]>([]);
  const [rhythmFeedback, setRhythmFeedback] = useState("跟着档案线的脉冲点击");
  const rhythmStartRef = useRef(0);
  const rhythmLastBeatRef = useRef(-1);
  const rhythmTimerRef = useRef<number | null>(null);
  const rhythmAudioRef = useRef<HTMLAudioElement | null>(null);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoChoice, setPhotoChoice] = useState<number | null>(null);
  const [photoScore, setPhotoScore] = useState(0);
  const [photoDone, setPhotoDone] = useState(false);

  const [branchAnswers, setBranchAnswers] = useState<number[]>([]);
  const [community, setCommunity] = useState<CommunityData>({ votes: {}, planet: {}, totalPlanet: 0 });
  const [communityStatus, setCommunityStatus] = useState("正在接入全站灵感信号…");
  const [commission, setCommission] = useState<Record<string, string>>({});
  const [briefCopied, setBriefCopied] = useState(false);

  const activePhoto = photoCases[photoIndex];
  const branchResult = branchAnswers.length === branchQuestions.length
    ? branchResults[branchAnswers.reduce((sum, value) => sum + value, 0) % branchResults.length]
    : null;
  const commissionReady = commissionSteps.every((step) => commission[step.key]);
  const commissionBrief = commissionReady
    ? `你好，我想咨询一项${commission.purpose}约稿。\n希望整体气质偏${commission.style}，交付形式是${commission.format}，时间安排为${commission.pace}。\n具体用途、尺寸、数量、修改范围与商用授权可以继续沟通，请先帮我确认档期并按需求报价。`
    : "";

  const totalVotes = useMemo(() => Object.values(community.votes).reduce((sum, value) => sum + value, 0), [community.votes]);

  useEffect(() => () => {
    if (rhythmTimerRef.current !== null) window.clearTimeout(rhythmTimerRef.current);
  }, []);

  useEffect(() => {
    if (!visitorId) return;
    const controller = new AbortController();
    fetch(`/api/game/community?visitorId=${encodeURIComponent(visitorId)}`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.json() as Promise<CommunityResponse>)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCommunity(data);
        setCommunityStatus("真实全站汇总 · 不收集自由文本");
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setCommunityStatus("全站信号暂时未连接，本地玩法仍可继续");
      });
    return () => controller.abort();
  }, [visitorId]);

  const startRhythm = async () => {
    if (rhythmTimerRef.current !== null) window.clearTimeout(rhythmTimerRef.current);
    window.dispatchEvent(new Event("serkon-music-pause"));
    setRhythmScore(0);
    setRhythmHits([]);
    setRhythmFeedback("预备——跟住脉冲");
    rhythmLastBeatRef.current = -1;
    rhythmStartRef.current = performance.now() + rhythmBeatMs;
    setRhythmPhase("playing");
    if (rhythmAudioRef.current) {
      rhythmAudioRef.current.currentTime = 0;
      try { await rhythmAudioRef.current.play(); } catch { /* 静音状态下仍可完成节奏挑战 */ }
    }
    rhythmTimerRef.current = window.setTimeout(() => {
      setRhythmPhase("done");
      setRhythmFeedback("本轮节奏档案已封存");
      rhythmAudioRef.current?.pause();
      awardArchiveStamp("music");
      awardArchiveStamp("game");
    }, rhythmBeatMs * (rhythmBeats + 1));
  };

  const tapRhythm = () => {
    if (rhythmPhase !== "playing") return;
    const relative = performance.now() - rhythmStartRef.current;
    const beat = Math.round(relative / rhythmBeatMs);
    if (beat < 0 || beat >= rhythmBeats || beat === rhythmLastBeatRef.current) return;
    rhythmLastBeatRef.current = beat;
    const delta = Math.abs(relative - beat * rhythmBeatMs);
    const grade = delta <= 105 ? "perfect" : delta <= 225 ? "good" : "miss";
    const points = grade === "perfect" ? 100 : grade === "good" ? 60 : 0;
    setRhythmScore((current) => current + points);
    setRhythmHits((current) => {
      const next = [...current];
      next[beat] = grade;
      return next;
    });
    setRhythmFeedback(grade === "perfect" ? "PERFECT / 正中节拍" : grade === "good" ? "GOOD / 跟上了" : "MISS / 再稳一点");
  };

  const choosePhoto = (choice: number) => {
    if (photoChoice !== null || photoDone) return;
    setPhotoChoice(choice);
    if (choice === activePhoto.answer) setPhotoScore((current) => current + 1);
  };

  const nextPhoto = () => {
    if (photoIndex === photoCases.length - 1) {
      setPhotoDone(true);
      awardArchiveStamp("photo");
      awardArchiveStamp("game");
      return;
    }
    setPhotoIndex((current) => current + 1);
    setPhotoChoice(null);
  };

  const restartPhoto = () => {
    setPhotoIndex(0);
    setPhotoChoice(null);
    setPhotoScore(0);
    setPhotoDone(false);
  };

  const answerBranch = (value: number) => {
    if (branchAnswers.length >= branchQuestions.length) return;
    const next = [...branchAnswers, value];
    setBranchAnswers(next);
    if (next.length === branchQuestions.length) awardArchiveStamp("game");
  };

  const postCommunity = async (payload: Record<string, string>) => {
    if (!visitorId) return;
    setCommunityStatus("正在把选择写入全站档案…");
    try {
      const response = await fetch("/api/game/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, visitorId }),
      });
      const data = await response.json() as CommunityResponse;
      if (!response.ok) throw new Error(data.error || "提交失败");
      setCommunity(data);
      setCommunityStatus("已写入全站汇总 · 你可以随时修改本期投票");
      awardArchiveStamp("ai");
    } catch (error) {
      setCommunityStatus(error instanceof Error ? error.message : "全站信号暂时未连接");
    }
  };

  const chooseCommission = (key: string, value: string) => {
    const next = { ...commission, [key]: value };
    setCommission(next);
    if (commissionSteps.every((step) => next[step.key])) awardArchiveStamp("commission");
  };

  return (
    <section className="creative-arcade" aria-labelledby="arcade-title">
      <audio ref={rhythmAudioRef} src="/creation-fk.mp3" preload="metadata" />
      <header className="arcade-heading">
        <div><small>SERKON PLAY ARCHIVE / 05—09</small><h3 id="arcade-title" aria-label="把兴趣变成能玩的个人线索">把兴趣变成能玩的<br /><span>个人线索</span></h3></div>
        <p>简单说：不只是读“我喜欢什么”，而是亲手玩一次我的音乐、照片与创作选择。五种玩法都可以单独体验，不需要按顺序通关。</p>
      </header>

      <div className="arcade-onboarding" role="note" aria-label="玩法说明">
        <div><small>FIRST VISIT / HOW TO PLAY</small><strong>第一次来，任选一个开始</strong><p>每个小游戏都是一条关于 Serkon 的个人线索；玩完会得到结果、看到故事，或把你的选择留进全站共同档案。</p></div>
        <ol>
          <li><b>01</b><span><strong>选择玩法</strong><small>从下面五个标签任选一个</small></span></li>
          <li><b>02</b><span><strong>照提示操作</strong><small>点击、选择或投票即可</small></span></li>
          <li><b>03</b><span><strong>收下线索</strong><small>获得结果并推进档案进度</small></span></li>
        </ol>
      </div>

      <div className="arcade-tabs" role="tablist" aria-label="玩法选择">
        {([
          ["rhythm", "节奏档案"], ["photo", "照片侦探"], ["branch", "人生分支"], ["community", "灵感星球"], ["commission", "约稿模拟器"],
        ] as [ArcadeTab, string][]).map(([key, label], index) => <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><span>0{index + 5}</span>{label}</button>)}
      </div>
      <p className="arcade-tab-hint" aria-live="polite"><b>当前玩法：</b>{tabInstructions[tab]}</p>

      {tab === "rhythm" && <div className="arcade-stage rhythm-game" role="tabpanel">
        <div className="arcade-copy"><small>MUSIC / CREATION</small><h4>《创世纪》节奏档案</h4><p>这不是通用音游皮肤，而是用站内原创音乐做成的一段短挑战。听见脉冲、看见暗红档案线收拢时点击。</p><button type="button" onClick={startRhythm}>{rhythmPhase === "playing" ? "重新开始" : rhythmPhase === "done" ? "再来一轮" : "开始 12 拍挑战"}</button></div>
        <button className={`rhythm-pad ${rhythmPhase}`} type="button" onClick={tapRhythm} disabled={rhythmPhase !== "playing"} aria-label="跟随节奏点击">
          <span className="rhythm-ring" aria-hidden="true" />
          <strong>{rhythmPhase === "idle" ? "READY" : rhythmPhase === "playing" ? rhythmFeedback : `${rhythmScore} PTS`}</strong>
          <small>{rhythmPhase === "playing" ? "点击 / TAP" : "位面之子 FK · 原创音乐"}</small>
        </button>
        <div className="beat-line" aria-label={`已记录 ${rhythmHits.filter(Boolean).length} 个节拍`}>{Array.from({ length: rhythmBeats }, (_, index) => <i key={index} className={rhythmHits[index] || ""} />)}</div>
      </div>}

      {tab === "photo" && <div className="arcade-stage photo-detective" role="tabpanel">
        <div className="photo-clue"><Image src={activePhoto.src} alt="照片侦探局部线索" className={activePhoto.crop} width={720} height={1280} sizes="(max-width: 900px) 100vw, 50vw" unoptimized /></div>
        <div className="detective-copy">
          <small>PHOTO CASE {String(photoIndex + 1).padStart(2, "0")} / {String(photoCases.length).padStart(2, "0")}</small>
          {photoDone ? <><h4>结案：{photoScore} / {photoCases.length}</h4><p>你已经看过三处来自真实页面的影像细节。照片不只是装饰，它也在讲述这个人的状态。</p><button type="button" onClick={restartPhoto}>重新查案</button></> : <><h4>{activePhoto.question}</h4><div className="detective-options">{activePhoto.options.map((option, index) => <button type="button" key={option} className={photoChoice === index ? (index === activePhoto.answer ? "correct" : "wrong") : ""} disabled={photoChoice !== null} onClick={() => choosePhoto(index)}>{option}</button>)}</div>{photoChoice !== null && <div className="case-reveal" role="status"><p>{activePhoto.reveal}</p><button type="button" onClick={nextPhoto}>{photoIndex === photoCases.length - 1 ? "封存案件" : "下一条线索"}</button></div>}</>}
        </div>
      </div>}

      {tab === "branch" && <div className="arcade-stage branch-machine" role="tabpanel">
        <div className="branch-map" aria-hidden="true"><span>YOU</span><i /><i /><i /><b>{branchAnswers.length}/3</b></div>
        <div className="branch-copy">
          <small>LIFE BRANCH / NO RIGHT ANSWER</small>
          {branchResult ? <div className="branch-result"><h4>{branchResult.title}</h4><p>{branchResult.text}</p><button type="button" onClick={() => setBranchAnswers([])}>再走一条人生支线</button></div> : <><h4>{branchQuestions[branchAnswers.length].q}</h4><div className="branch-options">{branchQuestions[branchAnswers.length].options.map((option) => <button type="button" key={option.label} onClick={() => answerBranch(option.value)}>{option.label}<span>→</span></button>)}</div></>}
        </div>
      </div>}

      {tab === "community" && <div className="arcade-stage community-game" role="tabpanel">
        <div className="auction-board">
          <small>BRAINSTORM AUCTION / 本期投票</small><h4>下一件最值得做出来的点子？</h4>
          <div>{voteOptions.map((option) => {
            const votes = community.votes[option.key] || 0;
            const width = totalVotes ? Math.round(votes / totalVotes * 100) : 0;
            return <button type="button" key={option.key} className={community.myVote === option.key ? "selected" : ""} onClick={() => void postCommunity({ action: "vote", optionKey: option.key })}><span><b>{option.label}</b><em>{votes} 票 · {width}%</em></span><i style={{ width: `${width}%` }} /></button>;
          })}</div>
          <p role="status">{communityStatus}</p>
        </div>
        <div className="planet-board">
          <small>SHARED INSPIRATION PLANET</small><h4>今天给星球留下一种能量</h4>
          <div className="planet-orbit" aria-label={`灵感星球累计 ${community.totalPlanet} 份能量`}><span>{community.totalPlanet}</span>{planetMoods.map((mood) => <i key={mood.key}>{mood.mark}</i>)}</div>
          <div className="mood-buttons">{planetMoods.map((mood) => <button type="button" key={mood.key} disabled={community.contributedToday} onClick={() => void postCommunity({ action: "planet", mood: mood.key })}>{mood.mark} {mood.label}<small>{community.planet[mood.key] || 0}</small></button>)}</div>
          <p>{community.contributedToday ? `今天的能量已收到，${visitorAlias}。` : "每位访客每天可留下 1 份，不收集发言内容。"}</p>
        </div>
      </div>}

      {tab === "commission" && <div className="arcade-stage commission-sim" role="tabpanel">
        <div className="commission-builder"><small>COMMISSION BRIEF BUILDER</small><h4>把“我想要一个东西”整理成可沟通的需求</h4><div>{commissionSteps.map((step) => <fieldset key={step.key}><legend>{step.title}</legend>{step.options.map((option) => <button type="button" key={option} className={commission[step.key] === option ? "selected" : ""} onClick={() => chooseCommission(step.key, option)}>{option}</button>)}</fieldset>)}</div></div>
        <aside className="brief-paper"><span>BRIEF / {Object.keys(commission).length.toString().padStart(2, "0")}</span><h4>{commissionReady ? "需求单已生成" : "还需要几个关键选择"}</h4>{commissionReady ? <><pre>{commissionBrief}</pre><div><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(commissionBrief); setBriefCopied(true); } catch { setBriefCopied(false); } }}>{briefCopied ? "已复制 ✓" : "复制需求单"}</button><a href={`mailto:shikanghou4@gmail.com?subject=${encodeURIComponent("约稿咨询｜来自个人网站")}&body=${encodeURIComponent(commissionBrief)}`}>带着需求单联系 ↗</a></div></> : <p>这里不虚构固定价格。完成选择后，会生成一份包含用途、风格、交付和时间的需求单；具体报价、修改范围与商用授权仍需沟通，并先确认档期。</p>}</aside>
      </div>}
    </section>
  );
}
