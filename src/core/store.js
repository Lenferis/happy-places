export const IMGS  = { photos: {}, items: {}, models: {}, voices: {} };
export const state = {
  mode: 'closed',
  cur: 0,
  animating: false,
  drag: null,
  reduced: window.matchMedia('(prefers-reduced-motion:reduce)').matches,
  firstOpen: false,
  voiceScrub: null
};
export const sheets          = [];
export const popupRegistry   = [];
export const particleSystems = [];
export const tableDecor      = [];
export const tweens          = [];