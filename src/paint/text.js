import { FOIL_STOPS } from '@config/theme.js';
import { buildFontString, parseFontSize } from './utils.js';

export function paintTextBlock(g, W, H, block, overridePos, vAlignMode){
  if(!block || block.content == null) return;
  let px, py;
  if(overridePos){ px = overridePos.x; py = overridePos.y; }
  else {
    const at = block.at || { x: 0.5, y: 0.5 };
    px = at.x * W; py = at.y * H;
  }
  const align  = block.align || 'center';
  const font   = buildFontString(block);
  const fs     = parseFontSize(font);
  const lh     = block.lineHeight != null ? block.lineHeight : fs * 1.15;
  const lines  = String(block.content).split('\n');
  const rot    = (block.rot || 0) * Math.PI / 180;
  const alpha  = block.alpha != null ? block.alpha : 1;
  const anchor = vAlignMode ? (block.vAlign || 'c') : (block.anchor || 'c');

  g.save();
  g.translate(px, py);
  if(rot) g.rotate(rot);
  g.globalAlpha  = alpha;
  g.font         = font;
  g.textAlign    = align;
  g.textBaseline = 'middle';

  let fillStyle;
  if(block.style === 'foil'){
    const grad = g.createLinearGradient(-W * 0.35, -fs, W * 0.35, fs);
    FOIL_STOPS.forEach(s => grad.addColorStop(s[0], s[1]));
    fillStyle = grad;
  } else {
    fillStyle = block.fill || '#000';
  }

  let baseY;
  if(anchor === 't' || anchor === 'tl' || anchor === 'tr') baseY = 0;
  else if(anchor === 'b' || anchor === 'bl' || anchor === 'br') baseY = -lh * (lines.length - 1);
  else baseY = -lh * (lines.length - 1) / 2;

  const sh = block.shadow;
  lines.forEach((line, i) => {
    const y = baseY + i * lh;
    if(sh){
      g.shadowColor   = sh.color || 'rgba(0,0,0,.5)';
      g.shadowBlur    = sh.blur  != null ? sh.blur : 0;
      g.shadowOffsetX = sh.dx    != null ? sh.dx   : 2;
      g.shadowOffsetY = sh.dy    != null ? sh.dy   : 2;
    }
    g.fillStyle = fillStyle;
    g.fillText(line, 0, y);
    g.shadowColor = 'transparent'; g.shadowBlur = 0;
    g.shadowOffsetX = 0; g.shadowOffsetY = 0;
  });
  g.restore();
}