(function(){
'use strict';
const WORDS=new Map();
const SETS=RAW.map(s=>{
  const wn=parseInt(s.week.replace(/\D/g,''),10),k={7:'k7',8:'k8',9:'k5',10:'k10'}[wn]||['k5','k7','k8','k10'][wn%4];
  return{id:s.id,week:s.week,k,title:s.title,words:s.words.map(e=>{
    if(typeof e==='string')return WORDS.get(e);
    const vx=VX[e[0]]||{d:[e[2]],e:[e[3]]};
    const o={w:e[0],zh:e[1],def:e[2],ex:e[3],defs:vx.d,exs:vx.e,pos:e[4],g:e[5]||e[0],k,st:s.title,wk:s.week};
    WORDS.set(o.w,o);return o;
  })};
});
const ALL=[...WORDS.values()];
const POS={n:'名詞',v:'動詞',adj:'形容詞',adv:'副詞',prep:'介系詞',phr:'片語'};
const HAS_TTS=typeof window!=='undefined'&&'speechSynthesis' in window&&typeof SpeechSynthesisUtterance!=='undefined';

/* ---------- icons ---------- */
const P={
  book:'<path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13C17 4 14 4.5 12 6z"/><path d="M12 6v13"/>',
  snow:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M9.5 4.5L12 6.5l2.5-2M9.5 19.5L12 17.5l2.5 2"/>',
  bubble:'<path d="M4 5h16v11H11l-4 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  news:'<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  drop:'<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 01-12 0c0-3.5 2.5-6.5 6-11z"/>',
  rabbit:'<path d="M9 10C7.5 6 7.5 3.5 9 3c1.8.5 2.2 3.5 2 7M15 10c1.5-4 1.5-6.5 0-7-1.8.5-2.2 3.5-2 7"/><circle cx="12" cy="15" r="6"/><path d="M10 15h.01M14 15h.01"/>',
  paw:'<path d="M12 12c3 0 5 2.5 5 5 0 2-1.5 3-3 3-1 0-1.5-.5-2-.5s-1 .5-2 .5c-1.5 0-3-1-3-3 0-2.5 2-5 5-5z"/><circle cx="6.5" cy="9.5" r="1.6"/><circle cx="10" cy="5.8" r="1.6"/><circle cx="14" cy="5.8" r="1.6"/><circle cx="17.5" cy="9.5" r="1.6"/>',
  curtain:'<path d="M3 4h18M5 4c0 7-1.5 13-2 16M19 4c0 7 1.5 13 2 16M9 4c0 6-.5 11-1 16M15 4c0 6 .5 11 1 16"/>',
  bag:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>',
  flag:'<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
  bin:'<path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13M10 11v6M14 11v6"/>',
  star:'<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>'
};
const SET_ICON={'w7-sara':'bin','w7-news':'news','w7-wash':'drop','w8-rabbit':'rabbit','w8-carlos':'paw','w9-first':'book','w9-cold':'snow','w9-mosh':'bubble','w10-captain':'star','w10-stage':'curtain','w10-johnson':'bag'};
function ic(n){return `<svg viewBox="0 0 24 24" class="ico" aria-hidden="true">${P[n]}</svg>`;}
const CHECK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const SPK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const STAR='<svg viewBox="0 0 24 24" class="star %c" aria-hidden="true"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 6 21l1.3-6.8-5-4.7 6.8-.8z"/></svg>';

/* ---------- storage ---------- */
const KEY='reading-plus-vocab-v1';
function loadStore(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
let store=Object.assign({missed:[],best:0},loadStore());
if(!Array.isArray(store.missed))store.missed=[];
function saveStore(){try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}}
function addMissed(w){if(!store.missed.includes(w)){store.missed.push(w);saveStore();}}
function dropMissed(w){const i=store.missed.indexOf(w);if(i>=0){store.missed.splice(i,1);saveStore();}}

/* ---------- helpers ---------- */
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function rnd1(l){return l[Math.floor(Math.random()*l.length)];}
function variant(t){const b=t.__b||t;return Object.assign(Object.create(b),{__b:b,def:rnd1(b.defs||[b.def]),ex:rnd1(b.exs||[b.ex])});}
function rx(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function mark(ex,w,repl){return ex.replace(new RegExp(rx(w),'i'),repl);}
function say(t){if(!HAS_TTS)return;try{const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.85;try{const v=speechSynthesis.getVoices().find(v=>/^en[-_]US/i.test(v.lang));if(v)u.voice=v;}catch(e){}speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}
function speakBtn(text,label){label=label||'聽單字發音';return HAS_TTS?`<button class="speak" data-act="say" data-w="${text}" aria-label="${label}" title="${label}">${SPK}</button>`:'';}
function info(o,withDef){
  return `<div class="info"><div class="wc-top"><span class="wc-word">${o.w}</span><span class="pos">${POS[o.pos]||''}</span>${speakBtn(o.w)}</div>
  <div class="wc-zh">${o.zh}</div>${withDef?`<div class="wc-def">${o.def}</div>`:''}
  <div class="exrow">${speakBtn(o.ex,'再聽一次例句')}<p class="wc-ex">${mark(o.ex,o.w,'<mark>$&</mark>')}</p></div></div>`;
}

/* ---------- state ---------- */
const app=document.getElementById('app');
const S={view:'game',sel:new Set(SETS.map(s=>s.id)),count:0,quiz:null,deck:null};
function poolFromSel(){
  const seen=new Set(),out=[];const add=o=>{if(o&&!seen.has(o.w)){seen.add(o.w);out.push(o);}};
  SETS.forEach(s=>{if(S.sel.has(s.id))s.words.forEach(add);});
  if(S.sel.has('missed'))store.missed.forEach(w=>add(WORDS.get(w)));
  return out;
}

/* ---------- quiz generation: new random order, questions and options every time ---------- */
function typeSeq(n){return shuffle(Array.from({length:n},(_,i)=>i%2?'def':'cloze'));}
function makeChoices(t,type){
  t=t.__b||t;
  const others=shuffle(ALL.filter(o=>o!==t&&o.g!==t.g&&o.zh!==t.zh));
  let picks;
  if(type==='cloze'){
    picks=others.filter(o=>o.pos!==t.pos).slice(0,3);
    if(picks.length<3)picks=picks.concat(others.filter(o=>!picks.includes(o)).slice(0,3-picks.length));
  }else{
    picks=others.filter(o=>o.pos===t.pos).slice(0,3);
    if(picks.length<3)picks=picks.concat(others.filter(o=>!picks.includes(o)).slice(0,3-picks.length));
  }
  return shuffle([{o:t,correct:true},...picks.map(o=>({o,correct:false}))]);
}
function makeQuiz(pool,n){
  const take=shuffle(pool).slice(0,n&&n<pool.length?n:pool.length);
  const types=typeSeq(take.length);
  return{qs:take.map((t0,i)=>{const t=variant(t0);return{type:types[i],t,choices:makeChoices(t,types[i]),pick:null,hint:false};}),i:0,score:0,wrong:[]};
}

/* ---------- views ---------- */
const LOGO='<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="var(--sun)"/><g transform="translate(8 8) scale(1.0)" fill="none" stroke="var(--on-sun)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13C17 4 14 4.5 12 6z" transform="translate(0 1)"/><path d="M12 7v13"/></g></svg>';
const DECO='<svg class="deco" viewBox="0 0 100 100" aria-hidden="true"><circle cx="30" cy="30" r="16" class="d7"/><rect x="52" y="14" width="30" height="30" rx="9" transform="rotate(14 67 29)" class="d5"/><path d="M70 60l5 10 11 1.5-8 7.5 2 11-10-5.5-10 5.5 2-11-8-7.5 11-1.5z" class="dsun"/><circle cx="26" cy="74" r="9" class="d8"/></svg>';

function tile(s){
  const on=S.sel.has(s.id);
  return `<button class="tile ${s.k}" data-act="toggle" data-id="${s.id}" aria-pressed="${on}"><span class="ck">${CHECK}</span><span class="ic">${ic(SET_ICON[s.id]||'book')}</span><span><span class="tt">${s.title}</span><br><span class="nn">${s.words.length} 個單字</span></span></button>`;
}
function viewHome(){
  const pool=poolFromSel();
  const weeks=[...new Set(SETS.map(s=>s.week))];
  const blocks=weeks.map(wk=>{const ss=SETS.filter(s=>s.week===wk);return `<div class="weekblock ${ss[0].k}"><div class="wk"><i></i>${wk}</div><div class="tiles">${ss.map(tile).join('')}</div></div>`;}).join('');
  const missed=store.missed.length?`<div class="weekblock"><div class="wk">我的錯題本</div><div class="tiles"><button class="tile mis" data-act="toggle" data-id="missed" aria-pressed="${S.sel.has('missed')}"><span class="ck">${CHECK}</span><span class="ic">${ic('flag')}</span><span><span class="tt">答錯過的字</span><br><span class="nn">${store.missed.length} 個單字</span></span></button></div></div>`:'';
  const counts=[5,10,20,0].map(n=>`<button data-act="count" data-n="${n}" aria-pressed="${S.count===n}">${n?n+' 題':'全部'}</button>`).join('');
  const qn=S.count?Math.min(S.count,pool.length):pool.length;
  return `<div class="home">
  <div class="appbar g-appbar"><svg viewBox="0 0 40 40" aria-hidden="true">${LOGO.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg><div><b>Reading Plus</b><span>單字練習</span></div><button class="link" style="margin-left:auto" data-act="goGame">⚔️ 回打怪遊戲</button></div>
  <section class="hero g-hero"><h1>今天想練哪一課？</h1><p>點選課文，再按「開始測驗」。每次的題目和選項都會重新亂數。</p>${DECO}</section>
  <div class="stats g-stats"><div class="stat"><b>${ALL.length}</b><span>個單字</span></div><div class="stat"><b>${SETS.length}</b><span>篇課文</span></div><div class="stat"><b>${store.best?store.best+'%':'—'}</b><span>最佳成績</span></div></div>
  <section class="picker g-picker"><div class="sec-h"><h2>選擇課文</h2><div class="links"><button class="link" data-act="all">全選</button><button class="link" data-act="none">清除</button></div></div>${missed}${blocks}</section>
  <section class="card g-set"><h2 style="font-size:19px">測驗題數</h2><div class="seg">${counts}</div></section>
  <div class="dock g-dock"><div class="dock-in"><div class="sum">已選 ${pool.length} 字<small>${pool.length?`測驗 ${qn} 題`:'請先選課文'}</small></div>
    <button class="btn" data-act="startCards" ${pool.length?'':'disabled'}>單字卡</button><button class="btn primary" data-act="startQuiz" ${pool.length?'':'disabled'}>開始測驗</button></div></div>
  <p class="foot g-foot">題型：句子填空、英文解釋（全英文，每個字有多組解釋和例句，每次隨機出）</p></div>`;
}

function viewQuiz(){
  const Q=S.quiz,q=Q.qs[Q.i],n=Q.qs.length,done=q.pick!==null,ok=done&&q.choices[q.pick].correct,last=Q.i+1>=n;
  const hint='';
  let prompt;
  if(q.type==='def'){
    const d=q.t.def.charAt(0).toUpperCase()+q.t.def.slice(1)+(/[.?!)]$/.test(q.t.def)?'':'.');
    prompt=`<div class="qprompt">Which word matches this meaning?</div><p class="qsent">${d}</p>${hint}`;
  }else{
    const sent=done?mark(q.t.ex,q.t.w,'<mark>$&</mark>'):mark(q.t.ex,q.t.w,'<span class="blank"></span>');
    prompt=`<div class="qprompt">Choose the word that fits the blank</div><p class="qsent">${sent}</p>${hint}`;
  }
  const typeLabel=q.type==='def'?'Meaning':'Fill in the blank';
  const choices=q.choices.map((c,idx)=>{
    const cls=done?(c.correct?'correct':idx===q.pick?'wrong':'dim'):'';
    return `<button class="choice ${cls}" data-act="pick" data-i="${idx}" ${done?'disabled':''}><span class="key">${idx+1}</span>${c.o.w}</button>`;
  }).join('');
  const sheet=done?`<div class="sheet ${ok?'ok':'no'}"><div class="sheet-in"><h3>${ok?CHECK:CROSS}${ok?'答對了！':'差一點，再記一次'}</h3>${info(q.t,true)}
    <button class="btn block ${ok?'good':'bad'}" id="next" data-act="next">${last?'看成績':'繼續'}</button></div></div>`:'';
  const pct=((Q.i+(done?1:0))/n*100).toFixed(0);
  return `<div class="qbar"><button class="x" data-act="home" aria-label="離開測驗"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="track"><i style="width:${pct}%"></i></div><span class="pill">${Q.i+1}/${n}</span></div>
  <div class="qgrid"><section class="qcard ${q.t.k}"><div class="tags"><span class="tag">${q.t.wk} · ${q.t.st}</span><span class="tag plain">${typeLabel}</span></div>${prompt}</section>
  <div class="choices">${choices}</div></div>${sheet}`;
}

function confetti(){
  const cols=['var(--k5)','var(--k7)','var(--k8)','var(--k10)','var(--sun)'];let h='';
  for(let i=0;i<28;i++)h+=`<i style="left:${(Math.random()*100).toFixed(1)}%;background:${cols[i%5]};animation-delay:${(Math.random()*.8).toFixed(2)}s;animation-duration:${(2.2+Math.random()*1.6).toFixed(2)}s"></i>`;
  return `<div class="confetti" aria-hidden="true">${h}</div>`;
}
function viewResult(){
  const Q=S.quiz,n=Q.qs.length,pct=Math.round(Q.score/n*100);
  const stars=pct>=90?3:pct>=70?2:pct>=50?1:0;
  const msg=pct===100?'全部答對，太厲害了！':pct>=90?'非常棒！只差一點點。':pct>=70?'很不錯！再練習錯的字會更穩。':pct>=50?'有進步空間，看看右邊的字再試一次。':'沒關係，先看單字卡再來挑戰。';
  const C=2*Math.PI*78,off=C*(1-pct/100);
  const wrongs=Q.wrong.length?`<div class="rr"><div class="sec-h"><h2>這幾個字再看一次</h2></div><div class="wrows">${Q.wrong.map(o=>`<div class="wrow ${o.k}"><i></i><div><b>${o.w}</b><span>${o.zh}</span></div></div>`).join('')}</div></div>`:'';
  return `${pct>=70?confetti():''}<div class="qbar"><button class="x" data-act="home" aria-label="回首頁"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="track"><i style="width:100%"></i></div><span class="pill">${n}/${n}</span></div>
  <div class="rgrid ${Q.wrong.length?'':'solo'}"><div class="rl"><section class="card hero-r"><div class="ring"><svg viewBox="0 0 180 180" width="180" height="180" aria-hidden="true"><circle cx="90" cy="90" r="78" fill="none" stroke="var(--line)" stroke-width="16"/><circle cx="90" cy="90" r="78" fill="none" stroke="var(--k10)" stroke-width="16" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 90 90)"/></svg><div class="num"><span>${Q.score}<small>/${n}</small></span></div></div>
  <div class="stars">${[0,1,2].map(i=>STAR.replace('%c',i<stars?'on':'')).join('')}</div><p class="msg">${msg}</p>${store.best&&pct>=store.best?'<p class="foot">這是你目前最好的成績！</p>':''}</section>
  <div class="stack"><button class="btn primary block" data-act="again">再考一次（重新亂數）</button>${Q.wrong.length?'<button class="btn block" data-act="retryWrong">練習答錯的字</button>':''}<button class="btn block" data-act="home">回首頁</button></div></div>${wrongs}</div>`;
}

function isLearned(id){const g=G();return !!(g.learned[id]||g.def[id]||g.stars[id]);}
function startLearn(id){const s=SETS.find(x=>x.id===id);if(!s)return;S.learn={id,i:0,words:s.words.slice(),k:s.k,title:s.title,heard:[],tok:0};S.view='learn';render();top();learnSpeak();}
// learning screen: auto-read the word, pause 0.5s, then the sentence; the next button stays locked until both were heard (not when reviewing)
function learnSpeak(){
  const L=S.learn;if(!L)return;const i=L.i,o=L.words[i],tok=L.tok=(L.tok||0)+1;
  const alive=()=>S.view==='learn'&&S.learn===L&&L.tok===tok&&L.i===i;
  const mark=(hl,p)=>{const c=document.querySelector('.lcard');if(c){c.dataset.hl=hl;c.dataset.p=p?'1':'';}};
  const release=()=>{if(!alive())return;mark('',0);L.heard[i]=1;const b=document.getElementById('lnextB');if(b&&b.disabled){b.disabled=false;b.textContent=b.dataset.t;}};
  const say1=(t,hl,next)=>{if(!alive())return;mark(hl,1);let over=false;const go=()=>{if(over)return;over=true;if(alive())next();};
    if(!HAS_TTS){setTimeout(go,Math.min(3500,900+t.length*45));return;}
    try{const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=hl==='word'?.8:.85;
      try{const v=speechSynthesis.getVoices().find(v=>/^en[-_]US/i.test(v.lang));if(v)u.voice=v;}catch(e){}
      let st=false;u.onstart=()=>{st=true;};u.onend=go;u.onerror=go;speechSynthesis.speak(u);
      setTimeout(()=>{if(!st)go();},2500);setTimeout(go,Math.max(6000,t.length*160));}catch(e){go();}};
  try{if(HAS_TTS)speechSynthesis.cancel();}catch(e){}
  setTimeout(()=>{if(!alive())return;say1(o.w,'word',()=>setTimeout(()=>say1(o.ex,'sent',release),500));},300);
}
function viewLearn(){
  const L=S.learn,n=L.words.length,o=L.words[L.i],last=L.i===n-1,done=isLearned(L.id),lock=!done&&!L.heard[L.i];
  const bar=`<div class="qbar"><button class="x" data-act="goGame" aria-label="回到地圖"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="track"><i style="width:${((L.i+1)/n*100).toFixed(0)}%"></i></div><span class="pill">${L.i+1}/${n}</span></div>`;
  return `<div class="cview learn">${bar}<p class="lhint">📖 先把這課的單字看過一遍，就可以開始打怪囉！</p>
  <section class="card lcard ${L.k}"><div class="qword">${o.w}${speakBtn(o.w)}</div><span class="pos">${POS[o.pos]||''}</span><div class="zh">${o.zh}</div><div class="wc-def">${o.def}</div><div class="exrow">${speakBtn(o.ex,'聽例句')}<p class="wc-ex">${mark(o.ex,o.w,'<mark>$&</mark>')}</p></div></section>
  ${HAS_TTS?'<button class="lreplay" data-act="lreplay">🔁 再聽一次</button>':''}
  <div class="btnrow">${L.i>0?'<button class="btn" data-act="lprev">上一張</button>':''}${(()=>{const t=last?(done?'開始打怪':'學完了，開始打怪'):'下一張';return `<button class="btn primary" id="lnextB" data-act="${last?'ldone':'lnext'}" data-t="${t}" ${lock?'disabled':''}>${lock?'🔊 聆聽中…':t}</button>`;})()}</div></div>`;
}
function viewCards(){
  const D=S.deck;
  const bar=`<div class="qbar"><button class="x" data-act="home" aria-label="離開"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="track"><i style="width:${(D.i/D.cards.length*100).toFixed(0)}%"></i></div><span class="pill">${Math.min(D.i+1,D.cards.length)}/${D.cards.length}</span></div>`;
  if(D.i>=D.cards.length){
    return `<div class="cview">${bar}<section class="card hero-r"><h2>單字卡看完了</h2><p class="msg">共 ${D.cards.length} 張，標記「還不熟」的有 ${D.review.length} 張。</p></section>
    <div class="stack">${D.review.length?'<button class="btn good block" data-act="quizReview">測驗還不熟的字</button>':''}<button class="btn primary block" data-act="startQuiz">開始測驗</button><button class="btn block" data-act="startCards">再洗一次牌</button></div></div>`;
  }
  const o=D.cards[D.i];
  return `<div class="cview">${bar}<div class="scene ${o.k}"><div class="card3d" id="card" data-act="flip">
    <div class="face front"><div class="tags"><span class="tag">${o.wk} · ${o.st}</span></div><div class="qword">${o.w}${speakBtn(o.w)}</div><span class="pos">${POS[o.pos]||''}</span><div class="tap">點一下卡片，看意思</div></div>
    <div class="face back"><span class="pos">${POS[o.pos]||''}</span><div class="zh">${o.zh}</div><div class="wc-def">${o.def}</div><div class="exrow">${speakBtn(o.ex,'再聽一次例句')}<p class="wc-ex">${mark(o.ex,o.w,'<mark>$&</mark>')}</p></div></div></div></div>
  <div id="act1" class="stack"><button class="btn primary block" data-act="flip">翻面看意思</button></div>
  <div id="act2" class="btnrow" hidden><button class="btn" data-act="unsure">還不熟</button><button class="btn good" data-act="known">記得了</button></div></div>`;
}

function render(){
  const gv=['game','battle','reward','defeat','coll','shop','heroes','learn'].includes(S.view);
  app.className='wrap'+(S.view==='home'?' pad-dock':(S.view==='quiz'&&S.quiz.qs[S.quiz.i].pick!==null?' pad-sheet':''))+(gv?' gm':'')+(S.view==='battle'?' bat':'')+(S.view==='battle'&&B&&B.anim==='atk'?' shake':'')+(S.view==='battle'&&E3.ok?' c3on':'');
  app.innerHTML=S.view==='game'?viewGame():S.view==='battle'?viewBattle():S.view==='reward'?viewReward():S.view==='defeat'?viewDefeat():S.view==='coll'?viewColl():S.view==='shop'?viewShop():S.view==='heroes'?viewHeroes():S.view==='learn'?viewLearn():S.view==='home'?viewHome():S.view==='quiz'?viewQuiz():S.view==='result'?viewResult():viewCards();
  if(S.view==='quiz'&&S.quiz.qs[S.quiz.i].pick!==null){const nx=document.getElementById('next');if(nx)nx.focus({preventScroll:true});}
  afterGameRender();
}
function top(){try{window.scrollTo(0,0)}catch(e){}}

/* ---------- actions ---------- */
function startQuiz(pool,count){S.quiz=makeQuiz(pool,count);S.view='quiz';render();top();}
function answer(idx){
  const Q=S.quiz,q=Q.qs[Q.i];if(q.pick!==null)return;
  q.pick=idx;
  if(q.choices[idx].correct){Q.score++;dropMissed(q.t.w);}
  else{Q.wrong.push(q.t);addMissed(q.t.w);}
  render();
  say(q.t.ex);
}
function next(){
  const Q=S.quiz;
  if(Q.i+1<Q.qs.length){Q.i++;render();top();}
  else{
    const pct=Math.round(Q.score/Q.qs.length*100);
    if(pct>=(store.best||0)){store.best=pct;saveStore();}
    S.view='result';render();top();
  }
}
function startCards(){S.deck={cards:shuffle(poolFromSel()),i:0,flip:false,review:[]};S.view='cards';render();top();}
function flipCard(){
  if(S.deck.flip)return;
  S.deck.flip=true;
  say(S.deck.cards[S.deck.i].ex);
  const c=document.getElementById('card'),a1=document.getElementById('act1'),a2=document.getElementById('act2');
  if(c)c.classList.add('flipped');if(a1)a1.hidden=true;if(a2)a2.hidden=false;
}

/* ================= GAME: monster battles ================= */
const MBY={};RMON.forEach(m=>{MBY[m.id]=m;});
const SETMON={};SETS.forEach((s,i)=>{SETMON[s.id]=MPLAN.normal[i%MPLAN.normal.length];});
const MON_IDS=MPLAN.normal.slice();
const wkNum=s=>parseInt(s.week.replace(/\D/g,''),10);
const WEEKS=[...new Set(SETS.map(wkNum))].sort((a,b)=>a-b);
const ELITES=WEEKS.map((w,i)=>{const ss=SETS.filter(s=>wkNum(s)===w);return{id:'e'+w,kind:'elite',week:w,mon:MPLAN.elite[i%MPLAN.elite.length],sets:ss,k:ss[0].k};});
const BOSSES=[];for(let i=0;i<WEEKS.length;i+=2){const ws=WEEKS.slice(i,i+2),ss=SETS.filter(s=>ws.includes(wkNum(s)));BOSSES.push({id:'b'+(i/2),kind:'boss',weeks:ws,mon:MPLAN.boss[(i/2)%MPLAN.boss.length],elites:ws.map(w=>'e'+w),sets:ss,k:ss[0].k});}
const BATTLE={};SETS.forEach(s=>{BATTLE[s.id]=s;});ELITES.concat(BOSSES).forEach(b=>{BATTLE[b.id]=b;});
function monSprite(id){return (typeof MSPR!=='undefined'&&MSPR[id])||RSPR[id]||null;}
function monName(id){const m=MBY[id];return m?m.zh:(MON[id]?MON[id].zh:'怪物');}
function uniqWords(sets){const m=new Map();sets.forEach(s=>s.words.forEach(w=>{if(!m.has(w.w))m.set(w.w,w);}));return [...m.values()];}
function starsOf(id){const g=G();if(g.stars[id]!=null)return g.stars[id];return g.def[id]?2:0;}
function eliteOpen(e){return e.sets.every(s=>starsOf(s.id)>=2);}
function bossOpen(b){return b.elites.every(id=>starsOf(id)>=2);}
function starsHTML(n,cls){let h='';for(let i=0;i<3;i++)h+=`<i class="${i<n?'on':''}">★</i>`;return `<span class="stars ${cls||''}">${h}</span>`;}
const RUSH_MS=1200,LOCK_MS=2000;
function rushToast(){try{let t=document.getElementById('rushmsg');if(!t){t=document.createElement('div');t.id='rushmsg';t.style.cssText='position:fixed;left:50%;top:46%;transform:translate(-50%,-50%);z-index:90;background:#16324F;color:#fff;font:800 20px/1.3 var(--font-display,sans-serif);padding:14px 22px;border-radius:18px;box-shadow:0 8px 24px rgba(0,0,0,.35);text-align:center;pointer-events:none;transition:opacity .25s';document.body.appendChild(t);}
  t.textContent='👀 先讀完題目，再選答案喔！';t.style.opacity='1';clearTimeout(rushToast.h);rushToast.h=setTimeout(()=>{t.style.opacity='0';},1300);}catch(e){}}
const RAR=['普通','稀有','閃亮'];
const PROJ={};
function projOf(id){const m=MBY[id];const T=m&&TYPES.find(t=>t[0]===m.t);return (T&&T[2])||'💥';}
const GOAL=10;
const HEART='<svg class="heart %c" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8 3 4.5 6.4 4.5c2 0 3.6 1.1 4.6 2.7h2c1-1.6 2.6-2.7 4.6-2.7 3.4 0 5.5 3.5 4 7.2C19.5 16.4 12 21 12 21z"/></svg>';

function G(){
  if(!store.g)store.g={};
  const g=store.g;
  const D0={xp:0,coins:0,mast:{},def:{},boss:0,cards:{},reward:'stats',snd:true,day:'',today:0,streak:0,goalDay:'',heroId:'h1',rcards:{},stars:{},learned:{}};for(const k in D0)if(g[k]==null)g[k]=D0[k];
  if(!g.own)g.own=[];if(!g.eq)g.eq={hat:'',outfit:'tunic',back:'',weapon:''};if(!g.inv)g.inv={potion:0,crystal:0,note:0};
  if(g.gear){const P={sword:30,shield:40,hat:50,clover:60,crown:120};let sum=0;for(const k in g.gear){const l=Math.min(3,g.gear[k]||0),p=P[k]||0;sum+=[0,1,3,7][l]*p;}g.coins+=sum;g.refunded=sum;delete g.gear;}
  if(!HSPR[g.heroId])g.heroId='h1';
  if(!g.cosRef){let sum=0;(g.own||[]).forEach(k=>{const p=k.split(':'),it=(COSM[p[0]]||[]).find(x=>x.id===p[1]);if(it)sum+=it.price;});g.coins+=sum;g.own=[];g.cosRef=1;g.cosRefund=sum;}
  return g;
}
const lvlOf=xp=>1+Math.floor(Math.sqrt(xp/25));
const xpAt=l=>25*(l-1)*(l-1);
function pmax(){return 5;}
function mmax(b){return(b&&(b.kind==='elite'||b.kind==='boss'))?5:3;}
function dstr(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function todayStr(){return dstr(new Date());}
function ydayStr(){const d=new Date();d.setDate(d.getDate()-1);return dstr(d);}
function rollDay(){const g=G();if(g.day!==todayStr()){g.day=todayStr();g.today=0;}}
function streakNow(){const g=G();return(g.goalDay===todayStr()||g.goalDay===ydayStr())?g.streak:0;}
function addXp(n){G().xp+=n;}
function rnd(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function learned(s){const g=G();return s.words.filter(w=>(g.mast[w.w]||0)>=3).length;}
function allDefeated(){const g=G();return SETS.every(s=>g.def[s.id]);}

/* ---------- sound (WebAudio, no files) ---------- */
let AC=null;
function ac(){try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C();}if(AC&&AC.state==='suspended')AC.resume();}catch(e){}return AC;}
function tone(f,d,type,t0,vol,slide){
  if(!G().snd)return;const a=ac();if(!a)return;
  try{
    const o=a.createOscillator(),gn=a.createGain(),t=a.currentTime+(t0||0);
    o.type=type||'sine';o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);
    gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol||.12,t+.015);gn.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(gn);gn.connect(a.destination);o.start(t);o.stop(t+d+.02);
  }catch(e){}
}
const SFX={
  hit(){tone(620,.09,'square',0,.1,-300);tone(330,.14,'square',.07,.1,-150);},
  crit(){tone(880,.08,'square',0,.1,-400);tone(660,.1,'square',.06,.1);tone(990,.18,'triangle',.12,.12,-300);},
  hurt(){tone(200,.28,'sawtooth',0,.12,-120);tone(120,.3,'square',.1,.09,-50);},
  win(){[523,659,784,1047].forEach((f,i)=>tone(f,.2,'triangle',i*.12,.14));},
  lose(){[392,330,262].forEach((f,i)=>tone(f,.28,'sine',i*.2,.12));},
  coin(){tone(988,.08,'square',0,.08);tone(1319,.2,'square',.08,.08);},
  open(){[392,523,659,784,1047].forEach((f,i)=>tone(f,.14,'triangle',i*.07,.12));},
  tap(){tone(500,.05,'sine',0,.07);}
};

/* ---------- animation helpers ---------- */
function burst(emojis,n){
  const fx=document.querySelector('.stage .fx');if(!fx)return;
  for(let i=0;i<n;i++){
    const s=document.createElement('span');s.className='pt';
    const a=Math.random()*Math.PI*2,r=80+Math.random()*110;
    s.style.setProperty('--dx',Math.round(Math.cos(a)*r)+'px');
    s.style.setProperty('--dy',Math.round(Math.sin(a)*r-30)+'px');
    s.style.animationDelay=(Math.random()*.15)+'s';
    s.textContent=emojis[i%emojis.length];fx.appendChild(s);
  }
}

/* ---------- hero (dress-up) ---------- */
const COSM={
  hat:[{id:'straw',name:'草帽',price:20,req:0},{id:'wizard',name:'魔法帽',price:50,req:15},{id:'knight',name:'騎士頭盔',price:90,req:30},{id:'crown',name:'金皇冠',price:160,req:55}],
  outfit:[{id:'tunic',name:'冒險藍衣',price:0,req:0},{id:'red',name:'紅披英雄服',price:40,req:10},{id:'armor',name:'銀色鎧甲',price:100,req:30},{id:'robe',name:'星星法袍',price:170,req:50}],
  back:[{id:'cape',name:'紅披風',price:40,req:10},{id:'angel',name:'天使翅膀',price:120,req:35},{id:'dragon',name:'龍翼',price:200,req:60}],
  weapon:[{id:'wood',name:'木劍',price:20,req:0},{id:'wand',name:'魔法棒',price:60,req:20},{id:'big',name:'閃亮大劍',price:120,req:40},{id:'pencil',name:'黃金鉛筆',price:220,req:65}]
};
const SLOTN={hat:'帽子',outfit:'衣服',back:'背飾',weapon:'武器'};
const TOOLS=[
  {id:'potion',icon:'🧪',name:'復活藥水',desc:'戰鬥中點「藥水」鈕回復 3 顆愛心；愛心歸零時也會自動使用（可以買很多瓶）',price:30,stack:true},
  {id:'crystal',icon:'🔮',name:'提示水晶',desc:'答題時使用，去掉 2 個錯誤選項（可以買很多顆）',price:15,stack:true},
  {id:'note',icon:'📒',name:'單字筆記',desc:'答錯的字，之後再答對就多得 3 金幣（買一次永久有效）',price:60,stack:false}
];
let HID=0;
function learnedTotal(){const g=G();return ALL.filter(w=>(g.mast[w.w]||0)>=3).length;}
function owns(slot,it){return it.price===0||G().own.includes(slot+':'+it.id);}
function heroSVG(eq){
  const i=++HID,O='#1B2A4A',sw=(w)=>`stroke="${O}" stroke-width="${((w||4)*0.95).toFixed(1)}" stroke-linejoin="round" stroke-linecap="round"`,SK='#FFD9B5';
  const hand=(x,y)=>`<circle cx="${x}" cy="${y}" r="6" fill="${SK}" ${sw(3.5)}/>`;
  const limb=(d,c)=>`<path d="${d}" fill="none" stroke="${O}" stroke-width="14" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`;
  const star=(cx,cy,R,r,f,w)=>{let p=[];for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,q=k%2?r:R;p.push((cx+q*Math.cos(a)).toFixed(1)+','+(cy+q*Math.sin(a)).toFixed(1));}return `<polygon points="${p.join(' ')}" fill="${f}" ${sw(w||2.5)}/>`;};
  const mir=s=>`<g transform="translate(130 0) scale(-1 1)">${s}</g>`;
  let back='';
  if(eq.back==='cape')back=`<path d="M44 82 Q28 120 34 140 L96 140 Q102 120 86 82Z" fill="#E5484D" ${sw()}/><path d="M52 92 Q44 120 48 136 L82 136 Q86 120 78 92Z" fill="#C73A3F"/>`;
  if(eq.back==='angel'){const w=`<path d="M46 86 Q6 54 4 102 Q20 98 28 112 Q36 104 48 108Z" fill="#fff" ${sw()}/><path d="M16 88 Q22 96 24 104 M28 84 Q32 94 34 102" stroke="#C9D6E5" stroke-width="3" fill="none" stroke-linecap="round"/>`;back=w+mir(w);}
  if(eq.back==='dragon'){const w=`<path d="M46 84 Q2 44 0 108 Q14 96 22 112 Q30 100 38 114 Q42 102 50 106Z" fill="#7A4BE0" ${sw()}/><path d="M8 76 L20 100 M20 68 L30 98" stroke="#4B2DA8" stroke-width="3" fill="none" stroke-linecap="round"/>`;back=w+mir(w);}
  const robe=eq.outfit==='robe';
  const legs=robe?'':`<rect x="50" y="114" width="12" height="22" rx="5" fill="#27407A" ${sw()}/><rect x="68" y="114" width="12" height="22" rx="5" fill="#27407A" ${sw()}/><ellipse cx="55" cy="138" rx="10" ry="5.5" fill="#7A4A2A" ${sw(3.5)}/><ellipse cx="75" cy="138" rx="10" ry="5.5" fill="#7A4A2A" ${sw(3.5)}/>`;
  let body,sl;
  if(eq.outfit==='red'){sl='#E5484D';body=`<rect x="46" y="80" width="38" height="40" rx="14" fill="#E5484D" ${sw()}/><rect x="46" y="106" width="38" height="7" fill="#fff" ${sw(3)}/>${star(65,94,8,3.5,'#FFD35A',2.5)}`;}
  else if(eq.outfit==='armor'){sl='#B8C4D6';body=`<rect x="46" y="80" width="38" height="40" rx="12" fill="#B8C4D6" ${sw()}/><path d="M46 96H84M65 82V118" stroke="#8294AD" stroke-width="3.5" fill="none"/><rect x="46" y="108" width="38" height="7" fill="#FFD35A" ${sw(3)}/><circle cx="47" cy="86" r="8" fill="#D6DFEB" ${sw(3.5)}/><circle cx="83" cy="86" r="8" fill="#D6DFEB" ${sw(3.5)}/>`;}
  else if(robe){sl='#5B3FC4';body=`<path d="M47 80 H83 L93 138 H37 Z" fill="#5B3FC4" ${sw()}/><path d="M39 130 H91" stroke="#FFD35A" stroke-width="5" stroke-linecap="round"/>${star(60,100,5,2.2,'#FFD35A',1.8)}${star(74,114,4.5,2,'#FFD35A',1.8)}${star(56,121,3.5,1.6,'#FFD35A',1.5)}<ellipse cx="54" cy="139" rx="8" ry="4.5" fill="#7A4A2A" ${sw(3)}/><ellipse cx="76" cy="139" rx="8" ry="4.5" fill="#7A4A2A" ${sw(3)}/>`;}
  else{sl='#3B82F6';body=`<rect x="46" y="80" width="38" height="40" rx="14" fill="#3B82F6" ${sw()}/><rect x="46" y="106" width="38" height="7" fill="#FFC83D" ${sw(3)}/><path d="M58 80 L65 90 L72 80" fill="#fff" ${sw(3)}/>`;}
  const arms=limb('M47 88 Q35 96 35 108',sl)+hand(35,110)+limb('M83 88 Q95 96 95 108',sl);
  const head=`<circle cx="36" cy="56" r="6" fill="${SK}" ${sw(3.5)}/><circle cx="94" cy="56" r="6" fill="${SK}" ${sw(3.5)}/><circle cx="65" cy="52" r="29" fill="${SK}" ${sw()}/>
  <path d="M36 50 Q34 20 65 20 Q96 20 94 50 Q88 36 72 36 Q58 42 48 38 Q40 42 36 50Z" fill="#6B3E26" ${sw()}/>
  <circle cx="53" cy="55" r="10" fill="#fff" ${sw(3)}/><circle cx="78" cy="56" r="8" fill="#fff" ${sw(3)}/><circle cx="56" cy="58" r="4.2" fill="${O}"/><circle cx="76" cy="58" r="3.6" fill="${O}"/><circle cx="57.4" cy="56.2" r="1.5" fill="#fff"/><circle cx="77.2" cy="56.6" r="1.3" fill="#fff"/><path d="M43 47 Q53 41 63 47" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M54 68 Q65 86 77 68 Z" fill="#7A1E3A" ${sw(3)}/><rect x="60" y="68" width="6" height="6" rx="1.5" fill="#fff" ${sw(1.6)}/><rect x="68" y="68" width="6" height="6" rx="1.5" fill="#fff" ${sw(1.6)}/><path d="M60 80 Q66 76 72 80 Q66 85 60 80Z" fill="#FF7A8A"/>
  <ellipse cx="42" cy="68" rx="5.5" ry="3.4" fill="#FF8FA3" opacity=".7"/><ellipse cx="88" cy="68" rx="5.5" ry="3.4" fill="#FF8FA3" opacity=".7"/>`;
  let hat='';
  if(eq.hat==='straw')hat=`<ellipse cx="65" cy="32" rx="35" ry="8" fill="#F2D27A" ${sw()}/><path d="M44 32 Q44 8 65 8 Q86 8 86 32Z" fill="#F7E08F" ${sw()}/><rect x="44" y="23" width="42" height="7" fill="#E5484D" ${sw(3)}/>`;
  if(eq.hat==='wizard')hat=`<path d="M41 32 Q58 26 60 8 Q62 -6 74 -4 Q80 22 90 32Z" fill="#5B3FC4" ${sw()}/><ellipse cx="65" cy="33" rx="37" ry="7" fill="#7A5BE0" ${sw()}/>${star(68,16,6,2.6,'#FFD35A',2)}`;
  if(eq.hat==='knight')hat=`<path d="M34 46 Q34 8 65 8 Q96 8 96 46 H34Z" fill="#B8C4D6" ${sw()}/><path d="M34 40 H96" stroke="#8294AD" stroke-width="3"/><path d="M65 8 Q58 -8 80 -6 Q72 4 70 10Z" fill="#E5484D" ${sw(3)}/>`;
  if(eq.hat==='crown')hat=`<path d="M42 30 L45 8 L55 20 L65 2 L75 20 L85 8 L88 30Z" fill="#FFD35A" ${sw()}/><circle cx="65" cy="12" r="3.4" fill="#E5484D" ${sw(2)}/><circle cx="48" cy="22" r="2.6" fill="#5CC8FF"/><circle cx="82" cy="22" r="2.6" fill="#5CC8FF"/>`;
  let wp='';
  const W={
    wood:`<rect x="-4" y="-58" width="8" height="52" rx="3" fill="#D9A066" ${sw(3.5)}/><rect x="-11" y="-8" width="22" height="6" rx="3" fill="#8A5A30" ${sw(3)}/>`,
    wand:`<rect x="-2.5" y="-48" width="5" height="48" rx="2.5" fill="#8A5A30" ${sw(3)}/>${star(0,-56,12,5,'#FFD35A',3)}`,
    big:`<path d="M-6 -6 L-6 -64 L0 -78 L6 -64 L6 -6Z" fill="#E8EEF7" ${sw(3.5)}/><path d="M0 -70 V-12" stroke="#B8C4D6" stroke-width="3"/><rect x="-16" y="-9" width="32" height="8" rx="4" fill="#FFD35A" ${sw(3)}/><circle cx="0" cy="8" r="4.5" fill="#FFD35A" ${sw(3)}/>`,
    pencil:`<rect x="-6" y="-60" width="12" height="52" fill="#FFD35A" ${sw(3.5)}/><path d="M-6 -60 L0 -76 L6 -60Z" fill="#F2D3A4" ${sw(3.5)}/><path d="M-2 -70 L0 -76 L2 -70Z" fill="${O}"/><rect x="-6" y="-12" width="12" height="6" fill="#C7D0DC" ${sw(3)}/><rect x="-6" y="-6" width="12" height="9" rx="2" fill="#FF8FA3" ${sw(3)}/>`
  };
  if(W[eq.weapon])wp=`<g transform="translate(95 108) rotate(22)">${W[eq.weapon]}</g>`;
  const f=`<defs><filter id="hp${i}" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${i%9+1}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="w"/><feGaussianBlur in="w" stdDeviation="3" result="b"/><feDiffuseLighting in="b" surfaceScale="7" diffuseConstant="1" lighting-color="#fff" result="d"><feDistantLight azimuth="235" elevation="50"/></feDiffuseLighting><feComponentTransfer in="d" result="dq"><feFuncR type="discrete" tableValues="0.62 0.78 1 1.12"/><feFuncG type="discrete" tableValues="0.62 0.78 1 1.12"/><feFuncB type="discrete" tableValues="0.7 0.84 1 1.1"/></feComponentTransfer><feComposite in="w" in2="dq" operator="arithmetic" k1="1.0" k2="0" k3="0" k4="0" result="l"/><feSpecularLighting in="b" surfaceScale="7" specularConstant=".9" specularExponent="26" lighting-color="#fff" result="s"><feDistantLight azimuth="235" elevation="48"/></feSpecularLighting><feComponentTransfer in="s" result="sq"><feFuncR type="discrete" tableValues="0 0 0 0 1"/><feFuncG type="discrete" tableValues="0 0 0 0 1"/><feFuncB type="discrete" tableValues="0 0 0 0 1"/></feComponentTransfer><feComposite in="sq" in2="w" operator="in" result="s2"/><feComposite in="l" in2="s2" operator="arithmetic" k1="0" k2="1" k3=".35" k4="0"/></filter></defs>`;
  return `<svg class="hero-svg" xmlns="http://www.w3.org/2000/svg" viewBox="-6 -34 142 184" aria-hidden="true">${f}<ellipse cx="65" cy="143" rx="34" ry="6" fill="${O}" opacity=".16"/><g filter="url(#hp${i})">${back}${legs}${body}${arms}<g transform="translate(65 82) scale(1.22) translate(-65 -82)">${head}${hat}</g>${wp}${hand(95,108)}</g></svg>`;
}
const TYPES=[['fire','火焰','🔥','#FFE3D4','#FFB08A'],['ice','冰霜','❄️','#DDF1FF','#9CD3FF'],['elec','雷電','⚡','#FFF4C2','#FFD84D'],['poison','毒系','☠️','#EBDCFF','#C29BFF'],['forest','森林','🌲','#DDF5D2','#9ADB7E'],['sea','海洋','🌊','#D3EEFF','#7CC4F5'],['desert','沙漠','🏜️','#FFEBC9','#F2C275'],['sky','天空','☁️','#E6F0FF','#B7D2FF'],['mech','機械','⚙️','#E3E7EE','#AEB8C9'],['ghost','幽靈','👻','#E7E3FF','#B3A8F5'],['skel','骷髏','💀','#ECE6DF','#BDB2A6'],['dragon','龍族','🐉','#FFDDDD','#F59A9A']];
const TIERN={e:'精英',r:'稀有',b:'魔王'};
function heroImg(cls){const h=HSPR[G().heroId]||HSPR.h1;return '<img class="himg '+(cls||'')+'" alt="" src="'+h.u+'">';}
function heroEq(over){const g=G();return Object.assign({hat:g.eq.hat,outfit:g.eq.outfit,back:g.eq.back,weapon:g.eq.weapon},over||{});}

