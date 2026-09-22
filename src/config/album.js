import { COL } from './theme.js';

export const COVER_FRONT = {
  bg: { type:'leather', colors:['#6b3018', '#7d3c22'] },
  frame: {
    outer:   { inset:58, width:3.4, color:'rgba(212,170,90,.75)' },
    inner:   { inset:74, width:1.6, color:'rgba(212,170,90,.4)' },
    corners: { enabled:true, size:78, width:3, color:'rgba(224,183,105,.85)' }
  },
  deco: [
    { type:'ditem', key:'rose', at:{ x:0.5, y:0.358 }, size:416,
      tintMode:'foil', goldShadow:true, shadow:false },
    { type:'line', at:{ x:0.5, y:0.776 }, size:280, width:2,
      color:'rgba(212,170,90,.65)', alpha:1 }
  ],
  text: [
    { content:'Місця\nщасливих людей', at:{ x:0.5, y:0.647 },
      anchor:'c', font:'600 88px Cormorant, serif', style:'foil', lineHeight:98,
      shadow:{ color:'rgba(30,12,2,.6)', dx:3, dy:3 } },
    { content:'Не эдит, но неплохо', at:{ x:0.5, y:0.822 },
      anchor:'c', font:'italic 500 42px Cormorant, serif',
      fill:'rgba(240,205,130,.9)' },
    { content:'2023 — 2024', at:{ x:0.5, y:0.912 },
      anchor:'c', font:'600 44px Caveat, cursive',
      fill:'rgba(240,205,130,.75)' }
  ]
};

export const COVER_INNER = {
  bg: { type:'endpaper' },
  deco: [
    { type:'ditem', key:'rose', at:{ x:0.5, y:0.328 }, size:320,
      alpha:0.62, blend:'multiply', shadow:false },
    { type:'line', at:{ x:0.5, y:0.540 }, size:120, width:2,
      color:'rgba(138,90,43,.5)', alpha:1 }
  ],
  text: [
    { content:'«Моменты проходят —\nно фотки то остаются.»',
      at:{ x:0.5, y:0.582 }, anchor:'c',
      font:'italic 600 52px Cormorant, serif',
      fill:'rgba(70,45,22,.85)', lineHeight:60 }
  ]
};

export const TITLE_PAGE = {
  bg: { type:'paper' },
  frame: {
    outer:   { inset:48, width:2, color:'rgba(184,138,57,.55)' },
    inner:   { inset:60, width:1, color:'rgba(184,138,57,.3)' },
    corners: { enabled:true, size:58, width:2, color:'rgba(184,138,57,.6)' }
  },
  deco: [
    { type:'ditem', key:'rose', at:{ x:0.5, y:0.324 }, size:340,
      alpha:0.3, blend:'multiply', shadow:false },
    { type:'line', at:{ x:0.5, y:0.646 }, size:160, width:1.5,
      color:'rgba(138,90,43,.55)', alpha:1 },
    { type:'heart', at:{ x:0.5, y:0.812 }, size:38,
      color:'rgba(181,72,58,.55)', alpha:0.9 }
  ],
  text: [
    { content:'Місця\nщасливих людей', at:{ x:0.5, y:0.567 },
      anchor:'c', font:'600 74px Cormorant, serif',
      fill:COL.ink, lineHeight:78 },
    { content:'2025 — 2026', at:{ x:0.5, y:0.729 },
      anchor:'c', font:'500 40px Caveat, cursive',
      fill:COL.sepia }
  ]
};

export const CLOSING_DEFAULTS = {
  bg: { type:'paper' },
  deco: [
    { type:'heart', at:{ x:0.5, y:0.385 }, size:200,
      color:'rgba(181,72,58,.85)', alpha:1 },
    { type:'ditem', key:'petal_1', at:{ x:0.334, y:0.423 }, size:54, rot:-40,  alpha:0.80 },
    { type:'ditem', key:'petal_2', at:{ x:0.656, y:0.385 }, size:48, rot: 69,  alpha:0.80 },
    { type:'ditem', key:'petal_3', at:{ x:0.605, y:0.480 }, size:42, rot:149,  alpha:0.75 },
    { type:'ditem', key:'petal_4', at:{ x:0.395, y:0.316 }, size:44, rot: 23,  alpha:0.75 },
    { type:'line', at:{ x:0.5, y:0.770 }, size:128, width:1.5,
      color:'rgba(138,90,43,.5)', alpha:1 }
  ],
  text: [
    { content:'тут живе\nнаше щастя',
      at:{ x:0.5, y:0.676 }, anchor:'c',
      font:'italic 500 46px Cormorant, serif',
      fill: COL.inkSoft, lineHeight:63 }
  ]
};

