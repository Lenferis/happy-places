import { sheets, state } from '@core/store.js';
import { mediaSize } from '@loaders/media.js';

/* ============================================================
   Поддержка requestVideoFrameCallback
   ============================================================ */
export const HAS_RVFC = typeof HTMLVideoElement !== 'undefined'
  && 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

/* ============================================================
   Отрисовка одного кадра видео в 2D-контекст с учётом mp-параметров
   ============================================================ */
export function drawVideoFrame(ctx, v, scale){
  const el = v.el;
  if(!el || el.readyState < 2) return;
  const msz = mediaSize(el);
  const vw = msz.w, vh = msz.h;
  if(!vw || !vh) return;
  const mp = v.mp;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(v.cx, v.cy);
  if(v.tilt) ctx.rotate(v.tilt * Math.PI / 180);
  ctx.beginPath();
  ctx.rect(mp.x, mp.y, mp.w, mp.h);
  ctx.clip();
  const s = Math.max(mp.w / vw, mp.h / vh);
  const dx = mp.x + (mp.w - vw * s) / 2;
  const dy = mp.y + (mp.h - vh * s) / 2;
  try{ ctx.drawImage(el, dx, dy, vw * s, vh * s); }catch(e){}
  ctx.restore();
}

/* ============================================================
   Рендер живой стороны листа
   ============================================================ */
export function paintSide(sh, side){
  const live = side === 'front' ? sh.liveFront : sh.liveBack;
  if(!live) return;
  const vids = sh.videos.filter(v => v.side === side);
  if(!vids.length) return;
  live.ctx.clearRect(0, 0, live.c.width, live.c.height);
  let any = false;
  for(const v of vids){
    if(v.el && v.el.readyState >= 2){ drawVideoFrame(live.ctx, v, live.scale); any = true; }
  }
  if(any) live.t.needsUpdate = true;
}

/* ============================================================
   RVFC-циклы на каждый видимый лист
   ============================================================ */
export function kickVideoRaf(sh, side){
  if(!HAS_RVFC) return;
  const vids = sh.videos.filter(v => v.side === side);
  if(!vids.length) return;
  const primary = vids[0];
  if(primary._rvfcId != null) return;
  const tick = () => {
    primary._rvfcId = null;
    if(state.mode !== 'reading') return;
    if(primary.el.paused) return;
    paintSide(sh, side);
    primary._rvfcId = primary.el.requestVideoFrameCallback(tick);
  };
  primary._rvfcId = primary.el.requestVideoFrameCallback(tick);
}
export function stopVideoRaf(sh, side){
  if(!HAS_RVFC) return;
  const vids = sh.videos.filter(v => v.side === side);
  if(!vids.length) return;
  const primary = vids[0];
  if(primary._rvfcId != null && 'cancelVideoFrameCallback' in primary.el){
    try{ primary.el.cancelVideoFrameCallback(primary._rvfcId); }catch(e){}
    primary._rvfcId = null;
  }
}

/* ============================================================
   Синхронизация play/pause всех видео с положением в книге
   ============================================================ */
export function updateVideoPlayback(){
  const reading = state.mode === 'reading';
  const curIdx  = state.cur;
  const prevIdx = state.cur - 1;
  for(let i = 0; i < sheets.length; i++){
    const sh = sheets[i];
    if(!sh.videos.length) continue;
    const frontVisible = reading && (i === curIdx);
    const backVisible  = reading && (i === prevIdx);
    for(const v of sh.videos){
      const shouldPlay = v.side === 'front' ? frontVisible : backVisible;
      if(shouldPlay){ if(v.el.paused){ const p = v.el.play(); if(p && p.catch) p.catch(() => {}); } }
      else { if(!v.el.paused) v.el.pause(); }
    }
    if(HAS_RVFC){
      if(frontVisible) kickVideoRaf(sh, 'front'); else stopVideoRaf(sh, 'front');
      if(backVisible)  kickVideoRaf(sh, 'back');  else stopVideoRaf(sh, 'back');
    }
  }
}

/* ============================================================
   Fallback для браузеров без RVFC — 30 fps
   ============================================================ */
let lastVideoTick = 0;
const VIDEO_INTERVAL = 1000 / 30;

export function updateLiveVideosFallback(now){
  if(now - lastVideoTick < VIDEO_INTERVAL) return;
  lastVideoTick = now;
  const curIdx = state.cur, prevIdx = state.cur - 1;
  for(let i = 0; i < sheets.length; i++){
    if(i !== curIdx && i !== prevIdx) continue;
    const sh = sheets[i];
    if(!sh.videos.length) continue;
    if(i === curIdx) paintSide(sh, 'front');
    if(i === prevIdx) paintSide(sh, 'back');
  }
}