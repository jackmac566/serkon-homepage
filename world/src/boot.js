import './boot.css';

/**
 * Black-screen boot console, inspired by Henry Heffernan's public loading UI.
 * This is an original DOM implementation; scene/resource facts come from the host.
 * Reference: https://github.com/henryjeff/portfolio-website/blob/master/src/Application/UI/components/LoadingScreen.tsx
 */
export function createBoot({ onStart = () => {}, onDesktop, onWorld } = {}) {
  const root = document.querySelector('#loading');
  if (!root) throw new Error('The startup terminal needs #loading.');
  root.classList.add('serkon-boot');
  root.classList.remove('done');
  root.inert = false;
  root.removeAttribute('aria-hidden');
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Serkon 启动终端');
  root.innerHTML = `
    <header class="sb-header"><div class="sb-brand"><strong>SERKON<span aria-hidden="true">_</span></strong><span>PERSONAL SYSTEM</span></div><div class="sb-system-meta"><span>SCENE CONSOLE / V.03</span><span>INTERACTIVE PORTFOLIO</span><span class="sb-session-state">SESSION: LOADING</span></div></header>
    <main class="sb-terminal" aria-labelledby="sb-title">
      <section class="sb-console" aria-label="启动记录">
        <div class="sb-console-heading"><h1 id="sb-title">PERSONAL SPACE / BOOT SEQUENCE</h1><span class="sb-timer" aria-hidden="true">00:00.0</span></div>
        <p class="sb-mount"><span aria-hidden="true">&gt;</span> ./serkon <span>--interactive</span></p>
        <div class="sb-stages" role="log" aria-label="实际加载记录" aria-live="polite" aria-relevant="additions text"></div>
        <div class="sb-trace-heading" aria-hidden="true"><span>STARTUP TRACE</span><span>EVENT HISTORY</span></div>
        <div class="sb-log-viewport" aria-hidden="true"><div class="sb-history"></div></div>
        <div class="sb-runtime-line" aria-hidden="true"><span class="sb-live-dot"></span><span class="sb-runtime-text">await scene.ready</span><span class="sb-cursor"></span></div>
      </section>
      <section class="sb-launch" aria-label="进入个人空间">
        <div class="sb-launch-label"><span>SRK / 侯世康</span><span>USER INPUT</span></div>
        <p class="sb-welcome">Serkon Personal Computer</p>
        <p class="sb-owner">房间、作品，还有一个可以自由探索的世界。</p>
        <div class="sb-resource"><div class="sb-resource-label"><span>LOADING PERSONAL ASSETS</span><span class="sb-resource-count">-- / --</span></div><div class="sb-progress" role="progressbar" aria-label="个人素材加载进度" aria-valuemin="0" aria-valuemax="100"><span></span></div></div>
        <div class="sb-state" role="status" aria-live="polite"><span class="sb-state-label">LOADING</span><span class="sb-cursor" aria-hidden="true"></span><span class="sb-state-note">正在准备场景与个人文件。</span></div>
        <div class="sb-start-row"><button id="boot-start" type="button" class="sb-start" disabled><span aria-hidden="true">[</span> START <span aria-hidden="true">]</span></button><span class="sb-start-hint">WAIT FOR SCENE</span></div>
        <form class="sb-command-form" aria-label="启动命令"><label for="boot-command" aria-label="命令提示符">serkon:~$</label><input id="boot-command" aria-label="启动命令" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="help / start"><button type="submit" aria-label="执行启动命令">↵</button></form>
        <p class="sb-command-output" role="status" aria-live="polite"></p>
      </section>
    </main>
    <footer class="sb-footer"><span>ENTER → START <i aria-hidden="true">/</i> TYPE HELP FOR ROUTES</span><a href="https://serkon-homepage-cn.pages.dev/">原来的个人网站 ↗</a></footer>`;

  const stages = root.querySelector('.sb-stages');
  const history = root.querySelector('.sb-history');
  const viewport = root.querySelector('.sb-log-viewport');
  const stageRows = new Map();
  const stageValues = new Map();
  const startButton = root.querySelector('#boot-start');
  const command = root.querySelector('#boot-command');
  const output = root.querySelector('.sb-command-output');
  const stateLabel = root.querySelector('.sb-state-label');
  const stateNote = root.querySelector('.sb-state-note');
  const progressbar = root.querySelector('.sb-progress');
  const progressFill = progressbar.querySelector('span');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const startedAt = performance.now();
  const pendingLines = [];
  let available = false, hidden = false, committed = false, reducedMotion = motionPreference.matches;
  let loadedCount = 0, totalCount = 0, lastProgress = '', lineSequence = 0, lineTimer = null;

  function writeLine(line) {
    const row = document.createElement('div');
    row.className = 'sb-log-line';
    row.dataset.status = line.status.toLowerCase();
    const sequence = document.createElement('span'); sequence.className = 'sb-log-seq'; sequence.textContent = String(++lineSequence).padStart(3, '0');
    const timestamp = document.createElement('span'); timestamp.className = 'sb-log-time'; timestamp.textContent = line.time;
    const text = document.createElement('span'); text.className = 'sb-log-text'; text.textContent = line.text;
    row.append(sequence, timestamp, text);
    history.append(row);
    while (history.children.length > 42) history.firstElementChild.remove();
    viewport.scrollTop = viewport.scrollHeight;
  }

  function drainLines() {
    lineTimer = null;
    if (hidden) return;
    if (reducedMotion) {
      while (pendingLines.length) writeLine(pendingLines.shift());
      return;
    }
    const line = pendingLines.shift();
    if (line) writeLine(line);
    if (pendingLines.length) lineTimer = setTimeout(drainLines, pendingLines.length > 20 ? 75 : 145);
  }

  // Delayed output is presentation only. Readiness and the resource bar never wait for it.
  function record(text, status = 'INFO') {
    if (hidden) return;
    const time = ((performance.now() - startedAt) / 1000).toFixed(3).padStart(7, '0');
    pendingLines.push({ text, status: String(status), time });
    if (reducedMotion) drainLines();
    else if (lineTimer === null) lineTimer = setTimeout(drainLines, 60);
  }

  function stage(key, label, status = 'OK') {
    if (hidden) return;
    let row = stageRows.get(key);
    if (!row) {
      row = document.createElement('div');
      row.className = 'sb-stage';
      row.innerHTML = '<span class="sb-stage-status"></span><span class="sb-stage-label"></span>';
      stages.append(row);
      stageRows.set(key, row);
    }
    row.dataset.status = String(status).toLowerCase();
    row.querySelector('.sb-stage-status').textContent = `[${status}]`;
    row.querySelector('.sb-stage-label').textContent = label;
    const signature = `${label}|${status}`;
    if (stageValues.get(key) !== signature) {
      stageValues.set(key, signature);
      record(`stage.${key} :: ${label} ... ${status}`, status);
    }
  }

  function progress(loaded, total) {
    if (hidden) return;
    loadedCount = Math.max(0, Math.floor(Number(loaded) || 0));
    totalCount = Math.max(loadedCount, Math.floor(Number(total) || 0));
    root.querySelector('.sb-resource-count').textContent = totalCount ? `${String(loadedCount).padStart(2, '0')} / ${String(totalCount).padStart(2, '0')}` : '-- / --';
    const percent = totalCount ? Math.min(100, Math.round(loadedCount / totalCount * 100)) : 0;
    progressFill.style.width = `${percent}%`;
    progressbar.setAttribute('aria-valuenow', String(percent));
    progressbar.setAttribute('aria-valuetext', totalCount ? `已加载 ${loadedCount} 个，共 ${totalCount} 个资源` : '等待资源');
    const signature = `${loadedCount}/${totalCount}`;
    if (totalCount && signature !== lastProgress) record(`assets.loaded = ${String(loadedCount).padStart(2, '0')} / ${String(totalCount).padStart(2, '0')}  [${String(percent).padStart(3, ' ')}%]`, loadedCount === totalCount ? 'OK' : 'LOAD');
    lastProgress = signature;
  }

  function ready(message) {
    if (hidden || committed) return;
    const firstReady = !available;
    available = true;
    root.classList.add('sb-ready');
    startButton.disabled = false;
    stateLabel.textContent = 'READY';
    stateNote.textContent = message || '场景已就绪，等待你的指令。';
    root.querySelector('.sb-start-hint').textContent = 'CLICK START / PRESS ENTER';
    root.querySelector('.sb-session-state').textContent = 'SESSION: WAITING FOR INPUT';
    root.querySelector('.sb-runtime-text').textContent = 'event.loop → awaiting user input';
    if (!totalCount) {
      root.querySelector('.sb-resource-count').textContent = 'READY';
      progressFill.style.width = '100%';
      progressbar.setAttribute('aria-valuenow', '100');
      progressbar.setAttribute('aria-valuetext', '启动资源已就绪');
    }
    if (firstReady) {
      record('scene.ready = true', 'OK');
      record('input.routes :: START / DESKTOP / WORLD', 'OK');
      record('await user.command', 'WAIT');
    }
    if (document.activeElement === document.body || document.activeElement === root) startButton.focus({ preventScroll: true });
  }

  function launch(action = 'start') {
    if (hidden || committed) return;
    if (!available) {
      output.textContent = 'SCENE NOT READY · 资源仍在加载，请稍候。';
      return;
    }
    committed = true;
    startButton.disabled = true;
    stateLabel.textContent = 'OPENING';
    stateNote.textContent = action === 'desktop' ? '正在打开桌面。' : action === 'world' ? '正在进入创作后院。' : '正在打开房间。';
    const callback = action === 'desktop' ? onDesktop || onStart : action === 'world' ? onWorld || onStart : onStart;
    callback();
  }

  startButton.addEventListener('click', () => launch());
  root.querySelector('.sb-command-form').addEventListener('submit', event => {
    event.preventDefault();
    const value = command.value.trim().toLowerCase();
    if (value === 'help' || value === '?') {
      output.textContent = 'start → 房间　 desktop → 桌面　 world → 创作后院';
      record('help :: start | desktop | world', 'INFO');
    } else if (['start', 'desktop', 'world'].includes(value)) {
      launch(value);
    } else if (!value) {
      launch();
    } else {
      output.textContent = 'COMMAND NOT FOUND · 输入 help 查看可用命令。';
    }
    command.value = '';
  });
  const onKeyDown = event => {
    if (hidden || committed || event.key !== 'Enter' || event.defaultPrevented || event.isComposing || event.target?.closest?.('button,input,textarea,a')) return;
    event.preventDefault();
    launch();
  };
  window.addEventListener('keydown', onKeyDown);

  function updateTimer() {
    const seconds = (performance.now() - startedAt) / 1000;
    root.querySelector('.sb-timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${(seconds % 60).toFixed(1).padStart(4, '0')}`;
  }
  const uptimeTimer = setInterval(updateTimer, 100);
  const onMotionChange = event => {
    reducedMotion = event.matches;
    if (reducedMotion) {
      clearTimeout(lineTimer); lineTimer = null;
      drainLines();
    }
  };
  motionPreference.addEventListener('change', onMotionChange);

  function hide() {
    hidden = true;
    if (root.contains(document.activeElement)) document.activeElement.blur();
    root.classList.add('done');
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
    window.removeEventListener('keydown', onKeyDown);
    motionPreference.removeEventListener('change', onMotionChange);
    clearTimeout(lineTimer);
    clearInterval(uptimeTimer);
    pendingLines.length = 0;
  }

  record('console.mount("#loading")', 'OK');
  record('input.bind :: pointer / keyboard / touch', 'OK');
  record('commands.register :: help / start / desktop / world', 'OK');
  record('await scene.renderer', 'WAIT');
  record('await personal.assets', 'WAIT');
  progress(0, 0);
  return { progress, stage, ready, hide, isReady: () => available && !hidden };
}