/* ============================================================
   PAGES — версия без текстовых блоков.
   Оставлены: title, фото-страницы, стопки, popup.
   Убраны: страницы-letter, все `text: [...]` блоки,
           подписи (caption) и даты (date) у фото,
           декор-элементы { type:'text' } и voice.
   Popup оставлен с текстом — как исключение.
   ============================================================ */
export const PAGES = [

  { type: 'title' },
  { type: 'photo', photos: [
    { img: "p1", caption: '113 мометов. Каждый — отдельная история', date: '', aspect: 4/3, tilt: 2.5 }
  ]},
  { type: 'photo', layout: 'duo', photos: [
    { img: "p2", caption: '...', aspect: 4/3 },
    { img: "v1", caption: '...', aspect: 4/3, video: true }
  ]},
  { type: 'photo', layout: 'trio', photos: [
    { img: "p3", aspect: 4/3, frame: 'polaroid' },
    { img: "p4", aspect: 4/3, frame: 'polaroid' },
    { img: "p5", aspect: 4/3, frame: 'polaroid' }
  ]},
  { type: 'photo', layout: 'grid', photos: [
    { img: "p6",  aspect: 4/3 },
    { img: "p7",  aspect: 4/3 },
    { img: "p8",  aspect: 4/3 },
    { img: "p9", aspect: 4/3 }
  ]},
  { type: 'photo', layout: 'duo', photos: [
    { img: "p10", caption: '...', aspect: 4/3 },
    { img: "p11", caption: '...', aspect: 4/3 }
  ]},
  { type: 'stack', style: 'fall', photos: [
    { img: "p12", x:0.50, y:0.38, w:0.55, rot:-6, aspect:4/3, frame:'polaroid' },
    { img: "p13", x:0.54, y:0.44, w:0.52, rot: 4, aspect:4/3, frame:'polaroid' },
    { img: "p14", x:0.47, y:0.50, w:0.53, rot:-3, aspect:4/3, frame:'polaroid' },
    { img: "p15", x:0.53, y:0.56, w:0.50, rot: 7, aspect:4/3, frame:'polaroid' },
    { img: "p16", x:0.48, y:0.62, w:0.51, rot:-5, aspect:4/3, frame:'polaroid' },
    { img: "p17", x:0.52, y:0.68, w:0.49, rot: 3, aspect:4/3, frame:'polaroid' }
  ]},
  { type: 'photo', layout: 'trio', photos: [
    { img: "p18", aspect: 4/3, frame: 'polaroid' },
    { img: "p19", aspect: 4/3, frame: 'polaroid' },
    { img: "p20", aspect: 4/3, frame: 'polaroid' }
  ]},
  { type: 'photo', photos: [
    { img: "v2", aspect: 4/3, tilt: -2.0, video:true }
  ]},
  { type: 'photo', layout: 'duo', photos: [
    { img: "p21", aspect: 4/3 },
    { img: "p22", aspect: 4/3 }
  ]},
  { type: 'photo', layout: 'grid', photos: [
    { img: "p23", aspect: 4/3 },
    { img: "p24", aspect: 4/3 },
    { img: "p25", aspect: 4/3 },
    { img: "p26", aspect: 4/3 }
  ]},
  { type: 'photo', photos: [
  { img: "v3", aspect: 9/16, tilt: 1.5, scale:0.5, video:true}
  ]},
  { type: 'stack', style: 'fan', photos: [
    { img: "p27", x:0.28, y:0.38, w:0.40, rot:-14, aspect:4/3, frame:'polaroid' },
    { img: "p28", x:0.50, y:0.36, w:0.42, rot: -4, aspect:4/3, frame:'polaroid' },
    { img: "p29", x:0.72, y:0.38, w:0.40, rot:  6, aspect:4/3, frame:'polaroid' },
    { img: "p30", x:0.32, y:0.60, w:0.42, rot: -8, aspect:4/3, frame:'polaroid' },
    { img: "p31", x:0.68, y:0.60, w:0.42, rot: 10, aspect:4/3, frame:'polaroid' },
    { img: "p32", x:0.50, y:0.74, w:0.42, rot:  0, aspect:4/3, frame:'polaroid' }
  ]},
  { type: 'photo', layout: 'trio', photos: [
    { img: "p33", aspect: 4/3, frame: 'polaroid' },
    { img: "p34", aspect: 4/3, frame: 'polaroid' },
    { img: "p35", aspect: 4/3, frame: 'polaroid' }
  ]},
  { type: 'photo', layout: 'duo', photos: [
    { img: "p36", aspect: 4/3 },
    { img: "p37", aspect: 4/3 }
  ]},
  { type: 'photo', layout: 'grid', photos: [
    { img: "p38", aspect: 4/3 },
    { img: "p39", aspect: 4/3 },
    { img: "p40", aspect: 4/3 },
    { img: "p41", aspect: 4/3 }
  ]},
  { type: 'photo', photos: [
    { img: "v4", aspect: 9/16, tilt: 1.5, scale:0.5, video:true}
  ]},
  { type: 'photo', layout: 'trio', photos: [
    { img: "p43", aspect: 9/16, frame: 'polaroid',scale:0.5 },
    { img: "p44", aspect: 9/16, frame: 'polaroid',scale:0.5 },
    { img: "p45", aspect: 9/16, frame: 'polaroid',scale:0.5 }
  ]},
  { type: 'stack', style: 'sweep', photos: [
    { img: "p46", x:0.50, y:0.32, w:0.55, rot:-4, aspect:4/3, frame:'polaroid' },
    { img: "p47", x:0.53, y:0.44, w:0.52, rot: 3, aspect:4/3, frame:'polaroid' },
    { img: "p48", x:0.47, y:0.56, w:0.50, rot:-2, aspect:4/3, frame:'polaroid' },
    { img: "p49", x:0.52, y:0.68, w:0.48, rot: 4, aspect:4/3, frame:'polaroid' },
    { img: "p50", x:0.48, y:0.78, w:0.46, rot:-3, aspect:4/3, frame:'polaroid' },
    { img: "p51", x:0.51, y:0.86, w:0.44, rot: 2, aspect:4/3, frame:'polaroid' }
  ]},
  { type: 'photo', layout: 'trio', photos: [
    { img: "p52", aspect: 4/3 },
    { img: "p53", aspect: 4/3 },
    { img: "p95", aspect: 4/3 },
  ]},
  { type: 'photo', layout: 'grid', photos: [
    { img: "p54", aspect: 4/3 },
    { img: "p55", aspect: 4/3 },
    { img: "p56", aspect: 4/3 },
    { img: "p57", aspect: 4/3 }
  ]},
  { type: 'photo', photos: [
    { img: "v5", aspect: 9/16, scale:0.5, video:true }
  ]},
  { type: 'photo', layout: 'trio', photos: [
    { img: "p59", aspect: 4/3, frame: 'polaroid' },
    { img: "p60", aspect: 4/3, frame: 'polaroid' },
    { img: "p61", aspect: 4/3, frame: 'polaroid' }
  ]},
  { type: 'photo', layout: 'duo', photos: [
    { img: "p62", aspect: 4/3 },
    { img: "p63", aspect: 4/3 }
  ]},
  { type: 'stack', style: 'fall', photos: [
    { img: "p64", x:0.50, y:0.38, w:0.55, rot:-5, aspect:4/3, frame:'polaroid' },
    { img: "p65", x:0.54, y:0.44, w:0.52, rot: 5, aspect:4/3, frame:'polaroid' },
    { img: "p66", x:0.47, y:0.50, w:0.53, rot:-3, aspect:4/3, frame:'polaroid' },
    { img: "p67", x:0.53, y:0.56, w:0.50, rot: 6, aspect:4/3, frame:'polaroid' },
    { img: "p68", x:0.48, y:0.62, w:0.51, rot:-4, aspect:4/3, frame:'polaroid' },
    { img: "p69", x:0.52, y:0.68, w:0.49, rot: 3, aspect:4/3, frame:'polaroid' }
  ]},
  { type: 'photo', layout: 'grid', photos: [
    { img: "p70", aspect: 4/3 },
    { img: "p71", aspect: 4/3 },
    { img: "p72", aspect: 4/3 },
    { img: "p73", aspect: 4/3 }
  ]},
  { type: 'photo', layout: 'duo', photos: [
    { img: "v6", aspect: 4/3, video:true },
    { img: "p74", aspect: 4/3 }
  ]},
  { type: 'photo', photos: [
    { img: "v7", aspect: 9/16, scale:0.5, video:true },
  ]},
  {
  type: 'popup',
  bg: { type: 'paper' },
  elements: [
    { kind: 'photo', img: 'p77', at:{ x:0.30, y:0.55 },
      w: 0.35, frame: 'polaroid' },
    { kind: 'photo', img: 'p76', at:{ x:0.70, y:0.55 },
      w: 0.35, frame: 'polaroid' },
    { kind: 'photo', img: 'p78', at:{ x:0.49, y:0.90 },
      w: 0.35, frame: 'polaroid' },
  ]
  },
  { type: 'photo', layout: 'trio', photos: [
    { img: "p75", aspect: 4/3, frame: 'polaroid' },
    { img: "p80", aspect: 4/3, frame: 'polaroid' },
    { img: "p81", aspect: 4/3, frame: 'polaroid' },
    { img: "p82", aspect: 4/3, frame: 'polaroid' }
  ]},
  { type: 'photo', photos: [
    { img: "v8", aspect: 9/16, scale:0.5, video:true },
  ]},
  { type: 'photo', layout: 'grid', photos: [
    { img: "p83", aspect: 4/3 },
    { img: "p84", aspect: 4/3 },
    { img: "p85", aspect: 4/3 },
    { img: "p86", aspect: 4/3 }
  ]},
  { type: 'photo', photos: [
    { img: "v9", aspect: 9/16, scale:0.5, video:true },
  ]},
  { type: 'photo', layout: 'grid', photos: [
    { img: "p87", aspect: 4/3 },
    { img: "p88", aspect: 4/3 },
    { img: "p89", aspect: 4/3 },
    { img: "p90", aspect: 4/3 }
  ]},
  { type: 'photo', photos: [
    { img: "v10", aspect: 9/16, scale:0.5, video:true },
  ]},
  { type: 'photo', layout: 'grid', photos: [
    { img: "p91", aspect: 4/3 },
    { img: "p92", aspect: 4/3 },
    { img: "p93", aspect: 4/3 },
  ]},
  { type: 'photo', photos: [
    { img: "v11", aspect: 9/16, scale:0.5, video:true },
  ]},
  { type: 'photo', photos: [
    { img: "p94", aspect: 4/3 }
  ]},
  { type: 'letter', heading: 'Любе [Ім’я],', body: [
    '113 моментів. Кожен — окрема історія, і всі разом — наше життя.',
    'Гортайте повільно. Тут усе, що я хотів/хотіла сказати без слів.'
  ]},
  { type: 'closing', text: [
    { content: '113 моментів —\nі це лише початок',
      at: { x: 0.5, y: 0.676 }, anchor: 'c',
      font: 'italic 500 46px Cormorant, serif',
      fill: COL.inkSoft, lineHeight: 63 }
  ]}
];

export const QUOTE_BACK = 'а далі —\nтільки наші моменти.';

export const COVER_BACK = {
  bg: { type:'endpaper' },
  frame: {
    outer: { inset:44, width:2, color:'rgba(150,110,55,.4)' }
  },
  deco: [
    { type:'line', at:{ x:0.5, y:0.540 }, size:120, width:2,
      color:'rgba(138,90,43,.5)', alpha:1 }
  ],
  text: [
    { content: QUOTE_BACK,
      at:{ x:0.5, y:0.582 }, anchor:'t',
      font:'italic 600 52px Cormorant, serif',
      fill:'rgba(70,45,22,.85)', lineHeight:60 }
  ]
};