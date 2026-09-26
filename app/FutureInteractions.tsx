"use client";

import { useEffect, useRef } from "react";

const CHAPTERS = [
  ["home", "01 / 开场"],
  ["about", "02 / 关于我"],
  ["interests", "03 / 兴趣"],
  ["works", "04 / 作品"],
  ["play", "05 / 互动"],
  ["cosmos-entry", "06 / 动态"],
  ["lobby-entry", "07 / 大厅"],
  ["open-layer", "08 / 开放层"],
  ["contact", "09 / 联系"],
] as const;

function pointerPosition(element: HTMLElement, clientX: number, clientY: number) {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(rect.width, 1))),
    y: Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(rect.height, 1))),
  };
}

export default function FutureInteractions() {
  const progressRef = useRef<HTMLSpanElement>(null);
  const chapterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)");
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>("[data-motion-reveal]"));
    let frame = 0;
    let revealObserver: IntersectionObserver | null = null;
    const motionDisabled = () => reducedMotion.matches || root.dataset.a11yMotion === "reduce";

    const updateScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const maximum = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const progress = Math.max(0, Math.min(1, window.scrollY / maximum));
        progressRef.current?.style.setProperty("--page-progress", String(progress));
        progressRef.current?.parentElement?.setAttribute("aria-valuenow", String(Math.round(progress * 100)));

        const probe = window.scrollY + window.innerHeight * 0.32;
        let current: string = CHAPTERS[0][1];
        for (const [id, label] of CHAPTERS) {
          const section = document.getElementById(id);
          if (section && section.offsetTop <= probe) current = label;
        }
        if (chapterRef.current) chapterRef.current.textContent = current;
      });
    };

    const resetElement = (element: HTMLElement) => {
      element.style.removeProperty("--pointer-x");
      element.style.removeProperty("--pointer-y");
      element.style.removeProperty("--tilt-x");
      element.style.removeProperty("--tilt-y");
      element.style.removeProperty("--magnetic-x");
      element.style.removeProperty("--magnetic-y");
      element.removeAttribute("data-pointer-active");
    };

    const updatePointerSurface = (element: HTMLElement, clientX: number, clientY: number) => {
      const point = pointerPosition(element, clientX, clientY);
      element.style.setProperty("--pointer-x", `${Math.round(point.x * 100)}%`);
      element.style.setProperty("--pointer-y", `${Math.round(point.y * 100)}%`);
      element.setAttribute("data-pointer-active", "true");
      return point;
    };

    const pointerMove = (event: PointerEvent) => {
      if (motionDisabled() || coarsePointer.matches) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const fluid = target.closest<HTMLElement>("[data-fluid-text]");
      if (fluid) {
        updatePointerSurface(fluid, event.clientX, event.clientY);
      }

      const scan = target.closest<HTMLElement>("[data-photo-scan]");
      if (scan) {
        updatePointerSurface(scan, event.clientX, event.clientY);
      }

      const spotlight = target.closest<HTMLElement>("[data-spotlight]");
      if (spotlight) {
        updatePointerSurface(spotlight, event.clientX, event.clientY);
      }

      const signalSurface = target.closest<HTMLElement>("[data-signal-surface]");
      if (signalSurface) {
        updatePointerSurface(signalSurface, event.clientX, event.clientY);
      }

      const tilt = target.closest<HTMLElement>("[data-tilt]");
      if (tilt) {
        const point = pointerPosition(tilt, event.clientX, event.clientY);
        tilt.style.setProperty("--tilt-x", `${((point.x - 0.5) * 5).toFixed(2)}deg`);
        tilt.style.setProperty("--tilt-y", `${((0.5 - point.y) * 5).toFixed(2)}deg`);
      }

      const magnetic = target.closest<HTMLElement>("[data-magnetic]");
      if (magnetic) {
        const point = pointerPosition(magnetic, event.clientX, event.clientY);
        magnetic.style.setProperty("--magnetic-x", `${((point.x - 0.5) * 8).toFixed(2)}px`);
        magnetic.style.setProperty("--magnetic-y", `${((point.y - 0.5) * 8).toFixed(2)}px`);
      }
    };

    const pointerOut = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const next = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      for (const selector of ["[data-fluid-text]", "[data-photo-scan]", "[data-spotlight]", "[data-signal-surface]", "[data-tilt]", "[data-magnetic]"]) {
        const element = target.closest<HTMLElement>(selector);
        if (element && (!next || !element.contains(next))) resetElement(element);
      }
    };

    const revealEverything = () => {
      revealElements.forEach((element) => element.setAttribute("data-revealed", "true"));
    };

    const startRevealObserver = () => {
      if (motionDisabled() || !("IntersectionObserver" in window)) {
        revealEverything();
        return;
      }
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).setAttribute("data-revealed", "true");
          revealObserver?.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
      revealElements.forEach((element) => revealObserver?.observe(element));
    };

    const syncMotionPreference = () => {
      root.dataset.futureMotion = motionDisabled() ? "off" : "on";
      if (motionDisabled()) {
        document.querySelectorAll<HTMLElement>("[data-pointer-active], [data-tilt], [data-magnetic]").forEach(resetElement);
        revealEverything();
      }
    };
    const preferenceObserver = new MutationObserver(syncMotionPreference);

    syncMotionPreference();
    startRevealObserver();
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    document.addEventListener("pointermove", pointerMove, { passive: true });
    document.addEventListener("pointerout", pointerOut, { passive: true });
    reducedMotion.addEventListener("change", syncMotionPreference);
    preferenceObserver.observe(root, { attributes: true, attributeFilter: ["data-a11y-motion"] });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      document.removeEventListener("pointermove", pointerMove);
      document.removeEventListener("pointerout", pointerOut);
      reducedMotion.removeEventListener("change", syncMotionPreference);
      preferenceObserver.disconnect();
      revealObserver?.disconnect();
      delete root.dataset.futureMotion;
    };
  }, []);

  return <div className="future-progress" role="progressbar" aria-label="页面阅读进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
    <span ref={progressRef} aria-hidden="true" />
    <small ref={chapterRef} aria-hidden="true">01 / 开场</small>
  </div>;
}
