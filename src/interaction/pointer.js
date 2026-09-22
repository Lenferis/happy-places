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
   СОСТОЯНИЕ ЖЕСТОВ
   ============================================================ */
const activePointers = new Map();
let pinchStartDist  = 0;
let pinchStartCam   = 0;
let panStartCamPos  = null;
let panStartTgtPos  = null;
let panStartPointer = null;
let panMode = false;            // режим «рука» — панорамирование одним пальцем
let handBtn = null;

function cameraDistance(){ return camera.position.distanceTo(controls.target); }

function dollyCamera(newDist){
  const minD = controls.minDistance;
  const maxD = controls.maxDistance;
  newDist = Math.max(minD, Math.min(maxD, newDist));
  const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, newDist);
}

function pinchGetDist(){
  if(activePointers.size < 2) return 0;
  const [a, b] = [...activePointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/* ============================================================
   КНОПКА «РУКА»
   ============================================================ */
function createHandButton(){
  handBtn = document.createElement('button');
  handBtn.type = 'button';
  handBtn.setAttribute('aria-label', 'Режим панорамування');
  handBtn.title = 'Рука — панорамування';
  handBtn.style.cssText = [
    'position:fixed',
    'top:max(20px, env(safe-area-inset-top))',
    'left:max(20px, env(safe-area-inset-left))',
    'z-index:300',
    'width:46px',
    'height:46px',
    'border-radius:50%',
    'background:rgba(40,24,12,.5)',
    'border:1px solid rgba(217,178,122,.3)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'cursor:pointer',
    'padding:0',
    'outline:none',
    'opacity:0',
    'pointer-events:none',
    'transition:background .25s ease, border-color .25s ease, transform .25s ease, opacity .5s ease',
    '-webkit-tap-highlight-color:transparent',
  ].join(';');

  handBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
         stroke="#f7f0e1" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
    </svg>`;

  handBtn.addEventListener('pointerdown', (e) => {
    // Не даём событию уйти на canvas
    e.stopPropagation();
  });
  handBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePanMode();
  });

  document.body.appendChild(handBtn);
}

function togglePanMode(){
  panMode = !panMode;
  if(handBtn){
    if(panMode){
      handBtn.style.background      = 'rgba(184,138,57,.85)';
      handBtn.style.borderColor     = 'rgba(255,217,138,.95)';
      handBtn.style.transform       = 'scale(1.06)';
    } else {
      handBtn.style.background      = 'rgba(40,24,12,.5)';
      handBtn.style.borderColor     = 'rgba(217,178,122,.3)';
      handBtn.style.transform       = 'scale(1)';
    }
  }
  if(!panMode){
    panStartCamPos = null;
    panStartTgtPos = null;
    panStartPointer = null;
  }
}

function updateHandVisibility(){
  if(!handBtn) return;
  const show = state.mode === 'reading';
  handBtn.style.opacity       = show ? '1' : '0';
  handBtn.style.pointerEvents = show ? 'auto' : 'none';
}

/* ============================================================
   HIT-ТЕСТ ГОЛОСА
   ============================================================ */
function tryVoiceClick(){
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
   HIT-ТЕСТ ВИДЕО
   ============================================================ */
function tryVideoClick(){
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

  createHandButton();
  setInterval(updateHandVisibility, 200);   // следим за state.mode

  /* --- флаг «палец на холсте» --- */
  sceneCanvas.addEventListener('pointerdown',   () => noteCanvasPointerDown(true),  true);
  sceneCanvas.addEventListener('pointerup',     () => noteCanvasPointerDown(false), true);
  sceneCanvas.addEventListener('pointercancel', () => noteCanvasPointerDown(false), true);

  /* --- CLICK — открытие обложки --- */
  sceneCanvas.addEventListener('click', (e) => {
    if(state.mode !== 'closed' || state.animating) return;
    pointerRay(e);
    const hit = raycaster.intersectObject(proxyCover, false);
    if(hit.length) openAlbum();
  });

  /* --- POINTERDOWN --- */
  sceneCanvas.addEventListener('pointerdown', (e) => {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    /* PINCH: два пальца — зум (работает в любом режиме) */
    if(activePointers.size === 2){
      if(state.drag){
        const sh = sheets[state.cur];
        if(sh) sh.mat.uniforms.uCurl.value = 0;
        state.drag = null;
        controls.enabled = true;
      }
      panStartCamPos = null;
      panStartTgtPos = null;
      panStartPointer = null;

      pinchStartDist = pinchGetDist();
      pinchStartCam  = cameraDistance();
      e.preventDefault();
      return;
    }

    if(state.animating) return;
    pointerRay(e);
    if(state.mode === 'closed') return;
    if(state.mode !== 'reading') return;

    /* РЕЖИМ «РУКА»: один палец — панорамирование */
    if(panMode){
      panStartCamPos   = camera.position.clone();
      panStartTgtPos   = controls.target.clone();
      panStartPointer  = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }

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

  /* --- POINTERMOVE --- */
  sceneCanvas.addEventListener('pointermove', (e) => {
    if(activePointers.has(e.pointerId)){
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    /* PINCH в процессе */
    if(activePointers.size === 2 && pinchStartDist > 0){
      const dist = pinchGetDist();
      if(dist > 0){
        const ratio = pinchStartDist / dist;
        dollyCamera(pinchStartCam * ratio);
      }
      return;
    }

    /* PAN в процессе (режим «рука») */
    if(panStartCamPos && panStartPointer){
      const dx = e.clientX - panStartPointer.x;
      const dy = e.clientY - panStartPointer.y;
      const k = cameraDistance() / 500;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
      const up    = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
      const offset = new THREE.Vector3()
        .addScaledVector(right, -dx * k)
        .addScaledVector(up,     dy * k);
      camera.position.copy(panStartCamPos).add(offset);
      controls.target.copy(panStartTgtPos).add(offset);
      return;
    }

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

  /* --- POINTERUP --- */
  sceneCanvas.addEventListener('pointerup', (e) => {
    activePointers.delete(e.pointerId);
    if(activePointers.size < 2) pinchStartDist = 0;

    if(panStartCamPos){
      panStartCamPos  = null;
      panStartTgtPos  = null;
      panStartPointer = null;
      return;
    }

    if(state.voiceScrub){ state.voiceScrub = null; return; }
    if(!state.drag) return;

    const d = state.drag;
    state.drag = null;
    controls.enabled = true;

    const sh    = sheets[state.cur];
    const fling = d.vel > 0.0035;

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

  /* --- POINTERCANCEL --- */
  sceneCanvas.addEventListener('pointercancel', (e) => {
    activePointers.delete(e.pointerId);
    if(activePointers.size < 2) pinchStartDist = 0;

    if(panStartCamPos){
      panStartCamPos  = null;
      panStartTgtPos  = null;
      panStartPointer = null;
      return;
    }

    if(state.voiceScrub){ state.voiceScrub = null; return; }
    if(state.drag){
      const sh = sheets[state.cur];
      sh.mat.uniforms.uCurl.value = 0;
      state.drag = null;
      controls.enabled = true;
    }
  });
}