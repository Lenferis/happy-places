/* ============================================================
   scene/album.js
   Создаёт всю 3D-геометрию альбома: группу, обложки, корешок,
   стопки бумаги под обложкой. Ничего не рисует — только меши.
   Текстуры обложек применяются позже, через applyCoverTextures()
   из main.js (после загрузки IMGS.items.rose и т.п.).
   ============================================================ */

import * as THREE from 'three';

import { PAGES } from '@config/album.js';
import { mkCanvas, rnd } from '@paint/utils.js';
import { paintSpine, paintStackSide } from '@paint/backgrounds.js';
import { paintCoverFront, paintCoverInner, paintCoverBack } from '@paint/pages.js';

import { scene } from './setup.js';
import { texFromCanvas } from './utils.js';
import {
  PAGE_W, PAGE_H, COVER_W, COVER_H, COVER_T,
  TH_, BASE_R, ALBUM_YAW
} from './layout.js';

/* ============================================================
   СКОЛЬКО ЛИСТОВ (разворотов) В АЛЬБОМЕ
   ============================================================ */
export const TOTAL = Math.floor(PAGES.length / 2);

/* ============================================================
   ГРУППА АЛЬБОМА
   ============================================================ */
export const albumG = new THREE.Group();
albumG.rotation.y = ALBUM_YAW;
albumG.position.y = 0.012;
scene.add(albumG);

/* ============================================================
   ЗАДНЯЯ ОБЛОЖКА
   ============================================================ */
const leatherMat  = new THREE.MeshStandardMaterial({ color: 0x5e2c15, roughness: 0.72, metalness: 0.05 });
const leatherMat2 = new THREE.MeshStandardMaterial({ color: 0x4c2210, roughness: 0.75, metalness: 0.05 });

const backCover = new THREE.Mesh(
  new THREE.BoxGeometry(COVER_W, COVER_T, COVER_H),
  [leatherMat, leatherMat, leatherMat2, leatherMat2, leatherMat, leatherMat]
);
backCover.position.set(COVER_W/2 - 0.014, COVER_T/2, 0);
backCover.castShadow = true;
backCover.receiveShadow = true;
albumG.add(backCover);

export const backEndMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
export const backEnd = new THREE.Mesh(
  new THREE.PlaneGeometry(COVER_W - 0.012, COVER_H - 0.012),
  backEndMat
);
backEnd.rotation.x = -Math.PI/2;
backEnd.position.set(COVER_W/2 - 0.014, COVER_T + 0.0008, 0);
backEnd.receiveShadow = true;
albumG.add(backEnd);

/* ============================================================
   ПЕРЕДНЯЯ ОБЛОЖКА — ПИВОТ + МЕШИ
   ============================================================ */
export const coverPivot = new THREE.Group();
export const coverTopY = BASE_R + (TOTAL - 1) * TH_ + 0.002;
coverPivot.position.y = coverTopY;
albumG.add(coverPivot);

const bookTopY      = coverTopY + COVER_T / 2;
const bookThickness = bookTopY;
const SPINE_BULGE   = 0.012;

/* ---- Корешок ---- */
const spineTex = texFromCanvas(paintSpine());
spineTex.wrapS = spineTex.wrapT = THREE.ClampToEdgeWrapping;

export const spineMat = new THREE.MeshStandardMaterial({
  map: spineTex, roughness: 0.62, metalness: 0.14,
  side: THREE.FrontSide, transparent: true, opacity: 1
});

const spineGeo = new THREE.CylinderGeometry(
  bookThickness / 2, bookThickness / 2, COVER_H,
  40, 1, true, -Math.PI, Math.PI
);
spineGeo.rotateX(Math.PI / 2);
spineGeo.scale(SPINE_BULGE / (bookThickness / 2), 1, 1);
spineGeo.translate(-0.014, bookThickness / 2, 0);

export const spine = new THREE.Mesh(spineGeo, spineMat);
spine.castShadow = false;
spine.receiveShadow = false;
albumG.add(spine);

export const spineInnerMat = new THREE.MeshStandardMaterial({
  color: 0x2a1408, roughness: 0.96, metalness: 0.0,
  transparent: true, opacity: 1
});
export const spineInner = new THREE.Mesh(
  new THREE.PlaneGeometry(COVER_H, bookThickness),
  spineInnerMat
);
spineInner.rotation.y = Math.PI / 2;
spineInner.position.set(-0.0138, bookThickness / 2, 0);
spineInner.receiveShadow = false;
albumG.add(spineInner);