/* ================= 3D: tiny WebGL toon engine (no libraries) ================= */
const E3={ok:null,canvas:null,gl:null};
const ENG=(function(){
const PI=Math.PI;
/* ---- matrices (column-major) ---- */
const m4={
  id(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);},
  mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;},
  T(x,y,z){const m=m4.id();m[12]=x;m[13]=y;m[14]=z;return m;},
  S(x,y,z){const m=m4.id();m[0]=x;m[5]=y;m[10]=z;return m;},
  RX(a){const m=m4.id(),c=Math.cos(a),s=Math.sin(a);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m;},
  RY(a){const m=m4.id(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;},
  RZ(a){const m=m4.id(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m;},
  persp(fy,asp,n,f){const t=1/Math.tan(fy/2),m=new Float32Array(16);m[0]=t/asp;m[5]=t;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m;},
  look(e,c,u){let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2];let l=Math.hypot(zx,zy,zz);zx/=l;zy/=l;zz/=l;
    let xx=u[1]*zz-u[2]*zy,xy=u[2]*zx-u[0]*zz,xz=u[0]*zy-u[1]*zx;l=Math.hypot(xx,xy,xz);xx/=l;xy/=l;xz/=l;
    const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
    return new Float32Array([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*e[0]+xy*e[1]+xz*e[2]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1]);},
  nm(w){ // inverse transpose of upper 3x3
    const a=w[0],b=w[1],c=w[2],d=w[4],e=w[5],f=w[6],g=w[8],h=w[9],i=w[10];
    const A=e*i-f*h,B=f*g-d*i,C=d*h-e*g,det=a*A+b*B+c*C||1,id=1/det;
    return new Float32Array([A*id,B*id,C*id,(c*h-b*i)*id,(a*i-c*g)*id,(b*g-a*h)*id,(b*f-c*e)*id,(c*d-a*f)*id,(a*e-b*d)*id]);}
};
function local(n){return m4.mul(m4.mul(m4.mul(m4.T(n.p[0],n.p[1],n.p[2]),m4.RY(n.r[1])),m4.mul(m4.RX(n.r[0]),m4.RZ(n.r[2]))),m4.S(n.s[0],n.s[1],n.s[2]));}
/* ---- geometry ---- */
const geoSrc={
  sph(){const la=18,lo=32,P=[],Nn=[],I=[];for(let i=0;i<=la;i++){const t=i/la*PI;for(let j=0;j<=lo;j++){const p=j/lo*2*PI;const x=Math.sin(t)*Math.cos(p),y=Math.cos(t),z=Math.sin(t)*Math.sin(p);P.push(x,y,z);Nn.push(x,y,z);}}
    for(let i=0;i<la;i++)for(let j=0;j<lo;j++){const a=i*(lo+1)+j,b=a+lo+1;I.push(a,b,a+1,b,b+1,a+1);}return{P,N:Nn,I};},
  box(){const P=[],Nn=[],I=[];const F=[[0,0,1,1,0,0,0,1,0],[0,0,-1,-1,0,0,0,1,0],[1,0,0,0,0,-1,0,1,0],[-1,0,0,0,0,1,0,1,0],[0,1,0,1,0,0,0,0,-1],[0,-1,0,1,0,0,0,0,1]];
    F.forEach(f=>{const n=f.slice(0,3),u=f.slice(3,6),v=f.slice(6,9),b=P.length/3;[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(q=>{P.push((n[0]+u[0]*q[0]+v[0]*q[1])/2,(n[1]+u[1]*q[0]+v[1]*q[1])/2,(n[2]+u[2]*q[0]+v[2]*q[1])/2);Nn.push(n[0],n[1],n[2]);});I.push(b,b+1,b+2,b,b+2,b+3);});return{P,N:Nn,I};},
};
function rboxGeo(){const R=.22,n=7,P=[],Nn=[],I=[];const F=[[0,0,1,1,0,0,0,1,0],[0,0,-1,-1,0,0,0,1,0],[1,0,0,0,0,-1,0,1,0],[-1,0,0,0,0,1,0,1,0],[0,1,0,1,0,0,0,0,-1],[0,-1,0,1,0,0,0,0,1]];
  F.forEach(f=>{const b=P.length/3;for(let i=0;i<=n;i++)for(let j=0;j<=n;j++){const a=i/n*2-1,c=j/n*2-1;
    let x=(f[0]+f[3]*a+f[6]*c)/2,y=(f[1]+f[4]*a+f[7]*c)/2,z=(f[2]+f[5]*a+f[8]*c)/2;
    const h=.5-R,qx=Math.max(-h,Math.min(h,x)),qy=Math.max(-h,Math.min(h,y)),qz=Math.max(-h,Math.min(h,z));
    let nx=x-qx,ny=y-qy,nz=z-qz;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;P.push(qx+nx*R,qy+ny*R,qz+nz*R);Nn.push(nx,ny,nz);}
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){const a=b+i*(n+1)+j;I.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1);}});
  return{P,N:Nn,I};}
function cylGeo(rt){const seg=36,P=[],Nn=[],I=[];
  for(let j=0;j<=seg;j++){const a=j/seg*2*PI,c=Math.cos(a),s=Math.sin(a);const nl=Math.hypot(1,1-rt);
    P.push(c*rt,.5,s*rt);Nn.push(c/nl,(1-rt)/nl,s/nl);P.push(c,-.5,s);Nn.push(c/nl,(1-rt)/nl,s/nl);}
  for(let j=0;j<seg;j++){const a=j*2;I.push(a,a+1,a+2,a+1,a+3,a+2);}
  let b=P.length/3;P.push(0,-.5,0);Nn.push(0,-1,0);for(let j=0;j<=seg;j++){const a=j/seg*2*PI;P.push(Math.cos(a),-.5,Math.sin(a));Nn.push(0,-1,0);}
  for(let j=0;j<seg;j++)I.push(b,b+j+2,b+j+1);
  if(rt>0){b=P.length/3;P.push(0,.5,0);Nn.push(0,1,0);for(let j=0;j<=seg;j++){const a=j/seg*2*PI;P.push(Math.cos(a)*rt,.5,Math.sin(a)*rt);Nn.push(0,1,0);}
    for(let j=0;j<seg;j++)I.push(b,b+j+1,b+j+2);}
  return{P,N:Nn,I};}
/* ---- node helpers ---- */
const hx=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
function N(geo,col,o){const n={geo,col:col?hx(col):null,p:[0,0,0],r:[0,0,0],s:[1,1,1],a:1,ol:true,th:1,kids:[]};if(o)Object.assign(n,o);return n;}
const Gp=o=>N(null,null,o);
const Sp=(r,col,p,m,o)=>N('sph',col,Object.assign({p:p||[0,0,0],s:m?[r*m[0],r*m[1],r*m[2]]:[r,r,r]},o||{}));
const Cy=(rt,rb,h,col,p,o)=>N('cyl'+(rt/rb).toFixed(2),col,Object.assign({p:p||[0,0,0],s:[rb,h,rb]},o||{}));
const Co=(r,h,col,p,o)=>N('cyl0.00',col,Object.assign({p:p||[0,0,0],s:[r,h,r]},o||{}));
const Bx=(w,h,d,col,p,o)=>N('box',col,Object.assign({p:p||[0,0,0],s:[w,h,d]},o||{}));
const Rb=(w,h,d,col,p,o)=>N('rbox',col,Object.assign({p:p||[0,0,0],s:[w,h,d]},o||{}));
const INK='#2A2142';
/* big glossy anime-ish eyes */
let ANGRY=false;
function eyes(x,y,z,r,o){o=o||{};const out=[];
  [-1,1].forEach(sx=>{const g=Gp({p:[sx*x,y,z],r:[0,sx*-(o.toe==null?.16:o.toe),0]});
    g.kids.push(Sp(r*1.1,'#FFFFFF',[0,0,0],[.9,1.05,.55],{ol:false}));
    g.kids.push(Sp(r*.78,o.iris||'#4A2A1E',[0,-.04*r,r*.34],[.88,1,.5],{ol:false}));
    g.kids.push(Sp(r*.42,'#120A0A',[0,-.04*r,r*.5],[.9,1,.5],{ol:false}));
    g.kids.push(Sp(r*.3,'#FFFFFF',[-.28*r,.3*r,r*.78],[1,1,.4],{ol:false}));
    g.kids.push(Sp(r*.13,'#FFFFFF',[.26*r,-.32*r,r*.8],[1,1,.4],{ol:false}));
    if(ANGRY)g.kids.push(Rb(r*2.5,r*.5,r*.5,'#3A2418',[sx*-.05*r,r*1.12,r*.2],{r:[0,0,sx*.5],ol:false}));
    out.push(g);});
  return out;}
function brows(x,y,z,w,ang,col){return[-1,1].map(sx=>Rb(w,.07,.07,col||'#2A1F3D',[sx*x,y,z],{r:[0,0,sx*ang],ol:false}));}
function cheeks(x,y,z,r,col){return [].map(sx=>Sp(r,col||'#FF8FB0',[sx*x,y,z],[1,.62,.3],{ol:false}));}
function smile(y,z,w,h,o){o=o||{};const g=Gp({p:[0,y,z]});
  g.kids.push(Sp(1,'#7A1E3A',[0,0,0],[w,h,.1],{ol:false}));
  g.kids.push(Sp(1,'#FF7A92',[0,-h*.45,.03],[w*.55,h*.5,.09],{ol:false}));
  if(o.fang)[-1,1].forEach(s=>g.kids.push(Co(.06,.16,'#FFFFFF',[s*w*.45,h*.55,.09],{r:[PI,0,0],th:.4,ol:false})));
  return g;}
