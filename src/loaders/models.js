import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader }   from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

import { MODELS_DIR, MODEL_EXTS } from '@config/paths.js';
import { SCENE }  from '@config/scene.js';
import { PAGES }  from '@config/album.js';
import { IMGS }   from '@core/store.js';
import { Progress } from '@core/progress.js';
import { logAsset } from '@core/warnings.js';

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

export async function loadModelByName(name){
  if(!name) return null;
  if(IMGS.models[name]) return IMGS.models[name];
  for(const ext of MODEL_EXTS){
    const path = MODELS_DIR + name + '.' + ext;
    try{
      const gltf = await gltfLoader.loadAsync(path);
      IMGS.models[name] = gltf.scene;
      console.log('[album] model loaded:', path);
      return gltf.scene;
    }catch(e){
      console.error('[album] model fail:', path, e);
    }
  }
  logAsset('model "' + name + '" не знайдено у ' + MODELS_DIR, 'warn');
  return null;
}

export function getModelNames(){
  const names = new Set();
  (SCENE.props || []).forEach(p => { if(p && p.model) names.add(p.model); });
  for(const page of PAGES){
    if(page && Array.isArray(page.elements)){
      page.elements.forEach(el => { if(el && el.kind === 'model' && el.model) names.add(el.model); });
    }
  }
  return names;
}

export async function loadAllModels(){
  const names = getModelNames();
  if(!names.size) return;
  await Promise.all(Array.from(names).map(name =>
    loadModelByName(name).finally(() => Progress.tick())
  ));
}

// Готовит клон модели с масштабом/тинтом — вынесено из scene/models.js,
// потому что логически это свойство загрузчика, а не сцены.
export function prepareModelInstance(gltfScene, opts){
  opts = opts || {};
  const inst = gltfScene.clone(true);
  const wantTint = !!(opts.tint || opts.desaturate);
  const castShadow = opts.castShadow !== false;
  inst.traverse(child => {
    if(!child.isMesh) return;
    child.castShadow = castShadow;
    child.receiveShadow = true;
    if(wantTint){
      const cloneAndTint = (m) => {
        const c = m.clone();
        if(c.color){
          if(opts.tint) c.color.multiply(new THREE.Color(opts.tint));
          if(opts.desaturate) c.color.lerp(new THREE.Color(0.5, 0.5, 0.5), opts.desaturate);
        }
        c.needsUpdate = true;
        return c;
      };
      if(Array.isArray(child.material)) child.material = child.material.map(cloneAndTint);
      else if(child.material) child.material = cloneAndTint(child.material);
    }
  });
  if(opts.size != null){
    const box = new THREE.Box3().setFromObject(inst);
    const sz = new THREE.Vector3();
    box.getSize(sz);
    const maxDim = Math.max(sz.x, sz.y, sz.z);
    if(maxDim > 0) inst.scale.multiplyScalar(opts.size / maxDim);
  }
  return inst;
}