import {
  TW, TH, mkCanvas, rnd
} from './utils.js';
import { COL, PHOTO_SCALE, PHOTO_ASPECT, SINGLE_PHOTO } from '@config/theme.js';
import {
  COVER_FRONT, COVER_INNER, COVER_BACK, TITLE_PAGE,
  CLOSING_DEFAULTS
} from '@config/album.js';
import { IMGS } from '@core/store.js';

import { paintBg }         from './backgrounds.js';
import { paintFrameBox }   from './frames.js';
import { paintTextBlock }  from './text.js';
import { drawPhoto }       from './photos.js';
import { itemDeco }        from './decor-primitives.js';
import {
  normalizeDeco, drawDecoItem, applyDeco
} from './decor-items.js';
import { attachVoices }    from './voices.js';

export function pageNum(g, n){
  g.font = 'italic 500 26px Cormorant, serif';
  g.fillStyle = 'rgba(58,36,24,.42)';
  g.textAlign = 'center';
  g.fillText('· ' + n + ' ·', TW/2, TH - 40);
}

export function paintComposedPage(cfg, W, H, voiceSink){
  const c = mkCanvas(W, H);
  const g = c.getContext('2d');
  paintBg(g, W, H, cfg.bg || { type: 'paper' });
  if(cfg.frame) paintFrameBox(g, W, H, cfg.frame);
  const voices = [];
  if(cfg.deco){
    const bbox = { cx: W/2, cy: H/2, pw: W, ph: H, xL: 0, yT: 0, xR: W, yB: H };
    const list = Array.isArray(cfg.deco) ? cfg.deco : [cfg.deco];
    list.forEach(d => {
      const nd = normalizeDeco(d);
      if(!nd) return;
      if(nd.type === 'voice'){ voices.push(nd); return; }
      drawDecoItem(g, nd, [bbox]);
    });
  }
  if(cfg.text){
    const list = Array.isArray(cfg.text) ? cfg.text : [cfg.text];
    list.forEach(t => paintTextBlock(g, W, H, t));
  }
  attachVoices(c, g, voices);
  if(voiceSink) voices.forEach(v => voiceSink.push(v));
  return c;
}

export function paintCoverFront(){ return paintComposedPage(COVER_FRONT, TW, TH); }
export function paintCoverInner(){ return paintComposedPage(COVER_INNER, TW, TH); }
export function paintCoverBack(){  return paintComposedPage(COVER_BACK,  TW, TH); }

export function paintTitlePage(page, num, voiceSink){
  const c = paintComposedPage(TITLE_PAGE, TW, TH, voiceSink);
  const g = c.getContext('2d');
  pageNum(g, 1);
  return c;
}

function normalizeClosingText(t){
  if(t == null) return null;
  if(typeof t === 'string'){
    return [{
      content: t,
      at: CLOSING_DEFAULTS.text[0].at,
      anchor: CLOSING_DEFAULTS.text[0].anchor,
      font: CLOSING_DEFAULTS.text[0].font,
      fill: CLOSING_DEFAULTS.text[0].fill,
      lineHeight: CLOSING_DEFAULTS.text[0].lineHeight
    }];
  }
  if(Array.isArray(t)) return t;
  return [t];
}
export function buildClosingConfig(page){
  const src = page || {};
  return {
    bg:    src.bg    != null ? src.bg    : CLOSING_DEFAULTS.bg,
    frame: src.frame != null ? src.frame : CLOSING_DEFAULTS.frame,
    deco:  src.deco  != null ? src.deco  : CLOSING_DEFAULTS.deco,
    text:  normalizeClosingText(src.text != null ? src.text : CLOSING_DEFAULTS.text)
  };
}
export function paintClosingPage(page, num, voiceSink){
  const cfg = buildClosingConfig(page);
  const c = paintComposedPage(cfg, TW, TH, voiceSink);
  const showNum = !(page && page.pageNum === false);
  if(showNum){ pageNum(c.getContext('2d'), num); }
  return c;
}

