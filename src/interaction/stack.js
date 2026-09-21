import { state, sheets } from '@core/store.js';
import { addTween, easeOutCubic, easeInCubic } from '@core/tween.js';
import { sfxDrop, sfxFlip } from '@core/audio.js';

import { TW, TH, mkCanvas, rnd } from '@paint/utils.js';
import { paintBg } from '@paint/backgrounds.js';
import { drawStackPhoto, pageNum } from '@paint/pages.js';
import { paintTextBlock } from '@paint/text.js';
import { normalizeDeco, drawDecoItem } from '@paint/decor-items.js';

import { restY } from '@scene/positions.js';
import { PAGE_W, PAGE_H } from '@scene/layout.js';

import { updateUI } from './ui.js';

/* ============================================================
   Запекание статической части stack-страницы
   ============================================================ */
export function bakeStackSheet(sh){
  if(!sh.stackPhotos || !sh.frontCanvas) return;
  if(!sh.frontTex || !sh.frontTex.image) return;
  const g = sh.frontCanvas.getContext('2d');
  g.clearRect(0, 0, TW, TH);
  g.drawImage(sh.paperCanvas, 0, 0);
  for(let i = 0; i < sh.stackCount; i++) drawStackPhoto(g, sh.stackPhotos[i]);
  if(sh.pageText){
    const list = Array.isArray(sh.pageText) ? sh.pageText : [sh.pageText];
    list.forEach(t => paintTextBlock(g, TW, TH, t));
  }
  pageNum(g, sh.pageNumValue || 0);
  sh.frontTex.needsUpdate = true;
}

/* ============================================================
   Мировые координаты — куда падает фото
   ============================================================ */
function stackTargetWorld(item){
  return {
    x: (item.x != null ? item.x : 0.5) * PAGE_W,
    z: PAGE_H * ((item.y != null ? item.y : 0.4) - 0.5)
  };
}

function computeDropStart(style, item, target, targetY){
  if(style === 'fan'){
    const ox = item.fromX != null ? item.fromX : 0.5;
    const oy = item.fromY != null ? item.fromY : 0.5;
    return {
      x: ox * PAGE_W + rnd(-0.06, 0.06),
      y: targetY + rnd(0.04, 0.12),
      z: PAGE_H * (oy - 0.5) + rnd(-0.06, 0.06),
      rotY: rnd(-Math.PI, Math.PI),
      scale: 0.28, arc: 0.12
    };
  }
  if(style === 'sweep'){
    const ox = item.fromX != null ? item.fromX : -0.25;
    const oy = item.fromY != null ? item.fromY : 0.5;
    return {
      x: ox * PAGE_W + rnd(-0.04, 0.04),
      y: targetY + rnd(0.15, 0.28),
      z: PAGE_H * (oy - 0.5) + rnd(-0.04, 0.04),
      rotY: -0.7 + rnd(-0.25, 0.25),
      scale: 0.85, arc: 0.08
    };
  }
  return {
    x: target.x + rnd(-0.12, 0.12),
    y: targetY + 0.9 + rnd(0, 0.2),
    z: target.z + rnd(-0.06, 0.06),
    rotY: rnd(-0.55, 0.55),
    scale: 1, arc: 0
  };
}

/* ============================================================
   Бросок следующего фото стопки
   ============================================================ */
export function startStackDrop(sh){
  if(state.animating) return false;
  const idx = sh.stackCount;
  const item = sh.stackPhotos[idx];
  const dm = sh.dropMeshes[idx - 1];
  if(!item || !dm) return false;
  state.animating = true;
  sfxDrop();

  const style = sh.stackStyle || 'fall';
  const target = stackTargetWorld(item);
  const targetY = restY(state.cur) + 0.0015;
  const targetRotY = (item.rot || 0) * Math.PI / 180;
  const start = computeDropStart(style, item, target, targetY);

  dm.group.visible = true;
  dm.group.position.set(start.x, start.y, start.z);
  dm.group.rotation.set(0, start.rotY, 0);
  dm.group.scale.setScalar(start.scale);

  if(state.reduced){
    dm.group.visible = false;
    sh.stackCount++;
    bakeStackSheet(sh);
    state.animating = false;
    updateUI();
    return true;
  }

  addTween({
    dur: 950, ease: easeOutCubic,
    onUpdate(v){
      dm.group.position.x = start.x + (target.x - start.x) * v;
      dm.group.position.z = start.z + (target.z - start.z) * v;
      const arc = start.arc ? Math.sin(v * Math.PI) * start.arc : 0;
      dm.group.position.y = start.y + (targetY - start.y) * v + arc;
      dm.group.scale.setScalar(start.scale + (1 - start.scale) * v);
      const wobble = (1 - v) * Math.sin(v * Math.PI * 3);
      dm.group.rotation.x = wobble * 0.28;
      dm.group.rotation.z = wobble * 0.20;
      dm.group.rotation.y = start.rotY + (targetRotY - start.rotY) * v + (1 - v) * wobble * 0.15;
    },
    onDone(){
      dm.group.visible = false;
      dm.group.rotation.set(0, 0, 0);
      dm.group.scale.setScalar(1);
      sh.stackCount++;
      bakeStackSheet(sh);
      state.animating = false;
      sfxFlip();
      updateUI();
    }
  });
  return true;
}

/* ============================================================
   Возврат предыдущего фото обратно
   ============================================================ */
export function startStackPop(sh){
  if(state.animating) return false;
  const idx = sh.stackCount - 1;
  if(idx < 1) return false;
  const item = sh.stackPhotos[idx];
  const dm = sh.dropMeshes[idx - 1];
  if(!item || !dm) return false;
  state.animating = true;
  sfxFlip();
  sh.stackCount--;
  bakeStackSheet(sh);

  const style = sh.stackStyle || 'fall';
  const start = stackTargetWorld(item);
  const startY = restY(state.cur) + 0.0015;
  const startRotY = (item.rot || 0) * Math.PI / 180;

  dm.group.visible = true;
  dm.group.position.set(start.x, startY, start.z);
  dm.group.rotation.set(0, startRotY, 0);
  dm.group.scale.setScalar(1);

  if(state.reduced){
    dm.group.visible = false;
    state.animating = false;
    updateUI();
    return true;
  }

  const returnPos = computeDropStart(style, item, start, startY);
  addTween({
    dur: 700, ease: easeInCubic,
    onUpdate(v){
      dm.group.position.x = start.x + (returnPos.x - start.x) * v;
      dm.group.position.z = start.z + (returnPos.z - start.z) * v;
      const arc = returnPos.arc ? Math.sin(v * Math.PI) * returnPos.arc : 0;
      dm.group.position.y = startY + (returnPos.y - startY) * v + arc;
      dm.group.scale.setScalar(1 + (returnPos.scale - 1) * v);
      const wobble = v * Math.sin(v * Math.PI * 3);
      dm.group.rotation.x = wobble * 0.30;
      dm.group.rotation.z = wobble * 0.22;
      dm.group.rotation.y = startRotY + (returnPos.rotY - startRotY) * v;
    },
    onDone(){
      dm.group.visible = false;
      dm.group.rotation.set(0, 0, 0);
      dm.group.scale.setScalar(1);
      state.animating = false;
      updateUI();
    }
  });
  return true;
}