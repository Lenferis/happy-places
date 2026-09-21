let total = 0;
let done  = 0;
const subs = [];

function emit(){
  const p = total > 0 ? done / total : 0;
  for(const fn of subs) fn(p, done, total);
}

export const Progress = {
  add(n){ if(n > 0){ total += n; emit(); } },
  tick(){ done++; emit(); },
  subscribe(fn){ subs.push(fn); fn(total > 0 ? done / total : 0, done, total); },
  get value(){ return total > 0 ? done / total : 0; }
};

export function bindLoaderBar(el){
  if(!el) return;
  Progress.subscribe(p => { el.style.width = (p * 100).toFixed(2) + '%'; });
}