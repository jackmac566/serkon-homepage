import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createEnvironment } from './environment.js';
import { createCar } from './car.js';
import { createDriver } from './driving.js';
import { stations } from './content.js';
import { createPanels } from './panels.js';
import { createDeskScene } from './desk-scene.js';
import { createDesktop } from './desktop.js';
import { createBoot } from './boot.js';
import { loadSurfaceLibrary } from './surface-library.js';
import { addScannedLandmarks } from './scanned-landmarks.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import './style.css';

const $=selector=>document.querySelector(selector);
let musicPlaying=false,reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let driver,controls,renderer,scene,camera,environment,car,activeStation=null,nearStation=null,overview=true,ready=false,contextLost=false,entryDesk,deskControls,desktop,experience='boot',enteredWorld=false,deskTransition=false,autoOrbit=true,lastDeskInteraction=0;
const keys=new Set(),touch={throttle:0,steer:0,brake:false},visited=new Set();
const pins=new Map(),dock=new Map(),mapMarkers=new Map();
let noticeTimer,lastFrame=0,uiTime=0,cameraFlight=null,groundMarker;
let loadedAssets=0,totalAssets=0;
const boot=createBoot({onStart:startExperience,onDesktop:()=>{boot.hide();showDesktop();},onWorld:()=>{boot.hide();showWorld();}});
function finishBootIfReady(){if(ready&&loadedAssets>=totalAssets)boot.ready();}
THREE.DefaultLoadingManager.onStart=(_url,loaded,total)=>{loadedAssets=loaded;totalAssets=total;boot.progress(loaded,total);};
THREE.DefaultLoadingManager.onProgress=(_url,loaded,total)=>{loadedAssets=loaded;totalAssets=total;boot.progress(loaded,total);finishBootIfReady();};
THREE.DefaultLoadingManager.onLoad=finishBootIfReady;
THREE.DefaultLoadingManager.onError=url=>boot.stage('asset-warning','部分素材暂时不可用，文字与导航仍可使用','WARN');
function startExperience(){boot.hide();if(!ready||!entryDesk||contextLost){showDesktop();return;}setMode('desk');lastDeskInteraction=performance.now();$('#world').focus({preventScroll:true});}
const panels=createPanels({
  onClose:()=>{clearInput();if(driver)driver.state.speed=0;},
  onVisit:id=>{visited.add(id);activeStation=id;refreshVisited();clearInput();if(driver){driver.cancelTravel();driver.state.speed=0;}},
  onTravel:id=>{if(showWorld())travelTo(id);else openStation(id);},
  onMusic:playing=>{musicPlaying=playing;desktop?.setMusic(playing);$('#music-status').classList.toggle('playing',playing);$('#music-status span').textContent=playing?'《创世纪》播放中':'唱片未播放';}
});
desktop=createDesktop({
  onWorld:()=>showWorld(),
  onOpenStation:(id,opener)=>openStation(id,opener),
  onBackToDesk:()=>showComputerRoom(),
  onToggleMusic:()=>panels.toggleMusic(),
});
const worldUI='.world-header,.welcome,.world-pins,.world-map,.view-controls,.arrival,.travel-status,.place-dock,.touch-controls,.world-footer';
function setMode(mode){
  experience=mode;document.body.dataset.mode=mode;clearInput();
  for(const element of document.querySelectorAll(worldUI)){
    const hidden=mode!=='world'||(element.id==='welcome'&&element.classList.contains('hidden'));
    element.inert=hidden;if(hidden)element.setAttribute('aria-hidden','true');else element.removeAttribute('aria-hidden');
  }
  const intro=$('#desk-entry');intro.hidden=mode!=='desk';intro.inert=mode!=='desk';
  const canvas=$('#world');canvas.inert=mode==='desktop'||mode==='boot';canvas.setAttribute('aria-label',mode==='desk'?'Serkon的3D电脑房间，点击屏幕或进入电脑按钮打开个人桌面。':'Serkon的3D创作后院。使用方向键或WASD驾驶，或点击地点前往。');
  if(mode==='desktop'||mode==='boot')canvas.setAttribute('aria-hidden','true');else canvas.removeAttribute('aria-hidden');
}
function showDesktop(){
  driver?.cancelTravel();if(driver)driver.state.speed=0;cameraFlight=null;
  setMode('desktop');desktop.show();desktop.setMusic(musicPlaying);
}
function showComputerRoom(){
  desktop.hide();entryDesk?.reset();deskTransition=false;if(deskControls){deskControls.target.copy(entryDesk.inspectionTarget||new THREE.Vector3(0,3.25,-.4));deskControls.update();}lastDeskInteraction=performance.now();setMode('desk');$('#enter-computer').disabled=false;$('#enter-computer').firstChild.textContent='进入电脑 ';$('#enter-computer').focus({preventScroll:true});
}
function enterComputer(){
  if(experience!=='desk')return;
  if(!entryDesk||reducedMotion){showDesktop();return;}
  deskTransition=true;if(deskControls)deskControls.enabled=false;$('#enter-computer').disabled=true;$('#enter-computer').firstChild.textContent='正在进入 ';entryDesk.startZoom();
}
function showWorld(){
  if(!ready||contextLost){showDesktop();notify('3D场景暂时不可用，可以从桌面浏览全部内容。');return false;}
  desktop.hide();setMode('world');if(ready){setOverview(overview);$('#world').focus({preventScroll:true});}
  if(!enteredWorld){enteredWorld=true;hideWelcome();setOverview(false);notify('点击地面前往 · 拖动环顾四周');}
  return true;
}
$('#enter-computer').addEventListener('click',enterComputer);
$('#skip-computer').addEventListener('click',showDesktop);
$('#skip-to-world').addEventListener('click',showWorld);
$('#back-desktop').addEventListener('click',showDesktop);
$('#room-orbit').addEventListener('click',()=>{autoOrbit=!autoOrbit;$('#room-orbit').setAttribute('aria-pressed',String(autoOrbit));$('#room-orbit').textContent=autoOrbit?'暂停环绕':'恢复环绕';lastDeskInteraction=performance.now()-3000;});
setMode('boot');
function notify(text){clearTimeout(noticeTimer);$('#world-notice').textContent=text;$('#world-notice').classList.add('visible');noticeTimer=setTimeout(()=>$('#world-notice').classList.remove('visible'),3300);}
function clearInput(){keys.clear();touch.throttle=0;touch.steer=0;touch.brake=false;$('#joystick-thumb').style.transform='';}
function refreshVisited(){for(const station of stations){const has=visited.has(station.id);pins.get(station.id)?.classList.toggle('visited',has);dock.get(station.id)?.classList.toggle('visited',has);dock.get(station.id)?.classList.toggle('active',station.id===activeStation);mapMarkers.get(station.id)?.classList.toggle('visited',has);}}
function hideWelcome(){const welcome=$('#welcome');welcome.classList.add('hidden');welcome.inert=true;welcome.setAttribute('aria-hidden','true');}
function openStation(id,opener){hideWelcome();cameraFlight=null;clearInput();if(driver){driver.cancelTravel();driver.state.speed=0;}$('#travel-status').hidden=true;$('#arrival').hidden=true;panels.open(id,opener);}
function travelTo(id){$('#arrival').hidden=true;const station=stations.find(item=>item.id===id);if(!station)return;hideWelcome();if(!ready){openStation(id);return;}clearInput();panels.close();$('#world').focus({preventScroll:true});activeStation=id;refreshVisited();if(reducedMotion){driver.reset();driver.state.x=station.stopX;driver.state.z=station.stopZ;openStation(id);return;}const found=driver.travel(id,station.stopX,station.stopZ);if(!found){notify('这里暂时不好停车，先为你打开内容。');openStation(id);return;}setOverview(false);$('#travel-status').hidden=false;$('#travel-status span').textContent='正在前往 '+station.name;$('#travel-open').hidden=false;$('#travel-open').onclick=()=>openStation(id);}
function travelToGround(x,z){
  if(!ready||contextLost)return;hideWelcome();clearInput();driver.cancelTravel();activeStation=null;refreshVisited();$('#arrival').hidden=true;
  if(!driver.travelToPoint(x,z)){notify('这里暂时无法停车，请点旁边的路面。');return;}
  const target=driver.path.at(-1);if(target)groundMarker.position.set(target.x,.09,target.z);
  if(reducedMotion){driver.state.x=target.x;driver.state.z=target.z;driver.cancelTravel();notify('已到达选择的位置。');}
  setOverview(false);$('#travel-status').hidden=reducedMotion;$('#travel-status span').textContent='正在驶向你点的位置';$('#travel-open').hidden=true;$('#world').focus({preventScroll:true});
}
for(const station of stations){
  const pin=document.createElement('button');pin.type='button';pin.className='world-pin';pin.setAttribute('aria-label','前往'+station.name);pin.innerHTML='<span>'+station.number+'</span><span>'+station.name+'</span>';pin.addEventListener('click',()=>travelTo(station.id));$('#world-pins').append(pin);pins.set(station.id,pin);
  const item=document.createElement('button');item.type='button';item.innerHTML='<span>'+station.number+'</span><span>'+station.name+'</span>';item.setAttribute('aria-label','前往'+station.name);item.addEventListener('click',()=>travelTo(station.id));$('#places').append(item);dock.set(station.id,item);
  const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.classList.add('map-marker');group.setAttribute('transform',`translate(${70+station.x*1.18},${70+station.z*1.18})`);group.innerHTML='<circle r="8"/><text>'+station.number+'</text>';group.addEventListener('click',()=>travelTo(station.id));$('#map-stations').append(group);mapMarkers.set(station.id,group);
}
$('#directory').addEventListener('click',()=>{clearInput();if(driver){driver.cancelTravel();driver.state.speed=0;}panels.showDirectory();});
$('.skip-world').addEventListener('click',event=>{event.preventDefault();panels.showDirectory();});
$('#music-status').addEventListener('click',()=>openStation('music',$('#music-status')));
$('#start-driving').addEventListener('click',()=>{hideWelcome();setOverview(false);$('#world').focus({preventScroll:true});});
$('#enter-station').addEventListener('click',()=>{if(nearStation)openStation(nearStation.id,$('#enter-station'));});
$('#travel-cancel').addEventListener('click',()=>{driver?.cancelTravel();$('#travel-status').hidden=true;});
$('#map-toggle').addEventListener('click',()=>{const collapsed=$('.world-map').classList.toggle('collapsed');$('#map-toggle').setAttribute('aria-expanded',String(!collapsed));$('#map-toggle span').textContent=collapsed?'+':'−';});
$('#view-mode').addEventListener('click',()=>setOverview(!overview));
$('#reset-car').addEventListener('click',resetCar);
function resetCar(){driver?.reset();clearInput();$('#travel-status').hidden=true;notify('小车回到中央广场了。');setOverview(false);}
const help=$('#help-dialog');
$('#help-button').addEventListener('click',()=>{clearInput();if(driver)driver.state.speed=0;help.showModal();help.querySelector('.help-close').focus();});
$('.help-close').addEventListener('click',()=>help.close());help.addEventListener('close',()=>{clearInput();$('#help-button').focus({preventScroll:true});});
$('#help-directory').addEventListener('click',()=>{help.close();panels.showDirectory();});
$('#reduced-motion').checked=reducedMotion;$('#reduced-motion').addEventListener('change',event=>{reducedMotion=event.target.checked;if(reducedMotion){cameraFlight=null;driver?.cancelTravel();$('#travel-status').hidden=true;}notify(reducedMotion?'已减少镜头与场景动态。':'已恢复场景动态。');});
function setOverview(value){overview=value;$('#view-mode').setAttribute('aria-label',value?'切换到跟随视角':'切换到全景视角');if(!camera||!controls)return;const target=value?new THREE.Vector3(0,0,-3):new THREE.Vector3(driver.state.x,0,driver.state.z);const width=innerWidth,ratio=innerWidth/innerHeight;const offset=value?new THREE.Vector3(37,44,48).normalize().multiplyScalar(Math.max(130,68/(Math.tan(camera.fov*Math.PI/360)*ratio))*1.1):new THREE.Vector3(4.8,3.2,8.5).multiplyScalar(width<760?1.17:1);cameraFlight={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),to:target.clone().add(offset),target};if(reducedMotion){camera.position.copy(cameraFlight.to);controls.target.copy(target);cameraFlight=null;controls.update();}}
window.addEventListener('keydown',event=>{if(experience==='boot'&&event.key==='Enter'&&!event.target.closest('input,button')){event.preventDefault();if(boot.isReady())startExperience();return;}if(experience==='desk'&&event.key==='Enter'&&event.target===$('#world')){event.preventDefault();enterComputer();return;}if(experience!=='world')return;if(panels.isOpen()||help.open||event.target.closest('input,textarea,select,button,a'))return;const key=event.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))event.preventDefault();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){keys.add(key);hideWelcome();if(overview)setOverview(false);}if(key==='r'&&!event.repeat)resetCar();if(key==='e'&&nearStation&&!event.repeat)openStation(nearStation.id);if(/^[1-5]$/.test(key)&&!event.repeat)travelTo(stations[Number(key)-1].id);});
window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});
const joystick=$('#joystick');let joyStart=null;
joystick.addEventListener('pointerdown',event=>{joyStart={x:event.clientX,y:event.clientY,id:event.pointerId};joystick.setPointerCapture(event.pointerId);hideWelcome();if(overview)setOverview(false);});
joystick.addEventListener('pointermove',event=>{if(!joyStart||event.pointerId!==joyStart.id)return;const dx=event.clientX-joyStart.x,dy=event.clientY-joyStart.y,range=Math.max(18,joystick.clientWidth/2-23),scale=Math.max(1,Math.hypot(dx,dy)/range);touch.steer=-dx/scale/range;touch.throttle=-dy/scale/range;$('#joystick-thumb').style.transform=`translate(${dx/scale}px,${dy/scale}px)`;});
const releaseJoy=()=>{joyStart=null;touch.steer=touch.throttle=0;$('#joystick-thumb').style.transform='';};joystick.addEventListener('pointerup',releaseJoy);joystick.addEventListener('pointercancel',releaseJoy);
$('#touch-brake').addEventListener('pointerdown',event=>{touch.brake=true;event.currentTarget.setPointerCapture(event.pointerId);});for(const type of ['pointerup','pointercancel'])$('#touch-brake').addEventListener(type,()=>touch.brake=false);