function foot(x,z,r,col){return Sp(r,col,[x,r*.55,z],[1,.6,1.4]);}
/* ---- hero ---- */
function heroModel(eq){ANGRY=false;
  const SK='#FFDABF',oc={tunic:'#4F8EFF',red:'#FF5A5F',armor:'#BFCBE0',robe:'#7B5BE8'}[eq.outfit]||'#4F8EFF',k=[];
  const robe=eq.outfit==='robe';
  if(eq.back==='cape')k.push(Rb(1.2,1.5,.1,'#FF5A5F',[0,1.1,-.52],{r:[.22,0,0]}),Rb(1.0,.1,.12,'#FFD35A',[0,1.78,-.45],{r:[.22,0,0]}));
  if(eq.back==='angel')[-1,1].forEach(s=>k.push(Sp(1,'#FFFFFF',[s*.9,1.6,-.45],[.12,.85,.5],{r:[0,s*-.5,s*-.5]}),Sp(1,'#EAF4FF',[s*1.25,1.2,-.4],[.1,.55,.35],{r:[0,s*-.5,s*-.7]})));
  if(eq.back==='dragon')[-1,1].forEach(s=>k.push(Sp(1,'#8E6BFF',[s*1.0,1.75,-.5],[.1,1.0,.7],{r:[0,s*-.5,s*-.6]}),Sp(1,'#6B4BD0',[s*1.4,1.3,-.45],[.09,.6,.45],{r:[0,s*-.5,s*-.8]})));
  if(!robe)[-1,1].forEach(s=>{k.push(Cy(1,1,.4,'#3E5AA8',[s*.22,.4,0],{s:[.16,.42,.16]}));k.push(foot(s*.23,.1,.28,'#8A5A3C'));});
  const body=Gp();
  if(robe){body.kids.push(Cy(.6,.95,1.5,oc,[0,.75,0]),Cy(1,1,.14,'#FFD35A',[0,.1,0],{s:[.97,.14,.97]}));[[-.2,1.15],[.28,.85],[-.1,.45]].forEach(q=>body.kids.push(Sp(.08,'#FFE27A',[q[0],q[1],.56],[1,1,.4],{ol:false})));}
  else{body.kids.push(Sp(.64,oc,[0,1.07,0],[1,1.12,.9]));body.kids.push(Cy(1,1,.1,eq.outfit==='red'?'#FFFFFF':'#FFC83D',[0,.88,0],{s:[.6,.1,.55]}));
    if(eq.outfit==='red')body.kids.push(Sp(.2,'#FFD35A',[0,1.22,.52],[1,1,.35],{ol:false}));
    if(eq.outfit==='armor'){[-1,1].forEach(s=>body.kids.push(Sp(.28,'#E3EAF5',[s*.6,1.42,0])));body.kids.push(Rb(.55,.09,.1,'#8294AD',[0,1.1,.58],{ol:false}));}
    if(eq.outfit==='tunic')body.kids.push(Sp(.12,'#FFFFFF',[0,1.38,.57],[1,1,.4],{ol:false}));}
  k.push(body);
  const aL=Gp({p:[-.66,1.32,0],r:[0,0,.5]});aL.kids.push(Cy(1,1,.5,oc,[0,-.24,0],{s:[.15,.5,.15]}),Sp(.2,'#FFFFFF',[0,-.56,0]));k.push(aL);
  const aR=Gp({p:[.66,1.32,0],r:[0,0,-.5]});aR.kids.push(Cy(1,1,.5,oc,[0,-.24,0],{s:[.15,.5,.15]}));
  const hand=Gp({p:[0,-.56,0]});hand.kids.push(Sp(.2,'#FFFFFF',[0,0,0]));aR.kids.push(hand);k.push(aR);
  const W=Gp({r:[.95,0,0]});
  if(eq.weapon==='wood')W.kids.push(Rb(.13,1.0,.07,'#E3A96A',[0,.6,0]),Rb(.45,.1,.1,'#9A6A38',[0,.12,0]));
  else if(eq.weapon==='wand')W.kids.push(Cy(1,1,.95,'#9A6A38',[0,.42,0],{s:[.05,.95,.05]}),Sp(.24,'#FFD35A',[0,1.0,0]));
  else if(eq.weapon==='big')W.kids.push(Rb(.22,1.55,.07,'#EAF0FA',[0,.95,0]),Co(.11,.3,'#EAF0FA',[0,1.85,0]),Rb(.62,.13,.13,'#FFD35A',[0,.15,0]),Sp(.1,'#FFD35A',[0,-.1,0]));
  else if(eq.weapon==='pencil')W.kids.push(Cy(1,1,1.25,'#FFD35A',[0,.62,0],{s:[.11,1.25,.11]}),Co(.11,.3,'#F7D9B0',[0,1.4,0]),Co(.035,.1,INK,[0,1.53,0],{ol:false}),Cy(1,1,.15,'#FF8FB0',[0,-.05,0],{s:[.11,.15,.11]}));
  if(W.kids.length)hand.kids.push(W);
  const head=Gp({p:[0,2.05,0]});
  head.kids.push(Sp(.86,SK,[0,0,0],[1,.92,.95]));
  head.kids.push(Sp(.9,'#7A4A2E',[0,.22,-.18],[1,.86,.92]));
  [-.34,0,.34].forEach((x,i)=>head.kids.push(Sp(.3,'#7A4A2E',[x,.66-(i===1?.04:0),.46],[1,.9,.7])));
  [-1,1].forEach(s=>head.kids.push(Sp(.2,SK,[s*.86,-.05,0],[.55,1,.8])));
  eyes(.31,-.02,.74,.26,{iris:'#4B8BFF'}).forEach(e=>head.kids.push(e));
  cheeks(.55,-.3,.72,.17).forEach(c=>head.kids.push(c));
  head.kids.push(Sp(.07,'#F0A68C',[0,-.18,.86],null,{ol:false}),smile(-.42,.77,.13,.09));
  if(eq.hat==='straw')head.kids.push(Cy(1,1,.07,'#F2D27A',[0,.82,0],{s:[1.15,.07,1.15]}),Cy(.85,1,.45,'#F8E49A',[0,1.05,0],{s:[.64,.45,.64]}),Cy(1,1,.11,'#FF5A5F',[0,.9,0],{s:[.67,.11,.67]}));
  if(eq.hat==='wizard')head.kids.push(Cy(1,1,.07,'#9A7BFF',[0,.82,0],{s:[1.2,.07,1.2]}),Co(.7,1.55,'#7B5BE8',[.05,1.6,0],{r:[0,0,-.12]}),Sp(.13,'#FFE27A',[.2,1.2,.58],null,{ol:false}),Sp(.2,'#FFE27A',[.18,2.4,0]));
  if(eq.hat==='knight')head.kids.push(Sp(.98,'#BFCBE0',[0,.24,0],[1,.78,1]),Cy(1,1,.11,'#8FA0BC',[0,.2,0],{s:[1.0,.11,1.0]}),Sp(.2,'#FF5A5F',[0,1.05,-.05],[.5,1.3,1.2]));
  if(eq.hat==='crown'){head.kids.push(Cy(1,1,.32,'#FFD35A',[0,.9,0],{s:[.64,.32,.64]}));for(let i=0;i<5;i++){const a=i/5*2*PI;head.kids.push(Co(.13,.38,'#FFD35A',[Math.cos(a)*.58,1.22,Math.sin(a)*.58]),Sp(.07,'#FF5A5F',[Math.cos(a)*.58,1.45,Math.sin(a)*.58],null,{ol:false}));}head.kids.push(Sp(.11,'#4DC8FF',[0,.92,.65],null,{ol:false}));}
  k.push(head);
  return{root:Gp({kids:k}),armR:aR,head,hand};
}
/* ---- monsters (face +z) ---- */
function monModel(id){ANGRY=true;
  let k=[],sc=1;
  if(id==='bin'){
    const g='#8FB8E8',d='#6E97C9';
    k=[Cy(.84,1.0,1.7,g,[0,.95,0]),Cy(1,1,.14,d,[0,1.82,0],{s:[.88,.14,.88]}),...[-.5,0,.5].map(x=>Rb(.09,1.2,.05,d,[x,.9,.96],{ol:false})),
      Gp({p:[0,2.0,-.05],r:[0,0,.2],kids:[Sp(1.0,'#FF7FA5',[0,0,0],[1,.36,1]),Rb(.5,.14,.16,'#E85C86',[0,.34,0])]}),
      Sp(.34,'#FFFFFF',[-.42,2.35,.05]),Sp(.28,'#FFE58A',[.4,2.3,0]),Sp(.2,'#8FE0A8',[.05,2.45,-.1]),
      ...eyes(.34,1.32,.9,.3),...brows(.34,1.72,.9,.34,.35),...cheeks(.6,1.05,.84,.17),smile(.98,.95,.28,.17,{fang:true}),
      Sp(.2,g,[-1.0,1.0,.1],[.8,1.1,.8]),Sp(.2,g,[1.0,1.0,.1],[.8,1.1,.8]),foot(-.45,.2,.3,'#5F83B6'),foot(.45,.2,.3,'#5F83B6')];
  }
  else if(id==='news'){
    k=[Cy(1,1,2.1,'#FFF4DC',[0,1.2,0],{s:[.88,2.1,.88]}),Cy(.9,1,.1,'#CDBF98',[0,2.26,0],{s:[.74,.1,.74],ol:false}),
      Cy(1,1,.24,'#FF7FA5',[0,1.82,0],{s:[.93,.24,.93]}),Cy(1,1,.24,'#FF7FA5',[0,.68,0],{s:[.93,.24,.93]}),
      Rb(.8,.22,.04,'#D9CCA6',[0,1.55,.87],{ol:false}),Rb(.6,.07,.04,'#D9CCA6',[-.1,1.4,.88],{ol:false}),
      ...eyes(.33,1.22,.87,.28),...brows(.33,1.62,.88,.3,.3),...cheeks(.6,.98,.82,.16),smile(.96,.9,.15,.13),
      Cy(1,1,.7,'#FFF4DC',[-1.1,1.1,0],{s:[.12,.7,.12],r:[0,0,.95]}),Cy(1,1,.7,'#FFF4DC',[1.1,1.1,0],{s:[.12,.7,.12],r:[0,0,-.95]}),Sp(.2,'#FFFFFF',[-1.45,.82,0]),Sp(.2,'#FFFFFF',[1.45,.82,0]),
      foot(-.35,.2,.32,'#2A2142'),foot(.35,.2,.32,'#2A2142')];
  }
  else if(id==='wash'){
    k=[Sp(1.2,'#4FC3F7',[0,1.2,0],[1,.96,1]),Co(.86,1.3,'#4FC3F7',[0,2.6,0]),
      Sp(.32,'#E1F6FF',[-.5,1.9,.7],[.6,1,.3],{ol:false,r:[0,0,.5]}),
      Rb(.8,.46,.56,'#FFD94D',[.08,3.35,0],{r:[0,0,-.15]}),Sp(.07,'#E0AE1A',[.2,3.42,.3],null,{ol:false}),Sp(.06,'#E0AE1A',[-.1,3.36,.3],null,{ol:false}),
      ...eyes(.4,1.38,1.0,.3),...brows(.4,1.85,1.0,.34,.32),...cheeks(.72,1.0,.93,.19,'#FF9ABE'),smile(.95,1.06,.28,.18),
      Sp(.26,'#EAF8FF',[-1.55,2.1,.2],null,{a:.7}),Sp(.17,'#EAF8FF',[1.4,3.0,.2],null,{a:.7}),Sp(.12,'#EAF8FF',[-1.2,3.0,0],null,{a:.7}),
      Cy(1,1,.9,'#3DCB7A',[1.45,.55,-.2],{s:[.15,.9,.15],r:[0,0,-.6]}),Cy(1,1,1.0,'#3DCB7A',[1.95,1.1,-.2],{s:[.15,1.0,.15],r:[0,0,.1]}),Cy(1,1,.34,'#C9D3E0',[2.0,1.7,-.2],{s:[.22,.34,.22]})];
  }
  else if(id==='rabbit'){
    const f='#FFF6E8';
    k=[Sp(1.2,f,[0,1.12,0],[1,.95,1]),Sp(1.0,f,[0,2.0,.12],[1.05,.92,.96]),
      foot(-.5,.6,.34,f),foot(.5,.6,.34,f),Sp(.3,f,[-1.0,1.4,.2]),Sp(.3,f,[1.0,1.4,.2]),Sp(.38,'#FFFFFF',[0,1.0,-1.05]),
      Gp({p:[-.5,2.8,-.1],r:[0,0,.2],kids:[Sp(.32,f,[0,.6,0],[1,2.2,.7]),Sp(.2,'#FFB3CB',[0,.6,.18],[1,2.0,.3],{ol:false})]}),
      Gp({p:[.55,2.75,-.1],r:[0,0,-.6],kids:[Sp(.32,f,[0,.55,0],[1,2.0,.7]),Sp(.2,'#FFB3CB',[0,.55,.18],[1,1.8,.3],{ol:false})]}),
      ...eyes(.4,2.15,.9,.3),...cheeks(.72,1.8,.85,.2,'#FF9ABE'),Sp(.1,'#FF8FB0',[0,1.92,1.0],[1.2,.8,.7],{ol:false}),
      Rb(.2,.24,.06,'#FFFFFF',[-.1,1.7,.98],{ol:false}),Rb(.2,.24,.06,'#FFFFFF',[.1,1.7,.98],{ol:false}),Sp(.2,'#7B5BE8',[0,.35,.1],[.001,.001,.001],{ol:false})];
  }
  else if(id==='shaggy'){
    const br='#C98A4A',dk='#A86C32';k=[Sp(1.4,br,[0,1.4,0],[1.04,.96,1])];
    for(let i=0;i<30;i++){const a=i/30*2*PI+(i%2)*.1,e=((i%3)-1)*.62;const vx=Math.cos(a)*Math.cos(e),vy=Math.sin(e)*.9,vz=Math.sin(a)*Math.cos(e);
      if(vz>.55&&vy>-.2&&vy<.8)continue;k.push(Sp(.36,i%2?br:dk,[vx*1.35,1.4+vy*1.25,vz*1.35],[1,.9,1]));}
    k.push(foot(-.6,.3,.4,dk),foot(.6,.3,.4,dk),...eyes(.46,1.5,1.22,.32,{iris:'#7BD66E'}),...brows(.46,1.95,1.25,.4,.3,'#5B3A1E'),...cheeks(.8,1.1,1.1,.2),smile(1.0,1.33,.3,.2,{fang:true}));
    k.push(Gp({p:[0,2.55,.0],r:[-.12,0,-.2],kids:[Sp(1.0,'#FF6F95',[0,.3,0],[.95,.7,.95]),Cy(1,1,.3,'#E5527A',[0,-.05,0],{s:[1.0,.3,1.0]}),Sp(.3,'#FFFFFF',[0,1.0,0])]}));
  }
  else if(id==='closet'){
    const w='#DDA66A',d='#B97E42';
    k=[Rb(2.0,2.8,1.3,w,[0,1.6,0]),Rb(.86,2.4,.1,d,[-.47,1.6,.66]),Rb(.86,2.4,.1,d,[.47,1.6,.66]),
      Sp(.07,'#FFD35A',[-.1,1.55,.74],null,{ol:false}),Sp(.07,'#FFD35A',[.1,1.55,.74],null,{ol:false}),
      Rb(1.3,.8,.1,'#4A2A1E',[0,.95,.74],{ol:false}),...[-.45,-.15,.15,.45].map(x=>Co(.09,.26,'#FFFFFF',[x,1.28,.8],{r:[PI,0,0],th:.4})),...[-.3,0,.3].map(x=>Co(.09,.22,'#FFFFFF',[x,.66,.8],{th:.4})),Sp(1,'#FF6F8C',[0,.84,.78],[.4,.14,.08],{ol:false}),
      ...eyes(.42,2.3,.72,.3),...brows(.42,2.72,.72,.38,.3),...cheeks(.75,1.9,.68,.18),
      Rb(.5,.24,.4,'#8A5A30',[-.65,.14,.3]),Rb(.5,.24,.4,'#8A5A30',[.65,.14,.3]),
      Rb(2.3,.22,.8,'#4F8EFF',[0,3.12,0])];
    for(let i=0;i<8;i++)k.push(Cy(1,1,1.0,i%2?'#E3DAB8':'#F4EDD2',[-.98+i*.28,3.55-(i%2)*.1,0],{s:[.14,1.0,.14]}),Sp(.14,i%2?'#E3DAB8':'#F4EDD2',[-.98+i*.28,3.05-(i%2)*.1,0]));
    k.push(Cy(1,1,.9,'#C98A4A',[0,4.0,0],{s:[.07,.9,.07],ol:false}));
  }
  else if(id==='tub'){
    k=[Rb(2.7,1.2,1.5,'#CFE8FF',[0,1.0,0]),Rb(2.9,.24,1.7,'#FFFFFF',[0,1.68,0]),
      ...[[-1,-.5],[1,-.5],[-1,.5],[1,.5]].map(q=>Sp(.3,'#FFC93C',[q[0]*1.0,.3,q[1]*.5],[1,1.1,1])),
      Rb(.85,.85,.85,'#A9E6FF',[-.5,2.2,0],{r:[0,.4,.1],a:.9}),Rb(.75,.75,.75,'#C5F0FF',[.5,2.15,.1],{r:[0,-.3,-.1],a:.9}),
      ...[-.85,0,.85].map(x=>Co(.17,.5,'#EAF8FF',[x,1.25,.8],{r:[PI,0,0],th:.5})),
      ...eyes(.42,1.15,.78,.3,{iris:'#7BD0FF'}),...brows(.42,1.58,.78,.34,.3),...cheeks(.78,.85,.76,.17,'#FF9ABE'),smile(.8,.82,.32,.17,{fang:true}),
      Sp(.2,'#EAF8FF',[-1.6,1.6,.4],null,{a:.7}),Sp(.15,'#EAF8FF',[1.65,2.0,.3],null,{a:.7})];
  }
  else if(id==='kangaroo'){
    const t='#E8A867',l='#F8DDB5';
    k=[Sp(.55,t,[-.15,.6,-1.15],[.9,.9,2.2],{r:[.0,0,0]}),Sp(.4,t,[-.2,.4,-1.9],[.7,.7,1.4]),
      foot(-.55,.35,.4,'#D68B48'),foot(.55,.35,.4,'#D68B48'),
      Sp(1.15,t,[0,1.25,0],[1,1.1,.96]),Sp(.86,l,[0,1.1,.5],[1,1,.6]),
      Rb(.95,.7,.3,'#C98A4A',[0,.98,.82],{r:[-.15,0,0]}),Sp(.2,'#FFFFFF',[-.2,1.05,.98],[1,1,.5],{ol:false}),Sp(.2,'#FFFFFF',[.2,1.05,.98],[1,1,.5],{ol:false}),Sp(.07,INK,[-.2,1.03,1.07],null,{ol:false}),Sp(.07,INK,[.2,1.03,1.07],null,{ol:false}),
      Sp(.82,t,[0,2.5,.1]),Sp(.46,l,[0,2.32,.74],[1,.78,.85]),Sp(.11,INK,[0,2.43,1.08],[1.3,.8,.8],{ol:false}),
      Gp({p:[-.4,3.15,0],r:[0,0,.2],kids:[Sp(.22,t,[0,.38,0],[1,2.3,.6]),Sp(.11,'#FFB3CB',[0,.38,.1],[1,2,.4],{ol:false})]}),
      Gp({p:[.4,3.15,0],r:[0,0,-.2],kids:[Sp(.22,t,[0,.38,0],[1,2.3,.6]),Sp(.11,'#FFB3CB',[0,.38,.1],[1,2,.4],{ol:false})]}),
      ...eyes(.32,2.62,.66,.24,{iris:'#6B4B2A'}),...brows(.32,2.95,.68,.3,.28),...cheeks(.55,2.35,.64,.14),
      Cy(1,1,.8,t,[-1.05,1.5,.2],{s:[.16,.8,.16],r:[.4,0,.9]}),Cy(1,1,.8,t,[1.05,1.5,.2],{s:[.16,.8,.16],r:[.4,0,-.9]}),
      Sp(.46,'#FF4D5A',[-1.4,1.62,.55]),Sp(.46,'#FF4D5A',[1.4,1.62,.55]),Cy(1,1,.16,'#FFFFFF',[-1.2,1.52,.38],{s:[.28,.16,.28],r:[.0,0,.9]}),Cy(1,1,.16,'#FFFFFF',[1.2,1.52,.38],{s:[.28,.16,.28],r:[.0,0,-.9]})];
  }
  else if(id==='alien'){
    k=[foot(-.4,.15,.34,'#2A2142'),foot(.4,.15,.34,'#2A2142'),
      Sp(1.05,'#FF9A3D',[0,1.0,0],[1,.9,.9]),Sp(.3,'#FFD94D',[0,1.0,.84],[1,1,.3],{ol:false}),
      Cy(1,1,.8,'#FF9A3D',[-1.05,1.0,0],{s:[.17,.8,.17],r:[0,0,.7]}),Cy(1,1,.8,'#FF9A3D',[1.05,1.0,0],{s:[.17,.8,.17],r:[0,0,-.7]}),Sp(.22,'#FFFFFF',[-1.35,.65,0]),Sp(.22,'#FFFFFF',[1.35,.65,0]),
      Sp(1.0,'#8EE07A',[0,2.25,0]),Sp(.64,'#FFFFFF',[0,2.3,.58],[1,1,.6]),Sp(.36,'#1D1A33',[.04,2.3,.9],[1,1,.6],{ol:false}),Sp(.12,'#FFFFFF',[.14,2.42,1.02],null,{ol:false}),Sp(.06,'#FFFFFF',[-.05,2.2,1.04],null,{ol:false}),
      ...cheeks(.62,1.95,.74,.2,'#3FB06A'),smile(1.78,.92,.2,.1),
      Sp(1.32,'#CFF1FF',[0,2.3,0],null,{a:.26,ol:false}),
      Sp(1.02,'#2E4A9A',[0,3.0,-.05],[1,.55,1]),Cy(1,1,.15,'#FFFFFF',[0,2.76,.05],{s:[1.02,.15,1.02]}),Sp(.18,'#FFD94D',[0,3.12,.82],[1,1,.3],{ol:false}),
      Cy(1,1,.5,'#FFD94D',[.3,3.5,0],{s:[.04,.5,.04],ol:false}),Sp(.12,'#FF5A5F',[.3,3.8,0])];
  }
  else if(id==='curtain'){
    k=[Rb(3.1,.24,1.7,'#9A6A38',[0,.12,0]),Rb(2.5,2.6,.2,'#352250',[0,1.5,-.5]),
      Gp({p:[-1.25,1.5,.4],r:[0,0,.04],kids:[Rb(.95,2.9,.55,'#E63946',[0,0,0]),...[-.25,0,.25].map(x=>Cy(1,1,2.7,'#B72B38',[x,0,.3],{s:[.07,2.7,.07],ol:false}))]}),
      Gp({p:[1.25,1.5,.4],r:[0,0,-.04],kids:[Rb(.95,2.9,.55,'#E63946',[0,0,0]),...[-.25,0,.25].map(x=>Cy(1,1,2.7,'#B72B38',[x,0,.3],{s:[.07,2.7,.07],ol:false}))]}),
      Rb(3.3,.75,.95,'#E63946',[0,3.05,.1]),Rb(3.1,.14,.2,'#FFD35A',[0,2.9,.64],{ol:false}),
      ...[-1.3,-.65,0,.65,1.3].map(x=>Sp(.34,'#E63946',[x,2.75,.58],[1,.8,.6])),
      Sp(.42,'#FFE96B',[-.45,1.7,.0],[1,1.15,.5],{ol:false}),Sp(.42,'#FFE96B',[.45,1.7,.0],[1,1.15,.5],{ol:false}),Sp(.17,INK,[-.42,1.64,.2],[1,1.3,.6],{ol:false}),Sp(.17,INK,[.42,1.64,.2],[1,1.3,.6],{ol:false}),
      Sp(.06,'#FFFFFF',[-.38,1.74,.3],null,{ol:false}),Sp(.06,'#FFFFFF',[.46,1.74,.3],null,{ol:false}),
      Rb(1.3,.55,.08,'#7A1230',[0,1.0,.0],{ol:false}),...[-.45,-.15,.15,.45].map(x=>Co(.09,.26,'#FFFFFF',[x,1.2,.06],{r:[PI,0,0],th:.4})),...[-.3,0,.3].map(x=>Co(.09,.22,'#FFFFFF',[x,.78,.06],{th:.4})),
      Sp(.2,'#FFD35A',[-.85,1.45,.72]),Sp(.2,'#FFD35A',[.85,1.45,.72]),Sp(.3,'#FFFFFF',[-1.7,.18,.7],[1,.5,1.3]),Sp(.3,'#FFFFFF',[1.7,.18,.7],[1,.5,1.3])];
  }
  else if(id==='basket'){
    k=[Cy(1.15,.95,1.5,'#C98B4E',[0,.78,0]),Cy(1,1,.22,'#D9A066',[0,1.58,0],{s:[1.26,.22,1.26]}),
      ...[0,.5,1.0].map(y=>Cy(1,1,.07,'#A86C32',[0,.34+y,0],{s:[1.0+y*.08,.07,1.0+y*.08],ol:false})),
      Sp(.52,'#FFA033',[-.52,1.95,.1]),Sp(.52,'#FFA033',[.58,2.0,.1]),Sp(.52,'#FFA033',[0,2.2,-.3]),Sp(.52,'#FFA033',[0,2.0,.55]),Sp(.5,'#FFA033',[-.2,2.4,.2]),
      Sp(.12,'#FFD08A',[-.7,2.15,.55],null,{ol:false}),Sp(.12,'#FFD08A',[.4,2.2,.8],null,{ol:false}),
      Sp(.22,'#3DCB7A',[.1,2.85,.2],[1.5,.4,.8],{r:[0,0,.4]}),
      Cy(1,1,1.7,'#A86C32',[-.98,2.45,0],{s:[.1,1.7,.1],r:[0,0,-.3]}),Cy(1,1,1.7,'#A86C32',[.98,2.45,0],{s:[.1,1.7,.1],r:[0,0,.3]}),Cy(1,1,1.2,'#A86C32',[0,3.1,0],{s:[.1,1.2,.1],r:[0,0,PI/2]}),
      ...eyes(.4,1.06,1.02,.3),...brows(.4,1.5,1.02,.34,.3),...cheeks(.72,.78,.97,.17),smile(.62,1.08,.28,.17),
      Rb(.5,.36,.06,'#FFFFFF',[1.08,.5,.88],{r:[0,.3,-.2]}),foot(-.5,.4,.3,'#A86C32'),foot(.5,.4,.3,'#A86C32')];
  }
  else if(id==='boss'){
    k=[Rb(2.8,1.0,1.8,'#FFF6DC',[0,.55,0]),Rb(2.9,.2,1.9,'#4A3A9A',[0,.02,0]),
      Rb(2.7,2.0,1.8,'#3A0F33',[0,1.9,0]),Rb(3.0,1.9,2.0,'#7B5BE8',[0,3.15,0]),
      ...[-1,1].map(s=>Co(.3,1.2,'#FFF0C2',[s*1.35,4.2,0],{r:[0,0,s*-.4]})),
      Cy(1,1,.32,'#FFD35A',[0,4.25,0],{s:[.72,.32,.5]}),...[-.45,0,.45].map(x=>Co(.16,.42,'#FFD35A',[x,4.58,0])),Sp(.1,'#FF5A5F',[0,4.3,.5],null,{ol:false}),
      ...[-1,1].map(s=>Sp(.72,'#FFE96B',[s*.8,3.45,1.0],[1.2,.7,.3],{ol:false})),...[-1,1].map(s=>Sp(.1,INK,[s*.8,3.45,1.14],[.7,2,.4],{ol:false})),...[-1,1].map(s=>Sp(.06,'#FFFFFF',[s*.8+.06,3.6,1.18],null,{ol:false})),
      ...brows(.8,3.95,1.02,.95,.35,'#2A1F3D'),
      ...[-1,1].map(s=>Sp(1,'#6B4BD0',[s*1.8,3.1,-.1],[.1,1.05,.75],{r:[0,s*-.4,s*-.4]})),
      Sp(.3,'#FF5A5F',[0,.75,.6],[1.9,.4,1],{ol:false}),...[-1,-.65,-.3,.05,.4,.75].map(x=>Co(.13,.4,'#FFFFFF',[x,2.6,.9],{r:[PI,0,0],th:.4})),...[-.85,-.5,-.15,.2,.55,.9].map(x=>Co(.12,.32,'#FFFFFF',[x,1.3,.9],{th:.4})),
      Sp(.28,'#FFD35A',[-.9,1.85,.9],[1,1,.2],{ol:false}),Sp(.28,'#7BD66E',[.9,1.9,.9],[1,1,.2],{ol:false}),Sp(.4,'#FF6F8C',[0,1.7,.7],[1.5,.5,.8],{ol:false})];
    sc=.95;
  }
  return{root:Gp({kids:k,s:[sc,sc,sc]}),sc};
}

/* ---- state ---- */
const E={imgs:{},gl:null,pg:null,ps:null,buf:{},tex:{},time:0,last:0,W:0,H:0,mon:null,hero:null,env:[],parts:[],tw:[],tl:[],shake:0,flash:{mon:null,hero:null},sprites:[],run:false};
const VS=`attribute vec3 aP;attribute vec3 aN;uniform mat4 uM,uVP;uniform mat3 uNM;uniform float uOut,uPass;varying vec3 vN,vW;
void main(){vec4 w=uM*vec4(aP,1.);vW=w.xyz;vec3 n=normalize(uNM*aN);vN=n;vec4 c=uVP*w;
if(uPass>.5){vec3 nc=(uVP*vec4(n,0.)).xyz;c.xy+=normalize(nc.xy+vec2(1e-5))*uOut*c.w;}gl_Position=c;}`;
const FS=`precision highp float;varying vec3 vN,vW;uniform vec3 uCol,uL,uEye;uniform vec4 uFlash;uniform float uAlpha,uPass,uMode,uTime,uRot2;uniform vec3 uRC;uniform sampler2D uTex2;
void main(){if(uPass>.5){gl_FragColor=vec4(.09,.06,.03,1.);return;}
vec3 n=normalize(vN);vec3 L=normalize(uL);float d=dot(n,L);vec3 v=normalize(uEye-vW);vec3 col=uCol;float al=uAlpha;
if(uMode>2.5){float st=sin(vW.x*34.+vW.z*29.)*.5+.5;float f=sin(vW.y*5.-uTime*4.+st*6.)*.5+.5;col=mix(vec3(.62,.86,1.),vec3(1.),.35+.65*f*st);al=min(1.,uAlpha*(.8+.3*f));}
else if(uMode>1.5){vec2 q=(vW.xz-uRC.xy)/uRC.z;float c0=cos(uRot2),s0=sin(uRot2);q=vec2(q.x*c0-q.y*s0,q.x*s0+q.y*c0);vec4 t=texture2D(uTex2,q*.5+.5);col=t.rgb*1.04;al=t.a*uAlpha;if(uAlpha>.99&&al<.5)discard;}
else if(uMode>.5){float a1=sin(vW.x*2.3)*sin(vW.z*1.9)+.5*sin(vW.x*7.1+vW.z*5.3);col=uCol*(.9+.1*a1);float r=length(vW.xz);al*=1.-smoothstep(9.,13.,r);}
else{float w=smoothstep(-.55,.8,d);vec3 amb=mix(vec3(.56,.5,.7),vec3(.82,.92,1.05),n.y*.5+.5);
 col=uCol*(amb*.58+vec3(1.,.96,.86)*w*.62);col*=mix(.8,1.,smoothstep(-.1,1.1,vW.y));
 vec3 h=normalize(L+v);float nh=max(dot(n,h),0.);col+=vec3(1.)*(pow(nh,60.)*.75+pow(nh,9.)*.1);
 float rim=pow(1.-max(dot(n,v),0.),2.6);col+=vec3(.55,.78,1.)*rim*.3*(.5+.5*max(n.y+.3,0.));}
float fd=length(vW-uEye);col=mix(col,vec3(.80,.90,1.),smoothstep(34.,120.,fd)*.7);
col=mix(col,uFlash.rgb,uFlash.a);gl_FragColor=vec4(col,al);}`;
const SVS=`attribute vec2 aP;uniform vec3 uC;uniform vec2 uS;uniform mat4 uV,uPr;uniform float uRot;varying vec2 vUV;
void main(){vec4 v=uV*vec4(uC,1.);vec2 q=aP*uS;float c=cos(uRot),s=sin(uRot);q=vec2(q.x*c-q.y*s,q.x*s+q.y*c);v.xy+=q;gl_Position=uPr*v;vUV=aP*.5+.5;}`;
const SFS=`precision mediump float;varying vec2 vUV;uniform sampler2D uTex;uniform float uA;uniform vec4 uF;void main(){vec4 t=texture2D(uTex,vUV);gl_FragColor=vec4(mix(t.rgb,uF.rgb,uF.a),t.a*uA);}`;
function prog(gl,v,f){const mk=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;};
  const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,v));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,f));gl.bindAttribLocation(p,0,'aP');gl.bindAttribLocation(p,1,'aN');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('link:'+gl.getProgramInfoLog(p));gl.useProgram(p);return p;}
