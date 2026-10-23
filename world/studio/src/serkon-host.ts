import type Application from './Application/Application';
import UIEventBus from './Application/UI/EventBus';

export interface StudioSnapshot {
    loaded: number;
    total: number;
    recent: string[];
    roomReady: boolean;
    worldReady: boolean;
    worldFailed: boolean;
    worldLoaded: number;
    worldTotal: number;
    started: boolean;
    error: string;
    canStart: boolean;
}

export interface StudioHost {
    progress(loaded: number, total: number, name?: string, url?: string): void;
    ready(): void;
    error(reason: unknown, code?: string): void;
    start(): boolean;
    desktopRequest(): void;
    launchWorld(details?: Record<string, unknown>): void;
    post(type: string, details?: Record<string, unknown>): void;
    dispose(): void;
}

const stateEvent = 'serkon-studio-state';
const embedded = window.parent !== window && new URLSearchParams(location.search).get('embed') === '1';
const waitWorld = embedded && new URLSearchParams(location.search).get('waitWorld') === '1';
let snapshot: StudioSnapshot = {
    loaded: 0, total: 0, recent: [], roomReady: false,
    worldReady: !waitWorld, worldFailed: false, worldLoaded: 0, worldTotal: 0,
    started: false, error: '', canStart: false,
};
let currentHost: StudioHost | null = null;

export const getStudioHost = () => currentHost;
export const getStudioSnapshot = (): StudioSnapshot => snapshot;
export function subscribeStudio(callback: (state: StudioSnapshot) => void) {
    const listener = () => callback(snapshot);
    window.addEventListener(stateEvent, listener);
    callback(snapshot);
    return () => window.removeEventListener(stateEvent, listener);
}

export function createStudioHost(application: Application): StudioHost {
    const origin = location.origin;
    const update = (values: Partial<StudioSnapshot>) => {
        snapshot = { ...snapshot, ...values };
        snapshot.canStart = snapshot.roomReady && (snapshot.worldReady || snapshot.worldFailed) && !snapshot.error;
        window.dispatchEvent(new Event(stateEvent));
    };
    const post = (type: string, details: Record<string, unknown> = {}) => {
        if(embedded) window.parent.postMessage({ source: 'serkon-studio', type, ...details }, origin);
    };
    const reportError = (reason: unknown, code = 'initialization') => {
        const message = (reason instanceof Error ? reason.message : String(reason || '场景加载失败。')).slice(0, 500);
        if(code === 'initialization' || code === 'resource') update({ error: message });
        post('error', { code, message, nonfatal: code !== 'initialization' && code !== 'resource' });
    };
    const onMessage = (event: MessageEvent) => {
        if(!embedded || event.source !== window.parent || event.origin !== origin || event.data?.source !== 'serkon-host') return;
        const data = event.data;
        if(data.type === 'pause') {
            application.pause();
            post('paused');
        } else if(data.type === 'enter' || data.type === 'resume') {
            application.resume();
            window.focus();
            post('resumed', { started: snapshot.started });
        } else if(data.type === 'worldReady') {
            update({
                worldReady: data.ready === true,
                worldFailed: data.failed === true,
                worldLoaded: Number.isFinite(data.loaded) ? Math.max(0, data.loaded) : snapshot.worldLoaded,
                worldTotal: Number.isFinite(data.total) ? Math.max(0, data.total) : snapshot.worldTotal,
            });
        }
    };
    const onVisibility = () => {
        if(document.hidden) application.pause(true);
        else application.resume(true);
    };
    const onError = (event: ErrorEvent) => reportError(event.error || event.message, snapshot.roomReady ? 'runtime' : 'initialization');
    const onRejection = (event: PromiseRejectionEvent) => reportError(event.reason, snapshot.roomReady ? 'runtime' : 'initialization');
    const onPageHide = () => application.pause();
    const guard = (event: Event) => {
        if(application.hostPaused) {
            if(event.cancelable) event.preventDefault();
            event.stopImmediatePropagation();
        }
    };
    const inputEvents = ['keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchmove', 'touchend', 'wheel', 'click'];
    inputEvents.forEach(type => window.addEventListener(type, guard, { capture: true, passive: false }));
    window.addEventListener('message', onMessage);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);

    const host: StudioHost = {
        progress(loaded, total, name, url) {
            const recent = name ? [...snapshot.recent, name].slice(-8) : snapshot.recent;
            update({ loaded, total, recent });
            post('progress', { loaded, total, url, name });
        },
        ready() {
            update({ roomReady: true });
            post('ready', { loaded: snapshot.loaded, total: snapshot.total, awaitingWorld: waitWorld && !snapshot.worldReady });
        },
        error: reportError,
        start() {
            if(!snapshot.canStart || snapshot.started) return false;
            update({ started: true });
            application.resume();
            const ui = document.getElementById('ui');
            if(ui) ui.style.pointerEvents = 'none';
            UIEventBus.dispatch('loadingScreenDone', {});
            post('started');
            return true;
        },
        desktopRequest() { post('desktopRequest'); },
        launchWorld(details = {}) {
            if(snapshot.worldFailed || !snapshot.worldReady) {
                reportError('探索世界暂未就绪，请继续浏览桌面。', 'world-unavailable');
                return;
            }
            application.pause();
            post('launchWorld', details);
        },
        post,
        dispose() {
            inputEvents.forEach(type => window.removeEventListener(type, guard, true));
            window.removeEventListener('message', onMessage);
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
            window.removeEventListener('pagehide', onPageHide);
            document.removeEventListener('visibilitychange', onVisibility);
        },
    };
    currentHost = host;
    post('hello', { requiresWorld: waitWorld });
    return host;
}
