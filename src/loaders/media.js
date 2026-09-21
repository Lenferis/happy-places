import {
  PHOTOS_DIR, PHOTOS_IMAGE_EXTS, PHOTOS_VIDEO_EXTS,
  DECOR_DIR, DECOR_EXTS, VOICE_DIR, VOICE_EXTS
} from '@config/paths.js';
import { PHOTO_FILES, ASSETS, DECOR_FILES } from '@config/assets.js';
import { PAGES } from '@config/album.js';
import { IMGS } from '@core/store.js';
import { Progress } from '@core/progress.js';
import { logAsset } from '@core/warnings.js';

/* ============================================================
   ПРИМИТИВЫ ЗАГРУЗКИ
   ============================================================ */
export function loadImage(src){
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload  = () => res(im);
    im.onerror = () => rej(new Error('img fail: ' + src));
    im.decoding = 'async';
    im.src = src;
  });
}

export function loadVideo(src){
  return new Promise((res, rej) => {
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('playsinline','');
    v.setAttribute('webkit-playsinline','');
    v.preload = 'auto'; v.autoplay = false;
    let done = false;
    const finish = (ok, err) => {
      if(done) return; done = true; clearTimeout(to);
      if(ok){ try{ v.width = v.videoWidth; v.height = v.videoHeight; }catch(e){} res(v); }
      else rej(err || new Error('video fail: ' + src));
    };
    const to = setTimeout(() => finish(true), 12000);
    v.addEventListener('loadeddata', () => finish(true), { once: true });
    v.addEventListener('error',      () => finish(false, new Error('video fail: ' + src)), { once: true });
    v.src = src;
    try{ v.load(); }catch(e){}
  });
}

function loadAudioFile(url){
  return new Promise((res, rej) => {
    const a = new Audio();
    a.preload = 'auto';
    a.src = url;
    let done = false;
    const ok  = () => { if(!done){ done = true; res(a); } };
    const bad = () => { if(!done){ done = true; rej(new Error('audio fail: ' + url)); } };
    a.addEventListener('loadedmetadata', ok,  { once: true });
    a.addEventListener('error',          bad, { once: true });
    setTimeout(() => { if(!done) ok(); }, 8000);
    try{ a.load(); }catch(e){}
  });
}

export async function loadAudioByName(name){
  if(!name) return null;
  if(IMGS.voices[name]) return IMGS.voices[name];
  for(const ext of VOICE_EXTS){
    const url = VOICE_DIR + name + '.' + ext;
    try{
      const a = await loadAudioFile(url);
      IMGS.voices[name] = a;
      return a;
    }catch(e){}
  }
  logAsset('voice "' + name + '" не знайдено у ' + VOICE_DIR);
  return null;
}

/* ============================================================
   МЕДИА-ХЕЛПЕРЫ
   ============================================================ */
export function isVideo(el){ return !!(el && el.tagName === 'VIDEO'); }

export function mediaSize(el){
  if(!el) return { w: 1, h: 1 };
  if(el.tagName === 'VIDEO') return { w: el.videoWidth  || el.width  || 1,
                                      h: el.videoHeight || el.height || 1 };
  return { w: el.naturalWidth || el.width  || 1,
           h: el.naturalHeight || el.height || 1 };
}

export function normalizeDecorEntry(cfg){
  if(cfg == null) return null;
  if(typeof cfg === 'string') return { file: cfg };
  if(typeof cfg !== 'object') return null;
  return cfg;
}

export async function loadMediaByKey(key, preferVideo){
  const base = PHOTOS_DIR + (PHOTO_FILES[key] || key);
  const exts = preferVideo
    ? [...PHOTOS_VIDEO_EXTS, ...PHOTOS_IMAGE_EXTS]
    : [...PHOTOS_IMAGE_EXTS, ...PHOTOS_VIDEO_EXTS];
  for(const ext of exts){
    const path = base + '.' + ext;
    const isVid = PHOTOS_VIDEO_EXTS.includes(ext);
    try{
      const el = isVid ? await loadVideo(path) : await loadImage(path);
      return { el, type: isVid ? 'video' : 'image', src: path };
    }catch(e){}
  }
  const fb = ASSETS.photos && ASSETS.photos[key];
  if(fb){
    const isVid = /^data:video\//i.test(fb) || /\.(mp4|webm|mov)(\?|#|$)/i.test(fb);
    try{
      const el = isVid ? await loadVideo(fb) : await loadImage(fb);
      return { el, type: isVid ? 'video' : 'image', src: 'ASSETS.photos["' + key + '"]' };
    }catch(e){}
  }
  return null;
}

/* ============================================================
   СБОР МНОЖЕСТВ
   ============================================================ */