function U(p,names){const o={};names.forEach(n=>o[n]=E.gl.getUniformLocation(p,n));return o;}
function getGeo(key){
  if(E.buf[key])return E.buf[key];
  const gl=E.gl;let g;
  if(key==='sph')g=geoSrc.sph();else if(key==='box')g=geoSrc.box();else if(key==='rbox')g=rboxGeo();else g=cylGeo(parseFloat(key.slice(3)));
  for(let t=0;t<g.I.length;t+=3){const a=g.I[t]*3,b=g.I[t+1]*3,c=g.I[t+2]*3,P=g.P,Nn=g.N;
    const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
    const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx;
    if(cx*(Nn[a]+Nn[b]+Nn[c])+cy*(Nn[a+1]+Nn[b+1]+Nn[c+1])+cz*(Nn[a+2]+Nn[b+2]+Nn[c+2])<0){const q=g.I[t+1];g.I[t+1]=g.I[t+2];g.I[t+2]=q;}}
  const o={n:g.I.length,pb:gl.createBuffer(),nb:gl.createBuffer(),ib:gl.createBuffer()};
  gl.bindBuffer(gl.ARRAY_BUFFER,o.pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.P),gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,o.nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.N),gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(g.I),gl.STATIC_DRAW);
  return E.buf[key]=o;
}
function mkTex(c){const gl=E.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
function mkTexA(c,rgb){const gl=E.gl,w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data,u=new Uint8Array(w*h*4);
  for(let i=0;i<w*h;i++){u[i*4]=rgb[0];u[i*4+1]=rgb[1];u[i*4+2]=rgb[2];u[i*4+3]=d[i*4+3];}
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,u);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function wordTex(word,glow,lo){
  const c=cv(512,200),x=c.getContext('2d');let fs=118;const fam='"Fredoka","Noto Sans TC","Arial Black",Arial,sans-serif';
  x.font='700 '+fs+'px '+fam;while(x.measureText(word).width>440&&fs>40){fs-=6;x.font='700 '+fs+'px '+fam;}
  const w=x.measureText(word).width;x.textAlign='center';x.textBaseline='middle';
  x.shadowColor=glow||'#FFB020';x.shadowBlur=34;x.lineJoin='round';x.lineWidth=24;x.strokeStyle='#1B2A4A';x.strokeText(word,256,106);
  x.shadowBlur=0;const g=x.createLinearGradient(0,50,0,160);g.addColorStop(0,'#FFFFFF');g.addColorStop(.55,'#FFF3A0');g.addColorStop(1,lo||'#FFC83D');x.fillStyle=g;x.fillText(word,256,106);
  return{tex:mkTex(c),asp:Math.max(1.4,(w+60)/200*1.0)*1.0};}
function emojiTex(e){if(E.tex[e])return E.tex[e];const c=cv(160,160),x=c.getContext('2d');x.font='110px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e,80,88);return E.tex[e]=mkTex(c);}
function starTex(){if(E.tex.star)return E.tex.star;const c=cv(96,96),x=c.getContext('2d');x.translate(48,48);x.beginPath();for(let i=0;i<10;i++){const a=-PI/2+i*PI/5,r=i%2?16:42;x[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}x.closePath();x.fillStyle='#FFD35A';x.fill();x.lineWidth=7;x.strokeStyle='#1B2A4A';x.lineJoin='round';x.stroke();return E.tex.star=mkTex(c);}
const LCOL=['#FF6B6B','#FFB020','#4ECB71','#4DA6FF','#B26BFF','#FF7BC0'];
function letterTex(ch,i){const k='L'+ch+i;if(E.tex[k])return E.tex[k];const c=cv(160,160),x=c.getContext('2d');x.font='800 120px "Fredoka","Noto Sans TC","Arial Black",Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
  x.lineWidth=26;x.strokeStyle='#2A2142';x.strokeText(ch,80,86);x.lineWidth=14;x.strokeStyle='#FFFFFF';x.strokeText(ch,80,86);x.fillStyle=LCOL[i%LCOL.length];x.fillText(ch,80,86);return E.tex[k]=mkTex(c);}
/* ---- init ---- */

function arenaTexs(){
  if(E.tex.arena)return;
  {const cg=cv(128,128),xg=cg.getContext('2d'),gg=xg.createRadialGradient(64,64,0,64,64,64);gg.addColorStop(0,'rgba(255,250,215,1)');gg.addColorStop(.3,'rgba(255,205,70,.75)');gg.addColorStop(1,'rgba(255,170,30,0)');xg.fillStyle=gg;xg.fillRect(0,0,128,128);E.tex.gold=mkTexA(cg,[255,205,70]);}
  const C=(w)=>{const c=cv(w,w);return[c,c.getContext('2d')]};
  let [c,x]=C(1024);x.translate(512,512);
  const seg=(r0,r1,n,c1,c2,off)=>{for(let i=0;i<n;i++){const a0=i/n*2*PI+off,a1=(i+1)/n*2*PI+off;x.beginPath();x.arc(0,0,r1,a0,a1);x.arc(0,0,r0,a1,a0,true);x.closePath();x.fillStyle=i%2?c1:c2;x.fill();x.strokeStyle='rgba(110,98,140,.65)';x.lineWidth=3;x.stroke();}};
  x.beginPath();x.arc(0,0,510,0,2*PI);x.fillStyle='#CFC7DE';x.fill();
  seg(390,498,40,'#DCD5EA','#C2B9D6',0);seg(300,390,28,'#CEC6DF','#E0DAEE',.05);
  const gr=(r,w,c1)=>{x.beginPath();x.arc(0,0,r,0,2*PI);x.lineWidth=w;const g=x.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#FFE08A');g.addColorStop(.5,'#E3A92F');g.addColorStop(1,'#FFD966');x.strokeStyle=g;x.stroke();};
  gr(498,16);gr(392,10);gr(300,10);
  const bg=x.createRadialGradient(0,0,0,0,0,300);bg.addColorStop(0,'#5A6FD4');bg.addColorStop(.6,'#3C4DA8');bg.addColorStop(1,'#2A3680');x.beginPath();x.arc(0,0,294,0,2*PI);x.fillStyle=bg;x.fill();
  x.strokeStyle='rgba(255,225,140,.5)';x.lineWidth=4;for(let i=0;i<8;i++){x.save();x.rotate(i*PI/4);x.beginPath();x.moveTo(0,30);x.lineTo(0,290);x.stroke();x.restore();}
  E.tex.arena=mkTex(c);
  [c,x]=C(1024);x.translate(512,512);x.lineCap='round';x.lineJoin='round';
  const glow=(fn,w)=>{x.shadowColor='#6FE6FF';x.shadowBlur=26;x.strokeStyle='#C8FBFF';x.lineWidth=w;fn();x.shadowBlur=0;x.strokeStyle='#7FEBFF';x.lineWidth=w*.5;fn();};
  const circ=(r)=>()=>{x.beginPath();x.arc(0,0,r,0,2*PI);x.stroke();};
  const poly=(n,r,k)=>()=>{x.beginPath();for(let i=0;i<=n;i++){const a=-PI/2+i*(2*PI*k)/n;i?x.lineTo(Math.cos(a)*r,Math.sin(a)*r):x.moveTo(Math.cos(a)*r,Math.sin(a)*r);}x.stroke();};
  glow(circ(285),9);glow(circ(255),6);glow(circ(150),7);glow(circ(70),6);
  glow(poly(6,250,1),7);x.save();x.rotate(PI);glow(poly(3,250,1),7);x.restore();glow(poly(3,250,1),7);
  glow(()=>{for(let i=0;i<24;i++){const a=i/24*2*PI;x.beginPath();x.moveTo(Math.cos(a)*262,Math.sin(a)*262);x.lineTo(Math.cos(a)*282,Math.sin(a)*282);x.stroke();}},6);
  glow(()=>{for(let i=0;i<8;i++){const a=i/8*2*PI;x.beginPath();x.moveTo(Math.cos(a)*70,Math.sin(a)*70);x.lineTo(Math.cos(a+.2)*150,Math.sin(a+.2)*150);x.stroke();}},5);
  x.fillStyle='#E6FFFF';x.shadowColor='#6FE6FF';x.shadowBlur=30;for(let i=0;i<6;i++){const a=-PI/2+i*PI/3;x.beginPath();x.arc(Math.cos(a)*250,Math.sin(a)*250,13,0,2*PI);x.fill();}
  const rg=x.createRadialGradient(0,0,0,0,0,110);rg.addColorStop(0,'rgba(190,250,255,.95)');rg.addColorStop(1,'rgba(110,230,255,0)');x.fillStyle=rg;x.beginPath();x.arc(0,0,110,0,2*PI);x.fill();
  E.tex.rune=mkTex(c);
  [c,x]=C(512);x.translate(256,256);x.shadowColor='#FFD35A';x.shadowBlur=22;x.strokeStyle='#FFF2B0';x.lineWidth=14;x.beginPath();x.arc(0,0,225,0,2*PI);x.stroke();x.strokeStyle='#FFC93C';x.lineWidth=7;x.stroke();
  E.tex.ring=mkTex(c);
  [c,x]=C(256);const g1=x.createRadialGradient(128,128,0,128,128,128);g1.addColorStop(0,'rgba(255,255,255,1)');g1.addColorStop(.25,'rgba(255,255,255,.6)');g1.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g1;x.fillRect(0,0,256,256);E.tex.glow=mkTexA(c,[255,255,255]);
  [c,x]=C(256);const g2=x.createRadialGradient(128,128,0,128,128,128);g2.addColorStop(0,'rgba(190,248,255,1)');g2.addColorStop(.3,'rgba(120,230,255,.55)');g2.addColorStop(1,'rgba(120,230,255,0)');x.fillStyle=g2;x.fillRect(0,0,256,256);E.tex.cglow=mkTexA(c,[120,230,255]);
  {const c3=cv(512,256),x3=c3.getContext('2d');const g3=x3.createRadialGradient(256,150,10,256,140,230);g3.addColorStop(0,'rgba(255,255,255,.95)');g3.addColorStop(.6,'rgba(255,255,255,.55)');g3.addColorStop(1,'rgba(255,255,255,0)');x3.fillStyle=g3;
    [[150,150,100],[256,110,120],[360,150,95],[256,170,130],[200,120,80],[320,120,85]].forEach(b=>{const gg=x3.createRadialGradient(b[0],b[1],0,b[0],b[1],b[2]);gg.addColorStop(0,'rgba(255,255,255,.95)');gg.addColorStop(.65,'rgba(255,255,255,.7)');gg.addColorStop(1,'rgba(255,255,255,0)');x3.fillStyle=gg;x3.beginPath();x3.arc(b[0],b[1],b[2],0,2*PI);x3.fill();});E.tex.cloud=mkTexA(c3,[255,255,255]);}
  {const c4=cv(256,64),x4=c4.getContext('2d');x4.shadowColor='#FFC93C';x4.shadowBlur=14;const sg=x4.createLinearGradient(30,0,205,0);sg.addColorStop(0,'#FFB52E');sg.addColorStop(1,'#FFF2B0');x4.strokeStyle=sg;x4.lineWidth=7;x4.lineCap='round';x4.beginPath();x4.moveTo(34,32);x4.lineTo(206,32);x4.stroke();
    x4.fillStyle='#FFF6C2';x4.strokeStyle='#F2A81D';x4.lineWidth=3;x4.beginPath();x4.moveTo(246,32);x4.lineTo(206,16);x4.lineTo(214,32);x4.lineTo(206,48);x4.closePath();x4.fill();x4.stroke();
    x4.fillStyle='#FFE27A';[[34,32,12],[48,32,12]].forEach(f=>{x4.beginPath();x4.moveTo(f[0],32);x4.lineTo(f[0]-14,32-f[2]);x4.lineTo(f[0]+2,32-f[2]+2);x4.closePath();x4.fill();x4.beginPath();x4.moveTo(f[0],32);x4.lineTo(f[0]-14,32+f[2]);x4.lineTo(f[0]+2,32+f[2]-2);x4.closePath();x4.fill();});E.tex.arrow=mkTex(c4);}
}
function ensure(){
  if(E3.ok!==null)return E3.ok;
  try{
    const c=document.createElement('canvas');
    const gl=c.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false})||c.getContext('experimental-webgl');
    if(!gl){E3.ok=false;return false;}
    E.gl=gl;E.canvas=c;E3.canvas=c;
    E.pg=prog(gl,VS,FS);E.ps=prog(gl,SVS,SFS);
    E.u=U(E.pg,['uM','uVP','uNM','uOut','uPass','uCol','uL','uEye','uFlash','uAlpha','uMode','uTime','uRC','uRot2','uTex2']);E.us=U(E.ps,['uC','uS','uV','uPr','uRot','uTex','uA','uF']);
    E.qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,E.qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    arenaTexs();gl.uniform1i(E.u.uTex2,1);
    E3.ok=true;E.last=performance.now();
    if(!E.run){E.run=true;requestAnimationFrame(frame);}
    return true;
  }catch(e){E3.ok=false;E3.err=String(e&&e.message||e);return false;}
}
const SPR=id=>(typeof MSPR!=='undefined'&&MSPR[id])||(typeof RSPR!=='undefined'&&RSPR[id])||null;
function mon0(id){return E.big?3.3:2.8;}
function setup(monId,eq,hid,big){
  E.big=!!big;
  const m=(typeof RSPR!=='undefined'&&RSPR[monId])?{root:Gp(),sc:1}:monModel(monId),h=heroModel(eq);
  const SP=SPR(monId);if(SP&&!E.imgs[monId]){const im=new Image();im.src=SP.u;E.imgs[monId]={im,tex:null};}
  const mon={img:SP?monId:null,root:SP?Gp():m.root,base:[E.big?3.4:3.0,0,.1],ry:-.8,sc:m.sc,off:{x:0,y:0,sq:1,rz:0,ry:0,sc:1},id:monId};
  const HA0=(typeof HANIM!=='undefined')&&hid&&HANIM[hid];if(HA0&&!HA0._ld){HA0._ld=1;['idle','attack','hit','win'].forEach(k=>HA0[k].forEach(f=>{const im=new Image();im.src=f.u;f.im=im;f.tex=null;}));}
  const HS=(typeof HSPR!=='undefined')&&hid&&HSPR[hid];if(HS&&!E.imgs['H'+hid]){const im=new Image();im.src=HS.u;E.imgs['H'+hid]={im,tex:null};}
  const hero={himg:HS?hid:null,root:HS?Gp():h.root,base:[-2.75,0,.4],ry:.8,sc:1,off:{x:0,y:0,sq:1,rz:0,ry:0,sc:1},armR:HS?{r:[0,0,0]}:h.armR,hand:h.hand,head:h.head};
  E.mon=mon;E.hero=hero;E.parts=[];E.tw=[];E.tl=[];E.sprites=[];E.flash={mon:null,hero:null};E.shake=0;
  const R=5.2,mk=[];
  const arena=Gp();
  arena.kids.push(
    Cy(5.35,2.6,.9,'#9D94B6',[0,-.47,0],{ol:false}),Cy(5.6,5.6,.16,'#E9B949',[0,-.07,0],{ol:false}),
    Cy(3.2,.9,3.4,'#857B9F',[0,-2.5,0],{ol:false}),Cy(1.6,.5,2.2,'#756B90',[.5,-4.4,.3],{ol:false}),
    N('cyl1.00',null,{p:[0,.012,0],s:[R,.02,R],mode:2,tex:'arena',ol:false}),
    N('cyl1.00',null,{p:[0,.03,0],s:[R*.62,.01,R*.62],mode:2,tex:'rune',a:.95,add:true,spin:.25,ol:false}));
  [[-1.2,-4.8,.5],[1.8,-5,.4],[-.3,-5.6,.35]].forEach(c=>arena.kids.push(Co(c[2],1.2,'#7FE9FF',[c[0],c[1],.3],{r:[PI,0,0],ol:false})));
  const ring=N('cyl1.00',null,{p:[mon0(monId),.05,.1],s:[.01,.01,.01],mode:2,tex:'ring',a:0,add:true,ol:false});
  E.ring=ring;
  const bush=(x,z,r,c)=>{const g=Gp({p:[x,0,z]});g.kids.push(Sp(r,c,[0,r*.6,0],[1,.8,.9],{ol:false}),Sp(r*.7,c,[r*.8,r*.4,.1],[1,.8,.9],{ol:false}),Sp(r*.6,c,[-r*.8,r*.35,.1],[1,.8,.9],{ol:false}));return g;};
  const tuft=(x,z)=>{const g=Gp({p:[x,0,z]});[-.12,0,.12].forEach((o,i)=>g.kids.push(Co(.05,.32+i%2*.12,'#6BC94F',[o,.16,0],{r:[0,0,o*2.5],ol:false})));return g;};
  const crystal=(s,col)=>{const g=Gp();g.kids.push(Co(.38*s,.95*s,col||'#8FEFFF',[0,.5*s,0],{ol:false}),Co(.38*s,.7*s,col||'#8FEFFF',[0,-.5*s,0],{r:[PI,0,0],ol:false}));return g;};
  const pillar=(x,z,fl)=>{const g=Gp({p:[x,0,z],r:[0,fl*.35,0]});
    g.kids.push(Bx(1.5,.5,1.5,'#B3AAC6',[0,.25,0],{ol:false}),Bx(1.58,.1,1.58,'#E9B949',[0,.52,0],{ol:false}),Bx(1,2.8,1,'#C9C1D9',[0,1.95,0],{ol:false}),
      Bx(1.08,.12,1.08,'#E9B949',[0,.95,0],{ol:false}),Bx(1.08,.12,1.08,'#E9B949',[0,3.1,0],{ol:false}),Bx(1.4,.3,1.4,'#B3AAC6',[0,3.5,0],{ol:false}),Bx(1.46,.08,1.46,'#E9B949',[0,3.7,0],{ol:false}),
      Bx(.7,1.7,.08,'#6B3FC9',[0,2.3,.55],{ol:false}),Bx(.78,.08,.1,'#E9B949',[0,3.17,.55],{ol:false}),Sp(.15,'#E9B949',[0,2.5,.6],[1,1.3,.3],{ol:false}));
    const cr=crystal(1,'#8FEFFF');cr.p=[0,4.55,0];g.kids.push(cr);return g;};
  const post=(x,z)=>{const g=Gp({p:[x,0,z]});g.kids.push(Bx(.45,.8,.45,'#BFB7D1',[0,.4,0],{ol:false}),Bx(.52,.08,.52,'#E9B949',[0,.82,0],{ol:false}),Sp(.2,'#E9B949',[0,1,0],null,{ol:false}));const c=crystal(.35,'#8FEFFF');c.p=[0,1.5,0];g.kids.push(c);return g;};
  const pine=(x,z,s,c)=>{const g=Gp({p:[x,0,z],s:[s,s,s]});g.kids.push(Cy(.12,.12,.5,'#8B6B4A',[0,.25,0],{ol:false}),Co(.55,1,c||'#3FB36B',[0,.9,0],{ol:false}),Co(.42,.9,c||'#49C478',[0,1.5,0],{ol:false}),Co(.28,.7,c||'#57D283',[0,2.0,0],{ol:false}));return g;};
  const castle=(sc)=>{const g=Gp({s:[sc,sc,sc]}),W='#EDEAF8',Rf='#5167E8',Go='#E9B949';
    g.kids.push(Bx(8,2.4,1.8,W,[0,1.2,0],{ol:false}),Bx(8.2,.2,2,Go,[0,2.45,0],{ol:false}));
    [[-4,3.4],[-2.2,2.8],[2.2,2.8],[4,3.4]].forEach(t=>g.kids.push(Cy(.8,.8,t[1],W,[t[0],t[1]/2,0],{ol:false}),Co(1,2.2,Rf,[t[0],t[1]+1.1,0],{ol:false}),Sp(.16,Go,[t[0],t[1]+2.3,0],null,{ol:false})));
    g.kids.push(Cy(1.3,1.3,6,W,[0,3,0],{ol:false}),Cy(1.4,1.4,.25,Go,[0,6,0],{ol:false}),Co(1.7,3.6,'#6A4FE0',[0,7.9,0],{ol:false}),Sp(.2,Go,[0,9.8,0],null,{ol:false}),
      Cy(.55,.55,5.2,W,[-1.7,2.6+2.6,0],{ol:false}),Co(.75,1.8,Rf,[-1.7,5.2+.9+2.6-2.6,0],{ol:false}),Cy(.55,.55,5.2,W,[1.7,5.2,0],{ol:false}),Co(.75,1.8,Rf,[1.7,6.1+.0,0],{ol:false}));
    g.kids.push(Bx(1.1,1.5,.1,'#5B4BC6',[0,.8,.95],{ol:false}));return g;};
  const island=(x,y,z,r,o)=>{o=o||{};const g=Gp({p:[x,y,z]});
    g.kids.push(Cy(r,r*.2,r*1.1,'#A8957F',[0,-r*.55,0],{ol:false}),Cy(r*.55,r*.08,r*.9,'#8E7B6B',[r*.12,-r*1.35,0],{ol:false}),Cy(r*1.04,r*1.04,.4,'#86DC66',[0,.1,0],{ol:false}),Cy(r*.96,r*.96,.2,'#6FD05A',[0,.3,0],{ol:false}));
    const n=o.trees==null?5:o.trees;for(let i=0;i<n;i++){const a=i*2.4+x,d=r*(.35+.5*((i*.37)%1));g.kids.push(pine(Math.cos(a)*d,Math.sin(a)*d*.8,.9+.4*((i*.53)%1),i%2?'#3FB36B':'#4DBF79'));}
    if(o.castle){const c=castle(o.castle);c.p=[0,.4,-r*.15];g.kids.push(c);}
    if(o.fall){o.fall.forEach(f=>g.kids.push(N('box','#9FD8FF',{p:[f[0],-f[1]/2,f[2]||r*.78],s:[(f[3]||.9)*1.7,f[1],.5],mode:3,a:1,ol:false})));}
    if(o.cr)for(let i=0;i<o.cr;i++){const c=crystal(.9,'#8FEFFF');c.p=[Math.cos(i*2.1)*r*.55,.9,Math.sin(i*2.1)*r*.4];g.kids.push(c);}
    return g;};
  const far=[];
  far.push(island(0,5.5,-50,13,{castle:1.15,trees:9,fall:[[-9,34,-5,1.4],[9,30,-6,1.1],[-4,22,9,.9]]}));
  far.push(island(-27,7,-28,6.5,{trees:7,fall:[[-3,26,5,.9],[4,22,4,.7]],cr:2}));
  far.push(island(27,9,-30,7.5,{trees:8,castle:.6,fall:[[5,30,6,1],[-4,24,5,.8]]}));
  far.push(island(15,12.5,-44,3.4,{trees:3,cr:1}));
  far.push(island(-16,11.5,-46,4,{trees:4}));
  far.push(island(-8,-2,-38,5.5,{trees:5}));
  far.push(island(34,-1,-36,5,{trees:4}));
  E.env=[arena,ring,pillar(-4.9,-1.7,1),pillar(4.9,-1.7,-1)].concat(far);
  for(let i=0;i<9;i++){const a=PI*(1.12+i*.095);E.env.push(post(Math.cos(a)*5.1,Math.sin(a)*5.1));}
  E.env.push(bush(-4.2,3.3,.5,'#58C860'),bush(4.4,3.5,.55,'#63D26B'),tuft(-3.4,3.8),tuft(3.6,4),tuft(-.8,4.6),tuft(1.8,4.5));
  E.clouds=[];for(let i=0;i<26;i++){const r=(i*.6180339)%1,q=(i*.7548776)%1,w=(i*.5698403)%1;E.clouds.push({x:-60+r*120,y:-10+q*26,z:-10-w*48,s:5+q*6,sp:.25+w*.4,a:.55+.3*w});}
  E.shadows=[N('cyl1.00','#000000',{p:[0,.03,0],s:[1,.01,1],a:.28,ol:false}),N('cyl1.00','#000000',{p:[0,.03,0],s:[1,.01,1],a:.28,ol:false})];
}
function nodeMat(o){
  const b=o.base,f=o.off,sq=f.sq,k=o.sc*f.sc;
  const n={p:[b[0]+f.x,b[1]+f.y,b[2]],r:[0,o.ry+f.ry,f.rz],s:[k*(1+(1-sq)*.5),k*sq,k*(1+(1-sq)*.5)]};
  return local(n);
}
function collect(n,pm,grp,out){const W=m4.mul(pm,local(n));if(n.geo)out.push({n,W,grp});n.kids.forEach(c=>collect(c,W,grp,out));}
function drawItem(it,pass,VP,eye){
  const gl=E.gl,n=it.n,g=getGeo(n.geo),u=E.u;
  gl.bindBuffer(gl.ARRAY_BUFFER,g.pb);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,g.nb);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g.ib);
  gl.uniformMatrix4fv(u.uM,false,it.W);gl.uniformMatrix3fv(u.uNM,false,m4.nm(it.W));
  gl.uniform1f(u.uPass,pass);gl.uniform1f(u.uOut,.0125*n.th);gl.uniform3fv(u.uCol,n.col||[1,1,1]);gl.uniform1f(u.uAlpha,n.a);gl.uniform1f(u.uMode,n.mode||0);gl.uniform1f(u.uTime,E.time);
  if(n.mode===2){const W=it.W;gl.uniform3f(u.uRC,W[12],W[14],Math.hypot(W[0],W[1],W[2]));gl.uniform1f(u.uRot2,(n.rot||0)+(n.spin||0)*E.time);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,E.tex[n.tex]);gl.uniform1i(u.uTex2,1);gl.activeTexture(gl.TEXTURE0);}
  if(n.add)gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ZERO,gl.ONE);
  const fl=E.flash[it.grp];gl.uniform4fv(u.uFlash,fl||[0,0,0,0]);
  gl.drawElements(gl.TRIANGLES,g.n,gl.UNSIGNED_SHORT,0);
  if(n.add)gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);
}
function sprite(tex,pos,w,h,rot,a,V,Pr,F){
  const gl=E.gl,s=E.us;gl.useProgram(E.ps);gl.bindBuffer(gl.ARRAY_BUFFER,E.qb);gl.enableVertexAttribArray(0);gl.disableVertexAttribArray(1);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.uniform3fv(s.uC,pos);gl.uniform2f(s.uS,w,h);gl.uniformMatrix4fv(s.uV,false,V);gl.uniformMatrix4fv(s.uPr,false,Pr);gl.uniform1f(s.uRot,rot||0);gl.uniform1f(s.uA,a);gl.uniform4fv(s.uF,F||[0,0,0,0]);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(s.uTex,0);gl.disable(gl.DEPTH_TEST);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.enable(gl.DEPTH_TEST);
}
const ease=u=>u<0?0:u>1?1:u*u*(3-2*u);
const cl=u=>u<0?0:u>1?1:u;
function update(dt){
  const t=E.time;
  // idle
  [E.mon,E.hero].forEach((o,i)=>{if(!o)return;o.off.sqi=1+.03*Math.sin(t*2.3+i);});
  const m=E.mon,h=E.hero;if(!m)return;
  m.bob=.05*Math.sin(t*2.3);h.bob=.04*Math.sin(t*2.6+1);m.idz=.016*Math.sin(t*1.7+1);h.idz=.012*Math.sin(t*2.1);
  [['mon',m],['hero',h]].forEach(([k,o])=>{const fl=E.flash[k];if(fl&&fl[3]>.3&&fl!==o._lf){o._lf=fl;o.jit=Math.min(1,fl[3]+.2);}o.jit=Math.max(0,(o.jit||0)-dt*3.2);o.jx=(o.jit||0)*Math.sin(t*70)*.16;});
  {const cur=E.tl;E.tl=[];cur.forEach(e=>{if(t>=e.t)e.fn();else E.tl.push(e);});}
  {const cur=E.tw,keep=[];E.tw=[];cur.forEach(w=>{const u=(t-w.t0)/w.dur;if(u<0){keep.push(w);return;}w.fn(cl(u));if(u<1)keep.push(w);});E.tw=keep.concat(E.tw);}
  E.parts=E.parts.filter(p=>{p.life-=dt;if(p.life<=0)return false;p.vy-=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.vr*dt;return true;});
  E.shake=Math.max(0,E.shake-dt*2.2);
  ['mon','hero'].forEach(k=>{const f=E.flash[k];if(f){f[3]=Math.max(0,f[3]-dt*3);if(f[3]<=0)E.flash[k]=null;}});
}
function burst(pos,n,tex,spd,size){for(let i=0;i<n;i++){const a=Math.random()*2*PI,e=Math.random()*PI-PI/2,s=spd*(.5+Math.random());
  E.parts.push({x:pos[0],y:pos[1],z:pos[2],vx:Math.cos(a)*Math.cos(e)*s,vy:Math.sin(e)*s+spd*.4,vz:Math.sin(a)*Math.cos(e)*s,g:6,life:.7+Math.random()*.5,max:1.2,size:size*(.6+Math.random()*.7),tex,rot:Math.random()*6,vr:(Math.random()-.5)*8});}}
function draw(){
  const gl=E.gl,W=E.W,H=E.H;if(!E.mon)return;
  gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  const asp=W/H,fov=.8,dist=Math.max(9.5,(E.big?6.0:5.3)/(Math.tan(fov/2)*asp));
  const sh=E.shake,jx=(Math.random()-.5)*sh*.5,jy=(Math.random()-.5)*sh*.4;
  const eye=[jx,4.3+jy,dist],V=m4.look(eye,[0,2.4,0],[0,1,0]),Pr=m4.persp(fov,asp,.5,160),VP=m4.mul(Pr,V);
  gl.useProgram(E.pg);const u=E.u;gl.uniformMatrix4fv(u.uVP,false,VP);gl.uniform3f(u.uL,-.45,.8,.55);gl.uniform3fv(u.uEye,eye);
  const mM=nodeMatM(E.mon),hM=nodeMatM(E.hero);
  const op=[],tr=[];
  const ev=[];E.env.forEach(n=>{if(n.geo)ev.push({n,W:local(n),grp:'env'});else collect(n,m4.id(),'env',ev);});ev.forEach(it=>((it.n.a<1||it.n.add)?tr:op).push(it));
  const mi=[],hi=[];collect(E.mon.root,mM,'mon',mi);collect(E.hero.root,hM,'hero',hi);
  mi.concat(hi).forEach(it=>(it.n.a<1?tr:op).push(it));
  // shadows
  const sm=[[E.mon,1.15*E.mon.sc*(E.big?1.2:1)],[E.hero,.95]];
  sm.forEach((q,i)=>{const o=q[0],n=E.shadows[i],jump=Math.max(0,o.off.y);n.p=[o.base[0]+o.off.x,.03,o.base[2]];const r=q[1]*(1-jump*.15);n.s=[r*(1+(o.off.sq<1?(1-o.off.sq)*.5:0)),.01,r*.7];n.a=Math.max(.14,.4-jump*.12)*(o.off.al==null?1:o.off.al);tr.unshift({n,W:local(n),grp:'env'});});
  gl.disable(gl.BLEND);
  gl.enable(gl.CULL_FACE);
  
  gl.cullFace(gl.BACK);op.forEach(it=>drawItem(it,0,VP,eye));
  gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);
  gl.depthMask(false);tr.forEach(it=>drawItem(it,0,VP,eye));
  // sprites
  gl.disable(gl.CULL_FACE);
  if(E.tex.cloud)E.clouds.forEach(c=>{const x=((c.x+E.time*c.sp+60)%120)-60;sprite(E.tex.cloud,[x,c.y,c.z],c.s,c.s*.5,0,c.a,V,Pr);});
  gl.disable(gl.DEPTH_TEST);
  if(E.hero.himg){const o=E.hero,HA=(typeof HANIM!=='undefined')&&HANIM[o.himg];let c=E.imgs['H'+o.himg],S=HSPR[o.himg],fm=null,fm2=null,fa=0;
    if(HA){let pl=o.pl,nm='idle',u=0;if(pl){u=(E.time-pl.t0)/pl.dur;if(u>=1&&pl.n!=='win'){o.pl=null;pl=null;}else{nm=pl.n;u=Math.min(u,.999);}}
      const L=HA[nm],N=L.length,ph=pl?0:(E.time/6.4%1)*N,ix=pl?Math.min(N-1,Math.floor(u*N)):Math.floor(ph);fm=L[ix];
      if(!pl){fm2=L[(ix+1)%N];fa=ease(ph-ix);if(fm2&&fm2.im&&!fm2.tex&&fm2.im.complete&&fm2.im.naturalWidth)fm2.tex=mkTex(fm2.im);}
      if(fm&&fm.im&&!fm.tex&&fm.im.complete&&fm.im.naturalWidth)fm.tex=mkTex(fm.im);}
    if(fm&&fm.tex){c=fm;S=fm;}
    else if(c&&!c.tex&&c.im.complete&&c.im.naturalWidth)c.tex=mkTex(c.im);
    if(c&&c.tex){const f=o.off,sq=f.sq*(f.sqi||1),k=Math.max(.001,f.sc),asp=S.w/S.h,h0=(fm&&fm.tex)?HA.k:Math.min(3.4,3.7/asp);
      const h=h0*k*sq,w=h0*asp*k*(1+(1-sq)*.6),rot=-f.rz*.6-(o.idz||0);
      const hp=[o.base[0]+f.x+(o.jx||0)+PSG*Math.sin(rot)*h/2,o.base[1]+f.y+Math.cos(rot)*h/2+.02,o.base[2]+.3];
      sprite(c.tex,hp,w/2,h/2,rot,1,V,Pr,E.flash.hero);
      if(fm2&&fm2.tex&&fa>.01)sprite(fm2.tex,hp,w/2,h/2,rot,fa,V,Pr,E.flash.hero);}}
  if(E.mon.img){const o=E.mon,c=E.imgs[o.img],S=SPR(o.img);
    if(c&&!c.tex&&c.im.complete&&c.im.naturalWidth)c.tex=mkTex(c.im);
    if(c&&c.tex){const f=o.off,sq=f.sq*(f.sqi||1),k=Math.max(.001,f.sc),asp=S.w/S.h,h0=Math.min(E.big?4.3:3.5,3.9/asp);
      const h=h0*k*sq,w=-h0*asp*k*(1+(1-sq)*.6),rot=-f.rz*.6-(o.idz||0);
      sprite(c.tex,[o.base[0]+f.x+(o.jx||0)+PSG*Math.sin(rot)*h/2,o.base[1]+f.y+(o.bob||0)+Math.cos(rot)*h/2+.02,o.base[2]+.2],w/2,h/2,rot,f.al==null?1:f.al,V,Pr,E.flash.mon);}}
  gl.enable(gl.DEPTH_TEST);
  if(E.tex.cglow){const gp=.65+.35*Math.sin(E.time*2.2);[[-4.9,-1.7],[4.9,-1.7]].forEach(p=>sprite(E.tex.cglow,[p[0],4.6,p[1]],1.9*gp+.5,1.9*gp+.5,0,.9,V,Pr));}
  E.sprites.forEach(s=>sprite(s.tex,s.pos,s.w,s.h,s.rot,s.a,V,Pr));
  E.parts.forEach(p=>sprite(p.tex,[p.x,p.y,p.z],p.size,p.size,p.rot,Math.min(1,p.life/.4),V,Pr));
  gl.depthMask(true);
}
const PSG=1;
function nodeMatM(o){const f=o.off,k=o.sc*f.sc,sq=f.sq*(o.off.sqi||1),bob=o.bob||0;
  return local({p:[o.base[0]+f.x,o.base[1]+f.y+bob,o.base[2]],r:[0,o.ry+f.ry,f.rz],s:[k*(1+(1-sq)*.5),k*sq,k*(1+(1-sq)*.5)]});}
function frame(now){
  requestAnimationFrame(frame);
  if(!E.canvas||!E.canvas.isConnected||!E.mon)return;
  const dt=Math.min(.05,(now-E.last)/1000);E.last=now;E.time+=dt;
  const c=E.canvas,dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(2,Math.round(c.clientWidth*dpr)),h=Math.max(2,Math.round(c.clientHeight*dpr));
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  E.W=c.width;E.H=c.height;
  update(dt);draw();
}
/* ---- actions ---- */
function tween(dur,fn,delay){E.tw.push({t0:E.time+(delay||0),dur,fn});}
function at(dt,fn){E.tl.push({t:E.time+dt,fn});}
function mpos(){return[E.mon.base[0]+E.mon.off.x-.2,E.mon.img?1.5+E.mon.off.y:1.5*Math.max(1,E.mon.sc*.9),E.mon.base[2]];}
function hpos(){return[E.hero.base[0]+E.hero.off.x,1.7,E.hero.base[2]];}
function swing(dur){const h=E.hero;tween(dur,u=>{const a=u<.3?-2.2*ease(u/.3):u<.55?-2.2+2.4*ease((u-.3)/.25):.2*(1-ease((u-.55)/.45));h.armR.r[0]=a;
    h.off.y=.14*Math.sin(PI*cl(u/.6));h.off.x=.3*Math.sin(PI*cl(u/.8));h.off.sq=1-.08*Math.sin(PI*cl(u/.3));});}
function goldBurst(p,n,sp,life,size,tx){const t=tx||E.tex.gold;for(let k=0;k<n;k++){const a=Math.random()*PI*2,v=sp*(.4+Math.random()*.7);E.parts.push({x:p[0],y:p[1],z:p[2],vx:Math.cos(a)*v,vy:Math.sin(a)*v*.9+sp*.2,vz:(Math.random()-.3)*v*.5,g:2.5,life:life*(.6+Math.random()*.6),max:life,size:(size||.3)*(.6+Math.random()*.8),tex:t,rot:0,vr:0});}}
function flare(p,sz,dur,tex){const sp={tex:tex||E.tex.gold,pos:p,w:0,h:0,rot:0,a:1};E.sprites.push(sp);tween(dur,u=>{sp.w=sp.h=sz*(.4+.9*u);sp.a=1-u;});at(dur+.05,()=>{const j=E.sprites.indexOf(sp);if(j>=0)E.sprites.splice(j,1);});}
function arrowFly(from,to,dur,delay,sz,arc){const sp={tex:E.tex.arrow,pos:from.slice(),w:0,h:0,rot:0,a:0};
  at(delay,()=>{E.sprites.push(sp);});
  tween(dur,u=>{const e=ease(u),y=from[1]+(to[1]-from[1])*e+(arc||0)*Math.sin(PI*u);sp.pos=[from[0]+(to[0]-from[0])*e,y,from[2]+(to[2]-from[2])*e];
    const nx=from[0]+(to[0]-from[0])*Math.min(1,e+.05),ny=from[1]+(to[1]-from[1])*Math.min(1,e+.05)+(arc||0)*Math.sin(PI*Math.min(1,u+.05));
    sp.rot=Math.atan2(ny-y,nx-sp.pos[0]+1e-4);sp.w=sz*1.3;sp.h=sz*.3;sp.a=1;
    if(Math.random()<.9)E.parts.push({x:sp.pos[0]-.2,y:sp.pos[1],z:sp.pos[2],vx:(Math.random()-.5)*.6,vy:(Math.random()-.3)*.6,vz:0,g:0,life:.3,max:.3,size:.28+Math.random()*.2,tex:E.tex.gold,rot:0,vr:0});},delay);
  at(delay+dur,()=>{const j=E.sprites.indexOf(sp);if(j>=0)E.sprites.splice(j,1);});}
const ATK={
h1:{st:'slash',act:'lunge'},h2:{st:'orb',act:'cast'},h3:{st:'arrow',act:'draw'},h4:{st:'slash',act:'dash'},
h5:{st:'spin',e:'🔱',act:'lunge'},h6:{st:'drop',e:'✨',act:'cast'},h7:{st:'spin',e:'🗡️',act:'throw',sp:22},
h8:{st:'pet',e:'🐱',act:'cast'},h9:{st:'spin',e:'🔧',act:'throw',sp:12},h10:{st:'spin',e:'🔮',act:'cast',sp:5}};
function hid0(){return(E.hero&&E.hero.himg)||'h1';}
function heroPlay(n,dur,delay){const f=()=>{if(E.hero)E.hero.pl={n,t0:E.time,dur};};delay?at(delay,f):f();}
function heroAct(act,dur){const h=E.hero,hid=hid0(),th=ULT[hid]||ULT.h1,gl=utex(hid,th);heroPlay('attack',dur);
  const Q={lunge:[.45,1.7,.28,.3,0,.25],dash:[.6,2.6,.3,.35,0,.3],throw:[.5,.5,.4,.32,0,.3],draw:[.7,.2,.3,.1,0,.12],cast:[.1,.25,.08,.15,.55,.1]}[act]||[.4,1,.25,.25,0,.2];
  const bx=Q[0],fx=Q[1],rb=Q[2],rf=Q[3],yc=Q[4],yf=Q[5];
  at(.02,()=>{const p=hpos();flare([p[0]+.5,p[1]+.3,p[2]+.8],2.2,.35,gl);goldBurst([p[0]+.5,p[1]+.3,p[2]+.8],8,2,.4,.28,gl);});
  tween(dur,u=>{const T=.35,back=u<T?ease(u/T):1-ease(cl((u-T)/.2)),fwd=u<T?0:Math.sin(PI*cl((u-T)/(1-T)));
    h.off.x=-bx*back+fx*fwd;h.off.rz=rb*back-rf*fwd;h.off.sq=1-.12*back+.06*fwd-.07*Math.sin(PI*cl((u-.78)/.22));
    h.off.y=yc*Math.sin(PI*cl(u))+yf*fwd;h.armR.r[0]=-2.2*back+2*fwd;});}
