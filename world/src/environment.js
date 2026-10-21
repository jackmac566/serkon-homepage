import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
  mat.glass = new THREE.MeshPhysicalMaterial({ color: '#305e62', roughness: .12, metalness: .42, clearcoat: 1, clearcoatRoughness: .08 });
  materials.add(mat.glass);
  mat.light = material('#fff3d4', { emissive: '#ffc27b', emissiveIntensity: .65, roughness: .3 });
  mat.brass = material('#b6995d', { metalness: .72, roughness: .33 });
  mat.fabric = material('#6f8276', { roughness: .95 });
  const geometry = (key, make) => {
    if (!geometries.has(key)) geometries.set(key, make());
    return geometries.get(key);
  };
  const unitBox = geometry('box', () => new THREE.BoxGeometry(1, 1, 1));
  const cylinderGeometry = (sides = 24) => geometry(`cylinder${sides}`, () => new THREE.CylinderGeometry(1, 1, 1, sides));
  const sphereGeometry = geometry('icosahedron', () => new THREE.IcosahedronGeometry(1, 2));
  function mesh(geo, surface, parent = root, { shadow = false, receive = true } = {}) {
    const object = new THREE.Mesh(geo, surface);
    object.castShadow = shadow;
    object.receiveShadow = receive;
    parent.add(object);
    return object;
  }
  function box(parent, width, height, depth, x, y, z, surface, shadow = false) {
    const radius = Math.min(.085, Math.min(width, height, depth) * .2);
    const rounded = radius > .022;
    const geo = rounded ? geometry(`rounded:${width}:${height}:${depth}`, () => new RoundedBoxGeometry(width, height, depth, 2, radius)) : unitBox;
    const object = mesh(geo, surface, parent, { shadow });
    if (!rounded) object.scale.set(width, height, depth);
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
  // Small, deterministic surface maps. They are original generated material data,
  // not photographs, downloaded models, or a screen-sized visual overlay.
  let seed = 578421;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  function surfaceTexture(kind, grey = false) {
    const tex = canvasTexture(512, 512, (ctx, width, height) => {
      ctx.fillStyle = grey ? '#c8c8c8' : kind === 'wood' ? '#a47b53' : kind === 'stone' ? '#c8c2af' : '#cbc4af';
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 6500; i++) {
        const light = random() > .5;
        ctx.fillStyle = light ? `rgba(255,255,255,${random() * .10})` : `rgba(35,34,27,${random() * .08})`;
        ctx.fillRect(Math.floor(random() * width), Math.floor(random() * height), 1 + random() * 2, 1 + random() * 2);
      }
      if (kind === 'wood') {
        for (let i = 0; i < 120; i++) {
          const y = i * 4.4 + random() * 3;
          ctx.beginPath(); ctx.moveTo(-10, y); ctx.bezierCurveTo(130, y + Math.sin(i) * 8, 320, y - Math.cos(i) * 11, 522, y + Math.sin(i * .8) * 5);
          ctx.strokeStyle = grey ? 'rgba(70,70,70,.18)' : `rgba(66,41,25,${.07 + random() * .10})`;
          ctx.lineWidth = .5 + random() * 1.6; ctx.stroke();
        }
        for (let y = 0; y < height; y += 128) { ctx.fillStyle = grey ? '#939393' : '#685337'; ctx.fillRect(0, y, width, 1.4); }
      } else if (kind === 'stone') {
        for (let row = 0; row < 8; row++) for (let col = -1; col < 9; col++) {
          const x = col * 64 + (row % 2 ? 32 : 0), y = row * 64;
          const value = 183 + Math.floor(random() * 22);
          ctx.fillStyle = grey ? `rgb(${value},${value},${value})` : `rgb(${value+13},${value+8},${value-8})`;
          ctx.fillRect(x + 2, y + 2, 60, 60);
          ctx.strokeStyle = grey ? '#777' : 'rgba(117,111,94,.55)'; ctx.lineWidth = 1;
          ctx.strokeRect(x + 1.5, y + 1.5, 61, 61);
          ctx.fillStyle = 'rgba(255,255,255,.11)'; ctx.fillRect(x + 3, y + 3, 57, 1);
        }
      }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    if (grey) tex.colorSpace = THREE.NoColorSpace;
    return tex;
  }
  const woodColour = surfaceTexture('wood'), woodBump = surfaceTexture('wood', true);
  mat.wood.color.set('#ffffff'); mat.wood.map = woodColour; mat.wood.bumpMap = woodBump; mat.wood.bumpScale = .028; mat.wood.roughnessMap = woodBump; mat.wood.roughness = .68;
  const stoneColour = surfaceTexture('stone'), stoneBump = surfaceTexture('stone', true);
  const earth = surfaceTexture('earth'); earth.repeat.set(.12, .12);
  const grainBump = surfaceTexture('earth', true); grainBump.repeat.set(.12,.12);
  mat.sand.map = earth; mat.sand.color.set('#e1dcc7'); mat.sand.bumpMap = grainBump; mat.sand.roughnessMap = grainBump; mat.sand.bumpScale = .045;
  for (const surface of [mat.cream, mat.orange, mat.blue, mat.green]) { surface.bumpMap = grainBump; surface.roughnessMap = grainBump; surface.bumpScale = .018; }
  mat.fabric.bumpMap = grainBump; mat.fabric.bumpScale = .022;
  const aoTexture = canvasTexture(128, 128, (ctx, width, height) => {
    const gradient = ctx.createRadialGradient(width/2, height/2, 2, width/2, height/2, width/2);
    gradient.addColorStop(0, 'rgba(31,37,27,.38)'); gradient.addColorStop(.35, 'rgba(31,37,27,.22)'); gradient.addColorStop(1, 'rgba(31,37,27,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0,0,width,height);
  });
  const aoMaterial = new THREE.MeshBasicMaterial({ map: aoTexture, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1 });
  materials.add(aoMaterial);
  function contactShadow(parent, width, depth, x = 0, z = 0, y = .10) {
    const plane = mesh(geometry('ao-plane', () => new THREE.PlaneGeometry(1, 1)), aoMaterial, parent, { receive: false });
    plane.rotation.x = -Math.PI/2; plane.position.set(x,y,z); plane.scale.set(width,depth,1); return plane;
  }
  function cable(parent, points, radius = .032, surface = mat.black) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(geometry(`cable${geometries.size}`, () => new THREE.TubeGeometry(curve, 28, radius, 6, false)), surface, parent);
  }
  function hardwareRing(parent, radius, thickness, x, y, z, surface, axis = 'x') {
    const object = mesh(geometry(`ring:${radius}:${thickness}`, () => new THREE.TorusGeometry(radius, thickness, 6, 40)), surface, parent);
    object.position.set(x,y,z); if (axis === 'x') object.rotation.x = Math.PI/2; if (axis === 'y') object.rotation.y = Math.PI/2; return object;
  }
  function instances(parent, geo, surface, transforms, name) {
    const object = new THREE.InstancedMesh(geo, surface, transforms.length);
    object.name = name; object.receiveShadow = true;
    const transform = new THREE.Object3D();
    transforms.forEach((item, index) => { transform.position.set(...item.p); transform.rotation.set(...(item.r || [0,0,0])); transform.scale.set(...(item.s || [1,1,1])); transform.updateMatrix(); object.setMatrixAt(index, transform.matrix); if (item.color) object.setColorAt(index, new THREE.Color(item.color)); });
    parent.add(object); return object;
  }
  function plant(parent, x, z, size = 1, y = .2) {
    const pot = mesh(geometry('plant-pot', () => new THREE.CylinderGeometry(.44,.32,.68,20)), mat.terracotta, parent, { shadow: true });
    pot.position.set(x,y+.34*size,z); pot.scale.setScalar(size);
    cylinder(parent,.39*size,.06*size,x,y+.67*size,z,mat.ink);
    const leaves = [];
    for (let i=0;i<9;i++) { const angle=i*2.399963; leaves.push({p:[x+Math.sin(angle)*.22*size,y+(1.0+(i%3)*.15)*size,z+Math.cos(angle)*.22*size],s:[.15*size,.48*size,.08*size],r:[Math.sin(angle)*.55,angle,Math.cos(angle)*.55],color:i%2?'#668568':'#456b52'}); }
    instances(parent, sphereGeometry, mat.leaf, leaves, 'plant leaves');
    contactShadow(parent,1.25*size,1.25*size,x,z,y+.012);
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

  const roadMat = material('#f5efd9', { map: stoneColour, bumpMap: stoneBump, bumpScale: .035, roughness: .94 });
  const plazaMap = stoneColour.clone(); plazaMap.repeat.set(2.4,2.4); textures.add(plazaMap);
  const plazaBump = stoneBump.clone(); plazaBump.repeat.set(2.4,2.4); textures.add(plazaBump);
  const plazaMat = material('#eee7d2', { map: plazaMap, bumpMap: plazaBump, bumpScale: .028, roughness: .92 });
  const curbTransforms = [];
  function path(points, width = 3.6) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, .028, z)));
    const samples = curve.getPoints(36);
    const vertices = [], indices = [], uvs = [];
    for (let i = 0; i < samples.length; i++) {
      const tangent = curve.getTangent(i / (samples.length - 1));
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);
      for (const direction of [-1, 1]) {
        const point = samples[i].clone().addScaledVector(normal, direction);
        vertices.push(point.x, point.y, point.z); uvs.push(point.x / 6, point.z / 6);
      }
      if (i < samples.length - 1) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    for (let t=0;t<=1;t+=1/Math.max(2,Math.ceil(curve.getLength()/.68))) { const center=curve.getPoint(t), tangent=curve.getTangent(t), normal=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();for(const side of [-1,1]) { const edge=center.clone().addScaledVector(normal,side*(width/2+.06));curbTransforms.push({p:[edge.x,.042,edge.z],s:[.15,.13,.61],r:[0,Math.atan2(tangent.x,tangent.z),0]}); } }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices); geo.computeVertexNormals();
    geometries.set(`path${geometries.size}`, geo);
    const surface = mesh(geo, roadMat);
    surface.material.side = THREE.DoubleSide;
    return surface;
  }
  cylinder(root, 8.5, .055, 0, .01, 0, plazaMat, false, 64);
  const ringGeo = geometry('plaza-ring', () => new THREE.RingGeometry(8.7, 10.4, 80));
  const ring = mesh(ringGeo, roadMat); ring.rotation.x = -Math.PI / 2; ring.position.y = .025;
  path([[-25, 0], [-16, -1], [-11, -5], [-10.5, -7]], 3.5);
  path([[10, -4], [12, -5], [11.5, -7]], 3.5);
  path([[6, 9], [9, 12], [12, 9]], 3.5);
  path([[-7, 8], [-10, 10], [-12, 9]], 3.5);
  path([[0, -9], [0, -13], [0, -17.5]], 3.7);
  path([[0, 8], [0, 18], [2, 23], [0, 29]], 4.1);
  for (let i=0;i<64;i++){const angle=i*Math.PI/32;curbTransforms.push({p:[Math.sin(angle)*10.53,.04,Math.cos(angle)*10.53],s:[.15,.13,.92],r:[0,angle+Math.PI/2,0]});}
  instances(root,geometry('kerb',()=>new RoundedBoxGeometry(1,1,1,1,.10)),mat.cream,curbTransforms,'laid stone kerbs');
  // A small printed maker's stamp on the plaza, not a floating UI billboard.
  const mark = textPlate(root, 'S', 'SERKON / 侯世康', 7.2, 5.1, 0, .045, 0, palette.road, '#b2a17f');
  mark.rotation.x = -Math.PI / 2;

  function building(id, x, z, radius) {
    const group = new THREE.Group(); group.name = `${id} destination`;
    group.position.set(x, 0, z);
    group.rotation.y = Math.atan2(-x, -z);
    root.add(group);
    colliders.push({ x, z, r: radius });
    cylinder(group, radius + 1.4, .12, 0, .03, 0, plazaMat, false, 48);
    contactShadow(group,(radius+1)*2,(radius+1)*1.8,0,-.25,.096);
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
  const platter = new THREE.Group(); platter.position.set(0, 1.72, .1); music.add(platter);
  cylinder(platter, 1.3, .12, 0, 0, 0, mat.black, true, 64);
  const grooveMat = material('#49524c');
  for (const radius of [.72, .87, 1.02, 1.17]) {
    const groove = mesh(geometry(`groove${radius}`, () => new THREE.TorusGeometry(radius, .008, 4, 64)), grooveMat, platter);
    groove.rotation.x = Math.PI / 2; groove.position.y = .07;
  }
  cylinder(platter, .43, .013, 0, .073, 0, mat.orange, false, 32);
  cylinder(platter, .045, .06, 0, .11, 0, mat.chrome, false, 12);
  beam(music, [2.02, 1.82, -.66], [1.0, 1.92, .3], .045, mat.chrome);
  beam(music, [1.0, 1.92, .3], [.7, 1.84, .58], .06, mat.cream);
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
  for(let i=0;i<5;i++)box(life,4.1,.16,.16,0,.75,1.74+i*.18,mat.wood,true);
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

  // Construction details live in each destination's local space. They do not
  // change its collision envelope or the five established parking positions.
  const metalBolt = geometry('detail-bolt', () => new THREE.CylinderGeometry(.028,.028,.018,8));
  const grilleTexture = canvasTexture(256,256,(ctx,w,h)=>{
    ctx.fillStyle='#29312f';ctx.fillRect(0,0,w,h);
    for(let row=0;row<24;row++)for(let col=0;col<24;col++){ctx.fillStyle=(row+col)%2?'#505852':'#3f4742';ctx.beginPath();ctx.arc(col*11+(row%2?5.5:0),row*11,2.9,0,Math.PI*2);ctx.fill();}
  });
  grilleTexture.wrapS=grilleTexture.wrapT=THREE.RepeatWrapping;
  const grilleMaterial=material('#b7bcae',{map:grilleTexture,bumpMap:grilleTexture,bumpScale:.015,metalness:.32,roughness:.7});
  function frontBolts(parent,width,height,z,y=0){
    const bolts=[];for(const x of [-width/2,width/2])for(const yy of [-height/2,height/2])bolts.push({p:[x,y+yy,z],r:[Math.PI/2,0,0]});
    instances(parent,metalBolt,mat.chrome,bolts,'fasteners');
  }

  // The shop has actual joinery: mullions, roof battens, a lit soffit and steps.
  box(works,8.35,.18,1.0,0,.15,2.88,mat.cream,true);
  box(works,8.35,.09,.13,0,.28,3.28,mat.brass);
  const roofBattens=[];
  for(let i=0;i<27;i++)roofBattens.push({p:[-3.66+i*.282,5.22,-.25],s:[.13,.07,4.95]});
  instances(works,unitBox,mat.orange,roofBattens,'individual roof battens');
  for(const side of [-1,1]){
    const x=side*4.025;
    box(works,.10,2.40,2.46,x,2.65,.02,mat.cream);
    box(works,.035,2.16,2.20,x+side*.062,2.65,.02,mat.glass);
    box(works,.06,2.2,.065,x+side*.085,2.65,.02,mat.cream);
    box(works,.06,.065,2.22,x+side*.085,2.65,.02,mat.cream);
  }
  box(works,6.4,.08,.18,0,4.60,1.75,mat.ink);
  box(works,6.12,.035,.14,0,4.54,1.75,mat.light);
  const slats=[];
  for(let i=0;i<12;i++)for(const side of [-1,1])slats.push({p:[side*3.56,2.42,-2.0+i*.33],s:[.07,3.75,.05]});
  instances(works,unitBox,mat.terracotta,slats,'side-wall relief');
  const tubeLabel=canvasTexture(256,384,(ctx,w,h)=>{
    ctx.fillStyle='#eee7d4';ctx.fillRect(0,0,w,h);ctx.fillStyle='#34463b';ctx.fillRect(0,0,w,18);ctx.fillRect(0,h-24,w,24);
    ctx.textAlign='center';ctx.font='bold 39px Arial';ctx.fillText('Q–730',w/2,75);ctx.font='24px "PingFang SC",Arial';ctx.fillText('强鹰彩色胶',w/2,121);ctx.font='16px Arial';ctx.fillText('COLOUR SERIES',w/2,156);ctx.fillText('126 COLOURS',w/2,191);
    for(let i=0;i<28;i++){ctx.fillStyle='#4a5147';ctx.fillRect(30+i*7,260,(i%3)+1,50);}
  });
  const tubeLabelMat=new THREE.MeshBasicMaterial({map:tubeLabel,toneMapped:false});materials.add(tubeLabelMat);
  for(let i=0;i<6;i++){
    const x=(i-2.5)*1.02;
    cylinder(works,.31,.08,x,.50,1.45,mat.brass);
    const label=mesh(geometry('tube-label',()=>new THREE.PlaneGeometry(.43,.67)),tubeLabelMat,works,{receive:false});label.position.set(x,1.25,1.715);
    hardwareRing(works,.266,.012,x,.76,1.45,mat.cream);
  }
  plant(works,-3.15,2.1,.62,.35);
  const shopLamps=[];for(const x of [-2.7,0,2.7])shopLamps.push({p:[x,4.42,-.2],s:[.13,.13,.13]});
  instances(works,sphereGeometry,mat.light,shopLamps,'gallery ceiling lamps');

  // Camera body, concentric lens rings, cable, director chair and a reel with
  // visually open sockets give the film station useful near-view detail.
  box(film,1.44,.95,.88,-2.45,1.36,1.60,mat.black,true);
  box(film,.82,.56,.10,-2.45,1.40,1.12,mat.glass);
  box(film,.92,.12,.12,-2.45,2.08,1.58,mat.ink);
  for(const x of [-2.83,-2.07])box(film,.09,.32,.12,x,1.94,1.58,mat.ink);
  for(let i=0;i<5;i++){
    const collar=cylinder(film,.61-i*.026,.09,-2.45,1.3,2.30+i*.12,i%2?mat.chrome:mat.black);
    collar.rotation.x=Math.PI/2;
  }
  const opticalGlass=cylinder(film,.48,.025,-2.45,1.3,2.83,mat.glass);opticalGlass.rotation.x=Math.PI/2;
  hardwareRing(film,.49,.024,-2.45,1.3,2.85,mat.chrome,'z');
  cable(film,[[-2.85,.95,1.20],[-3.25,.10,1.30],[-3.05,.10,.10],[-1.45,.10,-.30]],.032);
  const reelFace=cylinder(film,.61,.035,2.6,1.1,2.20,mat.chrome);reelFace.rotation.x=Math.PI/2;
  const holes=[];
  for(let i=0;i<6;i++){const a=i*Math.PI/3;holes.push({p:[2.6+Math.cos(a)*.38,1.1+Math.sin(a)*.38,2.225],r:[Math.PI/2,0,0],s:[.115,.018,.115]});}
  instances(film,cylinderGeometry(16),mat.black,holes,'reel perforations');
  box(film,1.8,.13,1.10,2.20,.95,.25,mat.fabric,true);
  box(film,1.8,.68,.11,2.20,1.65,-.22,mat.fabric,true);
  for(const side of [-1,1]){
    const x=2.20+side*.75;
    beam(film,[x,.12,-.30],[x,1.20,.75],.055,mat.chrome);
    beam(film,[x,.12,.85],[x,1.20,-.25],.055,mat.chrome);
    beam(film,[x,1.08,-.23],[x,2.06,-.23],.045,mat.wood);
  }
  textPlate(film,'SERKON','',1.23,.25,2.20,1.70,-.15,palette.green,palette.cream);
  box(film,1.55,.65,.80,.10,.65,1.98,mat.ink,true);
  box(film,1.60,.075,.84,.10,1.0,1.98,mat.chrome);
  for(const x of [-.45,.65])box(film,.13,.16,.04,x,.78,2.41,mat.brass);
  const vent=[];for(let i=0;i<11;i++)vent.push({p:[-.55+i*.13,.65,2.395],s:[.04,.27,.015]});
  instances(film,unitBox,mat.black,vent,'equipment-case ribs');
  box(film,7.8,.075,.075,0,.34,2.65,mat.light);
  frontBolts(film,7.35,3.78,-1.50,2.47);

  // A proper turntable has a plinth, controls and cartridge. The existing
  // platter continues to turn only when the real audio player is playing.
  box(music,3.8,.16,2.68,0,1.57,.1,mat.ink,true);
  box(music,3.58,.04,2.48,0,1.67,.1,mat.chrome);
  for(const x of [-1.55,1.55])for(const z of [-.90,1.12])cylinder(music,.14,.15,x,1.47,z,mat.black);
  cylinder(music,.22,.11,1.60,1.76,.98,mat.black);
  cylinder(music,.10,.08,1.22,1.74,1.08,mat.brass);
  box(music,.27,.04,.11,1.57,1.84,.98,mat.orange);
  cylinder(music,.19,.23,2.02,1.79,-.66,mat.chrome);
  box(music,.31,.12,.16,.70,1.84,.58,mat.orange);
  beam(music,[.70,1.84,.58],[.70,1.79,.58],.013,mat.chrome);
  const recordName=textPlate(platter,'GENESIS','',.55,.16,0,.088,.15,palette.orange,palette.cream);recordName.rotation.x=-Math.PI/2;
  for(const x of [-3.05,3.05]){
    box(music,1.17,1.72,1.04,x,1.05,1.63,mat.wood,true);
    box(music,.98,1.48,.035,x,1.05,2.18,grilleMaterial);
    for(const yy of [.42,1.68]){const screw=cylinder(music,.027,.025,x-.42,yy,2.205,mat.chrome, false,8);screw.rotation.x=Math.PI/2;}
  }
  for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;beam(music,[0,6.65,0],[Math.cos(a)*4.82,5.1,Math.sin(a)*4.82],.045,mat.cream);}
  for(const x of [-3.1,3.1])for(const z of [-2.3,2.3]){cylinder(music,.20,.10,x,.48,z,mat.brass);cylinder(music,.18,.12,x,4.94,z,mat.brass);}
  box(music,4.6,.11,1.85,0,.76,.20,mat.wood);
  for(let i=0;i<7;i++){
    const sleeve=box(music,.075,.64,.64,-.54+i*.18,.94,1.13,i%2?mat.orange:mat.cream);sleeve.rotation.z=.10;
  }
  plant(music,-2.70,-1.22,.65,.28);

  // Individual frame edges, clamps, a hanging light cable and slatted bench
  // make the photo corner feel assembled rather than a single image plane.
  for(const x of [-3.86,3.86])box(life,.13,5.05,.10,x,2.95,-.52,mat.wood,true);
  for(const y of [.48,5.45])box(life,7.75,.13,.10,0,y,-.52,mat.wood,true);
  const photoClamps=[];
  for(let i=0;i<8;i++)photoClamps.push({p:[-3.25+i*.93,5.14,-.42],s:[.09,.22,.07],r:[0,0,(i%2?.08:-.08)]});
  instances(life,unitBox,mat.brass,photoClamps,'photo clamps');
  cable(life,[[-3.9,5.8,-.46],[-2,5.41,-.30],[0,5.20,-.25],[2,5.41,-.30],[3.9,5.8,-.46]],.022);
  const fairyLights=[];
  for(let i=0;i<13;i++){const x=-3.72+i*.62,y=5.20+Math.pow(x/3.9,2)*.60;fairyLights.push({p:[x,y-.12,-.27],s:[.095,.13,.095]});}
  instances(life,sphereGeometry,mat.light,fairyLights,'warm photo-wall bulbs');
  const benchScrews=[];
  for(const x of [-1.55,1.55])for(let i=0;i<5;i++)benchScrews.push({p:[x,.837,1.74+i*.18]});
  instances(life,metalBolt,mat.brass,benchScrews,'bench screws');
  imagePlate(life,'wave.jpg',1.0,1.32,-2.75,1.45,1.55,mat.wood);
  plant(life,3.12,1.48,.80,.24);
  contactShadow(life,5.7,2.2,0,2.1,.255);

  // Letterbox hardware and a real paper envelope retain the personal purpose.
  box(about,1.40,.91,.055,2.15,1.79,2.34,mat.orange,true);
  for(const y of [1.47,2.12]){
    const hinge=cylinder(about,.055,.18,1.44,y,2.38,mat.chrome);hinge.rotation.z=Math.PI/2;
  }
  const keyPlate=cylinder(about,.11,.025,2.56,1.83,2.385,mat.brass);keyPlate.rotation.x=Math.PI/2;
  const keyHole=cylinder(about,.028,.028,2.56,1.83,2.405,mat.black);keyHole.rotation.x=Math.PI/2;
  cable(about,[[1.98,1.98,2.40],[1.98,2.04,2.53],[2.25,2.04,2.53],[2.25,1.98,2.40]],.025,mat.chrome);
  const envelope=new THREE.Group();about.add(envelope);envelope.position.set(2.17,2.33,1.88);envelope.rotation.x=-.18;envelope.rotation.z=.10;
  box(envelope,1.1,.74,.035,0,0,0,mat.cream);
  // A narrow raised fold catches light without relying on a floating label.
  beam(envelope,[-.53,.32,.025],[0,-.02,.026],.010,mat.brass);beam(envelope,[0,-.02,.026],[.53,.32,.025],.010,mat.brass);
  plant(about,-2.53,1.39,.9,.25);
  for(const x of [-2.48,.68])box(about,.055,4.25,.08,x,2.62,-.40,mat.brass);
  box(about,3.2,.055,.08,-.9,4.75,-.40,mat.brass);
  for(const x of [-1.95,.15]){
    const lamp=box(about,.42,.18,.20,x,5.18,-.30,mat.ink);box(about,.31,.04,.16,x,5.06,-.30,mat.light);
  }

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
  const barkMap=woodColour.clone();barkMap.center.set(.5,.5);barkMap.rotation=Math.PI/2;barkMap.repeat.set(2,1);textures.add(barkMap);
  mat.bark=material('#bdad92',{map:barkMap,bumpMap:woodBump,bumpScale:.055,roughness:.98});
  const trunks = new THREE.InstancedMesh(cylinderGeometry(10), mat.bark, treePositions.length);
  const branches = new THREE.InstancedMesh(cylinderGeometry(8),mat.bark,treePositions.length*3);
  const leaves = new THREE.InstancedMesh(sphereGeometry, mat.leaf, treePositions.length * 5);
  const leafDetails=new THREE.InstancedMesh(geometry('individual-leaf',()=>new THREE.SphereGeometry(1,6,4)),mat.darkLeaf,treePositions.length*36);
  const treeShadows=[];
  trunks.castShadow = true; trunks.receiveShadow = true; leaves.castShadow = true; leaves.receiveShadow = true;
  treePositions.forEach(([x, z, scale], index) => {
    dummy.position.set(x, 1.05 * scale, z); dummy.rotation.set(0, 0, .04 * Math.sin(index));
    dummy.scale.set(.18 * scale, 2.1 * scale, .18 * scale); dummy.updateMatrix(); trunks.setMatrixAt(index, dummy.matrix);
    const lobes=[[-.42,2.48,.10,.98,1.16,.9],[.55,2.72,.15,1.0,1.28,.9],[-.22,3.12,-.47,.98,1.23,.9],[.28,3.62,-.10,.93,1.04,.85],[-.34,3.38,.45,.90,1.06,.83]];
    lobes.forEach(([dx,dy,dz,sx,sy,sz],tier)=>{
      dummy.position.set(x+dx*scale,dy*scale,z+dz*scale);dummy.rotation.set(index*.31,tier*1.34+index*.7,tier*.18);
      dummy.scale.set(sx*scale,sy*scale,sz*scale);dummy.updateMatrix();leaves.setMatrixAt(index*5+tier,dummy.matrix);
      leaves.setColorAt(index*5+tier,new THREE.Color(['#6c865b','#789363','#4c7255','#8d9e69','#5f805c'][(index+tier)%5]));
    });
    for(let j=0;j<3;j++){
      const angle=j*Math.PI*2/3+index*.7;
      dummy.position.set(x+Math.sin(angle)*.38*scale,2.2*scale,z+Math.cos(angle)*.38*scale);
      dummy.rotation.set(Math.cos(angle)*.65,angle,Math.sin(angle)*.65);dummy.scale.set(.08*scale,1.3*scale,.08*scale);dummy.updateMatrix();branches.setMatrixAt(index*3+j,dummy.matrix);
    }
    for(let j=0;j<36;j++){
      const a=j*2.399963+index*.3,yy=(j+.5)/36*2-1,radial=Math.sqrt(1-yy*yy);
      dummy.position.set(x+Math.sin(a)*radial*1.38*scale,(3.05+yy*1.75)*scale,z+Math.cos(a)*radial*1.18*scale);
      dummy.rotation.set(a*.7,a,yy);dummy.scale.set(.085*scale,.21*scale,.048*scale);dummy.updateMatrix();leafDetails.setMatrixAt(index*36+j,dummy.matrix);
      leafDetails.setColorAt(index*36+j,new THREE.Color(j%3?'#6f8a60':'#9aa46e'));
    }
    treeShadows.push({p:[x,-.125,z],s:[3.8*scale,3.4*scale,1],r:[-Math.PI/2,0,0]});
    colliders.push({ x, z, r: .5 * scale });
  });
  root.add(trunks, branches, leaves, leafDetails);
  instances(root,geometry('tree-shadow-plane',()=>new THREE.PlaneGeometry(1,1)),aoMaterial,treeShadows,'tree contact shadows');
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
  const grassBlades=[];
  for(let i=0;i<60;i++){const a=i*2.399963,r=24+Math.sin(i*1.73)*2.2,cx=Math.sin(a)*r,cz=Math.cos(a)*r;for(let j=0;j<7;j++){const aa=j*2.399963+i;grassBlades.push({p:[cx+Math.sin(aa)*.18,.08+(j%3)*.035,cz+Math.cos(aa)*.18],s:[.035,.25+(j%4)*.07,.018],r:[Math.cos(aa)*.30,aa,Math.sin(aa)*.28],color:j%2?'#7e8b62':'#57724f'});}}
  instances(root,geometry('grass-blade',()=>new THREE.SphereGeometry(1,4,3)),mat.leaf,grassBlades,'individual meadow blades');

  // A few purposeful street furnishings, rather than another set of floating cards.
  function lamp(x, z) {
    cylinder(root, .10, 3.8, x, 1.9, z, mat.green, true, 12);
    cylinder(root, .28, .17, x, .12, z, mat.ink);
    cylinder(root, .34, .13, x, 3.89, z, mat.ink);
    sphere(root, .28, x, 3.58, z, mat.light);
    const hood=mesh(geometry('lamp-hood',()=>new THREE.ConeGeometry(.43,.23,16)),mat.ink,root);hood.position.set(x,4.04,z);
    for(const dx of [-.22,.22])for(const dz of [-.22,.22])box(root,.035,.62,.035,x+dx,3.59,z+dz,mat.ink);
    contactShadow(root,.95,.95,x,z,.032);
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

  // Architecture has many small fittings, but rigid parts sharing a surface
  // render together. Animated groups, image planes and instanced foliage stay live.
  function batchStaticMeshes(parent) {
    const buckets = new Map();
    for (const object of parent.children) {
      if (!object.isMesh || object.isInstancedMesh || object === moving.mailFlag || Array.isArray(object.material) || object.material.transparent) continue;
      const attributes = Object.keys(object.geometry.attributes).sort().join(',');
      const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}:${object.renderOrder}:${attributes}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(object);
    }
    for (const objects of buckets.values()) {
      if (objects.length < 2) continue;
      const pieces = objects.map(object => {
        object.updateMatrix();
        const copy = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
        copy.applyMatrix4(object.matrix); return copy;
      });
      const merged = mergeGeometries(pieces, false);
      pieces.forEach(copy => copy.dispose());
      if (!merged) continue;
      geometries.set(`batch:${geometries.size}`, merged);
      const combined = mesh(merged, objects[0].material, parent, { shadow: objects[0].castShadow, receive: objects[0].receiveShadow });
      combined.name = 'Batched rigid architecture'; combined.renderOrder = objects[0].renderOrder;
      if (parent.userData.stationId) combined.userData.stationId = parent.userData.stationId;
      objects.forEach(object => parent.remove(object));
    }
  }
  for (const { object } of interactables) batchStaticMeshes(object);
  batchStaticMeshes(root);

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
