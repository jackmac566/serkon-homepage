import * as THREE from 'three';

// Frozen, self-hosted CC0 scans. Runtime never calls a third-party asset API.
export function loadSurfaceLibrary(keys = null) {
  const loader = new THREE.TextureLoader();
  const maps = {};
  const tileSizes = { ground: 2, stone: 2, wood: 2, asphalt: 4, desk: 1.4 };
  for (const [name, tileSize] of Object.entries(tileSizes).filter(([name])=>!keys||keys.includes(name))) {
    const load = (suffix, colour = false) => {
      const texture = loader.load(new URL(`./materials/${name}-${suffix}.jpg`, document.baseURI).href);
      texture.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = innerWidth < 760 ? 4 : 8;
      return texture;
    };
    maps[name] = { map: load('Diffuse', true), normalMap: load('nor_gl'), roughnessMap: load('Rough'), tileSize };
  }
  return maps;
}
