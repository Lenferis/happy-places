import * as THREE from 'three';

import { SCENE } from '@config/scene.js';
import { IMGS, particleSystems, state } from '@core/store.js';
import { mkCanvas, rnd } from '@paint/utils.js';
import { scene } from './setup.js';

/* ============================================================
   АНИМАЦИИ
   ============================================================ */
export const PARTICLE_ANIMS = {
  fall: {
    respawn(p){
      const A = p.area;
      p.y = A.y[1]; p.x = rnd(A.x[0], A.x[1]); p.z = rnd(A.z[0], A.z[1]);
      p.spin *= (Math.random() < .5 ? -1 : 1);
    },
    apply(p, dt, t){
      p.y -= p.speed * dt;
      if(p.y < p.area.y[0]) this.respawn(p);
      const sx = Math.sin(t * p.sway + p.seed) * p.swayAmp;
      const sz = Math.cos(t * p.sway * 0.8 + p.seed) * p.swayAmp * 0.7;
      p.mesh.position.set(p.x + sx, p.y, p.z + sz);
      p.mesh.rotation.z += p.spin * dt;
      p.mesh.rotation.x = -Math.PI/2 + Math.sin(t * p.sway + p.seed) * 0.4;
      const top = p.area.y[1], bot = p.area.y[0];
      const fT = Math.min(1, (top - p.y) * p.edgeFade);
      const fB = Math.min(1, (p.y - bot) * p.edgeFade);
      p.mesh.material.opacity = p.baseOpacity * Math.min(fT, fB);
    }
  },
  rise: {
    respawn(p){
      const A = p.area;
      p.y = A.y[0]; p.x = rnd(A.x[0], A.x[1]); p.z = rnd(A.z[0], A.z[1]);
    },
    apply(p, dt, t){
      p.y += p.speed * dt;
      if(p.y > p.area.y[1]) this.respawn(p);
      const sx = Math.sin(t * p.sway + p.seed) * p.swayAmp;
      p.mesh.position.set(p.x + sx, p.y, p.z);
      p.mesh.rotation.z += p.spin * dt;
      p.mesh.rotation.x = -Math.PI/2;
      const top = p.area.y[1], bot = p.area.y[0];
      const fT = Math.min(1, (top - p.y) * p.edgeFade);
      const fB = Math.min(1, (p.y - bot) * p.edgeFade);
      p.mesh.material.opacity = p.baseOpacity * Math.min(fT, fB);
    }
  },
  drift: {
    respawn(p){
      const A = p.area;
      p.x = A.x[0]; p.y = rnd(A.y[0], A.y[1]); p.z = rnd(A.z[0], A.z[1]);
    },
    apply(p, dt, t){
      p.x += p.speed * dt;
      if(p.x > p.area.x[1]) this.respawn(p);
      const sy = Math.sin(t * p.sway + p.seed) * p.swayAmp;
      const sz = Math.cos(t * p.sway * 0.6 + p.seed) * p.swayAmp * 0.5;
      p.mesh.position.set(p.x, p.y + sy, p.z + sz);
      p.mesh.rotation.z += p.spin * dt;
      p.mesh.rotation.x = -Math.PI/2 + Math.sin(t * p.sway * 0.7 + p.seed) * 0.25;
      const Lf = p.area.x[0], R = p.area.x[1];
      const fL = Math.min(1, (p.x - Lf) * p.edgeFade);
      const fR = Math.min(1, (R - p.x) * p.edgeFade);
      p.mesh.material.opacity = p.baseOpacity * Math.min(fL, fR);
    }
  },
  float: {
    respawn(p){
      const A = p.area;
      p.x = rnd(A.x[0], A.x[1]); p.y = rnd(A.y[0], A.y[1]); p.z = rnd(A.z[0], A.z[1]);
    },
    apply(p, dt, t){
      const sx = Math.sin(t * p.sway + p.seed) * p.swayAmp;
      const sy = Math.cos(t * p.sway * 0.7 + p.seed * 1.3) * p.swayAmp;
      p.mesh.position.set(p.x + sx, p.y + sy, p.z);
      p.mesh.rotation.z += p.spin * dt * 0.5;
      p.mesh.rotation.x = -Math.PI/2 + Math.sin(t * p.sway * 0.5 + p.seed) * 0.25;
      p.mesh.material.opacity = p.baseOpacity;
    }
  }
};

const _particleTexCache = new Map();
function getParticleTexture(img){
  let t = _particleTexCache.get(img);
  if(!t){
    t = new THREE.CanvasTexture(img);
    t.colorSpace = THREE.SRGBColorSpace;
    _particleTexCache.set(img, t);
  }
  return t;
}
const _sharedParticleGeo = new THREE.PlaneGeometry(1, 1);

function resolveParticleTexture(keyOrSrc){
  if(!keyOrSrc) return null;
  return IMGS.items[keyOrSrc] || IMGS.items['src:' + keyOrSrc] || null;
}

/* ============================================================
   ЛЕПЕСТКИ
   ============================================================ */
