import { IMGS } from '@core/store.js';
import { TW, TH, mkCanvas, goldVersion } from './utils.js';
import { paintTextBlock } from './text.js';
import {
  tapeStrip, photoCorner, stampDeco, heartDeco, clipDeco,
  starDeco, sparkleDeco, underlineDeco, lineDeco
} from './decor-primitives.js';

/* ============================================================
   TINT / GOLD
   ============================================================ */
const _tintCache = new Map();
let   _decoSrcSeq = 0;

function _srcKey(src){
  if(!src._decoKey) src._decoKey = 'd' + (++_decoSrcSeq);
  return src._decoKey;
}

export function tintImage(src, mode, color){
  const key = _srcKey(src) + '|' + (mode || 'multiply') + '|' + (color || '');
  const hit = _tintCache.get(key);
  if(hit) return hit;
  const iw = src.naturalWidth  || src.width  || 1;
  const ih = src.naturalHeight || src.height || 1;
  let result;
  if(mode === 'foil'){             result = goldVersion(src); }
  else if(mode === 'gold-shadow'){ result = goldVersion(src, [[0, '#33180a'], [1, '#221008']]); }
  else if(mode === 'replace'){
    result = mkCanvas(iw, ih);
    const g = result.getContext('2d');
    g.drawImage(src, 0, 0, iw, ih);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color || '#000'; g.fillRect(0, 0, iw, ih);
  } else {
    result = mkCanvas(iw, ih);
    const g = result.getContext('2d');
    g.drawImage(src, 0, 0, iw, ih);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = color || '#000'; g.fillRect(0, 0, iw, ih);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(src, 0, 0, iw, ih);
  }
  _tintCache.set(key, result);
  return result;
}

export function drawDecorItem(g, src, x, y, size, rotRad, alpha, opts){
  opts = opts || {};
  const iw = src.naturalWidth  || src.width  || 1;
  const ih = src.naturalHeight || src.height || 1;
  const scale = size / Math.max(iw, ih);
  const w = iw * scale, h = ih * scale;
  g.save();
  g.translate(x, y);
  if(rotRad) g.rotate(rotRad);
  if(opts.flip || opts.flipY) g.scale(opts.flip ? -1 : 1, opts.flipY ? -1 : 1);
  g.globalAlpha = alpha;
  if(opts.blend) g.globalCompositeOperation = opts.blend;
  if(opts.shadow !== false){
    g.shadowColor     = opts.shadowColor    || 'rgba(90,55,20,.3)';
    g.shadowBlur      = opts.shadowBlur     != null ? opts.shadowBlur     : 10;
    g.shadowOffsetY   = opts.shadowOffsetY  != null ? opts.shadowOffsetY  : 5;
  }
  let img = src;
  if(opts.tintMode === 'foil')         img = tintImage(src, 'foil');
  else if(opts.tintMode === 'replace') img = tintImage(src, 'replace', opts.tint);
  else if(opts.tint)                   img = tintImage(src, 'multiply', opts.tint);

  if(opts.tintMode === 'foil' && opts.goldShadow){
    const dark = tintImage(src, 'gold-shadow');
    const sdx  = opts.goldShadowDx != null ? opts.goldShadowDx : 6;
    const sdy  = opts.goldShadowDy != null ? opts.goldShadowDy : 6;
    const sa   = opts.goldShadowAlpha != null ? opts.goldShadowAlpha : 0.55;
    const prev = g.globalAlpha;
    g.shadowColor = 'transparent'; g.shadowBlur = 0;
    g.globalAlpha = prev * sa;
    g.drawImage(dark, -w/2 + sdx, -h/2 + sdy, w, h);
    g.globalAlpha = prev;
  }
  g.drawImage(img, -w/2, -h/2, w, h);
  g.restore();
}

/* ============================================================
   ДИСПЕТЧЕР ПО ТИПУ
   ============================================================ */
const ANCHORS = {
  tl:{x:'xL', y:'yT'}, t:{x:'cx', y:'yT'}, tr:{x:'xR', y:'yT'},
  l: {x:'xL', y:'cy'}, c:{x:'cx', y:'cy'}, r: {x:'xR', y:'cy'},
  bl:{x:'xL', y:'yB'}, b:{x:'cx', y:'yB'}, br:{x:'xR', y:'yB'},
  nw:{x:'xL', y:'yT'}, n:{x:'cx', y:'yT'}, ne:{x:'xR', y:'yT'},
  w: {x:'xL', y:'cy'}, e:{x:'xR', y:'cy'},
  sw:{x:'xL', y:'yB'}, s:{x:'cx', y:'yB'}, se:{x:'xR', y:'yB'}
};
const DECO_DEFAULTS = {
  tape:     { anchor:'t',  dx:0,   dy:-14 },
  corners:  { anchor:'c',  dx:0,   dy:0   },
  heart:    { anchor:'br', dx:26,  dy:34  },
  clip:     { anchor:'t',  dx:0,   dy:-26 },
  stamp:    { anchor:'tr', dx:-4,  dy:-6  },
  star:     { anchor:'tr', dx:-20, dy:20  },
  sparkle:  { anchor:'tr', dx:-30, dy:30  },
  underline:{ anchor:'b',  dx:0,   dy:30  },
  line:     { anchor:'c',  dx:0,   dy:0   },
  ditem:    { anchor:'c',  dx:0,   dy:0   },
  text:     { anchor:'c',  dx:0,   dy:0   },
  voice:    { anchor:'c',  dx:0,   dy:0   }
};

