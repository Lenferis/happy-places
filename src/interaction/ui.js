/* ============================================================
   interaction/ui.js
   Всё, что касается DOM-кнопок, меты страниц и обработки клавиш.
   Не управляет перелистыванием напрямую — получает хэндлеры
   (turnForward, turnBackward, cascade, openAlbum) через initUI().
   Это разрывает цикл: flip.js / open-close.js зависят от ui.js
   (им нужен updateUI), а ui.js — нет.
   ============================================================ */

import { state, sheets } from '@core/store.js';
import { TOTAL } from '@scene/album.js';
import { updateVideoPlayback } from '@render/video.js';

/* ============================================================
   DOM-ССЫЛКИ
   Все элементы обязаны существовать в index.html к моменту
   импорта этого модуля (main.js грузится как <script type="module">
   в конце <body>, поэтому DOM уже готов).
   ============================================================ */
export const openHint   = document.getElementById('openHint');
export const dragHint   = document.getElementById('dragHint');
export const pageMeta   = document.getElementById('pageMeta');
export const pageNumber = document.getElementById('pageNumber');
export const restartBtn = document.getElementById('restartBtn');
export const navLeft    = document.getElementById('navLeft');
export const navRight   = document.getElementById('navRight');

/* ============================================================
   ОБНОВЛЕНИЕ ВИДИМОСТИ КНОПОК / МЕТЫ
   Вызывается:
     - из flip.js        (после каждого перелистывания)
     - из open-close.js  (после открытия/закрытия)
     - из stack.js       (после броска/возврата фото)
     - из main.js        (один раз при init)
   ============================================================ */
export function updateUI(){
  const spreads = TOTAL + 1;
  const sh = sheets[state.cur];

  // stack-страница показывает «текущий / всего в стопке»
  if(sh && sh.stackPhotos){
    pageNumber.textContent =
      (state.cur + 1) + ' · ' + sh.stackCount + '/' + sh.stackPhotos.length;
  } else {
    pageNumber.textContent = (state.cur + 1) + ' / ' + spreads;
  }

  // левая стрелка — только в режиме чтения
  navLeft.classList.toggle('show', state.mode === 'reading');

  // правая стрелка — только в чтении и пока не дошли до последнего разворота
  navRight.classList.toggle('show',
    state.mode === 'reading' && state.cur < TOTAL
  );

  // «Переглянути спочатку» — только в чтении и только на последнем развороте
  restartBtn.classList.toggle('show',
    state.mode === 'reading' && state.cur >= TOTAL
  );

  // синхронизация play/pause у видео с текущим положением в книге
  updateVideoPlayback();
}

/* ============================================================
   НАВЕШИВАНИЕ ОБРАБОТЧИКОВ
   Вызывается один раз из main.js после initPointer().
   Хэндлеры передаются параметром — так ui.js не тянет
   flip.js / open-close.js и не создаёт цикл.
   ============================================================ */
export function initUI(handlers){
  const {
    turnForward,
    turnBackward,
    cascade,
    openAlbum
  } = handlers || {};

  /* ---- кнопки ---- */
  if(navRight)   navRight.addEventListener('click',   () => turnForward  && turnForward());
  if(navLeft)    navLeft.addEventListener('click',    () => turnBackward && turnBackward());
  if(restartBtn) restartBtn.addEventListener('click', () => cascade      && cascade(-1));

  /* ---- клавиатура ---- */
  document.addEventListener('keydown', (e) => {

    /* --- закрытая обложка: Enter или Space открывают --- */
    if(state.mode === 'closed' && (e.key === 'Enter' || e.key === ' ')){
      e.preventDefault();
      openAlbum && openAlbum();
      return;
    }

    /* --- остальные клавиши работают только в режиме чтения --- */
    if(state.mode !== 'reading') return;

    switch(e.key){
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        turnForward && turnForward();
        break;

      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        turnBackward && turnBackward();
        break;

      case 'Home':
        e.preventDefault();
        cascade && cascade(-1);
        break;

      case 'End':
        e.preventDefault();
        cascade && cascade(1);
        break;
    }
  });
}