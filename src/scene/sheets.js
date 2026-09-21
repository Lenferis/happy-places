/* ============================================================
   scene/sheets.js
   Один лист = один ShaderMaterial + PlaneGeometry с вершинным
   смещением (bend). Плюс:
     - makeLiveCanvas    — offscreen canvas для видео
     - makeDropMesh      — 3D-меш для фото, которое «падает» в stack
     - wrapFromTheta     — маппинг угла поворота в uWrap-параметр
   ============================================================ */

import * as THREE from 'three';

import { drawStackPhotoAt } from '@paint/pages.js';
import { mkCanvas } from '@paint/utils.js';

import { albumG } from './album.js';
import { PAGE_W, PAGE_H } from './layout.js';
import { MAX_ANISO, SUN_DIR } from './setup.js';
import { texFromCanvas } from './utils.js';
import { BEND_DEFS, BEND_CHUNK, pageVert, pageFrag } from './shaders.js';

/* ============================================================
   ОБЩАЯ ГЕОМЕТРИЯ ЛИСТА
   Сдвинута вправо на PAGE_W/2, чтобы ось Y (корешок) была
   в точке x=0 — тогда поворот вокруг корешка работает «сам собой».
   ============================================================ */
export const sheetGeo = new THREE.PlaneGeometry(PAGE_W, PAGE_H, 64, 1);
sheetGeo.translate(PAGE_W / 2, 0, 0);

/* ============================================================
   ПУСТАЯ 1×1 ТЕКСТУРА — заглушка для uniform'ов mapFVideo/mapBVideo,
   когда на стороне нет видео.
   ============================================================ */
export const transparentTex = (() => {
  const c = mkCanvas(1, 1);
  c.getContext('2d').clearRect(0, 0, 1, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

/* ============================================================
   LIVE-КАНВАС ДЛЯ ВИДЕО
   Рисуем видео на offscreen canvas в половинном разрешении,
   потом заливаем в текстуру. Так дешевле, чем обновлять
   полноразмерный canvas каждый кадр.
   ============================================================ */
const LIVE_SCALE = 0.5;
const LIVE_W = Math.round(1024 * LIVE_SCALE);
const LIVE_H = Math.round(1312 * LIVE_SCALE);

export function makeLiveCanvas(){
  const c = mkCanvas(LIVE_W, LIVE_H);
  let ctx;
  try{ ctx = c.getContext('2d', { alpha: true, desynchronized: true }); }
  catch(e){ ctx = c.getContext('2d'); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = MAX_ANISO;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  return { c, ctx, t, scale: LIVE_SCALE };
}

/* ============================================================
   СОЗДАНИЕ ЛИСТА
   frontCanvas / backCanvas  — уже отрисованные 2D-канвасы страниц
   frontVideos / backVideos  — массив { el, cx, cy, tilt, mp }
                               для видео, которые надо оживить
   ============================================================ */
export function makeSheet(frontCanvas, backCanvas, idx, frontVideos, backVideos){
  const hasFront  = frontVideos.length > 0;
  const hasBack   = backVideos.length  > 0;
  const frontLive = hasFront ? makeLiveCanvas() : null;
  const backLive  = hasBack  ? makeLiveCanvas() : null;

  const mat = new THREE.ShaderMaterial({
    defines: {
      HAS_VIDEO_F: hasFront ? 1 : 0,
      HAS_VIDEO_B: hasBack  ? 1 : 0
    },
    uniforms: {
      mapF:      { value: texFromCanvas(frontCanvas) },
      mapB:      { value: texFromCanvas(backCanvas)  },
      mapFVideo: { value: frontLive ? frontLive.t : transparentTex },
      mapBVideo: { value: backLive  ? backLive.t  : transparentTex },
      uTheta:    { value: 0 },
      uCurl:     { value: 0 },
      uWrap:     { value: 0 },
      uSun:      { value: SUN_DIR }
    },
    vertexShader:   pageVert,
    fragmentShader: pageFrag,
    side: THREE.DoubleSide
  });

  // mapF — то же самое, что uniforms.mapF.value. Удобный shortcut.
  mat.mapF = mat.uniforms.mapF.value;
  [mat.uniforms.mapF.value, mat.uniforms.mapB.value].forEach(t => { t.anisotropy = 4; });

  const mesh = new THREE.Mesh(sheetGeo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = true;

  // depth-материал с тем же смещением вершин, что и основной шейдер.
  // Без этого тени ложатся на «плоскую» геометрию, а не на изогнутую.
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depth.onBeforeCompile = (shader) => {
    shader.uniforms.uTheta = mat.uniforms.uTheta;
    shader.uniforms.uCurl  = mat.uniforms.uCurl;
    shader.uniforms.uWrap  = mat.uniforms.uWrap;
    shader.vertexShader = (BEND_DEFS + shader.vertexShader)
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n' + BEND_CHUNK + '\ntransformed = bent;\n'
      );
  };
  mesh.customDepthMaterial = depth;
  albumG.add(mesh);

  // Объединяем видео обеих сторон в один список с пометкой side.
  const videos = [];
  frontVideos.forEach(v => videos.push({ ...v, side: 'front' }));
  backVideos.forEach(v  => videos.push({ ...v, side: 'back'  }));

  return {
    mesh, mat, theta: 0, idx, videos,
    liveFront: frontLive, liveBack: backLive,
    frontCanvas, backCanvas,
    frontTex: mat.uniforms.mapF.value,
    backTex:  mat.uniforms.mapB.value,
    stackPhotos: null, stackCount: 0, stackStyle: 'fall', pageNumValue: 0,
    paperCanvas: null, dropMeshes: [], pageText: null,
    voicesFront: [], voicesBack: []
  };
}

/* ============================================================
   МАППИНГ УГЛА → WRAP
   Пока лист почти не повёрнут — uWrap = 0 (плоский).
   Когда доходит до ~30% поворота — начинается «закрутка» края.
   Сглаживание через smoothstep, чтобы не было рывка.
   ============================================================ */
export function wrapFromTheta(th){
  const k = th / Math.PI;
  const x = Math.max(0, Math.min(1, (k - 0.30) / 0.70));
  return x * x * (3 - 2 * x);
}

/* ============================================================
   DROP-МЕШ ДЛЯ STACK-СТРАНИЦ
   Отдельный плоский меш, который летит из точки старта к месту
   падения в стопку. Геометрия — та же плоскость, что у листа,
   но без шейдерного изгиба.
   ============================================================ */
export const stackDropGeo = new THREE.PlaneGeometry(PAGE_W, PAGE_H);
stackDropGeo.rotateX(-Math.PI / 2);

export function makeDropMesh(p){
  // Отрисовываем фото один раз в canvas размером со всю страницу.
  // Так не нужно возиться с материалом/рамками при анимации.
  const cv = mkCanvas(1024, 1312);
  const g  = cv.getContext('2d');
  drawStackPhotoAt(g, p, 0.5, 0.5, 0, p.w != null ? p.w : 0.55);

  const tex = texFromCanvas(cv);
  tex.anisotropy = 4;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.02,
    roughness: 0.85,
    metalness: 0.02,
    side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(stackDropGeo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  const group = new THREE.Group();
  group.add(mesh);
  group.visible = false;

  return { group, mesh, tex };
}

/* ============================================================
   РЕ-ЭКСПОРТ
   ============================================================ */
export { TOTAL } from './album.js';