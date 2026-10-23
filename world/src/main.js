import { createPanels } from './panels.js';
import { createExplorerBridge } from './explorer-bridge.js';
import './style.css';
const $=selector=>document.querySelector(selector);
let mode='studio',explorer,studioReady=false,worldReady=false,worldFailed=false,enteredWorld=false,noticeTimer;
let worldLoaded=0,worldTotal=0;
const stationDestinations={works:'projects',film:'lab',music:'landing',life:'social',about:'career'};

const studio=document.createElement('iframe');studio.id='studio-frame';studio.title='个人工作室与复古电脑';studio.allow='autoplay; fullscreen';
let desktopFallback=false,studioHello=false,studioDeadline;
const studioURL=new URL(import.meta.env.DEV?'./studio/dist/index.html?embed=1&waitWorld=1&desktop=../../desktop/':'./studio/index.html?embed=1&waitWorld=1',document.baseURI).href;
const desktopURL=new URL('./desktop/',document.baseURI).href;
const studioSend=(type,payload={})=>studio.contentWindow?.postMessage({source:'serkon-host',type,...payload},location.origin);
const studioFallback=$('#studio-fallback');
function showStudioFallback(message){
  clearTimeout(studioDeadline);
  $('#studio-fallback-message').textContent=message;
  studioFallback.hidden=false;
}
function loadStudio(useDesktop=false){
  clearTimeout(studioDeadline);
  studioReady=false;
  studioHello=false;
  desktopFallback=useDesktop;
  studioFallback.hidden=true;
  studio.src=useDesktop?desktopURL:studioURL;
  if(!useDesktop)studioDeadline=setTimeout(()=>{
    if(!studioReady)showStudioFallback(studioHello?'工作室资源仍未就绪，可以先进入桌面，或重试房间。':'工作室入口未响应，可以先进入桌面，或重试房间。');
  },90000);
}
studio.addEventListener('error',()=>showStudioFallback('工作室页面未能加载，可以先进入桌面，或重试房间。'));
$('#studio-desktop-fallback').addEventListener('click',()=>loadStudio(true));
$('#studio-retry').addEventListener('click',()=>loadStudio(false));
function syncWorld(){studioSend('worldReady',{ready:worldReady,failed:worldFailed,loaded:worldLoaded,total:worldTotal});}
const panels=createPanels({
  onClose:()=>{panels.pauseMusic();if(mode==='world')explorer.resume();else studioSend('resume');},
  onVisit:()=>pauseActive(),
  onTravel:id=>{panels.close();if(showWorld())explorer.respawn(stationDestinations[id]||'landing');},
});
explorer=createExplorerBridge({
  onProgress:data=>{worldLoaded=Number(data.loaded)||0;worldTotal=Number(data.total)||worldTotal;syncWorld();},
  onReady:data=>{worldReady=true;worldFailed=false;syncWorld();if(mode==='world')explorer.resume();},
  onError:data=>{if(data.nonfatal){notify(data.message||'当前操作暂不可用。');return;}worldFailed=true;syncWorld();if(mode==='world'){showStudio();notify(data.message||'探索场景暂不可用，请刷新重试。');}},
  onExit:()=>showStudio(),
  onDirectory:()=>{pauseActive();panels.showDirectory();},
});
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==studio.contentWindow||!['serkon-studio','serkon-desktop'].includes(event.data?.source))return;
  const data=event.data;
  if(data.source==='serkon-studio'&&!desktopFallback){
    if(data.type==='hello'){studioHello=true;syncWorld();}
    if(data.type==='ready'){studioReady=true;clearTimeout(studioDeadline);studioFallback.hidden=true;syncWorld();}
  }
  if(data.type==='launchWorld')showWorld();
  if(data.type==='desktopRequest'&&desktopFallback)loadStudio(false);else if(data.type==='desktopRequest'&&!studioReady)loadStudio(true);
  if(data.type==='error'){
    const message=data.message||'工作室加载失败，可使用直接浏览入口。';
    notify(message);
    if(data.source==='serkon-studio'&&!studioReady&&!desktopFallback&&!data.nonfatal)showStudioFallback(message);
  }
});
loadStudio();
document.body.append(studio);
function pauseActive(){if(mode==='world')explorer.pause();else studioSend('pause');}
function setMode(value){mode=value;document.body.dataset.mode=value;studio.inert=value!=='studio';studio.setAttribute('aria-hidden',String(value!=='studio'));}
function showStudio(){panels.pauseMusic();explorer.pause();setMode('studio');studioSend('resume');studio.contentWindow?.focus();}
function showWorld(){if(!worldReady){notify('完整探索场景尚未就绪，请稍后重试。');return false;}panels.pauseMusic();studioSend('pause');setMode('world');if(!enteredWorld){enteredWorld=true;explorer.enter();}else explorer.resume();return true;}
function notify(message){clearTimeout(noticeTimer);$('#world-notice').textContent=message;$('#world-notice').classList.add('visible');noticeTimer=setTimeout(()=>$('#world-notice').classList.remove('visible'),5000);}
$('.skip-world').addEventListener('click',event=>{event.preventDefault();pauseActive();panels.showDirectory();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){explorer.pause();studioSend('pause');panels.pauseMusic();}else if(!panels.isOpen()){if(mode==='world')explorer.resume();else studioSend('resume');}});
setMode('studio');
