import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createEnvironment } from './environment.js';
import { createCar } from './car.js';
import { createDriver } from './driving.js';
import { stations } from './content.js';
import { createPanels } from './panels.js';
import './style.css';

const $=selector=>document.querySelector(selector);
let musicPlaying=false,reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let driver,controls,renderer,scene,camera,environment,car,activeStation=null,nearStation=null,overview=true,ready=false,contextLost=false;
const keys=new Set(),touch={throttle:0,steer:0,brake:false},visited=new Set();
const pins=new Map(),dock=new Map(),mapMarkers=new Map();
let noticeTimer,lastFrame=0,uiTime=0,cameraFlight=null;
const panels=createPanels({
  onClose:()=>{clearInput();if(driver)driver.state.speed=0;},
  onVisit:id=>{visited.add(id);activeStation=id;refreshVisited();clearInput();if(driver){driver.cancelTravel();driver.state.speed=0;}},
  onTravel:id=>travelTo(id),
  onMusic:playing=>{musicPlaying=playing;$('#music-status').classList.toggle('playing',playing);$('#music-status span').textContent=playing?'《创世纪》播放中':'唱片未播放';}
});
function notify(text){clearTimeout(noticeTimer);$('#world-notice').textContent=text;$('#world-notice').classList.add('visible');noticeTimer=setTimeout(()=>$('#world-notice').classList.remove('visible'),3300);}
function clearInput(){keys.clear();touch.throttle=0;touch.steer=0;touch.brake=false;$('#joystick-thumb').style.transform='';}
function refreshVisited(){for(const station of stations){const has=visited.has(station.id);pins.get(station.id)?.classList.toggle('visited',has);dock.get(station.id)?.classList.toggle('visited',has);dock.get(station.id)?.classList.toggle('active',station.id===activeStation);mapMarkers.get(station.id)?.classList.toggle('visited',has);}}
function hideWelcome(){const welcome=$('#welcome');welcome.classList.add('hidden');welcome.inert=true;welcome.setAttribute('aria-hidden','true');}
function openStation(id,opener){hideWelcome();cameraFlight=null;clearInput();if(driver){driver.cancelTravel();driver.state.speed=0;}$('#travel-status').hidden=true;$('#arrival').hidden=true;panels.open(id,opener);}
function travelTo(id){$('#arrival').hidden=true;const station=stations.find(item=>item.id===id);if(!station)return;hideWelcome();if(!ready){openStation(id);return;}clearInput();panels.close();$('#world').focus({preventScroll:true});activeStation=id;refreshVisited();if(reducedMotion){driver.reset();driver.state.x=station.stopX;driver.state.z=station.stopZ;openStation(id);return;}const found=driver.travel(id,station.stopX,station.stopZ);if(!found){notify('这里暂时不好停车，先为你打开内容。');openStation(id);return;}setOverview(false);$('#travel-status').hidden=false;$('#travel-status span').textContent='正在前往 '+station.name;$('#travel-open').onclick=()=>openStation(id);}
for(const station of stations){
  const pin=document.createElement('button');pin.type='button';pin.className='world-pin';pin.setAttribute('aria-label','前往'+station.name);pin.innerHTML='<span>'+station.number+'</span><span>'+station.name+'</span>';pin.addEventListener('click',()=>travelTo(station.id));$('#world-pins').append(pin);pins.set(station.id,pin);
  const item=document.createElement('button');item.type='button';item.innerHTML='<span>'+station.number+'</span><span>'+station.name+'</span>';item.setAttribute('aria-label','前往'+station.name);item.addEventListener('click',()=>travelTo(station.id));$('#places').append(item);dock.set(station.id,item);
  const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.classList.add('map-marker');group.setAttribute('transform',`translate(${70+station.x*1.85},${70+station.z*1.85})`);group.innerHTML='<circle r="8"/><text>'+station.number+'</text>';group.addEventListener('click',()=>travelTo(station.id));$('#map-stations').append(group);mapMarkers.set(station.id,group);
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
function setOverview(value){overview=value;$('#view-mode').setAttribute('aria-label',value?'切换到跟随视角':'切换到全景视角');if(!camera||!controls)return;const target=value?new THREE.Vector3(0,0,-3):new THREE.Vector3(driver.state.x,0,driver.state.z);const width=innerWidth,ratio=innerWidth/innerHeight;const offset=value?new THREE.Vector3(37,44,48).normalize().multiplyScalar(Math.max(80,42/(Math.tan(camera.fov*Math.PI/360)*ratio))*1.1):new THREE.Vector3(15,19,23).multiplyScalar(width<760?1.17:1);cameraFlight={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),to:target.clone().add(offset),target};if(reducedMotion){camera.position.copy(cameraFlight.to);controls.target.copy(target);cameraFlight=null;controls.update();}}
window.addEventListener('keydown',event=>{if(panels.isOpen()||help.open||event.target.closest('input,textarea,select,button,a'))return;const key=event.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))event.preventDefault();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){keys.add(key);hideWelcome();if(overview)setOverview(false);}if(key==='r'&&!event.repeat)resetCar();if(key==='e'&&nearStation&&!event.repeat)openStation(nearStation.id);if(/^[1-5]$/.test(key)&&!event.repeat)travelTo(stations[Number(key)-1].id);});
window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});
const joystick=$('#joystick');let joyStart=null;
joystick.addEventListener('pointerdown',event=>{joyStart={x:event.clientX,y:event.clientY,id:event.pointerId};joystick.setPointerCapture(event.pointerId);hideWelcome();if(overview)setOverview(false);});
joystick.addEventListener('pointermove',event=>{if(!joyStart||event.pointerId!==joyStart.id)return;const dx=event.clientX-joyStart.x,dy=event.clientY-joyStart.y,range=Math.max(18,joystick.clientWidth/2-23),scale=Math.max(1,Math.hypot(dx,dy)/range);touch.steer=-dx/scale/range;touch.throttle=-dy/scale/range;$('#joystick-thumb').style.transform=`translate(${dx/scale}px,${dy/scale}px)`;});
const releaseJoy=()=>{joyStart=null;touch.steer=touch.throttle=0;$('#joystick-thumb').style.transform='';};joystick.addEventListener('pointerup',releaseJoy);joystick.addEventListener('pointercancel',releaseJoy);
$('#touch-brake').addEventListener('pointerdown',event=>{touch.brake=true;event.currentTarget.setPointerCapture(event.pointerId);});for(const type of ['pointerup','pointercancel'])$('#touch-brake').addEventListener(type,()=>touch.brake=false);