export const LAYOUTS = {
  single: [{ fx:0.50, fy:0.42, fw:0.60, rot:-2.0 }],
  duo:    [{ fx:0.29, fy:0.40, fw:0.40, rot:-4.0 }, { fx:0.71, fy:0.52, fw:0.40, rot: 4.5 }],
  trio:   [{ fx:0.27, fy:0.29, fw:0.32, rot:-5.0 }, { fx:0.73, fy:0.28, fw:0.30, rot: 4.0 }, { fx:0.50, fy:0.61, fw:0.36, rot:-2.0 }],
  grid:   [{ fx:0.28, fy:0.29, fw:0.30, rot:-3.0 }, { fx:0.72, fy:0.28, fw:0.30, rot: 3.5 }, { fx:0.29, fy:0.63, fw:0.30, rot: 2.5 }, { fx:0.71, fy:0.64, fw:0.30, rot:-2.0 }]
};
export function pickLayout(n, requested){
  if(n <= 1) return 'single';
  if(requested && LAYOUTS[requested] && LAYOUTS[requested].length >= n) return requested;
  if(n === 2) return 'duo';
  if(n === 3) return 'trio';
  return 'grid';
}
export function pagePhotos(page){ return Array.isArray(page.photos) ? page.photos : []; }

export function resolvePhotoLayout(p, slot, isSingle){
  const slotScale  = (slot && slot.scale) || 1;
  const photoScale = p.scale || 1;
  const aspect     = p.aspect || (slot && slot.aspect) || PHOTO_ASPECT;
  const scaleMul   = PHOTO_SCALE * slotScale * photoScale;
  let pw;
  if(p.w) pw = p.w * scaleMul;
  else if(isSingle) pw = SINGLE_PHOTO.width * scaleMul;
  else pw = slot.fw * TW * scaleMul;
  pw = Math.max(20, Math.round(pw));
  const ph = Math.round(pw / aspect);
  let cx, cy;
  if(isSingle){
    const sp = SINGLE_PHOTO;
    cx = Math.round((p.cx != null ? p.cx : sp.cx) * TW + rnd(-sp.jitter, sp.jitter));
    cy = Math.round((p.cy != null ? p.cy : sp.cy) * TH + rnd(-sp.jitter, sp.jitter));
  } else {
    cx = Math.round((slot.fx + (p.dx || 0)) * TW);
    cy = Math.round((slot.fy + (p.dy || 0)) * TH);
  }
  let tilt;
  if(p.tilt != null) tilt = p.tilt;
  else if(isSingle) tilt = rnd(-SINGLE_PHOTO.tilt, SINGLE_PHOTO.tilt);
  else tilt = slot.rot || 0;
  return { pw, ph, cx, cy, aspect, tilt };
}

export function paintPhotoPage(page, num, videoSink, popupSink, voiceSink){
  const c = mkCanvas(TW, TH), g = c.getContext('2d');
  paintBg(g, TW, TH, page.bg || { type: 'paper' });
  const photos = pagePhotos(page);
  if(!photos.length){ pageNum(g, num); return c; }
  const layoutName = pickLayout(photos.length, page.layout);
  const isSingle   = layoutName === 'single';
  const slots      = LAYOUTS[layoutName] || LAYOUTS.single;

  const layouts = [];
  photos.forEach((p, i) => {
    if(i >= slots.length) return;
    const slot = slots[i];
    const dims = resolvePhotoLayout(p, slot, isSingle);
    const frameType = isSingle ? (p.frame || 'polaroid') : p.frame;
    layouts.push({
      p, dims, frameType,
      bbox: {
        cx: dims.cx, cy: dims.cy, pw: dims.pw, ph: dims.ph,
        xL: dims.cx - dims.pw/2, xR: dims.cx + dims.pw/2,
        yT: dims.cy - dims.ph/2, yB: dims.cy + dims.ph/2
      }
    });
  });
  const bboxes = layouts.map(L => L.bbox);
  const backDeco = [], frontDeco = [], voicesAll = [];

  const collect = (arr, ownerIdx) => {
    if(!arr) return;
    const list = Array.isArray(arr) ? arr : [arr];
    list.forEach(d => {
      const nd = normalizeDeco(d);
      if(!nd) return;
      if(nd.photo == null && ownerIdx != null) nd.photo = ownerIdx;
      if(nd.type === 'voice'){ voicesAll.push(nd); return; }
      (nd.behind ? backDeco : frontDeco).push(nd);
    });
  };
  layouts.forEach((L, i) => collect(L.p.deco, i));
  collect(page.deco, null);

  backDeco.forEach(d => drawDecoItem(g, d, bboxes));

  layouts.forEach((L) => {
    const img = IMGS.photos[L.p.img];
    const caption = isSingle ? '' : L.p.caption;
    if(img) drawPhoto(g, img, L.dims.cx, L.dims.cy, L.dims.pw, L.dims.tilt, caption, L.frameType, L.dims.aspect);
    if(img && img.tagName === 'VIDEO' && videoSink){
      const mp = getMediaDrawParamsLocal(L.dims.pw, L.dims.ph, L.frameType, !!caption);
      videoSink.push({ el: img, cx: L.dims.cx, cy: L.dims.cy, tilt: L.dims.tilt, mp });
    }
  });

  frontDeco.forEach(d => drawDecoItem(g, d, bboxes));
  if(page.text){
    const list = Array.isArray(page.text) ? page.text : [page.text];
    list.forEach(t => paintTextBlock(g, TW, TH, t));
  }

  if(isSingle){
    const p = photos[0];
    g.textAlign = 'center'; g.fillStyle = COL.ink;
    g.font = '500 54px Caveat, cursive';
    const cap = p.caption || '';
    const words = cap.split(' ');
    let line = '', ly = 1065;
    words.forEach(w => {
      if((line + ' ' + w).trim().length > 24){ g.fillText(line.trim(), TW/2, ly); ly += 52; line = w; }
      else line += ' ' + w;
    });
    g.fillText(line.trim(), TW/2, ly);
    if(p.date){ g.fillStyle = COL.sepia; g.font = '500 38px Caveat, cursive'; g.fillText(p.date, TW/2, ly + 56); }
  } else {
    g.textAlign = 'center'; let by = TH - 100;
    if(page.caption){ g.fillStyle = COL.ink;   g.font = '500 46px Caveat, cursive'; g.fillText(page.caption, TW/2, by); by += 44; }
    if(page.date){    g.fillStyle = COL.sepia; g.font = '500 34px Caveat, cursive'; g.fillText(page.date,    TW/2, by); }
  }
  pageNum(g, num);
  attachVoices(c, g, voicesAll);
  if(voiceSink) voicesAll.forEach(v => voiceSink.push(v));
  return c;
}

