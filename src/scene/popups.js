import * as THREE from 'three';

import { IMGS, popupRegistry, state, sheets } from '@core/store.js';
import { mkCanvas } from '@paint/utils.js';
import { drawPhoto } from '@paint/photos.js';
import { PHOTO_ASPECT } from '@config/theme.js';
import { prepareModelInstance } from '@loaders/models.js';

import { albumG } from './album.js';
import { PAGE_W, PAGE_H } from './layout.js';

/* ============================================================
   ОФФСКРИН-РЕНДЕР ФОТО ДЛЯ POPUP-МЕША
   ============================================================ */
const PX_PER_M = 900;

function renderPopupPhotoCanvas(img, pwM, frameType, aspect, caption){
  const pwPx = Math.max(64, Math.round(pwM * PX_PER_M));
  const probe = mkCanvas(4, 4);
  const probeCtx = probe.getContext('2d');
  const bbox = drawPhoto(probeCtx, img, 0, 0, pwPx, 0, caption || '', frameType, aspect);
  const cvW = Math.max(2, Math.ceil(bbox.w));
  const cvH = Math.max(2, Math.ceil(bbox.h));
  const cv = mkCanvas(cvW, cvH);
  const ctx = cv.getContext('2d');
  drawPhoto(ctx, img, cvW/2, cvH/2, pwPx, 0, caption || '', frameType, aspect);
  return { canvas: cv, wM: cvW / PX_PER_M, hM: cvH / PX_PER_M };
}

/* ============================================================
   СОЗДАНИЕ МЕША ДЛЯ ОДНОГО ЭЛЕМЕНТА
   ============================================================ */
export function createPopupMesh(def){
  if(!def || !def.kind) return null;

  if(def.kind === 'photo'){
    const img = IMGS.photos[def.img]; if(!img) return null;
    const frame  = def.frame  || 'polaroid';
    const aspect = def.aspect || PHOTO_ASPECT;
    const pwM    = (def.w != null ? def.w : 0.4) * PAGE_W;
    const { canvas: cv, wM, hM } = renderPopupPhotoCanvas(img, pwM, frame, aspect, def.caption);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const geo = new THREE.PlaneGeometry(wM, hM);
    geo.translate(0, hM / 2, 0);
    const mat = new THREE.MeshStandardMaterial({
      map: tex, alphaTest: 0.5, roughness: 0.85, metalness: 0.02, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  if(def.kind === 'ditem'){
    const src = IMGS.items[def.key]; if(!src) return null;
    const iw = src.naturalWidth  || src.width  || 1;
    const ih = src.naturalHeight || src.height || 1;
    const sizeM = (def.size != null ? def.size : 0.2) * PAGE_W;
    const maxDim = Math.max(iw, ih);
    const k = sizeM / maxDim;
    const wM = iw * k, hM = ih * k;
    const tex = new THREE.CanvasTexture(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const geo = new THREE.PlaneGeometry(wM, hM);
    geo.translate(0, hM / 2, 0);
    const mat = new THREE.MeshStandardMaterial({
      map: tex, alphaTest: 0.28, roughness: 0.88, metalness: 0.0, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    const depth = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.28
    });
    mesh.customDepthMaterial = depth;
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  if(def.kind === 'model'){
    const src = IMGS.models[def.model]; if(!src) return null;
    const inst = prepareModelInstance(src, {
      size: def.size != null ? def.size : 0.15,
      tint: def.tint, desaturate: def.desaturate, castShadow: true
    });
    const box = new THREE.Box3().setFromObject(inst);
    inst.position.y -= box.min.y;
    const grp = new THREE.Group();
    grp.add(inst);
    return grp;
  }
  return null;
}

/* ============================================================
   РЕГИСТРАЦИЯ ПОПАПОВ ЛИСТА
   ============================================================ */
export function registerSheetPopups(sheetIdx, side, defs){
  const sh = sheets[sheetIdx];
  if(!sh || !defs || !defs.length) return;
  const group = new THREE.Group();
  albumG.add(group);
  const entry = { sheetIdx, side, defs: [], group };
  defs.forEach((def) => {
    const mesh = createPopupMesh(def);
    if(!mesh) return;
    const hingeGroup = new THREE.Group();
    group.add(hingeGroup);
    const rotator = new THREE.Group();
    hingeGroup.add(rotator);
    rotator.add(mesh);
    rotator.position.z = side === 'front' ? 0.001 : -0.001;
    entry.defs.push({
      def, hingeGroup, rotator, mesh,
      maxAngle: (def.angle != null ? def.angle : 90) * Math.PI / 180,
      currentP: 0
    });
  });
  if(entry.defs.length) popupRegistry.push(entry);
}

/* ============================================================
   ОБНОВЛЕНИЕ УГЛОВ POPUP'ОВ
   ============================================================ */
const _popX = new THREE.Vector3();
const _popY = new THREE.Vector3();
const _popZ = new THREE.Vector3();
const _popM = new THREE.Matrix4();
const _popQ = new THREE.Quaternion();

export function updatePopups(dt){
  if(!popupRegistry.length) return;
  const k = 1 - Math.exp(-dt * 9);
  for(const entry of popupRegistry){
    const sh = sheets[entry.sheetIdx];
    if(!sh) continue;
    const isFront = entry.side === 'front';
    const theta = sh.theta;
    const sheetY = sh.mesh.position.y;
    const cb = Math.cos(theta);
    const sb = Math.sin(theta);

    let target = 0;
    if(isFront && state.cur === entry.sheetIdx)       target = Math.max(0,  cb);
    else if(!isFront && state.cur === entry.sheetIdx + 1) target = Math.max(0, -cb);

    _popX.set(cb, sb, 0);
    _popY.set(0, 0, -1);
    _popZ.crossVectors(_popX, _popY);
    _popM.makeBasis(_popX, _popY, _popZ);
    _popQ.setFromRotationMatrix(_popM);

    const sign = isFront ? 1 : -1;
    for(const el of entry.defs){
      el.currentP += (target - el.currentP) * k;
      const uCanvas = el.def.at.x;
      const v       = el.def.at.y;
      const uGeom   = isFront ? uCanvas : (1 - uCanvas);
      const geomX   = uGeom * PAGE_W;
      const geomY   = PAGE_H * (0.5 - v);
      const px = geomX * cb;
      const py = sheetY + geomX * sb;
      const pz = -geomY;
      el.hingeGroup.position.set(px, py, pz);
      el.hingeGroup.quaternion.copy(_popQ);
      el.rotator.rotation.x = sign * el.currentP * el.maxAngle;
    }
  }
}