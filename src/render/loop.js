import * as THREE from 'three';

import { state, sheets } from '@core/store.js';
import { updateTweens } from '@core/tween.js';
import { SCENE } from '@config/scene.js';

import { scene, camera, renderer, controls } from '@scene/setup.js';
import { albumG, stackR, stackL, TOTAL } from '@scene/album.js';
import { BASE_R, ALBUM_YAW } from '@scene/layout.js';
import { restY, stackHs } from '@scene/positions.js';
import { wrapFromTheta } from '@scene/sheets.js';
import { proxyR } from '@scene/proxies.js';
import { updatePopups } from '@scene/popups.js';
import { updateParticles, updateDust } from '@scene/particles.js';
import { HAS_RVFC, updateLiveVideosFallback } from './video.js';

const CTL = SCENE.controls;
const clock = new THREE.Clock();
let running = true;
let idleDir = -1;
let idleSpeed = 0;

/* ============================================================
   Idle-вращение обложки в закрытом состоянии
   ============================================================ */
let canvasPointerDown = false;
export function noteCanvasPointerDown(v){ canvasPointerDown = v; }

function updateIdleRotation(dt){
  if(state.mode !== 'closed' || state.animating || canvasPointerDown){
    idleSpeed += (0 - idleSpeed) * Math.min(1, dt * 2.5);
    return;
  }
  const TARGET = CTL.autoRotateSpeed;
  const RAMP   = 0.8;
  idleSpeed += (TARGET - idleSpeed) * Math.min(1, dt / RAMP);

  const tgt = controls.target;
  const dx = camera.position.x - tgt.x;
  const dz = camera.position.z - tgt.z;
  const r  = Math.hypot(dx, dz);
  if(r < 1e-4) return;

  let ang = Math.atan2(dx, dz);
  const minA = CTL.minAzimuthAngle;
  const maxA = CTL.maxAzimuthAngle;
  const soft = 0.25;
  const floor = 0.25;
  const dist = (idleDir > 0) ? (maxA - ang) : (ang - minA);
  const factor = Math.min(1, Math.max(floor, dist / soft));

  ang += idleDir * idleSpeed * dt * factor;

  if(ang >= maxA){ ang = maxA; idleDir = -1; idleSpeed *= 0.3; }
  else if(ang <= minA){ ang = minA; idleDir = 1; idleSpeed *= 0.3; }

  camera.position.x = tgt.x + Math.sin(ang) * r;
  camera.position.z = tgt.z + Math.cos(ang) * r;
}

/* ============================================================
   Основной цикл
   ============================================================ */
export function animate(){
  requestAnimationFrame(animate);
  if(!running) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = clock.elapsedTime;
  updateTweens(performance.now());

  const { r } = stackHs();
  const kS = 1 - Math.exp(-dt * 9);
  const targetR = Math.max(r, 0.0015);
  stackR.mesh.scale.y += (targetR - stackR.mesh.scale.y) * kS;
  if(stackR.mesh.scale.y > targetR) stackR.mesh.scale.y = targetR;
  stackR.mesh.position.y = BASE_R + stackR.mesh.scale.y / 2;
  stackR.sideTex.repeat.set(3, Math.max(0.02, stackR.mesh.scale.y * 180));
  stackR.mesh.visible = r > 0.0015;
  stackL.mesh.visible = false;

  const kY = 1 - Math.exp(-dt * 10);
  for(let i = 0; i < sheets.length; i++){
    const target = restY(i);
    const sh = sheets[i];
    const k = (state.drag && i === state.cur) ? 1 : kY;
    sh.mesh.position.y += (target - sh.mesh.position.y) * k;
    sh.mat.uniforms.uWrap.value = wrapFromTheta(sh.theta);
  }
  proxyR.position.y = restY(Math.min(state.cur, TOTAL - 1)) + 0.001;

  if(state.mode === 'closed' && !state.animating){
    albumG.position.y = 0.012 + Math.sin(t * 0.8) * 0.006;
  }
  updatePopups(dt);
  updateParticles(dt, t);
  updateDust(dt, t);
  if(!HAS_RVFC) updateLiveVideosFallback(performance.now());
  updateIdleRotation(dt);
  controls.update();
  renderer.render(scene, camera);
}

/* ============================================================
   Resize / visibility
   ============================================================ */
export function installRenderLifecycle(){
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if(running) clock.getDelta();
  });
}