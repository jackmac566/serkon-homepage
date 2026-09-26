"use client";

import { useEffect, useMemo, useState } from "react";
import { archiveStamps, getOrCreateVisitor, readArchiveStamps, type ArchiveStampId } from "./archive-client";

export default function ArchiveOffice() {
  const [open, setOpen] = useState(false);
  const [stamps, setStamps] = useState<ArchiveStampId[]>([]);
  const [officerNumber, setOfficerNumber] = useState("CN-------");
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStamps(readArchiveStamps());
      setOfficerNumber(getOrCreateVisitor().officerNumber);
    }, 0);
    const onArchive = (event: Event) => {
      const detail = (event as CustomEvent<{ id: ArchiveStampId; stamps: ArchiveStampId[] }>).detail;
      if (!detail) return;
      setStamps(detail.stamps);
      const stamp = archiveStamps.find((item) => item.id === detail.id);
      setToast(stamp ? `档案章已入册：${stamp.name}` : "档案章已入册");
      window.setTimeout(() => setToast(""), 2400);
    };
    window.addEventListener("serkon-archive", onArchive);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("serkon-archive", onArchive);
    };
  }, []);

  const unlocked = stamps.length === archiveStamps.length;
  const progressLabel = useMemo(() => `已探索 ${stamps.length} / ${archiveStamps.length}`, [stamps.length]);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(`SERKON ARCHIVE OFFICER ${officerNumber}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className={`archive-office ${open ? "open" : ""}`} aria-label="Serkon 个人档案局">
      <button className="archive-handle" type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="archive-seal" aria-hidden="true">档</span>
        <span><small>SERKON ARCHIVE OFFICE</small><strong>个人档案局 · {officerNumber}</strong></span>
        <b>{progressLabel}</b>
      </button>

      {open && <div className="archive-panel">
        <header>
          <div><small>VISITOR FIELD FILE / 006</small><h2>把整座网站，玩成一份个人档案。</h2></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="关闭个人档案局">×</button>
        </header>
        <p className="archive-intro"><strong>怎么玩：</strong>从互动档案、生活影像、斗地主、原创音乐与合作入口中任选一处真正操作，系统会自动盖章。你的编号只保存在当前浏览器；它不是登录账号，也不会收集你的姓名。</p>
        <ul className="stamp-grid">
          {archiveStamps.map((stamp, index) => {
            const done = stamps.includes(stamp.id);
            return <li className={done ? "done" : ""} key={stamp.id}>
              <span>{done ? stamp.code : String(index + 1).padStart(2, "0")}</span>
              <div><strong>{stamp.name}</strong><small>{done ? "ARCHIVED / 已入册" : stamp.clue}</small></div>
            </li>;
          })}
        </ul>
        <div className={`secret-file ${unlocked ? "unlocked" : ""}`}>
          <small>SEALED FILE / ARCHIVE 006</small>
          {unlocked ? <><strong>隐藏档案已解封：好奇心不是天赋，是一次次真的去试。</strong><p>如果你集齐了六枚章，你看到的已经不只是“我是谁”，而是我怎样把 AI、游戏、影像、音乐和真实需求连接成作品。谢谢你认真走完这一程。</p></> : <><strong>隐藏档案尚未解封</strong><p>还差 {archiveStamps.length - stamps.length} 枚章。线索就在互动实验室、影像、牌局和合作需求里。</p></>}
        </div>
        <button className="archive-copy" type="button" onClick={copyNumber}>{copied ? "档案编号已复制 ✓" : "复制我的档案编号"}</button>
      </div>}
      {toast && <div className="archive-toast" role="status">{toast}</div>}
    </aside>
  );
}
