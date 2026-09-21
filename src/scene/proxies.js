/* ============================================================
   scene/proxies.js
   Два невидимых меша для рейкаста:
     - proxyR      — виртуальная плоскость текущего разворота
                     (по ней ловим drag за уголок и тап по краям)
     - proxyCover  — виртуальная плоскость закрытой обложки
                     (по ней ловим клик «открыть альбом»)
   Сами меши не рисуются (material.visible = false), но участвуют
   в Raycaster.intersectObject() — это в разы дешевле, чем
   рейкастить сам шейдерный лист.
   ============================================================ */

import * as THREE from 'three';

import { albumG, coverTopY } from './album.js';
import { PAGE_W, PAGE_H, COVER_W, COVER_H, COVER_T } from './layout.js';

/* ============================================================
   PROXY ДЛЯ ЛИСТА
   Лежит горизонтально (rotation.x = -PI/2), выровнен по правой
   половине альбома — туда «падает» текущий лист при перелистывании.
   Позиция по Y обновляется в render/loop.js каждый кадр через
   restY(state.cur), чтобы прокси всегда был на высоте текущего листа.
   ============================================================ */
export const proxyR = new THREE.Mesh(
  new THREE.PlaneGeometry(PAGE_W, PAGE_H),
  new THREE.MeshBasicMaterial({ visible: false })
);
proxyR.rotation.x = -Math.PI / 2;
proxyR.position.x = PAGE_W / 2;
// position.y выставляется в render/loop.js → proxyR.position.y = restY(...) + 0.001
albumG.add(proxyR);

/* ============================================================
   PROXY ДЛЯ ЗАКРЫТОЙ ОБЛОЖКИ
   Лежит горизонтально на верхней плоскости передней обложки.
   Пока state.mode === 'closed' — по клику в этот прокси
   происходит openAlbum(). Как только альбом открылся, прокси
   перестаёт использоваться (см. interaction/pointer.js).
   ============================================================ */
export const proxyCover = new THREE.Mesh(
  new THREE.PlaneGeometry(COVER_W, COVER_H),
  new THREE.MeshBasicMaterial({ visible: false })
);
proxyCover.rotation.x = -Math.PI / 2;
proxyCover.position.set(
  COVER_W / 2 - 0.014,               // тот же сдвиг, что у coverBox / coverFace
  coverTopY + COVER_T / 2 + 0.002,   // чуть выше верхней плоскости обложки
  0
);
albumG.add(proxyCover);