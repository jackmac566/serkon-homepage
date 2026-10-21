import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createCar(scene) {
  const root=new THREE.Group();scene.add(root);
  const body=new THREE.Group();root.add(body);
  const paint=new THREE.MeshStandardMaterial({color:'#dd633f',roughness:.47,metalness:.12});
  const cream=new THREE.MeshStandardMaterial({color:'#fff3d5',roughness:.65});
  const dark=new THREE.MeshStandardMaterial({color:'#243c36',roughness:.42,metalness:.15});
  const rubber=new THREE.MeshStandardMaterial({color:'#303632',roughness:1});
  const chrome=new THREE.MeshStandardMaterial({color:'#ccd2bb',roughness:.24,metalness:.65});
  const glass=new THREE.MeshStandardMaterial({color:'#87b4b5',roughness:.19,metalness:.4});
  const add=(geometry,material,x,y,z,parent=body)=>{const object=new THREE.Mesh(geometry,material);object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;};
  add(new RoundedBoxGeometry(1.78,.56,2.7,3,.16),paint,0,.67,0);
  add(new RoundedBoxGeometry(1.57,.62,1.30,3,.12),cream,0,1.13,.11);
  add(new THREE.BoxGeometry(1.28,.41,.04),glass,0,1.18,-.56);
  add(new THREE.BoxGeometry(1.28,.36,.04),dark,0,1.17,.78);
  for(const side of [-1,1])add(new THREE.BoxGeometry(.035,.38,.86),glass,side*.80,1.20,.10);
  add(new RoundedBoxGeometry(1.60,.13,1.35,2,.06),cream,0,1.48,.12);
  add(new THREE.BoxGeometry(1.64,.13,.14),chrome,0,.53,-1.37);
  add(new THREE.BoxGeometry(1.64,.13,.14),chrome,0,.53,1.37);
  for(const side of [-1,1]){
    add(new THREE.BoxGeometry(.38,.17,.08),cream,side*.57,.77,-1.35);
    add(new THREE.BoxGeometry(.29,.13,.07),dark,side*.59,.74,1.36);
    add(new THREE.BoxGeometry(.16,.12,.24),dark,side*.97,1.09,-.35);
  }
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f5ebd4';ctx.fillRect(0,0,256,128);ctx.fillStyle='#314c3e';ctx.font='italic 82px Georgia';ctx.textAlign='center';ctx.fillText('sk.',128,92);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const plate=add(new THREE.PlaneGeometry(.58,.29),new THREE.MeshBasicMaterial({map:texture}),0,.74,1.415);plate.rotation.y=Math.PI;
  const wheels=[];
  for(const x of [-.92,.92])for(const z of [-.87,.89]){
    const pivot=new THREE.Group();pivot.position.set(x,.40,z);root.add(pivot);
    const spin=new THREE.Group();pivot.add(spin);
    const tire=add(new THREE.CylinderGeometry(.37,.37,.27,18),rubber,0,0,0,spin);tire.rotation.z=Math.PI/2;
    const hub=add(new THREE.CylinderGeometry(.18,.18,.281,14),cream,0,0,0,spin);hub.rotation.z=Math.PI/2;
    const bolt=add(new THREE.CylinderGeometry(.07,.07,.29,10),chrome,0,0,0,spin);bolt.rotation.z=Math.PI/2;
    wheels.push({pivot,spin,front:z<0});
  }
  let wheelAngle=0;
  return {root,update(dt,state){root.position.set(state.x,state.y||0,state.z);root.rotation.y=state.yaw;wheelAngle-=state.speed*dt/.37;for(const wheel of wheels){wheel.pivot.rotation.y=wheel.front?state.steer*.40:0;wheel.spin.rotation.x=wheelAngle;}body.rotation.z=THREE.MathUtils.lerp(body.rotation.z,-state.steer*state.speed*.009,.13);body.rotation.x=THREE.MathUtils.lerp(body.rotation.x,-state.speed*.003,.1);}};
}
