/* ============================================================
   main.js — точка входа. Здесь собирается всё вместе.
   Никакой модуль ниже не делает side-effect на import —
   всё явное: init(), installUI(), applyCoverTextures().
   ============================================================ */

/* ---- config ---- */
import {
  PAGES,
  COVER_FRONT, COVER_INNER, COVER_BACK,
  TITLE_PAGE, CLOSING_DEFAULTS
} from '@config/album.js';

/* ---- core ---- */
import { IMGS, sheets, state } from '@core/store.js';
import { Progress, bindLoaderBar } from '@core/progress.js';
import {
  setVoiceRedrawHook,
  installAudioUI,
  installAudioUnlock
} from '@core/audio.js';

/* ---- paint ---- */
import { TW, TH, mkCanvas } from '@paint/utils.js';
import { paintBg }            from '@paint/backgrounds.js';
import { paintTextBlock }     from '@paint/text.js';
import { normalizeDeco, drawDecoItem } from '@paint/decor-items.js';
import { PAGE_PAINTERS, pageNum }      from '@paint/pages.js';
import { redrawVoice }        from '@paint/voices.js';

/* ---- loaders ---- */
import {
  loadAllPhotos,
  loadAllDecorItems,
  loadAllVoices
} from '@loaders/media.js';
import { loadAllModels }      from '@loaders/models.js';
import {
  preCountTasks,
  collectDecoSources
} from '@loaders/progress-count.js';

/* ---- scene ---- */
import {
  albumG,
  applyCoverTextures,
  TOTAL
} from '@scene/album.js';
import {
  makeSheet,
  makeDropMesh
} from '@scene/sheets.js';
import { registerSheetPopups } from '@scene/popups.js';
import { buildTableDecor }      from '@scene/models.js';
import { buildParticles, buildDust } from '@scene/particles.js';

/* ---- render ---- */
import { installRenderLifecycle, animate } from '@render/loop.js';

/* ---- interaction ---- */
import { initPointer }        from '@interaction/pointer.js';
import { initUI, updateUI, openHint } from '@interaction/ui.js';
import { openAlbum, closeAlbum } from '@interaction/open-close.js';
import { turnForward, turnBackward, cascade } from '@interaction/flip.js';

/* ============================================================
   Аудио-обвязка (без побочных эффектов на import)
   ============================================================ */
installAudioUI();
installAudioUnlock();
bindLoaderBar(document.getElementById('loaderBarFill'));
setVoiceRedrawHook(redrawVoice);

/* ============================================================
   buildPrintedTextures
   Прогоняет все PAGES через реестр PAGE_PAINTERS, получает
   канвасы сторон, собирает makeSheet() и наполняет sheets.
   Побочно:
     - наполняет voiceSink/videoSink/popupSink для каждой стороны
     - регистрирует попапы
     - готовит stack-страницы (paperCanvas, dropMeshes)
   ============================================================ */
function buildPrintedTextures(){
  for(let i = 0; i < TOTAL; i++){
    const front = PAGES[i * 2];
    const back  = PAGES[i * 2 + 1];

    const frontVideos = [], backVideos = [];
    const frontPopups = [], backPopups = [];
    const frontVoices = [], backVoices = [];

    const fc = PAGE_PAINTERS[front.type](
      front, i * 2 + 1, frontVideos, frontPopups, frontVoices
    );
    const bc = PAGE_PAINTERS[back.type](
      back, i * 2 + 2, backVideos, backPopups, backVoices
    );

    const sh = makeSheet(fc, bc, i, frontVideos, backVideos);
    sheets.push(sh);

    // привязка голосов к листу и текстуре (нужна для redrawVoice → needsUpdate)
    sh.voicesFront = frontVoices;
    sh.voicesBack  = backVoices;
    frontVoices.forEach(v => { v._sheet = sh; v._side = 'front'; v._tex = sh.frontTex; });
    backVoices.forEach(v  => { v._sheet = sh; v._side = 'back';  v._tex = sh.backTex;  });

    if(frontPopups.length) registerSheetPopups(i, 'front', frontPopups);
    if(backPopups.length)  registerSheetPopups(i, 'back',  backPopups);

    // stack-страница: держим paperCanvas и dropMeshes
    if(front.type === 'stack' && Array.isArray(front.photos) && front.photos.length){
      if(front.animated === false){
        sh.stackPhotos = null;      // рисуется статикой через painter
      } else {
        sh.stackPhotos  = front.photos;
        sh.stackStyle   = front.style || 'fall';
        sh.stackCount   = 1;        // первое фото уже вшито painter'ом
        sh.pageNumValue = i * 2 + 1;

        // фон+декор в отдельный canvas — потом поверх него bakeStackSheet
        sh.paperCanvas = mkCanvas(TW, TH);
        const pg = sh.paperCanvas.getContext('2d');
        paintBg(pg, TW, TH, front.bg || { type: 'paper' });
        if(front.deco){
          const bbox = {
            cx: TW/2, cy: TH/2, pw: TW, ph: TH,
            xL: 0, yT: 0, xR: TW, yB: TH
          };
          const list = Array.isArray(front.deco) ? front.deco : [front.deco];
          list.forEach(d => {
            const nd = normalizeDeco(d);
            if(!nd) return;
            drawDecoItem(pg, nd, [bbox]);
          });
        }
        sh.pageText   = front.text || null;
        sh.dropMeshes = [];

        // drop-меши для всех фото, начиная со второго
        for(let j = 1; j < front.photos.length; j++){
          const dm = makeDropMesh(front.photos[j]);
          albumG.add(dm.group);
          sh.dropMeshes.push(dm);
        }
      }
    }
  }
}