function getMediaDrawParamsLocal(pw, ph, frameType, hasCaption){
  const type = frameType || (hasCaption ? 'polaroid' : 'polaroid-plain');
  if(type === 'none' || type === 'rounded' || type === 'border' || type === 'polaroid-plain')
    return { x: -pw/2, y: -ph/2, w: pw, h: ph, type };
  const pad  = pw * 0.038;
  const padB = pw * 0.155;
  return { x: -pw/2, y: -ph/2 + (pad - padB) / 2, w: pw, h: ph, type };
}

export function paintPopupPage(page, num, videoSink, popupSink, voiceSink){
  const c = mkCanvas(TW, TH), g = c.getContext('2d');
  paintBg(g, TW, TH, page.bg || { type: 'paper' });
  const voicesAll = [];
  if(page.deco){
    const bbox = { cx: TW/2, cy: TH/2, pw: TW, ph: TH, xL: 0, yT: 0, xR: TW, yB: TH };
    const list = Array.isArray(page.deco) ? page.deco : [page.deco];
    list.forEach(d => {
      const nd = normalizeDeco(d);
      if(!nd) return;
      if(nd.type === 'voice'){ voicesAll.push(nd); return; }
      drawDecoItem(g, nd, [bbox]);
    });
  }
  if(page.text){
    const list = Array.isArray(page.text) ? page.text : [page.text];
    list.forEach(t => paintTextBlock(g, TW, TH, t));
  }
  pageNum(g, num);
  if(popupSink && Array.isArray(page.elements)){
    for(const el of page.elements){ if(el && el.at) popupSink.push(el); }
  }
  attachVoices(c, g, voicesAll);
  if(voiceSink) voicesAll.forEach(v => voiceSink.push(v));
  return c;
}

export function paintPopupBackground(page){
  const c = mkCanvas(TW, TH), g = c.getContext('2d');
  paintBg(g, TW, TH, page.bg || { type: 'paper' });
  return c;
}