function projFly(hid,from,to,dur,delay,sz,arc){
  const A=ATK[hid]||ATK.h1,th=ULT[hid]||ULT.h1,gl=utex(hid,th),st=A.st;
  const tex=(st==='slash'||st==='arrow')?uslash(hid,th):st==='orb'?gl:emojiTex(A.e);
  const sp={tex,pos:from.slice(),w:0,h:0,rot:0,a:0};
  at(delay,()=>{E.sprites.push(sp);});
  const st0=st==='drop'?[to[0]+(from[0]-to[0])*.15,to[1]+4.2,to[2]]:from;
  tween(dur,u=>{const e=st==='drop'?u*u:ease(u);let x=st0[0]+(to[0]-st0[0])*e,y=st0[1]+(to[1]-st0[1])*e+(st==='drop'?0:(arc||0)*Math.sin(PI*u)),z=st0[2]+(to[2]-st0[2])*e;
    if(st==='pet'){y+=.55*Math.sin(u*PI*3);z+=.3*Math.sin(u*PI*2);}
    sp.pos=[x,y,z];sp.a=1;
    if(st==='slash'){const dy=to[1]-from[1],dx=to[0]-from[0];sp.rot=Math.atan2(dy*.6,dx);sp.w=sz*2.8;sp.h=sz*.8;}
    else if(st==='arrow'){sp.rot=Math.atan2(to[1]-from[1]+(arc||0)*Math.cos(PI*u)*PI*.3,to[0]-from[0]);sp.w=sz*2.6;sp.h=sz*.22;}
    else if(st==='orb'){sp.rot=0;sp.w=sp.h=sz*(1.0+.15*Math.sin(u*30));}
    else if(st==='pet'){sp.rot=.25*Math.sin(u*PI*6);sp.w=sp.h=sz*1.15;}
    else if(st==='drop'){sp.rot=u*3;sp.w=sp.h=sz*1.25;}
    else{sp.rot=u*(A.sp||14);sp.w=sp.h=sz*1.2;}
    if(Math.random()<.9)E.parts.push({x:x-.2,y:y,z:z,vx:(Math.random()-.5)*.6,vy:(Math.random()-.3)*.6,vz:0,g:0,life:.3,max:.3,size:.28+Math.random()*.2,tex:gl,rot:0,vr:0});},delay);
  at(delay+dur,()=>{const j=E.sprites.indexOf(sp);if(j>=0)E.sprites.splice(j,1);});}
function letter(ch,i){ // one hero-specific projectile + letter flies from hero to monster
  if(!E.mon)return;const m=E.mon,hid=hid0(),A=ATK[hid]||ATK.h1,th=ULT[hid]||ULT.h1,gl=utex(hid,th),star=ustar(hid,th),tex=letterTex(ch,i);
  const sp={tex,pos:[-1.5,2.1,.8],w:0,h:0,rot:0,a:0};
  heroAct(A.act,.75);
  const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];
  at(.3,()=>{flare(from,1.4,.3,gl);goldBurst(from,8,2.2,.3,.28,gl);});
  projFly(hid,from,[mpos()[0],mpos()[1],mpos()[2]+.5],.42,.3,1.4,.5);
  at(.32,()=>{E.sprites.push(sp);});
  tween(.42,u=>{const s=hpos(),t=mpos();const e=ease(u);
    sp.pos=[s[0]+.9+(t[0]-s[0]-.9)*e-.3,s[1]+.5+(t[1]-s[1]-.5)*e+.7*Math.sin(PI*u)+.45,s[2]+.9-.4*e];
    const k=.9+.5*e;sp.w=sp.h=k*1.05;sp.rot=.3*Math.sin(u*PI*2)*(i%2?1:-1);sp.a=1;},.32);
  at(.74,()=>{const j=E.sprites.indexOf(sp);if(j>=0)E.sprites.splice(j,1);
    const t=mpos();burst(t,5,star,3.2,.32);goldBurst(t,12,3.6,.45,.3,gl);flare(t,1.6,.3,gl);E.shake=Math.max(E.shake,.18);E.flash.mon=[th.fl[0],th.fl[1],th.fl[2],.5];
    tween(.26,u=>{const e=Math.sin(PI*u);m.off.x=.22*e;m.off.rz=-.1*e;m.off.sq=1-.1*e;});});
}
function finale(word,big){ // hero-specific volley + word after the last letter
  if(!E.mon)return;const m=E.mon,hid=hid0(),A=ATK[hid]||ATK.h1,th=ULT[hid]||ULT.h1,gl=utex(hid,th),star=ustar(hid,th),wt=wordTex(word,th.gl,th.lo);
  heroAct(A.act,.8);
  const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9],t0=mpos(),n=big?7:5;
  at(.3,()=>{flare(from,big?2.4:1.8,.35,gl);goldBurst(from,big?16:10,3,.4,.3,gl);});
  for(let k=0;k<n;k++){const yy=(k-(n-1)/2)*.38;projFly(hid,from,[t0[0]+(A.st==='drop'?yy*1.2:0),t0[1]+yy*.8,t0[2]+.5],.36,.3+k*.05,big?1.3:1.15,(k-(n-1)/2)*.35);}
  const sp={tex:wt.tex,pos:t0,w:0,h:0,rot:0,a:1};
  at(.68,()=>{E.sprites.push(sp);const t=mpos();burst(t,20,star,5.5,.5);goldBurst(t,big?40:22,big?6.5:5,.7,.38,gl);flare(t,big?4.2:2.6,.5,gl);E.shake=big?.9:.7;E.flash.mon=[th.fl[0],th.fl[1],th.fl[2],.9];
    const rg=E.ring;if(rg){rg.p=[t[0],.05,t[2]];tween(.7,u=>{const r=.3+(big?3.2:2.2)*u;rg.s=[r,.01,r];rg.a=.95*(1-u);});}
    tween(.7,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);m.off.x=.8*e;m.off.rz=-.3*e;m.off.sq=1-.22*Math.sin(PI*cl(u*1.4));m.off.sc=1+.07*Math.sin(PI*u);});
    tween(.8,u=>{const t=mpos();sp.pos=[t[0]-.4,t[1]+.55+.3*u,t[2]+.8];const k=.42+.2*ease(Math.min(1,u*3));sp.h=k;sp.w=k*wt.asp;sp.a=u<.7?1:1-(u-.7)/.3;});});
  at(1.55,()=>{const j=E.sprites.indexOf(sp);if(j>=0)E.sprites.splice(j,1);});
}

function sentTex(word,hue,glow,lo){const c=cv(64,64),x=c.getContext('2d'),fam='"Fredoka","Noto Sans TC","Arial Black",Arial,sans-serif',fs=96;
  x.font='700 '+fs+'px '+fam;const w=Math.ceil(x.measureText(word).width)+56,h=150;c.width=w;c.height=h;
  x.font='700 '+fs+'px '+fam;x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.shadowColor=glow||'#FFB020';x.shadowBlur=26;x.lineWidth=22;x.strokeStyle='#1B2A4A';x.strokeText(word,w/2,h/2+6);
  x.shadowBlur=0;const g=x.createLinearGradient(0,30,0,120);g.addColorStop(0,'#FFFFFF');g.addColorStop(.5,hue||'#FFF3A0');g.addColorStop(1,lo||'#FFC83D');x.fillStyle=g;x.fillText(word,w/2,h/2+6);
  return{tex:mkTex(c),asp:w/h};}
const ULT={
h1:{n:'聖光審判',c:[255,205,70],gl:'#FFB020',lo:'#FFC83D',hues:['#FFF3A0','#FFFFFF','#FFE27A'],orbit:'ring',fall:'rain',fin:'cross',pillar:1,fl:[1,.95,.7],orb:['⚔️','⚔️','⚔️']},
h2:{n:'星光流星雨',c:[255,120,225],gl:'#E040C0',lo:'#C890FF',hues:['#FFD6F2','#E6D0FF','#FFFFFF'],orbit:'ring',fall:'meteor',fin:'star',fl:[1,.7,.95],orb:['⭐','🌙','⭐']},
h3:{n:'百箭齊發',c:[110,235,120],gl:'#2EBB4E',lo:'#7ADF6A',hues:['#D9FFC9','#FFFFFF','#BFFFA0'],orbit:'fan',fall:'arrows',fin:'star',fl:[.8,1,.7],orb:['🏹','🏹','🏹']},
h4:{n:'烈焰斬',c:[255,110,30],gl:'#FF5A10',lo:'#FF7A2A',hues:['#FFE9A0','#FFFFFF','#FFC070'],orbit:'ring',fall:'dash',fin:'x',dash:1,fl:[1,.6,.3],orb:['🔥','🔥','🔥']},
h5:{n:'冰龍吐息',c:[130,220,255],gl:'#40B8FF',lo:'#7FD0FF',hues:['#FFFFFF','#D8F4FF','#BFE8FF'],orbit:'vortex',fall:'rain',fin:'freeze',fl:[.6,.85,1],orb:['❄️','🐉','❄️']},
h6:{n:'聖光祝福',c:[255,250,230],gl:'#FFE9A0',lo:'#FFF0B0',hues:['#FFFFFF','#FFF8DC','#FFFFFF'],orbit:'spiral',fall:'soft',fin:'holy',pillar:1,fl:[1,1,.9],orb:['✨','🕊️','✨']},
h7:{n:'暗影連斬',c:[170,90,255],gl:'#7A2CFF',lo:'#9B5CFF',hues:['#E6D0FF','#FFFFFF','#C9A6FF'],orbit:'vortex',fall:'dive',fin:'multi',dash:1,fl:[.7,.4,1],orb:['🗡️','🗡️','🗡️']},
h8:{n:'精靈召喚',c:[110,255,190],gl:'#20C890',lo:'#6AF0B8',hues:['#D8FFEF','#FFFFFF','#FFE6F6'],orbit:'ring',fall:'dive',fin:'star',fl:[.7,1,.85],orb:['🐱','🦊','🐉']},
h9:{n:'機械砲轟',c:[255,160,60],gl:'#E07000',lo:'#FFA040',hues:['#FFFFFF','#FFE0A0','#D8E4F0'],orbit:'ring',fall:'volley',fin:'chain',fl:[1,.8,.4],orb:['⚙️','🔩','⚙️']},
h10:{n:'水晶隕落',c:[150,130,255],gl:'#5A4CFF',lo:'#8C8CFF',hues:['#D8E0FF','#FFFFFF','#E6D0FF'],orbit:'vortex',fall:'meteor',fin:'implode',fl:[.7,.7,1],orb:['🔮','💎','🔮']}};
function ultName(hid){return(ULT[hid]||ULT.h1).n;}
function utex(hid,th){const k='ug'+hid;if(E.tex[k])return E.tex[k];const c=cv(128,128),x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.7)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return E.tex[k]=mkTexA(c,th.c);}
function ustar(hid,th){const k='us'+hid;if(E.tex[k])return E.tex[k];const c=cv(96,96),x=c.getContext('2d');x.translate(48,48);x.beginPath();for(let i=0;i<10;i++){const a=-PI/2+i*PI/5,r=i%2?16:42;x[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}x.closePath();x.fillStyle='rgb('+th.c.join(',')+')';x.fill();x.lineWidth=7;x.strokeStyle='#1B2A4A';x.lineJoin='round';x.stroke();return E.tex[k]=mkTex(c);}
function uslash(hid,th){const k='ul'+hid;if(E.tex[k])return E.tex[k];const c=cv(256,40),x=c.getContext('2d'),r='rgba('+th.c.join(',')+',';let g=x.createLinearGradient(0,0,256,0);g.addColorStop(0,r+'0)');g.addColorStop(.5,r+'1)');g.addColorStop(1,r+'0)');x.fillStyle=g;x.beginPath();x.moveTo(0,20);x.quadraticCurveTo(128,0,256,20);x.quadraticCurveTo(128,40,0,20);x.fill();
  g=x.createLinearGradient(0,0,256,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.moveTo(20,20);x.quadraticCurveTo(128,11,236,20);x.quadraticCurveTo(128,29,20,20);x.fill();return E.tex[k]=mkTex(c);}
// ===== signature ultimates (unique look per hero) =====
function sigTex(k,w,h,f){if(E.tex[k])return E.tex[k];const c=cv(w,h),x=c.getContext('2d');f(x,w,h);return E.tex[k]=mkTex(c);}
const tSword=()=>sigTex('sg_sword',160,420,(x,w,h)=>{x.shadowColor='rgba(255,220,100,1)';x.shadowBlur=26;
  const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#FFE9A0');g.addColorStop(.5,'#FFFFFF');g.addColorStop(1,'#FFD060');x.fillStyle=g;
  x.beginPath();x.moveTo(62,120);x.lineTo(98,120);x.lineTo(98,360);x.lineTo(80,408);x.lineTo(62,360);x.closePath();x.fill();
  x.fillStyle='#FFC83D';x.fillRect(28,96,104,24);x.beginPath();x.arc(28,108,12,0,7);x.arc(132,108,12,0,7);x.fill();
  x.fillStyle='#FFFFFF';x.fillRect(72,34,16,64);x.beginPath();x.arc(80,26,16,0,7);x.fill();
  x.shadowBlur=0;x.strokeStyle='rgba(255,200,80,.85)';x.lineWidth=4;x.beginPath();x.moveTo(80,128);x.lineTo(80,380);x.stroke();});
const tDragon=()=>sigTex('sg_dragon',256,256,(x,w,h)=>{x.font='200px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('🐲',128,138);x.globalCompositeOperation='source-atop';x.fillStyle='rgba(110,190,255,.62)';x.fillRect(0,0,w,h);x.fillStyle='rgba(235,248,255,.22)';x.fillRect(0,0,w,h);});
const tSmoke=()=>sigTex('sg_smoke',128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(40,10,80,.9)');g.addColorStop(.6,'rgba(60,20,110,.45)');g.addColorStop(1,'rgba(60,20,110,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
const tShard=()=>sigTex('sg_shard',96,96,(x,w,h)=>{const g=x.createLinearGradient(20,0,76,96);g.addColorStop(0,'#FFFFFF');g.addColorStop(.5,'#BDEBFF');g.addColorStop(1,'#5CC0FF');x.fillStyle=g;x.shadowColor='#9FE0FF';x.shadowBlur=10;
  x.beginPath();x.moveTo(48,4);x.lineTo(68,52);x.lineTo(48,92);x.lineTo(28,52);x.closePath();x.fill();x.shadowBlur=0;x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=2;x.beginPath();x.moveTo(48,4);x.lineTo(48,92);x.stroke();});
const tIce=()=>sigTex('sg_ice',256,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(225,246,255,.88)');g.addColorStop(.5,'rgba(130,205,255,.58)');g.addColorStop(1,'rgba(90,170,255,.72)');
  x.fillStyle=g;x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=6;x.beginPath();x.moveTo(62,18);x.lineTo(194,18);x.lineTo(238,60);x.lineTo(238,210);x.lineTo(194,240);x.lineTo(62,240);x.lineTo(18,210);x.lineTo(18,60);x.closePath();x.fill();x.stroke();
  x.strokeStyle='rgba(255,255,255,.75)';x.lineWidth=5;x.beginPath();x.moveTo(60,50);x.lineTo(110,90);x.moveTo(190,60);x.lineTo(150,120);x.moveTo(70,200);x.lineTo(120,160);x.stroke();});
function sigBase(sentence,th,hid){
  const m=E.mon,gl=utex(hid,th),rm=s=>{const j=E.sprites.indexOf(s);if(j>=0)E.sprites.splice(j,1);};
  const words=String(sentence||'').replace(/[“”"]/g,'').split(/\s+/).filter(Boolean).slice(0,9);if(!words.length)words.push('!');
  const n=words.length,T=words.map((w,k)=>sentTex(w,th.hues[k%th.hues.length],th.gl,th.lo)),sps=T.map(t=>({tex:t.tex,pos:mpos(),w:0,h:0,rot:0,a:0}));
  const ban=sentTex(th.n+'！',th.hues[0],th.gl,th.lo),bsp={tex:ban.tex,pos:mpos(),w:0,h:0,rot:0,a:0};
  return{m,gl,rm,n,T,sps,ban,bsp,wsz:.56,hid,th};}
function sigBanner(K,tot){E.sprites.push(K.bsp);tween(tot,u=>{const t=u*tot,c=mpos();K.bsp.pos=[c[0]-.1,c[1]+2.6,c[2]+.9];const bk=ease(cl(t/.35)),bf=t>1.6?Math.max(0,1-(t-1.6)/.5):1;K.bsp.h=.95*bk;K.bsp.w=K.bsp.h*K.ban.asp;K.bsp.a=bf;});}
function sigWords(K,fn,tot){K.sps.forEach(s=>E.sprites.push(s));
  tween(tot,u=>{const t=u*tot,c=mpos();for(let k=0;k<K.n;k++){const r=fn(k,t,c),s=K.sps[k];if(!r){s.a=0;continue;}s.pos=r.pos;s.a=r.a===undefined?1:r.a;s.rot=r.rot||0;const g=(r.sc===undefined?1:r.sc)*K.wsz;s.h=g;s.w=g*K.T[k].asp;}});}
function sigLine(ray,pos,ang,len,hh,dur,gl){const sp={tex:ray,pos:pos,w:0,h:hh,rot:ang,a:1};E.sprites.push(sp);tween(dur,v=>{sp.w=len*(.3+.8*ease(v));sp.a=1-v*v;sp.h=hh*(1-v*.5);});at(dur+.04,()=>{const j=E.sprites.indexOf(sp);if(j>=0)E.sprites.splice(j,1);});}
function sigRing(t,R,dur){const rg=E.ring;if(rg)tween(dur,u=>{rg.p=[t[0],.05,t[2]];const r=.3+R*u;rg.s=[r,.01,r];rg.a=.95*(1-u);});}
// --- 勇者：聖光審判 (giant light sword drops through the sentence) ---
function sigH1(sentence,th){const K=sigBase(sentence,th,'h1'),{m,gl,rm,n}=K,TOT=4.4,HT=2.2,ray=uslash('h1',th);
  const sw={tex:tSword(),pos:mpos(),w:0,h:0,rot:0,a:0};
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];
  at(.05,()=>{flare(from,3,.5,gl);goldBurst(from,22,3.5,.5,.32,gl);});
  sigBanner(K,TOT);
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const tw=K.T.map(x=>x.asp*.47+.18),tot=tw.reduce((a,b)=>a+b,0),off=tw.slice(0,k).reduce((a,b)=>a+b,0)+tw[k]/2-tot/2,tg=[c[0]-1.7+off,c[1]+3.9,c[2]+.5],f=ease(cl((t-.1-k*.04)/.6));
    const p=[from[0]+(tg[0]-from[0])*f,from[1]+(tg[1]-from[1])*f+Math.sin(PI*f)*.8,from[2]+(tg[2]-from[2])*f],ab=ease(cl((t-1.0)/.55));
    return{pos:[p[0]+(c[0]-p[0])*ab*.9,p[1]+(c[1]+4.4-p[1])*ab,p[2]],a:1-ab,sc:.6+.4*f-.3*ab,rot:.1*Math.sin(t*5+k)};},1.7);
  const rays=[-2.4,-1.2,0,1.2,2.4].map(()=>({tex:ray,pos:mpos(),w:7,h:.5,rot:PI/2,a:0}));rays.forEach(r=>E.sprites.push(r));E.sprites.push(sw);
  tween(TOT,u=>{const t=u*TOT,c=mpos();
    rays.forEach((r,j)=>{const g=cl((t-.9)/.6),dk=t<HT?1:Math.max(0,1-(t-HT)/.4);r.pos=[c[0]+(j-2)*1.2*(1-.5*ease(g)),c[1]+3.2,c[2]+.3];r.a=.6*g*dk;r.h=.5+.3*Math.sin(t*9+j);});
    if(t<1.0){sw.a=0;return;}
    const g=ease(cl((t-1.0)/.5)),fl=t<1.55?0:cl((t-1.55)/(HT-1.55)),e=fl*fl,H=4.7,W=1.8,cyEnd=c[1]+.9+H/2,cy=cyEnd+(1-e)*4.8;
    sw.pos=[c[0],cy,c[2]+.7];sw.w=W*g;sw.h=H*g;sw.a=t<HT+.9?1:Math.max(0,1-(t-HT-.9)/.5);
    if(t<HT+.5&&Math.random()<.9)E.parts.push({x:c[0]+(Math.random()-.5)*.6,y:cy-H/2+Math.random()*H,z:c[2]+.6,vx:0,vy:1.5+3*e,vz:0,g:0,life:.35,max:.35,size:.42,tex:gl,rot:0,vr:0});});
  at(HT,()=>{const t=mpos();flare(t,6,.6,gl);goldBurst(t,60,7,.9,.4,gl);burst(t,18,gl,6,.5);E.shake=1.3;E.flash.mon=[1,1,.9,1];
    sigLine(ray,[t[0],t[1]+.4,t[2]+.9],0,10,.9,.55,gl);sigLine(ray,[t[0],t[1]+.4,t[2]+.9],PI/2,10,.9,.55,gl);sigRing(t,4.6,.8);
    tween(.8,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);m.off.x=.9*e;m.off.rz=-.3*e;m.off.sq=1-.22*Math.sin(PI*cl(u*1.4));});});
  at(HT+.25,()=>{const t=mpos();goldBurst(t,30,5,1.0,.34,gl);});
  at(TOT,()=>{[...K.sps,K.bsp,sw,...rays].forEach(rm);});
  return TOT;}
// --- 龍騎士：冰龍吐息 (ice dragon head, blizzard carries the words, monster freezes then shatters) ---
function sigH5(sentence,th){const K=sigBase(sentence,th,'h5'),{m,gl,rm,n}=K,TOT=5.0,big=E.big?1.3:1,h=E.hero;
  const aura={tex:gtex([110,200,255]),pos:mpos(),w:0,h:0,rot:0,a:0},ice={tex:tIce(),pos:mpos(),w:0,h:0,rot:0,a:0};
  const snow=emojiTex('❄️'),shard=tShard(),mist=gtex([200,240,255]);
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];
  at(.05,()=>{flare(from,3,.5,gl);goldBurst(from,22,3.5,.5,.32,gl);});
  sigBanner(K,TOT);
  const mouth=()=>{const p=hpos();return[p[0]+1.0,p[1]+1.5,p[2]+.9];};
  // the hero (a dragon knight) breathes the blizzard himself
  tween(.4,u=>{const e=ease(u);h.off.x=.7*e;h.off.rz=-.22*e;h.off.sq=1+.05*e;},.9);
  tween(.5,u=>{const e=ease(u);h.off.x=.7*(1-e);h.off.rz=-.22*(1-e);h.off.sq=1.05-.05*e;},2.9);
  sigWords(K,(k,t,c)=>{const M=mouth(),t0=1.0+k*.11;
    if(t<.1)return null;
    if(t<t0){const f=ease(cl((t-.1)/.8));return{pos:[from[0]+(M[0]-from[0])*f+Math.sin(k+t*3)*.3,from[1]+(M[1]+.5-from[1])*f+Math.sin(PI*f)*.7,from[2]],a:1,sc:.55+.35*f,rot:.15*Math.sin(t*5+k)};}
    const f=cl((t-t0)/.6);if(f>=1)return null;const e=f*f,tg=[c[0]+(k%3-1)*.35,c[1]+.9,c[2]+.7];
    return{pos:[M[0]+(tg[0]-M[0])*e,M[1]+(tg[1]-M[1])*e+Math.sin(f*8+k)*.3*(1-f),M[2]+(tg[2]-M[2])*f],a:1-f*f,sc:.9-.2*f,rot:.4*Math.sin(f*8+k)};},2.9);
  E.sprites.push(aura,ice);
  tween(TOT,u=>{const t=u*TOT,c=mpos(),M=mouth(),p=hpos(),g=ease(cl((t-.2)/.4))*(t>2.9?Math.max(0,1-(t-2.9)/.5):1);
    aura.pos=[p[0]+.2,p[1]+1.1,p[2]+.3];aura.w=aura.h=(3.6+.3*Math.sin(t*8))*g;aura.a=.5*g;
    if(t>1.0&&t<2.7)for(let j=0;j<6;j++){const r=Math.random(),tg=[c[0]+(Math.random()-.5)*1.6,c[1]+.6+Math.random()*1.4,c[2]+.6],d=.4+.25*r;
      E.parts.push({x:M[0]+(Math.random()-.5)*.3,y:M[1]+(Math.random()-.5)*.4,z:M[2],vx:(tg[0]-M[0])/d,vy:(tg[1]-M[1])/d,vz:0,g:0,life:d,max:d,size:.36+.36*r,tex:r<.4?snow:r<.7?shard:mist,rot:r*6,vr:4});}
    const ik=ease(cl((t-1.7)/.5))*(t<3.55?1:0);ice.pos=[c[0],c[1]+.9*big,c[2]+.8];ice.w=3.5*big*ik;ice.h=3.9*big*ik;ice.a=.9*ik;
    if(t>1.7&&t<3.5)E.flash.mon=[.55,.85,1,.55];});
  at(3.35,()=>{E.shake=Math.max(E.shake,.5);const t=mpos();burst(t,8,shard,3,.35);});
  at(3.55,()=>{const t=mpos();flare(t,6,.6,gl);E.shake=1.2;E.flash.mon=[.9,1,1,1];sigRing(t,4.4,.8);
    for(let j=0;j<42;j++){const a=Math.random()*PI*2,v=3+Math.random()*5;E.parts.push({x:t[0]+(Math.random()-.5)*1.2,y:t[1]+.3+Math.random()*1.4,z:t[2]+.6,vx:Math.cos(a)*v,vy:2+Math.random()*4,vz:(Math.random()-.4)*2,g:7,life:1.0,max:1.0,size:.3+Math.random()*.32,tex:shard,rot:Math.random()*6,vr:(Math.random()-.5)*10});}
    for(let j=0;j<26;j++){const a=Math.random()*PI*2,v=2+Math.random()*4;E.parts.push({x:t[0],y:t[1]+.8,z:t[2]+.6,vx:Math.cos(a)*v,vy:Math.random()*3,vz:0,g:1.5,life:1.2,max:1.2,size:.3+Math.random()*.3,tex:Math.random()<.6?snow:mist,rot:0,vr:3});}
    tween(.8,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);m.off.x=.9*e;m.off.rz=-.3*e;m.off.sq=1-.22*Math.sin(PI*cl(u*1.4));});});
  at(TOT,()=>{[...K.sps,K.bsp,aura,ice].forEach(rm);h.off.x=0;h.off.rz=0;h.off.sq=1;});
  return TOT;}
// --- 盜賊：暗影連斬 (screen dims, shadow dashes, one slash per word, final crit) ---
function sigH7(sentence,th){const K=sigBase(sentence,th,'h7'),{m,gl,rm,n}=K,ray=uslash('h7',th),smoke=tSmoke(),h=E.hero;
  const N=Math.max(4,n),S0=1.7,STEP=.26,CR=S0+N*STEP+.15,TOT=CR+.9;
  const cvs=E.canvas;try{cvs.style.transition='filter .25s';cvs.style.filter='brightness(.5) contrast(1.1) saturate(.85)';}catch(e){}
  const undim=()=>{try{cvs.style.filter='';}catch(e){}};at(CR+.3,undim);setTimeout(undim,(TOT+.6)*1000/ .5);
  swing(.6);sigBanner(K,TOT);
  const dxL=()=>(m.base[0]-1.7)-h.base[0],dxR=()=>(m.base[0]+1.7)-h.base[0];
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const f=ease(cl((t-.1)/.5)),q=t*6+k/n*PI*2,R=(1.9-.5*cl((t-.6)/1.0))*f,st=S0+k*STEP;
    if(t<st)return{pos:[c[0]+Math.cos(q)*R*1.1,c[1]+.7+.5*Math.sin(q*.7+k),c[2]+Math.sin(q)*R*.9+.4],a:1,sc:.55+.4*f,rot:q*.5};
    const f2=cl((t-st)/.18);if(f2>=1)return null;return{pos:[c[0]+Math.cos(q)*R*(1-f2),c[1]+.7+.4*(1-f2),c[2]+.5],a:1-f2,sc:.95,rot:q*.5};},CR);
  for(let j=0;j<N;j++){const ts=S0+j*STEP;
    at(ts-.1,()=>{const p=hpos();goldBurst([p[0],p[1]+.7,p[2]+.6],10,2.5,.5,.45,smoke);tween(.1,u=>{h.off.x=(j%2?dxR():dxL());});
      at(.1,()=>{const q=hpos();goldBurst([q[0],q[1]+.7,q[2]+.6],14,3,.5,.45,smoke);});});
    at(ts,()=>{const t=mpos(),ang=[.5,-.6,1.1,-1.0,.2,-.3,.9,-.8,.0][j%9];sigLine(ray,[t[0],t[1]+.7,t[2]+.9],ang,7.5,.5,.25,gl);goldBurst(t,10,4,.4,.3,gl);E.shake=Math.max(E.shake,.4);E.flash.mon=[.75,.5,1,.6];
      tween(.18,u=>{const e=Math.sin(PI*u);m.off.x=(j%2?1:-1)*.2*e;m.off.sq=1-.1*e;});});}
  at(CR,()=>{const t=mpos(),p=[t[0],t[1]+.7,t[2]+.9];h.off.x=dxL();
    sigLine(ray,p,.6,11,1.0,.6,gl);sigLine(ray,p,-.6,11,1.0,.6,gl);flare(t,6,.6,gl);goldBurst(t,60,7,.9,.4,gl);goldBurst(t,30,5,1.0,.5,smoke);E.shake=1.2;E.flash.mon=[1,1,1,1];sigRing(t,4.4,.8);
    tween(.8,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);m.off.x=.9*e;m.off.rz=-.3*e;m.off.sq=1-.22*Math.sin(PI*cl(u*1.4));});});
  tween(.4,u=>{h.off.x=dxL()*(1-ease(u));},CR+.45);
  at(TOT,()=>{[...K.sps,K.bsp].forEach(rm);});
  return TOT;}
const SIGF={h1:sigH1,h5:sigH5,h7:sigH7};
// ===== signature ultimates, batch 2 =====
function sigSp(tex,w,h){const s={tex:tex,pos:[0,0,0],w:w||0,h:h||0,rot:0,a:0};E.sprites.push(s);return s;}
const tRune=col=>sigTex('sg_rune'+col,256,256,(x)=>{x.translate(128,128);x.strokeStyle=col;x.shadowColor=col;x.shadowBlur=10;x.lineWidth=5;
  x.beginPath();x.arc(0,0,118,0,7);x.stroke();x.lineWidth=3;x.beginPath();x.arc(0,0,98,0,7);x.stroke();
  for(let t=0;t<2;t++){x.beginPath();for(let i=0;i<3;i++){const a=-PI/2+i*2*PI/3+t*PI/3;x[i?'lineTo':'moveTo'](Math.cos(a)*98,Math.sin(a)*98);}x.closePath();x.stroke();}
  for(let i=0;i<24;i++){const a=i/24*PI*2;x.beginPath();x.moveTo(Math.cos(a)*108,Math.sin(a)*108);x.lineTo(Math.cos(a)*118,Math.sin(a)*118);x.stroke();}
  x.beginPath();x.arc(0,0,28,0,7);x.stroke();});
const tFeather=()=>sigTex('sg_feather',96,96,(x)=>{x.shadowColor='rgba(255,230,150,.9)';x.shadowBlur=8;const g=x.createLinearGradient(30,0,66,0);g.addColorStop(0,'#FFF3C0');g.addColorStop(.5,'#FFFFFF');g.addColorStop(1,'#FFEBA0');x.fillStyle=g;
  x.beginPath();x.moveTo(48,4);x.bezierCurveTo(70,30,68,66,48,92);x.bezierCurveTo(28,66,26,30,48,4);x.fill();x.shadowBlur=0;x.strokeStyle='rgba(225,185,90,.8)';x.lineWidth=2;x.beginPath();x.moveTo(48,8);x.lineTo(48,92);x.stroke();});
const tRing=col=>sigTex('sg_ring'+col,256,256,(x)=>{x.shadowColor=col;x.shadowBlur=14;x.strokeStyle=col;x.lineWidth=10;x.beginPath();x.arc(128,128,108,0,7);x.stroke();x.shadowBlur=0;x.strokeStyle='#fff';x.lineWidth=4;x.beginPath();x.arc(128,128,108,0,7);x.stroke();});
const tCrystal=()=>sigTex('sg_crys',96,96,(x)=>{const g=x.createLinearGradient(20,0,76,96);g.addColorStop(0,'#FFFFFF');g.addColorStop(.45,'#B8A8FF');g.addColorStop(1,'#5A4CFF');x.fillStyle=g;x.shadowColor='#9C8CFF';x.shadowBlur=12;
  x.beginPath();x.moveTo(48,4);x.lineTo(72,34);x.lineTo(62,88);x.lineTo(34,88);x.lineTo(24,34);x.closePath();x.fill();x.shadowBlur=0;x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=2;x.beginPath();x.moveTo(24,34);x.lineTo(72,34);x.moveTo(48,4);x.lineTo(40,88);x.moveTo(48,4);x.lineTo(56,88);x.stroke();});
