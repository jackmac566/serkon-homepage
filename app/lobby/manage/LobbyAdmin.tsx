"use client";

import { useEffect, useState } from "react";
import { formatLobbyTime } from "../time";

type AdminMessage = {
  id: string;
  visitorCode: string;
  nickname: string;
  body: string;
  status: string;
  createdAt: number;
  moderationReason: string | null;
};

export default function LobbyAdmin() {
  const [key, setKey] = useState("");
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [reports, setReports] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("正在验证站长权限…");
  const [authorized, setAuthorized] = useState(false);

  async function load(providedKey = key) {
    const response = await fetch("/api/lobby/admin", { headers: providedKey ? { "X-Serkon-Admin-Key": providedKey } : {}, cache: "no-store" });
    const payload = await response.json() as { messages?: AdminMessage[]; reports?: Record<string, number>; error?: string };
    if (!response.ok) {
      setAuthorized(false);
      setStatus(payload.error || "需要站长权限");
      return;
    }
    if (providedKey) window.sessionStorage.setItem("serkon_lobby_admin_key", providedKey);
    setAuthorized(true);
    setMessages(payload.messages ?? []);
    setReports(payload.reports ?? {});
    setStatus(`已读取 ${payload.messages?.length ?? 0} 条管理记录`);
  }

  useEffect(() => {
    const saved = window.sessionStorage.getItem("serkon_lobby_admin_key") ?? "";
    if (saved) window.setTimeout(() => setKey(saved), 0);
    const initialTimer = window.setTimeout(() => void load(saved), 0);
    return () => window.clearTimeout(initialTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function moderate(messageId: string, action: "hide" | "restore" | "delete") {
    const label = action === "delete" ? "彻底删除" : action === "hide" ? "隐藏" : "恢复";
    if (action === "delete" && !window.confirm("确定彻底删除这条留言吗？此操作不可恢复。")) return;
    const reason = window.prompt(`${label}原因`, action === "restore" ? "复核后恢复公开" : "依据公共大厅规则处理") ?? "";
    if (!reason) return;
    setStatus(`正在${label}留言…`);
    const response = await fetch("/api/lobby/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(key ? { "X-Serkon-Admin-Key": key } : {}) },
      body: JSON.stringify({ messageId, action, reason }),
    });
    const payload = await response.json() as { error?: string };
    if (!response.ok) {
      setStatus(payload.error || "管理操作失败");
      return;
    }
    setStatus(`${label}完成`);
    await load(key);
  }

  return <section className="lobby-admin-console">
    {!authorized && <form onSubmit={(event) => { event.preventDefault(); void load(key); }}><label><span>国内版站长密钥</span><input type="password" value={key} onChange={(event) => setKey(event.target.value)} autoComplete="current-password" /></label><button type="submit">验证并进入</button><p>原个人网站中，站长登录身份也可直接通过验证；密钥只保存在当前标签页。</p></form>}
    <p className="lobby-admin-status" aria-live="polite">{status}</p>
    {authorized && <div className="lobby-admin-list">{messages.map((message) => <article key={message.id}>
      <header><strong>{message.nickname}</strong><span>{message.visitorCode}</span><b className={`status-${message.status}`}>{message.status}</b><time>{formatLobbyTime(message.createdAt)}</time></header>
      <p>{message.body}</p>
      {message.moderationReason && <small>处理说明：{message.moderationReason}</small>}
      <footer><span>举报 {reports[message.id] ?? 0}</span>{message.status === "visible" ? <button type="button" onClick={() => void moderate(message.id, "hide")}>隐藏</button> : <button type="button" onClick={() => void moderate(message.id, "restore")}>恢复公开</button>}<button className="danger" type="button" onClick={() => void moderate(message.id, "delete")}>彻底删除</button></footer>
    </article>)}</div>}
  </section>;
}
