import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const WORLD_BOUNDS = 44;

/** A metre-based landscape: level driving campus, real-scale architecture and furnishings. */
export function createEnvironment(THREE, scene, { assetBase = './assets/', surfaceMaps = {} } = {}) {
  const root = new THREE.Group(); root.name = 'Serkon landscape studios'; scene.add(root);
  const colliders = [], interactables = [], architecture = [];
  const geometries = new Map(), materials = new Set(), textures = new Set();
  const moving = {}, loader = new THREE.TextureLoader(), imageTextures = new Map();
  let seed = 578421;
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
  const geo = (key,make) => { if(!geometries.has(key))geometries.set(key,make()); return geometries.get(key); };
  const material = (color,options={}) => { const m=new THREE.MeshStandardMaterial({color,roughness:.85,...options});materials.add(m);return m; };
  const canvasTexture = (w,h,draw) => { const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;textures.add(tex);return tex; };
  const fallbackNoise = (base,wood=false) => canvasTexture(512,512,(ctx,w,h)=>{
    ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
    for(let i=0;i<10000;i++){const grey=Math.floor(70+random()*170);ctx.fillStyle=`rgba(${grey},${grey},${grey},${.035+random()*.1})`;ctx.fillRect(random()*w,random()*h,1+random()*2,1+random()*2);}
    if(wood)for(let i=0;i<180;i++){const y=i*3;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(150,y+Math.sin(i)*3,350,y-Math.cos(i)*4,512,y);ctx.strokeStyle='rgba(43,35,26,.19)';ctx.lineWidth=.3+random();ctx.stroke();}
  });
  const fallback={ground:fallbackNoise('#777a5e'),stone:fallbackNoise('#c8c6bc'),wood:fallbackNoise('#918477',true),asphalt:fallbackNoise('#555953')};
  function surface(key,colour,options={}){
    const supplied=surfaceMaps[key], result=material(supplied?.map?'#ffffff':colour,options);
    result.userData.tileSize=supplied?.tileSize||({ground:4,stone:2,wood:1.6,asphalt:4}[key]);
    for(const property of ['map','normalMap','roughnessMap']){
      const source=supplied?.[property]||(property==='map'?fallback[key]:null);
      if(source){const tex=source.clone();tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1,1);tex.colorSpace=property==='map'?THREE.SRGBColorSpace:THREE.NoColorSpace;tex.anisotropy=4;textures.add(tex);result[property]=tex;}
    }
    if(!result.normalMap){const bump=fallback[key].clone();bump.colorSpace=THREE.NoColorSpace;bump.wrapS=bump.wrapT=THREE.RepeatWrapping;textures.add(bump);result.bumpMap=bump;result.bumpScale=key==='ground'?.025:.008;}
    return result;
  }
  const mat={ground:surface('ground','#b6baa8'),stone:surface('stone','#e0dfd7'),wood:surface('wood','#c2b6a8'),asphalt:surface('asphalt','#91988f'),
    plaster:material('#d4d1c5'),concrete:material('#aeb0a6'),dark:material('#303934'),steel:material('#515b58',{metalness:.68,roughness:.36}),
    aluminium:material('#a4aaa5',{metalness:.78,roughness:.26}),black:material('#1e2422',{roughness:.73}),paper:material('#e6e1d4'),
    clay:material('#867367'),fabric:material('#6d7469',{roughness:1}),paint:material('#d8d8ca',{roughness:.91}),bark:material('#5f5849',{roughness:1})};
  mat.light=material('#e7dcc2',{emissive:'#ffdb9d',emissiveIntensity:.22,roughness:.4});
  mat.glass=new THREE.MeshPhysicalMaterial({color:'#a6b7ad',roughness:.12,metalness:.12,transparent:true,opacity:.29,depthWrite:false,side:THREE.DoubleSide,clearcoat:1});materials.add(mat.glass);
  mat.optic=new THREE.MeshPhysicalMaterial({color:'#344d4d',roughness:.08,metalness:.5,clearcoat:1});materials.add(mat.optic);
  const barkTexture=fallbackNoise('#746753',true);barkTexture.wrapS=barkTexture.wrapT=THREE.RepeatWrapping;
  mat.bark.map=barkTexture;mat.bark.bumpMap=barkTexture;mat.bark.bumpScale=.03;
  const aoTexture=canvasTexture(128,128,(ctx,w,h)=>{const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(20,26,19,.27)');g.addColorStop(.45,'rgba(20,26,19,.10)');g.addColorStop(1,'rgba(20,26,19,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);});
  const aoMat=new THREE.MeshBasicMaterial({map:aoTexture,transparent:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1});materials.add(aoMat);
  function mesh(g,m,parent=root,shadow=true){const o=new THREE.Mesh(g,m);o.castShadow=shadow&&m!==mat.glass;o.receiveShadow=true;parent.add(o);return o;}
  function worldBoxUV(g,w,h,d,tile){
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<uv.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));if(ny>=nx&&ny>=nz)uv.setXY(i,(p.getX(i)+w/2)/tile,(p.getZ(i)+d/2)/tile);else if(nx>=nz)uv.setXY(i,(p.getZ(i)+d/2)/tile,(p.getY(i)+h/2)/tile);else uv.setXY(i,(p.getX(i)+w/2)/tile,(p.getY(i)+h/2)/tile);}
    return g;
  }
  function box(parent,w,h,d,x,y,z,m=mat.plaster,bevel=.006){
    const tile=m.userData.tileSize||1,r=Math.min(bevel,w/5,h/5,d/5),key=`box:${w}:${h}:${d}:${r}:${tile}`;
    const geometry=geo(key,()=>worldBoxUV(r>.001?new RoundedBoxGeometry(w,h,d,1,r):new THREE.BoxGeometry(w,h,d),w,h,d,tile));
    const o=mesh(geometry,m,parent);o.position.set(x,y,z);return o;
  }
  function cylinder(parent,r,h,x,y,z,m=mat.steel,sides=16){const o=mesh(geo(`cylinder:${sides}`,()=>new THREE.CylinderGeometry(1,1,1,sides)),m,parent);o.scale.set(r,h,r);o.position.set(x,y,z);return o;}
  function beam(parent,a,b,r,m=mat.steel){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);const o=cylinder(parent,r,start.distanceTo(end),0,0,0,m,10);o.position.copy(start).add(end).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return o;}
  function ring(parent,r,t,x,y,z,m=mat.aluminium,axis='y'){const o=mesh(geo(`ring:${r}:${t}`,()=>new THREE.TorusGeometry(r,t,5,32)),m,parent);o.position.set(x,y,z);if(axis==='y')o.rotation.x=-Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o;}
  function instances(parent,g,m,transforms,name,shadow=false){const o=new THREE.InstancedMesh(g,m,transforms.length);o.name=name;o.castShadow=shadow;o.receiveShadow=true;const dummy=new THREE.Object3D();for(let i=0;i<transforms.length;i++){const a=transforms[i];dummy.position.set(...a.p);dummy.rotation.set(...(a.r||[0,0,0]));dummy.scale.set(...(a.s||[1,1,1]));dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);if(a.color)o.setColorAt(i,new THREE.Color(a.color));}parent.add(o);return o;}
  function contact(parent,x,z,w,d,y=.019){const o=mesh(geo('ao-plane',()=>new THREE.PlaneGeometry(1,1)),aoMat,parent,false);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.scale.set(w,d,1);return o;}
  function plate(parent,text,w,h,x,y,z,colour='#ddd9cc',ink='#3b433c'){
    const tex=canvasTexture(768,Math.max(96,Math.round(768*h/w)),(ctx,cw,ch)=>{ctx.fillStyle=colour;ctx.fillRect(0,0,cw,ch);ctx.font=`500 ${Math.round(ch*.53)}px "PingFang SC",Arial,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=ink;ctx.fillText(text,cw/2,ch*.52,cw*.92);});
    const m=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});materials.add(m);const o=mesh(geo(`plate:${w}:${h}`,()=>new THREE.PlaneGeometry(w,h)),m,parent,false);o.position.set(x,y,z);return o;
  }
  function image(parent,file,w,h,x,y,z,frame=true){
    if(frame)box(parent,w+.045,h+.045,.035,x,y,z-.021,mat.wood,.002);
    let entry=imageTextures.get(file);if(!entry){entry={texture:null,fits:[]};imageTextures.set(file,entry);entry.texture=loader.load(new URL(file,new URL(assetBase,document.baseURI)).href,()=>entry.fits.forEach(fit=>fit()));entry.texture.colorSpace=THREE.SRGBColorSpace;entry.texture.anisotropy=4;textures.add(entry.texture);}
    const texture=entry.texture;
    const m=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});materials.add(m);const o=mesh(geo(`image:${w}:${h}`,()=>new THREE.PlaneGeometry(w,h)),m,parent,false);o.position.set(x,y,z);
    const fit=()=>{if(!texture.image?.width)return;const a=texture.image.width/texture.image.height,b=w/h;o.scale.set(a<b?a/b:1,a>b?b/a:1,1);};entry.fits.push(fit);fit();return o;
  }
  function plane(gw,gd,y,m,name){const g=geo(name,()=>{const shape=new THREE.PlaneGeometry(gw,gd);shape.rotateX(-Math.PI/2);const p=shape.attributes.position,uv=shape.attributes.uv,tile=m.userData.tileSize||1;for(let i=0;i<uv.count;i++)uv.setXY(i,p.getX(i)/tile,p.getZ(i)/tile);return shape;});const o=mesh(g,m,root,false);o.position.y=y;return o;}

  // No pedestal: a continuous landscape rolls gently beyond the driving boundary.
  const landHeight=(x,z)=>{const outside=Math.max(Math.abs(x),Math.abs(z))-44,rise=Math.min(1,Math.max(0,outside)/24);return -.035+rise*rise*(.8+Math.sin(x*.10+z*.06)*1.1+Math.cos(z*.13)*.6);};
  const pondMask=(x,z,pad=1)=>Math.min(Math.hypot((x+40)/(4.2*pad),(z+8)/(5.8*pad)),Math.hypot((x+40)/(4.2*pad),(z-8)/(5.8*pad)));
  const terrain=geo('continuous-terrain',()=>{
    const g=new THREE.PlaneGeometry(192,192,128,128);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv,tile=mat.ground.userData.tileSize;
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),outside=Math.max(Math.abs(x),Math.abs(z))-44;let y=-.035;if(outside>0){const rise=Math.min(1,outside/24);y+=rise*rise*(.8+Math.sin(x*.10+z*.06)*1.1+Math.cos(z*.13)*.6);}const bank=pondMask(x,z);if(bank<1.2)y-=Math.max(0,1.2-bank)*.65;p.setY(i,y);uv.setXY(i,x/tile,z/tile);}
    const original=g.index.array,indices=[];for(let i=0;i<original.length;i+=3){const a=original[i],b=original[i+1],c=original[i+2],x=(p.getX(a)+p.getX(b)+p.getX(c))/3,z=(p.getZ(a)+p.getZ(b)+p.getZ(c))/3;if(pondMask(x,z)>.92)indices.push(a,b,c);}g.setIndex(indices);g.computeVertexNormals();return g;
  });mesh(terrain,mat.ground,root,false);
  const groundPickMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,colorWrite:false,depthWrite:false});materials.add(groundPickMat);
  const groundTarget=plane(96,96,.012,groundPickMat,'navigation-ground');groundTarget.name='Flat driveable ground';groundTarget.userData.navigationSurface=true;

  const kerbs=[],unit=geo('instance-unit-box',()=>new THREE.BoxGeometry(1,1,1));
  function path(points,width,m=mat.stone,edging=true){
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,.008,z))),samples=Math.max(12,Math.ceil(curve.getLength()/.75)),positions=[],uvs=[],indices=[],tile=m.userData.tileSize||2;
    for(let i=0;i<=samples;i++){const p=curve.getPoint(i/samples),t=curve.getTangent(i/samples),n=new THREE.Vector3(-t.z,0,t.x);for(const side of [-1,1]){const v=p.clone().addScaledVector(n,width*.5*side);positions.push(v.x,v.y,v.z);uvs.push(v.x/tile,v.z/tile);}if(i<samples){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();geometries.set(`path:${geometries.size}`,g);mesh(g,m,root,false);
    if(edging)for(let d=0;d<curve.getLength();d+=1.05){const t=d/curve.getLength(),p=curve.getPoint(t),a=curve.getTangent(t),n=new THREE.Vector3(-a.z,0,a.x);for(const side of [-1,1]){const q=p.clone().addScaledVector(n,side*(width/2+.055));kerbs.push({p:[q.x,.014,q.z],s:[.10,.075,1.02],r:[0,Math.atan2(a.x,a.z),0]});}}
  }
  const plaza=plane(17.4,14.6,.004,mat.stone,'central-courtyard');
  path([[-25,0],[-16,-1],[-11,-5],[-10,-7]],3.5);path([[7,-2],[10,-4],[10,-7]],3.5);
  path([[5,6],[8,9],[11,9]],3.5);path([[-5,6],[-8,9],[-11,9]],3.5);path([[0,-6],[0,-11],[0,-16]],3.6);
  path([[0,6],[0,18],[0,27]],4.5);
  const loopGeometry=geo('outer-loop',()=>{const g=new THREE.RingGeometry(31,37,144);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv,tile=mat.asphalt.userData.tileSize;for(let i=0;i<uv.count;i++)uv.setXY(i,p.getX(i)/tile,p.getZ(i)/tile);return g;});const loop=mesh(loopGeometry,mat.asphalt,root,false);loop.position.y=.006;
  path([[-25,0],[-31,0],[-36,0]],5.1,mat.asphalt);path([[8,0],[24,0],[34,0]],5.1,mat.asphalt);path([[0,27],[0,34]],4.5,mat.asphalt);path([[8,-13],[9,-23],[5,-30],[0,-34]],4.5,mat.asphalt);
  const stripes=[];for(let i=0;i<72;i++){const a=i*Math.PI*2/72,x=Math.sin(a)*34,z=Math.cos(a)*34;if(Math.abs(x)<3.5||Math.abs(z)<3.2)continue;stripes.push({p:[x,.016,z],s:[.10,.005,1.6],r:[0,a+Math.PI/2,0]});}
  instances(root,unit,mat.paint,stripes,'weathered road centre markings');instances(root,unit,mat.concrete,kerbs,'flush concrete path edging');
  // Paving joints establish a human scale without turning paths into raised islands.
  const joints=[];for(let x=-8;x<=8;x+=1.2)joints.push({p:[x,.009,0],s:[.009,.002,14.6]});for(let z=-6.6;z<7.3;z+=1.2)joints.push({p:[0,.009,z],s:[17.4,.002,.009]});instances(root,unit,mat.concrete,joints,'courtyard expansion joints');

  function createStation(id,x,z,r=4.45){const group=new THREE.Group();group.name=`${id} studio`;group.position.set(x,0,z);group.rotation.y=Math.atan2(-x,-z);root.add(group);interactables.push({id,object:group});architecture.push(group);colliders.push({x,z,r});group.userData.stationId=id;contact(group,0,0,9.6,7.1);return group;}
  function glazing(parent,x,y,z,w,h,side=false){
    const pane=box(parent,w,h,.012,x,y,z,mat.glass,.001);if(side)pane.rotation.y=Math.PI/2;
    const frame=new THREE.Group();parent.add(frame);architecture.push(frame);frame.position.set(x,y,z);if(side)frame.rotation.y=Math.PI/2;
    for(const xx of [-w/2,w/2])box(frame,.035,h+.07,.055,xx,0,0,mat.steel,.002);for(const yy of [-h/2,h/2])box(frame,w+.07,.035,.055,0,yy,0,mat.steel,.002);return pane;
  }
  function shell(parent,{cladding=mat.plaster,width=7.2,depth=5.2,title='',open=false}={}){
    const w=width/2,d=depth/2;
    box(parent,width+.35,.10,depth+.35,0,.015,0,mat.concrete,.003);
    box(parent,width,.08,depth,0,.102,0,mat.stone,.002);
    box(parent,width,2.82,.18,0,1.55,-d,cladding,.004);
    for(const side of [-1,1]){
      box(parent,.18,.55,depth,side*w,.40,0,cladding,.003);
      box(parent,.18,.44,depth,side*w,2.74,0,cladding,.003);
      for(const z of [-d+.35,d-.35])box(parent,.18,1.9,.70,side*w,1.6,z,cladding,.003);
      glazing(parent,side*(w+.005),1.6,0,depth-1.5,1.83,true);
    }
    if(!open){
      for(let i=0;i<4;i++){const x=-w+.9+i*(width/4);glazing(parent,x,1.42,d,width/4-.055,2.48);}
      // A recognisable 2.1 m door leaf and physical frame.
      box(parent,1.02,2.1,.035,1.85,1.19,d+.035,mat.glass,.001);
      for(const x of [1.32,2.38])box(parent,.045,2.16,.075,x,1.19,d+.055,mat.steel,.002);
      box(parent,1.10,.045,.075,1.85,2.29,d+.055,mat.steel,.002);
      box(parent,.026,.30,.055,2.24,1.12,d+.105,mat.aluminium,.002);
      box(parent,1.1,.022,.24,1.85,.16,d+.06,mat.aluminium,.002);
    }
    box(parent,width+.62,.16,depth+.65,0,3.01,0,mat.concrete,.008);
    box(parent,width+.52,.035,depth+.55,0,3.105,0,mat.dark,.003);
    for(const side of [-1,1])box(parent,.055,.12,depth+.67,side*(w+.30),3.05,0,mat.steel,.002);
    box(parent,width+.68,.11,.09,0,2.98,-d-.32,mat.steel,.002);
    for(const x of [-w+.1,w-.1]){cylinder(parent,.037,2.87,x,1.48,-d-.20,mat.steel,12);beam(parent,[x,.07,-d-.2],[x,.07,-d-.43],.037,mat.steel);}
    for(const x of [-2.4,0,2.4]){box(parent,.56,.028,.065,x,2.88,.5,mat.dark,.002);box(parent,.48,.012,.04,x,2.862,.5,mat.light,.001);}
    if(title)plate(parent,title,1.65,.23,-1.95,2.72,d+.115);
    // Facade joints and a dark capillary break at the foot of each wall.
    box(parent,width,.045,.025,0,.22,-d-.10,mat.dark,.001);
    for(let i=0;i<6;i++)box(parent,.008,2.68,.012,-w+.55+i*1.22,1.55,-d-.098,mat.concrete,.001);
  }
  function table(parent,x,z,w=1.8,d=.76){box(parent,w,.045,d,x,.765,z,mat.wood,.004);for(const xx of [-w/2+.10,w/2-.10])for(const zz of [-d/2+.08,d/2-.08])box(parent,.045,.70,.045,x+xx,.39,z+zz,mat.steel,.002);return .79;}
  function chair(parent,x,z,angle=0){const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=angle;parent.add(group);box(group,.46,.045,.44,0,.46,0,mat.wood,.005);box(group,.46,.34,.035,0,.74,-.21,mat.wood,.006);for(const xx of [-.19,.19])for(const zz of [-.17,.17])box(group,.028,.43,.028,xx,.235,zz,mat.steel,.002);architecture.push(group);return group;}
  function bench(parent,x,z,angle=0){const b=new THREE.Group();b.position.set(x,0,z);b.rotation.y=angle;parent.add(b);for(let i=0;i<4;i++)box(b,1.82,.035,.105,0,.46,-.16+i*.11,mat.wood,.003);for(const xx of [-.68,.68]){box(b,.05,.42,.42,xx,.23,0,mat.steel,.002);box(b,.035,.45,.035,xx,.66,-.22,mat.steel,.002);}for(let i=0;i<3;i++)box(b,1.82,.095,.032,0,.62+i*.115,-.24,mat.wood,.003);architecture.push(b);return b;}
  function planter(parent,x,z){box(parent,.62,.50,.62,x,.36,z,mat.clay,.009);box(parent,.55,.02,.55,x,.618,z,mat.dark,.002);const leaves=[];for(let i=0;i<13;i++){const a=i*2.399963;leaves.push({p:[x+Math.sin(a)*.13,.80+(i%4)*.075,z+Math.cos(a)*.13],s:[.06,.30,.014],r:[Math.sin(a)*.45,a,Math.cos(a)*.45]});}instances(parent,geo('potted-leaf',()=>new THREE.SphereGeometry(1,5,3)),mat.fabric,leaves,'small real-scale potted foliage');}
  function monitor(parent,x,y,z,file,w=.63){box(parent,w+.025,w*.57+.025,.038,x,y,z,mat.black,.005);image(parent,file,w,w*.57,x,y,z+.023,false);box(parent,.035,.17,.035,x,y-w*.285-.07,z,mat.aluminium,.002);box(parent,.23,.014,.15,x,y-w*.285-.16,z+.015,mat.steel,.003);}

  // 01. Product gallery. The public project is exhibited at normal gallery scale.
  const works=createStation('works',-15,-10);shell(works,{title:'01   作品展馆'});
  image(works,'color.webp',2.75,1.42,-.6,1.72,-2.49);
  const workTop=table(works,-.55,.45,3.2,.86);monitor(works,1.45,1.10,-1.1,'first-build.webp');
  const products=['#af936c','#c3beb2','#5d7577','#9c705a','#717d5e','#45534e'];
  for(let i=0;i<6;i++){const x=-1.75+i*.47,m=material(products[i]);cylinder(works,.023,.255,x,workTop+.128,.45,m,16);cylinder(works,.025,.014,x,workTop+.262,.45,mat.paper,12);const nozzle=mesh(geo('sealant-nozzle',()=>new THREE.ConeGeometry(.014,.085,12)),mat.paper,works);nozzle.position.set(x,workTop+.31,.45);}
  plate(works,'强鹰彩色胶 · 126 色',1.28,.13,-.6,1.01,.89,'#ddd9cd','#474c43');chair(works,1.35,-.1,Math.PI);planter(works,-2.8,1.65);

  // 02. Film studio. The camera, tripod and clapper are equipment, never architecture.
  const film=createStation('film',15,-10);shell(film,{title:'02   影像工作室',cladding:mat.dark});
  image(film,'london.webp',2.6,1.46,-.6,1.7,-2.49);table(film,.9,-1.20,2.2,.75);monitor(film,.9,1.12,-1.18,'export.webp',.58);
  const camera=new THREE.Group();camera.position.set(-1.7,1.37,.35);camera.rotation.y=-.28;film.add(camera);architecture.push(camera);
  box(camera,.19,.125,.12,0,0,0,mat.black,.012);box(camera,.10,.045,.075,.02,.08,-.01,mat.black,.005);
  const lens=cylinder(camera,.043,.12,0,-.005,.105,mat.black,24);lens.rotation.x=Math.PI/2;const optic=cylinder(camera,.035,.007,0,-.005,.168,mat.optic,24);optic.rotation.x=Math.PI/2;ring(camera,.045,.006,0,-.005,.13,mat.steel,'z');
  cylinder(film,.018,.38,-1.7,1.10,.35,mat.aluminium,12);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;beam(film,[-1.7,1.0,.35],[-1.7+Math.sin(a)*.42,.15,.35+Math.cos(a)*.42],.012,mat.steel);}
  chair(film,1.0,.0,Math.PI);box(film,.33,.24,.025,-.3,.92,-1.2,mat.black,.003);for(let i=0;i<5;i++)box(film,.032,.045,.028,-.42+i*.06,1.06,-1.2,i%2?mat.paper:mat.black,.001);
  box(film,.62,.25,.42,2.35,.27,.55,mat.black,.012);for(const x of [2.12,2.57])box(film,.035,.07,.018,x,.34,.77,mat.aluminium,.002);planter(film,-2.8,1.65);

  // 03. Listening room. A 28cm record sits on a normal 75cm-high cabinet.
  const music=createStation('music',16,12);shell(music,{title:'03   听音室',cladding:mat.wood});
  table(music,0,-.25,2.0,.68);box(music,.46,.065,.36,0,.82,-.25,mat.wood,.005);
  const record=new THREE.Group();record.position.set(-.055,.859,-.25);music.add(record);moving.record=record;
  cylinder(record,.14,.009,0,0,0,mat.black,48);for(const r of [.072,.096,.12])ring(record,r,.0009,0,.005,0,mat.steel);cylinder(record,.039,.002,0,.006,0,mat.paper,24);cylinder(record,.002,.012,0,.014,0,mat.aluminium,8);
  beam(music,[.16,.876,-.37],[.12,.883,-.23],.004,mat.aluminium);beam(music,[.12,.883,-.23],[.045,.877,-.15],.004,mat.aluminium);box(music,.016,.009,.024,.045,.872,-.15,mat.black,.001);
  for(const x of [-1.4,1.4]){cylinder(music,.018,.63,x,.46,-.25,mat.steel);box(music,.22,.028,.25,x,.77,-.25,mat.steel,.003);box(music,.18,.36,.24,x,.97,-.25,mat.wood,.005);const woofer=cylinder(music,.062,.009,x,.91,-.123,mat.black,24);woofer.rotation.x=Math.PI/2;const tweeter=cylinder(music,.026,.009,x,1.04,-.123,mat.black,16);tweeter.rotation.x=Math.PI/2;}
  image(music,'genesis.webp',.31,.31,.55,1.0,-.30);image(music,'genesis.webp',1.05,1.05,0,1.78,-2.49);chair(music,-.55,1.15,Math.PI);chair(music,.55,1.15,Math.PI);planter(music,-2.8,1.65);

  // 04. An open photography courtyard with a 2.55m pergola and ordinary benches.
  const life=createStation('life',-16,12,4.35);
  box(life,7.3,.10,5.25,0,.035,0,mat.stone,.003);box(life,6.8,2.45,.20,0,1.34,-2.1,mat.plaster,.005);
  image(life,'polaroids.webp',2.35,1.33,0,1.59,-1.985);image(life,'wave.jpg',.34,.46,-2.05,1.58,-1.97);image(life,'call.jpg',.34,.46,2.05,1.58,-1.97);
  for(const x of [-3.25,3.25])for(const z of [-2.1,2.1])box(life,.09,2.55,.09,x,1.39,z,mat.steel,.002);
  for(const x of [-3.25,3.25])box(life,.10,.14,4.45,x,2.67,0,mat.wood,.003);
  const rafters=[];for(let i=0;i<15;i++)rafters.push({p:[-3.3+i*.47,2.75,0],s:[.065,.10,4.5]});instances(life,unit,mat.wood,rafters,'pergola timber battens',true);
  plate(life,'04   照片庭院',1.52,.22,-1.9,2.43,-1.97);bench(life,-1.2,.75);bench(life,1.2,.75);planter(life,-2.8,1.6);planter(life,2.8,1.6);

  // 05. Reception: personal photos, a desk and a wall-mounted real-size letterbox.
  const about=createStation('about',0,-22,4.45);shell(about,{title:'05   侯世康 / 工作室'});
  image(about,'portrait.jpg',.54,.78,-1.8,1.65,-2.49);image(about,'wave.jpg',.54,.78,-.95,1.65,-2.49);table(about,.55,-.5,1.6,.70);chair(about,.55,-1.25);
  box(about,.33,.015,.23,.45,.798,-.5,mat.steel,.004);const laptop=box(about,.33,.215,.012,.45,.91,-.60,mat.black,.004);laptop.rotation.x=-.15;box(about,.21,.001,.10,.92,.794,-.36,mat.paper,.001);
  box(about,.42,.30,.16,-2.75,1.2,2.72,mat.steel,.008);const mailFlag=box(about,.405,.285,.018,-2.75,1.2,2.81,mat.steel,.003);moving.mailFlag=mailFlag;box(about,.28,.012,.015,-2.75,1.27,2.825,mat.black,.001);const lock=cylinder(about,.012,.009,-2.75,1.12,2.827,mat.aluminium,12);lock.rotation.x=Math.PI/2;
  for(const y of [1.1,1.3]){const hinge=cylinder(about,.008,.045,-2.96,y,2.823,mat.aluminium,8);hinge.rotation.z=Math.PI/2;}
  bench(about,-.7,1.2);planter(about,-2.85,1.6);

  // Landscape furniture is useful infrastructure at plausible human dimensions.
  for(const [x,z,a] of [[-23,23,.5],[24,23,-.5],[-24,-23,2.5],[23,-23,-2.5]]){const b=bench(root,x,z,a);colliders.push({x,z,r:1.05});contact(root,x,z,2.8,1.4);}
  for(const [x,z] of [[-7,-10],[8,-10],[-9,15],[9,16],[-4.1,-16],[4.1,-16],[-27,5],[27,-4],[3,28]]){
    cylinder(root,.045,3.25,x,1.625,z,mat.steel,12);box(root,.35,.065,.14,x,3.26,z,mat.dark,.005);box(root,.26,.008,.09,x,3.222,z,mat.light,.002);cylinder(root,.10,.10,x,.05,z,mat.concrete,12);colliders.push({x,z,r:.15});
  }

  // The stream and timber bridge are on grade; no vehicle is asked to climb a decorative slope.
  const water=material('#3e6258',{roughness:.22,metalness:.30});
  for(const z of [-8,8]){
    const shape=new THREE.Shape();for(let i=0;i<50;i++){const a=i/50*Math.PI*2,r=1+Math.sin(a*5+.4)*.055;const x=Math.cos(a)*4.6*r,zz=Math.sin(a)*6.25*r;if(!i)shape.moveTo(x,zz);else shape.lineTo(x,zz);}shape.closePath();const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);geometries.set(`stream:${z}`,g);const surface=mesh(g,water,root,false);surface.position.set(-40,-.12,z);colliders.push({x:-40,z,r:5.35});
  }
  const bridge=[];for(let i=0;i<31;i++)bridge.push({p:[-44.1+i*.30,.016,0]});const bridgeBoard=geo('bridge-board',()=>worldBoxUV(new THREE.BoxGeometry(.28,.075,3.7),.28,.075,3.7,mat.wood.userData.tileSize));instances(root,bridgeBoard,mat.wood,bridge,'timber bridge deck',true);
  for(const z of [-2,2]){for(let i=0;i<7;i++){const x=-44.1+i*1.5;box(root,.09,.95,.09,x,.48,z,mat.wood,.003);colliders.push({x,z,r:.13});}box(root,9.12,.065,.08,-39.6,.95,z,mat.wood,.003);box(root,9.12,.04,.05,-39.6,.48,z,mat.steel,.002);}

  // Leaf cards form broken, translucent crowns around explicit branches. There
  // are no spherical tree meshes or cone-shaped grass tufts in this landscape.
  const leafTexture=canvasTexture(256,256,(ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);ctx.strokeStyle='#6c7654';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(w*.5,h);ctx.bezierCurveTo(w*.4,h*.7,w*.6,h*.3,w*.5,0);ctx.stroke();
    for(let i=0;i<33;i++){const a=i*2.399963,r=Math.sqrt((i+.5)/33)*.41*w,x=w/2+Math.cos(a)*r,y=h/2+Math.sin(a)*r;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=['#526d43','#69824f','#7c8f59','#445d3b'][i%4];ctx.beginPath();ctx.ellipse(0,0,8+(i%4),15+(i%5),0,0,Math.PI*2);ctx.fill();ctx.restore();}
  });
  const leavesMat=material('#c5cbb4',{map:leafTexture,transparent:false,alphaTest:.45,side:THREE.DoubleSide,roughness:1});
  const trees=[[-25,-20,1],[-23,-16,.85],[-23,-6,.9],[-26,9,1.0],[-24,21,1.1],[-11,24,.85],[-7,25,1],[9,25,.9],[24,22,1.1],[25,5,1],[24,-4,.9],[25,-19,1.1],[17,-24,.9],[-13,-25,1.1],[-8,-22,.8],[9,-19,.8],[-24,2,.85],[23,16,.9],[-43,-38,1.35],[-40,-42,1.1],[-26,-42,1.2],[-18,-44,1.3],[-8,-43,1.1],[9,-43,1.25],[21,-42,1.1],[39,-42,1.3],[43,-35,1.25],[43,-22,1.1],[42,-12,1.2],[42,4,1.3],[43,17,1.1],[43,39,1.3],[28,43,1.35],[18,43,1.1],[7,42,1.2],[-8,43,1.2],[-22,42,1.3],[-43,39,1.2],[-43,18,1.1],[-43,-15,1.2],[-43,-27,1.1]];
  // Less regular distant groves continue the ground to the horizon.
  for(let i=0;i<36;i++){const a=i*2.399963,r=55+random()*21;trees.push([Math.sin(a)*r,Math.cos(a)*r,.85+random()*.7]);}
  const trunks=[],branches=[],foliage=[],treeAO=[],rocks=[];
  for(let i=0;i<trees.length;i++){
    const [x,z,s]=trees[i],height=(5.3+(i%4)*.45)*s,base=landHeight(x,z)+.035;
    trunks.push({p:[x,base+height*.46,z],s:[.12*s,height*.92,.12*s],r:[.025*Math.sin(i),0,.025*Math.cos(i)]});
    for(let j=0;j<9;j++){
      const a=j*2.399963+i*.31,start=new THREE.Vector3(x,base+height*(.43+j*.038),z),end=new THREE.Vector3(x+Math.sin(a)*(1.25+(j%3)*.26)*s,base+height*(.65+j*.026),z+Math.cos(a)*(1.25+(j%3)*.26)*s),delta=end.clone().sub(start),dummy=new THREE.Object3D();dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
      branches.push({p:start.clone().add(end).multiplyScalar(.5).toArray(),s:[.035*s,delta.length(),.035*s],r:[dummy.rotation.x,dummy.rotation.y,dummy.rotation.z]});
      for(let k=0;k<7;k++){const b=a+k*2.399963,reach=.34+random()*.63;foliage.push({p:[end.x+Math.sin(b)*reach*s,end.y+(random()-.35)*1.35*s,end.z+Math.cos(b)*reach*s],s:[1.20*s,1.42*s,1],r:[(random()-.5)*1.2,b,(random()-.5)*1.1],color:['#b9c7a3','#cdd2b2','#a4b794'][i%3]});}
    }
    treeAO.push({p:[x,base-.018,z],s:[4.2*s,4.2*s,1],r:[-Math.PI/2,0,0]});colliders.push({x,z,r:.19*s});
  }
  instances(root,geo('tree-trunk',()=>new THREE.CylinderGeometry(.68,1,1,10)),mat.bark,trunks,'tapered tree trunks',true);
  instances(root,geo('tree-branch',()=>new THREE.CylinderGeometry(.35,1,1,7)),mat.bark,branches,'natural branching',true);
  instances(root,geo('foliage-card',()=>new THREE.PlaneGeometry(1,1)),leavesMat,foliage,'open tree leaf clusters',true);
  instances(root,geo('tree-contact',()=>new THREE.PlaneGeometry(1,1)),aoMat,treeAO,'tree contact shading');
  // Thin curved blades, sparsely distributed where a car can still cross grass.
  const grassGeometry=geo('grass-blade',()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.012,0,0,.012,0,0,-.009,.19,.012,.009,.19,.012,0,.37,.043],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,.52,1,.52,.5,1],2));g.setIndex([0,1,2,1,3,2,2,3,4]);g.computeVertexNormals();return g;});
  const grassMat=material('#6e7852',{side:THREE.DoubleSide,roughness:1}),grass=[];
  for(let i=0;i<5400;i++){
    const x=(random()-.5)*152,z=(random()-.5)*152,r=Math.hypot(x,z);
    if((r>30&&r<38)||(Math.abs(x)<10&&Math.abs(z)<9)||pondMask(x,z)<1.1)continue;
    if(colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+.8))continue;
    if((Math.abs(z)<3&&Math.abs(x)<38)||(Math.abs(x)<2.7&&z>0&&z<35)||(x>5&&x<12&&z<-10&&z>-30))continue;
    const outside=Math.max(Math.abs(x),Math.abs(z))-44,rise=Math.min(1,Math.max(0,outside)/24),y=-.035+rise*rise*(.8+Math.sin(x*.10+z*.06)*1.1+Math.cos(z*.13)*.6);
    grass.push({p:[x,y,z],s:[.7+random()*.8,.4+random()*.6,1],r:[0,random()*Math.PI*2,0],color:['#929b78','#b1b593','#7d8a65'][i%3]});
  }
  instances(root,grassGeometry,grassMat,grass,'fine meadow grass');
  for(let i=0;i<36;i++){const a=i*2.399963,r=46+random()*20,x=Math.sin(a)*r,z=Math.cos(a)*r,s=.25+random()*.55;rocks.push({p:[x,-.04,z],s:[s,.18+random()*.25,s*.72],r:[.1,random()*Math.PI,.1]});colliders.push({x,z,r:s*.8});}
  instances(root,geo('landscape-rock',()=>new THREE.IcosahedronGeometry(1,1)),mat.concrete,rocks,'low natural field stones');

  // A real service building in the distance establishes scale, without another themed toy shop.
  const service=new THREE.Group();service.name='Grounds maintenance building';service.position.set(31,0,-31);service.rotation.y=-.55;root.add(service);architecture.push(service);colliders.push({x:31,z:-31,r:5.8});
  box(service,8.4,3.3,5.5,0,1.68,0,mat.wood,.004);box(service,8.9,.13,5.95,0,3.42,0,mat.steel,.005);
  box(service,2.4,2.55,.035,0,1.35,2.78,mat.dark,.003);for(let i=0;i<15;i++)box(service,2.35,.025,.02,0,.18+i*.17,2.805,mat.steel,.001);
  glazing(service,-2.5,1.9,2.79,1.1,.85);glazing(service,2.5,1.9,2.79,1.1,.85);cylinder(service,.04,3.32,4.2,1.68,-2.8,mat.steel,12);
  box(service,8.5,.08,.10,0,3.38,-2.86,mat.steel,.002);

  // Rigid fittings share draws. Moving records and letterbox leaves retain pivots.
  function batch(parent){
    const buckets=new Map();for(const o of parent.children){if(!o.isMesh||o.isInstancedMesh||o===moving.mailFlag||o===groundTarget||Array.isArray(o.material)||o.material===aoMat)continue;const key=`${o.material.uuid}:${o.castShadow}:${Object.keys(o.geometry.attributes).sort()}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);}
    for(const objects of buckets.values()){if(objects.length<2)continue;const copies=objects.map(o=>{o.updateMatrix();const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);return g;});const g=mergeGeometries(copies,false);copies.forEach(a=>a.dispose());if(!g)continue;geometries.set(`batch:${geometries.size}`,g);const combined=mesh(g,objects[0].material,parent,objects[0].castShadow);combined.name='Batched architectural fittings';objects.forEach(o=>parent.remove(o));}
  }
  for(const parent of architecture)batch(parent);batch(root);
  for(const {id,object} of interactables)object.traverse(child=>{child.userData.stationId=id;});
  return {root,bounds:WORLD_BOUNDS,groundTarget,groundMeshes:[groundTarget],colliders,interactables,
    update(dt,time,state={}){if(state.musicPlaying||state.audioPlaying)moving.record.rotation.y-=dt*2.1;moving.mailFlag.rotation.y=state.activeId==='about'?-.08:0;},
    dispose(){root.removeFromParent();for(const g of new Set(geometries.values()))g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();},
  };
}
