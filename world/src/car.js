import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createCar(scene) {
  const root = new THREE.Group(); root.name = 'Serkon touring car'; scene.add(root);
  const body = new THREE.Group(); root.add(body);
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const surface = (options, physical = false) => { const result = physical ? new THREE.MeshPhysicalMaterial(options) : new THREE.MeshStandardMaterial(options); materials.add(result); return result; };
  const paint = surface({ color: '#dd633f', roughness: .32, metalness: .24, clearcoat: .7, clearcoatRoughness: .18 }, true);
  const cream = surface({ color: '#fff3d5', roughness: .55, metalness: .08 });
  const dark = surface({ color: '#243c36', roughness: .61 });
  const chrome = surface({ color: '#ccd2bb', roughness: .21, metalness: .8 });
  const glass = surface({ color: '#365a5d', roughness: .12, metalness: .45, clearcoat: 1 }, true);
  const light = surface({ color: '#fff5d8', emissive: '#ffd294', emissiveIntensity: .6, roughness: .22 });
  const red = surface({ color: '#7d2925', emissive: '#a93522', emissiveIntensity: .12, roughness: .28 });
  const ownTexture = (width, height, draw) => { const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; draw(canvas.getContext('2d'), width, height); const tex = new THREE.CanvasTexture(canvas); textures.add(tex); return tex; };
  const tread = ownTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#626562'; ctx.fillRect(0, 0, w, h);
    for (let x = -24; x < w + 24; x += 16) {
      ctx.strokeStyle = '#242b27'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 20, h * .48); ctx.moveTo(x + 20, h * .52); ctx.lineTo(x, h); ctx.stroke();
    }
    for (const y of [19, 109]) { ctx.fillStyle = '#2c312e'; ctx.fillRect(0, y, w, 3); }
  });
  tread.wrapS = tread.wrapT = THREE.RepeatWrapping; tread.repeat.set(3, 1); tread.anisotropy = 4;
  const rubber = surface({ color: '#343934', roughness: .94, bumpMap: tread, bumpScale: .025, roughnessMap: tread });
  const rubberSide = surface({ color: '#303731', roughness: .86 });
  const add = (geometry, material, x, y, z, parent = body) => {
    geometries.add(geometry); const object = new THREE.Mesh(geometry, material); object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  };
  const box = (w, h, d, material, x, y, z, parent = body, radius = .025) => add(new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)), material, x, y, z, parent);
  const cylinder = (r, h, material, x, y, z, parent = body, sides = 24) => add(new THREE.CylinderGeometry(r, r, h, sides), material, x, y, z, parent);
  box(1.78, .56, 2.7, paint, 0, .67, 0, body, .16);
  box(1.57, .62, 1.30, cream, 0, 1.13, .11, body, .12);
  box(1.29, .41, .035, glass, 0, 1.18, -.565);
  box(1.28, .36, .035, glass, 0, 1.17, .78);
  box(1.60, .13, 1.35, cream, 0, 1.48, .12, body, .06);
  box(1.49, .025, 1.22, chrome, 0, 1.542, .12, body, .012);
  box(1.64, .13, .14, chrome, 0, .53, -1.37);
  box(1.64, .13, .14, chrome, 0, .53, 1.37);
  box(.65, .28, .028, dark, 0, .76, -1.362);
  for (let i = 0; i < 7; i++) box(.045, .22, .025, chrome, -.27 + i * .09, .76, -1.386);
  for (const x of [-.48, .48]) box(.032, .085, .19, dark, x, .52, -1.40);
  for (const side of [-1, 1]) {
    box(.035, .38, .86, glass, side * .80, 1.20, .10);
    for (const y of [1.005, 1.405]) box(.038, .025, .94, chrome, side * .823, y, .10);
    for (const z of [-.37, .12, .57]) box(.039, .405, .029, cream, side * .823, 1.205, z);
    box(.22, .035, .055, chrome, side * .90, .95, .38);
    box(.38, .19, .055, chrome, side * .57, .77, -1.355);
    box(.31, .125, .035, light, side * .57, .77, -1.389);
    box(.29, .13, .07, red, side * .59, .74, 1.36);
    box(.09, .13, .025, cream, side * .72, .74, 1.401);
    box(.045, .055, .23, chrome, side * .93, 1.07, -.34);
    box(.16, .15, .22, paint, side * 1.01, 1.11, -.36, body, .04);
    box(.012, .105, .155, chrome, side * 1.10, 1.115, -.35);
    box(.07, .08, .12, light, side * .887, .74, -.92);
    box(.025, .055, 2.19, chrome, side * .897, .43, .02);
    // Fine panels remain actual geometry, visible from close orbit angles.
    box(.016, .39, .012, dark, side * .894, .72, .63, body, .002);
    box(.016, .17, .012, dark, side * .894, .82, -.36, body, .002);
    box(.016, .012, .98, dark, side * .894, .52, .14, body, .002);
  }
  for (const x of [-.47, .33]) {
    const wiper = box(.36, .017, .022, dark, x, 1.018, -.593, body, .003); wiper.rotation.z = -.13;
  }
  for (const x of [-.62, .62]) box(.012, .012, .54, dark, x, .954, -.98, body, .002);
  for (let i = 0; i < 5; i++) box(.43, .015, .028, dark, 0, .957, .94 + i * .055, body, .003);
  const badge = cylinder(.072, .018, chrome, 0, .98, -.93); badge.rotation.x = Math.PI / 2;
  const plateTexture = ownTexture(256, 128, ctx => {
    ctx.fillStyle = '#f5ebd4'; ctx.fillRect(0, 0, 256, 128); ctx.strokeStyle = '#6e775c'; ctx.lineWidth = 5; ctx.strokeRect(7, 7, 242, 114);
    ctx.fillStyle = '#314c3e'; ctx.font = 'italic 82px Georgia'; ctx.textAlign = 'center'; ctx.fillText('sk.', 128, 92);
  });
  plateTexture.colorSpace = THREE.SRGBColorSpace;
  const plateMaterial = new THREE.MeshBasicMaterial({ map: plateTexture }); materials.add(plateMaterial);
  const plate = add(new THREE.PlaneGeometry(.54, .27), plateMaterial, 0, .75, 1.415); plate.rotation.y = Math.PI;
  for (const x of [-.24, .24]) { const bolt = cylinder(.012, .012, chrome, x, .83, 1.422, body, 8); bolt.rotation.x = Math.PI / 2; }
  const exhaust = cylinder(.055, .25, dark, -.57, .35, 1.30); exhaust.rotation.x = Math.PI / 2;

  // Merge only rigid body parts; steering and wheel spin keep their own pivots.
  const buckets = new Map();
  for (const object of body.children) {
    if (!object.isMesh) continue;
    const key = object.material.uuid;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(object);
  }
  for (const objects of buckets.values()) {
    if (objects.length < 2) continue;
    const pieces = objects.map(object => { object.updateMatrix(); const geo = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone(); geo.applyMatrix4(object.matrix); return geo; });
    const merged = mergeGeometries(pieces, false); pieces.forEach(geo => geo.dispose());
    if (!merged) continue;
    const combined = add(merged, objects[0].material, 0, 0, 0); combined.name = 'Batched touring-car body';
    objects.forEach(object => body.remove(object));
  }
  const wheelGeometry = new THREE.CylinderGeometry(.37, .37, .27, 32); geometries.add(wheelGeometry);
  const sidewallGeometry = new THREE.TorusGeometry(.31, .036, 7, 32); geometries.add(sidewallGeometry);
  const hubGeometry = new THREE.CylinderGeometry(.205, .205, .294, 24); geometries.add(hubGeometry);
  const spokeGeometry = new THREE.BoxGeometry(.018, .045, .21); geometries.add(spokeGeometry);
  const wheels = [];
  for (const x of [-.92, .92]) for (const z of [-.87, .89]) {
    const pivot = new THREE.Group(); pivot.position.set(x, .40, z); root.add(pivot);
    const spin = new THREE.Group(); pivot.add(spin);
    const tire = add(wheelGeometry, rubber, 0, 0, 0, spin); tire.rotation.z = Math.PI / 2;
    const hub = add(hubGeometry, dark, 0, 0, 0, spin); hub.rotation.z = Math.PI / 2;
    const wall = add(sidewallGeometry, rubberSide, Math.sign(x) * .141, 0, 0, spin); wall.rotation.y = Math.PI / 2;
    const rim = add(new THREE.TorusGeometry(.202, .022, 6, 24), cream, Math.sign(x) * .154, 0, 0, spin); rim.rotation.y = Math.PI / 2;
    const spokes = new THREE.InstancedMesh(spokeGeometry, chrome, 6); spin.add(spokes);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 6; i++) { const angle = i * Math.PI / 3; dummy.position.set(Math.sign(x) * .159, Math.sin(angle) * .10, Math.cos(angle) * .10); dummy.rotation.set(-angle, 0, 0); dummy.updateMatrix(); spokes.setMatrixAt(i, dummy.matrix); }
    const bolt = cylinder(.058, .33, chrome, 0, 0, 0, spin, 12); bolt.rotation.z = Math.PI / 2;
    wheels.push({ pivot, spin, front: z < 0 });
  }
  let wheelAngle = 0;
  return {
    root,
    update(dt, state) {
      root.position.set(state.x, state.y || 0, state.z); root.rotation.y = state.yaw;
      wheelAngle -= state.speed * dt / .37;
      for (const wheel of wheels) { wheel.pivot.rotation.y = wheel.front ? state.steer * .40 : 0; wheel.spin.rotation.x = wheelAngle; }
      body.rotation.z = THREE.MathUtils.lerp(body.rotation.z, -state.steer * state.speed * .009, .13);
      body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, -state.speed * .003, .1);
    },
    dispose() { root.removeFromParent(); geometries.forEach(geo => geo.dispose()); materials.forEach(mat => mat.dispose()); textures.forEach(tex => tex.dispose()); },
  };
}
