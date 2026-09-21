import { tweens } from './store.js';

export function addTween(o){ o.t0 = performance.now(); tweens.push(o); }

export function updateTweens(now){
  for(let i = tweens.length - 1; i >= 0; i--){
    const tw = tweens[i];
    let k = (now - tw.t0) / tw.dur;
    if(k >= 1) k = 1;
    tw.onUpdate(tw.ease ? tw.ease(k) : k);
    if(k === 1){ tweens.splice(i, 1); if(tw.onDone) tw.onDone(); }
  }
}

export const easeInOutCubic = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
export const easeOutCubic   = t => 1 - Math.pow(1 - t, 3);
export const easeInCubic    = t => t * t * t;