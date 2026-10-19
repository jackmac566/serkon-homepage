/* Static, pre-optimised public assets; this standalone bundle has no Next image proxy. */
/* eslint-disable @next/next/no-img-element */
const React = require('react');
const { projects } = require('../data/serkon-experience');

type Language = 'zh' | 'en';
type Project = { id: string; number: string; category: string; tone: string; title: Record<Language,string>; short: Record<Language,string>; status: Record<Language,string> };
type Props = { lang: Language; onOpen: (index:number)=>void };

export function ProjectArtwork({project}:{project:Project}) {
  const tone=project.tone;
  return <span className={'sx-art sx-art-'+tone} aria-hidden="true">
    <span className="sx-art-label">{project.number} / {tone==='color'?'VISUAL SYSTEM':tone==='genesis'?'ORIGINAL SOUND':tone==='yearbook'?'LOCAL DATA TOOL':tone==='london'?'AI FILM EXPERIMENT':tone==='writing'?'AI WRITING WORKSPACE':'PERSONAL WEBSITE'}</span>
    {tone==='color'&&<><span className="sx-swatches">{Array.from({length:9},(_,index)=><i key={index}/>)}</span><span className="sx-art-title">Colour,<br/><em>in order.</em></span><span className="sx-art-note">126 COLOURS. ONE VISUAL LANGUAGE.</span></>}
    {tone==='genesis'&&<><span className="sx-record"><i/><b>✦</b></span><span className="sx-art-title">Genesis<span>创世纪</span></span></>}
    {tone==='yearbook'&&<><span className="sx-rings">{Array.from({length:7},(_,index)=><i key={index}/>)}</span><span className="sx-cn-title">每段对话，<br/>都有年轮。</span><span className="sx-art-note">STORIES, NOT JUST DATA.</span></>}
    {tone==='london'&&<><span className="sx-film-frame"><img src="/archive/london-ai-workspace.webp" width="1260" height="717" alt="" loading="lazy"/></span><span className="sx-art-title">London,<br/><em>in frames.</em></span><span className="sx-art-note">AN EXPERIMENT IN VISUAL STORYTELLING</span></>}
    {tone==='writing'&&<><span className="sx-writing-mark">Aa<span>→</span></span><span className="sx-art-note">IDEAS, FINDING THEIR WORDS.</span></>}
    {tone==='website'&&<><span className="sx-web-window"><span>● ● ●</span><b>Serkon.</b><i/><i/></span><span className="sx-art-note">ALWAYS IN PROGRESS.</span></>}
    <span className="sx-art-arrow">↗</span>
  </span>;
}

export default function WorkGallery({lang,onOpen}:Props) {
  const [filter,setFilter]=React.useState('all');
  const [list,setList]=React.useState(false);
  const t=(zh:string,en:string)=>lang==='zh'?zh:en;
  const openProject=(index:number)=>{
    try { window.sessionStorage.setItem('serkon_visited_works_v1','true'); } catch { /* Opening a project also works when storage is blocked. */ }
    onOpen(index);
  };
  const visible=(projects as Project[]).filter(project=>filter==='all'||(filter==='creative'?['music','film'].includes(project.category):!['music','film'].includes(project.category)));
  return <section className="sx-work" id="works" aria-labelledby="sx-work-title">
    <div className="sx-section-top"><span>03 — SELECTED WORK</span><span>{t('从好奇出发，以作品回答。','CURIOSITY, ANSWERED IN WORK.')}</span></div>
    <div className="sx-heading"><h2 id="sx-work-title">{t('做过的，','Made.')}<br/>{t('还在做的。','Still making.')}</h2><div><p>{t('不同媒介，同一种好奇心。','Different media. The same curiosity.')}<br/>{t('打开一件作品，看看想法如何成为现实。','Open a project to see how an idea took shape.')}</p><div className="sx-view-toggle" role="group" aria-label={t('作品展示方式','Work display mode')}><button type="button" onClick={()=>setList(false)} aria-pressed={!list}>{t('▦ 展览','▦ Gallery')}</button><button type="button" onClick={()=>setList(true)} aria-pressed={list}>{t('☷ 目录','☷ Index')}</button></div></div></div>
    <div className="sx-controls"><div className="sx-filters" role="group" aria-label={t('筛选作品','Filter projects')}>{[['all','全部','All'],['product','产品与代码','Product & code'],['creative','影像与声音','Image & sound']].map(([key,zh,en])=><button type="button" key={key} onClick={()=>setFilter(key)} aria-pressed={filter===key}>{t(zh,en)}</button>)}</div><span className="sx-count" aria-live="polite">{String(visible.length).padStart(2,'0')} / {String(projects.length).padStart(2,'0')} {t('个项目','PROJECTS')}</span></div>
    <div className={'sx-grid'+(list?' sx-list':'')}>{visible.map(project=><button type="button" key={project.id} className="sx-card" onClick={()=>openProject(projects.findIndex((item:Project)=>item.id===project.id))} aria-label={t('查看作品：','View project: ')+project.title[lang]}>
      <ProjectArtwork project={project}/>
      <span className="sx-meta"><span><small>{project.category==='music'?'MUSIC / PERSONAL EXPRESSION':project.category==='film'?'AI / VISUAL STORYTELLING':project.tone==='yearbook'?'CODE / PERSONAL HISTORY':project.tone==='writing'?'PRODUCT / AI WRITING':'PRODUCT / VISUAL DESIGN'}</small><strong>{project.title[lang]}</strong><em>{project.short[lang]}</em></span><span className="sx-status">{project.status[lang]}</span></span>
    </button>)}</div>
    <p className="sx-cover-note">{t('封面为作品的视觉索引，并非项目截图。详情中可查看原始素材与真实项目。','Covers are editorial artwork, not project screenshots. Open a project for original materials and real work.')}</p>
  </section>;
}