/* ============================================================
   releaseStaticCanvases
   После старта статические CanvasTexture больше не нужны в RAM.
   Оставляем только то, что реально может понадобиться:
     - stack-страницы (перерисовываются через bakeStackSheet)
     - стороны с голосами (redrawVoice пишет в canvas)
   ============================================================ */
function releaseStaticCanvases(){
  for(const sh of sheets){
    if(sh.stackPhotos) continue;

    const keepFront = sh.voicesFront && sh.voicesFront.length;
    const keepBack  = sh.voicesBack  && sh.voicesBack.length;

    if(!keepFront && sh.frontTex && sh.frontTex.image){
      sh.frontTex.image  = null;
      sh.frontCanvas     = null;
    }
    if(!keepBack && sh.backTex && sh.backTex.image){
      sh.backTex.image   = null;
      sh.backCanvas      = null;
    }
  }
}

/* ============================================================
   loadAll
   Шрифты грузим первыми — иначе paintTextBlock отрисует фолбэк.
   Потом — фото, декор, голоса. Модели идут параллельно (см. init).
   ============================================================ */
async function loadAll(){
  try{
    await Promise.all([
      document.fonts.load('600 74px Cormorant').finally(() => Progress.tick()),
      document.fonts.load('italic 500 34px Cormorant').finally(() => Progress.tick()),
      document.fonts.load('500 54px Caveat').finally(() => Progress.tick()),
      document.fonts.load('600 46px Caveat').finally(() => Progress.tick())
    ]);
    await document.fonts.ready;
  }catch(e){ /* шрифты не критичны */ }

  await loadAllPhotos();
  await loadAllDecorItems(collectDecoSources());
  await loadAllVoices();
}

/* ============================================================
   init — единственная публичная точка входа
   ============================================================ */
export async function init(){
  Progress.add(preCountTasks());

  // Параллельно: медиа + модели
  await Promise.all([ loadAll(), loadAllModels() ]);

  // 1) Обложки (нужны текстуры IMGS.items.rose и т.п.)
  applyCoverTextures();

  // 2) Все развороты
  buildPrintedTextures();

  // 3) Окружение
  buildTableDecor();
  buildParticles();
  buildDust();

  // 4) UI + ввод + жизненный цикл
  updateUI();
  installRenderLifecycle();
  initPointer();
  initUI({ turnForward, turnBackward, cascade, openAlbum });

  // 5) Запуск
  animate();

  // 6) Снять лоадер + показать подсказку
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    openHint.classList.add('show');
  }, 350);

  // 7) Отпустить статические canvas'ы после того, как GPU получит текстуры
  requestAnimationFrame(() => requestAnimationFrame(() => {
    releaseStaticCanvases();
  }));
}

/* ============================================================
   Debug-хэндл
   ============================================================ */
window.__dbg = {
  state, sheets, IMGS, TOTAL,
  PAGES,
  COVER_FRONT, COVER_INNER, COVER_BACK, TITLE_PAGE, CLOSING_DEFAULTS,
  Progress,
  openAlbum, closeAlbum,
  turnForward, turnBackward, cascade
};

/* ============================================================
   Поехали
   ============================================================ */
init();