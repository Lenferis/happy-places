import { IMGS } from '@core/store.js';

export function tapeStrip(g, x, y, len, ang, hue){
  g.save(); g.translate(x, y); g.rotate(ang);
  g.globalAlpha = .82;
  const tg = g.createLinearGradient(0, -13, 0, 13);
  if(hue === 'rose')      { tg.addColorStop(0, '#dba8a0'); tg.addColorStop(1, '#c2857d'); }
  else if(hue === 'gold') { tg.addColorStop(0, '#e3c98a'); tg.addColorStop(1, '#c8a25e'); }
  else                    { tg.addColorStop(0, '#dcb684'); tg.addColorStop(1, '#c39a66'); }
  g.fillStyle = tg; g.fillRect(-len/2, -13, len, 26);
  g.fillStyle = 'rgba(255,255,255,.16)';
  for(let i = -len/2; i < len/2; i += 16) g.fillRect(i, -13, 7, 26);
  g.globalAlpha = .25; g.fillStyle = '#fff';
  g.fillRect(-len/2, -13, len, 3);
  g.globalAlpha = 1; g.restore();
}

export function photoCorner(g, x, y, ang){
  g.save(); g.translate(x, y); g.rotate(ang);
  g.fillStyle = 'rgba(200,160,105,.9)';
  g.beginPath(); g.moveTo(-22, -4); g.lineTo(22, -4); g.lineTo(0, 26); g.closePath(); g.fill();
  g.fillStyle = 'rgba(120,80,40,.35)';
  g.beginPath(); g.moveTo(-22, -4); g.lineTo(0, -4); g.lineTo(-11, 11); g.closePath(); g.fill();
  g.restore();
}

export function itemDeco(g, key, x, y, size, ang, alpha){
  const src = IMGS.items[key]; if(!src) return;
  g.save(); g.translate(x, y); g.rotate(ang);
  g.globalAlpha = alpha == null ? .92 : alpha;
  g.shadowColor = 'rgba(90,55,20,.3)'; g.shadowBlur = 10; g.shadowOffsetY = 5;
  g.drawImage(src, -size/2, -size/2, size, size);
  g.restore();
}

export function stampDeco(g, x, y, l1, l2, ang){
  g.save(); g.translate(x, y); g.rotate(ang);
  g.strokeStyle = 'rgba(138,90,43,.65)'; g.lineWidth = 2.5; g.setLineDash([7, 6]);
  g.beginPath(); g.arc(0, 0, 52, 0, 7); g.stroke();
  g.setLineDash([]);
  g.fillStyle = 'rgba(138,90,43,.7)';
  g.font = '600 17px Cormorant, serif'; g.textAlign = 'center';
  g.fillText(l1, 0, -6);
  g.font = 'italic 600 20px Cormorant, serif';
  g.fillText(l2, 0, 18);
  g.restore();
}

export function heartDeco(g, x, y, s, ang, color){
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s/60, s/60);
  g.strokeStyle = color || 'rgba(181,72,58,.8)'; g.lineWidth = 3.4;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(30, 50); g.bezierCurveTo(10, 35, 8, 22, 18, 14); g.bezierCurveTo(24, 10, 30, 14, 30, 20);
  g.bezierCurveTo(30, 14, 36, 10, 42, 14); g.bezierCurveTo(52, 22, 50, 35, 30, 50);
  g.stroke();
  g.restore();
}

export function clipDeco(g, x, y, ang){
  g.save(); g.translate(x, y); g.rotate(ang);
  g.strokeStyle = 'rgba(122,122,130,.95)'; g.lineWidth = 4; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(-9, 20); g.lineTo(-9, -12); g.arc(0, -12, 9, Math.PI, 0, false); g.lineTo(9, 26);
  g.arc(0, 26, 4.5, 0, Math.PI, false); g.lineTo(-4.5, -12);
  g.stroke();
  g.restore();
}

export function starDeco(g, x, y, size, rotDeg, alpha, color){
  g.save(); g.translate(x, y); g.rotate(rotDeg * Math.PI / 180);
  g.globalAlpha = alpha != null ? alpha : 0.85;
  g.strokeStyle = color || 'rgba(184,138,57,.85)';
  g.lineWidth = 2.5; g.lineJoin = 'round'; g.lineCap = 'round';
  const r1 = size * 0.5, r2 = r1 * 0.42;
  g.beginPath();
  for(let i = 0; i < 10; i++){
    const r = (i % 2 === 0) ? r1 : r2;
    const a = -Math.PI/2 + i * Math.PI / 5;
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    if(i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath(); g.stroke();
  g.restore();
}

export function sparkleDeco(g, x, y, size, rotDeg, alpha, color){
  g.save(); g.translate(x, y); g.rotate(rotDeg * Math.PI / 180);
  g.globalAlpha = alpha != null ? alpha : 0.9;
  g.fillStyle   = color || 'rgba(233,200,115,.9)';
  const r = size * 0.5;
  g.beginPath();
  g.moveTo(0, -r);
  g.quadraticCurveTo( r*0.12, -r*0.12,  r, 0);
  g.quadraticCurveTo( r*0.12,  r*0.12,  0, r);
  g.quadraticCurveTo(-r*0.12,  r*0.12, -r, 0);
  g.quadraticCurveTo(-r*0.12, -r*0.12,  0, -r);
  g.closePath(); g.fill();
  g.restore();
}

export function underlineDeco(g, x, y, size, rotDeg, alpha, color){
  g.save(); g.translate(x, y); g.rotate(rotDeg * Math.PI / 180);
  g.globalAlpha = alpha != null ? alpha : 0.8;
  g.strokeStyle = color || 'rgba(181,72,58,.75)';
  g.lineWidth = 3; g.lineCap = 'round';
  const half = size / 2;
  g.beginPath();
  g.moveTo(-half, 0);
  for(let i = 1; i <= 20; i++){
    const t = i / 20;
    g.lineTo(-half + t * size, Math.sin(t * Math.PI * 3) * 3);
  }
  g.stroke();
  g.restore();
}

export function lineDeco(g, x, y, size, rotDeg, alpha, color, width){
  g.save(); g.translate(x, y); g.rotate(rotDeg * Math.PI / 180);
  g.globalAlpha = alpha != null ? alpha : 1;
  g.strokeStyle = color || 'rgba(138,90,43,.55)';
  g.lineWidth   = width != null ? width : 1.5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-size/2, 0); g.lineTo(size/2, 0);
  g.stroke();
  g.restore();
}