
"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StackSpread;
/** Adapted from the user-supplied Hyperiux Vault Stack Spread interaction.
 * Preserves stack → scatter → pointer-depth parallax. Uses a scoped native RAF
 * driver instead of adding motion to the existing Next/Vinext dependency graph. */
const React = __importStar(require("react"));
const covers_1 = require("../../data/covers");
const icons_1 = require("./icons");
const positions = [
    { x: -31, y: -24, r: -7, s: .94, stackX: -17, stackY: -12, stackR: -17 },
    { x: 0, y: -32, r: 3, s: .9, stackX: 13, stackY: -7, stackR: 14 },
    { x: 32, y: -24, r: 8, s: 1, stackX: -10, stackY: 6, stackR: -9 },
    { x: -38, y: 9, r: -5, s: .82, stackX: 22, stackY: -3, stackR: 7 },
    { x: 38, y: 11, r: 5, s: .85, stackX: 0, stackY: 10, stackR: -4 },
    { x: -27, y: 33, r: 5, s: .88, stackX: -15, stackY: 10, stackR: 12 },
    { x: 0, y: 36, r: -3, s: .83, stackX: 7, stackY: 8, stackR: -5 },
    { x: 28, y: 33, r: -7, s: .89, stackX: 19, stackY: 13, stackR: 6 },
];
const clamp = (x, min = 0, max = 1) => Math.max(min, Math.min(max, x));
function StackSpread({ cards, lang, reducedMotion, onOpen }) {
    const rootRef = React.useRef(null), stageRef = React.useRef(null);
    const cardRefs = React.useRef([]), copyRef = React.useRef(null), meterRef = React.useRef(null);
    const [isSpread, setIsSpread] = React.useState(false);
    const [compact, setCompact] = React.useState(false), [grid, setGrid] = React.useState(false), [manual, setManual] = React.useState(null);
    const flat = compact || grid || reducedMotion;
    React.useEffect(() => { const mq = window.matchMedia('(max-width: 800px), (max-height: 520px)'); const update = () => setCompact(mq.matches); update(); mq.addEventListener('change', update); return () => mq.removeEventListener('change', update); }, []);
    React.useEffect(() => {
        const root = rootRef.current, stage = stageRef.current;
        if (!root || !stage)
            return;
        const cardsDOM = cardRefs.current;
        if (flat) {
            cardsDOM.forEach(c => { if (c) {
                c.style.transform = '';
                c.style.removeProperty('z-index');
            } });
            if (copyRef.current) {
                copyRef.current.style.opacity = '';
                copyRef.current.style.transform = '';
            }
            return;
        }
        let announced = null;
        let raf = 0, dead = false, inView = false, last = 0, desiredX = 0, desiredY = 0, x = 0, y = 0, p = 0, currentP = 0;
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        function geometry() { if (!root || !stage)
            return; const r = root.getBoundingClientRect(); p = manual ?? clamp((clamp(-r.top / Math.max(1, root.offsetHeight - stage.offsetHeight)) - .1) / .78); }
        function draw(now) {
            raf = 0;
            if (dead || document.hidden || !inView)
                return;
            const dt = Math.min((now - (last || now)) / 1000, .05);
            last = now;
            geometry();
            currentP += (p - currentP) * (1 - Math.exp(-dt * 14));
            if (Math.abs(p - currentP) < .001)
                currentP = p;
            x += (desiredX - x) * (1 - Math.exp(-dt * 7));
            y += (desiredY - y) * (1 - Math.exp(-dt * 7));
            const w = stage.clientWidth, h = Math.max(1, stage.clientHeight - 150);
            cardsDOM.forEach((card, i) => {
                if (!card)
                    return;
                const a = positions[i % positions.length];
                const d = .55 + i / (Math.max(1, cards.length - 1)) * .75;
                const xx = (a.stackX / 4) * (1 - currentP) + a.x * w / 100 * currentP - (currentP > .97 ? x * 13 * d : 0);
                const yy = (a.stackY / 4) * (1 - currentP) + a.y * h / 100 * currentP - (currentP > .97 ? y * 11 * d : 0);
                const rotate = a.stackR * (1 - currentP) + a.r * currentP;
                const scale = .98 + (a.s - .98) * currentP;
                card.style.transform = `translate(-50%, -50%) translate3d(${xx.toFixed(2)}px, ${yy.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
                card.style.zIndex = String(i + 2);
            });
            if (copyRef.current) {
                copyRef.current.style.opacity = String(clamp((currentP - .28) / .36));
                copyRef.current.style.transform = `translate(-50%,-50%) scale(${.94 + .06 * currentP})`;
            }
            if (meterRef.current)
                meterRef.current.style.transform = `scaleX(${currentP})`;
            root.dataset.progress = currentP > .99 ? 'spread' : currentP < .01 ? 'stacked' : 'spreading';
            if ((currentP > .5) !== announced) {
                announced = currentP > .5;
                setIsSpread(announced);
            }
            if (Math.abs(p - currentP) > .001 || Math.abs(desiredX - x) + Math.abs(desiredY - y) > .002)
                raf = requestAnimationFrame(draw);
        }
        function wake() { if (dead || raf || !inView || document.hidden)
            return; last = performance.now(); raf = requestAnimationFrame(draw); }
        function scroll() { geometry(); wake(); }
        function move(e) { if (!fine || p < .98)
            return; const r = stage.getBoundingClientRect(); desiredX = clamp((e.clientX - r.left) / r.width) * 2 - 1; desiredY = clamp((e.clientY - r.top) / r.height) * 2 - 1; wake(); }
        function leave() { desiredX = desiredY = 0; wake(); }
        const io = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView)
            wake();
        else {
            cancelAnimationFrame(raf);
            raf = 0;
        } }, { rootMargin: '60px' });
        io.observe(root);
        const ro = new ResizeObserver(scroll);
        ro.observe(stage);
        function visibility() { if (document.hidden) {
            cancelAnimationFrame(raf);
            raf = 0;
        }
        else
            wake(); }
        window.addEventListener('scroll', scroll, { passive: true });
        stage.addEventListener('pointermove', move, { passive: true });
        stage.addEventListener('pointerleave', leave);
        document.addEventListener('visibilitychange', visibility);
        geometry();
        currentP = p;
        inView = true;
        wake();
        return () => { dead = true; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); window.removeEventListener('scroll', scroll); stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', leave); document.removeEventListener('visibilitychange', visibility); };
    }, [flat, manual, cards.length]);
    function setLayout() { const at = rootRef.current?.getBoundingClientRect().top ?? 0; setGrid(!grid); setManual(null); if (at < 0)
        requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })); }
    return React.createElement("section", { id: "archive", className: "se-archive", ref: rootRef, "data-layout": flat ? 'grid' : 'scroll', "aria-labelledby": "se-archive-title" },
        React.createElement("div", { className: "se-archive-stage", ref: stageRef },
            React.createElement("div", { className: "se-archive-head" },
                React.createElement("span", { className: "se-kicker" }, "02 / THE PERSONAL ARCHIVE"),
                React.createElement("div", { className: "se-archive-tools" },
                    !flat && React.createElement("button", { type: "button", className: "se-tiny-button", onClick: () => setManual(isSpread ? 0 : 1), "aria-pressed": isSpread, "aria-label": lang === 'zh' ? '展开或聚拢档案卡片' : 'Spread or gather archive cards' },
                        React.createElement(icons_1.Icon, { name: isSpread ? 'copy' : 'spark', size: 14 }),
                        isSpread ? (lang === 'zh' ? '聚拢' : 'Gather') : (lang === 'zh' ? '展开' : 'Spread')),
                    !compact && !reducedMotion && React.createElement("button", { type: "button", className: "se-tiny-button", onClick: setLayout, "aria-pressed": grid },
                        React.createElement(icons_1.Icon, { name: "grid", size: 14 }),
                        grid ? (lang === 'zh' ? '滚动体验' : 'Scroll view') : (lang === 'zh' ? '平铺查看' : 'Grid view')))),
            React.createElement("div", { className: "se-archive-copy", ref: copyRef },
                React.createElement("span", { className: "se-dot-label" }, "MANY SIDES. ONE MIND."),
                React.createElement("h2", { id: "se-archive-title" }, lang === 'zh' ? React.createElement(React.Fragment, null,
                    "\u4E0D\u6B62",
                    React.createElement("br", null),
                    React.createElement("em", null, "\u4E00\u4E2A\u9762\u3002")) : React.createElement(React.Fragment, null,
                    "More than",
                    React.createElement("br", null),
                    React.createElement("em", null, "one side."))),
                React.createElement("p", null,
                    lang === 'zh' ? 'AI、影像、音乐，与日常的好奇。' : 'AI, images, music, and everyday curiosity.',
                    React.createElement("br", null),
                    lang === 'zh' ? '每一张，都是认识我的另一个入口。' : 'Every card is another way in.')),
            React.createElement("div", { className: "se-spread-cards", role: "group", "aria-label": lang === 'zh' ? '八张个人档案卡片' : 'Eight personal archive cards' }, cards.map((card, i) => React.createElement("button", { type: "button", className: "se-spread-card", key: card.id, ref: el => { cardRefs.current[i] = el; }, onClick: () => onOpen(i), "aria-label": (lang === 'zh' ? '查看档案：' : 'Open archive: ') + card.title[lang] },
                React.createElement("img", { src: (0, covers_1.coverUri)(card.cover), alt: "", draggable: false, width: 600, height: 800 }),
                React.createElement("span", { className: "se-card-caption" },
                    React.createElement("b", null, card.title[lang]),
                    React.createElement(icons_1.Icon, { name: "northeast", size: 16 }))))),
            React.createElement("div", { className: "se-archive-foot" },
                React.createElement("span", null, flat ? (lang === 'zh' ? '点击卡片，打开档案' : 'Select a card to explore') : (lang === 'zh' ? '滚动展开 · 点击探索' : 'SCROLL TO SPREAD · CLICK TO EXPLORE')),
                !flat && React.createElement("div", { className: "se-spread-meter", "aria-hidden": "true" },
                    React.createElement("span", { ref: meterRef })),
                React.createElement("span", null, manual !== null && !flat ? React.createElement("button", { type: "button", onClick: () => setManual(null) },
                    lang === 'zh' ? '恢复滚动联动' : 'Follow scrolling',
                    " \u2197") : '08 / ARCHIVE ENTRIES'))));
}

