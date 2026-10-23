import * as THREE from 'three';

import Debug from './Utils/Debug';
import Sizes from './Utils/Sizes';
import Time from './Utils/Time';
import Camera from './Camera/Camera';
import Renderer from './Renderer';
import Mouse from './Utils/Mouse';

//@ts-ignore
import World from './World/World';
import Resources from './Utils/Resources';

import sources from './sources';

import Stats from 'stats.js';
import Loading from './Utils/Loading';

import UI from './UI';
import TWEEN from '@tweenjs/tween.js';
import { createStudioHost, StudioHost } from '../serkon-host';

let instance: Application | null = null;

export default class Application {
    debug: Debug;
    sizes: Sizes;
    time: Time;
    scene: THREE.Scene;
    cssScene: THREE.Scene;
    overlayScene: THREE.Scene;
    resources: Resources;
    camera: Camera;
    renderer: Renderer;
    world: World;
    mouse: Mouse;
    loading: Loading;
    ui: UI;
    stats: Stats | undefined;
    host: StudioHost;
    hostPaused = false;
    private frameId: number | null = null;
    private pausedAt = 0;
    private pausedForVisibility = false;
    private wasHostPausedBeforeVisibility = false;
    private pausedVideos: HTMLVideoElement[] = [];

    constructor() {
        // Singleton
        if (instance) {
            return instance;
        }

        instance = this;

        // Global access
        //@ts-ignore
        // window.Application = this;

        // Setup
        this.debug = new Debug();
        this.sizes = new Sizes();
        this.mouse = new Mouse();
        this.loading = new Loading();
        this.time = new Time();
        // Application owns a cancellable loop. The upstream Time constructor's
        // single scheduled callback becomes a no-op, avoiding a second RAF chain.
        this.time.tick = () => {};
        this.scene = new THREE.Scene();
        this.cssScene = new THREE.Scene();
        this.overlayScene = new THREE.Scene();
        this.host = createStudioHost(this);
        this.resources = new Resources(sources);
        this.camera = new Camera();
        this.renderer = new Renderer();
        this.camera.createControls();
        this.world = new World();

        this.resources.on('ready.serkon', () => {
            this.host.ready();
            if(this.hostPaused) this.silence();
        });

        this.ui = new UI();

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('debug')) {
            this.stats = new Stats();
            this.stats.showPanel(0);

            document.body.appendChild(this.stats.dom);
        }

        // Resize event
        this.sizes.on('resize', () => {
            this.resize();
        });

        // Time tick event
        this.time.on('tick', () => {
            this.update();
        });
        this.scheduleFrame();
    }

    private scheduleFrame() {
        if(this.hostPaused || this.frameId !== null) return;
        this.frameId = window.requestAnimationFrame(() => {
            this.frameId = null;
            if(this.hostPaused) return;
            const now = Date.now();
            this.time.delta = Math.min(50, Math.max(0, now - this.time.current));
            this.time.current = now;
            this.time.elapsed = now - this.time.start;
            this.time.trigger('tick');
            this.scheduleFrame();
        });
    }

    private audioContexts() {
        const manager = this.world?.audioManager;
        return new Set<AudioContext>([manager?.listener?.context, manager?.context].filter(Boolean) as AudioContext[]);
    }

    private silence() {
        this.audioContexts().forEach(context => { if(context.state === 'running') context.suspend().catch(() => {}); });
    }

    pause(fromVisibility = false) {
        if(fromVisibility) {
            this.wasHostPausedBeforeVisibility = this.hostPaused;
            this.pausedForVisibility = true;
        } else if(this.pausedForVisibility) this.wasHostPausedBeforeVisibility = true;
        if(this.hostPaused) { this.silence(); return; }
        this.hostPaused = true;
        this.pausedAt = Date.now();
        if(this.frameId !== null) window.cancelAnimationFrame(this.frameId);
        this.frameId = null;
        TWEEN.getAll().forEach(tween => tween.pause());
        this.pausedVideos = Array.from(document.querySelectorAll('video')).filter(video => !video.paused);
        this.pausedVideos.forEach(video => video.pause());
        if(this.camera?.orbitControls) this.camera.orbitControls.enabled = false;
        this.world?.monitorScreen?.releaseInput();
        this.mouse.inComputer = false;
        this.silence();
        this.world?.monitorScreen?.setPaused(true);
    }

    resume(fromVisibility = false) {
        if(fromVisibility) {
            if(!this.pausedForVisibility) return;
            this.pausedForVisibility = false;
            if(this.wasHostPausedBeforeVisibility) return;
        } else if(document.hidden) {
            this.wasHostPausedBeforeVisibility = false;
            this.pausedForVisibility = true;
            return;
        }
        if(this.hostPaused) {
            const now = Date.now();
            this.time.start += now - this.pausedAt;
            this.time.current = now;
            this.time.delta = 16;
            this.hostPaused = false;
            TWEEN.getAll().forEach(tween => tween.resume());
            this.pausedVideos.forEach(video => { void video.play().catch(() => {}); });
            this.pausedVideos = [];
            if(this.camera?.orbitControls) this.camera.orbitControls.enabled = true;
            this.audioContexts().forEach(context => { if(context.state === 'suspended') void context.resume().catch(() => {}); });
        }
        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;
        this.resize();
        this.world?.monitorScreen?.setPaused(false);
        this.scheduleFrame();
    }

    resize() {
        this.camera.resize();
        this.renderer.resize();
    }

    update() {
        if(this.hostPaused) return;
        if (this.stats) this.stats.begin();
        this.camera.update();
        this.world.update();
        this.renderer.update();
        if (this.stats) this.stats.end();
    }

    destroy() {
        this.pause();
        this.host.dispose();
        this.sizes.off('resize');
        this.time.off('tick');

        // Traverse the whole scene
        this.scene.traverse((child) => {
            // Test if it's a mesh
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();

                // Loop through the material properties
                for (const key in child.material) {
                    const value = child.material[key];

                    // Test if there is a dispose function
                    if (value && typeof value.dispose === 'function') {
                        value.dispose();
                    }
                }
            }
        });

        this.renderer.instance.dispose();

        if (this.debug.active) this.debug.ui.destroy();
    }
}
