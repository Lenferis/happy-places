import { state } from './store.js';

// ---------- WebAudio контекст / sfx ----------
let audioCtx   = null;
let masterGain = null;

export function initAudio(){
  if(audioCtx) return;
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(audioCtx.destination);
  }catch(e){ audioCtx = null; }
}
export function resumeAudioCtx(){
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}
export function installAudioUnlock(){
  ['pointerdown', 'touchstart', 'keydown'].forEach(evt => {
    document.addEventListener(evt, () => { initAudio(); resumeAudioCtx(); },
      { once: true, capture: true, passive: true });
  });
}

function noiseBuf(dur){
  const n = Math.floor(audioCtx.sampleRate * dur);
  const b = audioCtx.createBuffer(1, n, audioCtx.sampleRate);
  const d = b.getChannelData(0);
  for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function playSwoosh(dur, f0, f1, vol){
  if(!audioState.wantMusic || !audioCtx) return;
  if(audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const t   = audioCtx.currentTime;
  const src = audioCtx.createBufferSource(); src.buffer = noiseBuf(dur);
  const bp  = audioCtx.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(f0, t);
  bp.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  bp.frequency.exponentialRampToValueAtTime(f0 * 0.8, t + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp); bp.connect(g); g.connect(masterGain);
  src.start(t); src.stop(t + dur + 0.05);
}
function playTick(){
  if(!audioState.wantMusic || !audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(72, t + 0.09);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.05, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g); g.connect(masterGain);
  o.start(t); o.stop(t + 0.14);
  playSwoosh(0.09, 900, 500, 0.035);
}
function playDrop(){
  if(!audioState.wantMusic || !audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(190, t);
  o.frequency.exponentialRampToValueAtTime(58, t + 0.20);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  o.connect(g); g.connect(masterGain);
  o.start(t); o.stop(t + 0.26);
  playSwoosh(0.24, 1300, 420, 0.05);
}

export const sfxFlip  = () => playSwoosh(state.reduced ? 0.25 : 0.55, 700, 2600, 0.11);
export const sfxCover = () => playSwoosh(1.1, 320, 1200, 0.13);
export const sfxClack = () => playTick();
export const sfxDrop  = () => playDrop();

// ---------- Музыка ----------
const music       = document.getElementById('music');
const audioToggle = document.getElementById('audioToggle');
const MUSIC_TARGET_VOL = 0.45;
const MUSIC_DUCK_VOL   = 0.08;

export const audioState = {
  wantMusic: true, isPlaying: false, musicFailed: false,
  currentVol: 0, fadeRaf: null, ducked: false
};

function musicTargetVol(){ return audioState.ducked ? MUSIC_DUCK_VOL : MUSIC_TARGET_VOL; }
function cancelFade(){
  if(audioState.fadeRaf){ cancelAnimationFrame(audioState.fadeRaf); audioState.fadeRaf = null; }
}
function fadeVolume(targetVol, duration, onDone){
  cancelFade();
  const startVol = audioState.currentVol;
  const startT   = performance.now();
  const dur      = Math.max(1, duration);
  const step = (now) => {
    const k = Math.min(1, (now - startT) / dur);
    const v = startVol + (targetVol - startVol) * k;
    audioState.currentVol = v;
    try{ music.volume = Math.max(0, Math.min(1, v)); }catch(e){}
    if(k < 1){ audioState.fadeRaf = requestAnimationFrame(step); }
    else { audioState.fadeRaf = null; if(onDone) onDone(); }
  };
  audioState.fadeRaf = requestAnimationFrame(step);
}
function shouldMusicPlay(){
  return audioState.wantMusic && !audioState.musicFailed
      && (state.mode === 'opening' || state.mode === 'reading');
}
export function applyMusicState(){
  if(audioState.musicFailed) return;
  const target = musicTargetVol();
  if(shouldMusicPlay()){
    if(audioState.isPlaying){
      if(Math.abs(audioState.currentVol - target) > 0.01) fadeVolume(target, 1200);
    } else {
      try{ music.volume = Math.max(0, audioState.currentVol); }catch(e){}
      const pp = music.play();
      if(pp && pp.catch) pp.catch(err => console.warn('[music] play rejected:', (err && err.message) || err));
    }
  } else {
    if(audioState.isPlaying){
      fadeVolume(0, 600, () => {
        try{ music.pause(); }catch(e){}
        audioState.currentVol = 0;
      });
    } else {
      audioState.currentVol = 0;
      try{ music.volume = 0; }catch(e){}
    }
  }
}
export function duckMusic(on){
  audioState.ducked = on;
  if(shouldMusicPlay()) fadeVolume(musicTargetVol(), 400);
}

let audioToggleReady = false;
export function makeAudioToggleReady(){
  if(audioToggleReady) return;
  audioToggleReady = true;
  audioToggle.classList.add('ready');
}

export function installAudioUI(){
  music.addEventListener('play',  () => { audioState.isPlaying = true;  if(shouldMusicPlay()) fadeVolume(musicTargetVol(), 1200); });
  music.addEventListener('pause', () => { audioState.isPlaying = false; });
  music.addEventListener('ended', () => { audioState.isPlaying = false; });
  music.addEventListener('error', () => {
    audioState.musicFailed = true;
    audioState.isPlaying  = false;
    audioToggle.title = 'Музика не знайдена (music.mp3)';
    makeAudioToggleReady();
  });
  music.addEventListener('loadedmetadata', makeAudioToggleReady);
  setTimeout(makeAudioToggleReady, 1500);
  audioToggle.addEventListener('click', () => {
    audioState.wantMusic = !audioState.wantMusic;
    audioToggle.classList.toggle('muted', !audioState.wantMusic);
    initAudio(); resumeAudioCtx();
    applyMusicState();
  });
}

// ---------- Голосовые виджеты ----------
// Внимание: redrawVoice/состояние полей _playing и т.п. живут в paint/voices.js.
// Здесь — плеер, который дёргает перерисовку через callback.
let _redrawHook = null;
export function setVoiceRedrawHook(fn){ _redrawHook = fn; }

export const voicePlayer = {
  current: null, raf: null, lastTick: 0,
  play(v, keepPosition){
    if(!v._audio) return;
    if(this.current && this.current !== v) this.stop();
    this.current = v;
    if(!keepPosition){ try{ v._audio.currentTime = 0; }catch(e){} }
    const p = v._audio.play();
    if(p && p.catch) p.catch(err => console.warn('[voice] play:', err));
    v._playing  = true;
    v._duration = v._audio.duration || v._duration || 0;
    v._lastSec  = -1;
    v._lastBars = -1;
    if(_redrawHook) _redrawHook(v);
    if(v._tex) v._tex.needsUpdate = true;
    duckMusic(true);
    this.startTick();
  },
  pause(v){
    if(v._audio) v._audio.pause();
    v._playing = false;
    if(this.raf){ cancelAnimationFrame(this.raf); this.raf = null; }
    if(_redrawHook) _redrawHook(v);
    if(v._tex) v._tex.needsUpdate = true;
    if(this.current === v) this.current = null;
    duckMusic(false);
  },
  stop(){
    const v = this.current;
    if(v){
      if(v._audio) v._audio.pause();
      v._playing = false;
      v._current = 0;
      if(_redrawHook) _redrawHook(v);
      if(v._tex) v._tex.needsUpdate = true;
    }
    if(this.raf){ cancelAnimationFrame(this.raf); this.raf = null; }
    this.current = null;
    duckMusic(false);
  },
  startTick(){
    if(this.raf) cancelAnimationFrame(this.raf);
    const loop = (now) => {
      const v = this.current;
      if(!v || !v._audio){ this.raf = null; return; }
      const a = v._audio;
      v._current = a.currentTime;
      if(a.duration && isFinite(a.duration)) v._duration = a.duration;
      if(now - this.lastTick > 66){
        this.lastTick = now;
        const dur  = v._duration || 1;
        const sec  = Math.floor(v._current);
        const bars = Math.round((v._current / dur) * 34);
        if(sec !== v._lastSec || bars !== v._lastBars){
          v._lastSec  = sec;
          v._lastBars = bars;
          if(_redrawHook) _redrawHook(v);
          if(v._tex) v._tex.needsUpdate = true;
        }
      }
      if(a.ended || a.paused){
        v._playing = false;
        v._current = a.ended ? 0 : v._current;
        if(_redrawHook) _redrawHook(v);
        if(v._tex) v._tex.needsUpdate = true;
        this.raf = null;
        if(this.current === v) this.current = null;
        duckMusic(false);
        return;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
};

export function toggleVoice(v){
  if(!v._audio) return;
  if(v._playing){ voicePlayer.pause(v); return; }
  const a = v._audio;
  const dur = a.duration;
  const atEnd = a.ended || (dur && isFinite(dur) && a.currentTime >= dur - 0.05);
  voicePlayer.play(v, !atEnd);
}