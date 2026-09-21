import * as THREE from 'three';

import { SCENE } from '@config/scene.js';
import { IMGS, tableDecor } from '@core/store.js';
import { prepareModelInstance } from '@loaders/models.js';
import { scene } from './setup.js';

/* ============================================================
   ПРОП ИЗ IMGS.items — плоский спрайт на столе
   ============================================================ */
export function tableDecorProp(key, x, z, size, rot, tilt, y, alphaTest){
  const src = IMGS.items[key]; if(!src) return null;
  const tex = new THREE.CanvasTexture(src);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true,
    alphaTest: alphaTest == null ? 0.28 : alphaTest,
    roughness: 0.88, metalness: 0.0,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  const depth = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: mat.alphaTest
  });
  mesh.customDepthMaterial = depth;
  mesh.rotation.x = -Math.PI/2 + (tilt || 0);
  mesh.rotation.z = rot || 0;
  mesh.position.set(x, y == null ? 0.012 + Math.random() * 0.004 : y, z);
  mesh.castShadow = false; mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

/* ============================================================
   МОДЕЛЬ НА СТОЛЕ
   ============================================================ */
export function tableDecorModel(name, x, z, size, rot, y, opts){
  const src = IMGS.models[name];
  if(!src) return null;
  const inst = prepareModelInstance(src, Object.assign({ size }, opts || {}));
  const box = new THREE.Box3().setFromObject(inst);
  const yBase = y != null ? y : 0;
  inst.position.y += yBase - box.min.y;
  const group = new THREE.Group();
  group.add(inst);
  group.position.set(x, 0, z);
  group.rotation.y = rot || 0;
  scene.add(group);
  return group;
}

/* ============================================================
   ОБХОД SCENE.props
   ============================================================ */
export function buildTableDecor(){
  const props = SCENE.props || [];
  props.forEach(p => {
    if(!p || !p.at) return;
    if(p.model){
      const m = tableDecorModel(p.model, p.at[0], p.at[1],
        p.size != null ? p.size : 0.2, p.rot, p.y, p);
      if(m) tableDecor.push(m);
      return;
    }
    if(p.key){
      const m = tableDecorProp(p.key, p.at[0], p.at[1],
        p.size != null ? p.size : 0.7,
        p.rot  != null ? p.rot  : 0,
        p.tilt != null ? p.tilt : 0,
        p.y);
      if(m) tableDecor.push(m);
    }
  });
}