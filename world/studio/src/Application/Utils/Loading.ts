import * as THREE from 'three';
import Application from '../Application';
import EventEmitter from './EventEmitter';
import Resources from './Resources';
import UIEventBus from '../UI/EventBus';

export default class Loading extends EventEmitter {
    progress: number;
    application: Application;
    resources: Resources;
    scene: THREE.Scene;

    constructor() {
        super();

        this.application = new Application();
        this.resources = this.application.resources;

        this.scene = this.application.scene;
        this.progress = 0;
        this.on('loadedSource', (sourceName, loaded, toLoad, url) => {
            this.progress = loaded / toLoad;
            this.application.host.progress(loaded, toLoad, sourceName, url);
            UIEventBus.dispatch('loadedSource', {
                sourceName: sourceName,
                progress: loaded / toLoad,
                toLoad: toLoad,
                loaded: loaded,
                url,
            });
        });
    }
}