export function getPhotoKeys(){
  return Array.from(new Set([
    ...Object.keys(PHOTO_FILES),
    ...Object.keys(ASSETS.photos || {})
  ]));
}

export function getDecorKeySets(){
  const keySet = new Set(), srcSet = new Set();
  const collect = arr => {
    if(!arr) return;
    const list = Array.isArray(arr) ? arr : [arr];
    list.forEach(d => {
      if(!d || typeof d !== 'object') return;
      if(d.type !== 'ditem') return;
      if(d.key) keySet.add(d.key);
      if(d.src) srcSet.add(d.src);
    });
  };
  for(const page of PAGES){
    if(!page) continue;
    collect(page.deco);
    if(Array.isArray(page.photos)) page.photos.forEach(p => collect(p && p.deco));
    if(Array.isArray(page.elements)) page.elements.forEach(el => {
      if(el && el.kind === 'ditem' && el.key) keySet.add(el.key);
    });
  }
  // сюда же — обложки и служебные
  for(const page of [/* placeholder */]) {} // см. ниже
  // Обложки/титул/закрытие импортируются лениво — чтобы не плодить цикл, они передаются как параметр.
  for(const k of Object.keys(DECOR_FILES)) keySet.add(k);
  return { keySet, srcSet };
}

export function getVoiceFiles(){
  const files = new Set();
  const collect = arr => {
    if(!arr) return;
    const list = Array.isArray(arr) ? arr : [arr];
    list.forEach(d => {
      if(!d || typeof d !== 'object') return;
      if(d.type === 'voice' && d.file) files.add(d.file);
    });
  };
  for(const page of PAGES){
    if(!page) continue;
    collect(page.deco);
    if(Array.isArray(page.photos)) page.photos.forEach(p => collect(p && p.deco));
    if(Array.isArray(page.elements)) page.elements.forEach(el => {
      if(el && el.kind === 'voice' && el.file) files.add(el.file);
    });
  }
  return files;
}

/* ============================================================
   ЗАГРУЗЧИКИ ПАЧКАМИ
   ============================================================ */
export async function loadAllPhotos(){
  const photoKeys = getPhotoKeys();
  const preferVideo = new Set();
  for(const p of PAGES){
    if(!p) continue;
    if(Array.isArray(p.photos))    p.photos.forEach(ph => { if(ph && ph.video) preferVideo.add(ph.img); });
    if(Array.isArray(p.elements))  p.elements.forEach(el => { if(el && el.kind === 'photo' && el.video) preferVideo.add(el.img); });
  }
  const results = await Promise.all(photoKeys.map(async key => {
    const r = await loadMediaByKey(key, preferVideo.has(key));
    Progress.tick();
    return { key, r };
  }));
  for(const { key, r } of results){
    if(r && r.el){
      IMGS.photos[key] = r.el;
      if(r.type === 'video') console.log('[album] video:', key, '←', r.src);
    } else {
      logAsset('Медіа не знайдено для ключа "' + key + '".');
    }
  }
}

export async function loadAllDecorItems(extraDecoSources = []){
  const { keySet, srcSet } = getDecorKeySets();

  // Доп. источники — из обложек/титула/закрытия (передаёт main.js)
  for(const src of extraDecoSources){
    if(!src) continue;
    if(src.type === 'ditem'){
      if(src.key) keySet.add(src.key);
      if(src.src) srcSet.add(src.src);
    }
  }

  for(const key of keySet){
    if(IMGS.items[key]){ Progress.tick(); continue; }
    const entry = normalizeDecorEntry(DECOR_FILES[key]);
    if(!entry || !entry.file){
      logAsset('ditem "' + key + '" не знайдено в DECOR_FILES');
      Progress.tick();
      continue;
    }
    const base = DECOR_DIR + entry.file;
    let loadedImg = null;
    for(const ext of DECOR_EXTS){
      try{ loadedImg = await loadImage(base + '.' + ext); break; }
      catch(e){}
    }
    if(loadedImg){
      if(entry.size != null) loadedImg._defaultSize = entry.size;
      IMGS.items[key] = loadedImg;
    } else {
      logAsset('ditem "' + key + '" файл не знайдено у ' + DECOR_DIR);
    }
    Progress.tick();
  }
  for(const src of srcSet){
    const ck = 'src:' + src;
    if(IMGS.items[ck]){ Progress.tick(); continue; }
    try{ IMGS.items[ck] = await loadImage(src); }
    catch(e){ logAsset('ditem src "' + src + '" не завантажено'); }
    Progress.tick();
  }
}

export async function loadAllVoices(){
  const files = getVoiceFiles();
  if(!files.size) return;
  await Promise.all(Array.from(files).map(name =>
    loadAudioByName(name).finally(() => Progress.tick())
  ));
}