import * as THREE from 'three';
import Application from '../Application';
import BakedModel from '../Utils/BakedModel';
import Resources from '../Utils/Resources';

export default class Computer {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;
    bakedModel: BakedModel;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;
        this.personalizeLabels();
        this.bakeModel();
        this.setModel();
    }

    personalizeLabels() {
        // Preserve the original baked light, vents, keys and geometry; replace
        // only the four tiny manufacturer/name decals in the source atlas.
        const texture = this.resources.items.texture.computerSetupTexture;
        const image = texture.image as HTMLImageElement;
        if (!image || !image.width || texture.userData.serkonLabels) return;
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        const labels = [
            { x: .324, y: .647, w: .083, h: .025, angle: Math.PI, plate: false },
            { x: .551, y: .469, w: .040, h: .018, angle: 0, plate: false },
            { x: .415, y: .132, w: .034, h: .050, angle: Math.PI / 2, plate: true },
            { x: .679, y: .805, w: .052, h: .032, angle: 0, plate: true },
        ];
        for (const label of labels) {
            const x = Math.round(label.x * canvas.width);
            const y = Math.round(label.y * canvas.height);
            const width = Math.round(label.w * canvas.width);
            const height = Math.round(label.h * canvas.height);
            if (label.plate) {
                context.fillStyle = '#30302e';
                context.fillRect(x, y, width, height);
            } else {
                // Interpolate neighboring baked pixels across the old text,
                // retaining the surface's vertical illumination gradient.
                const patch = context.getImageData(x - 2, y, width + 4, height);
                for (let row = 0; row < height; row++) {
                    const left = row * (width + 4) * 4;
                    const right = left + (width + 3) * 4;
                    for (let column = 0; column < width; column++) {
                        const ratio = column / Math.max(1, width - 1);
                        const pixel = left + (column + 2) * 4;
                        for (let channel = 0; channel < 3; channel++) {
                            patch.data[pixel + channel] = Math.round(patch.data[left + channel] * (1 - ratio) + patch.data[right + channel] * ratio);
                        }
                        patch.data[pixel + 3] = 255;
                    }
                }
                context.putImageData(patch, x - 2, y);
            }
            context.save();
            context.translate(x + width / 2, y + height / 2);
            context.rotate(label.angle);
            const vertical = label.angle === Math.PI / 2;
            const textWidth = vertical ? height * .84 : width * .88;
            const fontSize = vertical ? width * .39 : height * .44;
            context.fillStyle = label.plate ? '#b8b8b1' : '#4d4d47';
            context.font = `700 ${Math.round(fontSize)}px monospace`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('SERKON', 0, 0, textWidth);
            context.restore();
        }
        texture.image = canvas;
        texture.needsUpdate = true;
        texture.userData.serkonLabels = true;
    }

    bakeModel() {
        this.bakedModel = new BakedModel(
            this.resources.items.gltfModel.computerSetupModel,
            this.resources.items.texture.computerSetupTexture,
            900
        );
    }

    setModel() {
        this.scene.add(this.bakedModel.getModel());
    }
}
