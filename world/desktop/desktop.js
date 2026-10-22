const $ = selector => document.querySelector(selector);
const workspace = $('#workspace'), layer = $('#windows'), tasks = $('#tasks');
const asset = name => new URL('../assets/' + name, location.href).href;
const HOME = 'https://serkon-homepage-cn.pages.dev/';
const SAMSY = 'https://samsy.ninja/';
const projects = [
  { title: '强鹰彩色胶', kind: '产品视觉与网站', href: 'https://qiangying-color-sealant-cn.pages.dev/', description: '126 色、硬支与软支两类规格，再到实际使用场景。把产品信息整理成一套统一的视觉和网站。', image: 'color.webp' },
  { title: '妙笔 AI', kind: '独立文案工作台', href: 'https://miaobi-appl-serkon.pages.dev/', description: '从想法到文字的独立工作台。这里连接到实际产品，可以直接打开看看。' },
  { title: '微信年轮', kind: '本地聊天记录工具', href: 'https://github.com/jackmac566/wechat-yearbook', description: '面向聊天记录的本地分析工具。源码、使用说明及持续完善的内容都在 GitHub 仓库中。' },
];
const photos = [
  ['portrait.jpg', '个人主页照片', '侯世康穿灰色西装的个人主页照片'],
  ['wave.jpg', '打个招呼', '侯世康举手打招呼的主页照片'],
  ['call.jpg', '有事，直接说', '侯世康做电话手势的主页照片'],
  ['polaroids.webp', '表情拼贴', '个人主页公开的拍立得表情拼贴'],
  ['london.webp', '影像工作区', '原站公开的伦敦 AI 影像工作区画面'],
  ['export.webp', '视频导出记录', '原站公开的视频导出工作记录'],
  ['genesis.webp', '创世纪', '原站公开的创世纪音乐发布画面'],
  ['first-build.webp', '第一次构建', '原站公开的首次构建记录'],
];
const apps = {
  home: { title: '我的主页 — Internet Explorer', label: '我的主页', icon: 'browser' },
  world: { label: '创作后院', icon: 'world' },
  samsy: { title: 'SAMSY — 互动小游戏', label: 'SAMSY', icon: 'ninja' },
  photos: { title: '照片 — 图片查看器', label: '照片', icon: 'photos' },
  music: { title: '创世纪 — 媒体播放器', label: '音乐', icon: 'music' },
  credits: { title: '关于电脑', label: '关于电脑', icon: 'info' },
  room: { label: '回到房间', icon: 'room' },
};
const windows = new Map();
let front = null, topZ = 10, opening = 0, hostActive = true, drag = null, popup = null;
const audio = new Audio(asset('genesis.mp3')); audio.preload = 'metadata'; audio.volume = .65;
let musicNotice = '点击播放，听一首《创世纪》。';
let lastMusicState = null;

