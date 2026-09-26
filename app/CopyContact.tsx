"use client";

import { useState } from "react";

type Props = {
  label: string;
  value: string;
};

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

export default function CopyContact({ label, value }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const copy = async () => {
    try {
      await copyText(value);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 1800);
    }
  };

  return (
    <button className="contact-copy" type="button" onClick={copy} aria-label={`复制${label}：${value}`}>
      <b>{label}</b>
      <span>{value}</span>
      <small aria-live="polite">{status === "copied" ? "已复制 ✓" : status === "error" ? "复制失败，请手动选择" : "点击复制"}</small>
    </button>
  );
}
