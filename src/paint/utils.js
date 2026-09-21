import { FOIL_STOPS } from '@config/theme.js';

export const TW = 1024, TH = 1312;

export function mkCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function rnd(a, b){ return a + Math.random() * (b - a); }

export function roundRect(g, x, y, w, h, r){
  g.beginPath();
  g.moveTo(x+r, y); g.lineTo(x+w-r, y);
  g.quadraticCurveTo(x+w, y,     x+w,   y+r);   g.lineTo(x+w, y+h-r);
  g.quadraticCurveTo(x+w, y+h,   x+w-r, y+h);   g.lineTo(x+r, y+h);
  g.quadraticCurveTo(x,   y+h,   x,     y+h-r); g.lineTo(x,   y+r);
  g.quadraticCurveTo(x,   y,     x+r,   y);     g.closePath();
}

export function pseudoRand(i){
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function formatTime(s){
  s = Math.max(0, s || 0);
  const m  = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return m + ':' + (ss < 10 ? '0' : '') + ss;
}

// ---------- Шрифты ----------
export const FONT_DEFAULT = { family: 'Cormorant, serif', size: 40, weight: 500, style: 'normal' };

export function buildFontString(block){
  block = block || {};
  if(typeof block.font === 'string' && block.font.trim()) return block.font;
  let family = FONT_DEFAULT.family, size = FONT_DEFAULT.size,
      weight = FONT_DEFAULT.weight, style = FONT_DEFAULT.style;
  if(block.font && typeof block.font === 'object'){
    if(block.font.family != null) family = block.font.family;
    if(block.font.size   != null) size   = block.font.size;
    if(block.font.weight != null) weight = block.font.weight;
    if(block.font.style  != null) style  = block.font.style;
  }
  if(block.family != null) family = block.family;
  if(block.size   != null) size   = block.size;
  if(block.weight != null) weight = block.weight;
  if(block.italic) style  = 'italic';
  if(block.bold)   weight = 'bold';
  return `${style} ${weight} ${size}px ${family}`;
}
export function parseFontSize(fontStr){
  const m = String(fontStr).match(/(\d+(?:\.\d+)?)px/);
  return m ? parseFloat(m[1]) : 40;
}

export function goldVersion(src, stops, shade){
  const w = src.naturalWidth  || src.width  || 1;
  const h = src.naturalHeight || src.height || 1;
  const c = mkCanvas(w, h);
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0, w, h);
  g.globalCompositeOperation = 'source-in';
  const grad = g.createLinearGradient(0, 0, w, h);
  (stops || FOIL_STOPS).forEach(s => grad.addColorStop(s[0], s[1]));
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  if(shade !== false){
    const gs = mkCanvas(w, h), gg = gs.getContext('2d');
    gg.drawImage(src, 0, 0, w, h);
    gg.globalCompositeOperation = 'saturation';
    gg.fillStyle = '#808080'; gg.fillRect(0, 0, w, h);
    gg.globalCompositeOperation = 'destination-in';
    gg.drawImage(src, 0, 0, w, h);
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = .8; g.drawImage(gs, 0, 0); g.globalAlpha = 1;
    g.globalCompositeOperation = 'screen';
    g.globalAlpha = .45; g.drawImage(gs, 0, 0);
    g.globalAlpha = 1;
  }
  return c;
}