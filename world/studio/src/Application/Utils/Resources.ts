import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Application from '../Application';
import UIEventBus from '../UI/EventBus';
import EventEmitter from './EventEmitter';
import Loading from './Loading';

export default class Resources extends EventEmitter {
    sources: Resource[];
    // Not sure about this one
    items: {
        texture: { [name: string]: LoadedTexture };
        cubeTexture: { [name: string]: LoadedCubeTexture };
        gltfModel: { [name: string]: LoadedModel };
        audio: { [name: string]: LoadedAudio };
    };
    toLoad: number;
    loaded: number;
    loaders: {
        gltfLoader: GLTFLoader;
        textureLoader: THREE.TextureLoader;
        cubeTextureLoader: THREE.CubeTextureLoader;
        audioLoader: THREE.AudioLoader;
    };
    application: Application;
    loading: Loading;
    failed = new Set<string>();

    constructor(sources: Resource[]) {
        super();

        this.sources = sources;

        this.items = { texture: {}, cubeTexture: {}, gltfModel: {}, audio: {} };
        this.toLoad = this.sources.length;
        this.loaded = 0;
        this.application = new Application();
        this.loading = this.application.loading;

        this.setLoaders();
        this.application.host.progress(0, this.toLoad);
        this.startLoading();
    }

    setLoaders() {
        this.loaders = {
            gltfLoader: new GLTFLoader(),
            textureLoader: new THREE.TextureLoader(),
            cubeTextureLoader: new THREE.CubeTextureLoader(),
            audioLoader: new THREE.AudioLoader(),
        };
    }

    startLoading() {
        // Load each source
        for (const source of this.sources) {
            const paths = Array.isArray(source.path) ? source.path : [source.path];
            if(paths.some(path => new URL(path, document.baseURI).origin !== location.origin)) {
                this.sourceFailed(source, new Error('Only self-hosted scene resources are allowed.'));
                continue;
            }
            const onError = (error: unknown) => this.sourceFailed(source, error);
            if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file);
                }, undefined, onError);
            } else if (source.type === 'texture') {
                this.loaders.textureLoader.load(source.path, (file) => {
                    file.encoding = THREE.sRGBEncoding;
                    this.sourceLoaded(source, file);
                }, undefined, onError);
            } else if (source.type === 'cubeTexture') {
                this.loaders.cubeTextureLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file);
                }, undefined, onError);
            } else if (source.type === 'audio') {
                this.loaders.audioLoader.load(source.path, (buffer) => {
                    this.sourceLoaded(source, buffer);
                }, undefined, onError);
            }
        }
    }

    sourceFailed(source: Resource, error: unknown) {
        if(this.failed.has(source.name)) return;
        this.failed.add(source.name);
        console.error('Studio resource could not load:', source.name, error);
        this.application.host.error(new Error(`无法加载场景资源：${source.name}。可刷新重试或直接进入桌面。`), 'resource');
    }

    sourceLoaded(source: Resource, file: LoadedResource) {
        this.items[source.type][source.name] = file;

        this.loaded++;

        this.loading.trigger('loadedSource', [
            source.name,
            this.loaded,
            this.toLoad,
            Array.isArray(source.path) ? source.path.join(', ') : source.path,
        ]);

        if (this.loaded === this.toLoad) {
            this.trigger('ready');
        }
    }
}
