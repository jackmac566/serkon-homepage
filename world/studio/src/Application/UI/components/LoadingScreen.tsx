import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getStudioHost, getStudioSnapshot, subscribeStudio } from '../../../serkon-host';

// Upstream BIOS composition, with actual resource counts and a real START gate.
const LoadingScreen: React.FC = () => {
    const [state, setState] = useState(getStudioSnapshot);
    const startButton = useRef<HTMLButtonElement>(null);
    const start = useCallback(() => { getStudioHost()?.start(); }, []);
    useEffect(() => subscribeStudio(setState), []);
    useEffect(() => {
        if(state.canStart && !state.started) startButton.current?.focus({ preventScroll: true });
    }, [state.canStart, state.started]);
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if(!state.canStart || state.started || event.defaultPrevented || event.isComposing) return;
            if(event.key === 'Tab') {
                event.preventDefault();
                startButton.current?.focus({ preventScroll: true });
            } else if(event.key === 'Enter' && !(event.target instanceof Element && event.target.closest('button,a,input,textarea'))) {
                event.preventDefault(); start();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [state.canStart, state.started, start]);
    if(state.started) return null;
    const loaded = state.loaded + state.worldLoaded;
    const total = state.total + state.worldTotal;
    const percent = total ? Math.min(100, Math.round(loaded / total * 100)) : 0;
    const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const cursor = <span className="blinking-cursor" aria-hidden="true" />;
    const desktopFallback = () => {
        if(window.parent !== window) getStudioHost()?.desktopRequest();
        else location.href = new URL('../desktop/', document.baseURI).href;
    };
    return (
        <div id="studio-boot" style={styles.overlay} role="region" aria-label="Serkon 场景启动界面">
            <style>{`
                #studio-boot p { margin:0; font:inherit; color:inherit; line-height:1.5; }
                #studio-boot button { font:inherit; color:#fff; cursor:pointer; }
                #studio-boot button:focus-visible { outline:2px solid white; outline-offset:6px; }
                #studio-boot .bios-start-button:hover { background:#fff; color:#000; }
                #studio-boot .bios-start-button:hover p { color:#000; }
                @media(max-width:600px) { #studio-boot { font-size:12px!important; } }
                @media(max-height:500px) { #studio-boot { font-size:11px!important; } }
                @media(prefers-reduced-motion:reduce) { #studio-boot .blinking-cursor { animation:none!important; } }
            `}</style>
            {!state.canStart && !state.error && (
                <div style={styles.overlayText}>
                    <header style={styles.header} className="loading-screen-header">
                        <div><p><b>Serkon,</b></p><p><b>Personal Space.</b></p></div>
                        <div style={styles.headerInfo}><p>Version: 03.00</p><p>SERKON SCENE BIOS / 2026</p></div>
                    </header>
                    <main style={styles.body} className="loading-screen-body" aria-label="实际资源加载记录">
                        <p>SERKON PERSONAL COMPUTER</p><p>Portfolio Showcase / Interactive Scenes</p>
                        <div style={styles.spacer}/><p>LOADING RESOURCES ({loaded}/{total || '-'})</p><div style={styles.spacer}/>
                        <div role="log" aria-label="最近八个已加载资源" style={styles.resourcesLoadingList}>
                            {state.recent.map((resource,index) => <p key={`${resource}-${index}`}>Loaded {resource} ... OK</p>)}
                        </div>
                        <div style={styles.spacer}/>
                        <p role="status">{state.roomReady ? (state.worldReady ? 'Room and exploration world ready.' : state.worldFailed ? 'Room ready. Exploration world unavailable.' : 'Room ready. Loading exploration world...') : `Room resources: ${state.loaded}/${state.total || '-'}`}</p>
                        <div style={styles.spacer}/><span role="progressbar" aria-label="真实资源进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${loaded} / ${total}`}/>{cursor}
                    </main>
                    <footer style={styles.footer} className="loading-screen-footer"><p>Press <b>ENTER</b> to start when ready</p><p>{date}</p></footer>
                </div>
            )}
            {state.canStart && !state.error && (
                <div style={styles.popupContainer}>
                    <section style={styles.startPopup} role="dialog" aria-modal="true" aria-labelledby="studio-start-title" aria-describedby="studio-start-hint">
                        <p id="studio-start-title">Serkon Portfolio Showcase</p><div style={styles.spacer}/>
                        <div style={styles.startLine}><p id="studio-start-hint">Click start to begin&nbsp;</p>{cursor}</div>
                        {state.worldFailed && <p style={styles.fallbackNote}>探索世界暂不可用，房间和个人桌面仍可进入。</p>}
                        <div style={styles.startRow}><button ref={startButton} type="button" className="bios-start-button" style={styles.startButton} onClick={start}><p>START</p></button></div>
                    </section>
                </div>
            )}
            {state.error && (
                <div style={styles.popupContainer}><section style={styles.startPopup} role="alert">
                    <p>SCENE RESOURCE ERROR</p><div style={styles.spacer}/><p>{state.error}</p>
                    <div style={styles.startRow}><button type="button" style={styles.startButton} onClick={desktopFallback}>直接进入桌面</button></div>
                </section></div>
            )}
        </div>
    );
};

const styles: StyleSheetCSS = {
    overlay: {backgroundColor:'#000',color:'#fff',position:'absolute',inset:0,width:'100%',height:'100%',display:'flex',boxSizing:'border-box',fontFamily:'monospace',fontSize:16,letterSpacing:0.8,overflow:'auto'},
    overlayText: {width:'100%',minHeight:'100%',display:'flex',flexDirection:'column'},
    header: {width:'100%',boxSizing:'border-box',display:'flex',flexWrap:'wrap',gap:16},
    headerInfo: {marginLeft:'clamp(0px, 4vw, 64px)'},
    body: {flex:1,display:'flex',flexDirection:'column',boxSizing:'border-box'},
    resourcesLoadingList: {display:'flex',flexDirection:'column',paddingLeft:'clamp(0px, 2vw, 32px)',overflowWrap:'anywhere'},
    spacer: {height:'1em',flexShrink:0},
    footer: {width:'100%',boxSizing:'border-box',display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:16},
    popupContainer: {width:'100%',minHeight:'100%',display:'flex',justifyContent:'center',alignItems:'center',padding:16,boxSizing:'border-box'},
    startPopup: {backgroundColor:'#000',padding:'clamp(18px, 3vw, 24px)',border:'7px solid #fff',display:'flex',flexDirection:'column',justifyContent:'center',width:'max-content',maxWidth:500,boxSizing:'border-box'},
    startLine: {display:'flex',alignItems:'flex-end'},
    startRow: {display:'flex',justifyContent:'center',alignItems:'center',marginTop:16},
    startButton: {appearance:'none',background:'#000',color:'#fff',border:'4px solid #fff',borderRadius:0,padding:8,minWidth:100,minHeight:44,font:'inherit'},
    fallbackNote: {marginTop:12,maxWidth:320},
};

export default LoadingScreen;
