import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Original, tactile desk scene. Shares the host renderer; does not create DOM UI or a render loop. */
export function createDeskScene(THREE, { assetBase = './assets/', environmentMap = null } = {}) {
  const scene = new THREE.Scene();
  scene.name = 'Serkon — the room outside the screen';
  scene.background = new THREE.Color('#e9e3d7');
  scene.fog = new THREE.Fog('#e9e3d7', 34, 75);
  scene.environment = environmentMap;
  scene.environmentIntensity = .42;
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .045, 110);
  const objects = new THREE.Group(); scene.add(objects);
  const materials = new Set(), textures = new Set(), geometries = new Map();
  let seed = 6821;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  function texture(width, height, draw) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    textures.add(map); return map;
  }
  const woodMap = texture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#a78159'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1150; i++) {
      const y = random() * h, phase = random() * 9;
      ctx.strokeStyle = i % 3 ? `rgba(72,43,23,${.025 + random() * .075})` : 'rgba(244,221,173,.10)';
      ctx.lineWidth = .3 + random() * 1.2; ctx.beginPath();
      for (let x = 0; x <= w; x += 16) { const yy = y + Math.sin(x / 170 + phase) * (2 + random() * 4); if (!x) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke();
    }
    ctx.strokeStyle = '#6c4a2c24'; ctx.lineWidth = 1; for (let y = 128; y < h; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  });
  const plasterMap = texture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ddd6c7'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 15000; i++) { const light = random() > .5; ctx.fillStyle = light ? '#fff7e615' : '#6058490b'; ctx.fillRect(random() * w, random() * h, 1 + random() * 2, 1 + random() * 2); }
  });
  plasterMap.wrapS = plasterMap.wrapT = THREE.RepeatWrapping; plasterMap.repeat.set(3, 2);
  const surface = (color, extra = {}) => { const mat = new THREE.MeshStandardMaterial({ color, roughness: .7, metalness: 0, ...extra }); materials.add(mat); return mat; };
  const mat = {
    cream: surface('#e8dfca', { roughness: .58 }), bezel: surface('#d3c9af', { roughness: .53 }),
    dark: surface('#263d36', { roughness: .48 }), black: surface('#202725', { roughness: .83 }),
    wood: surface('#d2b48a', { map: woodMap, bumpMap: woodMap, bumpScale: .025, roughness: .72 }),
    metal: surface('#a3a99a', { metalness: .8, roughness: .28 }), brass: surface('#a48c54', { metalness: .7, roughness: .32 }),
    orange: surface('#bf694b', { roughness: .8 }), paper: surface('#eee7d2', { roughness: .94 }),
    wall: surface('#ece7dc', { map: plasterMap, bumpMap: plasterMap, bumpScale: .022, roughness: .97 }),
    green: surface('#47674e', { roughness: .88 }), leaf: surface('#718256', { roughness: .84 }),
    key: surface('#e8e1cf', { roughness: .58 }), keyDark: surface('#6c7b69', { roughness: .63 }),
    rubber: surface('#3a4037', { roughness: .98 }), red: surface('#b36d53', { roughness: .92 }),
  };
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1); geometries.set('box', boxGeometry);
  function mesh(geo, material, x = 0, y = 0, z = 0, parent = objects, shadow = true) {
    const item = new THREE.Mesh(geo, material); item.position.set(x, y, z); item.castShadow = shadow; item.receiveShadow = true; parent.add(item); return item;
  }
  function box(w, h, d, x, y, z, material, parent = objects, rounding = 0) {
    if (!rounding) { const item = mesh(boxGeometry, material, x, y, z, parent); item.scale.set(w, h, d); return item; }
    const key = `round:${w},${h},${d},${rounding}`;
    if (!geometries.has(key)) geometries.set(key, new RoundedBoxGeometry(w, h, d, 3, rounding));
    return mesh(geometries.get(key), material, x, y, z, parent);
  }
  function cylinder(r, h, x, y, z, material, parent = objects, sides = 28) {
    const key = `cylinder:${sides}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(1, 1, 1, sides));
    const item = mesh(geometries.get(key), material, x, y, z, parent); item.scale.set(r, h, r); return item;
  }
  function cable(points, radius = .022, material = mat.black, parent = objects) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    const geometry = new THREE.TubeGeometry(curve, 40, radius, 7, false); geometries.set(`cable:${geometries.size}`, geometry);
    return mesh(geometry, material, 0, 0, 0, parent);
  }
  function screw(x, y, z, parent = objects) {
    const head = cylinder(.038, .016, x, y, z, mat.metal, parent, 12); head.rotation.x = Math.PI / 2;
    box(.042, .007, .006, x, y, z + .012, mat.black, parent);
  }
  function textPlane(map, width, height, x, y, z, parent = objects) {
    const material = new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }); materials.add(material);
    const geometry = new THREE.PlaneGeometry(width, height); geometries.set(`plane:${geometries.size}`, geometry);
    return mesh(geometry, material, x, y, z, parent, false);
  }

  // Room, window and physical floor. Slightly varied plank seams stay visible at close range.
  box(24, .12, 24, 0, -.08, 1, mat.wood);
  const floorLines = new THREE.InstancedMesh(boxGeometry, surface('#6e553c', { roughness: .98 }), 30);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 30; i++) { dummy.position.set(0, -.012, -10.6 + i * .8); dummy.scale.set(24, .004, .012); dummy.updateMatrix(); floorLines.setMatrixAt(i, dummy.matrix); }
  floorLines.receiveShadow = true; objects.add(floorLines);
  box(18, 10, .18, 0, 4.95, -5.1, mat.wall);
  box(.18, 10, 18, -7.8, 4.95, 3.8, mat.wall);
  box(18, .17, .16, 0, .13, -4.92, mat.cream);
  box(.16, .17, 18, -7.63, .13, 3.8, mat.cream);
  const sky = texture(256, 512, (ctx, w, h) => { const gradient = ctx.createLinearGradient(0, 0, 0, h); gradient.addColorStop(0, '#a9c8c6'); gradient.addColorStop(1, '#e5e9d0'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h); });
  box(4.4, 4.6, .25, -3.5, 5.2, -4.9, mat.cream, objects, .07);
  textPlane(sky, 3.94, 4.12, -3.5, 5.2, -4.745);
  for (const x of [-5.52, -3.5, -1.48]) box(.09, 4.2, .15, x, 5.2, -4.6, mat.cream);
  box(4.1, .09, .15, -3.5, 5.45, -4.6, mat.cream);
  box(4.7, .16, .65, -3.5, 2.87, -4.56, mat.wood, objects, .025);
  const rug = box(6.6, .028, 5.6, .2, .02, 3.1, mat.red, objects, .025);
  box(6.22, .007, 5.21, .2, .038, 3.1, surface('#b99671', { roughness: 1 }));

  // Oak desk: rounded top, real edge lip, metal rails and adjustable feet.
  box(10.7, .25, 5.5, 0, 2.42, -.05, mat.wood, objects, .09);
  box(10.45, .055, .08, 0, 2.48, 2.68, mat.wood);
  for (const x of [-4.55, 4.55]) {
    for (const z of [-1.9, 1.95]) { box(.13, 2.28, .13, x, 1.18, z, mat.dark, objects, .025); cylinder(.13, .065, x, .065, z, mat.rubber); }
    box(.13, .13, 3.94, x, .35, .03, mat.dark, objects, .025);
  }
  box(9.2, .13, .13, 0, 1.98, -1.87, mat.dark, objects, .025);
  // Small cable tray below the rear edge, with visible power and data leads.
  box(3.8, .17, .5, .3, 2.16, -2.20, mat.dark, objects, .025);
  cable([[.1, 2.18, -2.3], [.25, 1.6, -2.45], [.7, .4, -2.5], [1.6, .04, -3.2], [2.8, .04, -4.75]], .028);

  // Monitor: substantial rounded housing, separate bezel, screen lip, screws and side vents.
  const computer = new THREE.Group(); objects.add(computer);
  box(2.8, .17, 1.75, 0, 2.68, -1.10, mat.bezel, computer, .07);
  box(.48, 1.05, .43, 0, 3.19, -1.23, mat.cream, computer, .08);
  box(4.52, 3.26, .93, 0, 4.57, -1.14, mat.cream, computer, .19);
  box(4.26, 2.98, .13, 0, 4.60, -.646, mat.bezel, computer, .075);
  box(3.98, 2.57, .10, 0, 4.65, -.557, mat.dark, computer, .12);
  for (const x of [-2.04, 2.04]) for (const y of [3.27, 5.96]) screw(x, y, -.564, computer);
  const vents = new THREE.InstancedMesh(boxGeometry, mat.dark, 28);
  for (let i = 0; i < 28; i++) {
    const side = i < 14 ? -1 : 1, row = i % 14;
    dummy.position.set(side * 2.266, 4.02 + row * .08, -1.28); dummy.rotation.set(0, 0, 0); dummy.scale.set(.012, .023, .46); dummy.updateMatrix(); vents.setMatrixAt(i, dummy.matrix);
  }
  computer.add(vents);
  box(3.6, .045, .025, 0, 3.17, -.62, mat.dark, computer);
  const badgeMap = texture(512, 100, (ctx, w, h) => { ctx.fillStyle = '#284139'; ctx.font = 'italic 64px Georgia'; ctx.fillText('serkon', 15, 73); ctx.font = '16px Arial'; ctx.fillText('PERSONAL COMPUTER / 01', 238, 69); });
  textPlane(badgeMap, 2.3, .45, 0, 3.22, -.556, computer);
  const power = cylinder(.045, .015, 1.67, 3.24, -.544, surface('#95d197', { emissive: '#7fc591', emissiveIntensity: .55 }), computer, 16); power.rotation.x = Math.PI / 2;
  for (const x of [1.83, 1.95]) { const control = cylinder(.047, .036, x, 3.24, -.54, mat.dark, computer, 16); control.rotation.x = Math.PI / 2; }
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = 1440; screenCanvas.height = 880;
  const screenCtx = screenCanvas.getContext('2d');
  const screenMap = new THREE.CanvasTexture(screenCanvas); screenMap.colorSpace = THREE.SRGBColorSpace; screenMap.anisotropy = 8; textures.add(screenMap);
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenMap, toneMapped: false }); materials.add(screenMaterial);
  const screenGeometry = new THREE.PlaneGeometry(3.74, 2.28); geometries.set('screen', screenGeometry);
  const screenTarget = mesh(screenGeometry, screenMaterial, 0, 4.65, -.492, computer, false);
  screenTarget.name = 'Enter Serkon OS'; screenTarget.userData.enterComputer = true;
  function drawScreen(opening = false, blink = true) {
    const ctx = screenCtx, w = screenCanvas.width, h = screenCanvas.height;
    ctx.fillStyle = '#173c34'; ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * .55, h * .48, 10, w * .55, h * .48, 850); glow.addColorStop(0, '#53786035'); glow.addColorStop(1, '#0b231a00'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d4dbc3'; ctx.font = '22px Arial'; ctx.fillText('SERKON OS', 62, 65); ctx.textAlign = 'right'; ctx.fillText('PERSONAL COMPUTER / 01', w - 62, 65); ctx.textAlign = 'left';
    ctx.fillStyle = '#b5c2a3'; ctx.fillRect(62, 90, w - 124, 1);
    ctx.font = 'italic 128px Georgia'; ctx.fillStyle = '#f0e5c8'; ctx.fillText('Serkon’s space.', 90, 308);
    ctx.font = '40px "PingFang SC", Arial, sans-serif'; ctx.fillStyle = '#ced6b9'; ctx.fillText('侯世康的电脑', 96, 386);
    ctx.fillStyle = '#d5ad72'; ctx.beginPath(); ctx.roundRect(99, 486, 145, 96, 7); ctx.fill(); ctx.fillStyle = '#e6c38a'; ctx.beginPath(); ctx.roundRect(99, 470, 72, 24, 5); ctx.fill();
    ctx.fillStyle = '#e5e6cf'; ctx.font = '25px "PingFang SC", Arial, sans-serif'; ctx.fillText('创作后院', 95, 626); ctx.font = '23px monospace'; ctx.fillStyle = '#95aa8d'; ctx.fillText(opening ? 'Opening your desktop…' : '作品 / 照片 / 音乐', 310, 540);
    ctx.strokeStyle = '#d9dfbd70'; ctx.strokeRect(90, 710, w - 180, 78); ctx.fillStyle = '#d9dfbd'; ctx.font = '26px "PingFang SC", Arial, sans-serif'; ctx.fillText(opening ? '正在进入桌面' : '点击屏幕，坐到电脑前', 124, 760);
    if (blink) { ctx.fillStyle = '#e2b47b'; ctx.fillRect(w - 155, 738, 15, 25); }
    ctx.fillStyle = '#091e1313'; for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    screenMap.needsUpdate = true;
  }
  drawScreen();
  // Faint, angled reflected highlight avoids hiding the readable display.
  const glassMap = texture(256, 256, (ctx, w, h) => { const gradient = ctx.createLinearGradient(0, 0, w, h); gradient.addColorStop(0, '#ffffff22'); gradient.addColorStop(.40, '#ffffff00'); gradient.addColorStop(1, '#ffffff02'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h); });
  textPlane(glassMap, 3.74, 2.28, 0, 4.65, -.487, computer);

  // Keyboard: individual rounded keycaps, a separate printed legend overlay, and a coiled lead.
  const keyboard = new THREE.Group(); keyboard.position.set(-.15, 2.61, 1.22); keyboard.rotation.y = -.025; objects.add(keyboard);
  box(4.28, .16, 1.60, 0, -.025, 0, mat.bezel, keyboard, .06);
  const keyGeometry = new RoundedBoxGeometry(.238, .105, .235, 2, .025); geometries.set('keycaps', keyGeometry);
  const keycaps = new THREE.InstancedMesh(keyGeometry, mat.key, 67);
  let keyCount = 0;
  const keyLocations = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 15; col++) {
    const x = -1.92 + col * .274, z = -.57 + row * .285;
    dummy.position.set(x, .09, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); keycaps.setMatrixAt(keyCount++, dummy.matrix); keyLocations.push({ x, z, row, col });
  }
  for (const x of [-1.92, -1.57, -1.22, 1.05, 1.4, 1.75, 2.02]) { dummy.position.set(x, .09, .57); dummy.updateMatrix(); keycaps.setMatrixAt(keyCount++, dummy.matrix); }
  keycaps.castShadow = true; keycaps.receiveShadow = true; keyboard.add(keycaps);
  box(1.88, .105, .235, -.13, .09, .57, mat.keyDark, keyboard, .025);
  const keyLabels = texture(1024, 400, (ctx, w, h) => {
    const rows = ['ESC1234567890−=⌫', 'QWERTYUIOP[]\\  ', 'ASDFGHJKL;\'    ', 'ZXCVBNM,./ ↑   '];
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#576452'; ctx.font = '20px Arial';
    for (const key of keyLocations) { const x = (key.x / 4.28 + .5) * w, y = (key.z / 1.6 + .5) * h; ctx.fillText(rows[key.row][key.col] || '', x, y); }
  });
  const legends = textPlane(keyLabels, 4.28, 1.6, 0, .146, 0, keyboard); legends.rotation.x = -Math.PI / 2;
  cable([[-1.52, 2.62, .40], [-1.5, 2.61, .03], [-2.12, 2.60, -.28], [-1.2, 2.59, -1.75], [-.6, 2.85, -1.8]], .025);
  const mouse = new THREE.Group(); mouse.position.set(3.01, 2.69, 1.18); mouse.rotation.y = -.13; objects.add(mouse);
  box(.76, .26, 1.13, 0, 0, 0, mat.cream, mouse, .12); box(.008, .008, .42, 0, .133, -.29, mat.dark, mouse);
  const wheel = cylinder(.055, .11, 0, .152, -.20, mat.dark, mouse, 16); wheel.rotation.z = Math.PI / 2;
  cable([[3.08, 2.69, .61], [3.32, 2.62, .20], [3.41, 2.59, -.42], [2.62, 2.59, -1.83], [1.34, 2.79, -1.85]], .023);
  box(1.9, .025, 2.02, 3, 2.56, 1.23, mat.dark, objects, .07);

  // Near-field speakers have independent drivers, cabinet seams and tiny grille texture.
  for (const x of [-3.08, 3.02]) {
    const speaker = new THREE.Group(); speaker.position.set(x, 3.32, -1.04); objects.add(speaker);
    box(.82, 1.43, .87, 0, 0, 0, mat.wood, speaker, .045);
    box(.70, 1.31, .045, 0, 0, .452, mat.dark, speaker, .02);
    const woofer = cylinder(.235, .04, 0, -.20, .49, mat.black, speaker, 32); woofer.rotation.x = Math.PI / 2;
    const surround = mesh(new THREE.TorusGeometry(.235, .018, 6, 32), mat.rubber, 0, -.20, .52, speaker); geometries.set(`woofer:${x}`, surround.geometry);
    const cone = cylinder(.177, .018, 0, -.20, .518, mat.dark, speaker, 32); cone.rotation.x = Math.PI / 2;
    const tweeter = cylinder(.10, .027, 0, .36, .49, mat.brass, speaker, 24); tweeter.rotation.x = Math.PI / 2;
    for (const xx of [-.28, .28]) for (const yy of [-.54, .54]) screw(xx, yy, .49, speaker);
  }

  // Adjustable reading light, notebook, pen and mug are physical desk objects.
  cylinder(.50, .09, -4.22, 2.62, -.45, mat.dark);
  cable([[-4.22, 2.68, -.45], [-4.22, 4.06, -.45], [-3.83, 4.83, -.38], [-3.11, 4.95, -.12]], .065, mat.brass);
  const shade = mesh(new THREE.ConeGeometry(.45, .56, 32, 1, true), mat.dark, -3.07, 4.89, -.09); shade.rotation.z = -.27; geometries.set('lamp-shade', shade.geometry);
  const bulbMaterial = surface('#ffe7ab', { emissive: '#ffc678', emissiveIntensity: 1.4 });
  const bulb = mesh(new THREE.SphereGeometry(.13, 16, 12), bulbMaterial, -3.04, 4.72, -.08); geometries.set('lamp-bulb', bulb.geometry);
  const lamp = new THREE.PointLight('#ffcd8b', 5, 7, 2); lamp.position.set(-3.05, 4.63, -.05); scene.add(lamp);
  box(1.28, .08, 1.67, -3.0, 2.63, 1.38, mat.paper, objects, .018);
  const noteMap = texture(512, 650, (ctx, w, h) => { ctx.fillStyle = '#eee6d1'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#4e6756'; ctx.font = 'italic 56px Georgia'; ctx.fillText('Serkon', 45, 100); ctx.font = '27px "PingFang SC", Arial'; const lines = ['作品 / 影像 / 音乐', '', '把东西做出来。', '', '01  创作后院', '02  作品文件夹', '03  今天的照片']; lines.forEach((line, i) => ctx.fillText(line, 45, 170 + i * 57)); ctx.strokeStyle = '#a9aa923f'; for (let y = 225; y < h; y += 57) { ctx.beginPath(); ctx.moveTo(42, y); ctx.lineTo(w - 42, y); ctx.stroke(); } });
  const note = textPlane(noteMap, 1.19, 1.56, -3.0, 2.676, 1.38); note.rotation.x = -Math.PI / 2; note.rotation.z = -.03;
  const pen = cylinder(.032, 1.36, -2.13, 2.62, 1.37, mat.dark, objects, 12); pen.rotation.x = Math.PI / 2; pen.rotation.z = -.12;
  cylinder(.24, .47, 4.15, 2.82, .25, mat.cream, objects, 32);
  const coffee = cylinder(.202, .008, 4.15, 3.06, .25, surface('#513f2c'), objects, 32);
  const mugHandle = mesh(new THREE.TorusGeometry(.17, .042, 10, 24), mat.cream, 4.39, 2.84, .25); mugHandle.rotation.y = Math.PI / 2; geometries.set('mug-handle', mugHandle.geometry);

  // A personal photo, books, an understated wall shelf and botanical leaves.
  const frame = new THREE.Group(); frame.position.set(4.08, 3.45, -1.77); frame.rotation.y = -.22; objects.add(frame);
  box(1.08, 1.47, .10, 0, 0, 0, mat.dark, frame, .025);
  const portrait = new THREE.TextureLoader().load(new URL('portrait.jpg', new URL(assetBase, document.baseURI)).href); portrait.colorSpace = THREE.SRGBColorSpace; portrait.anisotropy = 8; textures.add(portrait);
  const portraitMaterial = new THREE.MeshBasicMaterial({ map: portrait, toneMapped: false }); materials.add(portraitMaterial);
  const portraitGeometry = new THREE.PlaneGeometry(.72, 1.28); geometries.set('personal-photo', portraitGeometry);
  mesh(portraitGeometry, portraitMaterial, 0, 0, .059, frame, false);
  const photoSupport = box(.08, .88, .08, 0, -.27, -.27, mat.dark, frame); photoSupport.rotation.x = -.32;
  const bookColors = ['#718167', '#b56d4e', '#d8c49b', '#4e6862'];
  for (let i = 0; i < 4; i++) {
    const book = box(1.60 - i * .08, .17 + i * .015, 1.2, -4.16 + i * .025, 2.66 + i * .19, -1.59, surface(bookColors[i]), objects, .016); book.rotation.y = -.08 + i * .035;
    box(1.49 - i * .08, .12 + i * .015, 1.16, -4.16 + i * .025, 2.665 + i * .19, -1.57, mat.paper, objects, .008);
  }
  box(3.5, .16, .85, 3.8, 5.5, -4.55, mat.wood, objects, .025);
  for (const x of [2.45, 5.17]) { box(.08, .6, .55, x, 5.24, -4.55, mat.dark); }
  for (let i = 0; i < 7; i++) { const height = .6 + random() * .5; const book = box(.19 + random() * .08, height, .45, 2.42 + i * .33, 5.60 + height / 2, -4.53, surface(bookColors[i % 4]), objects, .012); book.rotation.z = i === 6 ? -.11 : .015 * (random() - .5); }
  const pot = cylinder(.39, .55, 4.74, 2.85, -2.15, mat.orange, objects, 24);
  const soil = cylinder(.33, .02, 4.74, 3.13, -2.15, surface('#4b4938'), objects, 24);
  for (let i = 0; i < 11; i++) {
    const angle = i * 2.399, length = .55 + random() * .65;
    const leaf = mesh(new THREE.SphereGeometry(1, 10, 6), i % 2 ? mat.leaf : mat.green, 4.74 + Math.cos(angle) * .30, 3.35 + length * .35, -2.15 + Math.sin(angle) * .30);
    leaf.scale.set(.14, length * .63, .055); leaf.rotation.set(Math.sin(angle) * .55, angle, Math.cos(angle) * -.65); geometries.set(`leaf:${i}`, leaf.geometry);
  }
  const headphones = new THREE.Group(); headphones.position.set(1.7, 2.71, 2.05); headphones.rotation.y = .2; headphones.rotation.x = -.10; objects.add(headphones);
  const band = mesh(new THREE.TorusGeometry(.52, .057, 10, 32, Math.PI), mat.dark, 0, .12, 0, headphones); geometries.set('headphones-band', band.geometry);
  for (const x of [-.52, .52]) { box(.21, .40, .38, x, .05, 0, mat.black, headphones, .08); box(.09, .29, .29, x > 0 ? x - .1 : x + .1, .05, 0, mat.rubber, headphones, .04); }

  // Chair remains below the screen in the opening shot and grounds the inhabited room.
  const chair = new THREE.Group(); chair.position.set(.20, 0, 3.6); chair.rotation.y = -.13; objects.add(chair);
  cylinder(.18, 1.25, 0, .69, 0, mat.metal, chair);
  box(2.02, .20, 1.87, 0, 1.46, 0, mat.dark, chair, .15);
  const chairBack = box(2.08, 1.35, .18, 0, 2.12, .84, mat.dark, chair, .13); chairBack.rotation.x = -.11;
  for (let i = 0; i < 5; i++) { const angle = i * Math.PI * 2 / 5; cable([[0, .15, 0], [Math.cos(angle) * .4, .11, Math.sin(angle) * .4], [Math.cos(angle) * 1.08, .12, Math.sin(angle) * 1.08]], .05, mat.dark, chair); const caster = cylinder(.09, .10, Math.cos(angle) * 1.08, .08, Math.sin(angle) * 1.08, mat.rubber, chair, 12); caster.rotation.z = Math.PI / 2; }

  // Lighting is shared by all textures and geometry rather than painted into a single backdrop.
  scene.add(new THREE.HemisphereLight('#fff2dc', '#8f9784', 1.55));
  const windowLight = new THREE.DirectionalLight('#fff0d4', 2.5); windowLight.position.set(-5.5, 8, 2.8); windowLight.target.position.set(0, 2.8, 0); windowLight.castShadow = true;
  windowLight.shadow.mapSize.set(innerWidth < 760 ? 1024 : 2048, innerWidth < 760 ? 1024 : 2048);
  Object.assign(windowLight.shadow.camera, { left: -9, right: 9, top: 10, bottom: -7, near: .1, far: 30 });
  windowLight.shadow.bias = -.00025; windowLight.shadow.normalBias = .025; scene.add(windowLight, windowLight.target);
  const fill = new THREE.DirectionalLight('#c1d8d6', .65); fill.position.set(5, 6, 4); scene.add(fill);

  const screenCenter = new THREE.Vector3(0, 4.65, -.492);
  const initialPosition = new THREE.Vector3(), initialTarget = new THREE.Vector3();
  let zooming = false, finished = false, notified = false, elapsed = 0, previousBlink = -1;
  let fromPosition = new THREE.Vector3(), fromTarget = new THREE.Vector3(), lookTarget = new THREE.Vector3();
  function initialView(width, height) {
    const portrait = width / height < .8;
    initialTarget.set(portrait ? 0 : -.2, portrait ? 3.55 : 3.25, -.4);
    initialPosition.set(portrait ? 5.5 : 9.2, portrait ? 8.2 : 7.9, portrait ? 17.8 : 11.5);
    if (width / height < .43) initialPosition.multiplyScalar(1.08);
  }
  function finalPosition() {
    // Cover rather than contain: at completion the screen becomes the entire responsive desktop.
    const half = Math.tan(camera.fov * Math.PI / 360);
    const distance = Math.min(2.28 / (2 * half), 3.74 / (2 * half * camera.aspect)) * .96;
    return screenCenter.clone().add(new THREE.Vector3(0, 0, distance));
  }
  function resize(width, height) {
    camera.aspect = width / height; camera.fov = width / height < .8 ? 39 : 38; camera.updateProjectionMatrix();
    initialView(width, height);
    if (!zooming && !finished) { camera.position.copy(initialPosition); lookTarget.copy(initialTarget); camera.lookAt(lookTarget); }
    if (finished) { camera.position.copy(finalPosition()); camera.lookAt(screenCenter); }
  }
  function reset() {
    zooming = finished = notified = false; elapsed = 0; previousBlink = -1;
    camera.position.copy(initialPosition); lookTarget.copy(initialTarget); camera.lookAt(lookTarget); drawScreen(false, true);
  }
  function startZoom() {
    if (zooming || finished) return;
    zooming = true; elapsed = 0; fromPosition.copy(camera.position); fromTarget.copy(lookTarget); drawScreen(true, true);
  }
  function update(dt, time, { reducedMotion = false } = {}) {
    if (zooming) {
      elapsed += Math.min(.1, Math.max(0, dt));
      const t = reducedMotion ? 1 : Math.min(1, elapsed / 1.65), eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      camera.position.lerpVectors(fromPosition, finalPosition(), eased); lookTarget.lerpVectors(fromTarget, screenCenter, eased); camera.lookAt(lookTarget);
      if (t === 1) { zooming = false; finished = true; }
    } else if (!finished) {
      const blink = reducedMotion ? 1 : Math.floor(time * 1.3) % 2;
      if (blink !== previousBlink) { previousBlink = blink; drawScreen(false, Boolean(blink)); }
    }
    power.material.emissiveIntensity = reducedMotion ? .55 : .55 + Math.sin(time * 1.6) * .10;
    if (finished && !notified) { notified = true; return { complete: true }; }
    return { complete: false };
  }
  resize(innerWidth, innerHeight);
  return { scene, camera, screenTarget, startZoom, reset, resize, update, dispose() {
    for (const geometry of new Set(geometries.values())) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const map of textures) map.dispose();
    scene.clear();
  } };
}
