/* ============================================================
   interaction/pointer.js
   Вся работа с указателем:
     - клик по закрытой обложке (открытие)
     - клик по левому/правому краю (листание)
     - drag за уголок разворота
     - тап по голосовому виджету + скраб по волне
     - тап по видео — вкл/выкл звук
   Не управляет состоянием страниц напрямую — дёргает
   turnForward/turnBackward/openAlbum из соседних модулей.
   ============================================================ */

import * as THREE from 'three';

import { state, sheets } from '@core/store.js';
import { addTween, easeOutCubic } from '@core/tween.js';
import { sfxFlip, voicePlayer, toggleVoice } from '@core/audio.js';

import { TW, TH } from '@paint/utils.js';
import {
  hitTestVoiceWidget,
  voiceLocalFromCanvas,
  voiceWaveGeometry,
  seekVoice
} from '@paint/voices.js';

import { camera, controls, sceneCanvas } from '@scene/setup.js';
import { albumG, TOTAL } from '@scene/album.js';
import { PAGE_W, PAGE_H } from '@scene/layout.js';
import { restY, setSheetCurl } from '@scene/positions.js';
import { proxyR, proxyCover } from '@scene/proxies.js';
import { noteCanvasPointerDown } from '@render/loop.js';
import { toggleVideoSound } from '@render/video.js';

import { turnForward, turnBackward } from './flip.js';
import { openAlbum } from './open-close.js';
import { updateUI } from './ui.js';

/* ============================================================
   RAYCASTING
   ============================================================ */
const raycaster = new THREE.Raycaster();
const ndc       = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitV      = new THREE.Vector3();
const invMat    = new THREE.Matrix4();

function pointerRay(e){
  const r = sceneCanvas.getBoundingClientRect();
  ndc.x = ((e.clientX - r.left) / r.width)  * 2 - 1;
  ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
}
function hitPlaneAtY(y){
  dragPlane.set(new THREE.Vector3(0, 1, 0), -y);
  return raycaster.ray.intersectPlane(dragPlane, hitV);
}
function localPoint(y){
  const p = hitPlaneAtY(y);
  if(!p) return null;
  albumG.updateMatrix();
  invMat.copy(albumG.matrix).invert();
  return p.applyMatrix4(invMat);
}

/* ============================================================
   HIT-ТЕСТ ГОЛОСОВОГО ВИДЖЕТА НА ВИДИМЫХ СТОРОНАХ
   ============================================================ */
function tryVoiceClick(){
  // Текущий разворот, лицевая сторона
  const curSh = sheets[state.cur];
  if(curSh && curSh.voicesFront && curSh.voicesFront.length){
    const y  = restY(state.cur);
    const lp = localPoint(y);
    if(lp && lp.x >= -0.05 && lp.x <= PAGE_W + 0.05 && Math.abs(lp.z) <= PAGE_H * 0.55){
      const px  = lp.x / PAGE_W * TW;
      const py  = (0.5 + lp.z / PAGE_H) * TH;
      const hit = hitTestVoiceWidget(curSh, 'front', px, py);
      if(hit){ hit.sheetIdx = state.cur; return hit; }
    }
  }
  // Предыдущий лист, обратная сторона (она видна слева)
  if(state.cur > 0){
    const prevSh = sheets[state.cur - 1];
    if(prevSh && prevSh.voicesBack && prevSh.voicesBack.length){
      const y  = restY(state.cur - 1);
      const lp = localPoint(y);
      if(lp && lp.x >= -PAGE_W * 1.05 && lp.x <= 0.05 * PAGE_W && Math.abs(lp.z) <= PAGE_H * 0.55){
        const u   = 1 + lp.x / PAGE_W;
        const px  = u * TW;
        const py  = (0.5 + lp.z / PAGE_H) * TH;
        const hit = hitTestVoiceWidget(prevSh, 'back', px, py);
        if(hit){ hit.sheetIdx = state.cur - 1; return hit; }
      }
    }
  }
  return null;
}

/* ============================================================
   HIT-ТЕСТ ВИДЕО — тап по видео включает/выключает звук
   ============================================================ */
