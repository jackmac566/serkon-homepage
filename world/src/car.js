import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Default mesh: Ferrari 458 Italia by vicent091036 (CC BY 4.0), distributed
// through the Three.js r186 example. Bruno Simon's MIT vehicle is a fallback.
// Complete notices and fixed source details: public/models/vehicle/.
export function createCar(scene) {
  const root = new THREE.Group(); root.name = 'Serkon touring Ferrari 458 Italia'; scene.add(root);
  const geometries = new Set(), materials = new Set(), textures = new Set(), wheels = [];
  let chassis = null, rig = null, disposed = false, spinAngle = 0, steering = 0, lastSpeed = 0, wheelRadius = .5;
  const physical = options => { const m = new THREE.MeshPhysicalMaterial(options); materials.add(m); return m; };
  const paint = physical({ color:'#8f292b', metalness:.48, roughness:.30, clearcoat:.94, clearcoatRoughness:.12 });
  const trim = physical({ color:'#292e2b', metalness:.18, roughness:.63, clearcoat:.16 });
  const chrome = physical({ color:'#aab4af', metalness:.88, roughness:.22 });
  const glass = physical({ color:'#263d40', metalness:.46, roughness:.10, clearcoat:1, clearcoatRoughness:.055 });
  const rubber = physical({ color:'#242925', metalness:0, roughness:.93 });
  const frontLight = physical({ color:'#ece5d0', metalness:.12, roughness:.20, emissive:'#ffe0a5', emissiveIntensity:.28 });
  const rearLight = physical({ color:'#752d2b', metalness:.1, roughness:.22, emissive:'#b92e21', emissiveIntensity:.24 });
  const texture = (w,h,draw) => { const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);textures.add(t);return t; };
  const tread = texture(256,128,(ctx,w,h)=>{
    ctx.fillStyle='#92978f';ctx.fillRect(0,0,w,h);
    for(let x=-20;x<w+20;x+=16){ctx.strokeStyle='#40483e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+15,h*.47);ctx.moveTo(x+15,h*.53);ctx.lineTo(x,h);ctx.stroke();}
    for(const y of [20,106]){ctx.fillStyle='#555d52';ctx.fillRect(0,y,w,2);}
  });
  tread.colorSpace=THREE.NoColorSpace;tread.wrapS=tread.wrapT=THREE.RepeatWrapping;tread.repeat.set(3,1);tread.channel=1;
  rubber.bumpMap=tread;rubber.bumpScale=.013;rubber.roughnessMap=tread;
  const plateTexture=texture(512,128,(ctx,w,h)=>{ctx.fillStyle='#dcded2';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#59645c';ctx.lineWidth=7;ctx.strokeRect(7,7,w-14,h-14);ctx.fillStyle='#344139';ctx.textAlign='center';ctx.font='500 75px Arial';ctx.fillText('SK · 001',w/2,91);});
  plateTexture.colorSpace=THREE.SRGBColorSpace;
  const plateMaterial=new THREE.MeshStandardMaterial({map:plateTexture,roughness:.56,metalness:.15});materials.add(plateMaterial);
  const ownMesh=(geometry,material,parent)=>{geometries.add(geometry);const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};

  // The authored palette encodes trim, glass and metal in fixed UV swatches.
  // Separate PBR surfaces preserve the model's geometry and avoid plastic windows.
  function paletteParts(object,isWheel=false){
    const source=object.geometry,g=source.clone(),p=g.attributes.position,uv=g.attributes.uv;
    const index=g.index?.array||Array.from({length:p.count},(_,i)=>i),buckets=[[],[],[]];
    for(let i=0;i<index.length;i+=3){const swatch=Math.floor(uv.getX(index[i])*32);const bucket=swatch===6?1:!isWheel&&swatch===5?2:0;buckets[bucket].push(index[i],index[i+1],index[i+2]);}
    const sorted=[];g.clearGroups();buckets.forEach((indices,i)=>{if(indices.length)g.addGroup(sorted.length,indices.length,i);sorted.push(...indices);});g.setIndex(sorted);
    if(isWheel){const values=[];g.computeBoundingBox();const d=g.boundingBox.max.z-g.boundingBox.min.z;for(let i=0;i<p.count;i++)values.push(Math.atan2(p.getY(i),p.getX(i))/(Math.PI*2)+.5,(p.getZ(i)-g.boundingBox.min.z)/d);g.setAttribute('uv1',new THREE.Float32BufferAttribute(values,2));}
    geometries.add(g);object.geometry=g;object.material=[isWheel?rubber:trim,chrome,glass];
  }
  function remember(source){source.traverse(object=>{if(!object.isMesh)return;geometries.add(object.geometry);for(const m of(Array.isArray(object.material)?object.material:[object.material])){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});}
  function assembleOldSchool(source){
    remember(source);
    chassis=source.getObjectByName('chassis');
    const template=source.getObjectByName('wheelContainer');
    if(!chassis||!template)throw new Error('Vehicle GLB is missing its chassis or wheel template.');
    source.updateMatrixWorld(true);
    const bodyBounds=new THREE.Box3().setFromObject(chassis),bodySize=bodyBounds.getSize(new THREE.Vector3()),bodyCentre=bodyBounds.getCenter(new THREE.Vector3());
    const scale=4/bodySize.x;
    const sampleBounds=new THREE.Box3().setFromObject(template),sampleSize=sampleBounds.getSize(new THREE.Vector3());
    const radius=(Math.max(sampleSize.x,sampleSize.y)/2),wheelY=chassis.position.y+template.position.y;
    wheelRadius=radius*scale;
    rig=new THREE.Group();rig.name='Assembled old-school vehicle';
    const frame=new THREE.Group();rig.add(frame);frame.position.x=-bodyCentre.x;
    frame.add(chassis);chassis.rotation.order='YXZ';
    chassis.traverse(object=>{if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;object.name.match(/bodyPainted/i)?object.material=paint:object.name.match(/bodyBlack/i)?paletteParts(object):object.material=object.name.match(/backLights/i)?rearLight:frontLight;});
    // The template's axle is local Z; a half-turn mirrors it for the opposite side.
    for(const front of [true,false])for(const side of [-1,1]){
      const pivot=template.clone(true);pivot.name=`${front?'Front':'Rear'} ${side<0?'left':'right'} wheel`;
      const base=side>0?Math.PI:0;pivot.position.set(front?template.position.x:-.95,wheelY,side*Math.abs(template.position.z));pivot.rotation.set(0,base,0);
      const cylinder=pivot.getObjectByName('wheelCylinder');cylinder.position.set(0,0,0);
      pivot.traverse(object=>{if(object.isMesh){paletteParts(object,true);object.castShadow=true;object.receiveShadow=true;}});
      frame.add(pivot);wheels.push({pivot,cylinder,front,base,rollSign:side>0?-1:1});
    }
    // Small local identity plates are the only added body geometry.
    for(const [x,angle] of [[bodyBounds.max.x+.014,Math.PI/2],[bodyBounds.min.x-.014,-Math.PI/2]]){
      const plate=ownMesh(new THREE.PlaneGeometry(.34,.10),plateMaterial,frame);plate.position.set(x,.65,0);plate.rotation.y=angle;
    }
    // Ground the assembled tires before applying the documented world transform.
    rig.updateMatrixWorld(true);const grounded=new THREE.Box3().setFromObject(rig);frame.position.y=-grounded.min.y+.012;
    rig.scale.setScalar(scale);rig.rotation.y=Math.PI/2;rig.updateMatrixWorld(true);
    const dimensions=new THREE.Box3().setFromObject(rig).getSize(new THREE.Vector3());
    root.userData.vehicle={status:'ready',model:'oldSchool.glb',forward:'-Z',width:dimensions.x,height:dimensions.y,length:dimensions.z,wheelRadius,collisionRadius:1.25};
    root.add(rig);
  }
  function assembleFerrari(source){
    remember(source);source.updateMatrixWorld(true);
    const model=source.getObjectByName('RootNode')||source;
    const originalBounds=new THREE.Box3().setFromObject(model),dimensions=originalBounds.getSize(new THREE.Vector3()),centre=originalBounds.getCenter(new THREE.Vector3());
    const scale=4.4/dimensions.z;
    rig=new THREE.Group();rig.name='Ferrari 458 Italia rig';
    const frame=new THREE.Group();rig.add(frame);frame.add(model);frame.position.set(-centre.x,-originalBounds.min.y+.009,-centre.z);
    const carGlass=physical({color:'#a5bab6',metalness:.08,roughness:.065,transparent:true,opacity:.46,depthWrite:false,clearcoat:1,clearcoatRoughness:.04});
    model.traverse(object=>{
      if(!object.isMesh)return;
      object.castShadow=!/^glass$/.test(object.name);object.receiveShadow=true;
      if(object.name==='body')object.material=paint;
      else if(/^rim_|^chrome$|^metal$|^nuts/.test(object.name))object.material=chrome;
      else if(object.name==='glass')object.material=carGlass;
      else if(/^lights_red/.test(object.name))object.material=rearLight;
      else if(/^lights$|^leds$/.test(object.name))object.material=frontLight;
      else if(/^trim$|^grills$|^wipers$|^plastic_gray$/.test(object.name))object.material=trim;
      else if(/^tire/.test(object.name)){
        const g=object.geometry,p=g.attributes.position,uv=[];g.computeBoundingBox();const min=g.boundingBox.min.x,width=g.boundingBox.max.x-min;
        for(let i=0;i<p.count;i++)uv.push(Math.atan2(p.getZ(i),p.getY(i))/(Math.PI*2)+.5,(p.getX(i)-min)/width);
        g.setAttribute('uv1',new THREE.Float32BufferAttribute(uv,2));geometries.add(g);object.geometry=g;object.material=rubber;
      }
    });
    for(const name of ['wheel_fl','wheel_fr','wheel_rl','wheel_rr']){
      const cylinder=model.getObjectByName(name);if(!cylinder)throw new Error(`Ferrari is missing ${name}`);
      const bounds=new THREE.Box3().setFromObject(cylinder),size=bounds.getSize(new THREE.Vector3());
      if(name==='wheel_fl')wheelRadius=Math.max(size.y,size.z)/2*scale;
      const pivot=new THREE.Group();pivot.name=`${name} steering pivot`;pivot.position.copy(cylinder.position);cylinder.parent.add(pivot);pivot.add(cylinder);cylinder.position.set(0,0,0);
      wheels.push({pivot,cylinder,front:/wheel_f/.test(name),base:0,baseRoll:cylinder.rotation.x,ferrari:true});
    }
    // The FBX body has an authored coordinate transform; keep it intact beneath
    // a separate suspension pivot rather than overwriting that transform.
    const body=model.getObjectByName('main');if(!body)throw new Error('Ferrari body group is missing.');
    chassis=new THREE.Group();chassis.name='Ferrari body suspension';chassis.position.copy(body.position);body.parent.add(chassis);chassis.add(body);body.position.set(0,0,0);
    rig.scale.setScalar(scale);rig.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(rig).getSize(new THREE.Vector3());
    root.userData.vehicle={status:'ready',model:'ferrari.glb',author:'vicent091036',license:'CC BY 4.0',forward:'-Z',width:size.x,height:size.y,length:size.z,wheelRadius,collisionRadius:1.25};
    root.add(rig);
  }
  function fallback(){
    // A failed local request remains driveable. Normal loading always uses the GLB.
    rig=new THREE.Group();rig.name='Vehicle recovery silhouette';root.add(rig);chassis=new THREE.Group();rig.add(chassis);
    const body=ownMesh(new THREE.BoxGeometry(1.8,.56,3.7),paint,chassis);body.position.y=.70;
    const cabin=ownMesh(new THREE.BoxGeometry(1.65,.72,1.70),glass,chassis);cabin.position.set(0,1.30,.18);
    for(const x of [-.94,.94])for(const z of [-1.15,1.15]){const pivot=new THREE.Group();pivot.position.set(x,.43,z);rig.add(pivot);const cylinder=new THREE.Group();pivot.add(cylinder);const tireGeometry=new THREE.CylinderGeometry(.42,.42,.26,20);tireGeometry.setAttribute('uv1',tireGeometry.attributes.uv.clone());const tire=ownMesh(tireGeometry,rubber,cylinder);tire.rotation.z=Math.PI/2;wheels.push({pivot,cylinder,front:z<0,base:0,rollSign:1,fallback:true});}
    wheelRadius=.42;root.userData.vehicle={status:'fallback',forward:'-Z',collisionRadius:1.25};
  }
  let resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  root.userData.vehicle={status:'loading',forward:'-Z',collisionRadius:1.25};
  const draco=new DRACOLoader(THREE.DefaultLoadingManager);
  draco.setDecoderPath(new URL('./models/vehicle/draco/',document.baseURI).href);draco.setWorkerLimit(2);
  const loader=new GLTFLoader(THREE.DefaultLoadingManager);loader.setDRACOLoader(draco);
  function loadOldSchool(){
    loader.load(new URL('./models/vehicle/oldSchool.glb',document.baseURI).href,gltf=>{
      if(disposed){remember(gltf.scene);disposeAssets();resolveReady({status:'disposed'});return;}
      try{assembleOldSchool(gltf.scene);resolveReady({status:'ready',model:'oldSchool.glb'});}catch(error){rig?.removeFromParent();wheels.length=0;fallback();resolveReady({status:'fallback',message:error.message});}
    },undefined,()=>{if(!disposed)fallback();resolveReady({status:disposed?'disposed':'fallback'});});
  }
  loader.load(new URL('./models/vehicle/ferrari.glb',document.baseURI).href,gltf=>{
    if(disposed){remember(gltf.scene);disposeAssets();resolveReady({status:'disposed'});return;}
    try{assembleFerrari(gltf.scene);draco.dispose();resolveReady({status:'ready',model:'ferrari.glb'});}catch(error){rig?.removeFromParent();wheels.length=0;chassis=null;loadOldSchool();}
  },undefined,()=>{if(disposed)resolveReady({status:'disposed'});else loadOldSchool();});
  function disposeAssets(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
  return {
    root,ready,
    update(dt,state){
      if(disposed)return;const step=THREE.MathUtils.clamp(Number.isFinite(dt)?dt:0,0,.1),speed=Number.isFinite(state.speed)?state.speed:0,steer=Number.isFinite(state.steer)?state.steer:0;
      root.position.set(state.x,state.y||0,state.z);root.rotation.y=state.yaw;
      spinAngle-=speed*step/wheelRadius;steering=THREE.MathUtils.lerp(steering,steer*.40,1-Math.exp(-step*13));
      for(const w of wheels){w.pivot.rotation.y=w.base+(w.front?steering:0);if(w.ferrari)w.cylinder.rotation.x=w.baseRoll+spinAngle;else if(w.fallback)w.cylinder.rotation.x=spinAngle;else w.cylinder.rotation.z=spinAngle*w.rollSign;}
      if(chassis){const acceleration=step>0?(speed-lastSpeed)/step:0,blend=1-Math.exp(-step*7);
        if(root.userData.vehicle.model==='ferrari.glb'){chassis.rotation.z=THREE.MathUtils.lerp(chassis.rotation.z,THREE.MathUtils.clamp(-steer*speed*.003,-.025,.025),blend);chassis.rotation.x=THREE.MathUtils.lerp(chassis.rotation.x,THREE.MathUtils.clamp(acceleration*.002,-.014,.014),blend);}
        else if(root.userData.vehicle.status==='ready'){chassis.rotation.x=THREE.MathUtils.lerp(chassis.rotation.x,THREE.MathUtils.clamp(steer*speed*.004,-.035,.035),blend);chassis.rotation.z=THREE.MathUtils.lerp(chassis.rotation.z,THREE.MathUtils.clamp(acceleration*.0025,-.018,.018),blend);}
        rearLight.emissiveIntensity=acceleration<-.8?.75:.24;
      }
      lastSpeed=speed;
    },
    dispose(){if(disposed)return;disposed=true;root.removeFromParent();draco.dispose();disposeAssets();},
  };
}
