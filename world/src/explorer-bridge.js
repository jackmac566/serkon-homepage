// Same-origin boundary around the upstream Three/TSL and Rapier runtime.
export function createExplorerBridge({onProgress=()=>{},onReady=()=>{},onError=()=>{},onLocation=()=>{},onExit=()=>{},onDirectory=()=>{}}={}) {
  const frame=document.createElement('iframe');frame.id='explorer-frame';frame.title='Serkon 的完整 3D 探索世界';frame.allow='autoplay; fullscreen; gamepad';frame.tabIndex=-1;frame.inert=true;frame.setAttribute('aria-hidden','true');
  let ready=false,failed=false,lastLocation=null;
  const send=(type,payload={})=>frame.contentWindow?.postMessage({source:'serkon-host',type,...payload},location.origin);
  const receive=event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.source!=='serkon-explorer')return;
    const data=event.data;
    if(data.type==='progress')onProgress(data);
    if(data.type==='ready'){ready=true;failed=false;clearTimeout(deadline);onReady(data);}
    if(data.type==='error'){if(!ready||data.code==='initialization'){failed=true;clearTimeout(deadline);onError(data);}else onError({...data,nonfatal:true});}
    if(data.type==='location'){lastLocation=data;onLocation(data);}
    if(data.type==='exit')onExit();
    if(data.type==='directory')onDirectory();
  };
  window.addEventListener('message',receive);
  frame.src=new URL(import.meta.env.DEV?'./explorer/dist/index.html?embed=1':'./explorer/index.html?embed=1',document.baseURI).href;
  frame.addEventListener('error',()=>{failed=true;onError({message:'场景资源未能加载，请刷新重试。'});});
  document.body.append(frame);
  const deadline=setTimeout(()=>{if(!ready&&!failed){failed=true;onError({message:'场景仍未就绪，可先进入桌面浏览。'});}},120000);
  return {frame,send,get ready(){return ready;},get failed(){return failed;},get location(){return lastLocation;},
    enter(){frame.inert=false;frame.removeAttribute('aria-hidden');send('enter');frame.contentWindow?.focus();},
    pause(){frame.inert=true;frame.setAttribute('aria-hidden','true');send('pause');},
    resume(){frame.inert=false;frame.removeAttribute('aria-hidden');send('resume');queueMicrotask(()=>frame.contentWindow?.focus());},
    respawn(name){send('respawn',{name});frame.contentWindow?.focus();},
    dispose(){clearTimeout(deadline);window.removeEventListener('message',receive);send('pause');frame.remove();},
  };
}
