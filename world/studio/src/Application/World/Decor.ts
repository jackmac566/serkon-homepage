import * as THREE from 'three';
import Application from '../Application';
import BakedModel from '../Utils/BakedModel';
import Resources from '../Utils/Resources';

export default class Decor {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;
    bakedModel: BakedModel;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;
        this.bakeModel();
        this.setModel();
    }

    bakeModel() {
        this.bakedModel = new BakedModel(
            this.resources.items.gltfModel.decorModel,
            this.resources.items.texture.decorTexture,
            900
        );
    }

    setModel() {
        const model = this.bakedModel.getModel();
        // Keep Henry's baked room and actual coffee geometry. There are no
        // headphones in the original model. Reuse its separate paper mesh.
        const paper = model.getObjectByName('paper') as THREE.Mesh;
        if (paper) this.writeNote(paper);
        for (const name of ['binder_1', 'binder_2']) {
            const binder = model.getObjectByName(name);
            if (binder) binder.visible = false;
        }
        this.scene.add(model);
        this.setBooks();
    }

    writeNote(paper: THREE.Mesh) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1152;
        const context = canvas.getContext('2d')!;
        const wash = context.createLinearGradient(0, 0, 1024, 1152);
        wash.addColorStop(0, '#fffaf0');
        wash.addColorStop(1, '#e8dfcd');
        context.fillStyle = wash;
        context.fillRect(0, 0, 1024, 1152);
        context.strokeStyle = 'rgba(111,105,84,0.12)';
        context.lineWidth = 2;
        for (let y = 230; y < 1040; y += 145) {
            context.beginPath();
            context.moveTo(85, y);
            context.lineTo(939, y);
            context.stroke();
        }
        const wishes = [
            '好好睡觉 别感冒',
            '记得穿秋裤',
            '追求本心',
            '永远要在前进的路上',
            '欢迎你的到来～',
        ];
        context.fillStyle = '#39362f';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = '64px "Kaiti SC", "STKaiti", "KaiTi", serif';
        wishes.forEach((wish, index) => {
            context.save();
            context.translate(512, 185 + index * 145);
            context.rotate(index % 2 ? -0.012 : 0.008);
            context.fillText(wish, 0, 0, 880);
            context.restore();
        });
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = 4;

        // The source sheet is a four-vertex rotated quad with atlas UVs.
        // Derive its top/bottom edges rather than stretching the whole atlas.
        const geometry = paper.geometry.clone();
        const positions = geometry.getAttribute('position');
        const rows = Array.from({ length: positions.count }, (_, index) => ({
            index, x: positions.getX(index), z: positions.getZ(index),
        })).sort((a, b) => a.z - b.z);
        const uv = new Float32Array(positions.count * 2);
        for (let row = 0; row < 2; row++) {
            const edge = rows.slice(row * 2, row * 2 + 2).sort((a, b) => a.x - b.x);
            edge.forEach((point, column) => {
                uv[point.index * 2] = column;
                uv[point.index * 2 + 1] = row === 0 ? 1 : 0;
            });
        }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        paper.geometry = geometry;
        paper.material = new THREE.MeshBasicMaterial({
            map: texture, side: THREE.DoubleSide, polygonOffset: true,
            polygonOffsetFactor: -1, polygonOffsetUnits: -1,
        });
        paper.userData.wishes = wishes;
    }

    setBooks() {
        const novels = [
            { title: '斗破苍穹', color: '#3c5453', ink: '#eee4c5', height: 760 },
            { title: '斗罗大陆', color: '#314854', ink: '#e5debf', height: 815 },
            { title: '仙逆', color: '#85644d', ink: '#f2e7cd', height: 735 },
            { title: '完美世界', color: '#c6baa2', ink: '#344e45', height: 850 },
            { title: '画江湖之不良人', color: '#534448', ink: '#eadab8', height: 795 },
        ];
        const shelf = new THREE.Group();
        shelf.name = 'SerkonBooks';
        // Outside the monitor silhouette, behind the coffee, on the original desk.
        shelf.position.set(1450, -449, -420);
        const pages = new THREE.MeshBasicMaterial({ color: '#bdb4a0' });
        novels.forEach((novel, index) => {
            const width = 142;
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 1024;
            const context = canvas.getContext('2d')!;
            context.fillStyle = novel.color;
            context.fillRect(0, 0, 256, 1024);
            const shade = context.createLinearGradient(0, 0, 256, 0);
            shade.addColorStop(0, 'rgba(0,0,0,.26)');
            shade.addColorStop(.25, 'rgba(255,255,255,.04)');
            shade.addColorStop(1, 'rgba(0,0,0,.14)');
            context.fillStyle = shade;
            context.fillRect(0, 0, 256, 1024);
            context.fillStyle = novel.ink;
            context.fillRect(36, 48, 184, 3);
            context.fillRect(36, 969, 184, 3);
            context.font = '600 76px "Songti SC", "STSong", serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            const step = Math.min(132, 750 / novel.title.length);
            const top = (1024 - step * (novel.title.length - 1)) / 2;
            [...novel.title].forEach((letter, i) => context.fillText(letter, 128, top + i * step));
            const texture = new THREE.CanvasTexture(canvas);
            texture.encoding = THREE.sRGBEncoding;
            texture.anisotropy = 4;
            const cover = new THREE.MeshBasicMaterial({ color: novel.color });
            const spine = new THREE.MeshBasicMaterial({ map: texture });
            const book = new THREE.Mesh(new THREE.BoxGeometry(width, novel.height, 470), [cover, cover, pages, pages, spine, cover]);
            book.name = novel.title;
            book.position.set(index * 164, novel.height / 2, 0);
            book.rotation.y = -0.035;
            shelf.add(book);
        });
        this.scene.add(shelf);
    }
}