export function drawStackPhoto(g, p){
  const img = IMGS.photos[p.img]; if(!img) return;
  const cx  = (p.x != null ? p.x : 0.5) * TW;
  const cy  = (p.y != null ? p.y : 0.4) * TH;
  const pw  = (p.w != null ? p.w : 0.55) * TW;
  const rot = p.rot || 0;
  const aspect = p.aspect || PHOTO_ASPECT;
  const frame  = p.frame  || 'polaroid';
  drawPhoto(g, img, cx, cy, pw, rot, '', frame, aspect);
  if(p.deco) applyDeco(g, p.deco, cx, cy, pw, pw / aspect);
}
export function drawStackPhotoAt(g, p, x, y, rot, w){
  const img = IMGS.photos[p.img]; if(!img) return;
  const cx = x * TW, cy = y * TH, pw = w * TW;
  const aspect = p.aspect || PHOTO_ASPECT;
  const frame  = p.frame  || 'polaroid';
  drawPhoto(g, img, cx, cy, pw, rot, '', frame, aspect);
  if(p.deco) applyDeco(g, p.deco, cx, cy, pw, pw / aspect);
}
export function paintStackPage(page, num, videoSink, popupSink, voiceSink){
  const c = mkCanvas(TW, TH), g = c.getContext('2d');
  paintBg(g, TW, TH, page.bg || { type: 'paper' });
  const voicesAll = [];
  if(page.deco){
    const bbox = { cx: TW/2, cy: TH/2, pw: TW, ph: TH, xL: 0, yT: 0, xR: TW, yB: TH };
    const list = Array.isArray(page.deco) ? page.deco : [page.deco];
    list.forEach(d => {
      const nd = normalizeDeco(d);
      if(!nd) return;
      if(nd.type === 'voice'){ voicesAll.push(nd); return; }
      drawDecoItem(g, nd, [bbox]);
    });
  }
  const photos = page.photos || [];
  const animated = page.animated !== false;
  if(animated){ if(photos.length) drawStackPhoto(g, photos[0]); }
  else { photos.forEach(p => drawStackPhoto(g, p)); }
  if(page.text){
    const list = Array.isArray(page.text) ? page.text : [page.text];
    list.forEach(t => paintTextBlock(g, TW, TH, t));
  }
  pageNum(g, num);
  attachVoices(c, g, voicesAll);
  if(voiceSink) voicesAll.forEach(v => voiceSink.push(v));
  return c;
}

export function paintLetterPage(page, num, videoSink, popupSink, voiceSink){
  const c = mkCanvas(TW, TH), g = c.getContext('2d');
  paintBg(g, TW, TH, page.bg || { type: 'paper' });
  const voicesAll = [];
  if(page.deco){
    const bbox = { cx: TW/2, cy: TH/2, pw: TW, ph: TH, xL: 0, yT: 0, xR: TW, yB: TH };
    const list = Array.isArray(page.deco) ? page.deco : [page.deco];
    list.forEach(d => {
      const nd = normalizeDeco(d);
      if(!nd) return;
      if(nd.type === 'voice'){ voicesAll.push(nd); return; }
      drawDecoItem(g, nd, [bbox]);
    });
  }
  const mx = TW*.13, mw = TW*.74;
  let y = 216; g.textAlign = 'left';
  if(page.heading){
    g.fillStyle = COL.sepia; g.font = '600 58px Caveat, cursive';
    g.fillText(page.heading, mx, y); y += 100;
  } else { y = 190; }
  g.strokeStyle = 'rgba(138,90,43,.13)'; g.lineWidth = 1;
  page.body.forEach(par => {
    g.font = '500 33px Cormorant, serif';
    const words = par.split(' ');
    let line = ''; const lines = [];
    words.forEach(w => {
      if(g.measureText(line + ' ' + w).width > mw){ lines.push(line.trim()); line = w; }
      else line += ' ' + w;
    });
    lines.push(line.trim());
    lines.forEach(L => {
      g.beginPath(); g.moveTo(mx, y+14); g.lineTo(mx+mw, y+14); g.stroke();
      g.fillStyle = COL.ink; g.fillText(L, mx, y); y += 50;
    });
    y += 30;
  });
  if(page.sign){
    g.textAlign = 'right'; g.fillStyle = COL.inkSoft;
    g.font = '600 52px Caveat, cursive';
    g.fillText(page.sign, mx+mw, y+36);
    if(IMGS.items.rose) itemDeco(g, 'rose', mx+mw-260, y+82, 135, 2.4, .9);
  }
  if(page.text){
    const list = Array.isArray(page.text) ? page.text : [page.text];
    list.forEach(t => paintTextBlock(g, TW, TH, t));
  }
  pageNum(g, num);
  attachVoices(c, g, voicesAll);
  if(voiceSink) voicesAll.forEach(v => voiceSink.push(v));
  return c;
}

export const PAGE_PAINTERS = {
  title:   (p, n, vs, ps, vс) => paintTitlePage(p, n, vс),
  photo:   (p, n, vs, ps, vс) => paintPhotoPage(p, n, vs, ps, vс),
  letter:  (p, n, vs, ps, vс) => paintLetterPage(p, n, vs, ps, vс),
  closing: (p, n, vs, ps, vс) => paintClosingPage(p, n, vс),
  stack:   (p, n, vs, ps, vс) => paintStackPage(p, n, vs, ps, vс),
  popup:   (p, n, vs, ps, vс) => paintPopupPage(p, n, vs, ps, vс)
};