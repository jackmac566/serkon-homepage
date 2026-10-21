/**
 * Serkon's backyard. All architecture and props are original procedural meshes.
 * The only image textures are the owner's existing public project material.
 * Ground is y=0; the driveway remains flat for the root driving controller.
 */
export function createEnvironment(THREE, scene, { assetBase = './assets/' } = {}) {
  const root = new THREE.Group();
  root.name = 'Serkon creative backyard';
  scene.add(root);
  const colliders = [];
  const interactables = [];
  const geometries = new Map();
  const materials = new Set();
  const textures = new Set();
  const loader = new THREE.TextureLoader();
  const moving = {};
  const palette = {
    sand: '#d7c6a3', edge: '#bb9c78', road: '#f0e5cc', cream: '#fff4db',
    orange: '#d95c3d', blue: '#427d94', green: '#315f4e', ink: '#26392f',
    gold: '#e6b44d', paleBlue: '#a9c3be', terracotta: '#b76449', white: '#fff8e9',
  };
  const material = (color, opts = {}) => {
    const result = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, ...opts });
    materials.add(result);
    return result;
  };
  const mat = Object.fromEntries(Object.entries(palette).map(([key, color]) => [key, material(color)]));
  mat.chrome = material('#b8c1bb', { metalness: 0.72, roughness: 0.25 });
  mat.leaf = material('#66845a');
  mat.darkLeaf = material('#476d4d');
  mat.wood = material('#9b7150');
  mat.black = material('#242d2c');
  mat.glass = material('#9dbeb8', { roughness: 0.35 });
  const geometry = (key, make) => {
    if (!geometries.has(key)) geometries.set(key, make());
    return geometries.get(key);
  };
  const unitBox = geometry('box', () => new THREE.BoxGeometry(1, 1, 1));
  const cylinderGeometry = (sides = 24) => geometry(`cylinder${sides}`, () => new THREE.CylinderGeometry(1, 1, 1, sides));
  const sphereGeometry = geometry('icosahedron', () => new THREE.IcosahedronGeometry(1, 1));
  function mesh(geo, surface, parent = root, { shadow = false, receive = true } = {}) {
    const object = new THREE.Mesh(geo, surface);
    object.castShadow = shadow;
    object.receiveShadow = receive;
    parent.add(object);
    return object;
  }
  function box(parent, width, height, depth, x, y, z, surface, shadow = false) {
    const object = mesh(unitBox, surface, parent, { shadow });
    object.scale.set(width, height, depth);
    object.position.set(x, y, z);
    return object;
  }
  function cylinder(parent, radius, height, x, y, z, surface, shadow = false, sides = 24) {
    const object = mesh(cylinderGeometry(sides), surface, parent, { shadow });
    object.scale.set(radius, height, radius);
    object.position.set(x, y, z);
    return object;
  }
  function sphere(parent, radius, x, y, z, surface, shadow = false) {
    const object = mesh(sphereGeometry, surface, parent, { shadow });
    object.scale.setScalar(radius);
    object.position.set(x, y, z);
    return object;
  }
  function beam(parent, a, b, thickness, surface) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const object = mesh(cylinderGeometry(12), surface, parent);
    object.position.copy(start).add(end).multiplyScalar(0.5);
    object.scale.set(thickness, start.distanceTo(end), thickness);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    return object;
  }
  function canvasTexture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    textures.add(texture);
    return texture;
  }
  function textPlate(parent, title, subtitle, width, height, x, y, z, background = palette.cream, ink = palette.ink) {
    const texture = canvasTexture(1024, Math.round(1024 * height / width), (ctx, w, h) => {
      ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `500 ${Math.round(h * (subtitle ? .42 : .53))}px "PingFang SC", Arial, sans-serif`;
      ctx.fillText(title, w / 2, h * (subtitle ? .37 : .5), w * .9);
      if (subtitle) {
        ctx.font = `500 ${Math.round(h * .14)}px Arial, sans-serif`;
        ctx.fillText(subtitle, w / 2, h * .78, w * .84);
      }
    });
    const surface = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    materials.add(surface);
    const plate = mesh(geometry(`plane${width}:${height}`, () => new THREE.PlaneGeometry(width, height)), surface, parent, { receive: false });
    plate.position.set(x, y, z);
    return plate;
  }
  function imagePlate(parent, file, width, height, x, y, z, surface = mat.cream) {
    box(parent, width + .2, height + .2, .16, x, y, z - .09, surface, true);
    let plane;
    const fitImage = texture => {
      if (!plane || !texture.image?.width || !texture.image?.height) return;
      const imageAspect = texture.image.width / texture.image.height;
      const frameAspect = width / height;
      // Fit the full public image inside its architectural frame; never stretch a portrait.
      plane.scale.set(imageAspect < frameAspect ? imageAspect / frameAspect : 1,
        imageAspect > frameAspect ? frameAspect / imageAspect : 1, 1);
    };
    const texture = loader.load(new URL(file, new URL(assetBase, document.baseURI)).href, fitImage);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    textures.add(texture);
    const imageMat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    materials.add(imageMat);
    plane = mesh(geometry(`image${width}:${height}`, () => new THREE.PlaneGeometry(width, height)), imageMat, parent, { receive: false });
    plane.position.set(x, y, z + .012);
    fitImage(texture);
    return plane;
  }
  function roundedShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2, z = -depth / 2;
    shape.moveTo(x + radius, z);
    shape.lineTo(x + width - radius, z);
    shape.quadraticCurveTo(x + width, z, x + width, z + radius);
    shape.lineTo(x + width, z + depth - radius);
    shape.quadraticCurveTo(x + width, z + depth, x + width - radius, z + depth);
    shape.lineTo(x + radius, z + depth);
    shape.quadraticCurveTo(x, z + depth, x, z + depth - radius);
    shape.lineTo(x, z + radius);
    shape.quadraticCurveTo(x, z, x + radius, z);
    return shape;
  }

  // A tangible thick clay slab, with a contrasting cut edge and soft surrounding floor.
  const islandGeo = geometry('island', () => {
    const geo = new THREE.ExtrudeGeometry(roundedShape(58, 58, 5), {
      depth: 1.35, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .18, bevelThickness: .15,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -1.5, 0);
    return geo;
  });
  mesh(islandGeo, [mat.sand, mat.edge], root, { shadow: true });
  const floor = mesh(geometry('floor', () => new THREE.PlaneGeometry(240, 240)), material('#efe8d7'), root);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.8;

  const roadMat = material(palette.road);
  function path(points, width = 3.6) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, .028, z)));
    const samples = curve.getPoints(36);
    const vertices = [], indices = [];
    for (let i = 0; i < samples.length; i++) {
      const tangent = curve.getTangent(i / (samples.length - 1));
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);
      for (const direction of [-1, 1]) {
        const point = samples[i].clone().addScaledVector(normal, direction);
        vertices.push(point.x, point.y, point.z);
      }
      if (i < samples.length - 1) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices); geo.computeVertexNormals();
    geometries.set(`path${geometries.size}`, geo);
    const surface = mesh(geo, roadMat);
    surface.material.side = THREE.DoubleSide;
    return surface;
  }
  cylinder(root, 8.5, .055, 0, .01, 0, mat.road, false, 64);
  const ringGeo = geometry('plaza-ring', () => new THREE.RingGeometry(8.7, 10.4, 80));
  const ring = mesh(ringGeo, roadMat); ring.rotation.x = -Math.PI / 2; ring.position.y = .025;
  path([[-25, 0], [-16, -1], [-11, -5], [-10.5, -7]], 3.5);
  path([[10, -4], [12, -5], [11.5, -7]], 3.5);
  path([[6, 9], [9, 12], [12, 9]], 3.5);
  path([[-7, 8], [-10, 10], [-12, 9]], 3.5);
  path([[0, -9], [0, -13], [0, -17.5]], 3.7);
  path([[0, 8], [0, 18], [2, 23], [0, 29]], 4.1);
  // A small printed maker's stamp on the plaza, not a floating UI billboard.
  const mark = textPlate(root, 'S', 'SERKON / 侯世康', 7.2, 5.1, 0, .045, 0, palette.road, '#b2a17f');
  mark.rotation.x = -Math.PI / 2;

  function building(id, x, z, radius) {
    const group = new THREE.Group(); group.name = `${id} destination`;
    group.position.set(x, 0, z);
    group.rotation.y = Math.atan2(-x, -z);
    root.add(group);
    colliders.push({ x, z, r: radius });
    cylinder(group, radius + 1.4, .12, 0, .03, 0, mat.road, false, 48);
    interactables.push({ id, object: group });
    group.userData.stationId = id;
    return group;
  }
  function tag(group, number, color) {
    cylinder(group, .38, .12, -3.2, .15, 3.1, color);
    const marker = textPlate(group, number, '', .7, .7, -3.2, .221, 3.1, palette.cream, palette.ink);
    marker.rotation.x = -Math.PI / 2;
  }

  // 01. Product gallery — architectural open front, printed real project, physical colour samples.
  const works = building('works', -15, -10, 4.05);
  box(works, 8.1, .32, 5.4, 0, .25, -.2, mat.cream, true);
  box(works, 8, 4.1, .44, 0, 2.37, -2.45, mat.orange, true);
  box(works, .43, 4.4, 4.7, -3.8, 2.5, -.2, mat.orange, true);
  box(works, .43, 4.4, 4.7, 3.8, 2.5, -.2, mat.orange, true);
  box(works, 8.55, .35, 5.85, 0, 4.84, -.25, mat.cream, true);
  box(works, 7.6, .18, 4.9, 0, 5.08, -.25, mat.orange);
  imagePlate(works, 'color.webp', 5.7, 3.1, 0, 2.55, -2.19);
  textPlate(works, '作品展馆', 'PRODUCTS / TOOLS / WEBSITES', 5.5, .88, 0, 5.7, -1.1, palette.cream);
  for (let i = 0; i < 6; i++) {
    const colors = ['#e9bd53', '#e5d6bd', '#498a9e', '#d96c54', '#739466', '#3c4b42'];
    const x = (i - 2.5) * 1.02;
    const surface = material(colors[i]);
    cylinder(works, .26, 1.45, x, 1.18, 1.45, surface, true);
    cylinder(works, .28, .12, x, 1.92, 1.45, mat.cream);
    const nozzle = mesh(geometry('nozzle', () => new THREE.ConeGeometry(.15, .58, 16)), mat.cream, works);
    nozzle.position.set(x, 2.25, 1.45);
  }
  textPlate(works, '126 色，做成一件看得懂的产品。', '', 6.1, .45, 0, .6, 2.57, palette.cream);
  tag(works, '01', mat.orange);

  // 02. An outdoor film room, with actual workspace stills and an oversized clapper.
  const film = building('film', 15, -10, 3.85);
  box(film, 8, .24, 5.5, 0, .18, 0, mat.blue, true);
  box(film, 7.8, 4.25, .4, 0, 2.47, -1.8, mat.ink, true);
  imagePlate(film, 'london.webp', 7.1, 3.6, 0, 2.5, -1.56, mat.black);
  const topClapper = new THREE.Group(); film.add(topClapper);
  topClapper.position.set(0, 5, -1.7); topClapper.rotation.z = -.085;
  box(topClapper, 8.1, .76, .65, 0, 0, 0, mat.cream, true);
  for (let i = 0; i < 8; i++) {
    const stripe = box(topClapper, .6, .8, .69, (i - 3.5) * 1.0, 0, 0, mat.ink);
    stripe.rotation.z = -.35;
  }
  textPlate(film, '影像棚', 'AI IMAGE WORKSPACE', 4.3, .9, 0, 6.15, -1.7, palette.blue, palette.cream);
  const lensBody = cylinder(film, .68, 1.0, -2.45, 1.3, 2.0, mat.ink, true);
  lensBody.rotation.x = Math.PI / 2;
  const lensGlass = cylinder(film, .5, .08, -2.45, 1.3, 2.56, mat.glass);
  lensGlass.rotation.x = Math.PI / 2;
  beam(film, [-2.45, 1.0, 1.9], [-3.1, .16, 2.6], .055, mat.chrome);
  beam(film, [-2.45, 1.0, 1.9], [-1.8, .16, 2.6], .055, mat.chrome);
  beam(film, [-2.45, 1.0, 1.9], [-2.45, .16, 1.1], .055, mat.chrome);
  const reel = cylinder(film, .65, .14, 2.6, 1.1, 2.1, mat.cream, true);
  reel.rotation.x = Math.PI / 2;
  tag(film, '02', mat.blue);

  // 03. Record pavilion. The record's rotation is connected to actual audio state.
  const music = building('music', 16, 12, 3.8);
  cylinder(music, 4.4, .23, 0, .16, 0, mat.green, true, 48);
  for (const x of [-3.1, 3.1]) for (const z of [-2.3, 2.3]) {
    cylinder(music, .12, 4.9, x, 2.65, z, mat.cream, true, 12);
  }
  const roof = mesh(geometry('music-roof', () => new THREE.ConeGeometry(5.05, 1.7, 6)), mat.green, music, { shadow: true });
  roof.position.y = 5.9; roof.rotation.y = Math.PI / 6;
  cylinder(music, .09, .5, 0, 7.0, 0, mat.gold);
  sphere(music, .16, 0, 7.27, 0, mat.gold);
  box(music, 5.5, .7, 2.9, 0, 1.15, .2, mat.wood, true);
  const platter = new THREE.Group(); platter.position.set(0, 1.57, .1); music.add(platter);
  cylinder(platter, 1.3, .12, 0, 0, 0, mat.black, true, 64);
  const grooveMat = material('#49524c');
  for (const radius of [.72, .87, 1.02, 1.17]) {
    const groove = mesh(geometry(`groove${radius}`, () => new THREE.TorusGeometry(radius, .008, 4, 64)), grooveMat, platter);
    groove.rotation.x = Math.PI / 2; groove.position.y = .07;
  }
  cylinder(platter, .43, .013, 0, .073, 0, mat.orange, false, 32);
  cylinder(platter, .045, .06, 0, .11, 0, mat.chrome, false, 12);
  beam(music, [2.02, 1.65, -.66], [1.0, 1.75, .3], .045, mat.chrome);
  beam(music, [1.0, 1.75, .3], [.7, 1.67, .58], .06, mat.cream);
  for (const x of [-3.05, 3.05]) {
    box(music, 1.1, 1.65, 1.0, x, 1.05, 1.65, mat.ink, true);
    const woofer = cylinder(music, .35, .045, x, .88, 2.18, mat.black);
    woofer.rotation.x = Math.PI / 2;
    const tweeter = cylinder(music, .16, .045, x, 1.47, 2.18, mat.gold);
    tweeter.rotation.x = Math.PI / 2;
  }
  imagePlate(music, 'genesis.webp', 2.6, 1.65, 0, 3.65, -2.25, mat.cream);
  textPlate(music, '唱片亭', 'GENESIS / 创世纪', 4.0, .9, 0, 5.05, 2.5, palette.cream);
  moving.record = platter;
  tag(music, '03', mat.green);

  // 04. A physical photo wall and a bench. The frame is the owner's original collage.
  const life = building('life', -16, 12, 3.8);
  box(life, 8.5, .2, 5.0, 0, .15, 0, mat.paleBlue, true);
  for (const x of [-3.65, 3.65]) box(life, .15, 5.3, .15, x, 2.8, -.9, mat.wood, true);
  box(life, 8.0, 5.1, .25, 0, 2.9, -.9, mat.cream, true);
  imagePlate(life, 'polaroids.webp', 7.4, 4.15, 0, 3.0, -.74, mat.white);
  textPlate(life, '生活照片墙', 'OUTSIDE THE PROJECT FILES', 5.9, .85, 0, 6.0, -.86, palette.cream);
  box(life, 4.1, .18, .9, 0, .75, 2.1, mat.wood, true);
  for (const x of [-1.5, 1.5]) {
    box(life, .15, .65, .7, x, .37, 2.1, mat.green);
    box(life, .15, .7, .15, x, 1.1, 1.75, mat.green);
  }
  box(life, 4.1, .55, .12, 0, 1.19, 1.75, mat.wood);
  tag(life, '04', mat.blue);

  // 05. The person and the letterbox; no generic "about me" office tower.
  const about = building('about', 0, -22, 3.25);
  box(about, 6.8, .18, 4.9, 0, .15, 0, mat.cream, true);
  box(about, 3.4, 4.6, .3, -.9, 2.55, -.8, mat.green, true);
  imagePlate(about, 'portrait.jpg', 2.9, 3.8, -.9, 2.65, -.61, mat.cream);
  box(about, .15, 4.5, .15, 2.4, 2.55, -.6, mat.wood, true);
  textPlate(about, '侯世康', 'SERKON', 3.2, 1.4, 1.2, 5.4, -.6, palette.orange, palette.cream);
  box(about, 1.6, 1.15, 1.2, 2.15, 1.8, 1.7, mat.orange, true);
  cylinder(about, .1, 1.2, 2.15, .73, 1.7, mat.green);
  box(about, 1.18, .1, .02, 2.15, 2.02, 2.315, mat.ink);
  textPlate(about, '写封信给我', '', 1.4, .35, 2.15, 1.58, 2.32, palette.orange, palette.cream);
  const flag = box(about, .86, .5, .055, 3.18, 2.65, 1.7, mat.gold, true);
  cylinder(about, .035, 1.5, 2.78, 2.3, 1.7, mat.chrome, false, 8);
  moving.mailFlag = flag;
  tag(about, '05', mat.orange);

  // Give the pointer controller a station id without depending on a specific picking strategy.
  for (const { id, object } of interactables) object.traverse(child => { child.userData.stationId = id; });

  // Instanced trees keep a lush outer frame without hundreds of individual draw calls.
  const treePositions = [
    [-25, -20, 1.0], [-23, -16, .78], [-23, -6, .8], [-26, 9, .9], [-24, 21, 1.1],
    [-11, 24, .8], [-7, 25, .9], [9, 25, .84], [24, 22, 1.1], [25, 5, .9],
    [24, -4, .8], [25, -19, 1.0], [17, -24, .86], [-13, -25, .95], [-8, -22, .64],
    [9, -19, .65], [-24, 2, .64], [23, 16, .7],
  ];
  const dummy = new THREE.Object3D();
  const trunks = new THREE.InstancedMesh(cylinderGeometry(10), mat.wood, treePositions.length);
  const leaves = new THREE.InstancedMesh(sphereGeometry, mat.leaf, treePositions.length * 2);
  trunks.castShadow = true; trunks.receiveShadow = true; leaves.castShadow = true; leaves.receiveShadow = true;
  treePositions.forEach(([x, z, scale], index) => {
    dummy.position.set(x, 1.05 * scale, z); dummy.rotation.set(0, 0, .04 * Math.sin(index));
    dummy.scale.set(.18 * scale, 2.1 * scale, .18 * scale); dummy.updateMatrix(); trunks.setMatrixAt(index, dummy.matrix);
    for (let tier = 0; tier < 2; tier++) {
      dummy.position.set(x + (tier ? .3 : -.18) * scale, (2.7 + tier * .95) * scale, z + (tier ? .2 : 0));
      dummy.rotation.set(index * .4, index * 1.7, tier * .5);
      dummy.scale.set((1.3 - tier * .15) * scale, (1.6 - tier * .2) * scale, (1.25 - tier * .1) * scale);
      dummy.updateMatrix(); leaves.setMatrixAt(index * 2 + tier, dummy.matrix);
      leaves.setColorAt(index * 2 + tier, new THREE.Color(index % 3 ? '#648357' : '#80955e'));
    }
    colliders.push({ x, z, r: .5 * scale });
  });
  root.add(trunks, leaves);
  geometries.set('tree-leaf-reference', sphereGeometry);

  // Dotted clay pebbles and clustered grass remain away from the central driveway.
  const pebbleGeo = geometry('pebble', () => new THREE.IcosahedronGeometry(1, 0));
  const pebbles = new THREE.InstancedMesh(pebbleGeo, material('#bdac88'), 60);
  const grass = new THREE.InstancedMesh(geometry('grass', () => new THREE.ConeGeometry(.13, .55, 4)), mat.darkLeaf, 54);
  for (let i = 0; i < 60; i++) {
    const angle = i * 2.399963;
    const radius = 24.0 + Math.sin(i * 1.73) * 2.2;
    const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius;
    dummy.position.set(x, .1, z); dummy.rotation.set(i * .7, i, 0);
    dummy.scale.set(.14 + (i % 3) * .08, .08, .13 + (i % 2) * .13); dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
    if (i < 54) {
      dummy.position.set(x + .35, .23, z - .4); dummy.rotation.set(.05, angle, Math.sin(i) * .15);
      dummy.scale.setScalar(.7 + (i % 4) * .16); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
    }
  }
  root.add(pebbles, grass);

  // A few purposeful street furnishings, rather than another set of floating cards.
  function lamp(x, z) {
    cylinder(root, .10, 3.8, x, 1.9, z, mat.green, true, 12);
    cylinder(root, .28, .17, x, .12, z, mat.ink);
    cylinder(root, .34, .13, x, 3.89, z, mat.ink);
    sphere(root, .28, x, 3.58, z, mat.cream);
    colliders.push({ x, z, r: .3 });
  }
  lamp(-7, -10); lamp(8, -10); lamp(-9, 15); lamp(9, 16); lamp(-4.1, -16); lamp(4.1, -16);
  const fencePosts = new THREE.InstancedMesh(unitBox, mat.cream, 36);
  for (let i = 0; i < 36; i++) {
    const side = i < 18 ? -1 : 1, j = i % 18;
    dummy.position.set(side * 27.6, .65, -23 + j * 2.7); dummy.rotation.set(0, 0, 0);
    dummy.scale.set(.16, 1.3, .16); dummy.updateMatrix(); fencePosts.setMatrixAt(i, dummy.matrix);
  }
  root.add(fencePosts);
  for (const side of [-1, 1]) for (const y of [.42, 1.02]) box(root, .09, .10, 45.9, side * 27.6, y, -.05, mat.cream);

  // One pinwheel in the meadow adds a small bit of life, with no autonomous camera motion.
  const pinwheel = new THREE.Group(); pinwheel.position.set(-6, 2.8, 18); root.add(pinwheel);
  cylinder(root, .045, 2.8, -6, 1.4, 18, mat.wood, false, 8);
  const pinwheelRotor = new THREE.Group(); pinwheel.add(pinwheelRotor);
  for (let i = 0; i < 4; i++) {
    const blade = box(pinwheelRotor, .45, .95, .07, 0, .52, 0, i % 2 ? mat.orange : mat.cream);
    const pivot = new THREE.Group(); pinwheelRotor.remove(blade); pivot.add(blade); pivot.rotation.z = i * Math.PI / 2;
    pinwheelRotor.add(pivot);
  }
  sphere(pinwheel, .12, 0, 0, .11, mat.gold);
  moving.pinwheel = pinwheelRotor;

  return {
    root,
    colliders,
    interactables,
    update(dt, time, state = {}) {
      const musicPlaying = Boolean(state.musicPlaying || state.audioPlaying);
      if (musicPlaying) moving.record.rotation.y -= dt * 2.1;
      if (!state.reducedMotion) moving.pinwheel.rotation.z -= dt * .65;
      moving.mailFlag.rotation.z = state.activeId === 'about' ? -.15 : 0;
    },
    dispose() {
      root.removeFromParent();
      for (const geo of new Set(geometries.values())) geo.dispose();
      for (const surface of materials) surface.dispose();
      for (const texture of textures) texture.dispose();
    },
  };
}