const tArrow=()=>sigTex('sg_arrow',192,48,(x)=>{x.shadowColor='#7CFF8A';x.shadowBlur=8;x.fillStyle='#E8FFD8';x.fillRect(14,21,134,6);x.fillStyle='#fff';x.beginPath();x.moveTo(184,24);x.lineTo(146,10);x.lineTo(146,38);x.closePath();x.fill();x.fillStyle='#4CCB5A';x.beginPath();x.moveTo(6,10);x.lineTo(34,24);x.lineTo(6,38);x.lineTo(16,24);x.closePath();x.fill();});
const tSmokeG=()=>sigTex('sg_smokeg',128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(110,110,120,.85)');g.addColorStop(.6,'rgba(90,90,100,.45)');g.addColorStop(1,'rgba(90,90,100,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
function sigHit(m){tween(.2,u=>{const e=Math.sin(PI*u);m.off.x=.18*e;m.off.sq=1-.1*e;});}
function sigBig(m,t,tex,gl,ring){flare(t,6,.6,gl);goldBurst(t,60,7,.9,.4,gl);burst(t,22,tex,6.5,.6);E.shake=1.2;sigRing(t,4.4,.8);
  tween(.8,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);m.off.x=.9*e;m.off.rz=-.3*e;m.off.sq=1-.22*Math.sin(PI*cl(u*1.4));});}
const bz=(a,b,c,t)=>[(1-t)*(1-t)*a[0]+2*(1-t)*t*b[0]+t*t*c[0],(1-t)*(1-t)*a[1]+2*(1-t)*t*b[1]+t*t*c[1],(1-t)*(1-t)*a[2]+2*(1-t)*t*b[2]+t*t*c[2]];
function sigFlame(pos,life,fire){const sp={tex:fire,pos:pos.slice(),w:.9,h:.9,rot:0,a:1};E.sprites.push(sp);tween(life,u=>{sp.pos[1]=pos[1]+.9*u;sp.w=sp.h=(.5+.6*Math.sin(PI*Math.min(1,u*1.5)))*1.1;sp.rot=.25*Math.sin(u*30);sp.a=u<.7?1:1-(u-.7)/.3;});at(life+.05,()=>{const j=E.sprites.indexOf(sp);if(j>=0)E.sprites.splice(j,1);});}
// --- 魔法師：星光流星雨 ---
function sigH2(sentence,th){const K=sigBase(sentence,th,'h2'),{m,gl,rm,n}=K,star=ustar('h2',th),rune=tRune('#FF8AE8'),A=.2,L0=1.5,TOT=L0+n*A+1.3;
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];at(.05,()=>{flare(from,3,.5,gl);goldBurst(from,22,3.5,.5,.32,gl);});
  sigBanner(K,TOT);const seal=sigSp(rune),sealG=sigSp(gl);E.sprites.splice(E.sprites.indexOf(sealG),1);E.sprites.splice(E.sprites.length-1,0,sealG);
  const SC=c=>[c[0]+1.0,c[1]+3.7,c[2]-.2];
  tween(TOT,u=>{const t=u*TOT,c=mpos(),p=SC(c),g=ease(cl((t-.15)/.6))*(t>TOT-1.0?Math.max(0,1-(t-(TOT-1.0))/.5):1);seal.pos=p;seal.w=seal.h=4.8*g;seal.rot=t*.9;seal.a=.95*g;sealG.pos=p;sealG.w=sealG.h=7*g;sealG.a=.45*g;});
  const orbP=(k,t,p)=>{const q=t*1.6+k/n*PI*2;return[p[0]+Math.cos(q)*2.0,p[1]+Math.sin(q)*2.0,p[2]+.4];};
  sigWords(K,(k,t,c)=>{const p=SC(c),tl=L0+k*A;if(t<.1)return null;
    if(t<tl){const f=ease(cl((t-.1-k*.03)/.7)),o=orbP(k,t,p);return{pos:[from[0]+(o[0]-from[0])*f,from[1]+(o[1]-from[1])*f+Math.sin(PI*f)*.6,from[2]+(o[2]-from[2])*f],a:1,sc:.55+.35*f};}
    const f=cl((t-tl)/.45);if(f>=1)return null;const o=orbP(k,tl,p),e=f*f,tg=[c[0],c[1]+.8,c[2]+.6],pos=[o[0]+(tg[0]-o[0])*e,o[1]+(tg[1]-o[1])*e,o[2]+(tg[2]-o[2])*e];
    for(let j=0;j<2;j++)E.parts.push({x:pos[0],y:pos[1],z:pos[2]-.1,vx:(Math.random()-.5),vy:(Math.random()-.5),vz:0,g:0,life:.4,max:.4,size:.3+Math.random()*.2,tex:Math.random()<.5?star:gl,rot:0,vr:3});
    return{pos,a:1-.3*f,sc:.9-.3*f};},TOT);
  for(let k=0;k<n;k++)at(L0+k*A+.45,()=>{const t=mpos();burst(t,8,star,4,.4);goldBurst(t,14,4,.45,.3,gl);E.shake=Math.max(E.shake,.35);E.flash.mon=[1,.7,.95,.55];sigHit(m);});
  at(L0+n*A+.45,()=>{const t=mpos();sigBig(m,t,star,gl);burst(t,30,star,8,.8);E.flash.mon=[1,.75,.95,1];});
  at(TOT,()=>{[...K.sps,K.bsp,seal,sealG].forEach(rm);});return TOT;}
// --- 弓箭手：百箭齊發 ---
function sigH3(sentence,th){const K=sigBase(sentence,th,'h3'),{m,gl,rm,n}=K,arrow=tArrow(),wind=uslash('h3',th),NA=n+10,DT=.11,R0=1.8,TOT=R0+NA*DT+1.5;
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];at(.05,()=>{flare(from,3,.5,gl);goldBurst(from,22,3.5,.5,.32,gl);});
  sigBanner(K,TOT);
  const fan=[];for(let k=0;k<n;k++)fan.push(sigSp(arrow));
  const ar=[],plan=[];for(let i=0;i<NA;i++){ar.push(sigSp(arrow));const hitM=i%3===0;plan.push({x:(Math.random()-.5)*2.4,hit:hitM,gy:hitM?.5+Math.random()*1.2:.15+Math.random()*.3,tl:R0+i*DT});}
  const wi=[];for(let k=0;k<5;k++)wi.push(sigSp(wind));
  const big=sigSp(arrow);
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const f=ease(cl((t-.1-k*.03)/.7)),tg=[c[0]+(k-(n-1)/2)*.75,c[1]+2.9+.25*Math.cos((k-(n-1)/2)*.5),c[2]+.5],p=plan[k];
    if(t<R0){const lf=t<1.3?0:(t-1.3)/.5;return{pos:[from[0]+(tg[0]-from[0])*f,from[1]+(tg[1]-from[1])*f+Math.sin(PI*f)*.6+lf*9,from[2]],a:lf>=.9?0:1,sc:.55+.35*f};}
    const q=cl((t-p.tl)/.32);if(t<p.tl)return null;const ap=[c[0]+p.x,c[1]+7-(7-p.gy-.2)*q*q,c[2]+.5];return q>=1?null:{pos:[ap[0]+.1,ap[1]+.75,ap[2]+.2],a:1,sc:.8};},TOT);
  tween(TOT,u=>{const t=u*TOT,c=mpos();
    fan.forEach((s,k)=>{if(t<.1||t>1.8){s.a=0;return;}const f=ease(cl((t-.1-k*.03)/.7)),tg=[c[0]+(k-(n-1)/2)*.75,c[1]+2.2,c[2]+.5],lf=t<1.3?0:(t-1.3)/.5;
      s.pos=[from[0]+(tg[0]-from[0])*f,from[1]+(tg[1]-from[1])*f+Math.sin(PI*f)*.6+lf*9,from[2]];s.rot=PI/2;s.w=2.0*f;s.h=.5*f;s.a=lf>=.9?0:1;});
    ar.forEach((s,i)=>{const p=plan[i],q=(t-p.tl)/.32;if(q<0){s.a=0;return;}const x=c[0]+p.x,y0=c[1]+7;
      if(q<1){s.pos=[x,y0-(y0-p.gy-.2)*q*q,c[2]+.5];s.rot=-PI/2;s.w=1.5;s.h=.4;s.a=1;}
      else{s.pos=[x,p.gy+.35,c[2]+.5];s.rot=-1.3;s.w=1.5;s.h=.4;s.a=Math.max(0,1-(t-p.tl-.32-.7)/.4);if(!p.done){p.done=1;at(0,()=>{const b=[x,p.gy,c[2]+.5];goldBurst(b,8,2.5,.4,.3,gl);if(p.hit){burst(mpos(),6,gl,4,.4);E.shake=Math.max(E.shake,.3);E.flash.mon=[.8,1,.7,.5];sigHit(m);}});}}});
    wi.forEach((s,j)=>{const ts=R0+j*.35,q=(t-ts)/1.2;if(q<0||q>1){s.a=0;return;}s.pos=[c[0]-5+10*q,c[1]+.4+j*.55,c[2]+.9];s.w=4;s.h=.2;s.rot=0;s.a=.55*Math.sin(PI*q);});
    const bq=(t-(R0+NA*DT+.2))/.3;if(bq<0||bq>1.8){big.a=0;}else{const q=Math.min(1,bq);big.pos=[c[0],c[1]+7-(7-.9)*q*q,c[2]+.7];big.rot=-PI/2;big.w=5;big.h=1.2;big.a=bq<1?1:Math.max(0,1.8-bq)/.8;}});
  at(R0+NA*DT+.5,()=>{const t=mpos();sigBig(m,t,gl,gl);E.flash.mon=[.85,1,.75,1];});
  at(TOT,()=>{[...K.sps,K.bsp,...fan,...ar,...wi,big].forEach(rm);});return TOT;}
// --- 劍士：烈焰斬 ---
function sigH4(sentence,th){const K=sigBase(sentence,th,'h4'),{m,gl,rm,n}=K,fire=emojiTex('🔥'),emb=gtex([255,140,40]),ray=uslash('h4',th),h=E.hero,S=[2.0,2.4,2.8],F=3.4,TOT=F+1.2;
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];at(.05,()=>{flare(from,3,.5,gl);goldBurst(from,22,3.5,.5,.32,gl);});
  sigBanner(K,TOT);const dx=(m.base[0]-1.7)-h.base[0],glows=K.sps.map(()=>sigSp(emb));
  tween(.25,u=>{h.off.x=dx*ease(u);},1.5);tween(.35,u=>{h.off.x=dx*(1-ease(u));},F+.6);
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const f=ease(cl((t-.1)/.5)),q=t*3.4+k/n*PI*2,R=2.05*(.5+.5*f),dv=1.9+k*(1.2/n),df=cl((t-dv)/.22);
    const o=[c[0]+Math.cos(q)*R*1.12,c[1]+.5+.5*Math.sin(q)+.12*Math.sin(t*4+k),c[2]+Math.sin(q)*R*.9+.4];if(df>=1)return null;
    const pos=[o[0]+(c[0]-o[0])*df,o[1]+(c[1]+.6-o[1])*df,o[2]+(c[2]+.5-o[2])*df];
    if(Math.random()<.7)E.parts.push({x:pos[0],y:pos[1]-.1,z:pos[2]-.1,vx:0,vy:1.2,vz:0,g:0,life:.4,max:.4,size:.5,tex:Math.random()<.5?fire:emb,rot:0,vr:2});
    return{pos,a:1,sc:.55+.4*f,rot:q*.15};},TOT);
  tween(TOT,u=>{const t=u*TOT;K.sps.forEach((s,k)=>{const g=glows[k];g.pos=s.pos;g.w=s.w*1.5;g.h=s.h*3;g.a=s.a*.7;});});
  S.forEach((ts,j)=>at(ts,()=>{const t=mpos(),ang=[PI/4,-PI/4,0][j];sigLine(ray,[t[0],t[1]+.6,t[2]+.9],ang,8,.7,.35,gl);E.shake=Math.max(E.shake,.5);E.flash.mon=[1,.6,.3,.7];sigHit(m);
    for(let q=-2;q<=2;q++)sigFlame([t[0]+Math.cos(ang)*q*.8,t[1]+.6+Math.sin(ang)*q*.8,t[2]+.9],.9,fire);goldBurst(t,12,4,.4,.3,emb);}));
  at(F,()=>{const t=mpos(),p=[t[0],t[1]+.6,t[2]+.9];sigLine(ray,p,PI/4,11,1.0,.6,gl);sigLine(ray,p,-PI/4,11,1.0,.6,gl);sigBig(m,t,fire,emb);E.flash.mon=[1,.6,.2,1];
    for(let j=0;j<10;j++)sigFlame([t[0]+(Math.random()-.5)*3,t[1]+Math.random()*1.4,t[2]+.9],1.1,fire);
    for(let j=0;j<22;j++){const a=Math.random()*PI*2,v=3+Math.random()*4;E.parts.push({x:t[0],y:t[1]+.6,z:t[2]+.8,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.8+2,vz:0,g:3,life:.8,max:.8,size:.5+Math.random()*.3,tex:fire,rot:0,vr:3});}});
  at(TOT,()=>{[...K.sps,K.bsp,...glows].forEach(rm);h.off.x=0;});return TOT;}
// --- 牧師：聖光祝福 ---
function sigH6(sentence,th){const K=sigBase(sentence,th,'h6'),{m,gl,rm,n}=K,fea=tFeather(),ringT=tRing('#FFE9A0'),heart=emojiTex('💖'),h=E.hero,TOT=4.4;
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];at(.05,()=>{flare(from,3,.5,gl);goldBurst(from,22,3.5,.5,.32,gl);});
  sigBanner(K,TOT);const rings=[0,1,2].map(()=>sigSp(ringT)),pil=sigSp(gl),hs=[0,1,2,3,4].map(()=>sigSp(heart));
  tween(.4,u=>{h.off.y=.35*ease(u);},.5);tween(.4,u=>{h.off.y=.35*(1-ease(u));},3.0);
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const sp=k-(n-1)/2,f=ease(cl((t-.1-k*.05)/1.0)),tg=[c[0]+sp*.7,c[1]+2.6+.2*Math.sin(t*2+k),c[2]+.5],dis=cl((t-2.6)/.6);
    if(dis>=1)return null;return{pos:[from[0]+(tg[0]-from[0])*f,from[1]+(tg[1]-from[1])*f,from[2]],a:1-dis,sc:.6+.3*f,rot:.06*Math.sin(t*2+k)};},TOT);
  tween(TOT,u=>{const t=u*TOT,c=mpos(),p=hpos();
    rings.forEach((r,j)=>{const q=(t-1.0-j*.35)/1.1;if(q<0||q>1){r.a=0;return;}r.pos=[c[0],c[1]+.7,c[2]+.4];r.w=r.h=.8+5.2*ease(q);r.a=.9*(1-q);});
    const pk=t<1.5?0:t<3.3?ease(cl((t-1.5)/.4)):Math.max(0,1-(t-3.3)/.5);pil.pos=[c[0],c[1]+3.0,c[2]+.2];pil.w=2.2*pk;pil.h=6.6*pk;pil.a=.75*pk;
    hs.forEach((s,j)=>{const q=(t-1.4-j*.25)/1.3;if(q<0||q>1){s.a=0;return;}s.pos=[p[0]+.3+.35*Math.sin(q*7+j),p[1]+.8+2.4*q,p[2]+.9];s.w=s.h=.7;s.a=Math.sin(PI*q);});
    if(t>1.2&&t<3.4)for(let j=0;j<2;j++)E.parts.push({x:c[0]+(Math.random()-.5)*5,y:c[1]+5,z:c[2]+.2+Math.random()*.8,vx:(Math.random()-.5)*.8,vy:-1.4,vz:0,g:0,life:2.6,max:2.6,size:.34+Math.random()*.2,tex:fea,rot:Math.random()*6,vr:(Math.random()-.5)*3});
    if(t>1.5&&t<3.4)E.flash.mon=[1,1,.85,.35];});
  at(3.2,()=>{const t=mpos();flare(t,5,.6,gl);goldBurst(t,50,2.2,1.6,.4,gl);sigRing(t,3.8,.9);E.shake=.5;E.flash.mon=[1,1,.9,.9];});
  at(TOT,()=>{[...K.sps,K.bsp,...rings,pil,...hs].forEach(rm);h.off.y=0;});return TOT;}
// --- 召喚師：精靈召喚 ---
function sigH8(sentence,th){const K=sigBase(sentence,th,'h8'),{m,gl,rm,n}=K,rune=tRune('#6AF0B8'),paw=emojiTex('🐾'),E3s=['🐱','🦊','🐲'].map(e=>emojiTex(e)),S0=1.9,ST=.28,FIN=S0+n*ST+.35,TOT=FIN+1.0;
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];at(.05,()=>{flare(from,3,.5,gl);goldBurst(from,22,3.5,.5,.32,gl);});
  sigBanner(K,TOT);const seal=sigSp(rune),sealG=sigSp(gl),spirits=K.sps.map((_,k)=>sigSp(E3s[k%3]));
  const SC=c=>[c[0]-.6,c[1]+3.0,c[2]-.2];
  tween(TOT,u=>{const t=u*TOT,c=mpos(),p=SC(c),g=ease(cl((t-.15)/.6))*(t>FIN-.2?Math.max(0,1-(t-(FIN-.2))/.5):1);seal.pos=p;seal.w=seal.h=4.6*g;seal.rot=-t*.8;seal.a=.95*g;sealG.pos=p;sealG.w=sealG.h=6.5*g;sealG.a=.4*g;});
  const orb=(k,t,c)=>{const q=t*2.2+k/n*PI*2;return[c[0]+Math.cos(q)*2.4*1.1,c[1]+1.2+.5*Math.sin(q*1.3+k),c[2]+Math.sin(q)*2.0+.4];};
  const pos=(k,t,c)=>{const te=.5+k*.18,ts=S0+k*ST;if(t<te)return null;const p=SC(c),f=ease(cl((t-te)/.6)),o=orb(k,Math.min(t,ts),c);
    if(t<ts)return[p[0]+(o[0]-p[0])*f,p[1]+(o[1]-p[1])*f,p[2]+(o[2]-p[2])*f,f];
    const q=cl((t-ts)/.3),e=q*q,tg=[c[0],c[1]+.7,c[2]+.6];if(t>ts+.7)return null;
    if(q>=1)return[tg[0]+(t-ts-.3)*1.6,tg[1]+.8*(t-ts-.3),tg[2],Math.max(0,1-(t-ts-.3)/.4)];
    return[o[0]+(tg[0]-o[0])*e,o[1]+(tg[1]-o[1])*e,o[2]+(tg[2]-o[2])*e,1];};
  sigWords(K,(k,t,c)=>{const p=pos(k,t,c);if(!p||t>S0+k*ST+.3)return null;return{pos:[p[0],p[1]-.9,p[2]+.2],a:p[3],sc:.55};},TOT);
  tween(TOT,u=>{const t=u*TOT,c=mpos();spirits.forEach((s,k)=>{const p=pos(k,t,c);if(!p){s.a=0;return;}s.pos=[p[0],p[1],p[2]];s.w=s.h=1.5*p[3];s.a=p[3];s.rot=.15*Math.sin(t*6+k);
    if(t>S0+k*ST&&t<S0+k*ST+.35&&Math.random()<.8)E.parts.push({x:p[0],y:p[1]-.2,z:p[2],vx:0,vy:.2,vz:0,g:0,life:.5,max:.5,size:.45,tex:paw,rot:0,vr:0});});});
  for(let k=0;k<n;k++)at(S0+k*ST+.3,()=>{const t=mpos();burst(t,9,paw,4,.45);goldBurst(t,14,4,.45,.3,gl);E.shake=Math.max(E.shake,.4);E.flash.mon=[.7,1,.85,.55];sigHit(m);});
  at(FIN,()=>{const t=mpos();sigBig(m,t,paw,gl);E.flash.mon=[.8,1,.9,1];for(let j=0;j<24;j++)E.parts.push({x:t[0]+(Math.random()-.5)*4,y:t[1]+4,z:t[2]+.5,vx:0,vy:-3,vz:0,g:0,life:1.0,max:1.0,size:.5,tex:paw,rot:Math.random()*6,vr:2});});
  at(TOT,()=>{[...K.sps,K.bsp,seal,sealG,...spirits].forEach(rm);});return TOT;}
// --- 工程師：機械砲轟 ---
function sigH9(sentence,th){const K=sigBase(sentence,th,'h9'),{m,gl,rm,n}=K,gear=emojiTex('⚙️'),bolt=emojiTex('🔩'),rocket=emojiTex('🚀'),fire=emojiTex('🔥'),sm=tSmokeG(),org=gtex([255,150,50]),L0=1.4,A=.3,FIN=L0+n*A+.8,TOT=FIN+1.3;
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];at(.05,()=>{flare(from,3,.5,gl);goldBurst(from,22,3.5,.5,.32,gl);});
  sigBanner(K,TOT);const GP=()=>{const p=hpos();return[p[0]+1.0,p[1]+2.7,p[2]+.8];};const g=sigSp(gear),gg=sigSp(org),ms=K.sps.map(()=>sigSp(rocket));
  const path=(k,c,q)=>{const a=GP(),b=[c[0]-1.2,c[1]+7.5,c[2]+.5],d=[c[0]+(k%3-1)*.3,c[1]+.5,c[2]+.6];return bz(a,b,d,q);};
  tween(TOT,u=>{const t=u*TOT,p=GP(),f=ease(cl((t-.2)/.5))*(t>FIN?Math.max(0,1-(t-FIN)/.4):1);g.pos=p;g.w=g.h=2.0*f;g.rot=t*3;g.a=f;gg.pos=p;gg.w=gg.h=3.6*f;gg.a=.6*f;});
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const tl=L0+k*A,GPp=GP();
    if(t<tl){const f=ease(cl((t-.1-k*.03)/.7)),sp=k-(n-1)/2,tg=[GPp[0]+sp*.55,GPp[1]+1.4,GPp[2]];return{pos:[from[0]+(tg[0]-from[0])*f,from[1]+(tg[1]-from[1])*f+Math.sin(PI*f)*.5,from[2]],a:1,sc:.5+.2*f};}
    const q=cl((t-tl)/.75);if(q>=1)return null;const p=path(k,c,q);return{pos:[p[0],p[1]+.8,p[2]+.2],a:1,sc:.7};},TOT);
  tween(TOT,u=>{const t=u*TOT,c=mpos();ms.forEach((s,k)=>{const tl=L0+k*A,q=(t-tl)/.75;if(q<0||q>=1){s.a=0;return;}const p=path(k,c,q),p2=path(k,c,Math.min(1,q+.03));
      s.pos=p;s.w=s.h=1.2;s.rot=Math.atan2(p2[1]-p[1],p2[0]-p[0])-PI/4;s.a=1;
      E.parts.push({x:p[0],y:p[1],z:p[2]-.1,vx:(Math.random()-.5)*.5,vy:.3,vz:0,g:-.6,life:.9,max:.9,size:.5+Math.random()*.3,tex:sm,rot:0,vr:1});
      E.parts.push({x:p[0],y:p[1],z:p[2]-.05,vx:0,vy:0,vz:0,g:0,life:.25,max:.25,size:.5,tex:org,rot:0,vr:0});});});
  const boom=(t,big)=>{flare(t,big?5:3,.45,org);burst(t,big?16:9,fire,big?6:4.5,.5);goldBurst(t,big?40:16,big?6:4,.6,.5,sm);
    for(let j=0;j<(big?10:5);j++){const a=Math.random()*PI*2,v=3+Math.random()*4;E.parts.push({x:t[0],y:t[1]+.4,z:t[2]+.6,vx:Math.cos(a)*v,vy:2+Math.random()*4,vz:0,g:7,life:1.0,max:1.0,size:.42,tex:j%2?gear:bolt,rot:0,vr:6});}
    E.shake=Math.max(E.shake,big?1.3:.6);E.flash.mon=[1,.7,.3,big?1:.6];sigHit(m);};
  for(let k=0;k<n;k++)at(L0+k*A+.75,()=>boom(mpos(),false));
  at(FIN,()=>{for(let j=0;j<5;j++)at(j*.12,()=>{const q=mpos();boom([q[0]+(Math.random()-.5)*3,q[1]+(Math.random()-.5)*1.6,q[2]+.6],false);});at(.7,()=>{const t=mpos();boom(t,true);sigRing(t,4.6,.8);});});
  at(TOT,()=>{[...K.sps,K.bsp,g,gg,...ms].forEach(rm);});return TOT;}
// --- 神秘使者：水晶隕落 ---
function sigH10(sentence,th){const K=sigBase(sentence,th,'h10'),{m,gl,rm,n}=K,ball=emojiTex('🔮'),crys=tCrystal(),hole=tSmoke(),pur=gtex([150,130,255]),IMP=3.1,TOT=IMP+1.2;
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];at(.05,()=>{flare(from,3,.5,gl);goldBurst(from,22,3.5,.5,.32,gl);});
  sigBanner(K,TOT);const bl=sigSp(ball),bg=sigSp(pur),hl=sigSp(hole),cs=K.sps.map(()=>sigSp(crys));
  tween(TOT,u=>{const t=u*TOT,c=mpos(),f=ease(cl((t-.15)/.6))*(t>IMP-.2?Math.max(0,1-(t-(IMP-.2))/.4):1),p=[c[0]+.3,c[1]+3.3+.12*Math.sin(t*4),c[2]+.5];
    bl.pos=p;bl.w=bl.h=(2.4+.2*Math.sin(t*9))*f;bl.a=f;bg.pos=p;bg.w=bg.h=(5+.5*Math.sin(t*7))*f;bg.a=.55*f;
    const hk=ease(cl((t-2.0)/.9))*(t>IMP?0:1);hl.pos=[c[0],c[1]+.7,c[2]+.9];hl.w=hl.h=2.6*hk;hl.a=.9*hk;
    if(t>2.0&&t<IMP){m.off.sc=1-.45*ease(cl((t-2.0)/.9));m.off.rz=.25*Math.sin(t*12)*ease(cl((t-2.0)/.5));E.flash.mon=[.4,.25,.7,.6];
      for(let j=0;j<4;j++){const a=Math.random()*PI*2,R=3.4;E.parts.push({x:c[0]+Math.cos(a)*R,y:c[1]+.7+(Math.random()-.5)*2,z:c[2]+Math.sin(a)*R*.5+.6,vx:-Math.cos(a)*R/.5,vy:(Math.random()-.5),vz:0,g:0,life:.5,max:.5,size:.4,tex:Math.random()<.5?crys:pur,rot:Math.random()*6,vr:4});}}});
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const f=ease(cl((t-.1-k*.04)/.8)),pull=ease(cl((t-2.0)/.9)),q=t*(3.0+4*pull)+k/n*PI*2,R=(2.2*(1-pull)+.15)*f,
      o=[c[0]+Math.cos(q)*R*1.15,c[1]+.5+(.5+.5*Math.sin(t*2+k))*1.8*(1-pull),c[2]+Math.sin(q)*R*.9+.4],ft=[from[0],from[1],from[2]],e=cl(t/.9),
      pos=t<.9?[ft[0]+(o[0]-ft[0])*e,ft[1]+(o[1]-ft[1])*e,ft[2]+(o[2]-ft[2])*e]:o;if(t>IMP-.15)return null;return{pos,a:1-pull*.7,sc:.55+.4*f-.3*pull};},TOT);
  tween(TOT,u=>{const t=u*TOT;K.sps.forEach((s,k)=>{const c=cs[k];c.pos=[s.pos[0],s.pos[1],s.pos[2]-.15];c.w=s.h*1.5;c.h=s.h*1.7;c.a=s.a*.8;c.rot=.2*Math.sin(t*3+k);});});
  at(IMP,()=>{const t=mpos();sigBig(m,t,crys,pur);E.flash.mon=[.95,.9,1,1];m.off.sc=1;m.off.rz=0;
    for(let j=0;j<50;j++){const a=Math.random()*PI*2,v=3+Math.random()*6;E.parts.push({x:t[0],y:t[1]+.7,z:t[2]+.7,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.8+2,vz:(Math.random()-.4)*2,g:5,life:1.1,max:1.1,size:.36+Math.random()*.3,tex:crys,rot:Math.random()*6,vr:(Math.random()-.5)*10});}});
  at(TOT,()=>{[...K.sps,K.bsp,bl,bg,hl,...cs].forEach(rm);m.off.sc=1;m.off.rz=0;});return TOT;}
