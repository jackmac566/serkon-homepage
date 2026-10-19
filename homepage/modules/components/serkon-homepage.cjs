
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SerkonHomepage;
const React = __importStar(require("react"));
const glass_headline_hero_1 = __importDefault(require("./ui/glass-headline-hero"));
const stack_spread_1 = __importDefault(require("./ui/stack-spread"));
const icons_1 = require("./ui/icons");
const serkon_experience_1 = require("../data/serkon-experience");
const covers_1 = require("../data/covers");
const WorkGallery = require("./work-gallery").default;
const QuickIndex = require("./quick-index").default;
function safeGet(key) { try {
    return localStorage.getItem(key);
}
catch {
    return null;
} }
function safeSet(key, value) { try {
    localStorage.setItem(key, value);
}
catch { /* Current-session controls remain functional. */ } }
function usePreferences() {
    const [lang, setLang] = React.useState('zh');
    const [userStatic, setUserStatic] = React.useState(false);
    const [systemStatic, setSystemStatic] = React.useState(false);
    const [hostStatic, setHostStatic] = React.useState(false);
    React.useEffect(() => {
        const root = document.documentElement;
        root.classList.add('se-experience-mounted');
        const saved = safeGet('serkon_language_v1') ?? safeGet('serkon_experience_language');
        const initialLanguage = root.dataset.language === 'en' || (!root.dataset.language && saved === 'en') ? 'en' : 'zh';
        setLang(initialLanguage);
        safeSet('serkon_language_v1', initialLanguage);
        root.lang = initialLanguage === 'zh' ? 'zh-CN' : 'en';
        root.dataset.language = initialLanguage;
        try {
            const savedAccess = JSON.parse(safeGet('serkon_accessibility_v1') || 'null');
            if (savedAccess && [1, 1.15, 1.3].includes(savedAccess.scale)
                && ['contrast', 'reducedMotion', 'underlineLinks'].every(key => typeof savedAccess[key] === 'boolean')) {
                root.style.setProperty('--a11y-zoom', String(savedAccess.scale));
                root.dataset.a11yFont = String(savedAccess.scale);
                root.dataset.a11yContrast = savedAccess.contrast ? 'more' : 'normal';
                root.dataset.a11yMotion = savedAccess.reducedMotion ? 'reduce' : 'normal';
                root.dataset.a11yLinks = savedAccess.underlineLinks ? 'underline' : 'normal';
            }
        } catch { /* Ignore malformed or unavailable stored preferences. */ }
        setUserStatic(safeGet('serkon_experience_static') === 'true');
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const read = () => setSystemStatic(mq.matches);
        read();
        mq.addEventListener('change', read);
        const readHost = () => { setHostStatic(root.dataset.a11yMotion === 'reduce'); if (root.dataset.language)
            setLang(root.dataset.language === 'en' ? 'en' : 'zh'); };
        readHost();
        const observer = new MutationObserver(readHost);
        observer.observe(root, { attributes: true, attributeFilter: ['data-language', 'data-a11y-motion'] });
        return () => { root.classList.remove('se-experience-mounted'); mq.removeEventListener('change', read); observer.disconnect(); };
    }, []);
    const changeLanguage = () => {
        const next = lang === 'zh' ? 'en' : 'zh';
        setLang(next);
        safeSet('serkon_language_v1', next);
        const hostButtons = document.querySelectorAll('.language-control button');
        if (hostButtons.length === 2)
            hostButtons[next === 'zh' ? 0 : 1].click();
        else {
            document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
            document.documentElement.dataset.language = next;
        }
    };
    const toggleStatic = () => { setUserStatic(v => { safeSet('serkon_experience_static', String(!v)); return !v; }); };
    return { lang, changeLanguage, reduced: systemStatic || hostStatic || userStatic, toggleStatic, forcedStatic: systemStatic || hostStatic };
}
function SectionHeading({ index, eyebrow, title, description }) {
    return React.createElement("div", { className: "se-section-heading" },
        React.createElement("div", null,
            React.createElement("span", { className: "se-kicker" },
                index,
                " / ",
                eyebrow),
            React.createElement("h2", null, title)),
        description && React.createElement("p", null, description));
}
function DetailDialog({ value, lang, preview, onClose, onNavigate }) {
    const ref = React.useRef(null);
    const [fromOriginal, setFromOriginal] = React.useState(false);
    const [imageState, setImageState] = React.useState('loading');
    const item = value.kind === 'project' ? serkon_experience_1.projects[value.index] : serkon_experience_1.archiveItems[value.index];
    const project = value.kind === 'project' ? serkon_experience_1.projects[value.index] : null;
    const sourceImage = project?.image || (value.kind === 'archive' ? serkon_experience_1.archiveItems[value.index].sourceImage : undefined);
    const title = item.title[lang];
    const cover = project?.tone || serkon_experience_1.archiveItems[value.index]?.cover || 'profile';
    React.useEffect(() => {
        const dialog = ref.current;
        if (!dialog)
            return;
        const before = document.activeElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialog.showModal();
        return () => { dialog.close(); document.body.style.overflow = overflow; if (before?.isConnected)
            before.focus({ preventScroll: true }); };
    }, []);
    React.useEffect(() => { setFromOriginal(false); setImageState('loading'); ref.current?.querySelector('.se-dialog-copy')?.scrollTo(0, 0); }, [value.kind, value.index]);
    return React.createElement("dialog", { ref: ref, className: "se-dialog", "aria-labelledby": "se-dialog-title", onCancel: onClose, onClick: e => { if (e.target === e.currentTarget)
            onClose(); }, onKeyDown: e => { if (value.kind === 'archive' && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            onNavigate((value.index + (e.key === 'ArrowLeft' ? -1 : 1) + serkon_experience_1.archiveItems.length) % serkon_experience_1.archiveItems.length);
        } } },
        React.createElement("div", { className: "se-dialog-inner" },
            React.createElement("button", { className: "se-dialog-close se-icon-button", type: "button", onClick: onClose, "aria-label": lang === 'zh' ? '关闭详情' : 'Close details', autoFocus: true },
                React.createElement(icons_1.Icon, { name: "close" })),
            React.createElement("div", { className: "se-dialog-art" },
                fromOriginal && sourceImage ? React.createElement(React.Fragment, null,
                    React.createElement("img", { key: sourceImage, className: "se-original-image", src: (0, serkon_experience_1.resolveHref)(sourceImage, preview), alt: title, onLoad: () => setImageState('loaded'), onError: () => setImageState('error'), style: { visibility: imageState === 'loaded' ? 'visible' : 'hidden' } }),
                    imageState !== 'loaded' && React.createElement("div", { className: "se-image-message", role: "status" },
                        React.createElement(icons_1.Icon, { name: "image", size: 30 }),
                        React.createElement("p", null, imageState === 'loading' ? (lang === 'zh' ? '正在读取原站素材…' : 'Loading original material…') : (lang === 'zh' ? '原站素材暂未加载' : 'Original material could not be loaded')),
                        React.createElement("a", { href: (0, serkon_experience_1.resolveHref)(sourceImage, preview), target: "_blank", rel: "noopener noreferrer" },
                            lang === 'zh' ? '在原站打开' : 'Open at the original site',
                            " \u2197"))) : React.createElement("img", { src: (0, covers_1.coverUri)(cover), alt: lang === 'zh' ? '为本次改版制作的档案封面' : 'Editorial cover created for this redesign', width: "600", height: "800" }),
                React.createElement("div", { className: "se-art-controls" }, sourceImage ? React.createElement("button", { type: "button", onClick: () => { setFromOriginal(v => !v); setImageState('loading'); } },
                    React.createElement(icons_1.Icon, { name: "image", size: 16 }),
                    fromOriginal ? (lang === 'zh' ? '返回设计封面' : 'Show editorial cover') : (lang === 'zh' ? '查看原始素材' : 'View original material')) : React.createElement("span", null, lang === 'zh' ? '改版视觉索引 · 非原始截图' : 'EDITORIAL INDEX · NOT A SCREENSHOT'))),
            React.createElement("div", { className: "se-dialog-copy" },
                React.createElement("span", { className: "se-kicker" }, project ? project.label : serkon_experience_1.archiveItems[value.index].eyebrow),
                React.createElement("h2", { id: "se-dialog-title" }, title),
                React.createElement("p", { className: "se-dialog-lead" }, project ? project.copy[lang] : serkon_experience_1.archiveItems[value.index].description[lang]),
                project && React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "se-dialog-rule" }),
                    React.createElement("h3", null, lang === 'zh' ? '项目要解决什么' : 'The brief'),
                    React.createElement("p", null, project.brief[lang]),
                    React.createElement("h3", null, lang === 'zh' ? '创作过程' : 'The process'),
                    React.createElement("ol", null, project.process.map((s, i) => React.createElement("li", { key: i }, s[lang]))),
                    React.createElement("h3", null, lang === 'zh' ? '当前成果' : 'Current result'),
                    React.createElement("p", null, project.result[lang]),
                    React.createElement("div", { className: "se-tags" }, project.tags.map(t => React.createElement("span", { key: t.en }, t[lang])))),
                React.createElement("a", { className: "se-button se-button-dark", href: (0, serkon_experience_1.resolveHref)(item.href, preview), ...(0, serkon_experience_1.externalProps)((0, serkon_experience_1.resolveHref)(item.href, preview)) },
                    lang === 'zh' ? '打开真实项目 / 档案' : 'Open the real project / archive',
                    React.createElement(icons_1.Icon, { name: "northeast", size: 18 })),
                sourceImage && React.createElement("a", { className: "sx-original-link", href: (0, serkon_experience_1.resolveHref)(sourceImage, preview), target: "_blank", rel: "noopener noreferrer" }, lang === 'zh' ? '打开原始素材 ↗' : 'Open original material ↗'),
                React.createElement("small", { className: "se-dialog-note" }, lang === 'zh' ? '内容取自原站公开档案；外部作品在新标签页打开。' : 'Content is based on the original public archive. External work opens in a new tab.'),
                value.kind === 'archive' && React.createElement("div", { className: "se-dialog-pagination" },
                    React.createElement("button", { type: "button", onClick: () => onNavigate((value.index - 1 + serkon_experience_1.archiveItems.length) % serkon_experience_1.archiveItems.length), "aria-label": lang === 'zh' ? '上一张档案' : 'Previous archive' },
                        React.createElement(icons_1.Icon, { name: "arrow", style: { transform: 'rotate(180deg)' } })),
                    React.createElement("span", null,
                        String(value.index + 1).padStart(2, '0'),
                        " / 08"),
                    React.createElement("button", { type: "button", onClick: () => onNavigate((value.index + 1) % serkon_experience_1.archiveItems.length), "aria-label": lang === 'zh' ? '下一张档案' : 'Next archive' },
                        React.createElement(icons_1.Icon, { name: "arrow" }))))));
}
function MobileNavigation({ lang, onClose, preview }) {
    const ref = React.useRef(null);
    React.useEffect(() => { const d = ref.current; const before = document.activeElement; const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; d?.showModal(); return () => { d?.close(); document.body.style.overflow = overflow; before?.focus({ preventScroll: true }); }; }, []);
    const items = [['#works', '作品案例', 'Selected work'], ['#archive', '个人档案', 'Personal archive'], ['#about', '关于我', 'About me'], ['#spaces', '互动空间', 'Explore & play'], ['/notes', '站长随笔', 'Notes'], ['#contact', '保持联系', 'Get in touch']];
    return React.createElement("dialog", { className: "se-mobile-dialog", ref: ref, "aria-label": lang === 'zh' ? '网站导航' : 'Site navigation', onCancel: onClose },
        React.createElement("div", { className: "se-mobile-dialog-head" },
            React.createElement("span", null, "SERKON / INDEX"),
            React.createElement("button", { type: "button", className: "se-icon-button", onClick: onClose, autoFocus: true, "aria-label": lang === 'zh' ? '关闭导航' : 'Close navigation' },
                React.createElement(icons_1.Icon, { name: "close" }))),
        React.createElement("nav", null, items.map(([href, zh, en], i) => React.createElement("a", { key: href, href: (0, serkon_experience_1.resolveHref)(href, preview), onClick: onClose, ...(0, serkon_experience_1.externalProps)((0, serkon_experience_1.resolveHref)(href, preview)) },
            React.createElement("small", null,
                "0",
                i + 1),
            lang === 'zh' ? zh : en,
            React.createElement(icons_1.Icon, { name: "northeast", size: 25 })))),
        React.createElement("p", null, "CURIOUS \u00B7 CREATIVE \u00B7 OPEN"));
}
function SerkonHomepage({ preview = false, sourceEdition = 35 }) {
    const { lang, changeLanguage, reduced, toggleStatic, forcedStatic } = usePreferences();
    const [quickOpen, setQuickOpen] = React.useState(false);
    const [dialog, setDialog] = React.useState(null), [mobileMenu, setMobileMenu] = React.useState(false), [toast, setToast] = React.useState(''), [playing, setPlaying] = React.useState(false), [scrolled, setScrolled] = React.useState(false);
    const audioRef = React.useRef(null), toastTimer = React.useRef(null);
    const t = (zh, en) => lang === 'zh' ? zh : en;
    const href = (url) => (0, serkon_experience_1.resolveHref)(url, preview);
    React.useEffect(() => { const watch = () => setScrolled(window.scrollY > 40); watch(); window.addEventListener('scroll', watch, { passive: true }); return () => window.removeEventListener('scroll', watch); }, []);
    React.useEffect(() => () => { if (toastTimer.current)
        clearTimeout(toastTimer.current); }, []);
    function notify(message) { setToast(message); if (toastTimer.current)
        clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 4200); }
    async function copy(value) { try {
        if (!navigator.clipboard?.writeText)
            throw new Error('Clipboard is unavailable');
        await navigator.clipboard.writeText(value);
        notify(t('已复制，可直接粘贴。', 'Copied to clipboard.'));
    }
    catch {
        notify(t('未能自动复制，请选择下方文字手动复制。', 'Automatic copy unavailable. Select and copy the text below.'));
    } }
    async function toggleMusic() { const a = audioRef.current; if (!a)
        return; if (!a.paused) {
        a.pause();
        setPlaying(false);
        return;
    } try {
        await a.play();
        setPlaying(true);
    }
    catch {
        setPlaying(false);
        notify(t('音乐未能加载；可在作品详情打开网易云音乐。', 'Audio could not load. Open the NetEase link in the music project.'));
    } }
    React.useEffect(() => {
        const keydown = event => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !dialog && !mobileMenu) {
                event.preventDefault(); setQuickOpen(value => !value);
            }
        };
        document.addEventListener('keydown', keydown);
        return () => document.removeEventListener('keydown', keydown);
    }, [dialog, mobileMenu]);
    return React.createElement("div", { className: "se-site", "data-no-translate": true, "data-reduced": reduced ? 'true' : 'false', lang: lang === 'zh' ? 'zh-CN' : 'en' },
        React.createElement("a", { className: "se-skip", href: "#se-main" }, t('跳到主要内容', 'Skip to content')),
        React.createElement("header", { className: "se-navigation", "data-scrolled": scrolled ? 'true' : 'false' },
            React.createElement("a", { className: "se-brand", href: "#home", "aria-label": "Serkon \u4FAF\u4E16\u5EB7" },
                React.createElement("span", { className: "se-brand-mark" },
                    "S",
                    React.createElement("span", null, "\u2726")),
                React.createElement("span", null,
                    "SERKON",
                    React.createElement("small", null, "\u4FAF\u4E16\u5EB7"))),
            React.createElement("nav", { className: "se-desktop-nav", "aria-label": t('主导航', 'Main navigation') },
                React.createElement("a", { href: "#works" },
                    t('作品', 'Work'),
                    React.createElement("span", null, String(serkon_experience_1.projects.length).padStart(2, '0'))),
                React.createElement("a", { href: "#archive" }, t('档案', 'Archive')),
                React.createElement("a", { href: "#about" }, t('关于', 'About')),
                React.createElement("a", { href: "#spaces" },
                    t('探索', 'Explore'),
                    React.createElement("span", null, "\u2197"))),
            React.createElement("div", { className: "se-nav-actions" },
                React.createElement("button", { type: "button", className: "sx-index-trigger", onClick: () => setQuickOpen(true), "aria-label": t('打开全站索引', 'Open site index'), "aria-keyshortcuts": "Meta+K Control+K" },
                    React.createElement("span", { "aria-hidden": "true" }, '⌘'), t('索引', 'Index'), React.createElement("kbd", null, 'K')),
                React.createElement("button", { className: "se-text-button se-language", type: "button", onClick: changeLanguage, "aria-label": t('切换到英语', 'Switch to Chinese') },
                    React.createElement(icons_1.Icon, { name: "globe", size: 15 }),
                    t('EN', '中文')),
                React.createElement("button", { className: "se-motion-toggle se-text-button", type: "button", onClick: toggleStatic, disabled: forcedStatic, "aria-pressed": reduced, title: t('切换动效与静态阅读', 'Switch motion / static reading') },
                    React.createElement("span", { className: "se-motion-bars", "aria-hidden": "true" },
                        React.createElement("i", null),
                        React.createElement("i", null),
                        React.createElement("i", null)),
                    reduced ? t('静态', 'STATIC') : t('动效', 'MOTION')),
                React.createElement("a", { className: "se-nav-contact", href: "#contact" },
                    t('聊聊想法', 'Let’s talk'),
                    React.createElement(icons_1.Icon, { name: "northeast", size: 16 })),
                React.createElement("button", { className: "se-mobile-toggle se-icon-button", type: "button", onClick: () => setMobileMenu(true), "aria-expanded": mobileMenu, "aria-label": t('打开导航菜单', 'Open navigation menu') },
                    React.createElement(icons_1.Icon, { name: "menu" })))),
        React.createElement("main", { id: "se-main" },
            React.createElement("div", { className: "se-hero-wrap", id: "home" },
                React.createElement(glass_headline_hero_1.default, { title: "SERKON", eyebrow: t('侯世康 · AI 与创作', 'HOU SHIKANG · AI & CREATION'), description: t('让好奇，成为作品。', 'Let curiosity become creation.'), primaryAction: { label: t('探索我的作品', 'Explore my work'), href: '#works' }, secondaryAction: { label: t('认识我', 'Meet Serkon'), href: '#about' }, colors: ['#0a141a', '#a18d64', '#82b2b0', '#214c65', '#d4dec8'], reducedMotion: reduced, height: "100svh", className: "se-glass" }),
                React.createElement("div", { className: "se-hero-side se-hero-side-left", "aria-hidden": "true" },
                    "INDEPENDENT MIND",
                    React.createElement("br", null),
                    "OPEN EXPLORATION"),
                React.createElement("div", { className: "se-hero-side se-hero-side-right", "aria-hidden": "true" },
                    "PERSONAL SPACE",
                    React.createElement("br", null),
                    "EST. IN CURIOSITY"),
                React.createElement("div", { className: "se-hero-footer" },
                    React.createElement("span", { className: "se-hero-index" },
                        "01 \u2014 HELLO, WORLD.",
                        React.createElement("small", null, t('大一在读，探索 AI 与创作的更多可能。', 'A university freshman exploring AI and creativity.'))),
                    React.createElement("a", { href: "#archive", className: "se-scroll-cue" },
                        React.createElement("span", null, t('继续向下探索', 'SCROLL TO DISCOVER')),
                        React.createElement(icons_1.Icon, { name: "down", size: 20 })),
                    React.createElement("span", { className: "se-hero-status" },
                        React.createElement("i", null),
                        t('保持好奇 · 持续成长', 'CURIOUS · ALWAYS GROWING')))),
            React.createElement("div", { className: "se-intro-strip" },
                React.createElement("span", null, "AI EXPLORATION"),
                React.createElement(icons_1.Icon, { name: "spark", size: 17 }),
                React.createElement("span", null, "VISUAL STORIES"),
                React.createElement(icons_1.Icon, { name: "spark", size: 17 }),
                React.createElement("span", null, "ORIGINAL SOUND"),
                React.createElement(icons_1.Icon, { name: "spark", size: 17 }),
                React.createElement("span", null, "REAL PROJECTS")),
            React.createElement(stack_spread_1.default, { cards: serkon_experience_1.archiveItems, lang: lang, reducedMotion: reduced, onOpen: index => setDialog({ kind: 'archive', index }) }),
            React.createElement(WorkGallery, { lang, onOpen: index => setDialog({ kind: 'project', index }) }),
            React.createElement("section", { className: "se-about se-section-pad", id: "about" },
                React.createElement(SectionHeading, { index: "04", eyebrow: "A LITTLE ABOUT ME", title: t('先做出第一版，', 'Make a first version.'), description: t('然后，在实践里继续认识世界，也认识自己。', 'Then keep discovering the world, and yourself, through the work.') }),
                React.createElement("div", { className: "se-about-grid" },
                    React.createElement("div", { className: "se-about-statement" },
                        React.createElement("span", { className: "se-about-quote-mark", "aria-hidden": "true" }, "\u201C"),
                        React.createElement("p", null,
                            t('保持好奇，', 'Stay curious.'),
                            React.createElement("br", null),
                            t('继续', 'Keep '),
                            React.createElement("em", null, t('创造。', 'creating.'))),
                        React.createElement("div", { className: "se-about-signature" },
                            React.createElement("span", null, "Serkon."),
                            React.createElement("small", null, "\u4FAF\u4E16\u5EB7 / A WORK IN PROGRESS"))),
                    React.createElement("div", { className: "se-about-copy" },
                        React.createElement("p", null, t('我是 Serkon 侯世康，目前是一名大一学生。会用 AI 做图、做内容和个人网页，把模糊的想法打磨成看得见、能分享的作品。', 'I’m Serkon / Hou Shikang, a first-year university student. I use AI for images, content and personal websites, turning vague ideas into work people can see and share.')),
                        React.createElement("p", null, t('我想很早就去尝试新的技术，更在意前所未见的想法。先做出第一版，再一路把它变得更好。', 'I want to explore new technologies early, and care about ideas I haven’t seen before. Make the first version, then keep making it better.')),
                        React.createElement("a", { className: "se-underlined-link", href: href('/serkon'), ...(0, serkon_experience_1.externalProps)(href('/serkon')) },
                            t('阅读完整个人档案', 'Read the full personal profile'),
                            React.createElement(icons_1.Icon, { name: "northeast", size: 18 })),
                        React.createElement("div", { className: "se-interest-chips" },
                            React.createElement("a", { href: href('/play'), ...(0, serkon_experience_1.externalProps)(href('/play')) }, t('AI 探索', 'AI exploration')),
                            React.createElement("a", { href: "https://pvp.qq.com/zlkdatasys/mct/d/play.shtml?browser=auto", target: "_blank", rel: "noopener noreferrer" }, t('王者荣耀', 'Honor of Kings')),
                            React.createElement("a", { href: href('/games/doudizhu'), ...(0, serkon_experience_1.externalProps)(href('/games/doudizhu')) }, t('扑克牌', 'Card games')),
                            React.createElement("a", { href: href('/life'), ...(0, serkon_experience_1.externalProps)(href('/life')) }, t('影像记录', 'Photo & moments'))))),
                React.createElement("div", { className: "se-now" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "se-dot-label" }, "NOW / IN PROGRESS"),
                        React.createElement("h3", null, t('此刻，正在推进。', 'Currently, in progress.'))),
                    React.createElement("div", { className: "se-now-list" }, serkon_experience_1.nowItems.map((item, i) => React.createElement("a", { key: item.href, href: href(item.href), ...(0, serkon_experience_1.externalProps)(href(item.href)) },
                        React.createElement("span", { className: "se-now-index" },
                            "0",
                            i + 1),
                        React.createElement("div", null,
                            React.createElement("strong", null, item.title[lang]),
                            React.createElement("p", null, item.copy[lang])),
                        React.createElement(icons_1.Icon, { name: "northeast", size: 19 })))))),
            React.createElement("section", { className: "se-spaces se-section-pad", id: "spaces" },
                React.createElement(SectionHeading, { index: "05", eyebrow: "COME IN. PLAY A LITTLE.", title: React.createElement(React.Fragment, null,
                        t('不只是浏览，', 'Not just a page.'),
                        React.createElement("br", null),
                        React.createElement("em", null, t('也可以参与。', 'A place to take part.'))), description: t('原有的互动空间，都还在。从一个感兴趣的入口，继续探索。', 'The original interactive spaces remain. Choose a doorway and explore further.') }),
                React.createElement("div", { className: "se-space-grid" }, serkon_experience_1.spaces.map(space => React.createElement("a", { className: 'se-space-card se-space-' + space.id, key: space.id, href: href(space.href), ...(0, serkon_experience_1.externalProps)(href(space.href)) },
                    React.createElement("div", { className: "se-space-top" },
                        React.createElement("span", null, space.index),
                        React.createElement("small", null, space.label),
                        React.createElement(icons_1.Icon, { name: "northeast", size: 21 })),
                    React.createElement("div", { className: "se-space-symbol", "aria-hidden": "true" }, space.id === 'cosmos' ? React.createElement("div", { className: "se-orbit" },
                        React.createElement("i", null),
                        React.createElement("i", null),
                        React.createElement("i", null),
                        React.createElement("b", null)) : space.id === 'play' ? React.createElement("div", { className: "se-playing-cards" },
                        React.createElement("i", null, "\u2660"),
                        React.createElement("i", null, "\u2726"),
                        React.createElement("i", null, "\u2665")) : space.id === 'lobby' ? React.createElement("div", { className: "se-speech" },
                        React.createElement("i", null, "HELLO."),
                        React.createElement("i", null, "\u4F60\u597D\uFF0C\u4E16\u754C\u3002")) : React.createElement("div", { className: "se-frame-icon" },
                        React.createElement("i", null),
                        React.createElement("i", null))),
                    React.createElement("h3", null, space.title[lang]),
                    React.createElement("p", null, space.copy[lang]),
                    React.createElement("span", { className: "se-space-entry" },
                        t('进入原站空间', 'Enter the original space'),
                        React.createElement(icons_1.Icon, { name: "arrow", size: 17 }))))),
                React.createElement("div", { className: "se-system-links" },
                    React.createElement("a", { href: href('/notes'), ...(0, serkon_experience_1.externalProps)(href('/notes')) },
                        t('站长随笔', 'Notes'),
                        " \u2197"),
                    React.createElement("a", { href: href('/system'), ...(0, serkon_experience_1.externalProps)(href('/system')) },
                        t('网站系统层', 'System layer'),
                        " \u2197"),
                    React.createElement("a", { href: href('/lite'), ...(0, serkon_experience_1.externalProps)(href('/lite')) },
                        t('纯文字版', 'Text-only version'),
                        " \u2197"),
                    React.createElement("a", { href: href('/updates'), ...(0, serkon_experience_1.externalProps)(href('/updates')) },
                        t('版本记录', 'Release history'),
                        " \u2197"))),
            React.createElement("section", { className: "se-contact se-section-pad", id: "contact" },
                React.createElement("span", { className: "se-kicker" }, "06 / GOOD THINGS START WITH A CONVERSATION"),
                React.createElement("div", { className: "se-contact-heading" },
                    React.createElement("h2", null,
                        t('下一个想法，', 'The next idea,'),
                        React.createElement("br", null),
                        React.createElement("em", null, t('一起聊聊。', 'let’s talk about it.'))),
                    React.createElement("a", { href: `mailto:${serkon_experience_1.CONTACT.email}?subject=${encodeURIComponent('约稿或合作咨询｜来自个人网站')}`, className: "se-contact-orb", "aria-label": t('给 Serkon 写邮件', 'Email Serkon') },
                        React.createElement(icons_1.Icon, { name: "northeast", size: 54 }))),
                React.createElement("p", { className: "se-contact-lead" }, t('接受私人定制与商用约稿：AI 视觉、产品宣传、个人网站和定制内容。按需求单独报价，先确认档期，再沟通交付与授权。', 'Open to personal and commercial commissions: AI visuals, product promotion, personal websites and custom content. Scope, availability, delivery and usage rights are agreed individually.')),
                React.createElement("div", { className: "se-contact-row" },
                    React.createElement("a", { className: "se-email", href: `mailto:${serkon_experience_1.CONTACT.email}` },
                        serkon_experience_1.CONTACT.email,
                        React.createElement(icons_1.Icon, { name: "northeast", size: 22 })),
                    React.createElement("div", { className: "se-contact-socials" },
                        React.createElement("button", { type: "button", onClick: () => copy(serkon_experience_1.CONTACT.wechat) },
                            React.createElement("small", null, "WECHAT"),
                            React.createElement("span", null,
                                serkon_experience_1.CONTACT.wechat,
                                React.createElement(icons_1.Icon, { name: "copy", size: 15 }))),
                        React.createElement("button", { type: "button", onClick: () => copy(serkon_experience_1.CONTACT.douyin) },
                            React.createElement("small", null, "DOUYIN"),
                            React.createElement("span", null,
                                serkon_experience_1.CONTACT.douyin,
                                React.createElement(icons_1.Icon, { name: "copy", size: 15 }))))))),
        React.createElement("footer", { className: "se-footer" },
            React.createElement("div", { className: "se-footer-top" },
                React.createElement("a", { className: "se-footer-wordmark", href: "#home" },
                    "SERKON",
                    React.createElement("span", null, "\u2726")),
                React.createElement("span", null, t('认真生活，保持好奇。', 'Live attentively. Stay curious.')),
                React.createElement("a", { href: "#home", className: "se-backtop" },
                    t('回到顶部', 'Back to top'),
                    React.createElement(icons_1.Icon, { name: "arrow", size: 19, style: { transform: 'rotate(-90deg)' } }))),
            React.createElement("div", { className: "se-footer-bottom" },
                React.createElement("span", null, "\u00A9 2026 Serkon \u4FAF\u4E16\u5EB7"),
                React.createElement("div", null,
                    React.createElement("a", { href: href('/privacy'), ...(0, serkon_experience_1.externalProps)(href('/privacy')) }, t('隐私与公开上传规则', 'Privacy & uploads')),
                    React.createElement("a", { href: href('/accessibility'), ...(0, serkon_experience_1.externalProps)(href('/accessibility')) }, t('无障碍', 'Accessibility')),
                    React.createElement("a", { href: href('/provenance'), ...(0, serkon_experience_1.externalProps)(href('/provenance')) }, t('内容来源', 'Sources')),
                    React.createElement("a", { href: href('/zero-cost'), ...(0, serkon_experience_1.externalProps)(href('/zero-cost')) }, t('0 元运营', 'Zero-cost principles')),
                    React.createElement("a", { href: "https://github.com/jackmac566/serkon-homepage", target: "_blank", rel: "noopener noreferrer" }, "GitHub \u2197"))),
            React.createElement("p", { className: "se-legal-note" },
                t('个人作品与创作交流站点。部分内容由 AI 辅助生成；公开上传影像需拥有授权，商用范围以双方确认内容为准。', 'Personal work and creative exchange. Some content is AI-assisted. Public uploads require permission; commercial use is subject to agreement.'),
                " ",
                React.createElement("a", { href: `mailto:${serkon_experience_1.CONTACT.backup}` },
                    t('备用邮箱', 'Backup email'),
                    ": ",
                    serkon_experience_1.CONTACT.backup)),
            preview && React.createElement("p", { className: "se-preview-note" }, t(`体验改版预览 · 内容基线第 ${sourceEdition} 版 · 未部署上线 · 外部空间与原始素材需联网`, `Experience preview · Content baseline edition ${sourceEdition} · Not deployed · Original spaces and media require a connection`))),
        React.createElement("div", { className: "se-sound-dock" },
            React.createElement("button", { type: "button", onClick: toggleMusic, "aria-pressed": playing, "aria-label": playing ? t('暂停创世纪', 'Pause Genesis') : t('播放创世纪，需要联网', 'Play Genesis, requires a connection') },
                React.createElement(icons_1.Icon, { name: playing ? 'pause' : 'play', size: 14 }),
                React.createElement("span", null, "GENESIS"),
                React.createElement("i", { className: playing ? 'is-playing' : '' },
                    React.createElement("b", null),
                    React.createElement("b", null),
                    React.createElement("b", null),
                    React.createElement("b", null))),
            React.createElement("audio", { ref: audioRef, src: href('/creation-fk.mp3'), preload: "none", onEnded: () => setPlaying(false), onPause: () => setPlaying(false), onError: () => { setPlaying(false); notify(t('音乐暂不可用，请到作品详情打开网易云。', 'Audio unavailable. Use the NetEase link in the project.')); } })),
        toast && React.createElement("div", { className: "se-toast", role: "status" },
            toast,
            React.createElement("button", { type: "button", onClick: () => setToast(''), "aria-label": t('关闭提示', 'Dismiss message') },
                React.createElement(icons_1.Icon, { name: "close", size: 16 }))),
        quickOpen && React.createElement(QuickIndex, {lang, preview, onClose: () => setQuickOpen(false), onOpenProject: index => setDialog({ kind: 'project', index })}),
        dialog && React.createElement(DetailDialog, { value: dialog, lang: lang, preview: preview, onClose: () => setDialog(null), onNavigate: index => setDialog({ kind: 'archive', index }) }),
        mobileMenu && React.createElement(MobileNavigation, { lang: lang, preview: preview, onClose: () => setMobileMenu(false) }));
}

