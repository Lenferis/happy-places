import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { SCENE } from '@config/scene.js';
import { mkCanvas, rnd } from '@paint/utils.js';
import { paintWood, paintLinen } from '@paint/backgrounds.js';
import { texFromCanvas } from './utils.js';

/* ============================================================
   RENDERER
   ============================================================ */
const canvas = document.getElementById('scene');

export let renderer;
try{
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'high-performance'
  });
}catch(e){
  document.getElementById('fallback').style.display = 'flex';
  document.getElementById('loader').classList.add('hidden');
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = SCENE.exposure != null ? SCENE.exposure : 1.12;

export const SHADOWS_ENABLED = !!(SCENE.lights && SCENE.lights.sun && SCENE.lights.sun.castShadow);
renderer.shadowMap.enabled = SHADOWS_ENABLED;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

/* ============================================================
   SCENE + BACKGROUND
   ============================================================ */
export const scene = new THREE.Scene();
{
  const bgCfg = SCENE.background || {};
  const bc = mkCanvas(512, 512), bg = bc.getContext('2d');
  if(bgCfg.type === 'plain'){
    bg.fillStyle = bgCfg.color || '#1a100a'; bg.fillRect(0, 0, 512, 512);
  } else {
    const colors = bgCfg.colors || ['#4a2c15', '#2c1a0c', '#150c05'];
    const inner  = bgCfg.inner  || [300, 170, 40];
    const center = bgCfg.center || [256, 256, 380];
    const rg = bg.createRadialGradient(inner[0], inner[1], inner[2], center[0], center[1], center[2]);
    colors.forEach((c, i) => {
      const stop = colors.length === 1 ? 0 : i / (colors.length - 1);
      rg.addColorStop(stop, c);
    });
    bg.fillStyle = rg; bg.fillRect(0, 0, 512, 512);
  }
  const bt = new THREE.CanvasTexture(bc);
  bt.colorSpace = THREE.SRGBColorSpace;
  scene.background = bt;
  if(SCENE.fog) scene.fog = new THREE.Fog(SCENE.fog.color, SCENE.fog.near, SCENE.fog.far);
}

/* ============================================================
   CAMERA + CONTROLS
   ============================================================ */
const CAM = SCENE.camera;
export const camera = new THREE.PerspectiveCamera(CAM.fov, window.innerWidth/window.innerHeight, CAM.near, CAM.far);
export function isPortrait(){ return window.innerHeight > window.innerWidth; }
export function fitCamera(v){ return isPortrait() ? v.multiplyScalar(1.55) : v; }
camera.position.copy(fitCamera(new THREE.Vector3().fromArray(CAM.home)));

const CTL = SCENE.controls;
export const controls = new OrbitControls(camera, canvas);
const homeTgt = isPortrait() && CAM.homeTargetPortrait ? CAM.homeTargetPortrait : CAM.homeTarget;
controls.target.set(homeTgt[0], homeTgt[1], 0);
controls.enableDamping   = true;
controls.dampingFactor   = 0.06;
controls.enablePan       = false;
controls.minDistance     = CTL.minDistance;
controls.maxDistance     = CTL.maxDistance;
controls.minPolarAngle   = CTL.minPolarAngle;
controls.maxPolarAngle   = CTL.maxPolarAngle;
controls.minAzimuthAngle = CTL.minAzimuthAngle;
controls.maxAzimuthAngle = CTL.maxAzimuthAngle;
controls.autoRotate      = false;
controls.autoRotateSpeed = CTL.autoRotateSpeed;
controls.update();

export const CAM_HOME = camera.position.clone();
export const TGT_HOME = controls.target.clone();

export function pickCameraTarget(base, portrait){
  const a = (isPortrait() && portrait) ? portrait : base;
  return new THREE.Vector3(a[0], a[1], 0);
}

/* ============================================================
   LIGHTS
   ============================================================ */
const L = SCENE.lights;
export const hemi = new THREE.HemisphereLight(new THREE.Color(L.hemi.sky), new THREE.Color(L.hemi.ground), L.hemi.intensity);
scene.add(hemi);

export const sun = new THREE.DirectionalLight(new THREE.Color(L.sun.color), L.sun.intensity);
sun.position.fromArray(L.sun.pos);
sun.castShadow = SHADOWS_ENABLED;
if(SHADOWS_ENABLED){
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left   = -3.4; sun.shadow.camera.right  =  3.4;
  sun.shadow.camera.top    =  3.4; sun.shadow.camera.bottom = -3.4;
  sun.shadow.camera.near   = 0.5;  sun.shadow.camera.far    = 12;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
}
scene.add(sun);
export const SUN_DIR = sun.position.clone().normalize();

export const fill = new THREE.DirectionalLight(new THREE.Color(L.fill.color), L.fill.intensity);
fill.position.fromArray(L.fill.pos);
scene.add(fill);

export const rim = new THREE.DirectionalLight(new THREE.Color(L.rim.color), L.rim.intensity);
rim.position.fromArray(L.rim.pos);
scene.add(rim);

export const glow = new THREE.PointLight(
  new THREE.Color(L.glow.color), L.glow.intensity,
  L.glow.distance != null ? L.glow.distance : 6.5,
  L.glow.decay    != null ? L.glow.decay    : 1.6
);
glow.position.fromArray(L.glow.pos);
scene.add(glow);

/* ============================================================
   TABLE + CLOTH
   ============================================================ */
const TBL = SCENE.table;
let tableCanvas;
if(TBL.type === 'linen')      tableCanvas = paintLinen();
else if(TBL.type === 'plain'){
  const c = mkCanvas(512, 512), g = c.getContext('2d');
  g.fillStyle = TBL.color || '#2a1508'; g.fillRect(0, 0, 512, 512);
  tableCanvas = c;
} else tableCanvas = paintWood();

const woodTex = texFromCanvas(tableCanvas);
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
woodTex.repeat.set(TBL.repeat, TBL.repeat);

export const table = new THREE.Mesh(
  new THREE.CircleGeometry(TBL.size, 48),
  new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.86, metalness: 0.04 })
);
table.rotation.x = -Math.PI/2;
table.receiveShadow = true;
scene.add(table);

if(SCENE.cloth && SCENE.cloth.enabled !== false){
  const CL = SCENE.cloth;
  let clothCanvas;
  if(CL.type === 'plain'){
    const c = mkCanvas(512, 512), g = c.getContext('2d');
    g.fillStyle = CL.color || '#e7d5b4'; g.fillRect(0, 0, 512, 512);
    clothCanvas = c;
  } else clothCanvas = paintLinen();
  const lt = texFromCanvas(clothCanvas);
  const linen = new THREE.Mesh(
    new THREE.PlaneGeometry(CL.size[0], CL.size[1]),
    new THREE.MeshStandardMaterial({ map: lt, roughness: 0.94 })
  );
  linen.rotation.x = -Math.PI/2;
  linen.position.y = CL.y != null ? CL.y : 0.004;
  linen.receiveShadow = true;
  scene.add(linen);
}

export { canvas as sceneCanvas };