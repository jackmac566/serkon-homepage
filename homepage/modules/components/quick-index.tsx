const React = require('react');
const { projects } = require('../data/serkon-experience');
import type { MouseEvent, ChangeEvent } from 'react';

type Language='zh'|'en';
type Destination={title:Record<Language,string>;terms:string;href?:string;projectIndex?:number};
type Props={lang:Language;onOpenProject:(index:number)=>void;onClose:()=>void;preview?:boolean};
const text=(zh:string,en:string)=>({zh,en});

export default function QuickIndex({lang,onOpenProject,onClose,preview=false}:Props){
  const [search,setSearch]=React.useState('');
  const ref=React.useRef(null);
  const input=React.useRef(null);
  const t=(zh:string,en:string)=>lang==='zh'?zh:en;
  const destinations:Destination[]=[
    {title:text('作品索引','Work index'),terms:'作品 work projects 项目',href:'#works'},
    {title:text('个人档案','Personal file'),terms:'关于 about 侯世康 serkon',href:'#about'},
    {title:text('生活影像','Life in frames'),terms:'相册 照片 photo gallery 影像 life',href:'/life'},
    {title:text('公共大厅','Public lobby'),terms:'留言 聊天 chat lobby 大厅',href:'/lobby'},
    {title:text('互动档案','Playable archive'),terms:'游戏 play cards 扑克',href:'/play'},
    {title:text('思想漫游','Motion archive'),terms:'cosmos 思想 动态 motion',href:'/cosmos'},
    {title:text('站长随笔','Notes'),terms:'笔记 文章 随笔 notes writing',href:'/notes'},
    {title:text('版本记录','Release ledger'),terms:'版本 更新 history updates',href:'/updates'},
    {title:text('保持联系','Get in touch'),terms:'联系 contact 邮箱 email',href:'#contact'},
    ...projects.map((project:{title:Record<Language,string>;label:string},index:number)=>({title:project.title,terms:Object.values(project.title).join(' ')+' '+project.label,projectIndex:index})),
  ];
  React.useEffect(()=>{
    const before=document.activeElement;
    const dialog=ref.current as HTMLDialogElement|null;
    dialog?.showModal();(input.current as HTMLInputElement|null)?.focus();
    return()=>{dialog?.close();if(before instanceof HTMLElement&&before.isConnected)before.focus({preventScroll:true});};
  },[]);
  const matches=destinations.filter(item=>(item.title.zh+' '+item.title.en+' '+item.terms).toLowerCase().includes(search.trim().toLowerCase()));
  return <dialog ref={ref} className="sx-index-dialog" aria-labelledby="sx-index-title" onCancel={onClose} onClick={(event:MouseEvent<HTMLDialogElement>)=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();}}}>
    <div className="sx-index-head"><h2 id="sx-index-title">{t('去哪里逛逛？','WHERE TO NEXT?')}</h2><button type="button" onClick={onClose} aria-label={t('关闭全站索引','Close site index')}>×</button></div>
    <label className="sx-index-search"><span aria-hidden="true">⌕</span><input ref={input} type="search" value={search} onChange={(event:ChangeEvent<HTMLInputElement>)=>setSearch(event.target.value)} placeholder={t('搜索作品、相册、随笔…','Search work, photos, notes…')} aria-label={t('搜索网站入口','Search site destinations')} autoComplete="off"/></label>
    <div className="sx-index-results">{matches.map((item,index)=>item.projectIndex!==undefined?<button type="button" key={index} onClick={()=>{onClose();onOpenProject(item.projectIndex!);}}><span>{item.title[lang]}</span><span aria-hidden="true">↗</span></button>:<a key={index} href={preview&&item.href?.startsWith('/')?'https://serkon-homepage-cn.pages.dev'+item.href:item.href} onClick={onClose}><span>{item.title[lang]}</span><span aria-hidden="true">{item.href?.startsWith('#')?'↓':'↗'}</span></a>)}
    {!matches.length&&<p className="sx-empty-results">{t('没有找到，试试“音乐”或“相册”。','No results. Try “music” or “photos”.')}</p>}</div>
    <p className="sx-index-hint">{t('输入关键词筛选 · Tab 选择 · Enter 打开 · Esc 关闭','TYPE TO FILTER · TAB TO SELECT · ENTER TO OPEN · ESC TO CLOSE')}</p>
  </dialog>;
}
