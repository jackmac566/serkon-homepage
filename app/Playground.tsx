"use client";

import { useEffect, useRef, useState } from "react";
import CreativeArcade from "./CreativeArcade";
import { awardArchiveStamp, getOrCreateVisitor } from "./archive-client";
import Image from "next/image";

const ideaSubjects = [
  "小时候最舍不得吃完的一包零食", "一个多年没登录的 QQ 账号", "北京深夜最后一班公交车", "王者荣耀里一次默契的团战",
  "朋友围坐时的一局扑克牌", "大一宿舍熄灯后的十分钟", "相册里一张舍不得删除的旧照片", "一首还没有被很多人听见的原创歌",
  "一个拥有自己性格的 AI 分身", "一枚只属于自己的旧式印章", "街角营业到凌晨的便利店", "雨后反光的小巷",
  "五年后的自己寄来的一封信", "聊天框里一条没有发送的消息", "城市楼顶短暂出现的晚霞", "最近反复出现的一个梦",
  "摆满杂物却很安心的书桌", "口袋里忘记丢掉的一张旧票根", "朋友突然笑出声的那个瞬间", "一件看起来毫不起眼的日用品",
];

const ideaMissions = [
  (subject: string) => `把“${subject}”设计成一张只使用三种颜色的电影海报。`,
  (subject: string) => `围绕“${subject}”做一个可点击的网页互动，让访客在 30 秒内完成一次选择。`,
  (subject: string) => `以“${subject}”为核心，写一段 15 秒短视频口播，结尾必须出现一次反转。`,
  (subject: string) => `为“${subject}”建立一套微型品牌：名字、口号、图形符号和一件周边。`,
  (subject: string) => `用 AI 重构“${subject}”，画面必须同时包含胶片颗粒、未来材质和真实烟火气。`,
];

const ideas = ideaSubjects.flatMap((subject) => ideaMissions.map((mission) => mission(subject)));

const memoryPairs = [
  { pair: "ai", icon: "AI", label: "AI 分身", story: "AI 对我最有意思的地方，是让模糊想法迅速拥有第一版。" },
  { pair: "game", icon: "K", label: "王者时刻", story: "临场判断与团队默契，是我喜欢游戏的真正原因。" },
  { pair: "card", icon: "♠", label: "朋友牌局", story: "牌局里的概率很有趣，朋友围坐的时刻更值得记住。" },
  { pair: "photo", icon: "◎", label: "生活影像", story: "照片会替我们保存当时没有注意到的小细节。" },
  { pair: "music", icon: "♪", label: "原创音乐", story: "《创世纪》让这个网站拥有了属于自己的声音。" },
  { pair: "idea", icon: "✦", label: "灵感闪现", story: "灵感不是等来的，它常常发生在真的动手之后。" },
];

type MemoryCard = (typeof memoryPairs)[number] & { key: string };

