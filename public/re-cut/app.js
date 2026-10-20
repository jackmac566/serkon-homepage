/* A participatory, static-frame edit made entirely from the site's existing public material. */
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const SOURCE='../archive/london-ai-workspace.webp';
const SOURCE_SIZE={width:1800,height:1105};
const frames=[
  {id:'guard',name:'卫兵与宫殿',tag:'人物 / 近景',crop:{x:149,y:262,w:503,h:280},description:'先遇见一个人，再知道自己在哪。素材里是 AI 生成的英国卫兵画面。',note:'人先出现，地点晚一点揭晓。'},
  {id:'eye',name:'伦敦眼',tag:'城市 / 远景',crop:{x:677,y:262,w:503,h:280},description:'伦敦眼与河面。把视野一下打开，是另一种开场。',note:'先给观众一个完整的空间。'},
  {id:'clock',name:'大本钟',tag:'地标 / 远景',crop:{x:1204,y:262,w:502,h:280},description:'大本钟、议会大厦和河上的船。最直接的一句“到了伦敦”。',note:'地点先交代，后面再走近。'},
  {id:'food',name:'英式早餐',tag:'食物 / 特写',crop:{x:150,y:566,w:504,h:280},description:'炸鱼薯条、司康和早餐。也可以让一顿饭把故事带进来。',note:'不先看地标，从生活细节进入。'},
  {id:'camera',name:'相机与红巴士',tag:'人物 / 中景',crop:{x:678,y:566,w:422,h:280},description:'工作区里的 AI 人物镜头：相机、红色巴士和街道。这不是旅行实拍。',note:'人物、地点和一个正在发生的动作。'}
];
let current=1,selection=[],reviewIndex=0,toastTimer,opener,reviewTimer,reviewPlaying=false,sharedOpening=false;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
function cropInto(element,frame){
  const {x,y,w,h}=frame.crop;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);svg.setAttribute('preserveAspectRatio','xMidYMid slice');svg.setAttribute('aria-hidden','true');
  const img=document.createElementNS('http://www.w3.org/2000/svg','image');img.setAttribute('href',SOURCE);img.setAttribute('width',String(SOURCE_SIZE.width));img.setAttribute('height',String(SOURCE_SIZE.height));
  svg.append(img);element.replaceChildren(svg);
}
function say(text){clearTimeout(toastTimer);$('#announcement').textContent=text;$('#announcement').classList.add('visible');toastTimer=setTimeout(()=>$('#announcement').classList.remove('visible'),2800);}
function setCurrent(index,animate=true){
  const direction=index-current>=0?1:-1;
  current=(index+frames.length)%frames.length;const frame=frames[current];
  cropInto($('#main-image'),frame);$('#main-image').style.transform='translateX(0)';
  $('#frame-label').textContent=String(current+1).padStart(2,'0')+' / '+frame.name;
  $('#frame-tag').textContent=frame.tag;$('#frame-current').textContent=String(current+1).padStart(2,'0');
  $('#frame-description').textContent=frame.description;
  $$('.material').forEach((element,index)=>element.dataset.active=String(index===current));
  updateButtons();
  if(animate&&!reduceMotion.matches)$('#main-image').animate([{clipPath:direction>0?'inset(0 0 0 100%)':'inset(0 100% 0 0)',transform:`translateX(${direction*25}px)`},{clipPath:'inset(0 0 0 0)',transform:'translateX(0)'}],{duration:480,easing:'cubic-bezier(.2,.8,.2,1)'});
}
function updateButtons(){
  const chosen=selection.includes(frames[current].id);
  $('#add-current').setAttribute('aria-pressed',String(chosen));$('#add-current').innerHTML=chosen?'这张已经在开场里 <b>✓</b>':'把这张放进开场 <b>＋</b>';
  $$('[data-add]').forEach(button=>{const selected=selection.includes(button.dataset.add);button.setAttribute('aria-pressed',String(selected));button.textContent=selected?'✓':'＋';button.setAttribute('aria-label',(selected?'移出开场：':'加入开场：')+frames.find(frame=>frame.id===button.dataset.add).name);});
}
function choose(id){
  const index=selection.indexOf(id);
  if(index!==-1){selection.splice(index,1);renderSequence();say('已移出这一张。');return;}
  if(selection.length===3){say('三张已经齐了。先移出一张，或者拖着换顺序。');return;}
  selection.push(id);renderSequence();say('放进第 '+selection.length+' 个位置了。'+(selection.length===3?'现在可以看你的开场。':''));
}
function putFrame(id,index){
  if(selection.includes(id)){moveItem(selection.indexOf(id),Math.min(index,selection.length-1));return;}
  if(selection.length===3){say('先移出一张，给新镜头留个位置。');return;}
  selection.splice(Math.min(index,selection.length),0,id);renderSequence();say('镜头放好了。');
}
function renderMaterials(){
  const strip=$('#material-strip');
  frames.forEach((frame,index)=>{
    const article=document.createElement('article');article.className='material';article.dataset.active=String(index===current);
    const preview=document.createElement('button');preview.type='button';preview.className='material-preview';preview.setAttribute('aria-label','查看素材：'+frame.name);
    const crop=document.createElement('span');crop.className='crop';cropInto(crop,frame);preview.append(crop);
    let start=null,ghost=null,suppressClick=false;
    const clearDrag=()=>{ghost?.remove();ghost=null;start=null;article.classList.remove('dragging');$$('.sequence-slot').forEach(slot=>slot.classList.remove('drop-target'));};
    preview.addEventListener('pointerdown',event=>{if(event.button!==0||event.pointerType==='touch')return;start={x:event.clientX,y:event.clientY};preview.setPointerCapture(event.pointerId);});
    preview.addEventListener('pointermove',event=>{if(!start)return;if(!ghost&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>8){ghost=article.cloneNode(true);ghost.setAttribute('aria-hidden','true');ghost.style.cssText='position:fixed;width:180px;z-index:1000;pointer-events:none;transform:rotate(-4deg);opacity:.9;box-shadow:0 20px 40px #0006;';document.body.append(ghost);article.classList.add('dragging');suppressClick=true;}if(!ghost)return;ghost.style.left=event.clientX-90+'px';ghost.style.top=event.clientY-65+'px';const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.sequence-slot');$$('.sequence-slot').forEach(slot=>slot.classList.toggle('drop-target',slot===target));});
    preview.addEventListener('pointerup',event=>{if(ghost){const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.sequence-slot');if(target)putFrame(frame.id,Number(target.dataset.slot));}clearDrag();setTimeout(()=>{suppressClick=false;},0);});
    preview.addEventListener('pointercancel',clearDrag);
    preview.addEventListener('click',event=>{if(suppressClick){event.preventDefault();return;}setCurrent(index);});
    const info=document.createElement('div');info.className='material-info';
    const serial=document.createElement('span');serial.textContent=String(index+1).padStart(2,'0');
    const name=document.createElement('strong');name.textContent=frame.name;
    const add=document.createElement('button');add.type='button';add.className='material-add';add.dataset.add=frame.id;add.addEventListener('click',()=>choose(frame.id));
    info.append(serial,name,add);article.append(preview,info);strip.append(article);
  });
}
function moveItem(from,to){if(to<0||to>=selection.length||from===to)return;const [item]=selection.splice(from,1);selection.splice(to,0,item);renderSequence();say('已经换到第 '+(to+1)+' 个位置。');}
function renderSequence(){
  const track=$('#sequence-track'),focused=document.activeElement;
  const focusId=track.contains(focused)?focused.dataset.frame:null,focusAction=focused?.dataset?.action;
  const positions=new Map([...track.querySelectorAll('[data-frame-id]')].map(slot=>[slot.dataset.frameId,slot.getBoundingClientRect()]));
  track.replaceChildren();
  for(let index=0;index<3;index++){
    const frame=frames.find(item=>item.id===selection[index]);const slot=document.createElement('div');slot.className='sequence-slot'+(frame?' filled':'');slot.dataset.slot=String(index);
    if(!frame){const empty=document.createElement('div');empty.className='slot-empty';const number=document.createElement('span');number.textContent='0'+(index+1);const label=document.createElement('p');label.textContent=index===0?'第一眼看见什么？':index===1?'然后去哪里？':'最后留下什么？';empty.append(number,label);slot.append(empty);}
    else{
      slot.draggable=true;slot.dataset.frameId=frame.id;slot.setAttribute('aria-label','第 '+(index+1)+' 个镜头：'+frame.name);
      const image=document.createElement('div');image.className='crop';cropInto(image,frame);
      const number=document.createElement('span');number.className='slot-number';number.textContent='0'+(index+1);
      const caption=document.createElement('div');caption.className='slot-caption';const name=document.createElement('span');name.textContent=frame.name;const controls=document.createElement('div');controls.className='slot-controls';
      for(const [symbol,label,action,disabled] of [['←','向前移动',()=>moveItem(index,index-1),index===0],['→','向后移动',()=>moveItem(index,index+1),index===selection.length-1],['×','移出开场',()=>choose(frame.id),false]]){const button=document.createElement('button');button.type='button';button.textContent=symbol;button.dataset.frame=frame.id;button.dataset.action=symbol;button.disabled=disabled;button.setAttribute('aria-label',label+'：'+frame.name);button.addEventListener('click',action);controls.append(button);}
      caption.append(name,controls);slot.append(image,number,caption);
      slot.addEventListener('dragstart',event=>{event.dataTransfer.setData('text/plain',String(index));event.dataTransfer.effectAllowed='move';slot.classList.add('dragging');});
      slot.addEventListener('dragend',()=>{$$('.sequence-slot').forEach(item=>item.classList.remove('dragging','drop-target'));});
    }
    slot.addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='move';slot.classList.add('drop-target');});
    slot.addEventListener('dragleave',()=>slot.classList.remove('drop-target'));
    slot.addEventListener('drop',event=>{event.preventDefault();slot.classList.remove('drop-target');const payload=event.dataTransfer.getData('text/plain');if(payload.startsWith('frame:')){const id=payload.slice(6);if(!frames.some(frame=>frame.id===id))return;if(selection.includes(id)){moveItem(selection.indexOf(id),Math.min(index,selection.length-1));return;}if(selection.length===3){say('先移出一张，给新镜头留个位置。');return;}selection.splice(Math.min(index,selection.length),0,id);renderSequence();say('镜头放好了。');return;}if(!/^\d$/.test(payload))return;const from=Number(payload);if(from<selection.length)moveItem(from,Math.min(index,selection.length-1));});
    track.append(slot);
  }
  $('#watch').disabled=selection.length!==3;updateButtons();
  const comment=selection.length===3?(sharedOpening?'收到一个开场版本。可以直接看，也可以继续重排。 ':'')+openingComment():selection.length?'已经选了 '+selection.length+' 张。还可以再放 '+(3-selection.length)+' 张。':'还没决定？可以先从一张你最想看的开始。';
  $('#sequence-comment').textContent=comment;
  if(!reduceMotion.matches)track.querySelectorAll('[data-frame-id]').forEach(slot=>{const before=positions.get(slot.dataset.frameId),after=slot.getBoundingClientRect();slot.animate(before?[{transform:`translate(${before.left-after.left}px,${before.top-after.top}px)`},{transform:'translate(0,0)'}]:[{opacity:0,transform:'translateY(-26px) rotate(-4deg)'},{opacity:1,transform:'translateY(0) rotate(0)'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});});
  if(focusId){const same=[...track.querySelectorAll('button')].find(button=>button.dataset.frame===focusId&&button.dataset.action===focusAction&&!button.disabled);const fallback=[...track.querySelectorAll('button')].find(button=>button.dataset.frame===focusId&&!button.disabled)||track.querySelector('button:not(:disabled)')||$('#reset-sequence');(same||fallback).focus({preventScroll:true});}
}
function openingComment(){
  const first=selection[0],last=selection[2];
  const entry=first==='food'?'你从一顿饭进入这座城。':first==='guard'||first==='camera'?'你先遇见人，再看见城市。':'你先把地点交代清楚，再慢慢走近。';
  const ending=last==='camera'?'最后让镜头里的人露面。':last==='food'?'最后落在一个生活细节上。':last==='guard'?'最后停在一个人的表情上。':'最后把视野留给城市。';
  return entry+' '+ending;
}
function openDialog(id,trigger){opener=trigger||document.activeElement;const dialog=$('#'+id);dialog.showModal();dialog.querySelector('.close')?.focus();}
$$('[data-close]').forEach(button=>button.addEventListener('click',()=>$('#'+button.dataset.close).close()));
$$('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>{if(dialog.id==='review-dialog')stopReview();if(opener?.isConnected)opener.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
});
$('#source-button').addEventListener('click',event=>openDialog('source-dialog',event.currentTarget));
$('#about-button').addEventListener('click',event=>openDialog('about-dialog',event.currentTarget));
$$('[data-source]').forEach(button=>button.addEventListener('click',()=>{
  const workspace=button.dataset.source==='workspace';
  $$('[data-source]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  $('#source-image').src=workspace?SOURCE:'../archive/london-video-export.webp';
  $('#source-image').alt=workspace?'原站公开的伦敦 AI 素材工作区':'原站公开的导出设置：8K、120 帧和处理中任务';
  $('#source-image').width=workspace?1800:1268;$('#source-image').height=workspace?1105:1428;
  $('#source-caption').textContent=workspace?'五张静帧都来自这张 AI 影像工作区截图。可以放大看看它们原来排在哪里。':'截图记录了 8K、120 帧的导出设置，以及“39 个任务处理中”的状态。';
  $('#source-original').href=$('#source-image').src;
}));
$('#previous-frame').addEventListener('click',()=>setCurrent(current-1));$('#next-frame').addEventListener('click',()=>setCurrent(current+1));
$('#add-current').addEventListener('click',()=>choose(frames[current].id));
$('#reset-sequence').addEventListener('click',()=>{selection=[];renderSequence();say('空出来了，重新选。');});
let dragStart=null,dragMoved=false;
$('#main-frame').addEventListener('pointerdown',event=>{if(event.target.closest('button')||event.button!==0)return;dragStart={x:event.clientX,y:event.clientY,id:event.pointerId};dragMoved=false;$('#main-frame').setPointerCapture(event.pointerId);});
$('#main-frame').addEventListener('pointermove',event=>{if(!dragStart)return;const dx=event.clientX-dragStart.x,dy=event.clientY-dragStart.y;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>14){dragStart=null;$('#main-image').style.transform='';$('#main-frame').classList.remove('is-dragging');return;}if(Math.abs(dx)>7){dragMoved=true;$('#main-frame').classList.add('is-dragging');$('#main-image').style.transform='translateX('+Math.max(-65,Math.min(65,dx*.25))+'px) rotate('+dx*.003+'deg)';}});
function finishDrag(event){if(!dragStart)return;const dx=event.clientX-dragStart.x;if(dragMoved&&Math.abs(dx)>45)setCurrent(current+(dx<0?1:-1));else $('#main-image').style.transform='';dragStart=null;$('#main-frame').classList.remove('is-dragging');}
$('#main-frame').addEventListener('pointerup',finishDrag);$('#main-frame').addEventListener('pointercancel',()=>{dragStart=null;$('#main-frame').classList.remove('is-dragging');$('#main-image').style.transform='';});
function renderReview(){
  const frame=frames.find(item=>item.id===selection[reviewIndex]);if(!frame)return;
  const focusThumbnail=$('#review-thumbnails').contains(document.activeElement);
  $('#review-image').getAnimations().forEach(animation=>animation.cancel());
  cropInto($('#review-image'),frame);$('#review-number').textContent='0'+(reviewIndex+1)+' / 03';$('#review-caption').textContent=frame.name;$('#review-note').textContent=frame.note;
  const group=$('#review-thumbnails');group.replaceChildren();selection.forEach((id,index)=>{const item=frames.find(frame=>frame.id===id);const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','查看第 '+(index+1)+' 个镜头：'+item.name);button.setAttribute('aria-pressed',String(index===reviewIndex));const image=document.createElement('span');image.className='crop';cropInto(image,item);button.append(image);button.addEventListener('click',()=>{stopReview();reviewIndex=index;renderReview();});group.append(button);});
  if(focusThumbnail)group.children[reviewIndex]?.focus({preventScroll:true});
  if(reviewPlaying&&!reduceMotion.matches)$('#review-image').animate([{transform:'scale(1)'},{transform:'scale(1.045)'}],{duration:2800,fill:'forwards',easing:'linear'});
  $$('.play-progress>span').forEach((step,index)=>{step.classList.toggle('past',index<reviewIndex);step.classList.remove('current');if(index===reviewIndex){void step.offsetWidth;step.classList.add('current');}});
}
function stopReview(){clearTimeout(reviewTimer);reviewPlaying=false;$('#play-review').textContent='播放节奏预演 ▷';$('#review-dialog').classList.add('is-paused');$('#review-image').getAnimations().forEach(animation=>animation.pause());}
function startReview(){stopReview();reviewPlaying=true;$('#play-review').textContent='暂停 Ⅱ';$('#review-dialog').classList.remove('is-paused');$('#review-dialog').classList.add('playing');renderReview();function advance(){if(reviewIndex===2){stopReview();return;}reviewIndex++;renderReview();reviewTimer=setTimeout(advance,2800);}reviewTimer=setTimeout(advance,2800);}
function changeReview(direction){stopReview();reviewIndex=(reviewIndex+direction+selection.length)%selection.length;renderReview();}
$('#watch').addEventListener('click',event=>{if(selection.length!==3)return;reviewIndex=0;renderReview();$('#share-result').textContent='';openDialog('review-dialog',event.currentTarget);if(!reduceMotion.matches)startReview();});
$('#play-review').addEventListener('click',()=>{if(reviewPlaying)stopReview();else{if(reviewIndex===2)reviewIndex=0;startReview();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopReview();});
$('#review-previous').addEventListener('click',()=>changeReview(-1));$('#review-next').addEventListener('click',()=>changeReview(1));
$('#review-dialog').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();changeReview(event.key==='ArrowLeft'?-1:1);}else if(event.code==='Space'&&event.target===event.currentTarget){event.preventDefault();$('#play-review').click();}});
$('#share-sequence').addEventListener('click',async()=>{
  const url=new URL(location.href);url.hash='cut='+selection.join(',');
  try{await navigator.clipboard.writeText(url.href);$('#share-result').textContent='已复制。对方打开后，会看到你选的这三张和这个顺序。';}
  catch{$('#share-result').textContent='可以手动复制这个地址：'+url.href;}
});
function restoreSharedCut(){
  try{if(!location.hash.startsWith('#cut='))return;const ids=decodeURIComponent(location.hash.slice(5)).split(',');if(ids.length!==3||new Set(ids).size!==3||!ids.every(id=>frames.some(frame=>frame.id===id)))return;
    stopReview();if($('#review-dialog').open)$('#review-dialog').close();reviewIndex=0;
    selection=ids;sharedOpening=true;setCurrent(frames.findIndex(frame=>frame.id===ids[0]),false);renderSequence();
    $('.sequence-section').scrollIntoView({block:'start',behavior:'instant'});say('收到了这个开场。顺序已经为你放好。');
  }catch{/* Malformed shared fragments are ignored. */}
}
renderMaterials();setCurrent(1,false);renderSequence();restoreSharedCut();
addEventListener('hashchange',restoreSharedCut);