function tryVideoClick(){
  // Текущий лист, front-сторона
  const curSh = sheets[state.cur];
  if(curSh && curSh.videos.length){
    const y  = restY(state.cur);
    const lp = localPoint(y);
    if(lp && lp.x >= -0.05 && lp.x <= PAGE_W + 0.05 && Math.abs(lp.z) <= PAGE_H * 0.55){
      const px = lp.x / PAGE_W * TW;
      const py = (0.5 + lp.z / PAGE_H) * TH;
      const frontVids = curSh.videos.filter(v => v.side === 'front');
      for(let i = 0; i < frontVids.length; i++){
        const v  = frontVids[i];
        const x0 = v.cx + v.mp.x, y0 = v.cy + v.mp.y;
        const x1 = x0 + v.mp.w,   y1 = y0 + v.mp.h;
        if(px >= x0 && px <= x1 && py >= y0 && py <= y1){
          return { sheet: curSh, side: 'front', idx: i };
        }
      }
    }
  }
  // Предыдущий лист, back-сторона (видна слева)
  if(state.cur > 0){
    const prevSh = sheets[state.cur - 1];
    if(prevSh && prevSh.videos.length){
      const y  = restY(state.cur - 1);
      const lp = localPoint(y);
      if(lp && lp.x >= -PAGE_W * 1.05 && lp.x <= 0.05 * PAGE_W && Math.abs(lp.z) <= PAGE_H * 0.55){
        const u  = 1 + lp.x / PAGE_W;
        const px = u * TW;
        const py = (0.5 + lp.z / PAGE_H) * TH;
        const backVids = prevSh.videos.filter(v => v.side === 'back');
        for(let i = 0; i < backVids.length; i++){
          const v  = backVids[i];
          const x0 = v.cx + v.mp.x, y0 = v.cy + v.mp.y;
          const x1 = x0 + v.mp.w,   y1 = y0 + v.mp.h;
          if(px >= x0 && px <= x1 && py >= y0 && py <= y1){
            return { sheet: prevSh, side: 'back', idx: i };
          }
        }
      }
    }
  }
  return null;
}

/* ============================================================
   НАВЕШИВАНИЕ ОБРАБОТЧИКОВ
   ============================================================ */