function makeMemoryDeck(shuffle: boolean, pairCount = memoryPairs.length): MemoryCard[] {
  const deck = memoryPairs.slice(0, pairCount).flatMap((item) => [0, 1].map((copy) => ({ ...item, key: `${item.pair}-${copy}` })));
  if (!shuffle) return deck;
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

type GamePhase = "idle" | "starting" | "playing" | "done";
type ThemeName = "editorial" | "letter" | "sage" | "sunset";
type TargetKind = "yellow" | "blue" | "red";
type RankingResponse = {
  ranking?: { name: string; score: number }[];
  error?: string;
  challengeId?: string;
  durationMs?: number;
  personalBest?: number;
};

export default function Playground() {
  const [theme, setTheme] = useState<ThemeName>("editorial");
  const [ideaIndex, setIdeaIndex] = useState(0);
  const [ideaIsDaily, setIdeaIsDaily] = useState(true);
  const [ideaFavorites, setIdeaFavorites] = useState<number[]>([]);
  const [fusionIdea, setFusionIdea] = useState("");
  const [memoryCards, setMemoryCards] = useState(() => makeMemoryDeck(false));
  const [memoryMode, setMemoryMode] = useState<4 | 6>(6);
  const [memoryOpen, setMemoryOpen] = useState<number[]>([]);
  const [memoryMatched, setMemoryMatched] = useState<string[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryStatus, setMemoryStatus] = useState<"idle" | "playing" | "won">("idle");
  const [memoryLocked, setMemoryLocked] = useState(false);
  const [memoryReveal, setMemoryReveal] = useState("");
  const [gamePhase, setGamePhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameFeedback, setGameFeedback] = useState("黄色 +1 · 蓝色 +2 · 红色会打断连击");
  const [timeLeft, setTimeLeft] = useState(10);
  const [target, setTarget] = useState<{ x: number; y: number; kind: TargetKind }>({ x: 52, y: 42, kind: "yellow" });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ideaDeckRef = useRef<number[]>([]);
  const memoryTimerRef = useRef<number | null>(null);
  const scoreSavedRef = useRef(false);
  const challengeIdRef = useRef<string | null>(null);
  const targetHistoryRef = useRef<{ x: number; y: number }[]>([]);
  const visitorIdRef = useRef("");
  const [visitorId, setVisitorId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [visitorAlias, setVisitorAlias] = useState("一位路过的朋友");
  const [ranking, setRanking] = useState<{ name: string; score: number }[]>([]);
  const [rankingStatus, setRankingStatus] = useState("正在读取全站历史榜…");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  useEffect(() => {
    if (gamePhase !== "playing") return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setGamePhase("done");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gamePhase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const visitor = getOrCreateVisitor();
      const alias = visitor.alias;
      const nextVisitorId = visitor.id;
      try {
        const savedFavorites = JSON.parse(window.localStorage.getItem("serkon_idea_favorites") || "[]");
        if (Array.isArray(savedFavorites)) setIdeaFavorites(savedFavorites.filter((value) => Number.isInteger(value) && value >= 0 && value < ideas.length).slice(0, 20));
      } catch {
        // 禁用本地存储时使用当前会话的临时身份。
      }
      setVisitorAlias(alias);
      setIdeaIndex(Math.floor(Date.now() / 86_400_000) % ideas.length);
      visitorIdRef.current = nextVisitorId;
      setVisitorId(nextVisitorId);
      fetch("/api/game/ranking", { cache: "no-store" }).then((response) => response.json() as Promise<RankingResponse>).then((data) => {
        setRanking(Array.isArray(data.ranking) ? data.ranking : []);
        setRankingStatus(data.error ? "暂时无法连接全站榜" : "全站保留每位访客的历史最高分");
      }).catch(() => setRankingStatus("暂时无法连接全站榜"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => () => {
    if (memoryTimerRef.current !== null) window.clearTimeout(memoryTimerRef.current);
  }, []);

  useEffect(() => {
    if (gamePhase !== "done" || scoreSavedRef.current) return;
    scoreSavedRef.current = true;
    try { window.localStorage.setItem("serkon_game_played", "true"); } catch { /* 当前会话仍可正常完成 */ }
    window.dispatchEvent(new Event("serkon-progress"));
    const challengeId = challengeIdRef.current;
    if (!challengeId || !visitorIdRef.current) return;
    setRankingStatus("正在核验并保存本局成绩…");
    fetch("/api/game/ranking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", visitorId: visitorIdRef.current, challengeId, name: playerName.trim() || visitorAlias, score }),
    }).then((response) => response.json() as Promise<RankingResponse>).then((data) => {
      if (Array.isArray(data.ranking)) setRanking(data.ranking);
      setRankingStatus(data.error || "已保存：全站保留每位访客的历史最高分");
    }).catch(() => setRankingStatus("成绩未保存成功，请再挑战一次"));
  }, [gamePhase, playerName, score, visitorAlias]);

  const drawIdea = () => {
    if (!ideaDeckRef.current.length) {
      const deck = Array.from({ length: ideas.length }, (_, index) => index).filter((index) => index !== ideaIndex);
      for (let index = deck.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
      }
      ideaDeckRef.current = deck;
    }
    const next = ideaDeckRef.current.pop();
    if (next !== undefined) {
      setIdeaIndex(next);
      setIdeaIsDaily(false);
      setFusionIdea("");
      awardArchiveStamp("ai");
    }
  };

  const toggleIdeaFavorite = () => {
    const next = ideaFavorites.includes(ideaIndex) ? ideaFavorites.filter((index) => index !== ideaIndex) : [...ideaFavorites, ideaIndex].slice(-20);
    setIdeaFavorites(next);
    try { window.localStorage.setItem("serkon_idea_favorites", JSON.stringify(next)); } catch { /* 收藏仍在当前会话生效 */ }
    awardArchiveStamp("ai");
  };

  const fuseIdeas = () => {
    const candidates = ideaFavorites.length >= 2 ? ideaFavorites.slice(-2) : [ideaIndex, (ideaIndex + 37) % ideas.length];
    const first = ideas[candidates[0]].replace(/[。]$/, "");
    const second = ideas[candidates[1]].replace(/[。]$/, "");
    setFusionIdea(`融合任务：先完成“${first}”，再借用“${second}”的表达方法，把两者合成一个 30 秒内能讲清楚的作品。`);
    awardArchiveStamp("ai");
  };

  const startMemoryGame = () => {
    if (memoryTimerRef.current !== null) window.clearTimeout(memoryTimerRef.current);
    setMemoryCards(makeMemoryDeck(true, memoryMode));
    setMemoryOpen([]);
    setMemoryMatched([]);
    setMemoryMoves(0);
    setMemoryLocked(false);
    setMemoryReveal("");
    setMemoryStatus("playing");
  };

  const exitMemoryGame = () => {
    if (memoryTimerRef.current !== null) window.clearTimeout(memoryTimerRef.current);
    memoryTimerRef.current = null;
    setMemoryOpen([]);
    setMemoryMatched([]);
    setMemoryMoves(0);
    setMemoryLocked(false);
    setMemoryReveal("");
    setMemoryStatus("idle");
  };

  const flipMemoryCard = (index: number) => {
    const card = memoryCards[index];
    if (memoryStatus !== "playing" || memoryLocked || memoryOpen.includes(index) || memoryMatched.includes(card.pair)) return;
    if (!memoryOpen.length) { setMemoryOpen([index]); return; }

    const firstCard = memoryCards[memoryOpen[0]];
    const isMatch = firstCard.pair === card.pair;
    setMemoryOpen([memoryOpen[0], index]);
    setMemoryMoves((moves) => moves + 1);
    setMemoryLocked(true);
    memoryTimerRef.current = window.setTimeout(() => {
      if (isMatch) {
        const nextMatched = [...memoryMatched, card.pair];
        setMemoryMatched(nextMatched);
        setMemoryReveal(card.story);
        if (nextMatched.length === memoryMode) {
          setMemoryStatus("won");
          awardArchiveStamp("card");
          awardArchiveStamp("game");
        }
      } else setMemoryReveal("这两张不属于同一段记忆，再换一组线索试试。");
      setMemoryOpen([]);
      setMemoryLocked(false);
      memoryTimerRef.current = null;
    }, isMatch ? 360 : 650);
  };

  const randomTarget = () => {
    const bytes = new Uint32Array(3);
    crypto.getRandomValues(bytes);
    const kindFrom = (value: number): TargetKind => value % 10 < 6 ? "yellow" : value % 10 < 9 ? "blue" : "red";
    let next = { x: 8 + (bytes[0] / 0xffffffff) * 76, y: 12 + (bytes[1] / 0xffffffff) * 62, kind: kindFrom(bytes[2]) };
    let attempts = 0;
    while (targetHistoryRef.current.some((point) => Math.hypot(point.x - next.x, point.y - next.y) < 14) && attempts < 12) {
      crypto.getRandomValues(bytes);
      next = { x: 8 + (bytes[0] / 0xffffffff) * 76, y: 12 + (bytes[1] / 0xffffffff) * 62, kind: kindFrom(bytes[2]) };
      attempts += 1;
    }
    targetHistoryRef.current = [...targetHistoryRef.current.slice(-12), next];
    return next;
  };

  useEffect(() => {
    if (gamePhase !== "playing") return;
    const mover = window.setInterval(() => setTarget(randomTarget()), 850);
    return () => window.clearInterval(mover);
  }, [gamePhase]);

  const startGame = async () => {
    scoreSavedRef.current = false;
    setScore(0);
    setCombo(0);
    setGameFeedback("黄色 +1 · 蓝色 +2 · 红色会打断连击");
    setTimeLeft(10);
    targetHistoryRef.current = [];
    setTarget(randomTarget());
    setGamePhase("starting");
    setRankingStatus("正在创建有效对局…");
    try {
      const response = await fetch("/api/game/ranking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", visitorId: visitorIdRef.current }) });
      const data = await response.json() as RankingResponse;
      if (!response.ok || !data.challengeId) throw new Error(data.error);
      challengeIdRef.current = data.challengeId;
      setRankingStatus("本局有效，结束后自动保存最高成绩");
      setGamePhase("playing");
    } catch {
      setRankingStatus("全站榜暂时无法连接，请稍后重试");
      setGamePhase("idle");
    }
  };

  const catchIdea = () => {
    if (target.kind === "red") {
      setScore((current) => Math.max(0, current - 1));
      setCombo(0);
      setGameFeedback("红色干扰项：-1，连击中断");
    } else {
      const nextCombo = combo + 1;
      const base = target.kind === "blue" ? 2 : 1;
      const bonus = nextCombo % 5 === 0 ? 1 : 0;
      setScore((current) => current + base + bonus);
      setCombo(nextCombo);
      setGameFeedback(`${target.kind === "blue" ? "蓝色稀有灵感 +2" : "黄色灵感 +1"}${bonus ? " · 连击奖励 +1" : ` · ${nextCombo} 连击`}`);
    }
    setTarget(randomTarget());
  };

  const stopMusic = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  useEffect(() => {
    const pause = () => stopMusic();
    window.addEventListener("serkon-music-pause", pause);
    return () => window.removeEventListener("serkon-music-pause", pause);
  }, []);

  const startMusic = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      awardArchiveStamp("music");
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <section className="playground section-pad" id="play" aria-labelledby="play-title" data-signal-surface>
      <audio ref={audioRef} src="/creation-fk.mp3" preload="none" onEnded={() => setIsPlaying(false)} />
      <button
        className={`music-player ${isPlaying ? "playing" : ""}`}
        type="button"
        onClick={isPlaying ? stopMusic : startMusic}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? "暂停背景音乐" : "播放背景音乐"}
      >
        <span className="music-icon" aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>
        <span><strong>{isPlaying ? "正在播放 · 创世纪" : "播放《创世纪》"}</strong><small>位面之子 FK · 原创音乐</small></span>
      </button>

      <div className="section-heading heading-split">
        <div>
          <div className="section-index light-index">
            <span>05</span><i aria-hidden="true" /><small>PLAYABLE CAPABILITIES</small>
          </div>
          <h2 id="play-title">互动档案局</h2>
        </div>
        <p>这些玩法分别对应我的视觉判断、内容想象、游戏设计和真实沟通能力。</p>
      </div>

      <div className="lab-grid">
        <article className="lab-card theme-lab">
          <span className="lab-number">01 / MOOD</span>
          <h3>换一种网站气氛</h3>
          <p>四套高可读氛围，每一套都保留清晰文字与舒适对比。</p>
          <div className="theme-switch" aria-label="网站主题">
            <button type="button" aria-pressed={theme === "editorial"} className={theme === "editorial" ? "active" : ""} onClick={() => setTheme("editorial")}>赤线留白</button>
            <button type="button" aria-pressed={theme === "letter"} className={theme === "letter" ? "active" : ""} onClick={() => setTheme("letter")}>暖杏信笺</button>
            <button type="button" aria-pressed={theme === "sage"} className={theme === "sage" ? "active" : ""} onClick={() => setTheme("sage")}>青绿胶片</button>
            <button type="button" aria-pressed={theme === "sunset"} className={theme === "sunset" ? "active" : ""} onClick={() => setTheme("sunset")}>霞光珊瑚</button>
          </div>
        </article>

        <article className="lab-card idea-lab">
          <span className="lab-number">02 / AI DRAW</span>
          <h3>抽一张 AI 灵感卡</h3>
          <small className="idea-count">{ideaIsDaily ? "DAILY CARD / 今日灵感" : "RANDOM DRAW"} · CARD {String(ideaIndex + 1).padStart(3, "0")} / 100 · 已收藏 {ideaFavorites.length}</small>
          <blockquote>{ideas[ideaIndex]}</blockquote>
          {fusionIdea && <p className="fusion-idea" role="status">{fusionIdea}</p>}
          <div className="idea-actions"><button className="lab-action" type="button" onClick={drawIdea}>换一个挑战 <span aria-hidden="true">↻</span></button><button type="button" className={ideaFavorites.includes(ideaIndex) ? "saved" : ""} onClick={toggleIdeaFavorite}>{ideaFavorites.includes(ideaIndex) ? "已入收藏册" : "收藏这张"}</button><button type="button" onClick={fuseIdeas}>融合两张</button></div>
        </article>

        <article className="lab-card memory-lab">
          <span className="lab-number">03 / MEMORY FLIP</span>
          <div className="memory-heading"><h3>Serkon 记忆翻牌</h3><span>{`${memoryMoves} 步 · ${memoryMatched.length}/${memoryMode} 对`}</span></div>
          <p aria-live="polite">{memoryStatus === "won" ? `全部配对成功！你用了 ${memoryMoves} 步。` : `翻开两张卡，找出属于 Serkon 的 ${memoryMode} 组相同记忆。`}</p>
          <div className="memory-mode" aria-label="翻牌难度"><button type="button" aria-pressed={memoryMode === 4} onClick={() => { setMemoryMode(4); exitMemoryGame(); }}>快速 4 对</button><button type="button" aria-pressed={memoryMode === 6} onClick={() => { setMemoryMode(6); exitMemoryGame(); }}>完整 6 对</button></div>
          <small className="memory-help" id="memory-help">玩法：每次翻两张，图形和文字相同即保留；卡面使用本站专属双色档案符号。</small>
          {memoryReveal && <p className="memory-reveal" role="status">{memoryReveal}</p>}
          <div className="memory-board" aria-label="记忆翻牌游戏" aria-describedby="memory-help">
            {memoryCards.map((card, index) => {
              const revealed = memoryOpen.includes(index) || memoryMatched.includes(card.pair);
              return <button type="button" key={card.key} className={revealed ? "revealed" : ""} disabled={memoryStatus !== "playing"} onClick={() => flipMemoryCard(index)} aria-label={revealed ? card.label : "未翻开的记忆卡"}>
                <span className="memory-front">?</span><span className="memory-back"><b>{card.icon}</b><small>{card.label}</small></span>
              </button>;
            })}
          </div>
          <div className="memory-actions">
            <button className="memory-start" type="button" onClick={startMemoryGame}>{memoryStatus === "idle" ? "开始翻牌" : memoryStatus === "won" ? "再来一局" : "重新洗牌"}</button>
            {memoryStatus !== "idle" && <button className="memory-exit" type="button" onClick={exitMemoryGame}>退出本局</button>}
          </div>
        </article>

        <article className="lab-card game-lab">
          <span className="lab-number">04 / MINI GAME</span>
          <div className="game-heading"><h3>捕捉灵感</h3><span aria-live="polite">{`${timeLeft}s · ${score}分`}</span></div>
          <p>10 秒内判断颜色并捕捉：黄色加分、蓝色稀有、红色会打断连击。</p>
          <small className="game-feedback" role="status">{gameFeedback}</small>
          <div className="game-stage" aria-label="捕捉灵感小游戏区域">
            {gamePhase === "playing" ? (
              <button className={`idea-target ${target.kind}`} type="button" style={{ left: `${target.x}%`, top: `${target.y}%` }} onClick={catchIdea} aria-label={target.kind === "red" ? "红色干扰灵感" : target.kind === "blue" ? "蓝色稀有灵感" : "黄色灵感"}>{target.kind === "red" ? "×" : target.kind === "blue" ? "+2" : "✦"}</button>
            ) : (
              <div className="game-panel">
                <strong>{gamePhase === "done" ? `本次捕捉 ${score} 个灵感` : gamePhase === "starting" ? "正在准备有效对局…" : "准备好了吗？"}</strong>
                <small>{gamePhase === "done" ? (score >= 12 ? "抽象大师，手速离谱。" : "灵感跑得快，再来一次。") : "手机和电脑都能玩"}</small>
                {gamePhase === "idle" && <><label className="sr-only" htmlFor="ranking-name">排行榜昵称</label><input id="ranking-name" className="rank-name" value={playerName} maxLength={12} onChange={(event) => setPlayerName(event.target.value)} placeholder={`昵称（默认：${visitorAlias}）`} /></>}
                <button type="button" onClick={startGame} disabled={gamePhase === "starting"}>{gamePhase === "done" ? "再玩一次" : gamePhase === "starting" ? "准备中…" : "开始挑战"}</button>
              </div>
            )}
          </div>
          <div className="local-ranking"><div><strong>全站历史最高榜</strong><small role="status" aria-live="polite">{rankingStatus}</small></div>{ranking.length ? <ol>{ranking.map((item, index) => <li key={`${item.name}-${index}`}><span>#{index + 1} {item.name}</span><b>{item.score}</b></li>)}</ol> : <p>榜单还空着，来成为第一位上榜者。</p>}</div>
        </article>
      </div>

      <CreativeArcade visitorId={visitorId} visitorAlias={visitorAlias} />

      <div className="moment-strip" aria-label="Serkon 的视频瞬间">
        <div className="moment-copy"><small>MOMENTS FROM THE VIDEO</small><h3>镜头之外，<br />也有不同表情。</h3><p>正式、轻松、带一点玩心——都是我。</p></div>
        <figure className="moment moment-one"><Image src="/serkon-moment-call.jpg" alt="Serkon 做出打电话手势的轻松瞬间" width={720} height={1280} sizes="(max-width: 760px) 46vw, 28vw" unoptimized /><figcaption>PLAYFUL / 01</figcaption></figure>
        <figure className="moment moment-two"><Image src="/serkon-moment-wave.jpg" alt="Serkon 向镜头挥手的瞬间" width={720} height={1280} sizes="(max-width: 760px) 46vw, 28vw" unoptimized /><figcaption>HELLO / 02</figcaption></figure>
      </div>
    </section>
  );
}
