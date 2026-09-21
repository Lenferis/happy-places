import { COL } from '@config/theme.js';
import { IMGS } from '@core/store.js';
import { mkCanvas, rnd, goldVersion } from './utils.js';

export function paintLeatherBase(g, W, H, base1, base2){
  const lg = g.createLinearGradient(0, 0, W, H);
  lg.addColorStop(0, base1); lg.addColorStop(.5, base2); lg.addColorStop(1, base1);
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  for(let i = 0; i < 2600; i++){
    g.fillStyle = `rgba(${Math.random() < .5 ? '20,8,2' : '255,190,130'},${rnd(.015,.045)})`;
    g.beginPath(); g.arc(rnd(0,W), rnd(0,H), rnd(.6,2.2), 0, 7); g.fill();
  }
  g.strokeStyle = 'rgba(25,10,3,.08)';
  for(let i = 0; i < 70; i++){
    const x = rnd(0,W), y = rnd(0,H);
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + rnd(-40,40), y + rnd(-40,40), x + rnd(-90,90), y + rnd(-90,90));
    g.lineWidth = rnd(.5, 1.6); g.stroke();
  }
  const vg = g.createRadialGradient(W/2, H/2, H*.2, W/2, H/2, H*.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.34)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

export function paintBg(g, W, H, bg){
  const t = (bg && bg.type) || 'paper';
  if(t === 'leather'){
    const c1 = (bg.colors && bg.colors[0]) || '#6b3018';
    const c2 = (bg.colors && bg.colors[1]) || '#7d3c22';
    paintLeatherBase(g, W, H, c1, c2);
    return;
  }
  if(t === 'endpaper'){
    g.fillStyle = (bg && bg.fill) || '#f3ead7';
    g.fillRect(0, 0, W, H);
    const step = 72;
    g.strokeStyle = 'rgba(170,130,70,.22)'; g.lineWidth = 1.4;
    g.fillStyle   = 'rgba(170,130,70,.2)';
    for(let y = 0; y < H + step; y += step){
      for(let x = 0; x < W + step; x += step){
        const ox = (y/step) % 2 ? step/2 : 0;
        const px = x + ox, py = y;
        g.beginPath(); g.moveTo(px,py-9); g.lineTo(px+9,py); g.lineTo(px,py+9); g.lineTo(px-9,py); g.closePath(); g.stroke();
        g.beginPath(); g.arc(px+step/2, py+step/2, 1.6, 0, 7); g.fill();
      }
    }
    const vg = g.createRadialGradient(W/2, H/2, H*.2, W/2, H/2, H*.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(120,80,40,.16)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return;
  }
  if(t === 'plain'){
    g.fillStyle = (bg && bg.fill) || '#f8f1e2';
    g.fillRect(0, 0, W, H);
    return;
  }
  // paper
  g.fillStyle = (bg && bg.fill) || COL.paper; g.fillRect(0, 0, W, H);
  const lg = g.createLinearGradient(0, 0, W, H);
  lg.addColorStop(0,   'rgba(255,252,240,.5)');
  lg.addColorStop(.5,  'rgba(255,252,240,0)');
  lg.addColorStop(1,   'rgba(215,190,150,.12)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  for(let i = 0; i < 1100; i++){
    g.fillStyle = `rgba(120,85,45,${rnd(.015,.055)})`;
    g.fillRect(rnd(0,W), rnd(0,H), rnd(1,2.4), rnd(1,2.4));
  }
  const vg = g.createRadialGradient(W/2, H/2, H*.25, W/2, H/2, H*.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(115,78,38,.13)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

export function paintWood(){
  const S = 1024;
  const c = mkCanvas(S, S), g = c.getContext('2d');
  g.fillStyle = '#22110a'; g.fillRect(0, 0, S, S);
  const plank = 146;
  for(let y = 0; y < S; y += plank){
    const tone = 18 + Math.floor(rnd(0, 14));
    g.fillStyle = `rgb(${tone+14},${Math.round(tone*.62)},${Math.round(tone*.38)})`;
    g.fillRect(0, y, S, plank);
    for(let i = 0; i < 46; i++){
      g.strokeStyle = `rgba(${Math.random()<.5?'12,5,2':'90,55,28'},${rnd(.03,.09)})`;
      g.lineWidth = rnd(1, 3.4);
      const ly = y + rnd(4, plank - 4);
      g.beginPath(); g.moveTo(0, ly);
      for(let x = 0; x <= S; x += 90) g.lineTo(x, ly + Math.sin(x*.006 + i) * rnd(1, 5));
      g.stroke();
    }
    g.fillStyle = 'rgba(8,3,1,.7)';    g.fillRect(0, y,   S, 3);
    g.fillStyle = 'rgba(255,190,120,.05)'; g.fillRect(0, y+3, S, 2);
  }
  for(let i = 0; i < 7; i++){
    const x = rnd(60, S-60), y = rnd(30, S-30);
    for(let r = 14; r > 2; r -= 3){
      g.strokeStyle = `rgba(15,7,2,${.16 - r*.008})`; g.lineWidth = 2.4;
      g.beginPath(); g.ellipse(x, y, r*2.1, r*1.15, rnd(-.2,.2), 0, 7); g.stroke();
    }
  }
  const vg = g.createRadialGradient(S/2, S/2, S*.2, S/2, S/2, S*.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)');
  g.fillStyle = vg; g.fillRect(0, 0, S, S);
  return c;
}

export function paintLinen(){
  const W = 1024, H = 724;
  const c = mkCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#e7d5b4'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120,90,50,.06)';
  for(let x = 0; x < W; x += 5){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for(let y = 0; y < H; y += 5){ g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for(let i = 0; i < 1600; i++){
    g.fillStyle = `rgba(110,80,45,${rnd(.02,.05)})`;
    g.fillRect(rnd(0,W), rnd(0,H), rnd(1,2.4), rnd(1,2.4));
  }
  g.strokeStyle = 'rgba(140,100,55,.55)'; g.lineWidth = 2.4; g.setLineDash([10,8]);
  g.strokeRect(26, 26, W-52, H-52);
  g.setLineDash([]);
  const vg = g.createRadialGradient(W/2, H/2, H*.3, W/2, H/2, H*.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(90,60,25,.2)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return c;
}

export function paintStackSide(){
  const W = 256, H = 256;
  const c = mkCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#e9dfc8'; g.fillRect(0, 0, W, H);
  for(let y = 0; y < H; y += 3){
    const t = Math.random();
    g.fillStyle = t < .5 ? 'rgba(150,110,60,.35)' : 'rgba(255,250,235,.5)';
    g.fillRect(0, y, W, 1.4);
  }
  const vg = g.createLinearGradient(0, 0, W, 0);
  vg.addColorStop(0,   'rgba(60,35,12,.4)');
  vg.addColorStop(.25, 'rgba(60,35,12,.05)');
  vg.addColorStop(1,   'rgba(60,35,12,.22)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return c;
}

export function paintSpine(){
  const W = 160, H = 1312;
  const c = mkCanvas(W, H), g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0, '#3a1a0a'); lg.addColorStop(.45, '#5e2c16'); lg.addColorStop(1, '#43200e');
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  for(let i = 0; i < 700; i++){
    g.fillStyle = `rgba(20,8,2,${rnd(.02,.06)})`;
    g.fillRect(rnd(0,W), rnd(0,H), rnd(1,3), rnd(1,3));
  }
  [180, 305, H-305, H-180].forEach(y => {
    const bg = g.createLinearGradient(0, y-10, 0, y+10);
    bg.addColorStop(0, '#f3dd9a'); bg.addColorStop(.5, '#a87f33'); bg.addColorStop(1, '#5e4012');
    g.fillStyle = bg; g.fillRect(6, y-10, W-12, 20);
    g.fillStyle = 'rgba(30,12,2,.45)';    g.fillRect(6, y+8,  W-12, 3);
    g.fillStyle = 'rgba(255,235,180,.25)'; g.fillRect(6, y-10, W-12, 2);
  });
  g.save(); g.translate(W/2, H/2); g.rotate(Math.PI/4);
  g.strokeStyle = 'rgba(233,200,115,.85)'; g.lineWidth = 3;
  g.strokeRect(-24, -24, 48, 48);
  g.strokeStyle = 'rgba(233,200,115,.35)'; g.lineWidth = 1.2;
  g.strokeRect(-31, -31, 62, 62);
  if(IMGS.items.rose){
    g.rotate(-Math.PI/4);
    const goldRose = goldVersion(IMGS.items.rose);
    g.globalAlpha = .85; g.drawImage(goldRose, -34, -34, 68, 68); g.globalAlpha = 1;
  }
  g.restore();
  const hg = g.createLinearGradient(0, 0, 0, H);
  hg.addColorStop(0,   'rgba(0,0,0,.4)'); hg.addColorStop(.1,  'rgba(0,0,0,0)');
  hg.addColorStop(.9,  'rgba(0,0,0,0)');  hg.addColorStop(1,   'rgba(0,0,0,.4)');
  g.fillStyle = hg; g.fillRect(0, 0, W, H);
  return c;
}