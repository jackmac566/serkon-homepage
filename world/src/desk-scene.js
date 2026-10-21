import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Original, tactile desk scene. Shares the host renderer; does not create DOM UI or a render loop. */
export function createDeskScene(THREE, { assetBase = './assets/', environmentMap = null, surfaceMaps = {} } = {}) {
  const scene = new THREE.Scene();
  scene.name = 'Serkon — a quiet place to make things';
  scene.background = new THREE.Color('#f7f7f4');
  scene.fog = new THREE.Fog('#f7f7f4', 42, 90);
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
    ctx.fillStyle = '#ded2bd'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1150; i++) {
      const y = random() * h, phase = random() * 9;
      ctx.strokeStyle = i % 3 ? `rgba(105,85,57,${.018 + random() * .055})` : 'rgba(255,255,245,.18)';
      ctx.lineWidth = .3 + random() * 1.2; ctx.beginPath();
      for (let x = 0; x <= w; x += 16) { const yy = y + Math.sin(x / 170 + phase) * (2 + random() * 4); if (!x) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke();
    }
    ctx.strokeStyle = '#a38d6e14'; ctx.lineWidth = 1; for (let y = 128; y < h; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  });
  const weaveMap = texture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#596166'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) {
      ctx.fillStyle = ((x + y) / 6) % 2 ? '#a5aca8' : '#2b3032'; ctx.fillRect(x, y, 2, 5); ctx.fillRect(x + 2, y + 1, 4, 2);
    }
  });
  weaveMap.wrapS = weaveMap.wrapT = THREE.RepeatWrapping; weaveMap.repeat.set(5, 2);
  const surface = (color, extra = {}) => { const mat = new THREE.MeshStandardMaterial({ color, roughness: .7, metalness: 0, ...extra }); materials.add(mat); return mat; };
  const mat = {
    cream: surface('#ece8dd', { roughness: .44 }), bezel: surface('#d8d5c9', { roughness: .54 }),
    dark: surface('#263d36', { roughness: .48 }), black: surface('#202725', { roughness: .83 }),
    wood: surface('#ffffff', { map: woodMap, bumpMap: woodMap, bumpScale: .011, roughness: .56 }),
    metal: surface('#a3a99a', { metalness: .8, roughness: .28 }), brass: surface('#a48c54', { metalness: .7, roughness: .32 }),
    orange: surface('#bf694b', { roughness: .8 }), paper: surface('#eee7d2', { roughness: .94 }),
    white: surface('#f0f0eb', { roughness: .4 }), floor: surface('#f7f7f4', { roughness: .96 }),
    fabric: surface('#a9b4ad', { map: weaveMap, bumpMap: weaveMap, bumpScale: .012, roughness: .96 }),
    midnight: surface('#252a2e', { metalness: .78, roughness: .31 }),
    earMesh: surface('#292d31', { map: weaveMap, bumpMap: weaveMap, bumpScale: .013, roughness: .96 }),
    green: surface('#47674e', { roughness: .88 }), leaf: surface('#718256', { roughness: .84 }),
    key: surface('#e8e1cf', { roughness: .58 }), keyDark: surface('#6c7b69', { roughness: .63 }),
    rubber: surface('#3a4037', { roughness: .98 }), red: surface('#b36d53', { roughness: .92 }),
  };
  // Real walnut scan gives the desk warmth against the white room.
  if (surfaceMaps.desk) {
    const source=surfaceMaps.desk;
    for (const key of ['map','normalMap','roughnessMap']) {const map=source[key].clone();map.repeat.set(2,1);map.needsUpdate=true;textures.add(map);mat.wood[key]=map;}
    mat.wood.color.set('#ba824f');mat.wood.bumpMap=null;mat.wood.normalScale.set(.28,.28);mat.wood.roughness=.66;
  }
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

  // A continuous white studio floor leaves the complete object visible from every orbit angle.
  box(180, .12, 180, 0, -.085, 0, mat.floor);
  const dummy = new THREE.Object3D();
  const contactMap = texture(256, 256, (ctx, w, h) => {
    const glow = ctx.createRadialGradient(w / 2, h / 2, w * .08, w / 2, h / 2, w * .5);
    glow.addColorStop(0, '#46514b40'); glow.addColorStop(.55, '#46514b18'); glow.addColorStop(1, '#46514b00');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
  });
  for (const [x, z, w, d] of [[0, -.15, 13, 8.5], [.2, 3.4, 4.8, 4.7]]) {
    const contact = textPlane(contactMap, w, d, x, -.019, z); contact.rotation.x = -Math.PI / 2; contact.renderOrder = 1;
  }

  // Pale ash top and porcelain drawer pedestal: rounded furniture, full backs and visible joinery.
  box(10.7, .25, 5.5, 0, 2.42, -.05, mat.wood, objects, .09);
  box(10.35, .045, 5.13, 0, 2.275, -.05, mat.white, objects, .025);
  box(1.88, 2.12, 4.67, -4.13, 1.2, -.15, mat.white, objects, .065);
  box(1.65, .15, 4.31, -4.13, .12, -.15, mat.dark, objects, .025);
  for (let i = 0; i < 3; i++) {
    const yy = .52 + i * .663;
    box(1.76, .63, .09, -4.13, yy, 2.225, mat.white, objects, .025);
    box(.66, .028, .035, -4.13, yy + .19, 2.285, mat.metal, objects, .012);
  }
  for (const z of [-2.02, 2.02]) { box(.15, 2.22, .15, 4.55, 1.18, z, mat.white, objects, .045); cylinder(.12, .06, 4.55, .055, z, mat.rubber); }
  box(.15, .14, 4.1, 4.55, .17, 0, mat.white, objects, .04);
  box(8.7, .12, .12, .1, 2.04, -2.08, mat.white, objects, .025);
  box(3.8, .17, .5, .3, 2.16, -2.20, mat.white, objects, .025);
  cable([[.1, 2.18, -2.3], [.25, 1.6, -2.45], [.7, .4, -2.5], [1.6, .04, -2.55]], .024, mat.bezel);

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
  const rear = new THREE.Group(); rear.position.set(0, 4.57, -1.619); rear.rotation.y = Math.PI; computer.add(rear);
  box(3.44, 2.45, .045, 0, 0, 0, mat.bezel, rear, .10);
  for (let row = 0; row < 9; row++) box(2.26, .028, .016, 0, .30 + row * .076, .031, mat.dark, rear, .009);
  for (const x of [-1.5, 1.5]) for (const y of [-1.0, 1.0]) screw(x, y, .034, rear);
  box(1.58, .40, .055, .32, -.75, .045, mat.dark, rear, .035);
  for (const [x, width] of [[-.18, .22], [.15, .22], [.57, .40]]) {
    box(width, .10, .020, x, -.76, .082, mat.metal, rear, .018);
    box(width - .04, .052, .025, x, -.76, .097, mat.black, rear, .010);
  }
  const rearLabel = texture(512, 128, (ctx) => {
    ctx.fillStyle = '#44554a'; ctx.font = '38px Georgia'; ctx.fillText('SERKON / PERSONAL COMPUTER', 18, 48);
    ctx.font = '20px monospace'; ctx.fillText('DESIGNED FOR MAKING THINGS.  № 001', 18, 88);
  });
  textPlane(rearLabel, 2.45, .61, 0, -.28, .033, rear);
  cable([[.77, 3.77, -1.78], [.73, 3.45, -1.90], [.48, 2.70, -2.10], [.13, 2.58, -2.3]], .033, mat.bezel);
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

  // Loose manuscript sheets, a cloth-bound notebook and a metal pen: quiet, useful desk objects.
  const documents = new THREE.Group(); documents.position.set(-3.20, 2.565, .95); documents.rotation.y = -.11; objects.add(documents);
  for (let i = 0; i < 5; i++) {
    const sheet = box(1.46, .008, 1.91, i * .018, i * .012, i * -.019, mat.paper, documents, .006); sheet.rotation.y = (i - 2) * .017;
  }
  const noteMap = texture(512, 650, (ctx, w, h) => {
    ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#354b40';
    ctx.font = 'italic 56px Georgia'; ctx.fillText('Serkon', 45, 95); ctx.font = '24px "PingFang SC", Arial';
    const lines = ['创作笔记 / 01', '', '把东西做出来。', '', '作品   影像   音乐', '', '今天，也往前一点。'];
    lines.forEach((line, i) => ctx.fillText(line, 45, 164 + i * 56)); ctx.strokeStyle = '#91a08d45';
    for (let y = 227; y < h; y += 56) { ctx.beginPath(); ctx.moveTo(42, y); ctx.lineTo(w - 42, y); ctx.stroke(); }
  });
  const note = textPlane(noteMap, 1.40, 1.84, .07, .056, -.08, documents); note.rotation.x = -Math.PI / 2;
  box(1.05, .095, 1.56, -3.93, 2.60, -.95, mat.dark, objects, .028);
  box(.99, .055, 1.51, -3.93, 2.66, -.95, mat.paper, objects, .010);
  box(1.05, .023, 1.56, -3.93, 2.70, -.95, mat.dark, objects, .010);
  const pen = cylinder(.026, 1.37, -2.19, 2.60, 1.17, mat.midnight, objects, 16); pen.rotation.x = Math.PI / 2; pen.rotation.z = -.13;
  const penTip = cylinder(.018, .15, -2.28, 2.60, 1.85, mat.metal, objects, 12); penTip.rotation.x = Math.PI / 2;

  // These are original typographic covers; the named novels are represented by readable book spines.
  const novels = [
    { title: '斗破苍穹', color: '#3c5453', ink: '#eee4c5', w: .35, h: 1.82, lean: -.055 },
    { title: '斗罗大陆', color: '#314854', ink: '#e5debf', w: .37, h: 1.96, lean: -.035 },
    { title: '仙逆', color: '#85644d', ink: '#f2e7cd', w: .32, h: 1.78, lean: .025 },
    { title: '完美世界', color: '#d1c6ae', ink: '#344e45', w: .39, h: 2.05, lean: -.105 },
    { title: '画江湖之不良人', color: '#534448', ink: '#eadab8', w: .44, h: 1.92, lean: -.145 },
  ];
  let bookX = 2.70;
  novels.forEach((novel, index) => {
    const book = new THREE.Group(); book.position.set(bookX, 2.565 + Math.abs(Math.sin(novel.lean)) * novel.w / 2, -1.77);
    book.rotation.set(0, -.035, novel.lean); objects.add(book);
    const cover = surface(novel.color, { roughness: .80 });
    const pages = box(novel.w - .045, novel.h - .07, 1.06, 0, novel.h / 2, -.015, mat.paper, book, .014);
    for (const side of [-1, 1]) box(.025, novel.h, 1.15, side * novel.w / 2, novel.h / 2, 0, cover, book, .010);
    box(novel.w + .024, novel.h, .067, 0, novel.h / 2, .560, cover, book, .025);
    for (let i = 0; i < 10; i++) box(novel.w - .063, .006, .005, 0, .11 + i * (novel.h - .2) / 10, -.550, mat.bezel, book);
    const spine = texture(256, 1024, (ctx, w, h) => {
      ctx.fillStyle = novel.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillRect(38, 42, w - 76, 3); ctx.fillRect(38, h - 50, w - 76, 3);
      ctx.font = '600 77px "Songti SC", "STSong", serif';
      const step = Math.min(133, 750 / novel.title.length), top = (h - step * (novel.title.length - 1)) / 2;
      [...novel.title].forEach((letter, i) => ctx.fillText(letter, w / 2, top + i * step));
      ctx.font = '22px Georgia'; ctx.fillText(String(index + 1).padStart(2, '0'), w / 2, 943);
    });
    textPlane(spine, novel.w * .91, novel.h * .97, 0, novel.h / 2, .598, book);
    const coverMap = texture(512, 850, (ctx, w, h) => {
      ctx.fillStyle = novel.color; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = novel.ink; ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, w - 60, h - 60); ctx.globalAlpha = .35;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(w * .5, h * .55, 58 + i * 24, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.fillStyle = novel.ink; ctx.textAlign = 'center';
      ctx.font = '600 43px "Songti SC", "STSong", serif';
      const titleLines = novel.title.length > 5 ? [novel.title.slice(0, 3), novel.title.slice(3)] : [novel.title];
      titleLines.forEach((line, i) => ctx.fillText(line, w / 2, 150 + i * 65));
      ctx.font = '20px Georgia'; ctx.fillText('SERKON’S BOOKSHELF', w / 2, h - 85);
    });
    const coverPrint = textPlane(coverMap, 1.11, novel.h * .98, novel.w / 2 + .015, novel.h / 2, 0, book); coverPrint.rotation.y = Math.PI / 2;
    bookX += novel.w + .085;
  });
  // Minimal bent-metal bookend: the lean has a visible physical support.
  box(.07, 1.15, 1.12, 4.98, 3.10, -1.77, mat.metal, objects, .025);
  box(.79, .035, 1.12, 4.62, 2.565, -1.77, mat.metal, objects, .015);

  // A single living plant balances the books. Individual stems and cupped leaves cast real shadows.
  const potX = -4.44, potZ = -1.86;
  const potGeometry = new THREE.CylinderGeometry(.39, .31, .57, 40); geometries.set('ceramic-pot', potGeometry);
  mesh(potGeometry, mat.white, potX, 2.86, potZ);
  const rimGeometry = new THREE.TorusGeometry(.375, .026, 8, 40); geometries.set('pot-rim', rimGeometry);
  const rim = mesh(rimGeometry, mat.white, potX, 3.15, potZ); rim.rotation.x = Math.PI / 2;
  cylinder(.344, .016, potX, 3.13, potZ, surface('#49473b'), objects, 32);
  const leafGeometry = new THREE.SphereGeometry(1, 14, 8); geometries.set('botanical-leaf', leafGeometry);
  for (let i = 0; i < 15; i++) {
    const angle = i * 2.399, height = .35 + random() * .85, reach = .20 + random() * .44;
    const x = potX + Math.cos(angle) * reach, z = potZ + Math.sin(angle) * reach, y = 3.21 + height;
    cable([[potX, 3.13, potZ], [potX + Math.cos(angle) * reach * .35, y - .20, potZ + Math.sin(angle) * reach * .35], [x, y, z]], .012, mat.green);
    const leaf = mesh(leafGeometry, i % 2 ? mat.leaf : mat.green, x, y + .10, z);
    leaf.scale.set(.13, .28 + random() * .11, .032); leaf.rotation.set(Math.sin(angle) * .65, angle, Math.cos(angle) * -.65);
  }

  // Midnight over-ear headphones: oval aluminium shells, mesh canopy, telescoping arms and USB-C.
  // The shape is modelled here, with no copied assets or brand marks.
  const headphones = new THREE.Group(); headphones.position.set(2.27, 2.78, .10);
  headphones.rotation.set(-Math.PI / 2, 0, -.26); objects.add(headphones);
  const cupGeometry = new RoundedBoxGeometry(.53, .84, .235, 5, .22); geometries.set('headphone-aluminium-shell', cupGeometry);
  const cushionGeometry = new RoundedBoxGeometry(.49, .79, .12, 5, .21); geometries.set('headphone-cushion', cushionGeometry);
  for (const side of [-1, 1]) {
    const cup = new THREE.Group(); cup.position.set(side * .61, 0, 0); cup.rotation.z = side * -.06; headphones.add(cup);
    mesh(cupGeometry, mat.midnight, 0, 0, 0, cup);
    mesh(cushionGeometry, mat.earMesh, 0, 0, -.145, cup);
    box(.29, .52, .018, 0, 0, -.211, mat.black, cup, .13);
    // Machined seam, fabric cushion and a tiny microphone opening stay legible when inspecting.
    box(.31, .010, .009, 0, -.33, .124, mat.black, cup, .004);
    const stem = cylinder(.024, .48, 0, .59, -.015, mat.metal, cup, 18);
    cylinder(.041, .23, 0, .43, -.015, mat.midnight, cup, 20);
    cable([[0, .39, -.06], [side * .11, .32, -.06], [side * .23, .12, -.03]], .027, mat.midnight, cup);
    if (side === 1) {
      const crown = cylinder(.052, .038, .11, .425, .045, mat.midnight, cup, 28);
      for (let i = 0; i < 14; i++) {
        const theta = i * Math.PI * 2 / 14;
        box(.008, .030, .008, .11 + Math.cos(theta) * .049, .425, .045 + Math.sin(theta) * .049, mat.metal, cup);
      }
      box(.105, .027, .047, -.11, .425, .035, mat.midnight, cup, .012);
      box(.105, .027, .015, 0, -.419, .015, mat.metal, cup, .012);
      box(.077, .012, .019, 0, -.421, .025, mat.black, cup, .005);
    }
  }
  // Two curved rails surround a broad, physically bowed knitted canopy.
  function bandPoint(t, z) { return [Math.cos(t) * .61, .68 + Math.sin(t) * .62, z]; }
  for (const z of [-.14, .14]) {
    const points = []; for (let i = 0; i <= 32; i++) points.push(bandPoint(i / 32 * Math.PI, z));
    cable(points, .026, mat.midnight, headphones);
  }
  const bandVertices = [], bandUV = [], bandIndices = [], segments = 40, crossSegments = 8;
  for (let i = 0; i <= segments; i++) for (let j = 0; j <= crossSegments; j++) {
    const t = i / segments * Math.PI, across = j / crossSegments;
    const point = bandPoint(t, -.14 + across * .28); point[1] -= Math.sin(across * Math.PI) * .065 * Math.sin(t);
    bandVertices.push(...point); bandUV.push(i / segments, across);
    if (i < segments && j < crossSegments) { const a = i * (crossSegments + 1) + j, b = a + crossSegments + 1; bandIndices.push(a, b, a + 1, b, b + 1, a + 1); }
  }
  const bandGeometry = new THREE.BufferGeometry(); bandGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bandVertices, 3));
  bandGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(bandUV, 2)); bandGeometry.setIndex(bandIndices); bandGeometry.computeVertexNormals(); geometries.set('woven-headband', bandGeometry);
  const canopyMaterial = surface('#656d70', { map: weaveMap, bumpMap: weaveMap, bumpScale: .013, roughness: .97, side: THREE.DoubleSide });
  mesh(bandGeometry, canopyMaterial, 0, 0, 0, headphones);

  // Upholstered task chair with a finished rear shell, armrests, gas lift and paired rolling casters.
  const chair = new THREE.Group(); chair.position.set(.20, 0, 3.55); chair.rotation.y = -.16; objects.add(chair);
  cylinder(.135, .97, 0, .72, 0, mat.metal, chair);
  cylinder(.205, .25, 0, .27, 0, mat.white, chair);
  box(2.02, .17, 1.87, 0, 1.39, 0, mat.white, chair, .13);
  box(1.99, .18, 1.83, 0, 1.52, 0, mat.fabric, chair, .12);
  const chairBack = new THREE.Group(); chairBack.position.set(0, 2.13, .82); chairBack.rotation.x = -.13; chair.add(chairBack);
  box(2.02, 1.43, .20, 0, 0, 0, mat.white, chairBack, .17);
  box(1.89, 1.30, .13, 0, .025, -.125, mat.fabric, chairBack, .15);
  box(.19, 1.09, .12, 0, -.45, .16, mat.metal, chairBack, .045);
  box(.43, .24, .25, 0, -.80, -.14, mat.white, chairBack, .05);
  for (const side of [-1, 1]) {
    cable([[side * .83, 1.34, .36], [side * 1.12, 1.55, .17], [side * 1.12, 1.97, .08]], .048, mat.white, chair);
    box(.22, .10, 1.15, side * 1.12, 2.00, -.07, mat.fabric, chair, .07);
  }
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5, x = Math.cos(angle) * 1.12, z = Math.sin(angle) * 1.12;
    cable([[0, .25, 0], [Math.cos(angle) * .48, .19, Math.sin(angle) * .48], [x, .14, z]], .064, mat.white, chair);
    cylinder(.065, .14, x, .13, z, mat.metal, chair, 16);
    for (const offset of [-.067, .067]) { const caster = cylinder(.105, .052, x, .084, z + offset, mat.rubber, chair, 20); caster.rotation.x = Math.PI / 2; }
  }

  scene.add(new THREE.HemisphereLight('#ffffff', '#adb8af', 1.8));
  const keyLight = new THREE.DirectionalLight('#fff7e8', 2.8); keyLight.position.set(-5.5, 10, 5); keyLight.target.position.set(0, 2.6, 0); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(innerWidth < 760 ? 1024 : 2048, innerWidth < 760 ? 1024 : 2048);
  Object.assign(keyLight.shadow.camera, { left: -9, right: 9, top: 10, bottom: -7, near: .1, far: 30 });
  keyLight.shadow.bias = -.00025; keyLight.shadow.normalBias = .018; keyLight.shadow.radius = 4; scene.add(keyLight, keyLight.target);
  const fill = new THREE.DirectionalLight('#e3edf1', .85); fill.position.set(5, 6, 4); scene.add(fill);
  const rimLight = new THREE.DirectionalLight('#ffffff', 1.0); rimLight.position.set(1, 7, -6); scene.add(rimLight);

  const screenCenter = new THREE.Vector3(0, 4.65, -.492);
  const inspectionTarget = new THREE.Vector3();
  const initialPosition = new THREE.Vector3(), initialTarget = inspectionTarget;
  let zooming = false, finished = false, notified = false, elapsed = 0, previousBlink = -1;
  const fromPosition = new THREE.Vector3(), fromTarget = new THREE.Vector3(), lookTarget = new THREE.Vector3(), direction = new THREE.Vector3();
  let initialized = false;
  function initialView(width, height) {
    const portrait = width / height < .8;
    initialTarget.set(0, portrait ? 3.40 : 3.12, .05);
    initialPosition.set(portrait ? 5.5 : 9.2, portrait ? 8.2 : 7.7, portrait ? 17.8 : 11.7);
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
    // OrbitControls owns the camera outside the deliberate entry animation. Resizing preserves its angle.
    if (!initialized) { camera.position.copy(initialPosition); lookTarget.copy(initialTarget); camera.lookAt(lookTarget); initialized = true; }
  }
  function reset() {
    zooming = finished = notified = false; elapsed = 0; previousBlink = -1;
    camera.position.copy(initialPosition); lookTarget.copy(initialTarget); camera.lookAt(lookTarget); drawScreen(false, true);
  }
  function startZoom() {
    if (zooming || finished) return;
    zooming = true; elapsed = 0; fromPosition.copy(camera.position);
    camera.getWorldDirection(direction);
    fromTarget.copy(camera.position).addScaledVector(direction, camera.position.distanceTo(inspectionTarget));
    drawScreen(true, true);
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
    if (finished && !notified) { notified = true; return { complete: true, zooming: false }; }
    return { complete: false, zooming };
  }
  resize(innerWidth, innerHeight);
  return { scene, camera, screenTarget, inspectionTarget, get isZooming() { return zooming; }, get defaultCameraRadius() { return initialPosition.distanceTo(inspectionTarget); }, startZoom, reset, resize, update, dispose() {
    for (const geometry of new Set(geometries.values())) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const map of textures) map.dispose();
    scene.clear();
  } };
}
