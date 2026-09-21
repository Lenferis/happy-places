import * as THREE from 'three';

export function texFromCanvas(canvas, srgb){
  const t = new THREE.CanvasTexture(canvas);
  if(srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}