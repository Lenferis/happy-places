import { PAGE_W } from './layout.js';

export const WRAP_LEN = 0.095;
export const WRAP_AMP = 0.055;

export const BEND_DEFS = `#define PI_D 3.14159265
#define PAGE_W ${PAGE_W.toFixed(3)}
#define WRAP_LEN ${WRAP_LEN.toFixed(4)}
#define WRAP_AMP ${WRAP_AMP.toFixed(4)}
uniform float uTheta;
uniform float uCurl;
uniform float uWrap;
`;

export const BEND_CHUNK = `
  float bxx = uTheta + uCurl * sin(PI_D * position.x / PAGE_W);
  float sb = sin(bxx), cb = cos(bxx);
  float bp = uCurl * (PI_D / PAGE_W) * cos(PI_D * position.x / PAGE_W);
  float sw = position.x / WRAP_LEN;
  float ew = exp(1.0 - sw);
  float wOff =  uWrap * WRAP_AMP * sw * ew;
  float wDer =  uWrap * WRAP_AMP / WRAP_LEN * ew * (1.0 - sw);
  vec3 bent = vec3(position.x * cb, position.y, position.x * sb + wOff);
`;

export const pageVert = `
  ${BEND_DEFS}
  varying vec2 vUv; varying vec3 vWN; varying vec3 vWP; varying float vXn;
  void main(){
    vUv = uv;
    ${BEND_CHUNK}
    float tx = cb - position.x * sb * bp;
    float tz = sb + position.x * cb * bp + wDer;
    vXn = position.x / PAGE_W;
    vec3 ln = normalize(vec3(-tz, 0.0, tx));
    vWN = normalize(mat3(modelMatrix) * ln);
    vec4 wp = modelMatrix * vec4(bent, 1.0);
    vWP = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const pageFrag = `
  uniform sampler2D mapF;
  uniform sampler2D mapB;
  uniform sampler2D mapFVideo;
  uniform sampler2D mapBVideo;
  uniform vec3 uSun;
  uniform float uTheta;
  #define PI_D 3.14159265
  varying vec2 vUv; varying vec3 vWN; varying vec3 vWP; varying float vXn;
  void main(){
    vec3 texel;
    if(gl_FrontFacing){
      vec3 base = texture2D(mapF, vUv).rgb;
      #ifdef HAS_VIDEO_F
        vec4 vid = texture2D(mapFVideo, vUv);
        texel = mix(base, vid.rgb, vid.a);
      #else
        texel = base;
      #endif
    } else {
      vec2 uvB = vec2(1.0 - vUv.x, vUv.y);
      vec3 base = texture2D(mapB, uvB).rgb;
      #ifdef HAS_VIDEO_B
        vec4 vid = texture2D(mapBVideo, uvB);
        texel = mix(base, vid.rgb, vid.a);
      #else
        texel = base;
      #endif
    }
    vec3 N = normalize(vWN);
    if(!gl_FrontFacing) N = -N;
    vec3 L = normalize(uSun);
    float diff = clamp(dot(N, L), 0.0, 1.0);
    float lift = 0.74 + 0.32 * diff;
    vec3 col = texel * lift * vec3(1.04, 1.0, 0.94);
    vec3 V = normalize(cameraPosition - vWP);
    vec3 H = normalize(L + V);
    col += vec3(1.0, 0.95, 0.85) * pow(max(dot(N, H), 0.0), 36.0) * 0.045;
    float arch = sin(uTheta);
    col *= 1.0 - 0.17 * arch * sin(PI_D * vXn);
    float gutter = smoothstep(0.0, 0.05, gl_FrontFacing ? vUv.x : (1.0 - vUv.x));
    col *= 0.84 + 0.16 * gutter;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;