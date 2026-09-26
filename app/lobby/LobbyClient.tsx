"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatLobbyTime } from "./time";

type LobbyMessage = {
  id: string;
  visitorCode: string;
  nickname: string;
  body: string;
  replyTo: string | null;
  createdAt: number;
};

type LobbyPayload = {
  messages?: LobbyMessage[];
  message?: LobbyMessage | string;
  visitorCode?: string;
  total?: number;
  serverTime?: number;
  hasOlder?: boolean;
  onlineCount?: number;
  onlineWindowSeconds?: number;
  error?: string;
};

const QUICK_MESSAGES = ["你好，第一次路过这里。", "这个网站很有意思。", "愿你一直保持好奇。", "期待看到下一次更新。"];
const REPORT_REASONS = ["个人信息", "骚扰攻击", "广告引流", "不适内容", "其他"];

function mergeMessages(current: LobbyMessage[], incoming: LobbyMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((left, right) => left.createdAt - right.createdAt);
}

export default function LobbyClient() {
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [visitorCode, setVisitorCode] = useState("CN------");
  const [nickname, setNickname] = useState("");
  const [draft, setDraft] = useState("");
  const [accepted, setAccepted] = useState(true);
  const [replyTo, setReplyTo] = useState<LobbyMessage | null>(null);
  const [reportTarget, setReportTarget] = useState<LobbyMessage | null>(null);
  const [status, setStatus] = useState("正在接入全站公共频道…");
  const [total, setTotal] = useState(0);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const latestTimeRef = useRef(0);
  const earliestTimeRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const acceptanceRef = useRef<HTMLInputElement>(null);

  const messageById = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);

  const loadMessages = useCallback(async (mode: "initial" | "poll" | "older" = "initial") => {
    try {
      const params = new URLSearchParams();
      if (mode === "poll" && latestTimeRef.current) params.set("since", String(latestTimeRef.current));
      if (mode === "older" && earliestTimeRef.current) params.set("before", String(earliestTimeRef.current));
      const response = await fetch(`/api/lobby${params.size ? `?${params}` : ""}`, { cache: "no-store" });
      const payload = await response.json() as LobbyPayload;
      if (!response.ok) throw new Error(payload.error || "大厅暂时无法连接");
      const incoming = payload.messages ?? [];
      if (incoming.length) {
        setMessages((current) => mergeMessages(current, incoming));
        latestTimeRef.current = Math.max(latestTimeRef.current, ...incoming.map((message) => message.createdAt));
        const incomingEarliest = Math.min(...incoming.map((message) => message.createdAt));
        earliestTimeRef.current = earliestTimeRef.current
          ? Math.min(earliestTimeRef.current, incomingEarliest)
          : incomingEarliest;
      }
      if (payload.visitorCode) setVisitorCode(payload.visitorCode);
      if (typeof payload.total === "number") setTotal(payload.total);
      if (typeof payload.onlineCount === "number") setOnlineCount(payload.onlineCount);
      if (mode !== "poll") setHasOlder(Boolean(payload.hasOlder));
      if (mode === "poll" && incoming.length) {
        setTotal((current) => current + incoming.length);
        setStatus(`收到 ${incoming.length} 条新留言`);
      } else if (mode === "initial") {
        setStatus(incoming.length ? "公共频道已连接" : "你可以成为第一个留下声音的人");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "大厅暂时无法连接");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedName = window.localStorage.getItem("serkon_lobby_nickname");
    if (savedName) window.setTimeout(() => setNickname(savedName), 0);
    const initialTimer = window.setTimeout(() => void loadMessages("initial"), 0);
    return () => window.clearTimeout(initialTimer);
  // Initial load intentionally runs once; polling below reads the latest timestamp ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const startPolling = () => {
      if (timer) window.clearInterval(timer);
      if (!document.hidden) timer = window.setInterval(() => void loadMessages("poll"), 30_000);
    };
    const handleVisibilityChange = () => {
      startPolling();
      if (!document.hidden) void loadMessages("poll");
    };
    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadMessages]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    if (Array.from(draft.trim()).length < 2) {
      setStatus("请先写至少 2 个字，再发送到公共频道");
      draftRef.current?.focus();
      return;
    }
    if (!accepted) {
      setStatus("还差最后一步：请勾选“公开展示且不能自行删除”");
      acceptanceRef.current?.focus();
      return;
    }
    setSending(true);
    setStatus("正在把留言写入公共频道…");
    try {
      const response = await fetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "post", nickname, message: draft, replyTo: replyTo?.id ?? null, accepted }),
      });
      const payload = await response.json() as LobbyPayload;
      if (!response.ok || typeof payload.message === "string") throw new Error(payload.error || "留言没有发送成功");
      if (payload.message) {
        setMessages((current) => mergeMessages(current, [payload.message as LobbyMessage]));
        latestTimeRef.current = Math.max(latestTimeRef.current, (payload.message as LobbyMessage).createdAt);
        if (!earliestTimeRef.current) earliestTimeRef.current = (payload.message as LobbyMessage).createdAt;
      }
      const cleanName = nickname.trim();
      if (cleanName) window.localStorage.setItem("serkon_lobby_nickname", cleanName);
      setDraft("");
      setReplyTo(null);
      setTotal((current) => current + 1);
      setStatus("留言已公开并锁定 ✓");
      window.setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "留言没有发送成功");
    } finally {
      setSending(false);
    }
  }

  async function reportMessage(reason: string) {
    if (!reportTarget) return;
    setStatus("正在提交举报…");
    try {
      const response = await fetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report", messageId: reportTarget.id, reason }),
      });
      const payload = await response.json() as LobbyPayload;
      if (!response.ok) throw new Error(payload.error || "举报没有提交成功");
      setStatus("举报已交给站长处理");
      setReportTarget(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "举报没有提交成功");
    }
  }

  return (
    <section className="lobby-console" aria-labelledby="world-channel-title">
      <div className="lobby-console-bar">
        <div><span className="lobby-signal" aria-hidden="true" /><strong id="world-channel-title">世界频道</strong><small>全站共享 · 准实时更新</small><span className="lobby-online-count" aria-live="polite" aria-label={onlineCount === null ? "在线人数正在连接" : `当前在线 ${onlineCount} 人`} title="按最近 2 分钟内保持页面活跃的匿名访客统计"><i aria-hidden="true" /><span>实时在线</span><b>{onlineCount ?? "—"}</b><em>人</em></span></div>
        <div><span>访客编号</span><b>{visitorCode}</b><span>已读取 / 全部</span><b>{messages.length} / {total}</b></div>
      </div>

      <div className="lobby-system-message" role="note">
        <span>系统公告</span>
        <p>欢迎来到 Serkon 公共大厅。在线数字来自真实活跃访客，不要求真实姓名；请不要发布联系方式或他人隐私。</p>
      </div>

      <div className="lobby-message-list" ref={listRef} aria-busy={loading} aria-live="polite">
        {hasOlder && <button className="lobby-load-older" type="button" onClick={() => void loadMessages("older")}>继续读取更早留言（历史不会自动消失）</button>}
        {!loading && messages.length === 0 && <div className="lobby-empty"><strong>频道现在很安静。</strong><p>你留下第一句话以后，这里就不再是一间空房。</p></div>}
        {messages.map((message) => {
          const parent = message.replyTo ? messageById.get(message.replyTo) : null;
          return <article className="lobby-message" key={message.id}>
            <div className="lobby-avatar" aria-hidden="true">{message.nickname.slice(0, 1).toUpperCase()}</div>
            <div className="lobby-message-main">
              <header><strong>{message.nickname}</strong><span>{message.visitorCode}</span><time dateTime={new Date(message.createdAt).toISOString()} title="北京时间，精确到秒">{formatLobbyTime(message.createdAt)}</time></header>
              {message.replyTo && <p className="lobby-reply-context">回复 {parent ? `${parent.nickname}：${parent.body.slice(0, 32)}` : "一条较早的留言"}</p>}
              <p className="lobby-message-body">{message.body}</p>
              <div className="lobby-message-actions"><button type="button" onClick={() => { setReplyTo(message); setDraft((current) => current || `@${message.nickname} `); }}>回复</button><button type="button" onClick={() => setReportTarget(message)}>举报</button></div>
            </div>
          </article>;
        })}
      </div>

      {reportTarget && <div className="lobby-report-panel" role="dialog" aria-modal="false" aria-labelledby="report-title">
        <div><strong id="report-title">举报这条留言</strong><button type="button" onClick={() => setReportTarget(null)} aria-label="关闭举报面板">×</button></div>
        <p>{reportTarget.nickname}：{reportTarget.body}</p>
        <div>{REPORT_REASONS.map((reason) => <button type="button" key={reason} onClick={() => void reportMessage(reason)}>{reason}</button>)}</div>
      </div>}

      <form className="lobby-composer" onSubmit={sendMessage}>
        {replyTo && <div className="lobby-replying"><span>正在回复 {replyTo.nickname}</span><button type="button" onClick={() => setReplyTo(null)}>取消回复</button></div>}
        <div className="lobby-quick-messages" aria-label="快捷留言">{QUICK_MESSAGES.map((message) => <button type="button" key={message} onClick={() => setDraft(message)}>{message}</button>)}</div>
        <div className="lobby-fields">
          <label><span>公开昵称</span><input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={12} placeholder={`默认：访客-${visitorCode.slice(-4)}`} autoComplete="nickname" /></label>
          <label className="lobby-message-field"><span>留言内容</span><textarea ref={draftRef} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={120} rows={4} placeholder="想说什么，就在这里留下一句。不要填写手机号、邮箱、微信或其他私人信息。" /><small>{Array.from(draft).length} / 120</small></label>
        </div>
        <label className={`lobby-lock-confirm ${accepted ? "is-confirmed" : ""}`}><input ref={acceptanceRef} type="checkbox" checked={accepted} onChange={(event) => { setAccepted(event.target.checked); if (event.target.checked) setStatus("确认完成，现在可以发送留言"); }} /><span><b>发送前确认</b>：我知道这条内容会公开展示，发布后不能由我自行编辑或删除。</span></label>
        <div className="lobby-submit-row"><p aria-live="polite">{status}</p><button type="submit" disabled={sending}>{sending ? "发送中…" : "发送到世界频道 ↗"}</button></div>
      </form>
    </section>
  );
}
