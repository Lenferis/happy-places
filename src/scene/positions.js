import { state, sheets } from '@core/store.js';
import { TOTAL } from './album.js';
import { TH_, BASE_R, L_BASE, ACT_OFF, SIDE_OFF } from './layout.js';

export function stackHs(){
  const f = state.cur;
  return {
    r: Math.max(0, TOTAL - f - 1) * TH_,
    l: Math.max(0, f - 1) * TH_
  };
}

export function activeY(i){
  const sh = sheets[i];
  const th = sh ? sh.theta : 0;
  const yRight = BASE_R + (TOTAL - i) * TH_ + SIDE_OFF;
  const yLeft  = L_BASE + i * TH_ + SIDE_OFF + ACT_OFF;
  const w = Math.max(0, -Math.cos(th));
  const base = yRight + (yLeft - yRight) * w;
  const leftTop = i > 0 ? (L_BASE + (i - 1) * TH_ + SIDE_OFF) : -Infinity;
  const lift = Math.max(ACT_OFF * 1.6, (leftTop + TH_ * 1.5) - yRight);
  return base + lift * Math.sin(th);
}

export function restY(i){
  if(i < state.cur)  return L_BASE + i * TH_ + SIDE_OFF;
  if(i === state.cur) return activeY(i);
  return BASE_R + (TOTAL - i) * TH_ + SIDE_OFF;
}

export function setSheetCurl(sh, curl){
  const th = sh.theta;
  const lim = Math.max(0, Math.min(th, Math.PI - th));
  sh.mat.uniforms.uCurl.value = Math.max(-lim, Math.min(lim, curl));
}

export { TOTAL, TH_, BASE_R, L_BASE, ACT_OFF, SIDE_OFF };