import { state, sheets } from '@core/store.js';
import { addTween, easeInOutCubic, easeOutCubic } from '@core/tween.js';
import { sfxFlip, sfxClack, voicePlayer } from '@core/audio.js';
import { TOTAL } from '@scene/album.js';
import { setSheetCurl } from '@scene/positions.js';

import { startStackDrop, startStackPop } from './stack.js';
import { closeAlbum } from './open-close.js';
import { updateUI } from './ui.js';

export function flipCurl(k, dir){ return Math.sin(k * Math.PI) * 0.82 * dir; }

/* ============================================================
   Вперёд
   ============================================================ */
export function turnForward(speedK){
  if(state.mode !== 'reading' || state.animating || state.cur >= TOTAL) return false;
  const sh = sheets[state.cur];
  if(sh && sh.stackPhotos && sh.stackCount < sh.stackPhotos.length) return startStackDrop(sh);
  voicePlayer.stop();
  state.animating = true;
  const dur = (state.reduced ? 260 : 1050) * (speedK || 1);
  sfxFlip();
  addTween({
    dur, ease: easeInOutCubic,
    onUpdate(v){
      sh.theta = v * Math.PI;
      sh.mat.uniforms.uTheta.value = sh.theta;
      setSheetCurl(sh, flipCurl(v, 1));
    },
    onDone(){
      sh.theta = Math.PI;
      sh.mat.uniforms.uTheta.value = Math.PI;
      sh.mat.uniforms.uCurl.value = 0;
      state.cur++;
      state.animating = false;
      sfxClack();
      updateUI();
    }
  });
  return true;
}

/* ============================================================
   Назад
   ============================================================ */
export function turnBackward(speedK){
  if(state.mode !== 'reading' || state.animating) return false;
  const sh = sheets[state.cur];
  if(sh && sh.stackPhotos && sh.stackCount > 1) return startStackPop(sh);
  if(state.cur <= 0){ closeAlbum(); return true; }
  voicePlayer.stop();
  state.animating = true;
  state.cur--;
  const shPrev = sheets[state.cur];
  const dur = (state.reduced ? 260 : 900) * (speedK || 1);
  sfxFlip();
  addTween({
    dur, ease: easeInOutCubic,
    onUpdate(v){
      shPrev.theta = (1 - v) * Math.PI;
      shPrev.mat.uniforms.uTheta.value = shPrev.theta;
      setSheetCurl(shPrev, flipCurl(v, -1));
    },
    onDone(){
      shPrev.theta = 0;
      shPrev.mat.uniforms.uTheta.value = 0;
      shPrev.mat.uniforms.uCurl.value = 0;
      state.animating = false;
      sfxClack();
      updateUI();
    }
  });
  return true;
}

/* ============================================================
   Каскад — «переглянути спочатку» и Home/End
   ============================================================ */
export function cascade(dir){
  if(state.animating) return;
  voicePlayer.stop();
  state.animating = true;
  if(dir > 0){
    let i = state.cur;
    const step = () => {
      if(i >= TOTAL){ state.animating = false; updateUI(); return; }
      const sh = sheets[i];
      sfxFlip();
      state.cur = i;
      updateUI();
      addTween({
        dur: 340, ease: easeOutCubic,
        onUpdate(v){
          sh.theta = v * Math.PI;
          sh.mat.uniforms.uTheta.value = sh.theta;
          setSheetCurl(sh, flipCurl(v, 1));
        },
        onDone(){
          sh.mat.uniforms.uTheta.value = Math.PI;
          sh.mat.uniforms.uCurl.value = 0;
          sh.theta = Math.PI;
          i++; step();
        }
      });
    };
    step();
  } else {
    let i = state.cur - 1;
    const step = () => {
      if(i < 0){ state.animating = false; updateUI(); return; }
      const sh = sheets[i];
      sfxFlip();
      state.cur = i;
      updateUI();
      addTween({
        dur: 300, ease: easeOutCubic,
        onUpdate(v){
          sh.theta = (1 - v) * Math.PI;
          sh.mat.uniforms.uTheta.value = sh.theta;
          setSheetCurl(sh, flipCurl(v, -1));
        },
        onDone(){
          sh.mat.uniforms.uTheta.value = 0;
          sh.mat.uniforms.uCurl.value = 0;
          sh.theta = 0;
          i--; step();
        }
      });
    };
    step();
  }
}