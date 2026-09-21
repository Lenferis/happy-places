import { IMGS } from '@core/store.js';
import { TW, TH, mkCanvas, roundRect, pseudoRand, formatTime } from './utils.js';

// --- Константы виджета — вынес в config/paths.js нет смысла: они только тут.
export const VOICE_BLOCK_H   = 88;
export const VOICE_LABEL_H   = 40;
export const VOICE_LABEL_GAP = 10;
export const VOICE_DEFAULT_W = 300;

/* ============================================================
   МЕТРИКИ / BBOX
   ============================================================ */
export function voiceMetrics(v){
  const W        = v.size || VOICE_DEFAULT_W;
  const hasLabel = !!v.label;
  const totalH   = VOICE_BLOCK_H + (hasLabel ? VOICE_LABEL_GAP + VOICE_LABEL_H : 0);
  return { W, H: VOICE_BLOCK_H, totalH, hasLabel };
}

export function voiceBBoxCanvas(v){
  const { W, totalH } = voiceMetrics(v);
  const cx  = (v.at && v.at.x != null ? v.at.x : 0.5) * TW;
  const cy  = (v.at && v.at.y != null ? v.at.y : 0.5) * TH;
  const pad = 26;
  return { x: cx - W/2 - pad, y: cy - totalH/2 - pad, w: W + pad*2, h: totalH + pad*2, cx, cy };
}

export function voiceWaveGeometry(v){
  const { W, H, totalH } = voiceMetrics(v);
  const blockTop = -totalH / 2;
  const btnR     = 24;
  const btnCx    = -W/2 + 14 + btnR;
  const btnCy    = blockTop + H/2;
  const waveX    = btnCx + btnR + 12;
  const timeW    = 62;
  const waveW    = (W/2 - 12 - timeW) - waveX;
  return { W, H, totalH, blockTop, btnR, btnCx, btnCy, waveX, waveW, timeW };
}

export function voiceLocalFromCanvas(v, canvasPx, canvasPy){
  const cx  = (v.at && v.at.x != null ? v.at.x : 0.5) * TW;
  const cy  = (v.at && v.at.y != null ? v.at.y : 0.5) * TH;
  const dx  = canvasPx - cx;
  const dy  = canvasPy - cy;
  const rot = -(v.rot || 0) * Math.PI / 180;
  const lx  = dx * Math.cos(rot) - dy * Math.sin(rot);
  const ly  = dx * Math.sin(rot) + dy * Math.cos(rot);
  return { lx, ly };
}

export function voicePartAt(v, canvasPx, canvasPy){
  const { lx, ly } = voiceLocalFromCanvas(v, canvasPx, canvasPy);
  const g = voiceWaveGeometry(v);
  if(Math.hypot(lx - g.btnCx, ly - g.btnCy) <= g.btnR * 1.25) return { part:'play' };
  if(lx >= g.waveX - 4 && lx <= g.waveX + g.waveW + 4 && Math.abs(ly - g.btnCy) <= 22){
    const progress = Math.max(0, Math.min(1, (lx - g.waveX) / g.waveW));
    return { part:'wave', progress };
  }
  return { part:'tap' };
}

/* ============================================================
   РИСОВАНИЕ ВИДЖЕТА
   ============================================================ */
export function drawVoiceWidget(ctx, v){
  const { W, H, totalH, hasLabel } = voiceMetrics(v);
  const cx  = (v.at && v.at.x != null ? v.at.x : 0.5) * TW;
  const cy  = (v.at && v.at.y != null ? v.at.y : 0.5) * TH;
  const rot = (v.rot || 0) * Math.PI / 180;
  const alpha   = v.alpha != null ? v.alpha : 1;
  const playing = !!v._playing;
  const cur     = v._current  || 0;
  const dur     = v._duration || 0;
  const progress = dur > 0 ? Math.max(0, Math.min(1, cur/dur)) : 0;

  ctx.save();
  ctx.translate(cx, cy);
  if(rot) ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  const blockTop = -totalH / 2;

  ctx.save();
  ctx.shadowColor   = 'rgba(60,30,10,.28)';
  ctx.shadowBlur    = 16;
  ctx.shadowOffsetY = 5;
  roundRect(ctx, -W/2, blockTop, W, H, 14);
  const bgGrad = ctx.createLinearGradient(0, blockTop, 0, blockTop + H);
  bgGrad.addColorStop(0, 'rgba(255,252,243,.97)');
  bgGrad.addColorStop(1, 'rgba(247,235,214,.97)');
  ctx.fillStyle = bgGrad; ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(138,90,43,.42)'; ctx.lineWidth = 1.5;
  roundRect(ctx, -W/2 + .75, blockTop + .75, W - 1.5, H - 1.5, 14);
  ctx.stroke();

  const btnR  = 24;
  const btnCx = -W/2 + 14 + btnR;
  const btnCy = blockTop + H/2;
  ctx.save();
  ctx.shadowColor   = 'rgba(90,55,20,.4)';
  ctx.shadowBlur    = 8;
  ctx.shadowOffsetY = 2;
  const bg = ctx.createRadialGradient(btnCx - 6, btnCy - 8, 2, btnCx, btnCy, btnR);
  bg.addColorStop(0, '#c99b48'); bg.addColorStop(1, '#8a6020');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(btnCx, btnCy, btnR, 0, 7); ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(255,250,236,.98)';
  if(playing){
    ctx.fillRect(btnCx - 7,   btnCy - 9, 4.5, 18);
    ctx.fillRect(btnCx + 2.5, btnCy - 9, 4.5, 18);
  } else {
    ctx.beginPath();
    ctx.moveTo(btnCx - 6, btnCy - 11);
    ctx.lineTo(btnCx + 10, btnCy);
    ctx.lineTo(btnCx - 6, btnCy + 11);
    ctx.closePath(); ctx.fill();
  }

  const waveX  = btnCx + btnR + 12;
  const timeW  = 62;
  const waveW  = (W/2 - 12 - timeW) - waveX;
  const waveCy = btnCy;
  const bars   = 34;
  const step   = waveW / bars;
  const barW   = Math.max(1.8, step * 0.55);
  const playedN = Math.round(progress * bars);
  const seed    = v._seed || 0;
  for(let i = 0; i < bars; i++){
    const h    = 8 + pseudoRand(i + seed) * 26;
    const x    = waveX + i * step;
    const yTop = waveCy - h/2;
    const on   = i < playedN;
    ctx.fillStyle = on ? 'rgba(138,90,43,.92)' : 'rgba(138,90,43,.22)';
    roundRect(ctx, x, yTop, barW, h, barW/2);
    ctx.fill();
  }

  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(70,45,22,.92)'; ctx.font = '600 20px Cormorant, serif';
  ctx.fillText(formatTime(cur), W/2 - 12, btnCy - 9);
  ctx.fillStyle = 'rgba(70,45,22,.5)';  ctx.font = '500 15px Cormorant, serif';
  ctx.fillText('/ ' + formatTime(dur), W/2 - 12, btnCy + 12);

  if(hasLabel){
    ctx.fillStyle = 'rgba(107,74,53,.88)';
    ctx.font = 'italic 500 24px Cormorant, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v.label, 0, blockTop + H + VOICE_LABEL_GAP + VOICE_LABEL_H/2);
  }
  ctx.restore();
}

