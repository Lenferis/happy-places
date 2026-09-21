// Overlay с предупреждениями об отсутствующих ассетах + мост на console.*.
// Патч console делаем явным initConsoleBridge() — никаких side-effect на import.

const el = () => document.getElementById('assetWarning');

const messages   = new Set();
let   showTimer  = null;
let   hideTimer  = null;

const SHOW_DELAY   = 400;   // дебаунс, чтобы собрать «пачку»
const VISIBLE_TIME = 8000;  // сколько держим на экране
const MAX_LINES    = 4;     // сколько примеров показываем

function plural(n){
  const m10 = n % 10, m100 = n % 100;
  if(m10 === 1 && m100 !== 11) return '';
  if(m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'и';
  return 'ів';
}
function shorten(s){
  s = String(s).trim();
  return s.length > 64 ? s.slice(0, 61) + '…' : s;
}
function render(){
  const node = el();
  if(!node || !messages.size) return;
  const list  = [...messages];
  const total = list.length;
  const shown = list.slice(0, MAX_LINES);
  let text = '⚠ Не знайдено ' + total + ' ресурс' + plural(total) + ':\n';
  text += shown.map(m => '· ' + shorten(m)).join('\n');
  if(total > MAX_LINES) text += '\n· …ще ' + (total - MAX_LINES);
  node.textContent = text;
  node.classList.remove('show');
  void node.offsetWidth;
  node.classList.add('show');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hide, VISIBLE_TIME);
}
function hide(){
  const node = el();
  if(!node) return;
  node.classList.remove('show');
  setTimeout(() => {
    if(!node.classList.contains('show')){
      node.textContent = '';
      messages.clear();
    }
  }, 800);
}
export function showAssetWarning(msg){
  if(!msg) return;
  if(messages.has(msg)) return;
  messages.add(msg);
  clearTimeout(showTimer);
  showTimer = setTimeout(render, SHOW_DELAY);
}

// Унифицированный лог: и в консоль с префиксом [album], и в оверлей.
export function logAsset(msg, level = 'warn'){
  const line = '[album] ' + msg;
  (level === 'error' ? console.error : console.warn).call(console, line);
}