import * as THREE from 'three';

import { state } from '@core/store.js';
import { addTween, easeInOutCubic } from '@core/tween.js';
import {
  sfxCover, sfxClack, voicePlayer,
  initAudio, resumeAudioCtx, applyMusicState, makeAudioToggleReady
} from '@core/audio.js';
import { SCENE } from '@config/scene.js';

import {
  camera, controls, fitCamera, pickCameraTarget, CAM_HOME, TGT_HOME
} from '@scene/setup.js';
import {
  coverPivot, coverTopY, spine, spineInner, spineMat, spineInnerMat
} from '@scene/album.js';
import { COVER_T } from '@scene/layout.js';

import { updateUI, openHint, pageMeta, dragHint } from './ui.js';

/* ============================================================
   Открытие
   ============================================================ */
export function openAlbum(){
  if(state.mode !== 'closed' || state.animating) return;
  voicePlayer.stop();
  state.mode = 'opening';
  state.animating = true;
  controls.autoRotate = false;

  initAudio(); resumeAudioCtx();
  applyMusicState();
  makeAudioToggleReady();
  openHint.classList.remove('show');
  sfxCover();

  const cam0 = camera.position.clone(), tgt0 = controls.target.clone();
  const cam1 = fitCamera(new THREE.Vector3().fromArray(SCENE.camera.reading));
  const tgt1 = pickCameraTarget(SCENE.camera.readingTarget, SCENE.camera.readingTargetPortrait);

  addTween({
    dur: 2000, ease: easeInOutCubic,
    onUpdate(v){ camera.position.lerpVectors(cam0, cam1, v); controls.target.lerpVectors(tgt0, tgt1, v); }
  });

  const yTop = coverTopY, yBot = COVER_T / 2;
  addTween({
    dur: 1900, ease: easeInOutCubic,
    onUpdate(v){
      coverPivot.rotation.z = v * Math.PI;
      coverPivot.position.y = yTop + (yBot - yTop) * v;
      const ft = Math.max(0, Math.min(1, (v - 0.15) / 0.55));
      const alpha = 1 - ft * ft * (3 - 2 * ft);
      spineMat.opacity = alpha; spineInnerMat.opacity = alpha;
      if(alpha <= 0.02){ spine.visible = false; spineInner.visible = false; }
    },
    onDone(){
      spine.visible = false; spineInner.visible = false;
      spineMat.opacity = 0; spineInnerMat.opacity = 0;
      state.mode = 'reading'; state.animating = false;
      sfxClack(); updateUI();
      applyMusicState();
      pageMeta.classList.add('show');
      if(!state.firstOpen){
        state.firstOpen = true;
        dragHint.classList.add('show');
        setTimeout(() => dragHint.classList.add('gone'), 7000);
      }
    }
  });
}

/* ============================================================
   Закрытие
   ============================================================ */
export function closeAlbum(){
  if(state.mode !== 'reading' || state.animating || state.cur > 0) return;
  voicePlayer.stop();
  state.mode = 'closing';
  state.animating = true;
  controls.autoRotate = false;
  sfxCover();
  applyMusicState();

  spineMat.opacity = 0; spineInnerMat.opacity = 0;
  spine.visible = true; spineInner.visible = true;

  const cam0 = camera.position.clone(), tgt0 = controls.target.clone();
  const cam1 = CAM_HOME.clone(), tgt1 = TGT_HOME.clone();
  addTween({
    dur: 2000, ease: easeInOutCubic,
    onUpdate(v){ camera.position.lerpVectors(cam0, cam1, v); controls.target.lerpVectors(tgt0, tgt1, v); }
  });

  const yTop = coverTopY, yBot = COVER_T / 2;
  addTween({
    dur: 1900, ease: easeInOutCubic,
    onUpdate(v){
      const u = 1 - v;
      coverPivot.rotation.z = u * Math.PI;
      coverPivot.position.y = yTop + (yBot - yTop) * u;
      const ft = Math.max(0, Math.min(1, (u - 0.15) / 0.55));
      const alpha = 1 - ft * ft * (3 - 2 * ft);
      spineMat.opacity = alpha; spineInnerMat.opacity = alpha;
      const vis = alpha > 0.02;
      spine.visible = vis; spineInner.visible = vis;
    },
    onDone(){
      coverPivot.rotation.z = 0;
      coverPivot.position.y = yTop;
      spineMat.opacity = 1; spineInnerMat.opacity = 1;
      spine.visible = true; spineInner.visible = true;
      state.mode = 'closed'; state.animating = false;
      sfxClack(); updateUI();
      applyMusicState();
      pageMeta.classList.remove('show');
      dragHint.classList.remove('show'); dragHint.classList.remove('gone');
      openHint.classList.add('show');
    }
  });
}