/* ============================================================
   ПРИВЯЗКА К СТРАНИЦЕ / ПЕРЕРИСОВКА
   ============================================================ */
export function attachVoices(canvas, ctx, voices){
  if(!voices || !voices.length) return;
  for(const v of voices){
    const bb = voiceBBoxCanvas(v);
    const x0 = Math.max(0, Math.floor(bb.x));
    const y0 = Math.max(0, Math.floor(bb.y));
    const x1 = Math.min(TW, Math.ceil(bb.x + bb.w));
    const y1 = Math.min(TH, Math.ceil(bb.y + bb.h));
    const bw = x1 - x0, bh = y1 - y0;
    if(bw <= 0 || bh <= 0) continue;
    const base = mkCanvas(bw, bh);
    base.getContext('2d').drawImage(canvas, x0, y0, bw, bh, 0, 0, bw, bh);
    v._base    = base; v._baseX = x0; v._baseY = y0;
    v._canvas  = canvas; v._ctx = ctx;
    v._current = v._current || 0; v._playing = false;
    if(!v._audio && v.file) v._audio = IMGS.voices[v.file] || null;
    v._duration = v._duration || (v._audio ? (v._audio.duration || 0) : 0);
    if(!v._seed) v._seed = Math.floor(Math.random() * 10000);
  }
  for(const v of voices) drawVoiceWidget(ctx, v);
}

export function redrawVoice(v){
  if(!v._ctx || !v._base) return;
  v._ctx.drawImage(v._base, v._baseX, v._baseY);
  drawVoiceWidget(v._ctx, v);
}

/* ============================================================
   HIT-ТЕСТЫ
   ============================================================ */
export function hitTestVoicesOnSheet(sh, side, canvasPx, canvasPy){
  if(!sh) return null;
  const list = side === 'front' ? sh.voicesFront : sh.voicesBack;
  if(!list || !list.length) return null;
  for(const v of list){
    const { W, totalH } = voiceMetrics(v);
    const cx  = (v.at && v.at.x != null ? v.at.x : 0.5) * TW;
    const cy  = (v.at && v.at.y != null ? v.at.y : 0.5) * TH;
    const dx  = canvasPx - cx;
    const dy  = canvasPy - cy;
    const rot = -(v.rot || 0) * Math.PI / 180;
    const lx  = dx * Math.cos(rot) - dy * Math.sin(rot);
    const ly  = dx * Math.sin(rot) + dy * Math.cos(rot);
    if(Math.abs(lx) <= W/2 && Math.abs(ly) <= totalH/2) return v;
  }
  return null;
}

export function hitTestVoiceWidget(sh, side, canvasPx, canvasPy){
  if(!sh) return null;
  const list = side === 'front' ? sh.voicesFront : sh.voicesBack;
  if(!list || !list.length) return null;
  for(const v of list){
    const { W, totalH } = voiceMetrics(v);
    const { lx, ly } = voiceLocalFromCanvas(v, canvasPx, canvasPy);
    if(Math.abs(lx) <= W/2 && Math.abs(ly) <= totalH/2){
      return Object.assign({ v, sheet: sh, side }, voicePartAt(v, canvasPx, canvasPy));
    }
  }
  return null;
}

export function seekVoice(v, progress){
  if(!v || !v._audio) return;
  const dur = v._audio.duration;
  if(!dur || !isFinite(dur)) return;
  const t = Math.max(0, Math.min(dur, progress * dur));
  try{ v._audio.currentTime = t; }catch(e){}
  v._current  = t;
  v._duration = dur;
  redrawVoice(v);
  if(v._tex) v._tex.needsUpdate = true;
}