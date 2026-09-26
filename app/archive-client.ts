export type ArchiveStampId = "ai" | "game" | "card" | "photo" | "music" | "commission";

export type ArchiveStamp = {
  id: ArchiveStampId;
  code: string;
  name: string;
  clue: string;
};

export const archiveStamps: ArchiveStamp[] = [
  { id: "ai", code: "AI", name: "灵感实验", clue: "抽取、收藏或融合一张灵感卡" },
  { id: "game", code: "GM", name: "游戏现场", clue: "完成一项互动挑战" },
  { id: "card", code: "CD", name: "牌局记忆", clue: "完成记忆翻牌或进入斗地主" },
  { id: "photo", code: "PH", name: "影像观察", clue: "完成照片侦探或浏览生活影像" },
  { id: "music", code: "MU", name: "创世纪", clue: "播放原创音乐或完成节奏挑战" },
  { id: "commission", code: "CO", name: "共同创作", clue: "生成一份约稿需求单" },
];

const STAMP_KEY = "serkon_archive_stamps_v1";
const VISITOR_KEY = "serkon_visitor_id";
const ALIAS_KEY = "serkon_visitor_alias";

function freshVisitorId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateVisitor() {
  let id = freshVisitorId();
  let alias = `BJ-Traveler-${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    id = window.localStorage.getItem(VISITOR_KEY) || id;
    alias = window.localStorage.getItem(ALIAS_KEY) || alias;
    window.localStorage.setItem(VISITOR_KEY, id);
    window.localStorage.setItem(ALIAS_KEY, alias);
  } catch {
    // 当前浏览器禁用本地存储时，仍使用会话内临时身份。
  }
  return { id, alias, officerNumber: `CN-${id.slice(-6).toUpperCase()}` };
}

export function readArchiveStamps(): ArchiveStampId[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(STAMP_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return archiveStamps.map((stamp) => stamp.id).filter((id) => value.includes(id));
  } catch {
    return [];
  }
}

export function awardArchiveStamp(id: ArchiveStampId) {
  const current = readArchiveStamps();
  if (current.includes(id)) return false;
  const next = [...current, id];
  try {
    window.localStorage.setItem(STAMP_KEY, JSON.stringify(next));
  } catch {
    // 存储不可用时，事件仍能让当前页面展示解锁反馈。
  }
  window.dispatchEvent(new CustomEvent("serkon-archive", { detail: { id, stamps: next } }));
  return true;
}