/* ============================================================
   СТОПКИ БУМАГИ ПОД ОБЛОЖКОЙ
   ============================================================ */
const stackSideTex0 = texFromCanvas(paintStackSide());
stackSideTex0.wrapS = stackSideTex0.wrapT = THREE.RepeatWrapping;

function makeStack(x){
  const sideTex = stackSideTex0.clone();
  sideTex.needsUpdate = true;
  sideTex.wrapS = sideTex.wrapT = THREE.RepeatWrapping;

  const topCanvas = mkCanvas(256, 256);
  const tg = topCanvas.getContext('2d');
  tg.fillStyle = '#efe5cf';
  tg.fillRect(0, 0, 256, 256);
  for(let i = 0; i < 300; i++){
    tg.fillStyle = `rgba(140,100,55,${rnd(.02, .06)})`;
    tg.fillRect(rnd(0, 256), rnd(0, 256), rnd(1, 3), rnd(1, 3));
  }
  const topTex = new THREE.CanvasTexture(topCanvas);
  topTex.colorSpace = THREE.SRGBColorSpace;

  const mats = [
    new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.92 }),
    new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.92 }),
    new THREE.MeshStandardMaterial({ map: topTex,  roughness: 0.94 }),
    new THREE.MeshStandardMaterial({ color: 0x8f7a55, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.92 }),
    new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.92 })
  ];
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(PAGE_W - 0.006, 1, PAGE_H - 0.008),
    mats
  );
  m.position.x = x;
  m.castShadow = true;
  m.receiveShadow = true;
  albumG.add(m);
  return { mesh: m, sideTex };
}

export const stackR = makeStack( PAGE_W/2 - 0.004);
export const stackL = makeStack(-PAGE_W/2 + 0.004);

stackR.mesh.scale.y = (TOTAL - 1) * TH_;
stackL.mesh.scale.y = 0.0015;
stackL.mesh.visible  = false;

/* ============================================================
   ПЕРЕДНЯЯ ОБЛОЖКА (меш)
   ============================================================ */
const coverEdgeMat = new THREE.MeshStandardMaterial({ color: 0x542612, roughness: 0.72 });

export const coverBox = new THREE.Mesh(
  new THREE.BoxGeometry(COVER_W, COVER_T, COVER_H),
  [
    coverEdgeMat, coverEdgeMat,
    new THREE.MeshStandardMaterial({ color: 0x6b3018, roughness: 0.62, metalness: 0.08 }),
    coverEdgeMat, coverEdgeMat, coverEdgeMat
  ]
);
coverBox.position.set(COVER_W/2 - 0.014, 0, 0);
coverBox.castShadow = true;
coverBox.receiveShadow = true;
coverPivot.add(coverBox);

export const coverFace = new THREE.Mesh(
  new THREE.PlaneGeometry(COVER_W - 0.006, COVER_H - 0.006),
  new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.08 })
);
coverFace.rotation.x = -Math.PI/2;
coverFace.position.set(COVER_W/2 - 0.014, COVER_T/2 + 0.0007, 0);
coverFace.receiveShadow = true;
coverPivot.add(coverFace);

export const coverInner = new THREE.Mesh(
  new THREE.PlaneGeometry(COVER_W - 0.012, COVER_H - 0.012),
  new THREE.MeshStandardMaterial({ roughness: 0.9 })
);
coverInner.rotation.set(Math.PI/2, 0, Math.PI);
coverInner.position.set(COVER_W/2 - 0.014, -COVER_T/2 - 0.0008, 0);
coverInner.receiveShadow = true;
coverPivot.add(coverInner);

/* ============================================================
   ПРИМЕНЕНИЕ ТЕКСТУР ОБЛОЖКИ
   Вызывается из main.js ПОСЛЕ загрузки ассетов (нужен IMGS.items.rose).
   ============================================================ */
export function applyCoverTextures(){
  backEndMat.map = texFromCanvas(paintCoverBack());
  backEndMat.needsUpdate = true;

  coverFace.material.map = texFromCanvas(paintCoverFront());
  coverFace.material.needsUpdate = true;

  coverInner.material.map = texFromCanvas(paintCoverInner());
  coverInner.material.needsUpdate = true;
}

/* ============================================================
   РЕ-ЭКСПОРТ КОНСТАНТ (чтобы не тянуть layout.js там, где и
   так импортируют album.js)
   ============================================================ */
export { COVER_W, COVER_H, COVER_T };