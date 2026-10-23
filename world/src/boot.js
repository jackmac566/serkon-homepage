import './boot.css';

/**
 * Two-phase scene bootstrap: actual resource BIOS, then a user-controlled START gate.
 * Visual reference: Henry Heffernan's public loading screen.
 * https://github.com/henryjeff/portfolio-website/blob/master/src/Application/UI/components/LoadingScreen.tsx
 * Original DOM implementation; this does not simulate hardware or a real operating system.
 */
export function createBoot({ onStart = () => {}, onDesktop, onWorld } = {}) {
  const root = document.querySelector('#loading');
  if (!root) throw new Error('The startup terminal needs #loading.');
  const skipLink = document.querySelector('.skip-world');
  const previousSkipInert = skipLink?.inert ?? false;
  if (skipLink) skipLink.inert = true;
  root.classList.add('serkon-boot');
  root.classList.remove('done');
  root.dataset.phase = 'loading';
  root.inert = false;
  root.removeAttribute('aria-hidden');
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Serkon 启动界面');
  root.innerHTML = `
    <div class="sb-load-screen">
      <header class="sb-header"><div class="sb-brand"><strong>Serkon,</strong><strong>Personal Space.</strong></div><div class="sb-version"><p>Version: 03.00</p><p>SERKON SCENE BIOS / 2026</p></div></header>
      <main class="sb-load-main" aria-label="实际场景加载记录">
        <p>SERKON PERSONAL COMPUTER</p>
        <p class="sb-scene-name">Portfolio Showcase / Interactive Scenes</p>
        <div class="sb-stages" role="log" aria-label="场景初始化状态" aria-live="polite" aria-relevant="additions text"></div>
        <p class="sb-resource-title" role="status" aria-live="polite">LOADING RESOURCES <span class="sb-resource-count">(0/-)</span></p>
        <div class="sb-resources" role="log" aria-label="最近八个已加载资源" aria-live="off"></div>
        <div class="sb-load-cursor" aria-hidden="true"><span class="sb-cursor"></span></div>
        <span class="sb-progress" role="progressbar" aria-label="真实素材加载进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></span>
      </main>
      <footer class="sb-footer"><p class="sb-loading-hint">Press <b>ENTER</b> to start when ready</p><p class="sb-date"></p></footer>
    </div>
    <div class="sb-ready-screen" hidden inert>
      <section class="sb-start-modal" role="dialog" aria-modal="true" aria-labelledby="sb-title" aria-describedby="sb-start-message">
        <h1 id="sb-title">Serkon Portfolio</h1>
        <p id="sb-start-message">Click start to begin <span class="sb-cursor" aria-hidden="true"></span></p>
        <div class="sb-start-row"><button id="boot-start" type="button" class="sb-start">START</button></div>
      </section>
    </div>`;

  const loadingScreen = root.querySelector('.sb-load-screen');
  const readyScreen = root.querySelector('.sb-ready-screen');
  const stages = root.querySelector('.sb-stages');
  const resources = root.querySelector('.sb-resources');
  const resourceCount = root.querySelector('.sb-resource-count');
  const progressbar = root.querySelector('.sb-progress');
  const startButton = root.querySelector('#boot-start');
  const stageRows = new Map();
  let available = false, hidden = false, committed = false;
  let lastLoggedCount = 0, loadedCount = 0, totalCount = 0;

  const now = new Date();
  root.querySelector('.sb-date').textContent = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;

  function stage(key, label, status = 'OK') {
    if (hidden || available) return;
    let row = stageRows.get(key);
    if (!row) {
      row = document.createElement('p');
      row.className = 'sb-stage';
      row.innerHTML = '<span class="sb-stage-label"></span><span class="sb-stage-status"></span>';
      stages.append(row);
      stageRows.set(key, row);
    }
    row.querySelector('.sb-stage-label').textContent = `${label} `;
    row.querySelector('.sb-stage-status').textContent = status;
  }

  function resourceName(url, index) {
    if (typeof url !== 'string' || !url.trim()) return `resource ${String(index).padStart(2, '0')}`;
    const withoutQuery = url.split(/[?#]/, 1)[0];
    const lastPart = withoutQuery.split('/').filter(Boolean).at(-1) || 'personal asset';
    let name;
    try { name = decodeURIComponent(lastPart); } catch { name = lastPart; }
    // Only a file name is shown, never a full URL, query string or credential.
    return name.replace(/[\r\n\t]/g, ' ').slice(0, 80);
  }

  function progress(loaded, total, url, failed = false) {
    if (hidden || available) return;
    loadedCount = Math.max(0, Math.floor(Number(loaded) || 0));
    totalCount = Math.max(loadedCount, Math.floor(Number(total) || 0));
    resourceCount.textContent = `(${loadedCount}/${totalCount || '-'})`;
    const percent = totalCount ? Math.min(100, Math.round(loadedCount / totalCount * 100)) : 0;
    progressbar.setAttribute('aria-valuenow', String(percent));
    progressbar.setAttribute('aria-valuetext', totalCount ? `已加载 ${loadedCount} 个，共 ${totalCount} 个资源` : '等待资源');
    if (loadedCount > lastLoggedCount) {
      const row = document.createElement('p');
      row.className = 'sb-resource';
      const name = document.createElement('span'); name.className = 'sb-resource-name'; name.textContent = `${failed ? 'Failed' : 'Loaded'} ${resourceName(url, loadedCount)}`;
      const value = document.createElement('span'); value.className = 'sb-resource-value'; value.textContent = `... ${percent}%`;
      row.append(name, value);
      resources.append(row);
      while (resources.children.length > 8) resources.firstElementChild.remove();
    }
    lastLoggedCount = Math.max(lastLoggedCount, loadedCount);
  }

  function ready(message) {
    if (hidden || committed || available) return;
    available = true;
    root.dataset.phase = 'ready';
    loadingScreen.hidden = true;
    loadingScreen.inert = true;
    readyScreen.hidden = false;
    readyScreen.inert = false;
    // A fallback message remains available to assistive technology without changing
    // the two-line reference composition or automatically advancing into a scene.
    if (message) startButton.setAttribute('aria-description', message);
    startButton.focus({ preventScroll: true });
  }

  function launch() {
    if (!available || hidden || committed) return;
    committed = true;
    onStart();
  }

  startButton.addEventListener('click', launch);
  const onKeyDown = event => {
    if (hidden || committed || event.defaultPrevented || event.isComposing) return;
    if (event.key === 'Tab' && available) {
      event.preventDefault();
      startButton.focus({ preventScroll: true });
      return;
    }
    if (event.key !== 'Enter') return;
    if (event.target?.closest?.('button,input,textarea,a')) return;
    event.preventDefault();
    if (available) launch();
    else root.querySelector('.sb-loading-hint').textContent = 'Please wait for resources to finish loading';
  };
  window.addEventListener('keydown', onKeyDown);

  function hide() {
    hidden = true;
    if (root.contains(document.activeElement)) document.activeElement.blur();
    root.classList.add('done');
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
    if (skipLink) skipLink.inert = previousSkipInert;
    window.removeEventListener('keydown', onKeyDown);
  }

  progress(0, 0);
  return { progress, stage, ready, hide, isReady: () => available && !hidden };
}
