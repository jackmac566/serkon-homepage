import { stations, projects, photos, HOME_URL, CONTACT } from './content.js';
import './panels.css';

const external = 'target="_blank" rel="noopener noreferrer"';
const iconArrow = '<span aria-hidden="true">↗</span>';
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** The directory and reading panels work independently of WebGL. */
export function createPanels({ onClose = () => {}, onVisit = () => {}, onTravel = () => {}, onMusic = () => {}, assetBase = './assets/' } = {}) {
  const asset = file => new URL(file, new URL(assetBase, document.baseURI)).href;
  const panel = document.createElement('dialog');
  panel.className = 'world-panel';
  panel.setAttribute('aria-labelledby', 'wp-location-title');
  panel.innerHTML = `
    <header class="wp-header"><div><p class="wp-location" id="wp-location-name"></p><h2 id="wp-location-title"></h2></div><button type="button" class="wp-close" aria-label="关闭内容，回到后院"><span aria-hidden="true">×</span></button></header>
    <div class="wp-pages">
      <section class="wp-page" data-page="works" hidden>
        <div class="wp-section-lead"><p class="wp-handwritten">做出来的东西，放在前面。</p><p>产品视觉、网站和本地工具。<br>各有各的用途，也各有还在修改的部分。</p></div>
        <article class="wp-featured-project"><figure><img src="${asset('color.webp')}" alt="强鹰彩色胶产品视觉系统的现有作品图" loading="lazy" decoding="async"><figcaption>强鹰彩色胶 · 产品视觉与网站</figcaption></figure><div class="wp-project-description"><p class="wp-eyebrow">01 / PRODUCT & WEBSITE</p><h3>强鹰彩色胶</h3><p>${escapeHTML(projects[0].description)}</p><dl class="wp-facts"><div><dt>126 色</dt><dd>色彩系统</dd></div><div><dt>2 类</dt><dd>硬支与软支</dd></div><div><dt>1 套</dt><dd>统一的网站表达</dd></div></dl><a class="wp-primary-link" href="${projects[0].href}" ${external}>打开产品网站 ${iconArrow}</a></div></article>
        <div class="wp-other-projects">${projects.slice(1).map((project, index) => `<article><span class="wp-project-index">0${index + 2}</span><div><p class="wp-eyebrow">${project.kind} · ${project.status}</p><h3>${project.title}</h3><p>${project.description}</p></div><a href="${project.href}" ${external} aria-label="打开${project.title}，在新标签页中查看">${iconArrow}</a></article>`).join('')}</div>
        <div class="wp-colophon"><p>这个后院之外，旧网站也一直留着。<br>公共大厅、共享影像和更新记录都在那里。</p><a class="wp-text-link" href="${HOME_URL}/" ${external}>去原来的个人网站 ${iconArrow}</a></div>
      </section>
      <section class="wp-page" data-page="film" hidden>
        <div class="wp-section-lead"><p class="wp-handwritten">伦敦，在工作区里。</p><p>地标、人物、食物与街景。<br>这组 AI 影像，留下了素材工作区和导出过程。</p></div>
        <div class="wp-film-tabs" role="tablist" aria-label="影像过程"><button type="button" role="tab" id="wp-film-tab-workspace" aria-controls="wp-film-view" aria-selected="true" tabindex="0" data-film="workspace">01 素材工作区</button><button type="button" role="tab" id="wp-film-tab-export" aria-controls="wp-film-view" aria-selected="false" tabindex="-1" data-film="export">02 导出设置</button></div>
        <figure id="wp-film-view" class="wp-film-view" role="tabpanel" aria-labelledby="wp-film-tab-workspace" tabindex="0"><img id="wp-film-image" src="${asset('london.webp')}" alt="伦敦 AI 影像素材的原始工作区截图" loading="lazy" decoding="async"><figcaption id="wp-film-caption">把地标、人物和生活细节放在一起，看看镜头能不能接成一个故事。</figcaption></figure>
        <div class="wp-film-bottom"><p id="wp-film-disclosure">画面为 AI 生成素材，展示的是工作区截图，非旅行实拍或可播放的原成片。</p><a id="wp-film-original" class="wp-text-link" href="${asset('london.webp')}" ${external}>打开原图 ${iconArrow}</a></div>
        <a class="wp-text-link wp-process-link" href="${HOME_URL}/life" ${external}>去原站看影像档案 ${iconArrow}</a>
      </section>
      <section class="wp-page" data-page="music" hidden>
        <div class="wp-record-layout"><div class="wp-record-art"><div class="wp-vinyl" aria-hidden="true"><div class="wp-vinyl-label"><span>位面之子 FK</span><strong>创世纪</strong><small>GENESIS / SIDE A</small></div></div><p class="wp-record-caption">给后院放一张自己的唱片。</p></div><div class="wp-record-copy"><p class="wp-eyebrow">ORIGINAL MUSIC / 已公开发布</p><h3>创世纪</h3><p class="wp-artist">位面之子 FK</p><p>关于宇宙、回声与创造的一首歌。<br>坐一会儿听，也可以让它陪你继续逛。</p><button type="button" class="wp-play" aria-label="播放创世纪"><span aria-hidden="true">▷</span><span class="wp-play-label">放这张唱片</span></button><div class="wp-native-player"></div><p class="wp-audio-status" role="status" aria-live="polite">点击播放后开始。关闭这页，音乐可以继续。</p><a class="wp-text-link" href="https://music.163.com/#/song?id=2753362002" ${external}>网易云音乐上的发行页 ${iconArrow}</a></div></div>
        <details class="wp-release-proof"><summary>翻一下发行记录 <span aria-hidden="true">＋</span></summary><img src="${asset('genesis.webp')}" alt="原站公开的创世纪音乐发行页面截图" loading="lazy" decoding="async"></details>
      </section>
      <section class="wp-page" data-page="life" hidden>
        <div class="wp-section-lead"><p class="wp-handwritten">正经的、不太正经的。</p><p>打个照面，招招手。<br>剩下的表情，都贴在这面墙上。</p></div>
        <div class="wp-photo-layout"><figure class="wp-photo-main" data-shape="portrait"><div class="wp-photo-mount"><img id="wp-photo-image" src="${asset(photos[0].file)}" alt="${photos[0].alt}" loading="lazy" decoding="async"></div><figcaption aria-live="polite"><span id="wp-photo-number">01 / 04</span><strong id="wp-photo-title">${photos[0].title}</strong><p id="wp-photo-note">${photos[0].note}</p></figcaption></figure><div class="wp-photo-thumbnails" role="group" aria-label="选择个人照片">${photos.map((photo, index) => `<button type="button" data-photo="${index}" aria-label="查看照片：${photo.title}" aria-pressed="${index === 0}"><img src="${asset(photo.file)}" alt="" loading="lazy" decoding="async"><span>0${index + 1}</span></button>`).join('')}</div></div>
        <div class="wp-photo-navigation"><button type="button" data-photo-direction="-1">← 上一张</button><p>四张原站的个人照片素材<br>点小照片，或用 ← → 切换</p><button type="button" data-photo-direction="1">下一张 →</button></div>
      </section>
      <section class="wp-page" data-page="about" hidden>
        <div class="wp-about-layout"><figure><img src="${asset('portrait.jpg')}" alt="侯世康的灰色西装个人照片素材" loading="lazy" decoding="async"><figcaption>侯世康 / Serkon</figcaption></figure><div class="wp-about-copy"><p class="wp-eyebrow">这个后院的主人</p><h3>侯世康，<br>网上叫 Serkon。</h3><p>做产品视觉、个人网站和本地工具，<br>也试 AI 影像，写过一首《创世纪》。</p><p>作品、照片和音乐都放在这个后院。<br>你可以随便逛，也欢迎直接联系我。</p><a class="wp-letter" href="mailto:${CONTACT.email}"><span>写封信给我</span><strong>${CONTACT.email}</strong>${iconArrow}</a><div class="wp-about-links"><a class="wp-text-link" href="${CONTACT.github}" ${external}>GitHub ${iconArrow}</a><a class="wp-text-link" href="${HOME_URL}/serkon" ${external}>完整个人档案 ${iconArrow}</a></div></div></div>
      </section>
    </div>
    <footer class="wp-footer"><button type="button" class="wp-return"><span aria-hidden="true">↶</span> 回到后院</button><button type="button" class="wp-directory-link">看看别的地方 <span aria-hidden="true">↗</span></button></footer>`;

  const directory = document.createElement('dialog');
  directory.className = 'world-directory';
  directory.setAttribute('aria-labelledby', 'wd-title');
  directory.innerHTML = `<header class="wd-header"><div><p>后院导览 / FIVE PLACES</p><h2 id="wd-title">今天想去哪？</h2></div><button type="button" class="wp-close" aria-label="关闭导览，回到后院"><span aria-hidden="true">×</span></button></header><p class="wd-intro">可以开车慢慢逛，也可以从这里直接看内容。</p><div class="wd-places">${stations.map(station => `<article><span class="wd-number" style="--station-color:${station.color}">${station.number}</span><div><h3>${station.name}<small>${station.en}</small></h3><p>${station.hint}</p></div><div class="wd-actions"><button type="button" data-read="${station.id}">看内容 <span aria-hidden="true">↗</span></button><button type="button" data-travel="${station.id}">带我过去 <span aria-hidden="true">→</span></button></div></article>`).join('')}</div><footer class="wd-footer"><span>Serkon · 侯世康的创作后院</span><a href="${HOME_URL}/" ${external}>原来的个人网站 ${iconArrow}</a></footer>`;
  document.body.append(panel, directory);

  const audio = document.createElement('audio');
  audio.controls = true;
  audio.preload = 'none';
  audio.src = asset('genesis.mp3');
  audio.setAttribute('aria-label', '创世纪音频播放器');
  panel.querySelector('.wp-native-player').append(audio);
  const playButton = panel.querySelector('.wp-play');
  const playLabel = panel.querySelector('.wp-play-label');
  const audioStatus = panel.querySelector('.wp-audio-status');
  let opener = null;
  let activeId = null;
  let photoIndex = 0;
  let disposed = false;

  const isOpen = () => panel.open || directory.open;
  const safeFocus = element => { const visible=element?.isConnected&&!element.closest('dialog:not([open]),[hidden],[inert]')&&element.getClientRects().length;const target=visible?element:document.querySelector('#world[data-ready="true"]')||document.querySelector('#directory');target?.focus({preventScroll:true}); };
  const finishClose = () => {
    if (isOpen() || disposed) return;
    safeFocus(opener);
    onClose();
  };
  const hideDialog = dialog => { if (dialog.open) dialog.close(); };
  const showDialog = dialog => {
    dialog.showModal();
    dialog.querySelector('.wp-close').focus({ preventScroll: true });
    dialog.scrollTop = 0;
  };
  const close = () => { hideDialog(panel); hideDialog(directory); };

  function open(id, trigger) {
    const station = stations.find(item => item.id === id);
    if (!station || disposed) return false;
    if (!isOpen()) opener = trigger || document.activeElement;
    else if (trigger && !trigger.closest('.world-directory,.world-panel')) opener = trigger;
    hideDialog(directory);
    activeId = station.id;
    panel.dataset.station = station.id;
    panel.querySelector('#wp-location-name').textContent = `${station.number} / ${station.en}`;
    panel.querySelector('#wp-location-title').textContent = station.name;
    panel.querySelectorAll('[data-page]').forEach(page => { page.hidden = page.dataset.page !== id; });
    if (!panel.open) showDialog(panel);
    else { panel.scrollTop = 0; panel.querySelector('.wp-close').focus({ preventScroll: true }); }
    onVisit(id);
    return true;
  }

  function showDirectory(trigger) {
    if (disposed) return;
    if (!isOpen()) opener = trigger || document.activeElement;
    hideDialog(panel);
    if (!directory.open) showDialog(directory);
  }

  [panel, directory].forEach(dialog => {
    dialog.addEventListener('close', finishClose);
    dialog.addEventListener('keydown', event => event.stopPropagation());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.querySelector('.wp-close').addEventListener('click', () => dialog.close());
  });
  panel.querySelector('.wp-return').addEventListener('click', close);
  panel.querySelector('.wp-directory-link').addEventListener('click', () => showDirectory());
  directory.querySelectorAll('[data-read]').forEach(button => button.addEventListener('click', () => open(button.dataset.read)));
  directory.querySelectorAll('[data-travel]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.travel;
    close();
    onTravel(id);
  }));

  function setFilm(id, focus = false) {
    const workspace = id === 'workspace';
    panel.querySelectorAll('[data-film]').forEach(tab => {
      const selected = tab.dataset.film === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (focus && selected) tab.focus();
    });
    const image = panel.querySelector('#wp-film-image');
    image.src = asset(workspace ? 'london.webp' : 'export.webp');
    image.alt = workspace ? '伦敦 AI 影像素材的原始工作区截图' : '原站公开的导出设置截图：8K、120 帧与处理中任务';
    panel.querySelector('#wp-film-view').setAttribute('aria-labelledby', `wp-film-tab-${id}`);
    panel.querySelector('#wp-film-caption').textContent = workspace ? '把地标、人物和生活细节放在一起，看看镜头能不能接成一个故事。' : '截图里记录了 8K、120 帧的导出设置，以及“39 个任务处理中”的状态。';
    panel.querySelector('#wp-film-disclosure').textContent = workspace ? '画面为 AI 生成素材，展示的是工作区截图，非旅行实拍或可播放的原成片。' : '这是导出过程记录；设置参数不代表这里已提供相应规格的成片。';
    panel.querySelector('#wp-film-original').href = image.src;
  }
  const filmTabs = [...panel.querySelectorAll('[data-film]')];
  filmTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setFilm(tab.dataset.film));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') next = (index + 1) % filmTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = filmTabs.length - 1;
      if (next !== undefined) { event.preventDefault(); setFilm(filmTabs[next].dataset.film, true); }
    });
  });

  function setPhoto(index) {
    photoIndex = (index + photos.length) % photos.length;
    const photo = photos[photoIndex];
    const image = panel.querySelector('#wp-photo-image');
    image.src = asset(photo.file);
    image.alt = photo.alt;
    panel.querySelector('.wp-photo-main').dataset.shape = photo.shape;
    panel.querySelector('#wp-photo-number').textContent = `0${photoIndex + 1} / 04`;
    panel.querySelector('#wp-photo-title').textContent = photo.title;
    panel.querySelector('#wp-photo-note').textContent = photo.note;
    panel.querySelectorAll('[data-photo]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.photo) === photoIndex)));
  }
  panel.querySelectorAll('[data-photo]').forEach(button => button.addEventListener('click', () => setPhoto(Number(button.dataset.photo))));
  panel.querySelectorAll('[data-photo-direction]').forEach(button => button.addEventListener('click', () => setPhoto(photoIndex + Number(button.dataset.photoDirection))));
  panel.addEventListener('keydown', event => {
    if (activeId === 'life' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      setPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });

  const updateMusic = () => {
    const playing = !audio.paused && !audio.ended && !audio.error;
    panel.classList.toggle('is-playing', playing);
    playButton.setAttribute('aria-label', playing ? '暂停创世纪' : '播放创世纪');
    playButton.querySelector('[aria-hidden]').textContent = playing ? 'Ⅱ' : '▷';
    playLabel.textContent = playing ? '暂停这张唱片' : audio.currentTime > 0 && !audio.ended ? '继续听' : '放这张唱片';
    if (playing) audioStatus.textContent = '正在播放。回到后院，音乐也会继续。';
    else if (audio.ended) audioStatus.textContent = '这一面放完了。可以再听一次，或继续逛逛。';
    else if (audio.currentTime > 0) audioStatus.textContent = '已暂停，想听时再继续。';
    onMusic(playing);
  };
  async function toggleMusic() {
    if (!audio.paused && !audio.ended) { audio.pause(); return; }
    if (audio.error) audio.load();
    if (audio.ended) audio.currentTime = 0;
    audioStatus.textContent = '正在准备音频…';
    try { await audio.play(); }
    catch { audioStatus.textContent = '暂时没能播放。可以再试一次，或打开网易云音乐发行页。'; onMusic(false); }
  }
  playButton.addEventListener('click', toggleMusic);
  ['play', 'pause', 'ended'].forEach(type => audio.addEventListener(type, updateMusic));
  audio.addEventListener('waiting', () => { audioStatus.textContent = '音频缓冲中…'; });
  audio.addEventListener('playing', updateMusic);
  audio.addEventListener('error', () => {
    updateMusic();
    panel.classList.remove('is-playing');
    audioStatus.textContent = '音频暂时无法加载。可以重试，或从网易云音乐发行页收听。';
    onMusic(false);
  });

  return {
    open, close, isOpen, showDirectory,
    pauseMusic: () => audio.pause(),
    toggleMusic,
    dispose() { disposed = true; audio.pause(); close(); panel.remove(); directory.remove(); },
  };
}
