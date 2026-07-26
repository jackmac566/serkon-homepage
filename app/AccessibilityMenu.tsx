"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type AccessPreferences = {
  scale: 1 | 1.15 | 1.3;
  contrast: boolean;
  reducedMotion: boolean;
  underlineLinks: boolean;
};

const STORAGE_KEY = "serkon_accessibility_v1";
const DEFAULTS: AccessPreferences = { scale: 1, contrast: false, reducedMotion: false, underlineLinks: false };

function validPreferences(value: unknown): value is AccessPreferences {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AccessPreferences>;
  return [1, 1.15, 1.3].includes(Number(item.scale))
    && typeof item.contrast === "boolean"
    && typeof item.reducedMotion === "boolean"
    && typeof item.underlineLinks === "boolean";
}

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<AccessPreferences>(DEFAULTS);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
      if (validPreferences(saved)) window.setTimeout(() => setPreferences(saved), 0);
    } catch {
      // Invalid local preferences are safely ignored.
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--a11y-zoom", String(preferences.scale));
    root.dataset.a11yFont = String(preferences.scale);
    root.dataset.a11yContrast = preferences.contrast ? "more" : "normal";
    root.dataset.a11yMotion = preferences.reducedMotion ? "reduce" : "normal";
    root.dataset.a11yLinks = preferences.underlineLinks ? "underline" : "normal";
  }, [preferences]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("button")?.focus(), 0);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function update(next: AccessPreferences) {
    setPreferences(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <div className="accessibility-control">
      {open && <div className="accessibility-panel" id="accessibility-panel" ref={panelRef} role="dialog" aria-modal="false" aria-labelledby="accessibility-title">
        <div className="accessibility-panel-head">
          <div><small>ACCESSIBILITY</small><strong id="accessibility-title">阅读辅助</strong></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="关闭阅读辅助面板">×</button>
        </div>
        <fieldset>
          <legend>页面缩放</legend>
          <div className="accessibility-scale-options">
            {([1, 1.15, 1.3] as const).map((scale) => <button type="button" key={scale} aria-pressed={preferences.scale === scale} onClick={() => update({ ...preferences, scale })}>{Math.round(scale * 100)}%</button>)}
          </div>
        </fieldset>
        <button className="accessibility-toggle" type="button" aria-pressed={preferences.contrast} onClick={() => update({ ...preferences, contrast: !preferences.contrast })}><span>增强对比度</span><b>{preferences.contrast ? "已开启" : "关闭"}</b></button>
        <button className="accessibility-toggle" type="button" aria-pressed={preferences.reducedMotion} onClick={() => update({ ...preferences, reducedMotion: !preferences.reducedMotion })}><span>减少动画</span><b>{preferences.reducedMotion ? "已开启" : "关闭"}</b></button>
        <button className="accessibility-toggle" type="button" aria-pressed={preferences.underlineLinks} onClick={() => update({ ...preferences, underlineLinks: !preferences.underlineLinks })}><span>链接加下划线</span><b>{preferences.underlineLinks ? "已开启" : "关闭"}</b></button>
        <div className="accessibility-panel-foot"><button type="button" onClick={() => update(DEFAULTS)}>恢复默认</button><Link href="/accessibility" onClick={() => setOpen(false)}>完整说明 →</Link></div>
      </div>}
      <button className="accessibility-launcher" type="button" aria-expanded={open} aria-controls="accessibility-panel" onClick={() => setOpen((current) => !current)}><span aria-hidden="true">人</span><strong>阅读辅助</strong></button>
    </div>
  );
}