function node(tag, attributes = {}, children = []) {
  const item = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') item.className = value;
    else if (key === 'text') item.textContent = value;
    else if (key === 'onClick') item.addEventListener('click', value);
    else item.setAttribute(key, value);
  }
  for (const child of Array.isArray(children) ? children : [children]) if (child !== null && child !== undefined) item.append(typeof child === 'string' ? document.createTextNode(child) : child);
  return item;
}
function link(text, href, className = '') { return node('a', { href, class: className, target: '_blank', rel: 'noopener noreferrer', text }); }
function announce(text) { $('#desktop-status').textContent = text; }
function icon(kind) {
  const holder = node('span', { class: 'icon-image', 'aria-hidden': 'true' });
  const drawings = {
    browser: '<path fill="#eee" stroke="#111" d="M4 5h28v24H4z"/><path fill="#000080" d="M5 6h26v5H5z"/><path fill="#fff" d="M7 14h22v12H7z"/><path fill="#008080" d="M10 16h16v3H10zm0 5h9v2h-9z"/><path stroke="#777" d="M8 31h20"/>',
    world: '<path fill="#d7c77c" stroke="#111" d="m4 14 14-8 14 8v17H4z"/><path fill="#488c5a" stroke="#173e27" d="m3 14 15-11 15 11z"/><path fill="#c2e1df" stroke="#111" d="M8 18h7v7H8zm14 0h6v7h-6z"/><path fill="#7a5137" stroke="#111" d="M16 21h5v10h-5z"/>',
    ninja: '<path fill="#111" stroke="#000" d="M10 3h16v4h4v20h-4v6H10v-6H6V7h4z"/><path fill="#dbd7c5" d="M9 12h18v8H9z"/><path fill="#141414" d="M12 14h3v3h-3zm9 0h3v3h-3z"/><path fill="#d8323e" d="M6 8h24v4H6zm23 1h5v4h-5zm1 4h4v7h-4z"/><path fill="#555" d="M11 25h14v2H11z"/>',
    photos: '<path fill="#999" stroke="#111" d="m3 9 26-5 5 25-26 5z"/><path fill="#fff" stroke="#111" d="M5 5h26v25H5z"/><path fill="#b8e5e8" d="M8 8h20v17H8z"/><path fill="#399263" d="m8 25 6-11 6 7 4-5 4 9z"/><path fill="#f4db79" d="M23 10h3v3h-3z"/>',
    music: '<path fill="#fff" stroke="#111" d="M7 3h18l5 6v23H7z"/><path fill="#c0c0c0" stroke="#111" d="M25 3v6h5"/><path fill="#000080" d="M18 11h8v13h-4V15h-4v12h-4V13h4z"/><path fill="#008080" d="M11 25h7v5h-7zm10-4h7v5h-7z"/>',
    info: '<path fill="#f4e8a4" stroke="#111" d="m6 3 23 1 3 28-25 1z"/><path fill="#000080" d="M16 8h5v5h-5zm0 8h5v11h-5z"/>',
    room: '<path fill="#e4dfc9" stroke="#111" d="M6 3h23v29H6z"/><path fill="#897453" stroke="#111" d="m9 5 15 3v23l-15-2z"/><path fill="#e9d386" d="M19 17h2v3h-2z"/><path stroke="#111" d="M3 33h29"/>',
    folder: '<path fill="#e8ce6f" stroke="#111" d="M3 9h13l3 4h14v18H3z"/><path fill="#fff0ac" stroke="#111" d="M3 14h30l-4 17H3z"/>',
  };
  holder.innerHTML = '<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' + (drawings[kind] || drawings.folder) + '</svg>';
  return holder;
}
function post(type) {
  pauseAudio();
  if (window.parent !== window) window.parent.postMessage({ source: 'serkon-desktop', type }, location.origin);
  else location.assign('../');
}
function launchApp(id, options = {}) {
  closeStart(); closePopup();
  if (id === 'world') { post('launchWorld'); return; }
  if (id === 'room') { post('desktopRequest'); return; }
  const existing = windows.get(id);
  if (existing) { existing.minimized = false; existing.element.hidden = false; focusWindow(existing); syncGame(existing); if (options.page) navigate(existing, options.page); return; }
  const app = apps[id], count = opening++;
  const width = id === 'samsy' ? 1040 : id === 'home' ? 940 : id === 'photos' ? 900 : id === 'music' ? 550 : 650;
  const height = id === 'samsy' ? 780 : id === 'home' ? 760 : id === 'photos' ? 680 : id === 'music' ? 430 : 560;
  const item = { id, ...app, x: Math.min(160 + count * 26, Math.max(8, innerWidth - width - 12)), y: Math.min(64 + count * 23, Math.max(8, innerHeight - height - 52)), width, height, minimized: false, maximized: false, history: ['home'], historyIndex: 0, photoIndex: 0 };
  item.element = node('section', { class: 'window', role: 'region', 'aria-label': app.title, tabindex: '-1' });
  if (id === 'samsy') item.element.classList.add('game-window');
  const titlebar = node('header', { class: 'titlebar' });
  titlebar.append(icon(app.icon), node('span', { class: 'window-title', text: app.title }));
  const buttons = node('div', { class: 'title-controls' });
  for (const [action, symbol, text] of [['minimize', '_', '最小化'], ['maximize', '□', '最大化或还原'], ['close', '×', '关闭']]) buttons.append(node('button', { type: 'button', text: symbol, 'aria-label': text + app.label, onClick: () => windowAction(item, action) }));
  titlebar.append(buttons); item.element.append(titlebar);
  titlebar.addEventListener('pointerdown', event => startDrag(item, titlebar, event));
  titlebar.addEventListener('dblclick', event => { if (!event.target.closest('button')) windowAction(item, 'maximize'); });
  item.element.addEventListener('pointerdown', () => focusWindow(item, false));
  item.body = node('div', { class: 'window-body' });
  item.status = node('footer', { class: 'statusbar', text: '完成' });
  if (id === 'home') buildBrowser(item);
  item.element.append(item.body, item.status);
  item.task = node('button', { type: 'button', class: 'task-button', 'aria-label': app.label, 'aria-pressed': 'false', onClick: () => {
    if (front === item && !item.minimized) windowAction(item, 'minimize');
    else { item.minimized = false; item.element.hidden = false; focusWindow(item); syncGame(item); }
  } }, [icon(app.icon), node('span', { text: app.label })]);
  tasks.append(item.task); layer.append(item.element); windows.set(id, item);
  placeWindow(item); renderWindow(item); focusWindow(item, !options.initial);
  if (options.page) navigate(item, options.page);
}
function focusWindow(item, takeFocus = true) {
  if (item.minimized) return;
  front = item; item.element.style.zIndex = ++topZ;
  for (const other of windows.values()) { const selected = other === item; other.element.classList.toggle('active', selected); other.task.classList.toggle('active', selected); other.task.setAttribute('aria-pressed', String(selected)); }
  if (takeFocus) item.element.focus({ preventScroll: true });
}
function placeWindow(item) {
  Object.assign(item.element.style, { left: item.x + 'px', top: item.y + 'px', width: item.width + 'px', height: item.height + 'px' });
  item.element.classList.toggle('maximized', item.maximized);
}
function windowAction(item, action) {
  closePopup();
  if (action === 'close') {
    if (item.id === 'music') pauseAudio();
    suspendGame(item);
    item.element.remove(); item.task.remove(); windows.delete(item.id); if (front === item) front = null;
    const next = [...windows.values()].filter(win => !win.minimized).sort((a, b) => Number(b.element.style.zIndex) - Number(a.element.style.zIndex))[0];
    if (next) focusWindow(next); announce('已关闭' + item.label); return;
  }
  if (action === 'minimize') { item.minimized = true; suspendGame(item); item.element.hidden = true; item.task.classList.remove('active'); item.task.setAttribute('aria-pressed', 'false'); if (front === item) { front = null; const next = [...windows.values()].filter(win => !win.minimized).sort((a, b) => Number(b.element.style.zIndex) - Number(a.element.style.zIndex))[0]; if (next) focusWindow(next); } announce('已最小化' + item.label); return; }
  if (action === 'maximize') { item.maximized = !item.maximized; placeWindow(item); focusWindow(item); }
}
function startDrag(item, titlebar, event) {
  if (event.button !== 0 || event.target.closest('button') || item.maximized || innerWidth <= 680) return;
  focusWindow(item, false); closePopup(); event.preventDefault();
  drag = { item, pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: item.x, top: item.y };
  titlebar.setPointerCapture(event.pointerId);
}
window.addEventListener('pointermove', event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const item = drag.item; item.x = Math.max(0, Math.min(innerWidth - 120, drag.left + event.clientX - drag.x)); item.y = Math.max(0, Math.min(workspace.clientHeight - 30, drag.top + event.clientY - drag.y)); placeWindow(item);
});
for (const type of ['pointerup', 'pointercancel', 'blur']) window.addEventListener(type, () => { drag = null; });
function buildBrowser(item) {
  const menus = node('nav', { class: 'window-menubar', 'aria-label': '浏览器菜单' });
  const groups = { '文件(F)': [['我的主页', () => navigate(item, 'home')], ['关闭窗口', () => windowAction(item, 'close')]], '查看(V)': [['刷新当前页面', () => renderWindow(item)], ['最大化 / 还原', () => windowAction(item, 'maximize')]], '收藏(A)': [['个人主页', () => window.open(HOME, '_blank', 'noopener,noreferrer')], ['GitHub', () => window.open('https://github.com/jackmac566', '_blank', 'noopener,noreferrer')]], '帮助(H)': [['关于此桌面', () => launchApp('credits')]] };
  for (const [name, entries] of Object.entries(groups)) menus.append(node('button', { type: 'button', text: name, onClick: event => showPopup(event.currentTarget, entries) }));
  item.element.append(menus);
  const toolbar = node('nav', { class: 'window-toolbar', 'aria-label': '浏览器导航' });
  item.back = node('button', { type: 'button', class: 'toolbar-button', text: '◀ 后退', onClick: () => historyMove(item, -1) });
  item.forward = node('button', { type: 'button', class: 'toolbar-button', text: '前进 ▶', onClick: () => historyMove(item, 1) });
  toolbar.append(item.back, item.forward, node('button', { type: 'button', class: 'toolbar-button', text: '⌂ 主页', onClick: () => navigate(item, 'home') }), node('button', { type: 'button', class: 'toolbar-button', text: '↻ 刷新', onClick: () => renderWindow(item) }));
  item.element.append(toolbar);
  item.address = node('output', { text: HOME });
  item.element.append(node('div', { class: 'addressbar' }, [node('span', { text: '地址(D)' }), item.address]));
}
function navigate(item, page) {
  if (!['home', 'about', 'projects', 'contact'].includes(page)) return;
  if (item.history[item.historyIndex] !== page) { item.history.splice(item.historyIndex + 1); item.history.push(page); item.historyIndex = item.history.length - 1; }
  renderWindow(item);
}
function historyMove(item, amount) { const next = item.historyIndex + amount; if (next >= 0 && next < item.history.length) { item.historyIndex = next; renderWindow(item); } }
function renderWindow(item) {
  item.body.replaceChildren();
  if (item.id === 'home') renderBrowser(item);
  else if (item.id === 'photos') renderPhotos(item);
  else if (item.id === 'music') renderMusic(item);
  else if (item.id === 'samsy') renderGame(item);
  else renderCredits(item);
}
function renderBrowser(item) {
  const page = item.history[item.historyIndex], layout = node('div', { class: 'browser-layout' });
  const sidebar = node('nav', { class: 'site-nav', 'aria-label': '个人主页页面' });
  for (const [id, title] of [['home', 'HOME'], ['about', 'ABOUT'], ['projects', 'PROJECTS'], ['contact', 'CONTACT']]) sidebar.append(node('button', { type: 'button', class: id === page ? 'current' : '', text: title, 'aria-current': id === page ? 'page' : 'false', onClick: () => navigate(item, id) }));
  sidebar.append(node('p', { text: '侯世康的\n个人主页' }));
  const content = node('article', { class: 'site-page' });
  if (page === 'home') {
    content.append(node('p', { class: 'page-kicker', text: 'WELCOME TO MY HOMEPAGE' }), node('h1', { text: '你好，我是侯世康。' }));
    const hero = node('div', { class: 'home-hero' });
    hero.append(node('img', { class: 'portrait', src: asset('portrait.jpg'), alt: photos[0][2], width: '144', height: '256' }));
    const copy = node('div', { class: 'home-copy' }, [node('h2', { text: '做网站，也做一些有意思的东西。' }), node('p', { text: '产品视觉、独立工具，还有照片与音乐。我把它们放在这台电脑里，欢迎随便看看。' }), node('p', { text: '想出去走走，可以打开「创作后院」。桌面图标和左侧导航都能用。' }), node('button', { type: 'button', class: 'classic-button', text: '打开创作后院 →', onClick: () => launchApp('world') })]);
    hero.append(copy); content.append(hero, node('hr'), node('h2', { text: '最近在做' }));
    const links = node('ul', { class: 'site-links' });
    for (const project of projects) links.append(node('li', {}, [link(project.title, project.href), ' — ' + project.kind]));
    content.append(links, node('p', { class: 'page-footnote', text: '所有链接都通向实际网站或源码仓库。' }));
  } else if (page === 'about') {
    content.append(node('h1', { text: 'ABOUT ME' }), node('h2', { text: '你好，我是侯世康。' }), node('p', { text: '我把产品视觉、独立工具、影像和音乐放在这里。比起把事情说得很大，我更喜欢先把东西做出来。' }), node('p', { text: '这个桌面是个人主页的另一个入口。作品有各自的网站和仓库，生活里的表情与记录放在照片文件夹，音乐播放器里有一首《创世纪》。' }));
    const pictures = node('div', { class: 'about-photos' }); for (const photo of photos.slice(1, 3)) pictures.append(node('img', { src: asset(photo[0]), alt: photo[2], loading: 'lazy' }));
    content.append(pictures, link('回到原来的个人主页 ↗', HOME));
  } else if (page === 'projects') {
    content.append(node('h1', { text: 'PROJECTS' }), node('p', { text: '几个正在做、也已经可以打开的项目。' }));
    for (const project of projects) {
      const card = node('section', { class: 'project-card' });
      const cover = node('div', { class: 'project-cover' }); cover.append(project.image ? node('img', { src: asset(project.image), alt: '强鹰彩色胶产品视觉', loading: 'lazy' }) : icon('folder'));
      card.append(cover, node('div', { class: 'project-copy' }, [node('small', { text: project.kind }), node('h2', { text: project.title }), node('p', { text: project.description }), link('打开项目 ↗', project.href)])); content.append(card);
    }
  } else {
    content.append(node('h1', { text: 'CONTACT' }), node('p', { text: '有想法、有问题，或者只是打个招呼，都可以直接联系我。' }), node('dl', { class: 'contact-list' }, [node('dt', { text: 'E-MAIL' }), node('dd', {}, [node('a', { href: 'mailto:shikanghou4@gmail.com', text: 'shikanghou4@gmail.com' })]), node('dt', { text: 'GITHUB' }), node('dd', {}, [link('github.com/jackmac566', 'https://github.com/jackmac566')])]), node('p', { class: 'page-footnote', text: '邮件链接会打开你的邮件应用。这里没有表单，也不会替你发送内容。' }));
  }
  layout.append(sidebar, content); item.body.append(layout);
  item.back.disabled = item.historyIndex === 0; item.forward.disabled = item.historyIndex === item.history.length - 1;
  item.address.textContent = HOME + (page === 'home' ? '' : '#' + page); item.status.textContent = '完成  |  ' + page.toUpperCase();
}
function renderPhotos(item) {
  const [file, title, alt] = photos[item.photoIndex];
  const controls = node('div', { class: 'photo-toolbar' }, [node('button', { type: 'button', class: 'classic-button', text: '◀ 上一张', onClick: () => changePhoto(item, -1) }), node('span', { text: title }), node('button', { type: 'button', class: 'classic-button', text: '下一张 ▶', onClick: () => changePhoto(item, 1) })]);
  const main = node('figure', { class: 'photo-preview' }, [node('img', { src: asset(file), alt }), node('figcaption', { text: title + '  /  ' + file })]);
  const grid = node('nav', { class: 'photo-grid', 'aria-label': '全部照片' });
  photos.forEach((photo, index) => grid.append(node('button', { type: 'button', class: 'photo-thumb' + (index === item.photoIndex ? ' selected' : ''), 'aria-label': photo[1], 'aria-pressed': String(index === item.photoIndex), onClick: () => { item.photoIndex = index; renderWindow(item); } }, [node('img', { src: asset(photo[0]), alt: '', loading: 'lazy' })])));
  item.body.append(node('div', { class: 'photo-layout' }, [controls, main, grid])); item.status.textContent = (item.photoIndex + 1) + ' / ' + photos.length + '  |  原个人网站公开素材';
}
function changePhoto(item, amount) { item.photoIndex = (item.photoIndex + amount + photos.length) % photos.length; renderWindow(item); }
function timeLabel(seconds) { if (!Number.isFinite(seconds)) return '0:00'; return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0'); }
function renderMusic(item) {
  const cover = node('img', { class: 'music-cover', src: asset('genesis.webp'), alt: '创世纪的原站音乐发布画面' });
  const info = node('div', { class: 'music-info' }, [node('small', { text: 'SERKON / MUSIC' }), node('h1', { text: '创世纪' }), node('p', { text: '个人作品 · 1 首曲目' })]);
  item.play = node('button', { type: 'button', class: 'classic-button', text: audio.paused ? '▶ 播放' : 'Ⅱ 暂停', onClick: toggleAudio });
  const controls = node('div', { class: 'music-controls' }, [item.play, node('button', { type: 'button', class: 'classic-button', text: '■ 停止', onClick: () => { pauseAudio(); audio.currentTime = 0; syncMusic(); } })]);
  item.seek = node('input', { type: 'range', min: '0', max: String(Number.isFinite(audio.duration) ? audio.duration : 0), step: '.1', value: String(audio.currentTime), 'aria-label': '播放进度' });
  item.seek.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(item.seek.value); syncMusic(); });
  item.timer = node('output', { text: timeLabel(audio.currentTime) + ' / ' + timeLabel(audio.duration) });
  const volume = node('input', { type: 'range', min: '0', max: '1', step: '.05', value: String(audio.volume), 'aria-label': '音量' }); volume.addEventListener('input', () => { audio.volume = Number(volume.value); });
  item.body.append(node('div', { class: 'music-layout' }, [node('div', { class: 'music-heading' }, [cover, info]), controls, node('div', { class: 'music-seek' }, [item.seek, item.timer]), node('label', { class: 'music-volume' }, ['音量 ', volume])]));
  item.status.textContent = musicNotice; syncMusic();
}
async function toggleAudio() {
  if (!hostActive) return;
  if (!audio.paused) { pauseAudio(); return; }
  try { await audio.play(); musicNotice = '正在播放《创世纪》'; syncMusic(); }
  catch { musicNotice = '暂时无法播放，请再点击播放。'; syncMusic(); announce(musicNotice); }
}
function pauseAudio() { audio.pause(); musicNotice = '已暂停'; syncMusic(); }
function syncMusic() {
  const hasForegroundAudio = !audio.paused || !!windows.get('samsy')?.gameFrame;
  if (lastMusicState !== hasForegroundAudio) {
    lastMusicState = hasForegroundAudio;
    if (window.parent !== window) window.parent.postMessage({ source: 'serkon-desktop', type: 'music', playing: lastMusicState }, location.origin);
  }
  const item = windows.get('music');
  $('#sound-button').setAttribute('aria-label', audio.paused ? '打开音乐播放器' : '音乐正在播放，打开播放器');
  if (!item?.play) return;
  item.play.textContent = audio.paused ? '▶ 播放' : 'Ⅱ 暂停'; item.seek.max = String(Number.isFinite(audio.duration) ? audio.duration : 0); item.seek.value = String(audio.currentTime); item.seek.disabled = !Number.isFinite(audio.duration); item.timer.textContent = timeLabel(audio.currentTime) + ' / ' + timeLabel(audio.duration); item.status.textContent = musicNotice;
}
for (const event of ['timeupdate', 'loadedmetadata', 'durationchange', 'pause', 'play']) audio.addEventListener(event, syncMusic);
audio.addEventListener('ended', () => { musicNotice = '播放结束'; syncMusic(); });
audio.addEventListener('error', () => { musicNotice = '音频暂时无法加载，可以稍后重试。'; syncMusic(); });
function renderCredits(item) {
  const page = node('article', { class: 'credits-page' }, [node('h1', { text: '我的电脑' }), node('p', { text: '作品、照片和音乐，都收在这台电脑里。' }), node('p', { text: '打开「创作后院」，出去走走；想休息，就回到房间坐一会儿。' })]);
  item.body.append(page); item.status.textContent = '关于此桌面';
}
function renderGame(item) {
  const toolbar = node('nav', { class: 'game-toolbar', 'aria-label': '小游戏操作' }, [
    node('span', { text: 'SAMSY' }),
    node('button', { type: 'button', text: '重新载入', onClick: () => { suspendGame(item); syncGame(item); } }),
    link('单独打开 ↗', SAMSY),
  ]);
  item.gameStage = node('div', { class: 'game-stage' });
  item.body.append(toolbar, item.gameStage);
  syncGame(item);
}
function syncGame(item) {
  if (item.id !== 'samsy' || !item.gameStage || item.gameFrame || item.minimized || !hostActive || document.hidden) return;
  pauseAudio();
  const frame = node('iframe', {
    title: 'SAMSY 互动小游戏', src: SAMSY,
    allow: 'autoplay; fullscreen; gamepad', allowfullscreen: '',
    sandbox: 'allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-popups allow-popups-to-escape-sandbox',
    referrerpolicy: 'no-referrer',
  });
  item.gameFrame = frame;
  item.status.textContent = '正在打开 SAMSY…';
  frame.addEventListener('load', () => { if (item.gameFrame === frame) item.status.textContent = 'SAMSY · 联机互动'; });
  item.gameStage.append(frame);
  syncMusic();
}
function suspendGame(item) {
  if (item.id !== 'samsy' || !item.gameFrame) return;
  // Cross-origin games have no shared pause API. Unload the frame so a hidden
  // window cannot keep running WebGL/audio behind the room or explorer.
  item.gameFrame.remove(); item.gameFrame = null;
  item.status.textContent = '已停止 · 恢复窗口后重新开始';
  syncMusic();
}
function closePopup() { popup?.remove(); popup = null; }
function showPopup(button, entries) {
  closePopup(); closeStart(); const rect = button.getBoundingClientRect(); popup = node('div', { class: 'menu-popup', role: 'menu' });
  Object.assign(popup.style, { left: rect.left + 'px', top: rect.bottom + 'px', zIndex: String(topZ + 100) });
  for (const [title, action] of entries) popup.append(node('button', { type: 'button', class: 'menu-item', role: 'menuitem', text: title, onClick: () => { closePopup(); action(); } }));
  document.body.append(popup); popup.querySelector('button')?.focus();
}
function closeStart() { $('#start-menu').hidden = true; $('#start-button').setAttribute('aria-expanded', 'false'); }
for (const [id, app] of Object.entries(apps)) {
  const button = node('button', { type: 'button', class: 'desktop-icon', 'aria-label': app.label }, [icon(app.icon), node('span', { class: 'icon-label', text: app.label })]);
  button.addEventListener('click', event => { for (const other of $('#desktop-icons').children) other.classList.toggle('selected', other === button); if (event.detail === 0 || innerWidth <= 680 || matchMedia('(pointer:coarse)').matches) launchApp(id); });
  button.addEventListener('dblclick', () => launchApp(id)); $('#desktop-icons').append(button);
}
for (const [id, title] of [['home', '我的主页'], ['world', '创作后院'], ['samsy', 'SAMSY'], ['photos', '照片'], ['music', '音乐'], ['contact', '联系我'], ['credits', '关于电脑'], ['room', '回到房间']]) {
  const idForIcon = id === 'contact' ? 'home' : id;
  $('#start-items').append(node('button', { type: 'button', class: 'start-item', onClick: () => id === 'contact' ? launchApp('home', { page: 'contact' }) : launchApp(id) }, [icon(apps[idForIcon].icon), node('span', { text: title })]));
}
$('#start-button').addEventListener('click', () => { closePopup(); const menu = $('#start-menu'); menu.hidden = !menu.hidden; $('#start-button').setAttribute('aria-expanded', String(!menu.hidden)); if (!menu.hidden) menu.querySelector('button')?.focus(); });
$('#sound-button').addEventListener('click', () => launchApp('music'));
window.addEventListener('pointerdown', event => { if (!event.target.closest('#start-menu,#start-button')) closeStart(); if (!event.target.closest('.menu-popup,.window-menubar')) closePopup(); });
window.addEventListener('keydown', event => {
  if (!hostActive) return;
  if (event.key === 'Escape') { closeStart(); closePopup(); return; }
  if (event.altKey && event.key === 'F4' && front) { event.preventDefault(); windowAction(front, 'close'); return; }
  const menu = event.target.closest('#start-menu,.menu-popup');
  if (menu && ['ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); const buttons = [...menu.querySelectorAll('button')]; const index = buttons.indexOf(document.activeElement), change = event.key === 'ArrowDown' ? 1 : -1; buttons[(index + change + buttons.length) % buttons.length].focus(); return; }
  if (front?.id === 'photos' && !front.minimized && ['ArrowLeft', 'ArrowRight'].includes(event.key) && !event.target.matches('input')) { event.preventDefault(); changePhoto(front, event.key === 'ArrowRight' ? 1 : -1); }
});
window.addEventListener('resize', () => { for (const item of windows.values()) { item.x = Math.max(0, Math.min(item.x, innerWidth - 120)); item.y = Math.max(0, Math.min(item.y, workspace.clientHeight - 30)); placeWindow(item); } closeStart(); closePopup(); });
window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== location.origin || event.data?.source !== 'serkon-host') return;
  if (['pause', 'desktopPause', 'hide'].includes(event.data.type)) { hostActive = false; pauseAudio(); for (const item of windows.values()) suspendGame(item); closeStart(); closePopup(); drag = null; }
  else if (['resume', 'enter', 'desktopResume'].includes(event.data.type)) { hostActive = true; for (const item of windows.values()) syncGame(item); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseAudio(); for (const item of windows.values()) suspendGame(item); } else { for (const item of windows.values()) syncGame(item); } });
window.addEventListener('pagehide', () => { pauseAudio(); for (const item of windows.values()) suspendGame(item); });
function clock() { const now = new Date(); $('#clock').textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }); $('#clock').dateTime = now.toISOString(); }
clock(); setInterval(clock, 15000);
launchApp('home', { initial: true });
if (window.parent !== window) window.parent.postMessage({ source: 'serkon-desktop', type: 'ready' }, location.origin);