export function buildParticles(){
  particleSystems.length = 0;
  const systems = SCENE.particles || [];
  if(!systems.length) return;
  if(state.reduced && SCENE.particlesReduced) return;
  for(const cfg of systems){
    const anim = PARTICLE_ANIMS[cfg.type || 'fall'] || PARTICLE_ANIMS.fall;
    const texes = (cfg.textures || []).map(resolveParticleTexture).filter(Boolean);
    if(!texes.length) continue;
    const area = cfg.area || { x: [-1.3, 1.3], y: [0.02, 2.7], z: [-0.8, 1.0] };
    const speedR = cfg.speed || [0.10, 0.20];
    const swayR  = cfg.sway  || [0.4, 1.0];
    const spinR  = cfg.spin  || [0.4, 1.6];
    const size   = cfg.size  != null ? cfg.size  : 0.075;
    const baseOpacity = cfg.opacity  != null ? cfg.opacity  : 0.85;
    const edgeFade    = cfg.edgeFade != null ? cfg.edgeFade : 1.4;
    const swayAmp     = cfg.swayAmp  != null ? cfg.swayAmp  : 0.14;
    const count       = cfg.count    != null ? cfg.count    : 12;
    const sys = { cfg, anim, particles: [] };
    for(let i = 0; i < count; i++){
      const tex = getParticleTexture(texes[i % texes.length]);
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(_sharedParticleGeo, mat);
      mesh.scale.setScalar(size);
      mesh.renderOrder = 30;
      scene.add(mesh);
      const p = {
        mesh, baseOpacity, edgeFade, area, swayAmp,
        seed:  Math.random() * 10,
        speed: rnd(speedR[0], speedR[1]),
        sway:  rnd(swayR[0],  swayR[1]),
        spin:  rnd(spinR[0],  spinR[1]) * (Math.random() < .5 ? -1 : 1),
        x: rnd(area.x[0], area.x[1]),
        y: rnd(area.y[0], area.y[1]),
        z: rnd(area.z[0], area.z[1])
      };
      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.x = -Math.PI/2;
      sys.particles.push(p);
    }
    particleSystems.push(sys);
  }
}

export function updateParticles(dt, t){
  for(let s = 0; s < particleSystems.length; s++){
    const sys = particleSystems[s];
    for(let i = 0; i < sys.particles.length; i++){
      sys.anim.apply(sys.particles[i], dt, t);
    }
  }
}

/* ============================================================
   ПЫЛЬ
   ============================================================ */
let dustPts = null;

export function buildDust(){
  if(!SCENE.dust || SCENE.dust.enabled === false) return;
  const D = SCENE.dust;
  const N = D.count != null ? D.count : 90;
  const A = D.area || { x: [-3.4, 3.4], y: [0.1, 3.2], z: [-2.4, 2.4] };
  const spdR = D.speed   || [0.015, 0.05];
  const swR  = D.swayAmp || [0.05, 0.25];
  const pos = new Float32Array(N*3), spd = [];
  for(let i = 0; i < N; i++){
    pos[i*3]   = rnd(A.x[0], A.x[1]);
    pos[i*3+1] = rnd(A.y[0], A.y[1]);
    pos[i*3+2] = rnd(A.z[0], A.z[1]);
    spd.push({ v: rnd(spdR[0], spdR[1]), ph: rnd(0, 7), amp: rnd(swR[0], swR[1]) });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const dc = mkCanvas(64, 64), dg = dc.getContext('2d');
  const rg = dg.createRadialGradient(32, 32, 0, 32, 32, 30);
  rg.addColorStop(0,   'rgba(255,225,170,1)');
  rg.addColorStop(.4,  'rgba(255,210,140,.5)');
  rg.addColorStop(1,   'rgba(255,200,120,0)');
  dg.fillStyle = rg; dg.beginPath(); dg.arc(32, 32, 30, 0, 7); dg.fill();

  const tex = new THREE.CanvasTexture(dc);
  const mat = new THREE.PointsMaterial({
    size: D.size != null ? D.size : 0.045,
    map: tex, transparent: true,
    opacity: D.opacity != null ? D.opacity : 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
    sizeAttenuation: true,
    color: D.color != null ? D.color : 0xffe0b0
  });
  dustPts = new THREE.Points(geo, mat);
  dustPts.userData.spd  = spd;
  dustPts.userData.area = A;
  scene.add(dustPts);
}

export function updateDust(dt, t){
  if(!dustPts) return;
  const p = dustPts.geometry.attributes.position;
  const spd = dustPts.userData.spd;
  const A = dustPts.userData.area;
  for(let i = 0; i < spd.length; i++){
    let y = p.getY(i) + spd[i].v * dt;
    if(y > A.y[1]) y = A.y[0];
    p.setY(i, y);
    p.setX(i, p.getX(i) + Math.sin(t * 0.4 + spd[i].ph) * spd[i].amp * dt);
  }
  p.needsUpdate = true;
}