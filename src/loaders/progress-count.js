/* ============================================================
   loaders/progress-count.js
   Считает, сколько задач реально попадёт в Progress.
   Собирает «дополнительные» ditem-источники из обложек,
   титула и closing-страниц — эти данные нужны и в media.js
   при загрузке декора, поэтому функция экспортируется.
   ============================================================ */

import {
  getPhotoKeys,
  getDecorKeySets,
  getVoiceFiles
} from './media.js';
import { getModelNames } from './models.js';

import {
  PAGES,
  COVER_FRONT, COVER_INNER, COVER_BACK,
  TITLE_PAGE, CLOSING_DEFAULTS
} from '@config/album.js';

/* ============================================================
   СОБИРАЕМ ВСЕ ditem-ИСТОЧНИКИ (key / src), КОТОРЫЕ ЕСТЬ
   НЕ ТОЛЬКО В PAGES, НО И В ОБЛОЖКАХ/ТИТУЛЕ/CLOSING
   ============================================================ */
export function collectDecoSources(){
  const out = [];
  const push = arr => {
    if(!arr) return;
    (Array.isArray(arr) ? arr : [arr]).forEach(d => {
      if(d && typeof d === 'object' && d.type === 'ditem') out.push(d);
    });
  };

  for(const p of PAGES){
    if(!p) continue;
    push(p.deco);
    if(Array.isArray(p.photos))   p.photos.forEach(ph => push(ph && ph.deco));
    if(Array.isArray(p.elements)) p.elements.forEach(el => {
      if(el && el.kind === 'ditem') out.push(el);
    });
  }

  push(COVER_FRONT.deco);
  push(COVER_INNER.deco);
  push(COVER_BACK.deco);
  push(TITLE_PAGE.deco);
  push(CLOSING_DEFAULTS.deco);

  return out;
}

/* ============================================================
   ПОДСЧЁТ
   4 — шрифты (см. main.js: loadAll → document.fonts.load ×4)
   ============================================================ */
export function preCountTasks(){
  const photoKeys  = getPhotoKeys();
  const voiceFiles = getVoiceFiles();
  const modelNames = getModelNames();

  const { keySet, srcSet } = getDecorKeySets();

  // доп. ditem-источники из обложек/титула/closing
  for(const d of collectDecoSources()){
    if(d.key) keySet.add(d.key);
    if(d.src) srcSet.add(d.src);
  }

  return 4
       + photoKeys.length
       + keySet.size
       + srcSet.size
       + voiceFiles.size
       + modelNames.size;
}