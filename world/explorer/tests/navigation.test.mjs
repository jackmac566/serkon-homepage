// Run from any directory: node --test world/explorer/tests/navigation.test.mjs
// Uses source terrain/colliders and the production PhysicsVehicle methods.
// The render frame is 1/60s; the original Ticker.scale=2 makes Rapier step 1/30s.
// Stationary props are fixed in this fixture so a successful route must clear
// them; this is a navigation regression, not a renderer or browser substitute.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { register } from 'node:module';
import { fileURLToPath } from 'node:url';
// Upstream Rapier 0.17 ships extensionless ESM imports and a WASM module.
// Resolve those Rapier-internal imports and isolate the vehicle from renderer startup.
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(specifier, context, next) {
  // PhysicsVehicle only consults Game in its constructor. Instantiate its real
  // prototype below without bringing the browser renderer into this fixture.
  if(specifier === '../Game.js' && context.parentURL?.endsWith('/Game/Physics/PhysicsVehicle.js'))
    return { url: 'data:text/javascript,export const Game = {}', shortCircuit: true };
  try { return await next(specifier, context) }
  catch(error) {
    if(specifier.startsWith('.') && context.parentURL?.includes('/@dimforge/rapier3d/')) {
      try { return await next(specifier + '.js', context) }
      catch { return next(specifier + '/index.js', context) }
    }
    throw error
  }
}`), import.meta.url);
const base=fileURLToPath(new URL('../', import.meta.url));
const R=await import(base+'/node_modules/@dimforge/rapier3d/rapier.js'),THREE=await import(base+'/node_modules/three/build/three.webgpu.js');
const {Events}=await import(base+'/sources/Game/Events.js'),{attachSerkonNavigation}=await import(base+'/sources/serkon-navigation.js');
const {PhysicsVehicle}=await import(base+'/sources/Game/Physics/PhysicsVehicle.js');
test('real terrain, production vehicle timing, bridge arrival and cancellation', t => {
const listeners={};const el=()=>({style:{},children:[],setAttribute(){},addEventListener(){},append(...x){this.children.push(...x)}});
globalThis.document={hidden:false,createElement:el,body:el(),addEventListener(){}};globalThis.window={addEventListener(name,cb){(listeners[name]??=[]).push(cb)}};window.parent=window;globalThis.location={origin:'http://localhost'};
const world=new R.World({x:0,y:-9.81,z:0});world.timestep=1/30;
const tb=fs.readFileSync(base+'/static/terrain/terrain.glb'),tj=JSON.parse(tb.subarray(20,20+tb.readUInt32LE(12)).toString().trim()),ta=tj.accessors[tj.meshes[0].primitives[0].attributes.POSITION],tv=tj.bufferViews[ta.bufferView],to=20+tb.readUInt32LE(12)+8+(tv.byteOffset||0)+(ta.byteOffset||0),heights=new Float32Array(ta.count),rows=Math.sqrt(ta.count);for(let i=0;i<ta.count;i++){const x=tb.readFloatLE(to+i*12),y=tb.readFloatLE(to+i*12+4),z=tb.readFloatLE(to+i*12+8);heights[Math.round((z/192+.5)*(rows-1))+Math.round((x/192+.5)*(rows-1))*rows]=y;}const floor=world.createCollider(R.ColliderDesc.heightfield(rows-1,rows-1,heights,{x:192,y:1,z:192}));
const landing=glb('respawns/respawnsReferences.glb').nodes.find(n=>n.name==='respawnLanding'),landingRotation={x:landing.rotation[0],y:landing.rotation[1],z:landing.rotation[2],w:landing.rotation[3]};
const body=world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(landing.translation[0],1.1,landing.translation[2]).setRotation(landingRotation).setLinearDamping(.1).setAngularDamping(.1));world.createCollider(R.ColliderDesc.cuboid(1.3,.4,.85).setTranslation(0,-.1,0).setMassProperties(2.5,{x:0,y:-.5,z:0},{x:1,y:1,z:1},{x:0,y:0,z:0,w:1}),body);
const controller=world.createVehicleController(body);
const player={state:1,position:new THREE.Vector3(39.52898,1.1,37.82523),accelerating:0,steering:0,boosting:0,braking:0,suspensions:['low','low','low','low']},vehicle=Object.assign(Object.create(PhysicsVehicle.prototype),{chassis:{physical:{body}},forward:new THREE.Vector3(1,0,0),upward:new THREE.Vector3(0,1,0),xzSpeed:0});
const game={RAPIER:R,physics:{world,groups:{bumper:4}},world:{floor:{physical:{colliders:[floor]}}},player,physicalVehicle:vehicle,inputs:{filters:new Set(['wandering']),actions:new Map(),nipple:{active:false,progress:0},gamepad:{joysticks:{left:{active:false}}},events:new Events()},debug:{active:false},quality:{level:1},ticker:{elapsed:0,delta:1/60,deltaScaled:1/30,deltaAverage:1/60,events:new Events(),wait(){}},reveal:{step:2},modals:{state:3,events:new Events()},menu:{state:3,events:new Events()},terrain:{size:192},water:{surfaceElevation:-.3},scene:new THREE.Scene(),canvasElement:el(),view:{focusPoint:{isTracking:false}},rayCursor:{intersects:[]}};
Object.assign(vehicle, {
    game, controller, events: new Events(),
    steeringAmplitude: .5, engineForceAmplitude: 300, boostMultiplier: 2,
    topSpeed: 5, topSpeedBoost: 40, brakeAmplitude: 35, idleBrake: .06, reverseBrake: .4,
    suspensionsHeights: { low: .88, mid: 1.23, high: 1.63 },
    suspensionsStiffness: { low: 20, mid: 30, high: 40 },
    position: player.position.clone(), quaternion: new THREE.Quaternion(),
    sideward: new THREE.Vector3(0, 0, 1), velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(1, 0, 0), speed: 0,
});
vehicle.setWheels(); vehicle.setStop(); vehicle.setUpsideDown(); vehicle.setStuck(); vehicle.setFlip();
function tick()
{
    game.ticker.elapsed += game.ticker.delta;
    player.accelerating = player.steering = player.braking = player.boosting = 0;
    game.ticker.events.trigger('tick');
    // Execute the actual wheel force, steering, reversing brake and telemetry
    // code, with the same controller delta and scaled world delta as the site.
    vehicle.updatePrePhysics();
    world.timestep = game.ticker.deltaScaled;
    world.step();
    vehicle.updatePostPhysics();
    player.position.copy(vehicle.position);
}

function glb(file){const b=fs.readFileSync(base+'/static/'+file),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString().trim());return j;}
const labels=new Map();function physical(n,children,label){const p=n.translation||[0,0,0],q=n.rotation||[0,0,0,1],rb=world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(...p).setRotation({x:q[0],y:q[1],z:q[2],w:q[3]}));for(const c of children){const sc=c.scale||[1,1,1],cp=c.translation||[0,0,0],cq=c.rotation||[0,0,0,1];let desc;if(c.name?.startsWith('cuboid'))desc=R.ColliderDesc.cuboid(sc[0]/2,sc[1]/2,sc[2]/2);else if(c.name?.startsWith('tube'))desc=R.ColliderDesc.cylinder(sc[1]/2,sc[0]/2);if(desc){const col=world.createCollider(desc.setTranslation(...cp).setRotation({x:cq[0],y:cq[1],z:cq[2],w:cq[3]}),rb);labels.set(col.handle,label);}}}
for(const dir of ['benches','fences']){const j=glb(dir+'/'+dir+'.glb'),roots=j.scenes[0].nodes.map(i=>j.nodes[i]),base=roots[0];for(const n of roots)physical(n,base.children.map(i=>j.nodes[i]),dir+':'+n.name);}
for(const dir of ['birchTrees','oakTrees','cherryTrees']){const j=glb(dir+'/'+dir+'References.glb');for(const i of j.scenes[0].nodes){const n=j.nodes[i],p=n.translation||[0,0,0];const col=world.createCollider(R.ColliderDesc.cylinder(2.5,.15).setTranslation(p[0],p[1]+2.5,p[2]));labels.set(col.handle,dir+':'+n.name);}}
{const j=glb('poleLights/poleLights.glb');for(const i of j.scenes[0].nodes){const n=j.nodes[i],p=n.translation||[0,0,0];const col=world.createCollider(R.ColliderDesc.cuboid(.2,1.7,.2).setTranslation(...p));labels.set(col.handle,'pole:'+n.name);}}

function rawglb(file){const b=fs.readFileSync(base+'/static/'+file),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len).toString().trim()),bin=20+len+8;return {j,b,bin,acc(ai){const a=j.accessors[ai],v=j.bufferViews[a.bufferView],components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],bytes={5126:4,5125:4,5123:2,5121:1}[a.componentType],array=a.componentType===5126?new Float32Array(a.count*components):new Uint32Array(a.count*components),read={5126:'readFloatLE',5125:'readUInt32LE',5123:'readUInt16LE',5121:'readUInt8'}[a.componentType];for(let i=0;i<a.count;i++)for(let k=0;k<components;k++)array[i*components+k]=b[read](bin+(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||components*bytes)+k*bytes);return array;}}}
function allphysical(file,area){const g=rawglb(file),j=g.j;function add(n,offset){if(!/physical/i.test(n.name||'')||n.extras?.preventAutoAdd||n.extras?.prevent)return;const tr=n.translation||[0,0,0],p=tr.map((v,i)=>v+offset[i]),q=n.rotation||[0,0,0,1],rb=world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(...p).setRotation({x:q[0],y:q[1],z:q[2],w:q[3]}));rb.userData={object:{visual:{object3D:{name:n.name.replace(/physical|fixed|dynamic|kinematicPositionBased/gi,'')}}}};for(const ci of n.children||[]){const c=j.nodes[ci],name=c.name||'',sc=c.scale||[1,1,1],cp=c.translation||[0,0,0],cq=c.rotation||[0,0,0,1];let d;if(/^cuboid/i.test(name))d=R.ColliderDesc.cuboid(sc[0]/2,sc[1]/2,sc[2]/2);else if(/^tube/i.test(name))d=R.ColliderDesc.cylinder(sc[1]/2,sc[0]/2);else if(/^ball/i.test(name))d=R.ColliderDesc.ball(sc[1]/2);else if(/^hull/i.test(name)){const a=j.meshes[c.mesh].primitives[0].attributes.POSITION;d=R.ColliderDesc.convexHull(g.acc(a));}else if(/^trimesh/i.test(name)){const m=j.meshes[c.mesh].primitives[0];d=R.ColliderDesc.trimesh(g.acc(m.attributes.POSITION),g.acc(m.indices));}if(d){const col=world.createCollider(d.setTranslation(...cp).setRotation({x:cq[0],y:cq[1],z:cq[2],w:cq[3]}),rb);labels.set(col.handle,file+':'+n.name+':'+name);}}}for(const ni of j.scenes[0].nodes){const n=j.nodes[ni];if(area){const offset=n.translation||[0,0,0];for(const ci of n.children||[])add(j.nodes[ci],offset);}else add(n,[0,0,0]);}}
allphysical('areas/areas.glb',true);allphysical('scenery/scenery.glb',false);

for(const [dir,ext] of [['bricks',[.5625,.375,.75]],['explosiveCrates',[.5,.5,.5]],['lanterns',[.35,.5,.35]]]){const j=glb(dir+'/'+dir+'.glb');for(const ni of j.scenes[0].nodes){const n=j.nodes[ni],p=n.translation||[0,0,0],q=n.rotation||[0,0,0,1],col=world.createCollider(R.ColliderDesc.cuboid(...ext).setTranslation(...p).setRotation({x:q[0],y:q[1],z:q[2],w:q[3]}));labels.set(col.handle,dir+':'+n.name);}}
allphysical('playground/playgroundPhysical.glb',false);
for(let i=0;i<90;i++)tick();
assert(world.colliders.len() > 400, 'fixture includes real area/scenery hulls, bridges and scattered props'); const near=[];world.intersectionsWithShape({x:player.position.x,y:1.1,z:player.position.z},{x:0,y:0,z:0,w:1},new R.Ball(1.65),c=>{if(c.parent()?.handle!==body.handle&&c.handle!==floor.handle){near.push({handle:c.handle,label:labels.get(c.handle),projection:c.projectPoint({x:player.position.x,y:1.1,z:player.position.z},false)});}return true;});assert.equal(near.length, 0, 'original landing spawn begins clear of obstacles');
const nav=attachSerkonNavigation(game);const accepted=nav.navigateTo({x:17,z:36});assert(accepted, 'ground navigation accepts original spawn');
if(accepted)
{
    let frames = 0;
    for(; frames < 6000 && nav.active; frames++) tick();
    const error = Math.hypot(player.position.x - 17, player.position.z - 36);
    assert.match(document.body.children[0].children[0].textContent, /到了/);
    assert(error < 1.5, 'production vehicle completes west bridge');
    t.diagnostic(JSON.stringify({ colliders: world.colliders.len(), frames, worldDelta: world.timestep, controllerDelta: 1/60, arrivalError: error }));
}
assert.equal(nav.active, false);
assert(nav.navigateTo({x:10,z:36}));
game.inputs.actions.set('forward',{active:true}); tick();
assert.equal(nav.active,false,'manual input cancels automatic control');
game.inputs.actions.clear();
assert(nav.navigateTo({x:10,z:36}));
for(const cb of listeners.message) cb({source:window,origin:location.origin,data:{source:'serkon-host',type:'pause'}});
assert.equal(nav.active,false,'trusted host pause cancels driving/planning');
assert.equal(player.accelerating,0);
assert.equal(nav.navigateTo({x:10,z:36}),false,'paused world cannot start another route');
world.free();
});