Object.assign(SIGF,{h2:sigH2,h3:sigH3,h4:sigH4,h6:sigH6,h8:sigH8,h9:sigH9,h10:sigH10});
function ultimate(sentence,hid){ // 大絕招 (per hero): the sentence's words are the ammo
  if(!E.mon)return;heroPlay('attack',1.2);if(SIGF[hid])return SIGF[hid](sentence,ULT[hid]);const th=ULT[hid]||ULT.h1,m=E.mon,star=ustar(hid,th),gl=utex(hid,th),slash=uslash(hid,th),FM=th.fall;
  const gb=(p,nn,sp,life,size)=>goldBurst(p,nn,sp,life,size,gl),rm=s=>{const j=E.sprites.indexOf(s);if(j>=0)E.sprites.splice(j,1);};
  const words=String(sentence||'').replace(/[“”"]/g,'').split(/\s+/).filter(Boolean).slice(0,9),n=words.length||1;if(!words.length)words.push('!');
  const T=words.map((w,k)=>sentTex(w,th.hues[k%th.hues.length],th.gl,th.lo)),sps=T.map(t=>({tex:t.tex,pos:mpos(),w:0,h:0,rot:0,a:0}));
  const ban=sentTex(th.n+'！',th.hues[0],th.gl,th.lo),bsp={tex:ban.tex,pos:mpos(),w:0,h:0,rot:0,a:0};
  const orbs=(th.orb||[]).map(e=>({tex:emojiTex(e),pos:mpos(),w:0,h:0,rot:0,a:0})),pil={tex:gl,pos:mpos(),w:0,h:0,rot:0,a:0};
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];
  at(.05,()=>{flare(from,3,.5,gl);gb(from,22,3.5,.5,.32);});
  at(.1,()=>{if(th.pillar)E.sprites.push(pil);sps.forEach(s=>E.sprites.push(s));orbs.forEach(s=>E.sprites.push(s));E.sprites.push(bsp);});
  const FALL={rain:.42,meteor:.5,arrows:.42,dash:.36,dive:.34,volley:.42,soft:.95}[FM]||.42,ST=FM==='soft'?.2:.14,HIT=3.6,TOTAL=HIT+n*ST+FALL;
  const orbP=(k,t,c)=>{const o=th.orbit,a0=k/n*PI*2;
    if(o==='vortex'){const q=t*5.2+a0,R=1.5+.35*Math.sin(t*3+k),y=(.5+.5*Math.sin(t*2.2+a0))*2.4;return[c[0]+Math.cos(q)*R*1.1,c[1]+y,c[2]+Math.sin(q)*R*.9+.4];}
    if(o==='spiral'){const q=t*2.6+a0,y=.2+(t/2.8)*2.3+.3*Math.sin(t*3+k);return[c[0]+Math.cos(q)*1.7*1.1,c[1]+y,c[2]+Math.sin(q)*1.7*.9+.4];}
    if(o==='fan'){const a=(k-(n-1)/2)/Math.max(1,n-1)*2.2,r=ease(cl(t/.6));return[c[0]+Math.sin(a)*3.2*r,c[1]+(1.3+Math.cos(a)*1.8)*r+.12*Math.sin(t*4+k),c[2]+.6];}
    const q=t*3.4+a0,R=2.05*(.5+.5*ease(cl(t/.5)));return[c[0]+Math.cos(q)*R*1.12,c[1]+.35+.5*Math.sin(q)+.12*Math.sin(t*4+k),c[2]+Math.sin(q)*R*.9+.4];};
  const hovP=(k,c)=>{const sp=k-(n-1)/2,a0=k/n*PI*2;
    if(FM==='meteor')return[c[0]+3.6+sp*.5,c[1]+4.7,c[2]+.5];
    if(FM==='arrows')return[c[0]+sp*.8,c[1]+4.7,c[2]+.5];
    if(FM==='volley'){const h=hpos();return[h[0]+1.1,1.0+k*.3,h[2]+.9];}
    if(FM==='dash'||FM==='dive')return[c[0]+Math.cos(a0)*2,c[1]+1.2,c[2]+Math.sin(a0)*1.6+.4];
    return[c[0]+sp*.62,c[1]+4.7,c[2]+.5];};
  const fallP=(k,f,hv,c)=>{const e=f*f;
    if(FM==='volley')return[hv[0]+(c[0]-hv[0])*f,hv[1]+(c[1]+.5-hv[1])*f+1.3*Math.sin(PI*f),hv[2]+(c[2]+.4-hv[2])*f];
    if(FM==='soft')return[hv[0]+(c[0]-hv[0])*.8*f+.25*Math.sin(f*7+k),hv[1]+(c[1]+.45-hv[1])*f,hv[2]];
    const full=FM==='meteor'||FM==='dash'||FM==='dive';
    return[hv[0]+(c[0]-hv[0])*(full?1:.8)*e,hv[1]+(c[1]+.45-hv[1])*e,hv[2]+(full?(c[2]+.4-hv[2])*e:0)];};
  tween(TOTAL+.2,u=>{const t=u*(TOTAL+.2),c=mpos();
    const bk=ease(cl(t/.35)),bf=t>1.5?Math.max(0,1-(t-1.5)/.5):1;bsp.pos=[c[0]-.1,c[1]+2.6,c[2]+.9];bsp.h=.95*bk;bsp.w=bsp.h*ban.asp;bsp.a=bf;
    const rg=E.ring;if(rg&&t<HIT){rg.p=[c[0],.05,c[2]];const r=2.1+.15*Math.sin(t*6);rg.s=[r,.01,r];rg.a=.55*Math.min(1,t/.4)*(t>2.8?Math.max(0,1-(t-2.8)/.8):1);}
    if(th.pillar){const pk=t<HIT-.4?0:t<TOTAL+.1?ease(cl((t-HIT+.4)/.4)):Math.max(0,1-(t-TOTAL-.1)/.5);pil.pos=[c[0],c[1]+3.2,c[2]+.2];pil.w=1.7*pk;pil.h=6.2*pk;pil.a=.85*pk;}
    orbs.forEach((o,j)=>{const a0=j/orbs.length*PI*2,q=-Math.min(t,HIT)*2.6+a0,R=2.5,sx=c[0]+Math.cos(q)*R*1.1,sy=c[1]+1+.4*Math.sin(Math.min(t,HIT)*3+j),sz=c[2]+Math.sin(q)*R*.9+.6;
      if(t<HIT){const g=ease(cl(t/.4));o.pos=[c[0]+(sx-c[0])*ease(cl(t/.5)),sy,c[2]+(sz-c[2])*ease(cl(t/.5))];o.w=o.h=1.0*g;o.a=1;}
      else{const f=cl((t-HIT-j*.12)/.4),e=f*f;o.pos=[sx+(c[0]-sx)*e,sy+(c[1]+.5-sy)*e,sz+(c[2]+.5-sz)*e];o.a=f<1?1:0;o.w=o.h=1.0*(1-.4*f);}});
    for(let k=0;k<n;k++){const s=sps[k],sz=.56,wsz=sz*T[k].asp;
      if(t<2.8+.8){const p=t<2.8?0:ease((t-2.8)/.8),op=orbP(k,Math.min(t,2.8),c),hv=hovP(k,c),pos=[op[0]+(hv[0]-op[0])*p,op[1]+(hv[1]-op[1])*p,op[2]+(hv[2]-op[2])*p];
        s.pos=pos;const gr=.55+.45*ease(cl(t/.45));s.h=sz*gr;s.w=wsz*gr;s.rot=.12*Math.sin(t*5+k);s.a=1;
        if(Math.random()<.5)E.parts.push({x:s.pos[0],y:s.pos[1]-.1,z:s.pos[2]-.1,vx:0,vy:.2,vz:0,g:0,life:.35,max:.35,size:.3,tex:gl,rot:0,vr:0});
      }else{const sk=HIT+k*ST,hv=hovP(k,c);
        if(t<sk){s.pos=[hv[0],hv[1]+.12*Math.sin(t*6+k),hv[2]];s.a=1;s.rot=0;}
        else{const f=cl((t-sk)/FALL);s.pos=fallP(k,f,hv,c);s.rot=0;s.a=f<1?1:0;
          if(Math.random()<.8)E.parts.push({x:s.pos[0],y:s.pos[1]+.3,z:s.pos[2],vx:0,vy:.3,vz:0,g:0,life:.3,max:.3,size:.34,tex:gl,rot:0,vr:0});}
        s.h=sz;s.w=wsz;}}
  });
  if(FM==='rain'||FM==='arrows'||FM==='meteor'||FM==='soft')tween(n*ST+FALL+.4,u=>{const c=mpos();for(let j=0;j<3;j++){const mt=FM==='meteor',sf=FM==='soft';E.parts.push({x:c[0]+(mt?3.4:0)+(Math.random()-.5)*3.8,y:c[1]+4.6,z:c[2]+.3+Math.random()*.8,vx:mt?-7:0,vy:sf?-3.5:mt?-8:-9.5,vz:0,g:0,life:sf?1.3:.55,max:sf?1.3:.55,size:.3+Math.random()*.2,tex:Math.random()<.5?gl:star,rot:0,vr:2});}},HIT-.1);
  for(let k=0;k<n;k++)at(HIT+k*ST+FALL,()=>{const t=mpos();burst(t,7,star,3.6,.35);gb(t,14,4,.45,.3);E.shake=Math.max(E.shake,.35);E.flash.mon=[th.fl[0],th.fl[1],th.fl[2],.55];
    tween(.2,u=>{const e=Math.sin(PI*u);m.off.x=(k%2?1:-1)*.18*e;m.off.sq=1-.12*e;});});
  orbs.forEach((o,j)=>at(HIT+j*.12+.42,()=>{const t=mpos();burst(t,8,star,4,.4);gb(t,12,4,.4,.3);}));
  const SL=(ang,dl,len)=>at(dl,()=>{const t=mpos(),sp={tex:slash,pos:[t[0],t[1]+.1,t[2]+.9],w:0,h:.6,rot:ang,a:1};E.sprites.push(sp);tween(.18,v=>{sp.w=len*(.3+.8*ease(v));sp.a=1-v*v;sp.h=.6*(1-v*.5);});at(.22,()=>rm(sp));gb(t,10,4,.35,.28);E.shake=Math.max(E.shake,.45);});
  if(th.dash){const h=E.hero,dx=(m.base[0]-1.7)-h.base[0];tween(.3,u=>{h.off.x=dx*ease(u);},TOTAL-.6);tween(.35,u=>{h.off.x=dx*(1-ease(u));},TOTAL+.7);}
  if(th.fin==='cross'){SL(0,TOTAL-.05,8);SL(PI/2,TOTAL+.05,8);}
  if(th.fin==='x'){SL(PI/4,TOTAL-.1,8);SL(-PI/4,TOTAL+.05,8);}
  if(th.fin==='multi')[.5,-.6,1.2,-1.1,0].forEach((a,j)=>SL(a,TOTAL-.4+j*.09,7));
  if(th.fin==='freeze')tween(TOTAL-HIT+.3,u=>{E.flash.mon=[.55,.85,1,.5];},HIT-.1);
  if(th.fin==='implode')tween(.8,u=>{const c=mpos();for(let j=0;j<5;j++){const a=Math.random()*PI*2,R=3.4*(1-u*.7);E.parts.push({x:c[0]+Math.cos(a)*R,y:c[1]+.4+(Math.random()-.3)*1.8,z:c[2]+Math.sin(a)*R*.6+.4,vx:-Math.cos(a)*6,vy:0,vz:-Math.sin(a)*3,g:0,life:.5,max:.5,size:.34,tex:Math.random()<.5?gl:star,rot:0,vr:3});}},TOTAL-.8);
  at(TOTAL+.05,()=>{const t=mpos();flare(t,5.4,.6,gl);gb(t,60,7,.9,.4);burst(t,26,star,6.5,.6);E.shake=1.1;E.flash.mon=[th.fl[0],th.fl[1],th.fl[2],.95];
    const rg=E.ring;if(rg){rg.p=[t[0],.05,t[2]];tween(.8,u=>{const r=.3+4.2*u;rg.s=[r,.01,r];rg.a=.95*(1-u);});}
    tween(.8,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);m.off.x=.9*e;m.off.rz=-.3*e;m.off.sq=1-.22*Math.sin(PI*cl(u*1.4));});
    if(th.fin==='freeze')burst(t,40,star,7.5,.5);
    if(th.fin==='holy')gb(t,50,2,1.6,.4);
    if(th.fin==='chain')for(let j=0;j<5;j++)at(.1+j*.12,()=>{const q=mpos(),p=[q[0]+(Math.random()-.5)*3,q[1]+(Math.random()-.5)*2,q[2]+.6];flare(p,2.4,.35,gl);gb(p,16,4.5,.5,.32);burst(p,8,star,4,.4);E.shake=Math.max(E.shake,.6);});});
  at(TOTAL+1,()=>{[...sps,bsp,...orbs,pil].forEach(rm);});
  return TOTAL+.8;
}
function attack(word){finale(word,false);}
function gtex(c){const k='gt'+c.join('-');if(E.tex[k])return E.tex[k];const cc=cv(128,128),x=cc.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba('+c.join(',')+',.85)');g.addColorStop(1,'rgba('+c.join(',')+',0)');x.fillStyle=g;x.fillRect(0,0,128,128);return E.tex[k]=mkTex(cc);}
const HURT={fire:{e:'🔥',st:'ball',c:[255,130,40]},ice:{e:'❄️',st:'volley',n:3,c:[140,220,255]},elec:{e:'⚡',st:'bolt',c:[255,235,90]},
poison:{e:'☠️',st:'lob',c:[150,255,110]},forest:{e:'🍃',st:'swirl',n:6,c:[120,230,110]},sea:{e:'🌊',st:'sweep',c:[90,180,255]},
desert:{e:'🪨',st:'volley',n:3,arc:1.8,c:[240,190,110]},sky:{e:'🌪️',st:'dash',c:[210,230,255]},ghost:{e:'👻',st:'drift',c:[190,160,255]},
mech:{e:'🚀',st:'volley',n:3,fast:1,c:[255,170,60]},skel:{e:'🦴',st:'ball',spin:16,c:[235,225,210]},dragon:{e:'🔥',st:'breath',c:[255,90,40]}};
function hurt(emoji,type){
  if(!E.mon)return;const h=E.hero,m=E.mon,H=HURT[type]||{e:emoji||'💥',st:'ball',c:[255,120,60]},st=H.st,c=H.c,tex=emojiTex(H.e),gl=gtex(c),star=starTex();
  const rm=s=>{const j=E.sprites.indexOf(s);if(j>=0)E.sprites.splice(j,1);},lerp=(a,b,t)=>a+(b-a)*t;
  const mp=mpos(),hp=hpos(),F=[mp[0]-.8,mp[1]+.2,mp[2]+.5],T=[hp[0]+.2,hp[1]-.2,hp[2]+.5];
  const up=st==='bolt'||st==='drift';
  tween(.35,u=>{const e=ease(u);
    if(up){m.off.y=.5*e;m.off.sc=1+.1*e;}
    else if(st==='lob'||st==='volley'||st==='swirl'){m.off.sq=1-.16*e;m.off.rz=st==='volley'?.15*Math.sin(u*18):.2*e;}
    else{m.off.x=.35*e;m.off.sq=1-.1*e;m.off.rz=.2*e;}});
  tween(.4,u=>{const e=ease(u),w=Math.sin(PI*u);
    if(up){m.off.y=.5*(1-e);m.off.sc=1.1-.1*e;}
    else if(st==='lob'||st==='volley'||st==='swirl'){m.off.sq=.84+.16*e;m.off.rz=.2*(1-e);}
    else{m.off.x=.35*(1-e)-1.0*w;m.off.sq=.9+.1*e;m.off.rz=.2*(1-e);}},.35);
  at(.8,()=>{m.off.x=0;m.off.y=0;m.off.sq=1;m.off.rz=0;m.off.sc=1;});
  const fly=(delay,dur,path,o)=>{const sp={tex,pos:F.slice(),w:0,h:0,rot:0,a:0};at(delay,()=>{E.sprites.push(sp);});
    tween(dur,u=>{const p=path(u);sp.pos=p;const k=(o.sz||1.2)*(o.grow?.7+.5*u:1);sp.w=k*(o.wr||1);sp.h=k*(o.hr||1);sp.rot=o.spin?u*o.spin:0;sp.a=o.fade?Math.min(1,Math.sin(PI*u)*2.2):1;
      if(Math.random()<.85)E.parts.push({x:p[0],y:p[1]-.1,z:p[2]-.1,vx:(Math.random()-.5)*.6,vy:(Math.random()-.3)*.6,vz:0,g:0,life:.35,max:.35,size:o.tr||.36,tex:gl,rot:0,vr:0});},delay);
    at(delay+dur+.02,()=>rm(sp));};
  let HT=0;
  const hit=(dt,small)=>{HT=Math.max(HT,dt+.12);at(dt,()=>{const t=hpos();burst(t,small?6:14,star,small?3:4.5,.4);goldBurst(t,small?10:24,4,.5,.36,gl);E.shake=Math.max(E.shake,small?.3:.7);E.flash.hero=[c[0]/255,c[1]/255,c[2]/255,small?.45:.8];
    if(!small)heroPlay('hit',.7);
    if(!small)tween(.6,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);h.off.x=-.9*e;h.off.rz=.35*e;h.off.sq=1-.2*Math.sin(PI*cl(u*1.5));});});};
  const line=(arc,wob)=>u=>{const e=ease(u);return[lerp(F[0],T[0],e),lerp(F[1],T[1],e)+arc*Math.sin(PI*u)+(wob?wob*Math.sin(u*PI*4):0),lerp(F[2],T[2],e)];};
  if(st==='ball'){fly(.35,.5,line(.7),{spin:H.spin||8,sz:1.35,grow:1});hit(.85);}
  else if(st==='dash'){fly(.35,.32,line(0),{sz:1.5,wr:1.4,spin:-10});hit(.67);}
  else if(st==='volley'){const n=H.n||3,d=H.fast?.3:.42;for(let k=0;k<n;k++){const a=(H.arc||.9)*((k-(n-1)/2)*.9+.5);fly(.32+k*.12,d,line(a),{spin:6,sz:1.0});hit(.32+k*.12+d,k<n-1);}}
  else if(st==='bolt'){[0,1].forEach(k=>at(.4+k*.18,()=>{const t=hpos(),bs={tex,pos:[t[0]+.1+k*.5,t[1]+1.2,t[2]+.6],w:1.9,h:4.6,rot:0,a:1};E.sprites.push(bs);E.flash.hero=[1,1,.7,.95];E.shake=.6;
    tween(.2,u=>{bs.a=u%.1<.05?1:.55;bs.w=1.9*(1-u*.3);});at(.22,()=>rm(bs));hit(0,k===0);}));}
  else if(st==='lob'){fly(.35,.65,line(2.8),{spin:3,sz:1.5});hit(1.0);at(1.0,()=>{goldBurst(hpos(),24,2.5,1,.6,gl);});}
  else if(st==='swirl'){const n=H.n||6;for(let k=0;k<n;k++){fly(.3+k*.07,.5,u=>{const p=line(0,.9)(u);p[2]+=.4*Math.sin(u*PI*2+k);return p;},{spin:5,sz:.85});hit(.8+k*.07,k<n-1);}}
  else if(st==='sweep'){fly(.35,.55,u=>[lerp(F[0],T[0],ease(u)),.9+.12*Math.sin(u*PI*5),lerp(F[2],T[2],ease(u))+.3],{sz:1.7,wr:2.0,hr:1.1,grow:1});hit(.9);}
  else if(st==='drift'){fly(.4,.6,line(.2,.6),{sz:1.7,fade:1,spin:0});hit(.95);at(.95,()=>{E.flash.hero=[.7,.6,1,.9];});}
  else if(st==='breath'){tween(.5,u=>{for(let k=0;k<4;k++){const d=.34,r=Math.random();E.parts.push({x:F[0],y:F[1]+.3,z:F[2],vx:(T[0]-F[0])/d*(.9+.3*r),vy:(T[1]-F[1]-.3)/d+(r-.5)*1.4,vz:0,g:0,life:d,max:d,size:.5+.5*r,tex:r<.5?tex:gl,rot:r*6,vr:3});}},.35);hit(.7,true);hit(.9);}
  return Math.max(HT,.75);
}
const DIE_BOOM={mech:1,fire:1,elec:1,poison:1,dragon:1};
function die(type){
  if(!E.mon)return;const m=E.mon,h=E.hero,star=starTex(),big=E.big,boom=!!DIE_BOOM[type],c=(HURT[type]||{}).c||[255,230,140],gl=gtex(c),sm=gtex([70,70,80]),R=Math.random;
  const rise=(n,tx,sz,vy,g)=>{const p=mpos();for(let i=0;i<n;i++){const r=R();E.parts.push({x:p[0]+(R()-.5)*1.8,y:p[1]-.7+R()*1.5,z:p[2]+.3,vx:(r-.5)*.7,vy:vy*(.7+r*.6),vz:0,g:g||0,life:.9,max:.9,size:sz*(.6+R()*.8),tex:tx,rot:0,vr:(R()-.5)*3});}};
  const boomAt=(dx,dy,sz,n)=>{const p=mpos(),q=[p[0]+dx,p[1]+dy,p[2]+.5];flare(q,sz,.45,gl);goldBurst(q,n,sz*1.4,.7,.4,gl);goldBurst(q,Math.round(n/2),sz,.9,.7,sm);burst(q,Math.round(n/2),star,sz*1.6,.45);E.shake=Math.max(E.shake,sz*.25);};
  E.flash.mon=[1,1,1,.9];burst(mpos(),big?36:22,star,6,.55);E.shake=Math.max(E.shake,big?1:.6);
  // 1) last hit: knocked back
  tween(.32,u=>{const e=Math.sin(PI*u*.9);m.off.x=.55*e;m.off.sq=1-.14*e;m.off.rz=-.14*e;});
  if(boom){
    const T=big?1.5:.9;
    tween(T,u=>{m.off.x=.18*Math.sin(u*95)*Math.min(1,u*4);m.off.sq=1-.06*u;E.flash.mon=[1,.35,.1,(.25+.4*Math.abs(Math.sin(u*14)))*(u>.1?1:0)];if(Math.random()<.5)rise(1,sm,.9,1.4);if(Math.random()<.4)rise(1,gl,.45,2.2,2);},.32);
    if(big){[.7,1.0,1.25].forEach((d,i)=>at(.32+d,()=>boomAt((i-1)*.9,(i%2?.5:-.3),1.6,14)));}
    at(.32+T,()=>{m.off.al=0;m.off.sc=.001;m.off.x=0;m.off.sq=1;m.off.rz=0;boomAt(0,0,big?4.4:2.8,big?46:26);E.flash.mon=null;
      const t=mpos(),rg=E.ring;if(rg){rg.p=[t[0],.05,t[2]];tween(.7,u=>{const r=.3+(big?3.4:2.2)*u;rg.s=[r,.01,r];rg.a=.9*(1-u);});}
      goldBurst([t[0],1.2,t[2]+.3],big?26:14,3.2,1.0,.45,E.tex.gold);});
  }else{
    const T=big?1.5:.95;
    tween(T,u=>{const e=ease(u);m.off.x=.55*(1-ease(cl(u*2)))*0;m.off.al=Math.max(0,(1-e)*(Math.floor(u*18)%2&&u<.85?.55:1));m.off.y=.9*e;m.off.sc=1-.25*e;m.off.sq=1-.04*e;
      if(Math.random()<.9){rise(1,gl,.55,1.6);}if(Math.random()<.5)rise(1,star,.45,1.2);},.32);
    at(.32,()=>{const t=mpos(),rg=E.ring;if(rg){rg.p=[t[0],.05,t[2]];tween(.8,u=>{const r=.3+(big?3.2:2.0)*u;rg.s=[r,.01,r];rg.a=.8*(1-u);});}});
    at(.32+T,()=>{m.off.al=0;m.off.sc=.001;m.off.y=0;const t=mpos();burst([t[0],1.4,t[2]],big?30:16,star,4.5,.45);goldBurst([t[0],1.0,t[2]+.3],big?26:14,3,1.0,.45,E.tex.gold);});
    if(big)at(.8,()=>{const t=mpos();burst(t,20,star,5,.5);E.shake=Math.max(E.shake,.5);});
  }
  heroPlay('win',1.3,.4);
  tween(1.1,u=>{h.off.y=.7*Math.abs(Math.sin(u*PI*2));h.armR.r[0]=-2.6*Math.sin(PI*cl(u*2));},.4);
}
function mount(slot){if(slot&&E.canvas&&E3.ok)slot.appendChild(E.canvas);}
function idle(){return!E.tw.length&&!E.tl.length;}
return{ensure,setup,attack,letter,finale,ultimate,ultName,hurt,die,mount,E,monModel,heroModel,burst,idle};
})();
/* ---------- battle ---------- */
let B=null;
function startBattle(kind,id){
  const g=G();rollDay();
  let pool,mon,hp,name,k;
  if(kind==='set'){
    const s=SETS.find(x=>x.id===id);pool=s.words.slice();hp=pool.length+2*Math.floor(pool.length/4)+1;mon=SETMON[id];name=monName(mon);k=s.k;
  }else if(kind==='elite'||kind==='boss'){
    const b=BATTLE[id];if(!b)return;
    if(kind==='elite'?!eliteOpen(b):!bossOpen(b))return;
    pool=uniqWords(b.sets);pool=shuffle(pool).sort((a,c)=>(g.mast[a.w]||0)-(g.mast[c.w]||0));
    hp=Math.min(kind==='boss'?14:10,pool.length);mon=b.mon;name=monName(mon);k=b.k;
  }else{
    pool=store.missed.map(w=>WORDS.get(w)).filter(Boolean);if(!pool.length)return;
    hp=Math.min(6,pool.length);mon=shuffle(MON_IDS)[0];name='復仇・'+monName(mon);k='k7';
  }
  const queue=((kind==='boss'||kind==='elite')?pool.slice(0,hp):kind==='set'?shuffle(pool):shuffle(pool).slice(0,hp));
  B={asked:new Set(),kind,id,mon,name,k,pool,queue,hp,maxhp:hp,shown:hp,php:pmax(),pm:pmax(),mana:0,sp:pmax(),sm:0,skill:false,q:null,sheet:false,anim:'',dmg:0,crit:false,right:0,wrongN:0,healed:false,lockUntil:0,qStart:0,wrong:[],lvl0:lvlOf(g.xp),qn:0,busy:false,opened:false,res:null,goalMsg:''};
  nextQ();
  if(ENG.ensure()){try{ENG.setup(mon,heroEq(),G().heroId,kind==='boss');}catch(e){E3.ok=false;}}
  S.view='battle';render();top();
}
function nextQ(){
  if(!B.queue.length)B.queue=shuffle(B.pool).slice(0,4);
  const t0=B.queue.shift(),t=variant(t0);B.asked.add(t0.w);
  const type=Math.random()<.5?'cloze':'def';
  B.q={type,t,choices:makeChoices(t,type),pick:null,hint:false};B.qStart=Date.now();
}
function answerB(idx){
  if(!B||B.busy||B.q.pick!==null||(B.q.gone&&B.q.gone.includes(idx)))return;
  if(!(typeof window!=='undefined'&&window.__noRush)&&Date.now()-B.qStart<RUSH_MS){rushToast();return;}
  const q=B.q,g=G();q.pick=idx;
  const ok=q.choices[idx].correct,w=q.t.w;
  B.sheet=false;B.busy=true;
  if(ok){
    const crit=false,ult=(B.mana||0)>=mmax(B),dmg=ult?3:1;B.ult=ult;
    if(!ult)B.mana=Math.min(mmax(B),(B.mana||0)+1);B.skill=B.mana>=mmax(B);
    B.ultExtra='';if(ult){const hid=g.heroId;if(hid==='h6'&&B.php<B.pm){B.php++;B.ultExtra='heal';}else if(hid==='h5'){B.frozen=true;B.ultExtra='freeze';}}
    B.right++;B.crit=crit;const keep=(B.kind==='set'&&B.asked.size<B.pool.length)?1:0;B.dmg=Math.max(0,Math.min(dmg,B.hp-keep));B.hp=Math.max(keep,B.hp-dmg);B.anim=crit?'crit':'hit';
    g.mast[w]=Math.min(3,(g.mast[w]||0)+1);dropMissed(w);addXp(5);
    B.revived=false;
    if(B.wrongSet&&B.wrongSet.has(w)&&g.inv.note){B.wrongSet.delete(w);g.coins+=3;B.noteMsg=true;}else B.noteMsg=false;
    rollDay();g.today++;
    if(g.today===GOAL&&g.goalDay!==g.day){g.streak=(g.goalDay===ydayStr())?g.streak+1:1;g.goalDay=g.day;g.coins+=20;B.goalMsg='今日目標完成！+20 金幣';}
    crit?SFX.crit():SFX.hit();
  }else{
    B.mana=Math.max(0,(B.mana||0)-1);B.skill=B.mana>=mmax(B);B.anim='atk';B.noteMsg=false;B.revived=false;B.ultExtra='';if(B.frozen){B.frozen=false;B.iced=true;}else{B.iced=false;B.php--;}B.wrongN++;
    B.healed=false;if((B.kind==='elite'||B.kind==='boss')&&B.hp<B.maxhp){B.hp++;B.healed=true;}
    if(!B.wrongSet)B.wrongSet=new Set();B.wrongSet.add(w);
    if(B.php<=0&&g.inv.potion>0){g.inv.potion--;B.php=Math.min(3,B.pm);B.revived=true;}
    if(!B.wrong.some(x=>x.w===q.t.w))B.wrong.push(q.t.__b||q.t);
    addMissed(w);g.mast[w]=Math.max(0,(g.mast[w]||0)-1);
    B.queue.splice(Math.min(2,B.queue.length),0,q.t.__b||q.t);
    SFX.hurt();
  }
  const tk=B;
  if(ok){
    B.anim='spell';saveStore();render();
    spellAttack(w,q.t.ex,tk,()=>{B.anim='hit';render();syncBars(tk,E3.ok?300:380);setTimeout(()=>{if(B!==tk||S.view!=='battle')return;const wasUlt=tk.ult;if(tk.ult){tk.mana=0;tk.skill=false;tk.ult=false;syncBars(tk,0);}B.anim='';B.sheet=true;B.busy=false;if(!wasUlt)readSentence(tk,q.t.ex);else tk.reading=false;render();},E3.ok?1100:700);});
    return;
  }
  saveStore();render();
  let hT=.25;if(E3.ok&&!B.iced){try{hT=ENG.hurt(projOf(B.mon),(MBY[B.mon]||{}).t)||.9;}catch(e){}}
  syncBars(tk,Math.round(hT*1000));
  setTimeout(()=>{if(B!==tk||S.view!=='battle')return;B.anim='';B.sheet=true;B.busy=false;B.lockUntil=Date.now()+LOCK_MS;readSentence(tk,q.t.ex);render();
    setTimeout(()=>{if(B!==tk||S.view!=='battle')return;const nx=document.getElementById('nextB');if(nx&&nx.disabled&&!B.reading){nx.disabled=false;}},LOCK_MS+30);},E3.ok?1500:1000);
}
const LNAME={a:'ay',b:'bee',c:'see',d:'dee',e:'ee',f:'eff',g:'jee',h:'aitch',i:'eye',j:'jay',k:'kay',l:'el',m:'em',n:'en',o:'oh',p:'pee',q:'cue',r:'are',s:'ess',t:'tee',u:'you',v:'vee',w:'double you',x:'ex',y:'why',z:'zee'};
// read the example sentence 0.5s after the feedback card appears; the continue button waits until it ends
function readSentence(tk,ex){
  tk.reading=true;let over=false;
  const end=()=>{if(over)return;over=true;tk.reading=false;if(B===tk&&S.view==='battle'&&tk.sheet){const nx=document.getElementById('nextB'),q=tk.q,ok=q&&q.pick!==null&&q.choices[q.pick].correct;if(nx){nx.textContent='Continue';nx.disabled=!ok&&Date.now()<tk.lockUntil;if(!nx.disabled)nx.focus({preventScroll:true});}else render();}};
  setTimeout(()=>{
    if(B!==tk||S.view!=='battle'){over=true;tk.reading=false;return;}
    if(!HAS_TTS){setTimeout(end,Math.min(4500,1200+ex.length*45));return;}
    try{
      speechSynthesis.cancel();
      const v=(()=>{try{return speechSynthesis.getVoices().find(v=>/^en[-_]US/i.test(v.lang));}catch(e){}})();
      const u=new SpeechSynthesisUtterance(ex);u.lang='en-US';u.rate=.85;if(v)u.voice=v;
      let started=false;u.onstart=()=>{started=true;};u.onend=end;u.onerror=end;
      speechSynthesis.speak(u);
      setTimeout(()=>{if(!started)end();},2500);
      setTimeout(end,Math.max(8000,ex.length*140));
    }catch(e){end();}
  },500);
}
// player HP / mana bars animate to their new values at the moment the attack lands (they are redrawn with the old values first)
function syncBars(tk,delay){setTimeout(()=>{if(B!==tk||S.view!=='battle')return;tk.sp=tk.php;tk.sm=tk.mana||0;const mm=mmax(tk);
  const hp=document.getElementById('phpbar'),ht=document.getElementById('phptxt'),mp=document.getElementById('mpbar'),mt=document.getElementById('mptxt'),mw=document.getElementById('mpwrap');
  if(hp)hp.style.width=Math.round(tk.sp/tk.pm*100)+'%';if(ht)ht.textContent='❤ '+tk.sp+'/'+tk.pm;
  if(mp)mp.style.width=Math.round(tk.sm/mm*100)+'%';if(mt)mt.textContent='✦ 魔力 '+tk.sm+'/'+mm;if(mw&&mw.classList&&mw.classList.toggle)mw.classList.toggle('full',tk.sm>=mm);},delay);}