export function initPointer(){

  /* --- флаг «палец на холсте» (нужен для idle-вращения) --- */
  sceneCanvas.addEventListener('pointerdown',   () => noteCanvasPointerDown(true),  true);
  sceneCanvas.addEventListener('pointerup',     () => noteCanvasPointerDown(false), true);
  sceneCanvas.addEventListener('pointercancel', () => noteCanvasPointerDown(false), true);

  /* ----------------------------------------------------------
     CLICK — открытие закрытой обложки
     ---------------------------------------------------------- */
  sceneCanvas.addEventListener('click', (e) => {
    if(state.mode !== 'closed' || state.animating) return;
    pointerRay(e);
    const hit = raycaster.intersectObject(proxyCover, false);
    if(hit.length) openAlbum();
  });

  /* ----------------------------------------------------------
     POINTERDOWN
     1) приоритет — голосовой виджет (play / seek)
     2) тап по видео — toggle звука
     3) drag за уголок разворота
     4) тап по левому краю — назад
     ---------------------------------------------------------- */
  sceneCanvas.addEventListener('pointerdown', (e) => {
    if(state.animating) return;
    pointerRay(e);
    if(state.mode === 'closed') return;
    if(state.mode !== 'reading') return;

    /* 1) голос */
    const vhit = tryVoiceClick();
    if(vhit){
      e.preventDefault();
      if(vhit.part === 'wave'){
        seekVoice(vhit.v, vhit.progress);
        if(!vhit.v._playing) voicePlayer.play(vhit.v, true);
        state.voiceScrub = {
          voice: vhit.v,
          sheetIdx: vhit.sheetIdx,
          side: vhit.side,
          pointerId: e.pointerId
        };
        try{ sceneCanvas.setPointerCapture(e.pointerId); }catch(err){}
      } else {
        toggleVoice(vhit.v);
      }
      return;
    }

    /* 2) видео — toggle звука */
    const vidhit = tryVideoClick();
    if(vidhit){
      e.preventDefault();
      toggleVideoSound(vidhit.sheet, vidhit.side, vidhit.idx);
      return;
    }

    const sh = sheets[state.cur];
    const y  = sh ? restY(state.cur) : 0;
    const hit     = raycaster.intersectObject(state.cur < TOTAL ? proxyR : proxyCover, false);
    const hitLeft = raycaster.intersectObject(proxyR, false);

    /* 3) drag за уголок */
    if(hit.length && state.cur < TOTAL){
      const lp = localPoint(y);
      if(lp && lp.x > 0.06 * PAGE_W && lp.x < PAGE_W * 1.02 && Math.abs(lp.z) < PAGE_H * 0.55){
        state.drag = {
          xg0:    Math.max(lp.x, PAGE_W * 0.3),
          lastT:  performance.now(),
          vel:    0,
          startX: e.clientX,
          startY: e.clientY,
          moved:  false
        };
        controls.enabled = false;
        try{ sceneCanvas.setPointerCapture(e.pointerId); }catch(err){}
        e.preventDefault();
        return;
      }
    }

    /* 4) тап по левому краю — назад */
    if(hitLeft.length || hit.length){
      const lp = localPoint(y);
      if(lp && lp.x < 0.06 * PAGE_W){ turnBackward(); }
    }
  });

  /* ----------------------------------------------------------
     POINTERMOVE — скраб по волне голоса ИЛИ drag страницы
     ---------------------------------------------------------- */
  sceneCanvas.addEventListener('pointermove', (e) => {
    pointerRay(e);

    /* скраб по голосу */
    if(state.voiceScrub){
      const sc = state.voiceScrub;
      const y  = restY(sc.sheetIdx);
      const lp = localPoint(y);
      if(lp){
        let px;
        if(sc.side === 'front') px = lp.x / PAGE_W * TW;
        else                    px = (1 + lp.x / PAGE_W) * TW;
        const py = (0.5 + lp.z / PAGE_H) * TH;
        const { lx } = voiceLocalFromCanvas(sc.voice, px, py);
        const g = voiceWaveGeometry(sc.voice);
        const progress = Math.max(0, Math.min(1, (lx - g.waveX) / g.waveW));
        seekVoice(sc.voice, progress);
      }
      return;
    }

    /* drag страницы */
    if(!state.drag) return;
    const y  = restY(state.cur);
    const lp = localPoint(y);
    if(!lp) return;

    if(Math.abs(e.clientX - state.drag.startX) > 8) state.drag.moved = true;

    const sh     = sheets[state.cur];
    const target = Math.acos(Math.max(-1, Math.min(1, lp.x / state.drag.xg0)));
    const prev   = sh.theta;
    sh.theta += (target - sh.theta) * 0.35;

    const now = performance.now();
    state.drag.vel = (sh.theta - prev) / Math.max(1, now - state.drag.lastT) * 1000;
    state.drag.lastT = now;

    sh.mat.uniforms.uTheta.value = sh.theta;
    setSheetCurl(
      sh,
      Math.sin(sh.theta) * (0.55 + Math.min(0.5, Math.abs(state.drag.vel) * 0.12))
    );
  });

  /* ----------------------------------------------------------
     POINTERUP — решаем: залипнуть на месте или долистать
     ---------------------------------------------------------- */
  sceneCanvas.addEventListener('pointerup', () => {
    if(state.voiceScrub){ state.voiceScrub = null; return; }
    if(!state.drag) return;

    const d = state.drag;
    state.drag = null;
    controls.enabled = true;

    const sh    = sheets[state.cur];
    const fling = d.vel > 0.0035;

    // Тап без движения по «середине» страницы → вперёд
    if(!d.moved && sh.theta < 0.25){
      sh.theta = 0;
      sh.mat.uniforms.uTheta.value = 0;
      sh.mat.uniforms.uCurl.value  = 0;
      turnForward();
      return;
    }

    state.animating = true;
    const goFlip = sh.theta > Math.PI * 0.38 || (fling && sh.theta > 0.15);
    if(goFlip) voicePlayer.stop();

    const a0  = sh.theta;
    const a1  = goFlip ? Math.PI : 0;
    const dur = state.reduced ? 200 : Math.max(320, Math.abs(a1 - a0) / Math.PI * 620);
    sfxFlip();

    addTween({
      dur,
      ease: easeOutCubic,
      onUpdate(v){
        sh.theta = a0 + (a1 - a0) * v;
        sh.mat.uniforms.uTheta.value = sh.theta;
        setSheetCurl(
          sh,
          Math.sin(v * Math.PI) * 0.5 * (goFlip ? 1 : -1) * (1 - v * 0.4)
        );
      },
      onDone(){
        sh.mat.uniforms.uCurl.value = 0;
        sh.theta = a1;
        state.animating = false;
        if(goFlip){ state.cur++; sfxFlip(); }
        updateUI();
      }
    });
  });

  /* ----------------------------------------------------------
     POINTERCANCEL — откат драга
     ---------------------------------------------------------- */
  sceneCanvas.addEventListener('pointercancel', () => {
    if(state.voiceScrub){ state.voiceScrub = null; return; }
    if(state.drag){
      const sh = sheets[state.cur];
      sh.mat.uniforms.uCurl.value = 0;
      state.drag = null;
      controls.enabled = true;
    }
  });
}