function launch(){
  const canvas=$('#world');
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){$('#loading').classList.add('done');$('#loading').setAttribute('aria-hidden','true');$('#loading').inert=true;$('#welcome').classList.add('hidden');$('#drive-status').textContent='直接浏览模式';$('#world-pins').hidden=true;notify('这台设备暂时无法显示3D场景，可以直接浏览全部内容。');panels.showDirectory();return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.35:1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  scene=new THREE.Scene();scene.background=new THREE.Color('#e9e3d5');scene.fog=new THREE.Fog('#e9e3d5',240,480);
  camera=new THREE.PerspectiveCamera(innerWidth<760?48:40,innerWidth/innerHeight,.2,500);camera.position.set(37,44,48);
  controls=new OrbitControls(camera,canvas);controls.target.set(0,0,-3);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;controls.minDistance=16;controls.maxDistance=300;controls.minPolarAngle=.27;controls.maxPolarAngle=1.25;controls.update();
  scene.add(new THREE.HemisphereLight('#fff7de','#b3ad91',2.3));const sun=new THREE.DirectionalLight('#fff2cf',2.8);sun.position.set(-25,43,25);sun.castShadow=true;const shadowSize=innerWidth<760?1024:2048;sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;sun.shadow.camera.far=110;sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;scene.add(sun);
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const envTarget=pmrem.fromScene(room,.04);scene.environment=envTarget.texture;scene.environmentIntensity=.28;room.dispose();pmrem.dispose();
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshStandardMaterial({color:'#e2dbc9',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.85;floor.receiveShadow=true;scene.add(floor);
  environment=createEnvironment(THREE,scene);driver=createDriver({colliders:environment.colliders,bounds:26.3});car=createCar(scene);
  const routeMaterial=new THREE.LineDashedMaterial({color:'#dc6941',dashSize:.48,gapSize:.38,transparent:true,opacity:.65,depthWrite:false});const route=new THREE.Line(new THREE.BufferGeometry(),routeMaterial);route.position.y=.065;scene.add(route);let lastPath='';
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),projected=new THREE.Vector3();let down=null;
  canvas.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY,time:performance.now()};});
  canvas.addEventListener('pointerup',event=>{if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>7||performance.now()-down.time>600||panels.isOpen()||help.open){down=null;return;}down=null;pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(environment.interactables.map(item=>item.object),true)[0];if(hit){let object=hit.object;while(object&&!object.userData.stationId)object=object.parent;const id=object?.userData.stationId;if(id){const station=stations.find(item=>item.id===id);if(Math.hypot(driver.state.x-station.stopX,driver.state.z-station.stopZ)<5)openStation(id);else travelTo(id);}}});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;clearInput();notify('3D画面暂时断开，全部内容仍可直接浏览。');panels.showDirectory();});
  function resize(){camera.fov=innerWidth<760?48:40;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.35:1.7));renderer.setSize(innerWidth,innerHeight);if(overview)setOverview(true);}window.addEventListener('resize',resize);
  ready=true;canvas.dataset.ready='true';setOverview(true);$('#loading').classList.add('done');$('#loading').setAttribute('aria-hidden','true');$('#loading').inert=true;
  function frame(now){requestAnimationFrame(frame);if(contextLost||document.hidden){lastFrame=now;return;}const dt=Math.min(.05,(now-lastFrame)/1000||1/60);lastFrame=now;const paused=panels.isOpen()||help.open;controls.enabled=!paused;
    const input={throttle:(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)+touch.throttle,steer:(keys.has('a')||keys.has('arrowleft')?1:0)-(keys.has('d')||keys.has('arrowright')?1:0)+touch.steer,brake:keys.has(' ')||touch.brake};
    const before=new THREE.Vector3(driver.state.x,0,driver.state.z);const result=driver.update(dt,input,!paused);car.update(dt,driver.state);environment.update(dt,now/1000,{musicPlaying,reducedMotion,activeId:activeStation});
    if(result?.arrived){$('#travel-status').hidden=true;openStation(result.arrived);}
    if(!driver.state.travelId)$('#travel-status').hidden=true;
    if(cameraFlight){const amount=reducedMotion?1:Math.min(1,(now-cameraFlight.start)/1100),ease=1-Math.pow(1-amount,3);camera.position.lerpVectors(cameraFlight.from,cameraFlight.to,ease);controls.target.lerpVectors(cameraFlight.fromTarget,cameraFlight.target,ease);if(amount===1)cameraFlight=null;}
    else if(!overview&&!paused){const target=new THREE.Vector3(driver.state.x,0,driver.state.z);const delta=target.clone().sub(controls.target).multiplyScalar(1-Math.exp(-dt*5));controls.target.add(delta);camera.position.add(delta);}
    controls.update();
    const path=driver.path||[],pathKey=driver.state.travelId+':'+path.length;if(pathKey!==lastPath){lastPath=pathKey;route.geometry.dispose();route.geometry=new THREE.BufferGeometry().setFromPoints(path.map(point=>new THREE.Vector3(point.x,.04,point.z)));route.computeLineDistances();}route.visible=Boolean(driver.state.travelId)&&path.length>1;
    for(const station of stations){projected.set(station.x,4.7,station.z).project(camera);const pin=pins.get(station.id);const visible=projected.z>-1&&projected.z<1&&Math.abs(projected.x)<1.12&&Math.abs(projected.y)<1.12;pin.style.display=visible?'flex':'none';if(visible){pin.style.left=(projected.x*.5+.5)*innerWidth+'px';pin.style.top=(-projected.y*.5+.5)*innerHeight+'px';}}
    uiTime+=dt;if(uiTime>.14){uiTime=0;nearStation=stations.find(station=>Math.hypot(driver.state.x-station.stopX,driver.state.z-station.stopZ)<4.6)||null;$('#arrival').hidden=!nearStation||Boolean(driver.state.travelId)||paused;if(nearStation)$('#arrival-label').textContent='到了，'+nearStation.name;for(const station of stations)pins.get(station.id).classList.toggle('near',nearStation?.id===station.id);$('#map-car').setAttribute('transform',`translate(${70+driver.state.x*1.85},${70+driver.state.z*1.85}) rotate(${-driver.state.yaw*180/Math.PI})`);$('#drive-status').textContent=driver.state.travelId?'自动前往中':Math.abs(driver.state.speed)>.3?'正在漫游':'停在后院';}
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
}
try{launch();}catch(error){console.error(error);$('#loading').classList.add('done');$('#loading').setAttribute('aria-hidden','true');$('#loading').inert=true;notify('场景没有完整打开，先从导览查看作品与照片。');panels.showDirectory();}