function launch(){
  const canvas=$('#world');
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){boot.stage('renderer','3D unavailable; desktop fallback ready','WARN');boot.ready('可直接进入桌面');$('#welcome').classList.add('hidden');$('#drive-status').textContent='直接浏览模式';$('#world-pins').hidden=true;return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.35:1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  scene=new THREE.Scene();scene.background=new THREE.Color('#e9e3d5');scene.fog=new THREE.Fog('#dde6e5',75,240);
  camera=new THREE.PerspectiveCamera(innerWidth<760?58:52,innerWidth/innerHeight,.2,500);camera.position.set(37,44,48);
  controls=new OrbitControls(camera,canvas);controls.target.set(0,0,-3);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;controls.minDistance=5.5;controls.maxDistance=300;controls.minPolarAngle=.27;controls.maxPolarAngle=1.49;controls.update();controls.addEventListener('start',()=>{cameraFlight=null;});
  scene.add(new THREE.HemisphereLight('#e9f3ff','#76836b',.75));const sun=new THREE.DirectionalLight('#fff6e9',3.0);sun.position.set(-40,65,40);sun.castShadow=true;const shadowSize=innerWidth<760?1024:2048;sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;sun.shadow.camera.far=180;sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;scene.add(sun);
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const envTarget=pmrem.fromScene(room,.04);scene.environment=envTarget.texture;scene.environmentIntensity=.28;room.dispose();pmrem.dispose();
  const surfaceMaps=loadSurfaceLibrary();
  new HDRLoader().load(new URL('./materials/sky-hdri.hdr',document.baseURI).href,hdr=>{hdr.mapping=THREE.EquirectangularReflectionMapping;scene.background=hdr;scene.backgroundBlurriness=.015;scene.backgroundIntensity=.72;const outdoorPMREM=new THREE.PMREMGenerator(renderer);const outdoorEnv=outdoorPMREM.fromEquirectangular(hdr);scene.environment=outdoorEnv.texture;scene.environmentIntensity=.65;outdoorPMREM.dispose();boot.stage('light','Outdoor environment light ready');});
  entryDesk=createDeskScene(THREE,{environmentMap:envTarget.texture,surfaceMaps});entryDesk.resize(innerWidth,innerHeight);
  deskControls=new OrbitControls(entryDesk.camera,canvas);deskControls.target.copy(entryDesk.inspectionTarget||new THREE.Vector3(0,3.25,-.4));deskControls.enableDamping=true;deskControls.dampingFactor=.065;deskControls.enablePan=false;deskControls.minDistance=10;deskControls.maxDistance=35;deskControls.minPolarAngle=.3;deskControls.maxPolarAngle=1.48;deskControls.autoRotateSpeed=.32;deskControls.enabled=false;deskControls.update();deskControls.addEventListener('start',()=>{lastDeskInteraction=performance.now();});deskControls.addEventListener('end',()=>{lastDeskInteraction=performance.now();});
  boot.stage('renderer','3D renderer initialized');
  environment=createEnvironment(THREE,scene,{surfaceMaps});addScannedLandmarks(scene,environment.colliders);driver=createDriver({colliders:environment.colliders,bounds:environment.bounds||44,vehicleRadius:1.25});car=createCar(scene);boot.stage('scene','Room / world geometry ready');
  groundMarker=new THREE.Mesh(new THREE.RingGeometry(.65,.8,48),new THREE.MeshBasicMaterial({color:'#de6945',transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));groundMarker.rotation.x=-Math.PI/2;groundMarker.position.y=.09;groundMarker.visible=false;scene.add(groundMarker);
  const routeMaterial=new THREE.LineDashedMaterial({color:'#dc6941',dashSize:.48,gapSize:.38,transparent:true,opacity:.65,depthWrite:false});const route=new THREE.Line(new THREE.BufferGeometry(),routeMaterial);route.position.y=.065;scene.add(route);let lastPath='';
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),projected=new THREE.Vector3();let down=null;
  canvas.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY,time:performance.now()};});
  canvas.addEventListener('pointerup',event=>{if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>7||performance.now()-down.time>600||panels.isOpen()||help.open){down=null;return;}down=null;pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);if(experience==='desk'){raycaster.setFromCamera(pointer,entryDesk.camera);if(raycaster.intersectObject(entryDesk.screenTarget,true).length)enterComputer();return;}if(experience!=='world')return;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(environment.interactables.map(item=>item.object),true)[0];if(hit){let object=hit.object;while(object&&!object.userData.stationId)object=object.parent;const id=object?.userData.stationId;if(id){const station=stations.find(item=>item.id===id);if(Math.hypot(driver.state.x-station.stopX,driver.state.z-station.stopZ)<5)openStation(id);else travelTo(id);return;}}const grounds=environment.groundMeshes||[environment.groundTarget].filter(Boolean);const groundHit=raycaster.intersectObjects(grounds,true)[0];if(groundHit)travelToGround(groundHit.point.x,groundHit.point.z);});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;clearInput();showDesktop();notify('3D画面暂时断开，仍可从桌面浏览作品与照片。');});
  function resize(){entryDesk?.resize(innerWidth,innerHeight);camera.fov=innerWidth<760?58:52;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.35:1.7));renderer.setSize(innerWidth,innerHeight);if(overview)setOverview(true);}window.addEventListener('resize',resize);
  ready=true;canvas.dataset.ready='true';setOverview(true);finishBootIfReady();
  function frame(now){requestAnimationFrame(frame);if(contextLost||document.hidden){lastFrame=now;return;}const dt=Math.min(.05,(now-lastFrame)/1000||1/60);lastFrame=now;const paused=panels.isOpen()||help.open;controls.enabled=experience==='world'&&!paused;if(deskControls)deskControls.enabled=experience==='desk'&&!paused&&!deskTransition;
    if(experience==='boot'){return;}
    if(experience==='desk'){renderer.toneMappingExposure=1.05;if(deskControls.enabled){deskControls.autoRotate=autoOrbit&&!reducedMotion&&now-lastDeskInteraction>2200;deskControls.update(dt);}const result=paused?{}:entryDesk.update(dt,now/1000,{reducedMotion});renderer.render(entryDesk.scene,entryDesk.camera);if(result?.complete)showDesktop();return;}
    if(experience==='desktop')return;
    renderer.toneMappingExposure=.95;
    const input={throttle:(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)+touch.throttle,steer:(keys.has('a')||keys.has('arrowleft')?1:0)-(keys.has('d')||keys.has('arrowright')?1:0)+touch.steer,brake:keys.has(' ')||touch.brake};
    const result=driver.update(dt,input,!paused);car.update(dt,driver.state);environment.update(dt,now/1000,{musicPlaying,reducedMotion,activeId:activeStation});
    if(result?.arrived){$('#travel-status').hidden=true;if(result.arrived==='ground'){notify('到了。点击其他空地可以继续。');}else openStation(result.arrived);}
    groundMarker.visible=driver.state.travelId==='ground';if(groundMarker.visible){const pulse=1+(reducedMotion?0:Math.sin(now*.004)*.07);groundMarker.scale.setScalar(pulse);}
    if(!driver.state.travelId)$('#travel-status').hidden=true;
    if(cameraFlight){const amount=reducedMotion?1:Math.min(1,(now-cameraFlight.start)/1100),ease=1-Math.pow(1-amount,3);camera.position.lerpVectors(cameraFlight.from,cameraFlight.to,ease);controls.target.lerpVectors(cameraFlight.fromTarget,cameraFlight.target,ease);if(amount===1)cameraFlight=null;}
    else if(!overview&&!paused){const inspecting=nearStation&&!driver.state.travelId&&Math.abs(driver.state.speed)<.3;const target=inspecting?new THREE.Vector3((driver.state.x+nearStation.x)*.5,.7,(driver.state.z+nearStation.z)*.5):new THREE.Vector3(driver.state.x,0,driver.state.z);const delta=target.clone().sub(controls.target).multiplyScalar(1-Math.exp(-dt*5));controls.target.add(delta);camera.position.add(delta);}
    controls.update();
    const path=driver.path||[],pathKey=driver.state.travelId+':'+path.length;if(pathKey!==lastPath){lastPath=pathKey;route.geometry.dispose();route.geometry=new THREE.BufferGeometry().setFromPoints(path.map(point=>new THREE.Vector3(point.x,.04,point.z)));route.computeLineDistances();}route.visible=Boolean(driver.state.travelId)&&path.length>1;
    for(const station of stations){projected.set(station.x,3.25,station.z).project(camera);const pin=pins.get(station.id);const visible=projected.z>-1&&projected.z<1&&Math.abs(projected.x)<1.12&&Math.abs(projected.y)<1.12;pin.style.display=visible?'flex':'none';if(visible){pin.style.left=(projected.x*.5+.5)*innerWidth+'px';pin.style.top=(-projected.y*.5+.5)*innerHeight+'px';}}
    uiTime+=dt;if(uiTime>.14){uiTime=0;nearStation=stations.find(station=>Math.hypot(driver.state.x-station.stopX,driver.state.z-station.stopZ)<4.6)||null;$('#arrival').hidden=!nearStation||Boolean(driver.state.travelId)||paused;if(nearStation)$('#arrival-label').textContent='到了，'+nearStation.name;for(const station of stations)pins.get(station.id).classList.toggle('near',nearStation?.id===station.id);$('#map-car').setAttribute('transform',`translate(${70+driver.state.x*1.18},${70+driver.state.z*1.18}) rotate(${-driver.state.yaw*180/Math.PI})`);$('#drive-status').textContent=driver.state.travelId?'自动前往中':Math.abs(driver.state.speed)>.3?'正在漫游':'停在后院';}
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
}
try{launch();}catch(error){console.error(error);ready=false;boot.stage('renderer','3D unavailable; desktop fallback ready','WARN');boot.ready('可直接进入桌面');}
