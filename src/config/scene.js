export const SCENE = {
  background: {
    type: 'radial',
    colors: ['#4a2c15', '#2c1a0c', '#150c05'],
    inner:  [300, 170, 40],
    center: [256, 256, 380],
    color:  '#1a100a'
  },
  fog:      { color: 0x1a0f07, near: 9, far: 16 },
  exposure: 1.12,
  lights: {
    hemi: { sky: '#ffe2b8', ground: '#1c0f06', intensity: 0.85 },
    sun:  { color: '#ffd9a6', intensity: 2.6, pos: [2.3, 4.3, 2.7], castShadow: false },
    fill: { color: '#d9a468', intensity: 0.5, pos: [-3, 2.2, 1.4] },
    rim:  { color: '#ffbf80', intensity: 0.6, pos: [-1.2, 3.2, -3.4] },
    glow: { color: '#ffca8a', intensity: 0.5, pos: [0, 2.3, 0.7],
            distance: 6.5, decay: 1.6 }
  },
  camera: {
    fov: 38, near: 0.2, far: 60,
    home:    [2.3, 1.55, 3.45],
    reading: [0.15, 2.35, 2.22],
    homeTarget:            [0, 0.34],
    homeTargetPortrait:    [0, 0.20],
    readingTarget:         [0, 0.11],
    readingTargetPortrait: [0, 0.18]
  },
  controls: {
    minDistance: 1.35, maxDistance: 7.5,
    minPolarAngle: 0.18, maxPolarAngle: 1.32,
    minAzimuthAngle: -1.15, maxAzimuthAngle: 1.15,
    autoRotateSpeed: 0.15
  },
  table: { type: 'wood', color: '#2a1508', repeat: 3.2, size: 9 },
  cloth: { enabled: true, type: 'linen', color: '#e7d5b4', size: [3.9, 2.72], y: 0.004 },
  props: [],
  particles: [
    {
      type: 'fall',
      textures: ['petal_1', 'petal_2', 'petal_3', 'petal_4'],
      count: 12,
      size: 0.075,
      speed: [0.10, 0.20],
      sway: [0.4, 1.0], swayAmp: 0.14,
      spin: [0.4, 1.6],
      opacity: 0.85,
      edgeFade: 1.4,
      area: { x: [-1.3, 1.3], y: [0.02, 2.7], z: [-0.8, 1.0] }
    }
  ],
  dust: {
    enabled: true,
    count: 90,
    size: 0.045,
    color: 0xffe0b0,
    opacity: 0.5,
    speed: [0.015, 0.05],
    swayAmp: [0.05, 0.25],
    area: { x: [-3.4, 3.4], y: [0.1, 3.2], z: [-2.4, 2.4] }
  },
  particlesReduced: false
};