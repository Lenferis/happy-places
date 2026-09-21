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
    { content:'фотоальбом про велике', at:{ x:0.5, y:0.822 },
      anchor:'c', font:'italic 500 42px Cormorant, serif',
      fill:'rgba(240,205,130,.9)' },
    { content:'з любов’ю', at:{ x:0.5, y:0.912 },
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
    { content:'«Щастя — це коли тебе розуміють.»',
      at:{ x:0.5, y:0.582 }, anchor:'c',
      font:'italic 600 52px Cormorant, serif',
      fill:'rgba(70,45,22,.85)' }
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
    { content:'фотоальбом про велике', at:{ x:0.5, y:0.681 },
      anchor:'c', font:'italic 500 34px Cormorant, serif',
      fill:COL.inkSoft },
    { content:'2023 — 2024', at:{ x:0.5, y:0.729 },
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

export const PAGES = [
  { type:'title' },
  { type:'photo', photos:[{
      img:'dummy', caption:'Ранок, який починається з тебе',
      aspect:16/9, tilt:30.2, date:'травень 2023'
    }],
    text:[
      { content:'ТРАВЕНЬ', at:{ x:0.5, y:0.06 }, anchor:'c',
        font:{ family:'Cormorant, serif', size:36, weight:600 },
        fill: COL.sepia, alpha:0.9,
        shadow:{ color:'rgba(0,0,0,.2)', dx:1, dy:1 }
      }
    ],
    deco:[
      'tape',
      { type:'ditem', key:'rose', at:{x:0.86, y:0.79}, size:200, rot:-25, alpha:0.92 },
      { type:'sparkle', at:{x:0.16, y:0.14}, size:34, alpha:0.7 },
      { type:'text', content:'ранок',
        photo:0, anchor:'bl', dx:20, dy:-10, vAlign:'c',
        family:'Caveat, cursive', size:64, weight:600,
        fill:'rgba(58,36,24,.85)', rot:-6, alpha:0.9 },
      { type:'voice', at:{ x:0.5, y:0.87 }, size:300, rot:-2,label:'натисни — я сказала це вголос', file:'music' }
    ]},
  { type:'photo', photos:[{
      img:'dummy', caption:'Кава на балконі — наш ритуал', date:'14 травня'
    }],
    deco:[
      { type:'corners', photo:0, behind:true },
      { type:'stamp', lines:['щастя','2024'], at:{x:0.86, y:0.16}, rot:-14 }
    ]},
  { type:'photo', photos:[
      { img:'dummy', caption:'Дорога, яку знаємо напам’ять', frame:'polaroid',
        deco:[
          { type:'ditem', key:'eucalyptus', photo:0, anchor:'tr', dx:-10, dy:-6, size:240, rot:18 },
          { type:'tape', photo:0, at:{x:0.27, y:0.14}, size:120, rot:-8, variant:'gold' },
          { type:'text', content:'дорога',
            photo:0, anchor:'tl', dx:-14, dy:14, vAlign:'t',
            italic:true, size:40, family:'Cormorant, serif',
            fill:'rgba(90,60,25,.8)' }
        ]},
      { img:'dummy', frame:'polaroid-plain',
        deco:[
          { type:'heart', photo:1, anchor:'br', dx:34, dy:24, size:48, rot:14 },
          { type:'ditem', key:'lavender', photo:1, anchor:'tl', dx:-12, dy:-6, size:190, rot:-14 }
        ]}
    ]},
  { type:'photo', layout:'trio', photos:[
      { img:'dummy',   frame:'none',
        deco:[ { type:'stamp', lines:['море','2024'], photo:0, anchor:'bl', dx:20, dy:-10, rot:8 } ]},
      { img:'dummy', frame:'border',
        deco:[ { type:'ditem', key:'lily', photo:1, anchor:'br', dx:16, dy:12, size:180, rot:22 } ]},
      { img:'dummy',  frame:'rounded',
        deco:[ { type:'corners', photo:2, behind:true } ]}
    ]},
  { type:'photo', photos:[
      { img:'dummy', caption:'Осінь пахне яблуками',
        deco:[
          { type:'ditem', key:'peony', photo:0, anchor:'tl', dx:-16, dy:-10, size:200, rot:-20 },
          { type:'ditem', key:'eucalyptus', photo:0, anchor:'br', dx:20, dy:16, size:240, rot:16 },
          { type:'underline', at:{x:0.5, y:0.78}, size:180, rot:-3, alpha:0.75 }
        ]},
      { img:'dummy', frame:'rounded',
        deco:[ { type:'clip', photo:1, anchor:'t', dx:0, dy:-28, rot:6 } ]}
    ]},
  { type:'stack', style:'fall', photos:[
      { img:'dummy',    x:0.50, y:0.40, w:0.55, rot:-6, aspect:4/3,  frame:'polaroid',
        deco:[ { type:'heart', at:{x:0.85, y:0.72}, size:48, rot:14 } ]},
      { img:'dummy', x:0.55, y:0.45, w:0.52, rot: 5, aspect:16/9, frame:'polaroid-plain',
        deco:[ 'tape' ]},
      { img:'dummy',  x:0.47, y:0.50, w:0.53, rot:-3, aspect:4/3,  frame:'polaroid',
        deco:[ { type:'corners', behind:true } ]},
      { img:'dummy',  x:0.52, y:0.55, w:0.50, rot: 8, aspect:4/3,  frame:'rounded',
        deco:[ { type:'ditem', key:'peony', at:{x:0.20, y:0.32}, size:180, rot:-18 } ]}
    ]},
  { type:'stack', style:'fan', photos:[
      { img:'dummy',    x:0.28, y:0.40, w:0.42, rot:-14, aspect:4/3, frame:'polaroid',
        deco:[ { type:'corners', behind:true } ]},
      { img:'dummy',  x:0.46, y:0.38, w:0.43, rot: -4, aspect:4/3, frame:'polaroid',
        deco:[ { type:'heart', at:{x:0.78, y:0.28}, size:44, rot:18 } ]},
      { img:'dummy',   x:0.64, y:0.40, w:0.42, rot:  6, aspect:4/3, frame:'polaroid',
        deco:[ { type:'stamp', lines:['місто','2024'], at:{x:0.16, y:0.18}, rot:-12 } ]},
      { img:'dummy', x:0.36, y:0.60, w:0.42, rot: -8, aspect:4/3, frame:'rounded',
        deco:[ 'tape' ]},
      { img:'dummy', x:0.60, y:0.62, w:0.42, rot: 10, aspect:4/3, frame:'rounded',
        deco:[ { type:'ditem', key:'peony', at:{x:0.82, y:0.80}, size:200, rot:-22 } ]}
    ]},
  { type:'stack', style:'sweep', photos:[
      { img:'dummy', x:0.50, y:0.34, w:0.52, rot:-4, aspect:4/3,  frame:'polaroid',
        deco:[ { type:'heart', at:{x:0.82, y:0.74}, size:48, rot:16 } ]},
      { img:'dummy',   x:0.53, y:0.52, w:0.50, rot: 3, aspect:4/3,  frame:'polaroid',
        deco:[ { type:'corners', behind:true } ]},
      { img:'dummy',x:0.48, y:0.68, w:0.48, rot:-2, aspect:16/9, frame:'polaroid-plain',
        deco:[ 'tape' ]}
    ]},
  { type:'photo', photos:[{
      img:'dummy', frame:'rounded', caption:'Тепло', date:'липень 2023'
    }],
    deco:[
      { type:'heart', at:{x:0.5, y:0.86}, size:44, rot:0, alpha:0.9 },
      { type:'ditem', key:'lavender', at:{x:0.12, y:0.08}, size:190, rot:-16 }
    ]},
  { type:'letter', heading:'Любе [Ім’я],', body:[
      'Коли я гортаю ці сторінки, я знову чую твій сміх — той самий, що наповнює кухню вранці й змушує каву бути смачнішою. Я бачу твої руки, твою тінь на стіні, твоє сонце у вікні.',
      'У кожному моменті — ти. Така справжня, така рідна. Іноді здається, що щастя — це щось велике й гучне, а воно тихо живе в простих речах: у келиху чаю, у сварці за те, хто миє посуд, у довгій розмові ні про що.'
    ] },
  { type:'letter', heading:'', body:[
      'Дякую, що наповнюєш звичайні дні світлом, якого вистачає на ціле життя. Дякую, що залишаєшся — у спеку й у сніг, у сум і у радості.',
      'З днем народження, мій любий [Ім’я]. Нехай цей альбом з роками стає товстішим — бо щасливих моментів ставатиме лише більше.',
      'Я поруч. Завжди.'
    ], sign:'— твоя, назавжди' },
  { type:'closing' },
  { type:'photo', layout:'duo', photos:[
      { img:'dummy',   caption:'Море',  frame:'polaroid',
        deco:[ { type:'stamp', lines:['море','2024'], photo:0, anchor:'bl', dx:14, dy:-8, rot:6 } ]},
      { img:'dummy', frame:'none',
        deco:[ { type:'ditem', key:'lily', photo:1, anchor:'br', dx:12, dy:10, size:180, rot:20 } ]}
    ]},
  { type:'photo', photos:[{
      img:'dummy', caption:'Наше місто', date:'серпень 2023'
    }],
    deco:[
      { type:'corners', behind:true },
      { type:'heart', at:{x:0.84, y:0.72}, size:50, rot:16 }
    ]},
  { type:'photo', layout:'trio', photos:[
      { img:'dummy', frame:'rounded',
        deco:[ { type:'ditem', key:'peony', photo:0, anchor:'tl', dx:-12, dy:-8, size:180, rot:-16 } ]},
      { img:'dummy', frame:'border',
        deco:[ { type:'clip', photo:1, anchor:'t', dx:0, dy:-26 } ]},
      { img:'dummy',   frame:'polaroid-plain',
        deco:[ { type:'heart', photo:2, anchor:'br', dx:26, dy:26, size:44, rot:12 } ]}
    ]},
  { type:'popup',
    bg: { type:'paper' },
    text: [
      { content:'НАШІ МОМЕНТИ', at:{ x:0.5, y:0.07 }, anchor:'c',
        font:'600 56px Cormorant, serif', fill: COL.sepia },
      { content:'нехай кожен день буде таким',
        at:{ x:0.5, y:0.135 }, anchor:'c',
        font:'italic 500 32px Cormorant, serif', fill: COL.inkSoft }
    ],
    deco: [
      { type:'line', at:{ x:0.5, y:0.19 }, size:220, width:1.5,
        color:'rgba(138,90,43,.5)' }
    ],
    elements: [
      { kind:'photo', img:'dummy', at:{ x:0.26, y:0.60 },
        w:0.36, frame:'polaroid', caption:'Ранок' },
      { kind:'photo', img:'dummy',     at:{ x:0.72, y:0.60 },
        w:0.36, frame:'polaroid', caption:'Море' },
      { kind:'photo', img:'dummy',  at:{ x:0.49, y:0.90 },
        w:0.44, frame:'polaroid', caption:'Поле' },
      { kind:'ditem', key:'rose',    at:{ x:0.08, y:0.95 }, size:0.10 },
      { kind:'ditem', key:'lavender', at:{ x:0.92, y:0.95 }, size:0.10 }
    ]
  },
  { type:'closing',
    text: [
      { content:'дякуємо\nза ці моменти',
        at:{ x:0.5, y:0.676 }, anchor:'c',
        font:'italic 500 46px Cormorant, serif',
        fill: COL.inkSoft, lineHeight:63 }
    ]
  }
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