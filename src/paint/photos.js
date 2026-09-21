import { COL } from '@config/theme.js';
import { roundRect } from './utils.js';
import { isVideo, mediaSize } from '@loaders/media.js';

export function getMediaDrawParams(pw, ph, frameType, hasCaption){
  const type = frameType || (hasCaption ? 'polaroid' : 'polaroid-plain');
  if(type === 'none' || type === 'rounded' || type === 'border' || type === 'polaroid-plain')
    return { x: -pw/2, y: -ph/2, w: pw, h: ph, type };
  const pad  = pw * 0.038;
  const padB = pw * 0.155;
  return { x: -pw/2, y: -ph/2 + (pad - padB) / 2, w: pw, h: ph, type };
}

export function drawPhoto(g, img, cx, cy, pw, tiltDeg, caption, frameType, aspect){
  const ar   = aspect || (4/3);
  const ph   = pw / ar;
  const type = frameType || (caption ? 'polaroid' : 'polaroid-plain');
  const vid  = isVideo(img);
  const msz  = mediaSize(img);
  const iw   = msz.w, ih = msz.h;

  g.save();
  g.translate(cx, cy);
  g.rotate((tiltDeg || 0) * Math.PI / 180);

  if(type === 'none'){
    g.shadowColor = 'rgba(55,30,8,.48)'; g.shadowBlur = 32; g.shadowOffsetY = 14;
    g.fillStyle = '#000'; g.fillRect(-pw/2, -ph/2, pw, ph);
    g.shadowColor = 'transparent';
    g.save();
    g.beginPath(); g.rect(-pw/2, -ph/2, pw, ph); g.clip();
    if(!vid) g.filter = 'sepia(.14) saturate(.95) contrast(.98) brightness(1.02)';
    const s = Math.max(pw/iw, ph/ih);
    g.drawImage(img, -pw/2 + (pw - iw*s)/2, -ph/2 + (ph - ih*s)/2, iw*s, ih*s);
    g.filter = 'none';
    g.restore();
    const ig = g.createLinearGradient(0, -ph/2, 0, -ph/2 + ph*.14);
    ig.addColorStop(0, 'rgba(60,35,10,.12)'); ig.addColorStop(1, 'rgba(60,35,10,0)');
    g.fillStyle = ig; g.fillRect(-pw/2, -ph/2, pw, ph*.14);
    g.restore();
    return { w: pw, h: ph, ph, pw, type };
  }

  if(type === 'rounded'){
    const pad = Math.round(pw * 0.022);
    const w   = pw + pad*2, h = ph + pad*2;
    const r   = Math.round(pw * 0.05);
    g.shadowColor = 'rgba(55,30,8,.42)'; g.shadowBlur = 30; g.shadowOffsetY = 12;
    g.fillStyle = '#fffdf6'; roundRect(g, -w/2, -h/2, w, h, r); g.fill();
    g.shadowColor = 'transparent';
    g.save();
    roundRect(g, -w/2+pad, -h/2+pad, pw, ph, r*0.85); g.clip();
    if(!vid) g.filter = 'sepia(.16) saturate(.94) contrast(.97) brightness(1.02)';
    const s = Math.max(pw/iw, ph/ih);
    g.drawImage(img, -pw/2 + (pw - iw*s)/2, -h/2+pad + (ph - ih*s)/2, iw*s, ih*s);
    g.filter = 'none';
    g.restore();
    g.strokeStyle = 'rgba(90,60,25,.16)'; g.lineWidth = 1.5;
    roundRect(g, -w/2+.75, -h/2+.75, w-1.5, h-1.5, r); g.stroke();
    g.restore();
    return { w, h, ph, pw, type };
  }

  if(type === 'border'){
    const pad = Math.round(pw * 0.048);
    const w   = pw + pad*2, h = ph + pad*2;
    g.shadowColor = 'rgba(55,30,8,.42)'; g.shadowBlur = 30; g.shadowOffsetY = 12;
    g.fillStyle = '#fffdf6'; g.fillRect(-w/2, -h/2, w, h);
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(90,60,25,.16)'; g.lineWidth = 1.5;
    g.strokeRect(-w/2+.75, -h/2+.75, w-1.5, h-1.5);
    g.save();
    g.beginPath(); g.rect(-w/2+pad, -h/2+pad, pw, ph); g.clip();
    if(!vid) g.filter = 'sepia(.16) saturate(.94) contrast(.97) brightness(1.02)';
    const s = Math.max(pw/iw, ph/ih);
    g.drawImage(img, -pw/2 + (pw - iw*s)/2, -h/2+pad + (ph - ih*s)/2, iw*s, ih*s);
    g.filter = 'none';
    g.restore();
    const ig = g.createLinearGradient(0, -h/2+pad, 0, -h/2+pad+ph*.14);
    ig.addColorStop(0, 'rgba(60,35,10,.1)'); ig.addColorStop(1, 'rgba(60,35,10,0)');
    g.fillStyle = ig; g.fillRect(-w/2+pad, -h/2+pad, pw, ph*.14);
    g.restore();
    return { w, h, ph, pw, type };
  }

  if(type === 'polaroid-plain'){
    const pad = Math.round(pw * 0.042);
    const w   = pw + pad*2, h = ph + pad*2;
    g.shadowColor = 'rgba(55,30,8,.4)'; g.shadowBlur = 34; g.shadowOffsetY = 14;
    g.fillStyle = '#fffdf6'; g.fillRect(-w/2, -h/2, w, h);
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(90,60,25,.14)'; g.lineWidth = 1.5;
    g.strokeRect(-w/2+.75, -h/2+.75, w-1.5, h-1.5);
    g.save();
    g.beginPath(); g.rect(-w/2+pad, -h/2+pad, pw, ph); g.clip();
    if(!vid) g.filter = 'sepia(.16) saturate(.94) contrast(.97) brightness(1.02)';
    const s = Math.max(pw/iw, ph/ih);
    g.drawImage(img, -pw/2 + (pw - iw*s)/2, -h/2+pad + (ph - ih*s)/2, iw*s, ih*s);
    g.filter = 'none';
    g.restore();
    const ig = g.createLinearGradient(0, -h/2+pad, 0, -h/2+pad+ph*.12);
    ig.addColorStop(0, 'rgba(60,35,10,.1)'); ig.addColorStop(1, 'rgba(60,35,10,0)');
    g.fillStyle = ig; g.fillRect(-w/2+pad, -h/2+pad, pw, ph*.12);
    g.restore();
    return { w, h, ph, pw, type };
  }

  // polaroid (с подписью снизу)
  const pad  = Math.round(pw * .038), padB = Math.round(pw * .155);
  const w    = pw + pad*2, h = ph + pad + padB;
  g.shadowColor = 'rgba(55,30,8,.4)'; g.shadowBlur = 34; g.shadowOffsetY = 14;
  g.fillStyle = '#fffdf6'; g.fillRect(-w/2, -h/2, w, h);
  g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(90,60,25,.14)'; g.lineWidth = 1.5;
  g.strokeRect(-w/2+.75, -h/2+.75, w-1.5, h-1.5);
  g.save();
  g.beginPath(); g.rect(-w/2+pad, -h/2+pad, pw, ph); g.clip();
  if(!vid) g.filter = 'sepia(.16) saturate(.94) contrast(.97) brightness(1.02)';
  const s = Math.max(pw/iw, ph/ih);
  g.drawImage(img, -pw/2 + (pw - iw*s)/2, -h/2+pad + (ph - ih*s)/2, iw*s, ih*s);
  g.filter = 'none';
  g.restore();
  const ig = g.createLinearGradient(0, -h/2+pad, 0, -h/2+pad+ph);
  ig.addColorStop(0, 'rgba(60,35,10,.10)'); ig.addColorStop(.12, 'rgba(60,35,10,0)');
  g.fillStyle = ig; g.fillRect(-w/2+pad, -h/2+pad, pw, ph);
  if(caption){
    g.fillStyle = COL.inkSoft;
    const fs = Math.max(16, Math.min(38, Math.round(pw * .095)));
    g.font = `500 ${fs}px Caveat, cursive`;
    g.textAlign = 'center';
    const maxW  = w - pad*2.4;
    const words = String(caption).split(' ');
    let line = '', lines = [];
    words.forEach(wd => {
      const test = (line + ' ' + wd).trim();
      if(g.measureText(test).width > maxW && line){ lines.push(line); line = wd; }
      else line = test;
    });
    if(line) lines.push(line);
    const lineH  = fs * 1.02;
    const startY = h/2 - padB/2 - (lines.length - 1) * lineH * 0.5 + fs * 0.34;
    lines.forEach((L, i) => g.fillText(L, 0, startY + i * lineH));
  }
  g.restore();
  return { w, h, ph, pw, type };
}