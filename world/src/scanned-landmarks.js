import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** A few self-hosted CC0 scanned rocks ground the perimeter in natural geometry. */
export function addScannedLandmarks(scene, colliders) {
  const placements = [
    { x:-46, z:-8, height:1.9, yaw:.4 },
    { x:-47, z:10, height:1.3, yaw:2.7 },
    { x:39, z:-40, height:1.8, yaw:1.3 },
    { x:40, z:39, height:1.3, yaw:3.5 },
  ];
  // Reserve the footprint before the asynchronous model is visible.
  for (const p of placements) colliders.push({ x:p.x,z:p.z,r:p.height*1.25 });
  new GLTFLoader().load(new URL('./models/boulder/boulder.gltf',document.baseURI).href,gltf=>{
    const source=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(source),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    source.position.set(-center.x,-bounds.min.y,-center.z);
    source.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;if(object.material.normalScale)object.material.normalScale.set(.65,.65);}});
    for(const p of placements){
      const group=new THREE.Group();group.name='Scanned natural rock';
      group.add(source.clone(true));group.scale.setScalar(p.height/size.y);group.rotation.y=p.yaw;group.position.set(p.x,-.05,p.z);scene.add(group);
    }
  });
}