function spellAttack(word,ex,tk,done){
  const L=word.toLowerCase().replace(/[^a-z]/g,'').split(''),n=L.length;
  const alive=()=>B===tk&&S.view==='battle';
  const thrown=[];let fin=false,timers=[];
  const T=(ms,f)=>{timers.push(setTimeout(f,ms));};
  const throwL=k=>{if(thrown[k]||!alive())return;thrown[k]=1;SFX.hit();if(E3.ok){try{ENG.letter(L[k].toUpperCase(),k);}catch(e){}}
    if(k+1<n)T(HAS_TTS?1500:850,()=>throwL(k+1));else T(HAS_TTS?1500:900,finish);};
  const finish=()=>{if(fin||!alive())return;fin=true;timers.forEach(clearTimeout);
    let wait=E3.ok?1250:650;if(E3.ok){try{if(tk.ult)wait=Math.round(ENG.ultimate(ex,G().heroId)*1000);else ENG.finale(word,false);}catch(e){}}SFX.crit&&SFX.crit();
    const t0=Date.now(),mw=E3.ok?wait:200;
    const poll=()=>{if(!alive())return;const el=Date.now()-t0;let idle=true;if(E3.ok){try{idle=ENG.idle();}catch(e){}}
      if(el>=mw&&(idle||el>12000))done();else T(120,poll);};
    T(120,poll);};
  if(!n){finish();return;}
  if(HAS_TTS){
    try{
      speechSynthesis.cancel();
      const v=(()=>{try{return speechSynthesis.getVoices().find(v=>/^en[-_]US/i.test(v.lang));}catch(e){}})();
      const mk=(t,rate,on)=>{const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=rate;if(v)u.voice=v;if(on)u.onstart=on;return u;};
      speechSynthesis.speak(mk(word,.8,finish));
      if(tk.ult)speechSynthesis.speak(mk(ex,.85));
      T(1200,finish); // watchdog if speech never starts
    }catch(e){T(300,finish);}
  }else T(250,finish);
}
function nextB(){
  if(!B||B.busy||B.reading)return;try{if(HAS_TTS)speechSynthesis.cancel();}catch(e){}
  if(Date.now()<B.lockUntil&&!(typeof window!=='undefined'&&window.__noRush))return;
  if(B.hp<=0){
    B.anim='die';B.sheet=false;B.busy=true;render();if(E3.ok){try{ENG.die((MBY[B.mon]||{}).t);}catch(e){}}else burst(['⭐','✨','🌟','💥'],16);SFX.win();
    const tk=B;setTimeout(()=>{if(B===tk)finish(true);},1500);return;
  }
  if(B.php<=0){finish(false);return;}
  B.qn++;nextQ();B.anim='';B.sheet=false;render();top();
}
function rollBonus(){
  const g=G(),t=g.reward;
  if(t==='stats'){return{t:'xp',v:rnd(15,45)};}
  if(t==='coins'){const lucky=Math.random()<.15;return{t:'coins',v:rnd(15,45)*(lucky?2:1),lucky};}
  const chest=RMON.filter(m=>m.role==='x'||m.role==='r');
  const un=chest.filter(m=>!g.rcards[m.id]);
  const rare=Math.random()<.2;
  let pool=chest.filter(m=>(m.role==='r')===rare);if(!pool.length)pool=chest;
  const pu=pool.filter(m=>!g.rcards[m.id]);if(pu.length&&Math.random()<.7)pool=pu;
  const m=pool[Math.floor(Math.random()*pool.length)];
  const had=!!g.rcards[m.id];g.rcards[m.id]=(g.rcards[m.id]||0)+1;
  return{t:'rcard',id:m.id,isNew:!had,n:g.rcards[m.id]};
}
function finish(win){
  const g=G();
  let xp=0,coins=0,bonus=null,stars=0,gotMon=false,newMon=false,monN=0;
  if(win){
    const tot=B.right+B.wrongN,acc=tot?B.right/tot:0;
    stars=acc>=.85?3:acc>=.65?2:1;
    const mult=stars===3?1:stars===2?.8:.4;
    const K=B.kind;
    xp=Math.round((K==='boss'?100:K==='elite'?60:K==='set'?30:20)*mult);
    coins=Math.round((K==='boss'?60:K==='elite'?25:K==='set'?10:8)*mult);
    addXp(xp);g.coins+=coins;
    if(K!=='revenge'){
      g.def[B.id]=(g.def[B.id]||0)+1;
      g.stars[B.id]=Math.max(g.stars[B.id]||0,stars);
      if(K==='boss')g.boss++;
      if(stars>=2){const had=!!g.rcards[B.mon];g.rcards[B.mon]=(g.rcards[B.mon]||0)+1;gotMon=true;newMon=!had;monN=g.rcards[B.mon];}
    }
    if(stars>=2){bonus=rollBonus();
      if(bonus.t==='xp')addXp(bonus.v);
      if(bonus.t==='coins')g.coins+=bonus.v;}
  }
  const lv=lvlOf(g.xp);
  B.res={win,xp,coins,bonus,lv,lvUp:lv>B.lvl0,stars,gotMon,newMon,monN};
  saveStore();
  S.view=win?'reward':'defeat';B.busy=false;
  render();top();
  win?(lv>B.lvl0?SFX.open():SFX.coin()):SFX.lose();
}

/* ---------- game views ---------- */
function hearts(n,max,lostIdx){
  let h='';for(let i=0;i<max;i++)h+=HEART.replace('%c',(i<n?'':'off')+(i===lostIdx?' break':''));
  return `<div class="hearts" aria-label="生命 ${n}">${h}</div>`;
}
function monSvg(id){const s=monSprite(id);return s?'<img class="msp" alt="" src="'+s.u+'">':(MON[id]?MON[id].svg:'');}
function stageHTML(b,opts){
  opts=opts||{};
  const use3=!!(opts.live&&E3.ok);
  const pct=Math.round(b.shown/b.maxhp*100);
  let fx='';
  if(b.anim==='hit'||b.anim==='crit'){
    if(!use3)fx+=`<svg class="slash ${b.anim}" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 18L88 82"/>${b.anim==='crit'?'<path d="M86 18L14 84" class="s2"/>':''}</svg>`;
    fx+=`<span class="dmg ${b.anim==='crit'?'c':''}">-${b.dmg}</span>`;
  }
  if(b.anim==='atk'&&!use3)fx+=`<span class="proj">${projOf(b.mon)}</span><span class="ouch">哎呀！</span>`;
  if(b.anim==='atk'&&use3)fx+=`<span class="ouch">哎呀！</span>`;
  let hud='';
  if(use3){
    const g=G(),hero=HEROES.find(h=>h.id===g.heroId)||HEROES[0],ms=monSprite(b.mon),mana=b.mana||0,mm=mmax(b),cr=g.inv.crystal||0;
    const canPo=opts.live&&B===b&&b.q&&b.q.pick===null&&!b.busy&&(g.inv.potion||0)>0&&b.php<b.pm;
    const canCr=opts.live&&B===b&&b.q&&b.q.pick===null&&cr>0&&!b.q.gone;
    const log=b.anim==='spell'||b.anim==='hit'||b.anim==='crit'?(b.ult?(()=>{let n='大絕招';try{n=ENG.ultName(G().heroId);}catch(e){}return n+'！整句魔法化成彈藥，全力轟出！怪物 -3 HP'+(b.ultExtra==='heal'?'，還回復 1 顆愛心 💖':b.ultExtra==='freeze'?'，怪物被冰凍，下次答錯不扣愛心 ❄️':'');})():'金色箭矢命中！怪物 -1 HP'):b.anim==='atk'?(b.iced?'怪物被冰凍住了，沒能反擊！愛心沒有減少 ❄️':b.healed?'怪物反擊！牠還回復了 1 HP':'怪物反擊！英雄受到傷害'):b.sheet?'':mana>=5?'魔力全滿！下一題答對，就放大絕招！':'選出正確的單字，用金色箭矢攻擊！';
    hud=`<div class="hud hl"><span class="hport"><img alt="" src="${HSPR[hero.id].u}"></span><div class="hbars"><div class="hn">Lv.${lvlOf(g.xp)} ${hero.zh}</div>
      <div class="bar hp"><i id="phpbar" style="width:${Math.round(b.sp/b.pm*100)}%"></i><span id="phptxt">❤ ${b.sp}/${b.pm}</span></div>
      <div class="bar mp${b.sm>=mm?' full':''}" id="mpwrap"><i id="mpbar" style="width:${Math.round(b.sm/mm*100)}%"></i><span id="mptxt">✦ 魔力 ${b.sm}/${mm}</span></div></div></div>
    <div class="hud hr"><div class="hbars r"><div class="hn">${b.kind==='boss'?'魔王・':b.kind==='elite'?'精英・':b.kind==='revenge'?'復仇・':''}${b.name}</div>
      <div class="bar mh"><i id="mhpbar" style="width:${pct}%"></i><span id="mhptxt">💀 ${Math.max(0,b.shown)}/${b.maxhp}</span></div></div><span class="hport m"><img alt="" src="${ms?ms.u:''}"></span></div>
    <div class="skills"><span class="sk${mana>=mm?' ready':''}" title="大絕招：答對 ${mm} 題蓄滿魔力，下一題答對發動"><b>🏹</b><small>${mana>=mm?'絕招':'攻擊'}</small></span>
      <button class="sk" data-act="crystal" ${canCr?'':'disabled'} aria-label="提示水晶"><b>🔮</b><small>水晶</small><em>${cr}</em></button>
      <button class="sk" data-act="potion" aria-label="復活藥水" ${canPo?'':'disabled'}><b>🧪</b><small>藥水</small><em>${g.inv.potion||0}</em></button></div>
    `;
  }
  const cls=['stage',b.kind==='boss'?'boss':'',b.anim,opts.beaten?'beaten':'',b.kind==='revenge'?'rev':'',use3?'c3':''].join(' ');
  return `<div class="${cls} ${b.k}">${use3?hud:`<div class="nameplate">${b.kind==='boss'?'<b>魔王</b>':b.kind==='elite'?'<b>精英</b>':b.kind==='revenge'?'<b class="rv">復仇</b>':''}${b.name}</div>`}
  ${use3?'<div class="c3d"></div>':`<div class="mon-wrap"><div class="mon">${monSvg(b.mon)}</div></div>
  ${opts.noHero?'':`<div class="hbat">${heroImg()}</div>`}`}
  ${opts.noHp||use3?'':`<div class="mhp" aria-label="怪物生命"><i id="mhpbar" style="width:${pct}%"></i><span>HP ${Math.max(0,b.hp)}/${b.maxhp}</span></div>`}
  <div class="fx" aria-hidden="true">${fx}</div></div>`;
}
function qPrompt(q,done){
  const hint='';
  if(q.type==='def'){
    const d=q.t.def.charAt(0).toUpperCase()+q.t.def.slice(1)+(/[.?!)]$/.test(q.t.def)?'':'.');
    return `<div class="qprompt">Which word matches this meaning?</div><p class="qsent">${d}</p>${hint}`;
  }
  const sent=done?mark(q.t.ex,q.t.w,'<mark>$&</mark>'):mark(q.t.ex,q.t.w,'<span class="blank"></span>');
  return `<div class="qprompt">Choose the word that fits the blank</div><p class="qsent">${sent}</p>${hint}`;
}
function viewBattle(){
  const q=B.q,done=q.pick!==null,ok=done&&q.choices[q.pick].correct;
  const choices=q.choices.map((c,idx)=>{
    const gone=q.gone&&q.gone.includes(idx);const cls=done?(c.correct?'correct':idx===q.pick?'wrong':'dim'):(gone?'dim gone':'');
    return `<button class="choice ${cls}" data-act="pick" data-i="${idx}" ${done||gone?'disabled':''}><span class="key">${idx+1}</span>${c.o.w}</button>`;
  }).join('');
  const g=G();
  const lostIdx=(B.anim==='atk'&&!B.revived&&!B.iced)?B.php:-1;
  const finalHit=B.hp<=0;
  const extra=(ok&&B.noteMsg?' 📒+3 金幣':'')+(!ok&&B.healed?'　👹 怪物回復了 1 HP':'')+(!ok&&B.revived?'　🧪 復活藥水發動，回復愛心！':'');
  const locked=!ok&&Date.now()<B.lockUntil;
  const sheet=B.sheet?`<div class="sheet ${ok?'ok':'no'}"><div class="sheet-in"><h3>${ok?CHECK:CROSS}${ok?(finalHit?'最後一擊！':'打中了！'):'被反擊了！記住它'}<small class="xtra">${extra}</small></h3>${info(q.t,true)}
    <button class="btn block ${ok?'good':'bad'}" id="nextB" data-act="nextB" ${(locked||B.reading)?'disabled':''}>${B.reading?'🔊 Listening…':'Continue'}</button></div></div>`:'';
  const po=G().inv.potion,pobtn=(!E3.ok&&!done&&po>0&&B.php<B.pm)?`<button class="crystal" data-act="potion">🧪 用復活藥水（剩 ${po} 瓶）<small>回復 3 顆愛心</small></button>`:'';
  const cr=G().inv.crystal,crbtn=(!E3.ok&&!done&&cr>0&&!q.gone)?`<button class="crystal" data-act="crystal">🔮 用提示水晶（剩 ${cr} 顆）<small>去掉 2 個錯誤選項</small></button>`:'';
  return `<div class="btop"><button class="x" data-act="goGame" aria-label="離開戰鬥"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <span class="lvpill">Lv.${lvlOf(g.xp)}</span>${hearts(B.php,B.pm,lostIdx)}<span class="dayp" title="今日答對">🎯 ${Math.min(g.today,GOAL)}/${GOAL}</span></div>
  <div class="bgrid">${stageHTML(B,{live:true})}
  <div class="bq"><section class="qcard ${q.t.k}"><div class="tags"><span class="tag">${q.t.wk} · ${q.t.st}</span><span class="tag plain">${q.type==='def'?'Meaning':'Fill in the blank'}</span></div>${qPrompt(q,done)}</section>
  <div class="choices">${choices}</div>${crbtn}${pobtn}</div></div>${sheet}`;
}
function viewGame(){
  const g=G();rollDay();
  const lv=lvlOf(g.xp),a=xpAt(lv),b=xpAt(lv+1),pct=Math.round((g.xp-a)/(b-a)*100);
  const sn=streakNow(),gp=Math.min(100,Math.round(g.today/GOAL*100));
  const rtypes=[['stats','成長升級','多拿經驗，快點升級'],['cards','怪物卡片','收集 96 隻怪物'],['coins','金幣','買學習道具']];
  const lcard=s=>{
    const mid=SETMON[s.id],L=learned(s),done=!!g.def[s.id],st=starsOf(s.id);
    return `<button class="mcard ${s.k}${done?' done':''}" data-act="fight" data-id="${s.id}"><span class="mart">${monSvg(mid)}</span>${done?starsHTML(st,'cs'):''}<span class="mname">${monName(mid)}</span><span class="mles">${s.week.replace("Week ","W")} · ${s.title}</span>${isLearned(s.id)?`<span class="lbadge" data-act="learn" data-id="${s.id}">📖 複習單字</span>`:'<span class="lbadge new">📖 先學單字</span>'}</button>`;};
  const ecard=e=>{
    const open=eliteOpen(e),done=!!g.def[e.id],ok=e.sets.filter(s=>starsOf(s.id)>=2).length;
    return `<button class="mcard elitecard ${e.k}${open?'':' locked'}${done?' done':''}" data-act="elite" data-id="${e.id}" ${open?'':'disabled'}><span class="mart">${monSvg(e.mon)}</span>${done?starsHTML(starsOf(e.id),'cs'):''}<span class="mtier">精英</span><span class="mname">${monName(e.mon)}</span><span class="mles">${open?`W${e.week} 全週單字 · 10 題`:`W${e.week} 精英怪`}</span><span class="mnum">${open?(done?'再挑戰一次':'本週課文已通過 ✓'):`🔒 本週課文 2★以上 ${ok}/${e.sets.length}`}</span></button>`;};
  const bcard=b=>{
    const open=bossOpen(b),done=!!g.def[b.id],ok=b.elites.filter(id=>starsOf(id)>=2).length,wl=b.weeks.map(w=>'W'+w).join('–');
    return `<button class="mcard bosscard ${open?'':'locked'}${done?' done':''}" data-act="boss" data-id="${b.id}" ${open?'':'disabled'}><span class="mart">${monSvg(b.mon)}</span>${done?starsHTML(starsOf(b.id),'cs'):''}<span class="mtier boss">魔王</span><span class="mname">${monName(b.mon)}</span><span class="mles">${open?`${wl} 兩週單字 · 14 題`:`${wl} 魔王`}</span><span class="mnum">${open?(done?'再挑戰一次':'兩位精英都已通過 ✓'):`🔒 精英怪 2★以上 ${ok}/${b.elites.length}`}</span></button>`;};
  let cards='';
  WEEKS.forEach((w,wi)=>{
    const e=ELITES[wi];
    cards+=`<h3 class="weekh">Week ${w}</h3><div class="mgrid">${SETS.filter(s=>wkNum(s)===w).map(lcard).join('')}${ecard(e)}</div>`;
    if(wi%2===1||wi===WEEKS.length-1){const b=BOSSES[Math.floor(wi/2)];cards+=`<div class="mgrid bossrow">${bcard(b)}</div>`;}
  });
  const rev=store.missed.length?`<button class="mcard revcard" data-act="revenge"><span class="mart">👻</span><span class="mname">復仇怪</span><span class="mles">答錯的單字變成怪物回來了</span><span class="mnum">${store.missed.length} 個字等你復仇</span></button>`:'';
  return `<div class="ghead"><div class="gtitle"><span class="glogo">⚔️</span><div><b>單字打怪王</b><span>答對攻擊、答錯被反擊</span></div></div>
    <div class="gnav"><button class="link" data-act="snd" aria-label="音效">${g.snd?'🔊 音效':'🔇 靜音'}</button><button class="link" data-act="practice">練習模式</button></div></div>
  <section class="card gplayer"><div class="prow"><div class="heroav"><div class="heroimg">${heroImg()}</div><div class="lvbadge sm">Lv.${lv}</div></div>
    <div class="pinfo"><div class="xprow"><b>經驗值</b><span>${g.xp-a}/${b-a}</span></div><div class="gtrack"><i style="width:${pct}%"></i></div>
    <div class="pstats"><span>${HEART.replace('%c','')} ${pmax()}</span><span>📚 學會 ${learnedTotal()}/${ALL.length} 字</span><span>🪙 ${g.coins}</span>${g.inv.potion?`<span>🧪 ${g.inv.potion}</span>`:''}${g.inv.crystal?`<span>🔮 ${g.inv.crystal}</span>`:''}<span>🔥 連續 ${sn} 天</span></div></div></div>
    <div class="daily"><div class="xprow"><b>🎯 今日目標：答對 ${GOAL} 題</b><span>${Math.min(g.today,GOAL)}/${GOAL}${g.today>=GOAL?' ✓':''}</span></div><div class="gtrack d"><i style="width:${gp}%"></i></div></div>
    <div class="rsel"><div class="xprow"><b>🎁 額外寶箱獎勵</b></div><div class="seg s3">${rtypes.map(r=>`<button data-act="setReward" data-r="${r[0]}" aria-pressed="${g.reward===r[0]}">${r[1]}<small>${r[2]}</small></button>`).join('')}</div></div>
    <div class="btnrow"><button class="btn" data-act="coll">📖 怪物圖鑑</button><button class="btn" data-act="heroes">🦸 更換主角</button><button class="btn" data-act="shop">🛒 道具商店</button></div></section>
  <section class="mapsec"><div class="sec-h"><h2>選一隻怪物開打</h2></div>${rev?`<div class="mgrid">${rev}</div>`:''}<p class="soft">每週：打完全部課文（2★以上）→ 挑戰精英怪；每兩週：兩位精英都通過 → 挑戰魔王。</p>${cards}</section>`;
}
function viewReward(){
  const r=B.res,bn=r.bonus;let rv='';
  if(!bn)rv=`<div class="reveal"><p class="soft">這次只拿到 1 顆星，沒有寶箱，也還沒收服牠。<br>看清楚題目、少答錯，拿到 2 顆星以上就能收服！</p></div>`;
  else if(!B.opened)rv=`<button class="chest" data-act="openChest" aria-label="打開寶箱">🎁<span>點一下，打開寶箱！</span></button>`;
  else if(bn.t==='xp')rv=`<div class="reveal"><div class="rbig">✨ +${bn.v}</div><p>額外經驗值！</p></div>`;
  else if(bn.t==='coins')rv=`<div class="reveal"><div class="rbig">🪙 +${bn.v}</div><p>${bn.lucky?'幸運加倍！':'額外金幣！'}</p></div>`;
  else rv=`<div class="reveal">${rtile(bn.id,true,bn.n,true)}<p>${bn.isNew?'新怪物加入圖鑑！':'重複的卡片 ×'+bn.n}</p></div>`;
  const wr=B.wrong.length?`<div class="wrongbox"><b>這次答錯的字，會變成復仇怪回來：</b><div class="chips">${B.wrong.map(w=>`<span>${w.w}</span>`).join('')}</div></div>`:'';
  const cap=r.gotMon?`<div class="lvup goal">📖 收服了 ${B.name}！${r.newMon?'新怪物加入圖鑑':'圖鑑 ×'+r.monN}</div>`:'';
  return `<div class="rview"><div class="rleft">${stageHTML(B,{beaten:true,noHp:true,noHero:true})}</div>
   <div class="rright"><h1>打倒了 ${B.name}！</h1>
   <div class="rstars">${starsHTML(r.stars,'big')}<small>答對 ${B.right} 題・答錯 ${B.wrongN} 題</small></div>
   ${r.lvUp?`<div class="lvup">🎉 升級了！Lv.${r.lv}</div>`:''}
   ${cap}
   ${B.goalMsg?`<div class="lvup goal">🎯 ${B.goalMsg}</div>`:''}
   <div class="rrows"><div><span>⭐ 經驗值</span><b>+${B.right*5}</b></div><div><span>⭐ 勝利獎勵</span><b>+${r.xp}</b></div><div><span>🪙 金幣</span><b>+${r.coins}</b></div></div>
   <div class="chestbox">${rv}</div>${wr}
   <div class="btnrow"><button class="btn primary" data-act="again2">再戰一次</button><button class="btn" data-act="goGame">回到地圖</button></div></div></div>`;
}
function viewDefeat(){
  const g=G(),wl=B.wrong.map(w=>`<div class="wrow ${w.k}">${info(w,true)}</div>`).join('');
  return `<div class="rview"><div class="rleft">${stageHTML(B,{noHp:true})}</div>
   <div class="rright"><h1>先休息一下吧！</h1><p class="soft">${B.name} 這次比較強，沒關係，你的等級不會減少。答對的 ${B.right} 題已經幫你存下經驗值了。</p>
   <div class="wrongbox"><b>看一下這些字，再挑戰一次：</b></div><div class="wrows">${wl}</div>
   <div class="btnrow"><button class="btn primary" data-act="again2">再挑戰</button><button class="btn" data-act="goGame">回到地圖</button></div></div></div>`;
}
function rtile(id,own,cnt,big){
  const m=MBY[id],T=TYPES.find(t=>t[0]===m.t),tier=TIERN[m.role]||'普通';
  return `<div class="rt${own?'':' locked'}${big?' big':''} role-${m.role}" style="--c1:${T[3]};--c2:${T[4]}"><span class="rtt">${T[2]} ${T[1]}</span><div class="rtart">${own?`<img alt="" src="${RSPR[id].u}">`:'<span class="rtq">？</span>'}</div><div class="rtn">${own?m.zh:'？？？'}</div><div class="rtb ${m.role}">${tier}</div>${cnt>1?`<span class="rtx">×${cnt}</span>`:''}</div>`;
}
function viewColl(){
  const g=G(),tab=S.cdx||'all';
  const have=RMON.filter(m=>g.rcards[m.id]).length,total=RMON.length;
  const TIERT=[['tn','普通',m=>m.role==='n'||m.role==='x'],['te','精英',m=>m.role==='e'],['tb','魔王',m=>m.role==='b'],['tr','稀有',m=>m.role==='r']];
  const own=m=>!!g.rcards[m.id];
  const tabs=[['all','全部',null]].concat(TIERT).concat(TYPES.map(t=>[t[0],t[2]+' '+t[1],m=>m.t===t[0]])).map(t=>{
    const n=t[2]?` ${RMON.filter(m=>t[2](m)&&own(m)).length}/${RMON.filter(t[2]).length}`:'';
    return `<button class="ctab" data-act="cdx" data-t="${t[0]}" aria-pressed="${tab===t[0]}">${t[1]}<small>${n}</small></button>`;}).join('');
  let html='';
  const tt=TIERT.find(t=>t[0]===tab);
  if(tt){const list=RMON.filter(tt[2]);html+=`<h3 class="chd">${tt[1]} <small>${list.filter(own).length}/${list.length}</small></h3><div class="rgrid2">${list.map(m=>rtile(m.id,own(m),g.rcards[m.id]||0)).join('')}</div>`;}
  else TYPES.filter(t=>tab==='all'||tab===t[0]).forEach(t=>{
    const list=RMON.filter(m=>m.t===t[0]);
    html+=`<h3 class="chd">${t[2]} ${t[1]} <small>${list.filter(own).length}/${list.length}</small></h3><div class="rgrid2">${list.map(m=>rtile(m.id,own(m),g.rcards[m.id]||0)).join('')}</div>`;
  });
  return `<div class="cview2 codex"><div class="btop"><button class="x" data-act="goGame" aria-label="返回"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><h2 class="vt">怪物圖鑑</h2><span class="lvpill">${have}/${total}</span></div>
  <p class="soft">打贏怪物並拿到 2 顆星以上，就會收服牠；沒打到的怪物，可以從寶箱抽到。精英怪和魔王要先通過前面的課文。</p>
  <div class="ctabs" role="tablist">${tabs}</div>${html}</div>`;
}
function viewHeroes(){
  const g=G();
  const cards=HEROES.map(h=>{const on=g.heroId===h.id;
    return `<button class="hcard${on?' on':''}" data-act="pickHero" data-id="${h.id}" aria-pressed="${on}"><span class="himgw"><img alt="" src="${HSPR[h.id].u}"></span><b>${h.zh}</b><small>${h.en}</small><span class="job">${h.job}</span><span class="hdesc">${h.desc}</span>${on?'<span class="hon">✓ 使用中</span>':'<span class="hpick">選他</span>'}</button>`;}).join('');
  const cur=HEROES.find(h=>h.id===g.heroId);
  return `<div class="cview2 heroesv"><div class="btop"><button class="x" data-act="goGame" aria-label="返回"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><h2 class="vt">更換主角</h2><span class="lvpill">${cur.zh}</span></div>
  <p class="soft">選一位夥伴一起打怪！換了以後，首頁和戰鬥畫面都會是他。</p><div class="hgrid">${cards}</div></div>`;
}
function viewShop(){
  const g=G(),n=learnedTotal();
  const note=g.cosRefund?`<p class="soft refnote">換裝功能已經改成「更換主角」，之前買的造型已把 🪙 ${g.cosRefund} 金幣退還給你。</p>`:'';
  if(g.cosRefund){g.cosRefund=0;saveStore();}
  const tools=TOOLS.map(t=>{const have=t.stack?(g.inv[t.id]||0):(g.inv[t.id]?1:0),max=!t.stack&&have,can=g.coins>=t.price&&!max;
    return `<div class="gear ${max?'own':''}"><span class="gi">${t.icon}</span><div><b>${t.name}${t.stack?` <span class="have">擁有 ${have}</span>`:''}</b><small class="nx">${t.desc}</small></div>${max?'<span class="owned">已擁有</span>':`<button class="btn ${can?'primary':''}" data-act="tool" data-id="${t.id}" ${can?'':'disabled'}>購買<br>🪙 ${t.price}</button>`}</div>`;}).join('');
  return `<div class="cview2 shopv"><div class="btop"><button class="x" data-act="goGame" aria-label="返回"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><h2 class="vt">道具商店</h2><span class="lvpill">🪙 ${g.coins}</span></div>
  ${note}<div class="shopgrid"><div class="preview"><div class="pvhero">${heroImg()}</div><p class="soft">答對題目、打倒怪物都能賺金幣！<br>目前學會 <b>${n}</b> / ${ALL.length} 字</p><button class="btn" data-act="heroes">🦸 更換主角</button></div>
  <div class="shopright"><section class="cs"><h3>學習道具</h3><div class="gears">${tools}</div></section></div></div></div>`;
}
function afterGameRender(){
  if(S.view==='battle'&&B){
    if(E3.ok){const sl=app.querySelector('.c3d');if(sl)ENG.mount(sl);}
    const bar=document.getElementById('mhpbar');
    if(bar){const target=Math.round(Math.max(0,B.hp)/B.maxhp*100);
      if(B.anim!=='spell'&&B.shown!==B.hp){const tk=B;setTimeout(()=>{if(B===tk&&bar.isConnected){bar.style.width=target+'%';const tx=document.getElementById('mhptxt');if(tx)tx.textContent='💀 '+Math.max(0,tk.hp)+'/'+tk.maxhp;}},B.anim==='hit'||B.anim==='crit'?(E3.ok?300:380):40);B.shown=B.hp;}}
    if(B.sheet){const nx=document.getElementById('nextB');if(nx)nx.focus({preventScroll:true});}
  }
}

/*GAMEEND*/








app.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
  const a=b.dataset.act;
  switch(a){
    case 'say':say(b.dataset.w);break;
    case 'toggle':{const id=b.dataset.id;S.sel.has(id)?S.sel.delete(id):S.sel.add(id);render();break;}
    case 'all':S.sel=new Set(SETS.map(s=>s.id).concat(store.missed.length?['missed']:[]));render();break;
    case 'none':S.sel=new Set();render();break;
    case 'count':S.count=Number(b.dataset.n);render();break;
    case 'startQuiz':{const p=poolFromSel();if(p.length)startQuiz(p,S.count);break;}
    case 'startCards':if(poolFromSel().length)startCards();break;
    case 'home':S.view='home';render();top();break;
    case 'pick':S.view==='battle'?answerB(Number(b.dataset.i)):answer(Number(b.dataset.i));break;
    case 'hint':if(S.view==='battle')B.q.hint=true;else S.quiz.qs[S.quiz.i].hint=true;render();break;
    case 'goGame':try{speechSynthesis.cancel();}catch(e){}B=null;S.view='game';render();top();break;
    case 'practice':S.view='home';render();top();break;
    case 'fight':ac();SFX.tap();isLearned(b.dataset.id)?startBattle('set',b.dataset.id):startLearn(b.dataset.id);break;
    case 'learn':ac();SFX.tap();startLearn(b.dataset.id);break;
    case 'lnext':ac();SFX.tap();if(S.learn&&S.learn.i<S.learn.words.length-1){S.learn.i++;render();top();learnSpeak();}break;
    case 'lprev':ac();SFX.tap();if(S.learn&&S.learn.i>0){S.learn.i--;render();top();learnSpeak();}break;
    case 'lreplay':ac();SFX.tap();learnSpeak();break;
    case 'ldone':{ac();SFX.tap();const id=S.learn&&S.learn.id;if(!id)break;if(!isLearned(id)&&!S.learn.words.every((_,k)=>S.learn.heard[k]))break;try{if(HAS_TTS)speechSynthesis.cancel();}catch(e){}const g=G();g.learned[id]=1;saveStore();startBattle('set',id);break;}
    case 'boss':ac();SFX.tap();startBattle('boss',b.dataset.id);break;
    case 'elite':ac();SFX.tap();startBattle('elite',b.dataset.id);break;
    case 'revenge':ac();SFX.tap();startBattle('revenge');break;
    case 'nextB':nextB();break;
    case 'again2':ac();if(B)startBattle(B.kind,B.id);break;
    case 'openChest':if(B&&!B.opened){B.opened=true;render();SFX.open();}break;
    case 'setReward':G().reward=b.dataset.r;saveStore();SFX.tap();render();break;
    case 'snd':{const g=G();g.snd=!g.snd;saveStore();ac();SFX.tap();render();break;}
    case 'coll':S.view='coll';render();top();break;
    case 'heroes':S.view='heroes';render();top();break;
    case 'pickHero':G().heroId=b.dataset.id;saveStore();SFX.tap();render();break;
    case 'cdx':S.cdx=b.dataset.t;render();break;
    case 'shop':S.view='shop';render();top();break;
    case 'citem':{const g=G(),slot=b.dataset.s,it=COSM[slot].find(x=>x.id===b.dataset.id);if(!it)break;
      if(owns(slot,it)){g.eq[slot]=(g.eq[slot]===it.id&&slot!=='outfit')?'':it.id;SFX.tap();}
      else if(learnedTotal()>=it.req&&g.coins>=it.price){g.coins-=it.price;g.own.push(slot+':'+it.id);g.eq[slot]=it.id;SFX.open();}
      saveStore();render();break;}
    case 'tool':{const g=G(),t=TOOLS.find(x=>x.id===b.dataset.id);if(t&&g.coins>=t.price&&(t.stack||!g.inv[t.id])){g.coins-=t.price;g.inv[t.id]=(g.inv[t.id]||0)+1;saveStore();SFX.coin();render();}break;}
    case 'potion':{const g=G();if(S.view!=='battle'||!B||B.busy||!B.q||B.q.pick!==null||(g.inv.potion||0)<1||B.php>=B.pm)break;
      g.inv.potion--;B.php=Math.min(B.pm,B.php+3);saveStore();SFX.open();render();break;}
    case 'crystal':{const q=B&&B.q;if(!q||q.pick!==null||q.gone)break;const g=G();if(g.inv.crystal<1)break;
      g.inv.crystal--;const wrong=q.choices.map((c,i)=>c.correct?-1:i).filter(i=>i>=0);q.gone=shuffle(wrong).slice(0,2);saveStore();SFX.open();render();break;}
    case 'next':next();break;
    case 'again':{const all=poolFromSel();startQuiz(all.length?all:S.quiz.qs.map(q=>q.t),S.count);break;}
    case 'retryWrong':startQuiz(S.quiz.wrong.slice(),0);break;
    case 'flip':flipCard();break;
    case 'known':S.deck.i++;S.deck.flip=false;render();top();break;
    case 'unsure':{const o=S.deck.cards[S.deck.i];S.deck.review.push(o);addMissed(o.w);S.deck.i++;S.deck.flip=false;render();top();break;}
    case 'quizReview':startQuiz(S.deck.review.slice(),0);break;
  }
});
document.addEventListener('keydown',e=>{
  if(S.view==='battle'&&B&&B.q.pick===null&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&/^[1-4]$/.test(e.key)){answerB(Number(e.key)-1);return;}
  if(S.view!=='quiz'||e.ctrlKey||e.metaKey||e.altKey)return;
  const q=S.quiz.qs[S.quiz.i];
  if(q.pick===null&&/^[1-4]$/.test(e.key))answer(Number(e.key)-1);
});
render();
})();
