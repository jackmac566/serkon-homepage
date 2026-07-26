"use client";

import { useEffect, useRef, useState } from "react";

const links = [
  ["01", "关于我", "/#about"],
  ["02", "兴趣爱好", "/#interests"],
  ["03", "作品案例", "/#works"],
  ["04", "互动档案", "/play"],
  ["05", "动态思想档案", "/cosmos"],
  ["06", "公共大厅", "/lobby"],
  ["07", "网站系统层", "/system"],
  ["08", "版本记录", "/updates"],
  ["09", "纯文字版", "/lite"],
] as const;

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    document.documentElement.dataset.mobileMenu = open ? "open" : "closed";
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => () => {
    delete document.documentElement.dataset.mobileMenu;
  }, []);

  return (
    <details
      ref={detailsRef}
      className="mobile-menu"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary aria-label={open ? "关闭目录" : "打开目录"}>目录</summary>
      <button className="mobile-menu-backdrop" type="button" aria-label="关闭目录" onClick={() => setOpen(false)} />
      <nav aria-label="移动端目录">
        <header><small>SERKON / DIRECTORY</small><button type="button" onClick={() => setOpen(false)} aria-label="关闭目录">×</button></header>
        {links.map(([number, label, href]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}><small>{number}</small><span>{label}</span><b aria-hidden="true">↗</b></a>
        ))}
      </nav>
    </details>
  );
}
