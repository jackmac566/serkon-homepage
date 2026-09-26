"use client";

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const data = { title: "Serkon 侯世康｜个人主页", text: "来看看 Serkon 的个人网站、互动实验和生活记录。", url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setCopied(false);
    }
  };
  return <button className="nav-share" type="button" onClick={share}>{copied ? "已复制" : "分享"} <span aria-hidden="true">↗</span></button>;
}