export function normalizeDeco(d){
  if(d == null) return null;
  if(typeof d === 'string'){
    if(d === 'tape')   return { type:'tape' };
    if(d === 'tape2')  return { type:'tape', variant:'gold' };
    if(d === 'corners')return { type:'corners' };
    if(d === 'heart')  return { type:'heart' };
    if(d === 'clip')   return { type:'clip' };
    if(d === 'stamp')  return { type:'stamp', lines:['щастя', '2024'] };
    if(d === 'stamp2') return { type:'stamp', lines:['море', '2024'] };
    return null;
  }
  return Object.assign({}, d);
}

function resolveAnchor(anchor, bbox){
  const a = ANCHORS[anchor] || ANCHORS.c;
  return { x: bbox[a.x], y: bbox[a.y] };
}
function resolveDecoPosition(d, bboxes){
  if(d.at){
    return {
      x: (d.at.x != null ? d.at.x : 0.5) * TW,
      y: (d.at.y != null ? d.at.y : 0.5) * TH
    };
  }
  const idx = d.photo != null ? d.photo : 0;
  const bbox = bboxes[idx];
  if(!bbox) return { x: TW/2, y: TH/2 };
  let anchor = d.anchor, dx = d.dx, dy = d.dy;
  if(anchor == null && dx == null && dy == null){
    const def = DECO_DEFAULTS[d.type] || { anchor:'c', dx:0, dy:0 };
    anchor = def.anchor; dx = def.dx; dy = def.dy;
  }
  const pos = resolveAnchor(anchor, bbox);
  return { x: pos.x + (dx || 0), y: pos.y + (dy || 0) };
}

export function drawDecoItem(g, d, bboxes){
  const pos    = resolveDecoPosition(d, bboxes);
  const px     = pos.x, py = pos.y;
  const rotRad = (d.rot || 0) * Math.PI / 180;
  const alpha  = d.alpha != null ? d.alpha : 0.92;
  const size   = d.size  != null ? d.size  : null;

  if(d.type === 'text'){ paintTextBlock(g, TW, TH, d, { x:px, y:py }, true); return; }

  if(d.type === 'ditem'){
    let src = null;
    if(d.src) src = IMGS.items['src:' + d.src];
    else if(d.key) src = IMGS.items[d.key];
    if(!src) return;
    const sz = size != null ? size
             : (src._defaultSize != null ? src._defaultSize : (d.defaultSize || 180));
    drawDecorItem(g, src, px, py, sz, rotRad, alpha, d);
    return;
  }

  if(d.type === 'line'){
    lineDeco(g, px, py, size != null ? size : 160, d.rot || 0, alpha, d.color, d.width);
    return;
  }

  if(d.type === 'tape'){
    const explicitPos = d.at != null || d.anchor != null;
    if(!explicitPos){
      const idx  = d.photo != null ? d.photo : 0;
      const bbox = bboxes[idx];
      if(!bbox) return;
      const sz = size != null ? size : 110;
      const k  = Math.max(0.55, bbox.pw / 620);
      const S  = v => v * k;
      tapeStrip(g, bbox.xL + S(26), bbox.yT - S(2), sz, -0.13);
      tapeStrip(g, bbox.xR - S(26), bbox.yT - S(2), sz,  0.15, 'rose');
      return;
    }
    const sz = size != null ? size : 110;
    tapeStrip(g, px, py, sz, rotRad, d.variant);
    return;
  }

  if(d.type === 'corners'){
    const idx  = d.photo != null ? d.photo : 0;
    const bbox = bboxes[idx];
    if(!bbox) return;
    const corners = d.corners || ['tl', 'tr', 'bl', 'br'];
    const inset   = d.inset   != null ? d.inset : -2;
    const xL = bbox.xL - inset, xR = bbox.xR + inset;
    const yT = bbox.yT - inset, yB = bbox.yB + inset;
    if(corners.includes('tl')) photoCorner(g, xL, yT, 0);
    if(corners.includes('tr')) photoCorner(g, xR, yT, Math.PI);
    if(corners.includes('bl')) photoCorner(g, xL, yB, -Math.PI/2);
    if(corners.includes('br')) photoCorner(g, xR, yB,  Math.PI/2);
    return;
  }

  if(d.type === 'heart'){ heartDeco(g, px, py, size != null ? size : 44, d.rot || 0, d.color); return; }
  if(d.type === 'clip'){  clipDeco(g, px, py, rotRad); return; }

  if(d.type === 'stamp'){
    const lines = d.lines || ['щастя', '2024'];
    const sz    = size != null ? size : 104;
    const k     = sz / 104;
    g.save();
    g.translate(px, py); g.rotate(rotRad);
    g.globalAlpha = alpha; g.scale(k, k);
    stampDeco(g, 0, 0, lines[0], lines[1], 0);
    g.restore();
    return;
  }

  if(d.type === 'star'){      starDeco(g, px, py, size != null ? size : 46, d.rot || 0, alpha, d.color); return; }
  if(d.type === 'sparkle'){   sparkleDeco(g, px, py, size != null ? size : 34, d.rot || 0, alpha, d.color); return; }
  if(d.type === 'underline'){ underlineDeco(g, px, py, size != null ? size : 160, d.rot || 0, alpha, d.color); return; }
}

export function applyDeco(g, deco, cx, cy, pw, ph){
  if(!deco) return;
  const arr  = Array.isArray(deco) ? deco : [deco];
  const bbox = {
    cx, cy, pw, ph,
    xL: cx - pw/2, xR: cx + pw/2,
    yT: cy - ph/2, yB: cy + ph/2
  };
  arr.forEach(d => {
    const nd = normalizeDeco(d);
    if(!nd) return;
    drawDecoItem(g, nd, [bbox]);
  });
}

// Экспорт для debug-модуля и для pages.js (там используются)
export { ANCHORS, DECO_DEFAULTS };