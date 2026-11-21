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
  const gv=['game','battle','reward','defeat','coll','shop','heroes','learn','test'].includes(S.view);
  app.className='wrap'+(S.view==='home'?' pad-dock':(S.view==='quiz'&&S.quiz.qs[S.quiz.i].pick!==null?' pad-sheet':''))+(gv?' gm':'')+(S.view==='battle'?' bat':'')+(S.view==='battle'&&B&&B.anim==='atk'?' shake':'')+(S.view==='battle'&&E3.ok?' c3on':'');
  app.innerHTML=S.view==='game'?viewGame():S.view==='battle'?viewBattle():S.view==='reward'?viewReward():S.view==='defeat'?viewDefeat():S.view==='coll'?viewColl():S.view==='shop'?viewShop():S.view==='heroes'?viewHeroes():S.view==='learn'?viewLearn():S.view==='test'?viewTest():S.view==='home'?viewHome():S.view==='quiz'?viewQuiz():S.view==='result'?viewResult():viewCards();
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
const MBY={};RMON.forEach(m=>{MBY[m.id]=m;});if(typeof VMON!=='undefined')VMON.forEach(m=>{MBY[m.id]=m;});   // revenge monsters (V01-V04) are looked up like the others but are not in RMON (not collectable)
const SETMON={};SETS.forEach((s,i)=>{SETMON[s.id]=MPLAN.normal[i%MPLAN.normal.length];});
const MON_IDS=MPLAN.normal.slice();
const wkNum=s=>parseInt(s.week.replace(/\D/g,''),10);
const WEEKS=[...new Set(SETS.map(wkNum))].sort((a,b)=>a-b);
const ELITES=WEEKS.map((w,i)=>{const ss=SETS.filter(s=>wkNum(s)===w);return{id:'e'+w,kind:'elite',week:w,mon:MPLAN.elite[i%MPLAN.elite.length],sets:ss,k:ss[0].k};});
const BOSSES=[];for(let i=0;i<WEEKS.length;i+=2){const ws=WEEKS.slice(i,i+2),ss=SETS.filter(s=>ws.includes(wkNum(s)));BOSSES.push({id:'b'+(i/2),kind:'boss',weeks:ws,mon:MPLAN.boss[(i/2)%MPLAN.boss.length],elites:ws.map(w=>'e'+w),sets:ss,k:ss[0].k});}
const BATTLE={};SETS.forEach(s=>{BATTLE[s.id]=s;});ELITES.concat(BOSSES).forEach(b=>{BATTLE[b.id]=b;});
function monSprite(id){return (typeof MSPR!=='undefined'&&MSPR[id])||RSPR[id]||(typeof VSPR!=='undefined'&&VSPR[id])||null;}
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
function projOf(id){const m=MBY[id]||(typeof LMON!=='undefined'&&LMON.find(x=>x.id===id));const T=m&&TYPES.find(t=>t[0]===m.t);return (T&&T[2])||'💥';}
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
// every sound goes through one master chain: soft low-pass (no harsh highs), a compressor (many layers at once never clip
// into a "broken speaker" crackle) and a little room reverb for body
let BUS=null;
function bus(a){if(BUS&&BUS.ctx===a)return BUS.in;try{const inp=a.createGain(),lp=a.createBiquadFilter(),cmp=a.createDynamicsCompressor(),out=a.createGain(),cv=a.createConvolver(),wet=a.createGain(),len=Math.floor(a.sampleRate*1.8),ir=a.createBuffer(2,len,a.sampleRate);
  for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2);}cv.buffer=ir;
  inp.gain.value=.62;lp.type='lowpass';lp.frequency.value=5200;lp.Q.value=.5;cmp.threshold.value=-20;cmp.knee.value=12;cmp.ratio.value=8;cmp.attack.value=.004;cmp.release.value=.3;out.gain.value=.95;wet.gain.value=.2;
  inp.connect(lp);lp.connect(cmp);lp.connect(cv);cv.connect(wet);wet.connect(cmp);cmp.connect(out);out.connect(a.destination);BUS={ctx:a,in:inp};return inp;}catch(e){return a.destination;}}
function tone(f,d,type,t0,vol,slide){
  if(!G().snd)return;const a=ac();if(!a)return;
  try{
    const o=a.createOscillator(),gn=a.createGain(),t=a.currentTime+(t0||0);
    o.type=type||'sine';o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);
    gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol||.12,t+.015);gn.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(gn);gn.connect(bus(a));o.start(t);o.stop(t+d+.02);
  }catch(e){}
}
// filtered white noise: whooshes, crackles, splashes, thumps (f0 -> f1 = filter sweep)
let NBUF=null;
function noise(d,t0,vol,f0,f1,q,kind){
  if(!G().snd)return;const a=ac();if(!a)return;
  try{
    if(!NBUF){NBUF=a.createBuffer(1,a.sampleRate,a.sampleRate);const c=NBUF.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1;}
    const s=a.createBufferSource(),fl=a.createBiquadFilter(),gn=a.createGain(),t=a.currentTime+(t0||0);
    s.buffer=NBUF;s.loop=true;fl.type=kind||'bandpass';fl.Q.value=q||1;fl.frequency.setValueAtTime(f0,t);if(f1)fl.frequency.exponentialRampToValueAtTime(f1,t+d);
    gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol||.15,t+Math.min(.06,d/3));gn.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(fl);fl.connect(gn);gn.connect(bus(a));s.start(t,Math.random()*.5);s.stop(t+d+.05);
  }catch(e){}
}
// roar: rough saw + noise shaped by "aah" formant band-passes (650/1100/2400 Hz), low end cut, fast tremolo for grit.
// (a low saw through a low-pass sounded like a fart; formants make it read as a beast's voice)
function roar(d,t0,vol,f){
  if(!G().snd)return;const a=ac();if(!a)return;
  try{const t=a.currentTime+(t0||0),hp=a.createBiquadFilter(),out=a.createGain(),trem=a.createGain(),lfo=a.createOscillator(),lg=a.createGain();
    hp.type='highpass';hp.frequency.value=180;
    out.gain.setValueAtTime(.0001,t);out.gain.exponentialRampToValueAtTime(vol,t+.12);out.gain.setValueAtTime(vol,t+d*.6);out.gain.exponentialRampToValueAtTime(.0001,t+d);
    trem.gain.value=.75;lfo.frequency.value=27;lg.gain.value=.25;lfo.connect(lg);lg.connect(trem.gain);
    [[650,5,1],[1100,6,.8],[2400,8,.35]].forEach(fm=>{const bp=a.createBiquadFilter(),gg=a.createGain();bp.type='bandpass';bp.frequency.value=fm[0];bp.Q.value=fm[1];gg.gain.value=fm[2];hp.connect(bp);bp.connect(gg);gg.connect(trem);});
    [0,-14].forEach(c=>{const o=a.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f*1.15,t);o.frequency.exponentialRampToValueAtTime(f*1.3,t+d*.25);o.frequency.exponentialRampToValueAtTime(f*.75,t+d);o.detune.value=c;o.connect(hp);o.start(t);o.stop(t+d+.05);});
    if(!NBUF){NBUF=a.createBuffer(1,a.sampleRate,a.sampleRate);const cc=NBUF.getChannelData(0);for(let i=0;i<cc.length;i++)cc[i]=Math.random()*2-1;}
    const ns=a.createBufferSource(),ng=a.createGain();ns.buffer=NBUF;ns.loop=true;ng.gain.value=.5;ns.connect(ng);ng.connect(hp);ns.start(t,Math.random()*.5);ns.stop(t+d+.05);
    trem.connect(out);out.connect(bus(a));lfo.start(t);lfo.stop(t+d+.05);
  }catch(e){}
}
// monster attacks: one launch sound per element type (played when the projectile leaves the monster)
const MATK={
  // fire: a soft "fwoosh" that swells (band-pass noise sweeping up), a warm low body, and crackling embers on top
  fire(){noise(.14,0,.26,2400,300,.7,'lowpass');noise(.85,.03,.34,450,1700,.55);noise(.8,.05,.2,260,0,.7,'lowpass');for(let i=0;i<12;i++)noise(.022,.1+Math.random()*.6,.15,3000+Math.random()*3500,0,3,'highpass');},
  ice(){[1760,2093,2637].forEach((f,i)=>tone(f,.18,'triangle',i*.12,.07,-200));noise(.35,0,.06,5000,8000,2,'highpass');},
  elec(){for(let i=0;i<7;i++)tone(300+Math.random()*1500,.04,'square',i*.035,.06);noise(.3,0,.12,3000,1500,.7);},
  poison(){[300,420,260,380].forEach((f,i)=>tone(f,.12,'sine',i*.09,.09,160));},
  forest(){noise(.55,0,.12,1200,2600,1.5);tone(220,.3,'triangle',.05,.05,60);},
  sea(){noise(.7,0,.2,400,1800,.7,'lowpass');tone(140,.5,'sine',0,.06,-40);},
  desert(){noise(.55,0,.2,250,120,.9,'lowpass');tone(70,.5,'sine',0,.1,-20);},
  sky(){noise(.5,0,.16,800,3200,1.2);},
  ghost(){tone(520,.6,'sine',0,.07,-260);tone(530,.6,'sine',.02,.05,-280);},
  mech(){[880,660,880].forEach((f,i)=>tone(f,.07,'square',i*.08,.06));noise(.35,.2,.12,2000,500,1);},
  skel(){[1,2,3].forEach(i=>{tone(900,.03,'square',i*.09,.07,-500);noise(.04,i*.09,.1,2500,0,3);});},
  // dragon: a growling roar that rises then drops, followed by the rush of its fire breath and a few crackles
  dragon(){tone(240,.42,'sine',0,.05,700);roar(.95,.12,.22,210);noise(.6,.47,.3,450,2800,.6);noise(.6,.5,.16,250,0,.7,'lowpass');for(let i=0;i<8;i++)noise(.022,.55+Math.random()*.45,.12,3000+Math.random()*3000,0,3,'highpass');}
};
// ===== special-move sounds: heavy and layered (distorted sub-bass booms, risers, roars, element layers) =====
function sub(t0,vol,f0,f1,d){if(!G().snd)return;const a=ac();if(!a)return;
  try{const t=a.currentTime+(t0||0),g=a.createGain(),lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=420;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    [[1,'sine',1],[2,'triangle',.35]].forEach(([m,ty,v])=>{const o=a.createOscillator(),og=a.createGain();o.type=ty;o.frequency.setValueAtTime(f0*m,t);o.frequency.exponentialRampToValueAtTime(f1*m,t+d);og.gain.value=v;o.connect(og);og.connect(lp);o.start(t);o.stop(t+d+.05);});
    lp.connect(g);g.connect(bus(a));}catch(e){}}
function bigBoom(t0,k){sub(t0,.5*k,110,38,1.3*k);tone(160,.35,'sine',t0,.22*k,-90);noise(1.4*k,t0,.3*k,900,70,.5,'lowpass');noise(.25,t0,.18*k,1800,300,.6,'lowpass');}
const UEL={
  fire(){noise(1.2,0,.3,180,900,.6,'lowpass');noise(1.0,.05,.22,300,700,.8);for(let i=0;i<8;i++)noise(.05,Math.random()*.8,.06,1400+Math.random()*800,0,2);},
  dragon(){roar(1.0,0,.2,130);noise(1.1,.2,.28,200,900,.6,'lowpass');sub(0,.3,80,40,1);},
  ice(){[784,988,1175,1319].forEach((f,i)=>tone(f,.5,'sine',i*.06,.05,-120));noise(.6,0,.16,2200,900,1,'lowpass');noise(.4,0,.2,500,150,.7,'lowpass');},
  elec(){noise(.25,0,.35,2600,600,.6,'lowpass');noise(1.6,.05,.32,500,60,.6,'lowpass');sub(.02,.3,70,35,1.2);},
  forest(){noise(.9,0,.24,300,1200,1);tone(98,.7,'triangle',0,.14,-30);noise(.6,.2,.12,700,300,2);sub(0,.2,70,40,.6);},
  poison(){for(let i=0;i<8;i++)tone(180+Math.random()*220,.18,'sine',i*.07,.08,120);noise(.9,0,.14,600,1400,1.2);},
  sea(){noise(1.6,0,.36,180,1200,.6,'lowpass');noise(1.2,.3,.18,900,300,.7,'lowpass');sub(0,.28,80,38,1);},
  desert(){noise(1.4,0,.34,160,70,.7,'lowpass');noise(1.2,0,.12,900,500,1.2);sub(0,.3,65,32,1.1);},
  sky(){noise(1.4,0,.3,300,1200,2.5);noise(1.2,.2,.2,800,250,2.5);},
  mech(){tone(700,.45,'triangle',0,.12,-560);tone(350,.45,'sine',.02,.12,-260);noise(.4,.05,.26,1200,200,.7,'lowpass');},
  ghost(){[0,5,-7].forEach((c,i)=>tone(330+c*5,1.1,'sine',i*.06,.08,-140));noise(1.1,0,.14,900,200,1.5,'lowpass');},
  skel(){for(let i=0;i<8;i++)noise(.06,i*.06,.14,1100+Math.random()*400,0,4);noise(.4,.5,.24,600,120,.8,'lowpass');}
};
const SFX={
  // special moves: charge-up (longer and heavier per tier), roar, element layer, the final hit
  uCharge(tier){const k=tier==='L'?1.4:tier==='b'?1.1:.8,d=tier==='L'?2.0:tier==='b'?1.2:.6;noise(d,0,.14*k,150,1600,1.5);tone(65,d,'triangle',0,.1*k,140);sub(0,.24*k,40,85,d);
    if(tier==='L'){noise(2.0,0,.25,120,90,.7,'lowpass');for(let i=0;i<6;i++)sub(i*.33,.18,60,35,.3);}},
  uRoar(tier){const k=tier==='L'?1.4:1;roar(1.1*k,0,.2*k,120);sub(0,.42*k,95,36,1.1*k);noise(.9*k,0,.2*k,420,120,.7,'lowpass');},
  uEl(t){(UEL[t]||UEL.fire)();},
  uBeep(){tone(880,.1,'sine',0,.08);},
  uHit(t,tier){const k=tier==='L'?1.3:tier==='b'?1.05:.8;bigBoom(0,k);(UEL[t]||UEL.fire)();if(tier==='L'){bigBoom(.22,.8);noise(2.4,.1,.2,500,50,.6,'lowpass');}},
  hit(){tone(620,.09,'square',0,.1,-300);tone(330,.14,'square',.07,.1,-150);},
  matk(t){(MATK[t]||MATK.fire)();},
  // the monster's attack lands on the hero (small = one of several projectiles)
  impact(small){tone(small?160:130,small?.12:.22,'sine',0,small?.12:.2,-80);noise(small?.1:.18,0,small?.1:.18,small?1400:900,300,.8,'lowpass');},
  // answer was wrong: short "uh-oh" right on the tap; the hit sound comes when the attack lands
  wrong(){tone(330,.11,'triangle',0,.09);tone(247,.18,'triangle',.11,.09);},
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
  {id:'note',icon:'📒',name:'單字筆記',desc:'答錯的字，之後再答對就多得 3 金幣（買一次永久有效）',price:60,stack:false},
  {id:'finisher',icon:'🌌',name:'終極卷軸',desc:'下一次大絕招變成主角的「終極絕招」：每位主角都不一樣，威力更強（怪物 -4 HP，可以買很多張）',price:80,stack:true}
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
const SFS=`precision mediump float;varying vec2 vUV;uniform sampler2D uTex;uniform float uA;uniform vec4 uF;uniform vec4 uL;uniform vec3 uLC;uniform vec2 uLd;
void main(){vec4 t=texture2D(uTex,vUV);vec3 c=t.rgb;
 if(uL.a>0.){float ao=mix(.7,1.06,smoothstep(0.,.5,vUV.y));float n=texture2D(uTex,vUV+uLd).a,n2=texture2D(uTex,vUV+uLd*2.2).a;float rim=clamp(t.a-(n+n2)*.5,0.,1.);
  float sh=clamp(t.a-texture2D(uTex,vUV-uLd*2.).a,0.,1.);c=c*mix(vec3(1.),uL.rgb,uL.a)*ao*(1.-sh*.25*uL.a)+uLC*rim*uL.a*1.5;}
 gl_FragColor=vec4(mix(c,uF.rgb,uF.a),t.a*uA);}`;
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
  const t=gl.createTexture();t.rgb=rgb;gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
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
function emojiTex(e){if(E.tex[e])return E.tex[e];const _t=emojiTex0(e);_t.vx=e==='🔥'?'fire':e==='❄️'?'snow':e==='⚡'?'bolt':null;_t.pr=PMAP[e]||null;return E.tex[e]=_t;}
function emojiTex0(e){const c=cv(160,160),x=c.getContext('2d');x.font='110px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e,80,88);return E.tex[e]=mkTex(c);}
// soft sparkle instead of a hard outlined star: glowing core, thin 4-point rays, faint diagonal rays
function sparkle(rgb){const c=cv(128,128),x=c.getContext('2d'),C=rgb.join(',');x.translate(64,64);
  const g=x.createRadialGradient(0,0,0,0,0,40);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba('+C+',.9)');g.addColorStop(1,'rgba('+C+',0)');x.fillStyle=g;x.beginPath();x.arc(0,0,40,0,2*PI);x.fill();
  const ray=(len,w,a)=>{x.save();x.rotate(a);const r=x.createLinearGradient(0,-len,0,len);r.addColorStop(0,'rgba('+C+',0)');r.addColorStop(.5,'rgba(255,255,255,.95)');r.addColorStop(1,'rgba('+C+',0)');x.fillStyle=r;x.beginPath();x.moveTo(0,-len);x.quadraticCurveTo(w,0,0,len);x.quadraticCurveTo(-w,0,0,-len);x.fill();x.restore();};
  ray(62,7,0);ray(62,7,PI/2);ray(34,4,PI/4);ray(34,4,-PI/4);return c;}
function starTex(){if(E.tex.star)return E.tex.star;return E.tex.star=mkTexA(sparkle([255,214,100]),[255,214,100]);}
const LCOL=['#FF6B6B','#FFB020','#4ECB71','#4DA6FF','#B26BFF','#FF7BC0'];
function letterTex(ch,i){const k='L'+ch+i;if(E.tex[k])return E.tex[k];const c=cv(160,160),x=c.getContext('2d');x.font='800 120px "Fredoka","Noto Sans TC","Arial Black",Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
  x.lineWidth=26;x.strokeStyle='#2A2142';x.strokeText(ch,80,86);x.lineWidth=14;x.strokeStyle='#FFFFFF';x.strokeText(ch,80,86);x.fillStyle=LCOL[i%LCOL.length];x.fillText(ch,80,86);return E.tex[k]=mkTex(c);}
/* ---- init ---- */

// ---- painted scenery: soft hand-painted look (gradients, brush dabs, atmospheric depth) instead of flat primitives ----
const DECOR_ASP={tree:[.667,1.6],bush:[1.333,.75],flowers:[2.286,.42],rock:[1.5,.62]};   // [width/height, height per size unit]
function scenery(){
  if(E.tex.backdrop)return;
  let sd=11;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
  const lin=(x,y0,y1,st)=>{const g=x.createLinearGradient(0,y0,0,y1);st.forEach(q=>g.addColorStop(q[0],q[1]));return g;};
  const soft=(x,cx,cy,r,col,a)=>{const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba('+col+','+a+')');g.addColorStop(.6,'rgba('+col+','+(a*.55)+')');g.addColorStop(1,'rgba('+col+',0)');x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,2*PI);x.fill();};
  const dab=(x,cx,cy,rx,ry,col)=>{x.fillStyle=col;x.beginPath();x.ellipse(cx,cy,rx,ry,R()*PI,0,2*PI);x.fill();};
  // backdrop 2048x512: sky, sun, clouds, far mountains, cliffs with a waterfall, green hills, a forest line, meadow
  {const W=2048,H=512,c=cv(W,H),x=c.getContext('2d');
    x.fillStyle=lin(x,0,H*.68,[[0,'#8CC4F0'],[.55,'#BEE1F7'],[1,'#FBEFD8']]);x.fillRect(0,0,W,H);
    soft(x,W*.24,H*.1,H*.85,'255,246,214',.9);
    for(let i=0;i<10;i++){const cx=R()*W,cy=H*(.06+R()*.28),n=7+R()*7;for(let j=0;j<n;j++)soft(x,cx+(R()-.5)*240,cy+(R()-.5)*34,26+R()*44,'255,255,255',.5);}
    const ridge=(base,amp,fr,top,bot,ph,jag)=>{x.beginPath();x.moveTo(0,H);for(let px=0;px<=W;px+=6){let y=0;fr.forEach((f,k)=>{y+=Math.sin(px/W*f*PI*2+ph*(k+1))/(k+1);});y=y/1.6+(R()-.5)*jag;x.lineTo(px,H*base-amp*H*(.55+.45*y));}x.lineTo(W,H);x.closePath();x.fillStyle=lin(x,H*(base-amp),H*base+10,[[0,top],[1,bot]]);x.fill();};
    ridge(.72,.30,[2,5,12],'#B6C1E6','#DDE4F5',1.3,.05);
    for(let i=0;i<90;i++)soft(x,R()*W,H*(.55+R()*.15),20+R()*30,'255,255,255',.12);   // haze over the far range
    ridge(.79,.21,[3,7,15],'#8FAAD3','#BFD0E9',2.7,.06);
    {const wx=W*.63,w=30;x.fillStyle=lin(x,H*.56,H*.82,[[0,'rgba(240,250,255,.95)'],[1,'rgba(205,234,255,.75)']]);x.beginPath();x.moveTo(wx-w*.55,H*.56);x.quadraticCurveTo(wx-w*.95,H*.7,wx-w*1.15,H*.82);x.lineTo(wx+w*1.15,H*.82);x.quadraticCurveTo(wx+w*.95,H*.7,wx+w*.55,H*.56);x.fill();
      for(let i=0;i<18;i++){x.strokeStyle='rgba(255,255,255,'+(.2+R()*.4)+')';x.lineWidth=1.5+R()*3;const sx=wx+(R()-.5)*w*1.3;x.beginPath();x.moveTo(sx,H*.57);x.quadraticCurveTo(sx+(R()-.5)*6,H*.7,sx+(R()-.5)*14,H*.81);x.stroke();}
      for(let i=0;i<14;i++)soft(x,wx+(R()-.5)*150,H*(.8+R()*.04),22+R()*30,'255,255,255',.55);}
    ridge(.86,.13,[4,9,17],'#8BC46A','#B2DA8D',4.1,.03);
    for(let i=0;i<420;i++){const tx=R()*W,ty=H*(.83+R()*.05),r=7+R()*13;x.fillStyle=['#3E7C46','#4A8C4C','#58A057','#467F4B'][i%4];x.beginPath();x.arc(tx,ty,r,0,2*PI);x.fill();x.fillStyle='rgba(176,224,128,.5)';x.beginPath();x.arc(tx-r*.3,ty-r*.38,r*.42,0,2*PI);x.fill();}
    x.fillStyle=lin(x,H*.86,H,[[0,'#97CD70'],[1,'#86C463']]);x.fillRect(0,H*.87,W,H*.13);
    for(let i=0;i<2200;i++)dab(x,R()*W,H*(.72+R()*.28),3+R()*7,1.5+R()*2.5,R()<.5?'rgba(255,255,225,.10)':'rgba(40,90,40,.08)');
    x.fillStyle=lin(x,H*.45,H*.9,[[0,'rgba(255,236,200,0)'],[1,'rgba(255,236,200,.16)']]);x.fillRect(0,H*.45,W,H*.45);
    E.tex.backdrop=mkTex(c);}
  // ground 1024: painterly meadow, worn dirt clearing where the fight happens, flowers; edge fades into the backdrop meadow
  {const S=1024,c=cv(S,S),x=c.getContext('2d'),m=S/2,rc=S*.25;
    x.fillStyle='#8CC66A';x.fillRect(0,0,S,S);
    for(let i=0;i<14000;i++){const a=R()*2*PI,r=Math.sqrt(R())*m,px=m+Math.cos(a)*r,py=m+Math.sin(a)*r;x.strokeStyle=['rgba(120,190,90,.6)','rgba(160,214,110,.55)','rgba(92,160,74,.55)','rgba(196,232,140,.45)'][i%4];x.lineWidth=1.5+R()*1.5;x.beginPath();x.moveTo(px,py);x.lineTo(px+(R()-.5)*5,py-4-R()*6);x.stroke();}
    for(let i=0;i<1400;i++){const a=R()*2*PI,r=rc*Math.sqrt(R())*1.05,px=m+Math.cos(a)*r*1.15,py=m+Math.sin(a)*r*.95;dab(x,px,py,10+R()*24,8+R()*16,['rgba(214,184,132,.75)','rgba(196,162,110,.7)','rgba(228,204,156,.7)'][i%3]);}
    for(let i=0;i<120;i++){const a=R()*2*PI,r=R()*rc,px=m+Math.cos(a)*r*1.1,py=m+Math.sin(a)*r*.9;dab(x,px,py,2+R()*4,1.5+R()*3,R()<.5?'rgba(150,140,130,.8)':'rgba(240,232,214,.8)');}
    for(let i=0;i<420;i++){const a=R()*2*PI,r=rc*1.25+R()*(m-rc*1.3),px=m+Math.cos(a)*r,py=m+Math.sin(a)*r;x.fillStyle=['#FFFFFF','#FFE36B','#FFB3C7','#C9B6FF'][i%4];x.beginPath();x.arc(px,py,2+R()*2.2,0,2*PI);x.fill();}
    x.globalCompositeOperation='destination-in';const g=x.createRadialGradient(m,m,m*.8,m,m,m);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,S,S);x.globalCompositeOperation='source-over';
    E.tex.ground=mkTexA(c,[134,196,99]);}
  // decor sprites
  const spr=(w,h,fn,key,bleed)=>{const c=cv(w,h),x=c.getContext('2d');fn(x,w,h);E.tex['d_'+key]=mkTexA(c,bleed);};
  // a leafy crown: shaded blobs (light top-left, dark bottom-right) + small highlight dabs, no hard edges
  const crown=(x,cx,cy,r,dark,mid,light)=>{const blob=(bx,by,br,c1,c2)=>{const g=x.createRadialGradient(bx-br*.35,by-br*.4,br*.1,bx,by,br);g.addColorStop(0,c1);g.addColorStop(.75,c2);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.beginPath();x.arc(bx,by,br,0,2*PI);x.fill();};
    for(let i=0;i<11;i++){const a=R()*2*PI,d=r*.6*R();blob(cx+Math.cos(a)*d,cy+Math.sin(a)*d*.8+r*.1,r*(.42+R()*.25),i<5?mid:light,dark);}
    for(let i=0;i<14;i++){x.fillStyle='rgba(230,250,190,'+(.25+R()*.3)+')';x.beginPath();x.ellipse(cx-r*.35+(R()-.5)*r*.8,cy-r*.4+(R()-.5)*r*.5,r*(.05+R()*.06),r*(.03+R()*.04),R()*PI,0,2*PI);x.fill();}};
  spr(256,192,(x,w,h)=>{soft(x,w/2,h*.92,w*.42,'40,70,40',.35);crown(x,w*.32,h*.62,h*.34,'#4C8C4A','#7CC064','#A8DA7E');crown(x,w*.66,h*.6,h*.36,'#4C8C4A','#82C468','#AEDD84');crown(x,w*.5,h*.45,h*.38,'#52924E','#88C96C','#B8E48C');},'bush',[86,160,82]);
  spr(256,384,(x,w,h)=>{soft(x,w/2,h*.95,w*.4,'40,60,40',.35);x.fillStyle=lin(x,h*.55,h,[[0,'#7A5636'],[1,'#5E412A']]);x.beginPath();x.moveTo(w*.44,h*.96);x.quadraticCurveTo(w*.47,h*.7,w*.45,h*.5);x.lineTo(w*.56,h*.5);x.quadraticCurveTo(w*.54,h*.7,w*.58,h*.96);x.fill();
    crown(x,w*.5,h*.42,w*.32,'#447F45','#6FAF5C','#9ED27A');crown(x,w*.33,h*.5,w*.22,'#447F45','#74B35F','#A2D57E');crown(x,w*.68,h*.48,w*.23,'#447F45','#74B35F','#A2D57E');crown(x,w*.5,h*.24,w*.24,'#4B8A4A','#7DBD64','#B0DE88');},'tree',[70,130,70]);
  spr(256,112,(x,w,h)=>{for(let i=0;i<70;i++){const px=w*(.08+R()*.84);x.strokeStyle=['#5FA850','#77BC5F','#4C9445'][i%3];x.lineWidth=2;x.beginPath();x.moveTo(px,h);x.quadraticCurveTo(px+(R()-.5)*10,h*.7,px+(R()-.5)*18,h*(.35+R()*.3));x.stroke();}
    for(let i=0;i<16;i++){const px=w*(.12+R()*.76),py=h*(.25+R()*.35),col=['#FFFFFF','#FFE36B','#FF9EB8','#C7B3FF'][i%4];for(let k=0;k<5;k++){x.fillStyle=col;x.beginPath();x.arc(px+Math.cos(k*1.26)*4,py+Math.sin(k*1.26)*4,3.2,0,2*PI);x.fill();}x.fillStyle='#FFC94A';x.beginPath();x.arc(px,py,2.4,0,2*PI);x.fill();}},'flowers',[110,180,90]);
  spr(192,128,(x,w,h)=>{soft(x,w/2,h*.9,w*.42,'40,50,40',.3);x.fillStyle=lin(x,h*.2,h*.9,[[0,'#B9B4AE'],[1,'#8A847E']]);x.beginPath();x.ellipse(w*.5,h*.6,w*.4,h*.32,0,0,2*PI);x.fill();x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.ellipse(w*.4,h*.45,w*.18,h*.1,-.3,0,2*PI);x.fill();
    x.fillStyle='rgba(110,170,90,.7)';for(let i=0;i<10;i++){x.beginPath();x.arc(w*(.25+R()*.5),h*(.82+R()*.08),3+R()*4,0,2*PI);x.fill();}},'rock',[150,145,140]);
}
// ---- ambient animation on top of a background image (clouds, flowing falls, mist, smoke, leaves/embers/sparkles,
// a breathing glow on the magic circle). Positions live in image space (u,v = 0..1) so they stay on the painted
// sky / waterfalls whatever the screen size; sizes are in image heights. Drawn behind the fighters. ----
function ambTex(){
  if(E.tex.streak)return;
  const mk=(rgb,key)=>{const c=cv(32,128),x=c.getContext('2d'),C=rgb.join(','),g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'rgba('+C+',0)');g.addColorStop(.3,'rgba('+C+',.85)');g.addColorStop(.7,'rgba('+C+',.85)');g.addColorStop(1,'rgba('+C+',0)');
    x.fillStyle=g;x.fillRect(0,0,32,128);x.globalCompositeOperation='destination-in';const h=x.createLinearGradient(0,0,32,0);h.addColorStop(0,'rgba(0,0,0,0)');h.addColorStop(.5,'rgba(0,0,0,1)');h.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=h;x.fillRect(0,0,32,128);E.tex[key]=mkTexA(c,rgb);};
  mk([255,255,255],'streak');mk([255,190,70],'lstreak');
  {const c=cv(8,8),x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,8,8);E.tex.flat=mkTex(c);}   // plain quad for full-screen flashes
}
function ambInit(){
  E.amb=[];const A=E.bg&&E.bg.amb;if(!A)return;ambTex();
  (A.clouds||[]).forEach(r=>{for(let i=0;i<r[4];i++)ambCloud(r,r[0]+Math.random()*(r[1]-r[0]));});
}
function ambCloud(r,u){E.amb.push({k:'cloud',r,u:u==null?r[1]+.04:u,v:r[2]+Math.random()*(r[3]-r[2]),vu:-(.006+Math.random()*.008),vv:0,s:.07+Math.random()*.07,life:1e9,a:.55+Math.random()*.3,tex:E.tex.cloud});}
function ambUpdate(dt){
  const A=E.bg&&E.bg.amb;if(!A||!E.amb)return;const R=Math.random,P=E.amb,G=gtex;
  for(let i=P.length-1;i>=0;i--){const p=P[i];p.u+=p.vu*dt;p.v+=p.vv*dt;p.life-=dt;if(p.gs)p.s+=p.gs*dt;if(p.vr)p.rot+=p.vr*dt;
    if(p.k==='cloud'&&p.u<p.r[0]-.06){P.splice(i,1);ambCloud(p.r);continue;}
    if(p.life<=0)P.splice(i,1);}
  const n=(rate)=>{let k=Math.floor(rate*dt);if(R()<rate*dt-k)k++;return k;};
  (A.falls||[]).forEach(f=>{const lava=f[4]==='lava',len=f[2]-f[1],d=.55+len*.8;
    for(let i=n(26*Math.max(.5,f[3]/.02));i--;)P.push({k:'p',u:f[0]+(R()-.5)*2*f[3]*.85,v:f[1]-.02,vu:0,vv:len/d,life:d,max:d,s:.022+R()*.02,ar:.32,a:.35+R()*.35,tex:E.tex[lava?'lstreak':'streak']});
    for(let i=n(7);i--;)P.push({k:'p',u:f[0]+(R()-.5)*3*f[3],v:f[2]-.01,vu:(R()-.5)*.02,vv:-.01-R()*.015,life:1.3,max:1.3,s:.02+R()*.02,gs:.03,a:lava?.35:.4,tex:G(lava?[255,150,60]:[235,245,255])});});
  (A.smoke||[]).forEach(s=>{for(let i=n(3);i--;)P.push({k:'p',u:s[0]+(R()-.5)*.02,v:s[1],vu:.006+R()*.01,vv:-.012-R()*.01,life:4,max:4,s:.03,gs:.03,a:.35,tex:G([70,55,60])});});
  if(A.fx==='leaves'){for(let i=n(1.1);i--;)P.push({k:'p',u:R(),v:-.03,vu:-.01+R()*.03,vv:.05+R()*.04,life:9,max:9,s:.018+R()*.01,a:.95,rot:R()*6,vr:(R()-.5)*3,sway:R()*6,tex:emojiTex('🍃')});
    for(let i=n(2.5);i--;)P.push({k:'p',u:R(),v:.3+R()*.6,vu:.008+R()*.01,vv:-.004,life:5,max:5,s:.006+R()*.006,a:.8,tex:G([255,250,200])});}
  if(A.fx==='embers')for(let i=n(11);i--;)P.push({k:'p',u:R(),v:1.02,vu:(R()-.5)*.02,vv:-(.06+R()*.08),life:3.5,max:3.5,s:.005+R()*.008,a:.95,flick:1,tex:G(R()<.5?[255,200,80]:[255,110,40])});
  if(A.fx==='snow')for(let i=n(16);i--;)P.push({k:'p',u:R(),v:-.02,vu:(R()-.5)*.02,vv:.035+R()*.04,life:16,max:16,s:.004+R()*.006,a:.9,sway:R()*6,tex:G([255,255,255])});
  if(A.fx==='wisps')for(let i=n(1.4);i--;)P.push({k:'p',u:.1+R()*.8,v:.35+R()*.55,vu:(R()-.5)*.01,vv:-.008-R()*.01,life:5,max:5,s:.012+R()*.012,a:.85,flick:1,sway:R()*6,tex:G(R()<.6?[200,140,255]:[150,220,255])});
  if(A.fx==='storm'){for(let i=n(6);i--;)P.push({k:'p',u:.15+R()*.7,v:.95,vu:(R()-.5)*.03,vv:-(.04+R()*.07),life:2.5,max:2.5,s:.004+R()*.006,a:.95,flick:1,tex:G([255,235,110])});
    E.bgFlash=Math.max(0,(E.bgFlash||0)-dt*2.2);if(R()<dt/2.6){E.bgFlash=.6;if(R()<.5)setTimeout(()=>{E.bgFlash=.45;},120);}}
  if(A.fx==='sparkles')for(let i=n(2.5);i--;)P.push({k:'p',u:R(),v:R()*.75,vu:0,vv:0,life:1.4,max:1.4,s:.014+R()*.012,a:1,tw:1,tex:starTex()});
}
function ambDraw(I){
  const A=E.bg&&E.bg.amb,T=E.bgT;if(!A||!T||!E.amb)return;
  const X=u=>T.cx+(u-.5)*2*T.sx*T.k,Y=v=>T.cy+(.5-v)*2*T.sy*T.k;
  // one image height in NDC is 2*sy*k vertically; the same pixel length horizontally is 2*sy*k*(H/W)
  const hw=s=>s*T.sy*T.k*T.H/T.W,hh=s=>s*T.sy*T.k,t=E.time;
  if(A.fx==='storm'&&E.bgFlash>0)sprite(E.tex.flat,[0,0,0],1,1,0,E.bgFlash*.4,I,I);   // the sky lights up when lightning strikes
  if(A.circle){const c=A.circle,p=.28+.14*Math.sin(t*2.2);sprite(gtex([c[4],c[5],c[6]]),[X(c[0]),Y(c[1]),0],c[2]*2*T.sx*T.k*1.05,c[3]*2*T.sy*T.k*1.4,0,p,I,I);}
  E.amb.forEach(q=>{let a=q.a,s=q.s,u=q.u;
    if(q.k==='cloud'){const r=q.r,e=Math.min(1,(u-r[0]+.06)/.12,(r[1]+.06-u)/.12);a*=Math.max(0,e);sprite(q.tex,[X(u),Y(q.v),0],hw(s)*2,hh(s),0,a,I,I);return;}
    const f=q.life/q.max;a*=Math.min(1,f*3,(1-f)*6+.2);
    if(q.flick)a*=.6+.4*Math.sin(t*20+u*50);
    if(q.tw)s*=Math.sin(Math.PI*(1-f));
    if(q.sway)u+=.012*Math.sin(t*2+q.sway);
    drawQ(q.tex,[X(u),Y(q.v),0],hw(s)*(q.ar||1),hh(s),q.rot||0,a,0,I,I);});
}
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
    E.u=U(E.pg,['uM','uVP','uNM','uOut','uPass','uCol','uL','uEye','uFlash','uAlpha','uMode','uTime','uRC','uRot2','uTex2']);E.us=U(E.ps,['uC','uS','uV','uPr','uRot','uTex','uA','uF','uL','uLC','uLd']);
    E.qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,E.qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    arenaTexs();gl.uniform1i(E.u.uTex2,1);
    E3.ok=true;E.last=performance.now();
    if(!E.run){E.run=true;requestAnimationFrame(frame);}
    return true;
  }catch(e){E3.ok=false;E3.err=String(e&&e.message||e);return false;}
}
const SPR=id=>(typeof MSPR!=='undefined'&&MSPR[id])||(typeof RSPR!=='undefined'&&RSPR[id])||(typeof LSPR!=='undefined'&&LSPR[id])||(typeof VSPR!=='undefined'&&VSPR[id])||null;
const MINFO=id=>(typeof MBY!=='undefined'&&MBY[id])||(typeof LMON!=='undefined'&&LMON.find(m=>m.id===id))||{};
function mon0(id){return E.big?3.3:2.8;}
function setup(monId,eq,hid,big){
  E.big=!!big;E.leg=MINFO(monId).role==='L';   // legends: far bigger than any boss, with a gold aura
  const m=SPR(monId)?{root:Gp(),sc:1}:monModel(monId),h=heroModel(eq);
  const SP=SPR(monId);if(SP&&!E.imgs[monId]){const im=new Image();im.src=SP.u;E.imgs[monId]={im,tex:null};}
  const mon={nf:MINFO(monId).f===0,img:SP?monId:null,root:SP?Gp():m.root,base:[E.leg?3.9:E.big?3.4:3.0,0,.1],ry:-.8,sc:m.sc,off:{x:0,y:0,sq:1,rz:0,ry:0,sc:1},id:monId};
  const HA0=(typeof HANIM!=='undefined')&&hid&&HANIM[hid];if(HA0&&!HA0._ld){HA0._ld=1;['idle','attack','hit','win'].forEach(k=>HA0[k].forEach(f=>{const im=new Image();im.src=f.u;f.im=im;f.tex=null;if(im.decode)im.decode().catch(()=>{});}));}
  const HS=(typeof HSPR!=='undefined')&&hid&&HSPR[hid];if(HS&&!E.imgs['H'+hid]){const im=new Image();im.src=HS.u;E.imgs['H'+hid]={im,tex:null};}
  const hero={himg:HS?hid:null,root:HS?Gp():h.root,base:[-2.75,0,.4],ry:.8,sc:1,off:{x:0,y:0,sq:1,rz:0,ry:0,sc:1},armR:HS?{r:[0,0,0]}:h.armR,hand:h.hand,head:h.head};
  E.mon=mon;E.hero=hero;E.parts=[];E.tw=[];E.tl=[];E.sprites=[];E.backs=[];E.legAura=null;E.flash={mon:null,hero:null};E.shake=0;
  const R=5.2,mk=[];
  // soft painted scenery (warm pastoral fantasy): painted backdrop billboard + grassy ground + painted bushes/trees/flowers
  scenery();
  const ground=N('cyl1.00',null,{p:[0,.012,0],s:[26,.02,26],mode:2,tex:'ground',a:.999,ol:false});
  const ring=N('cyl1.00',null,{p:[mon0(monId),.05,.1],s:[.01,.01,.01],mode:2,tex:'ring',a:0,add:true,ol:false});
  E.ring=ring;E.env=[ground,ring];
  // painted battle background (assets/backgrounds via tools/mkbg.py), chosen by the monster's element; replaces the drawn scenery
  E.bg=null;
  if(typeof BGS!=='undefined'){const mt=MINFO(monId).t,k=(E.forceBg&&BGS[E.forceBg])?E.forceBg:(BGT[mt]||BGT['default']),B=BGS[k];
    if(B){if(!E.imgs['BG'+k]){const im=new Image();im.src=B.u;E.imgs['BG'+k]={im,tex:null};}E.bg={k,py:B.py,pu:B.pu==null?.5:B.pu,pw:B.pw||.35,ia:B.w/B.h,amb:B.amb};E.env=[ring];}}
  ambInit();fxLoad();vfxLoad();propLoad();
  E.decor=[{t:'tree',x:-13,z:-16,s:2.6},{t:'tree',x:14,z:-18,s:2.9},{t:'tree',x:-19,z:-20,s:3},{t:'bush',x:-15,z:-14,s:1.2},{t:'bush',x:16.5,z:-15,s:1.1},
    {t:'bush',x:-8,z:-5,s:1.0},{t:'bush',x:8.6,z:-4.6,s:1.1},{t:'rock',x:-5.8,z:1.4,s:.55},{t:'rock',x:6.3,z:1.0,s:.5},
    {t:'flowers',x:-4.3,z:3.5,s:.8},{t:'flowers',x:4.6,z:3.8,s:.8},{t:'flowers',x:.7,z:5.1,s:.7},{t:'flowers',x:-7.5,z:.4,s:.7},{t:'flowers',x:8.2,z:.2,s:.7}].sort((a,b)=>a.z-b.z);
  E.clouds=[];for(let i=0;i<12;i++){const r=(i*.6180339)%1,q=(i*.7548776)%1,w=(i*.5698403)%1;E.clouds.push({x:-60+r*120,y:14+q*12,z:-40-w*25,s:6+q*6,sp:.25+w*.4,a:.28+.2*w});}
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
  if(n.add)gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
  const fl=E.flash[it.grp];gl.uniform4fv(u.uFlash,fl||[0,0,0,0]);
  gl.drawElements(gl.TRIANGLES,g.n,gl.UNSIGNED_SHORT,0);
  if(n.add)gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
}
function sprite(tex,pos,w,h,rot,a,V,Pr,F,L){if(!tex||a<=.003)return;
  const gl=E.gl,s=E.us;gl.useProgram(E.ps);gl.bindBuffer(gl.ARRAY_BUFFER,E.qb);gl.enableVertexAttribArray(0);gl.disableVertexAttribArray(1);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.uniform3fv(s.uC,pos);gl.uniform2f(s.uS,w,h);gl.uniformMatrix4fv(s.uV,false,V);gl.uniformMatrix4fv(s.uPr,false,Pr);gl.uniform1f(s.uRot,rot||0);gl.uniform1f(s.uA,a);gl.uniform4fv(s.uF,F||[0,0,0,0]);if(L){gl.uniform4f(s.uL,L.t[0],L.t[1],L.t[2],L.s);gl.uniform3fv(s.uLC,L.rc);gl.uniform2fv(s.uLd,L.d);}else gl.uniform4f(s.uL,1,1,1,0);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(s.uTex,0);gl.disable(gl.DEPTH_TEST);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.enable(gl.DEPTH_TEST);
}
const ease=u=>u<0?0:u>1?1:u*u*(3-2*u);
const cl=u=>u<0?0:u>1?1:u;
// light of the current scene, measured once from the background picture: ground colour -> colour cast, upper part -> rim light
function sceneLight(){const B=E.bg;if(!B)return{t:[1,1,1],s:.0001,rc:[1,.97,.9]};if(B.lt)return B.lt;const I=E.imgs['BG'+B.k];if(!I||!I.im.complete||!I.im.naturalWidth)return null;
  try{const c=cv(32,32),x=c.getContext('2d');x.drawImage(I.im,0,0,32,32);const d=x.getImageData(0,0,32,32).data,avg=(y0,y1)=>{let r=0,g=0,b=0,n=0;for(let y=y0;y<y1;y++)for(let q=0;q<32;q++){const i=(y*32+q)*4;r+=d[i];g+=d[i+1];b+=d[i+2];n++;}return[r/n/255,g/n/255,b/n/255];};
    const gr=avg(20,32),sk=avg(0,14),lum=v=>.3*v[0]+.59*v[1]+.11*v[2],gl=Math.max(.05,lum(gr)),t=gr.map(v=>Math.min(1.25,v/gl*.92+.08)),sl=Math.max(.05,lum(sk)),rc=sk.map(v=>Math.min(1,(v/sl)*.55+.45)*.85);
    B.lt={t,s:.42,rc,gr:gr.map(v=>Math.round(v*255))};}catch(e){B.lt={t:[1,1,1],s:.3,rc:[1,.97,.9]};}return B.lt;}
// every monster gives off a little of its element all the time (embers, frost, sparks, wisps, bubbles, leaves, dust, steam)
function monAura(dt){const m=E.mon;if(!m||!m.img||m.off.al===0)return;const t=MINFO(m.id).t,R=Math.random,S=(E.leg?1.7:E.big?1.2:1),c=[m.base[0]+m.off.x,0,m.base[2]+.35],W=1.0*S,H=2.2*S,P=(n)=>R()<dt*n;
  const push=o=>E.parts.push(Object.assign({vz:0,g:0,rot:0,vr:0},o));
  if(t==='fire'||t==='dragon'){if(P(12))push({x:c[0]+(R()-.5)*W*1.6,y:.3+R()*H,z:c[2]+.1,vx:(R()-.5)*.4,vy:.8+R()*1.4,life:1.1,max:1.1,size:.05+R()*.06,tex:sparkTex([255,160,60]),st:1});}
  else if(t==='ice'){if(P(9))push({x:c[0]+(R()-.5)*W*1.8,y:.3+R()*H,z:c[2]+.1,vx:(R()-.5)*.2,vy:-.15,life:1.6,max:1.6,size:.06+R()*.06,tex:starTex(),vr:1});if(P(3))push({x:c[0]+(R()-.5)*W*2,y:.15,z:c[2],vx:(R()-.5)*.3,vy:.05,life:2,max:2,size:.5,gs:.5,al:.25,tex:gtex([210,240,255])});}
  else if(t==='elec'){if(P(10)){const a=R()*PI*2;push({x:c[0]+Math.cos(a)*W*.8,y:H*.5+Math.sin(a)*H*.45,z:c[2]+.15,vx:Math.cos(a+1.6)*4,vy:Math.sin(a+1.6)*4,life:.12,max:.12,size:.16,tex:sparkTex([255,240,140]),st:1});}}
  else if(t==='ghost'){if(P(7))push({x:c[0]+(R()-.5)*W*1.6,y:.4+R()*H*.8,z:c[2]+.05,vx:(R()-.5)*.3,vy:.35+R()*.3,life:1.6,max:1.6,size:.28+R()*.2,gs:.4,al:.35,tex:gtex([170,130,255])});}
  else if(t==='skel'){if(P(6))push({x:c[0]+(R()-.5)*W*2,y:.12,z:c[2],vx:(R()-.5)*.4,vy:.12,life:1.8,max:1.8,size:.55,gs:.5,al:.3,tex:gtex([90,60,140])});}
  else if(t==='poison'){if(P(6))push({x:c[0]+(R()-.5)*W*1.6,y:.3+R()*H*.6,z:c[2]+.1,vx:(R()-.5)*.2,vy:.45+R()*.3,life:1.3,max:1.3,size:.07+R()*.07,al:.8,tex:gtex([170,240,90])});}
  else if(t==='sea'){if(P(6))push({x:c[0]+(R()-.5)*W*1.6,y:.3+R()*H*.7,z:c[2]+.1,vx:(R()-.5)*.15,vy:.4+R()*.3,life:1.4,max:1.4,size:.06+R()*.06,al:.8,tex:gtex([190,235,255])});}
  else if(t==='forest'){if(P(1.6))push({x:c[0]+(R()-.5)*W*1.4,y:H*(.6+R()*.4),z:c[2]+.12,vx:-.3-R()*.3,vy:-.35,life:2.4,max:2.4,size:.13,tex:emojiTex('🍃'),rot:R()*6,vr:1.5});}
  else if(t==='desert'){if(P(6))push({x:c[0]+(R()-.5)*W*2,y:.1,z:c[2],vx:-.4-R()*.5,vy:.15,life:1.4,max:1.4,size:.35,gs:.5,al:.3,tex:gtex([220,195,140])});}
  else if(t==='sky'){if(P(4))push({x:c[0]+W*1.2,y:.4+R()*H,z:c[2]+.1,vx:-3-R()*2,vy:0,life:.5,max:.5,size:.12,al:.5,tex:sparkTex([235,245,255]),st:1});}
  else if(t==='mech'){if(P(2.5))push({x:c[0]+(R()-.5)*W,y:H*(.7+R()*.3),z:c[2]+.05,vx:(R()-.5)*.3,vy:.5,life:1.4,max:1.4,size:.3,gs:.6,al:.3,tex:gtex([220,220,225])});if(P(1.5))push({x:c[0]+(R()-.5)*W,y:H*R(),z:c[2]+.15,vx:(R()-.5)*3,vy:1+R()*2,g:6,life:.4,max:.4,size:.08,tex:sparkTex([255,210,120]),st:1});}}
const _tint={mon:null};
function update(dt){if(!E.tint)E.tint=_tint;
  const t=E.time;
  ambUpdate(dt);
  if(E.leg&&E.mon){const c=mpos(),gt=gtex([255,215,110]);if(Math.random()<dt*14)E.parts.push({x:c[0]+(Math.random()-.5)*4.5,y:.1+Math.random()*.6,z:c[2]+.2+(Math.random()-.5)*1.2,vx:0,vy:.8+Math.random()*1.2,vz:0,g:0,life:2.2,max:2.2,size:.1+Math.random()*.12,gs:-.03,tex:Math.random()<.5?starTex():gt,rot:0,vr:1});
    if(!E.legAura){E.legAura={tex:gt,pos:c,w:0,h:0,rot:0,a:0};E.sprites.unshift(E.legAura);}const A=E.legAura;A.pos=[c[0],c[1]+.6,c[2]-.4];A.w=4.6+.3*Math.sin(E.time*2.2);A.h=4.0+.3*Math.sin(E.time*2.2);A.a=.34+.08*Math.sin(E.time*2.2);}
  if(E.mon&&E.tex.glow&&Math.random()<dt*5)E.parts.push({x:-10+Math.random()*20,y:.4+Math.random()*4.5,z:-5+Math.random()*7,vx:.12+Math.random()*.2,vy:.04+Math.random()*.1,vz:0,g:0,life:4,max:4,size:.05+Math.random()*.06,tex:E.tex.glow,rot:0,vr:0,al:.65});   // drifting pollen / light motes
  // idle
  [E.mon,E.hero].forEach((o,i)=>{if(!o)return;o.off.sqi=1+.03*Math.sin(t*2.3+i);});monAura(dt);
  const m=E.mon,h=E.hero;if(!m)return;
  m.bob=.05*Math.sin(t*2.3);h.bob=.04*Math.sin(t*2.6+1);m.idz=.016*Math.sin(t*1.7+1);h.idz=.012*Math.sin(t*2.1);
  [['mon',m],['hero',h]].forEach(([k,o])=>{const fl=E.flash[k];if(fl&&fl[3]>.3&&fl!==o._lf){o._lf=fl;o.jit=Math.min(1,fl[3]+.2);}o.jit=Math.max(0,(o.jit||0)-dt*3.2);o.jx=(o.jit||0)*Math.sin(t*70)*.16;});
  {const cur=E.tl;E.tl=[];cur.forEach(e=>{if(t>=e.t)e.fn();else E.tl.push(e);});}
  {const cur=E.tw,keep=[];E.tw=[];cur.forEach(w=>{const u=(t-w.t0)/w.dur;if(u<0){keep.push(w);return;}w.fn(cl(u));if(u<1)keep.push(w);});E.tw=keep.concat(E.tw);}
  E.parts=E.parts.filter(p=>{p.life-=dt;if(p.life<=0)return false;p.vy-=p.g*dt;if(p.dr){const k=Math.max(0,1-p.dr*dt);p.vx*=k;p.vy*=k;p.vz*=k;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.vr*dt;if(p.gs)p.size=Math.max(.02,p.size+p.gs*dt);return true;});   // gs: size change per second, dr: drag
  E.shake=Math.max(0,E.shake-dt*2.2);
  ['mon','hero'].forEach(k=>{const f=E.flash[k];if(f){f[3]=Math.max(0,f[3]-dt*3);if(f[3]<=0)E.flash[k]=null;}});
  {const f=E.tint.mon;if(f){f[3]=Math.max(0,f[3]-dt*2.5);if(f[3]<=0)E.tint.mon=null;}}   // power-up glow fades by itself (no hit jitter)
}
function burst(pos,n,tex,spd,size){for(let i=0;i<n;i++){const a=Math.random()*2*PI,e=Math.random()*PI-PI/2,s=spd*(.5+Math.random());
  E.parts.push({x:pos[0],y:pos[1],z:pos[2],vx:Math.cos(a)*Math.cos(e)*s,vy:Math.sin(e)*s+spd*.4,vz:Math.sin(a)*Math.cos(e)*s,g:6,life:.7+Math.random()*.5,max:1.2,size:size*(.6+Math.random()*.7),tex,rot:Math.random()*6,vr:(Math.random()-.5)*8});}}
function draw(){
  const gl=E.gl,W=E.W,H=E.H;if(!E.mon)return;
  gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  const asp=W/H,fov=.8,dist=Math.max(9.5,(E.big?6.0:5.3)/(Math.tan(fov/2)*asp));
  const sh=E.shake,tq=E.time,jx=sh*.17*(Math.sin(tq*29)+.6*Math.sin(tq*47+1.3)),jy=sh*.12*(Math.sin(tq*33+.7)+.6*Math.sin(tq*53+2.1));
  const eye=[jx,4.3+jy,dist],V=m4.look(eye,[0,2.4,0],[0,1,0]),Pr=m4.persp(fov,asp,.5,160),VP=m4.mul(Pr,V);
  // full-screen background image, cover-fit, shifted (and enlarged if needed) so its platform sits under the fighters' feet
  let BGOK=false;
  if(E.bg){const c=E.imgs['BG'+E.bg.k];if(c&&!c.tex&&c.im.complete&&c.im.naturalWidth)c.tex=mkTex(c.im);
    if(c&&c.tex){BGOK=true;const I=m4.id(),ca=W/H,ia=E.bg.ia,b=E.hero.base,pw=VP[3]*b[0]+VP[11]*b[2]+VP[15],fy=(VP[1]*b[0]+VP[9]*b[2]+VP[13])/pw;
      // the flat ground (pu ± pw of the image width) must reach under both fighters' feet: zoom in on narrow platforms
      const nx=(x,z)=>(VP[0]*x+VP[8]*z+VP[12])/(VP[3]*x+VP[11]*z+VP[15]),mb=E.mon.base,hx=nx(b[0]-.55,b[2]),mx=nx(mb[0]+.55,mb[2]);
      let sx=ca>ia?1:ia/ca,sy=ca>ia?ca/ia:1,k=Math.min(2.2,Math.max(1,(mx-hx)/(4*E.bg.pw*sx))),cy=0;
      for(;k<2.4;k+=.02){cy=fy-(.5-E.bg.py)*2*sy*k;if(Math.abs(cy)<=sy*k-1)break;}
      cy=Math.max(1-sy*k,Math.min(sy*k-1,cy));
      let cx=(hx+mx)/2-(E.bg.pu-.5)*2*sx*k;cx=Math.max(1-sx*k,Math.min(sx*k-1,cx));
      gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);sprite(c.tex,[cx,cy,0],sx*k,sy*k,0,1,I,I);E.bgT={sx,sy,k,cx,cy,ia,W,H};ambDraw(I);gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);}}
  if(!BGOK&&E.tex.backdrop){gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);sprite(E.tex.backdrop,[0,10,-75],92,20.5,0,1,V,Pr);gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);}
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
  gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);tr.forEach(it=>drawItem(it,0,VP,eye));
  // sprites
  gl.disable(gl.CULL_FACE);
  if(!BGOK&&E.decor)E.decor.forEach(d=>{const t=E.tex['d_'+d.t],A=DECOR_ASP[d.t];if(t){const hh=d.s*A[1];sprite(t,[d.x,hh*.96,d.z],hh*A[0],hh,0,1,V,Pr);}});
  if(!BGOK&&E.tex.cloud)E.clouds.forEach(c=>{const x=((c.x+E.time*c.sp+60)%120)-60;sprite(E.tex.cloud,[x,c.y,c.z],c.s,c.s*.5,0,c.a,V,Pr);});
  gl.disable(gl.DEPTH_TEST);
  if(E.backs)E.backs.forEach(s=>drawQ(s.tex,s.pos,s.w,s.h,s.rot,s.a,E.time,V,Pr));   // things that belong behind the characters (wings)
  if(E.hero.himg){const o=E.hero,HA=(typeof HANIM!=='undefined')&&HANIM[o.himg];let c=E.imgs['H'+o.himg],S=HSPR[o.himg],fm=null,fm2=null,fa=0;
    if(HA){let pl=o.pl,nm='idle',u=0;if(pl){u=(E.time-pl.t0)/pl.dur;if(u>=1&&pl.n!=='win'){const LL=HA[pl.n];o.pe={f:LL[LL.length-1],t:E.time};o.pl=null;pl=null;}else{nm=pl.n;u=Math.min(u,.999);}}
      // HA.fps (video-made heroes): idle plays at the video's own rate with hard cuts; sheet heroes stretch idle over 6.4 s and cross-fade
      // HA.pp: idle plays forward then backward (ping-pong) so there is no seam where the video's last frame meets its first
      const L=HA[nm],N0=L.length,PP=!pl&&HA.pp&&N0>2,N=PP?2*N0-2:N0,at_=j=>L[PP&&j>=N0?2*N0-2-j:j];
      const ph=pl?0:(HA.fps?(E.time*HA.fps)%N:(E.time/6.4%1)*N),ix=pl?Math.min(N-1,Math.floor(u*N)):Math.floor(ph);fm=at_(ix);
      // idle: sheet heroes cross-fade in the middle of each (long) frame; video heroes blend linearly between neighbouring frames, which differ very little (smooth, no ghosting)
      if(!pl){fm2=at_((ix+1)%N);fa=HA.fps?ph-ix:ease((ph-ix-.3)/.4);if(fm2&&fm2.im&&!fm2.tex&&fm2.im.complete&&fm2.im.naturalWidth)fm2.tex=mkTex(fm2.im);}
      if(fm&&fm.im&&!fm.tex&&fm.im.complete&&fm.im.naturalWidth)fm.tex=mkTex(fm.im);
      // a frame whose image is not decoded yet: keep the last frame shown (falling back to the static portrait looked like a jump)
      if(fm&&!fm.tex&&o.lastFm&&o.lastFm.tex){fm=o.lastFm;fm2=null;}
      if(fm&&fm.tex)o.lastFm=fm;}
    if(fm&&fm.tex){c=fm;S=fm;o.cur=(fm2&&fa>.5&&fm2.tex)?fm2:fm;}
    else if(c&&!c.tex&&c.im.complete&&c.im.naturalWidth)c.tex=mkTex(c.im);
    // video-made heroes (HA.fps) already move their body in the frames: no extra tilt, squash or idle sway (looked like the whole picture rotating); lunge/jump offsets stay
    if(c&&c.tex){const vid=!!(fm&&fm.tex&&HA.fps),f=o.off,sq=vid?1:f.sq*(f.sqi||1),k=Math.max(.001,f.sc),asp=S.w/S.h,h0=(fm&&fm.tex)?HA.k:Math.min(3.4,3.7/asp);
      const br=(fm&&fm.tex&&!o.pl&&HA.idle.length<3)?.014*Math.sin(E.time*2.3):0;const h=h0*k*sq*(1+br),w=h0*asp*k*(1+(1-sq)*.6)*(1-br*.4),rot=vid?0:-f.rz*.6-(o.idz||0);
      const hp=[o.base[0]+f.x+(o.jx||0)+PSG*Math.sin(rot)*h/2,o.base[1]+f.y+Math.cos(rot)*h/2+.02,o.base[2]+.3];
      sprite(c.tex,hp,w/2,h/2,rot,1,V,Pr,E.flash.hero);
      if(fm2&&fm2.tex&&fa>.01)sprite(fm2.tex,hp,w/2,h/2,rot,fa,V,Pr,E.flash.hero);
      if(false){const q=(E.time-o.ps.t)/.16;if(q<1&&o.ps.f.tex&&o.ps.f!==c)sprite(o.ps.f.tex,hp,w/2,h/2,rot,1-ease(q),V,Pr,E.flash.hero);else if(q>=1)o.ps=null;}
      if(false){const q=(E.time-o.pe.t)/.25;if(q<1&&o.pe.f.tex)sprite(o.pe.f.tex,hp,w/2,h/2,rot,1-ease(q),V,Pr,E.flash.hero);else o.pe=null;}}}
  if(E.mon.img){const o=E.mon,c=E.imgs[o.img],S=SPR(o.img);
    if(c&&!c.tex&&c.im.complete&&c.im.naturalWidth)c.tex=mkTex(c.im);
    if(c&&c.tex){const f=o.off,sq=f.sq*(f.sqi||1),k=Math.max(.001,f.sc),asp=S.w/S.h,M=E.leg?5.8:E.big?3.45:3.0,h0=Math.min(E.leg?6.2:E.big?4.2:3.6,(E.leg?9.4:E.big?5.2:4.6)/asp,M/Math.sqrt(asp))*(MINFO(o.id).z||1);   // same visual area (sqrt(w*h)=M) for every monster: slimes, golems and long dragons look equally heavy next to the hero
      const h=h0*k*sq,w=(o.nf?1:-1)*h0*asp*k*(1+(1-sq)*.6),rot=-f.rz*.6-(o.idz||0);   // mirror art drawn facing right so every monster faces the hero (o.nf: already faces left)
      const LT=sceneLight(),iw=c.im.naturalWidth||360,ih=c.im.naturalHeight||360,ML=LT&&{t:LT.t,s:LT.s,rc:LT.rc,d:[(w<0?1:-1)*3.5/iw,3.5/ih]};
      sprite(c.tex,[o.base[0]+f.x+(o.jx||0)+PSG*Math.sin(rot)*h/2,o.base[1]+f.y+(o.bob||0)+Math.cos(rot)*h/2+.02,o.base[2]+.2],w/2,h/2,rot,f.al==null?1:f.al,V,Pr,E.flash.mon||(E.tint&&E.tint.mon),ML);}}
  gl.enable(gl.DEPTH_TEST);
  E.sprites.forEach(s=>drawQ(s.tex,s.pos,s.w,s.h,s.rot,s.a,E.time+s.pos[0]*.37,V,Pr));
  E.parts.forEach(p=>{const fa=Math.min(1,p.life/.4)*(p.al||1);
    if(p.st){const sp=Math.hypot(p.vx,p.vy),L=p.size*Math.min(5,1+sp*.35);sprite(p.tex,[p.x,p.y,p.z],L,p.size*.28,Math.atan2(p.vy,p.vx),fa*(.7+.3*Math.random()),V,Pr);}
    else drawQ(p.tex,[p.x,p.y,p.z],p.size*(p.ar||1),p.size,p.rot,fa,p.max-p.life+p.x*3,V,Pr);});
  gl.depthMask(true);
}
const PSG=1;
function nodeMatM(o){const f=o.off,k=o.sc*f.sc,sq=f.sq*(o.off.sqi||1),bob=o.bob||0;
  return local({p:[o.base[0]+f.x,o.base[1]+f.y+bob,o.base[2]],r:[0,o.ry+f.ry,f.rz],s:[k*(1+(1-sq)*.5),k*sq,k*(1+(1-sq)*.5)]});}
function frame(now){
  requestAnimationFrame(frame);
  if(!E.canvas||!E.canvas.isConnected||!E.mon)return;
  let dt=Math.min(.05,(now-E.last)/1000);E.last=now;if(E.hs>0){E.hs-=dt;dt*=.12;}E.time+=dt;   // hit-stop: time nearly freezes for a moment on a big hit
  const c=E.canvas,dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(2,Math.round(c.clientWidth*dpr)),h=Math.max(2,Math.round(c.clientHeight*dpr));
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  E.W=c.width;E.H=c.height;
  update(dt);draw();
}
/* ---- actions ---- */
function tween(dur,fn,delay){E.tw.push({t0:E.time+(delay||0),dur,fn});}
function at(dt,fn){E.tl.push({t:E.time+dt,fn});}
function mpos(){return[E.mon.base[0]+E.mon.off.x-.2,E.mon.img?1.5+E.mon.off.y:1.5*Math.max(1,E.mon.sc*.9),E.mon.base[2]];}
// props (src/part_props.js, tools/mkprops.py): image-AI art drawn in place of emoji objects. Pointed props face right.
const PMAP={'🗡️':'dagger','🔱':'spear','🔧':'wrench','🔩':'bolt','⚙️':'gear','🚀':'rocket','💣':'bomb','🛡️':'shield','🔮':'orb','⏳':'hourglass','💖':'heart','🐾':'paw','🍃':'leaf','🌿':'vine','🌸':'blossom','🤖':'robot0','🪶':'feather'};
function propLoad(){if(typeof PROPS==='undefined'||E.prl)return;E.prl=1;Object.keys(PROPS).forEach(k=>{const im=new Image();im.onload=()=>{try{E.tex['pr_'+k]=mkTex(im);}catch(e){}};im.src=PROPS[k].u;});}
function propTex(k,fb){return E.tex['pr_'+k]||fb;}
function propAsp(k){const p=typeof PROPS!=='undefined'&&PROPS[k];return p?p.w/p.h:1;}
// draw a sprite or particle: emoji objects become their prop (fit inside the emoji's square), 🔥/❄️/⚡ become animation frames
function drawQ(t,pos,w,h,rot,a,age,V,Pr){if(t&&t.pr){const pt=E.tex['pr_'+t.pr];if(pt){const as=propAsp(t.pr),aw=Math.abs(w),sg=w<0?-1:1;if(aw/Math.max(1e-4,h)>as)sprite(pt,pos,sg*h*as,h,rot,a,V,Pr);else sprite(pt,pos,w,aw/as,rot,a,V,Pr);return;}}
  const tx=vxSwap(t,age);sprite(tx,pos,w,h,tx===t?rot:0,a,V,Pr);}
// effect animations (src/part_vfx.js, tools/mkvfx.py): 16 frames each, image-AI sprite sheets on black
function vfxLoad(){if(typeof VFX==='undefined'||E.vxl)return;E.vxl=1;Object.keys(VFX).forEach(k=>VFX[k].u.forEach((u,i)=>{const im=new Image();im.onload=()=>{try{E.tex['vx_'+k+i]=mkTex(im);}catch(e){}};im.src=u;}));}
function vfxFrame(k,age,fps,loop){const V=typeof VFX!=='undefined'&&VFX[k];if(!V)return null;const n=V.u.length;let i=Math.floor(age*(fps||24));if(loop)i=((i%n)+n)%n;else if(i>=n)return null;return E.tex['vx_'+k+i]||null;}
// play one effect: size = half height; o: fps, loop, dur, rot, a, delay, rise (moves up over its life), grow, bottom (pos is the bottom edge, e.g. where lightning lands)
function vfx(k,pos,size,o){o=o||{};const V=typeof VFX!=='undefined'&&VFX[k];if(!V)return 0;const n=V.u.length,fps=o.fps||24,dur=o.dur||(o.loop?1:n/fps),p0=pos.slice(),
    sp={tex:null,pos:p0.slice(),w:size*(o.ar||1),h:size,rot:o.rot||0,a:0},nx={tex:null,pos:p0.slice(),w:0,h:0,rot:o.rot||0,a:0},mv=o.move||[0,0],fl=o.flip?-1:1,ph=Math.random()*6;
  at(o.delay||0,()=>E.sprites.push(sp,nx));
  // smooth playback: the next frame is blended in on top by the fraction of the way to it (no stepping between the 16 frames);
  // a gentle breathing scale and (o.sway) a swaying lean keep it alive; it fades in/out instead of popping; o.tick(pos,u) adds particles
  tween(dur,u=>{const age=u*dur,f=age*fps,fr=f-Math.floor(f),t=vfxFrame(k,age,fps,o.loop),t2=vfxFrame(k,age+1/fps,fps,o.loop);
    const env=o.hold?1:o.loop?Math.min(1,u*6,(1-u)*5):Math.min(1,u*10,(1-u)*6),A=(o.a||1)*Math.min(1,env);
    const tm=E.time+ph,br=1+.025*Math.sin(tm*9),g=(1+(o.grow||0)*u)*br*(o.loop||o.hard?1:.86+.14*ease(Math.min(1,u*7))),m=o.mease?ease(u):u,sw=o.sway?o.sway*Math.sin(tm*5.5):0;
    const w=fl*size*(o.ar||1)*g*(o.sway?1+.04*Math.sin(tm*7.3):1),h=size*g,y=o.bottom?pos[1]+h*(1-2*(o.sink||0)):p0[1],P=[p0[0]+mv[0]*m+(o.sway?sw*h*.25:0),y+(o.rise||0)*u+mv[1]*m,p0[2]];
    const rv=o.reveal?ease(Math.min(1,age/o.reveal)):1,PP=o.reveal&&o.anchor?[o.anchor[0]+(P[0]-o.anchor[0])*rv,o.anchor[1]+(P[1]-o.anchor[1])*rv,P[2]]:P;sp.tex=t;sp.a=t?A:0;sp.w=w*rv;sp.h=h;sp.pos=PP;sp.rot=(o.rot||0)+sw*.12;
    nx.tex=t2;nx.a=t&&t2?A*fr:0;nx.w=w*rv;nx.h=h;nx.pos=[PP[0],PP[1],PP[2]+.001];nx.rot=sp.rot;
    if(o.tick&&t)o.tick([P[0],o.bottom?pos[1]:P[1],P[2]],u,h);},o.delay||0);
  at((o.delay||0)+dur+.02,()=>{rmSp(sp);rmSp(nx);});return dur;}
function vxSwap(t,age){if(!t||!t.vx)return t;if(t.vx==='fire')return vfxFrame('flame_loop',age,20,true)||t;if(t.vx==='snow')return E.tex.vx_ice_burst3||t;return E.tex['vx_lightning'+(4+(Math.floor(age*15)&1))]||t;}
// living particles that go with the big effects (so they are not a flat picture)
function fxEmbers(P,h,amt){const R=Math.random,eg=sparkTex([255,170,70]);for(let j=0;j<amt;j++)E.parts.push({x:P[0]+(R()-.5)*.6,y:P[1]+R()*h*1.6,z:P[2]+.05,vx:(R()-.5)*1.2,vy:1.5+R()*2.5,vz:0,g:-.5,dr:1.5,life:.5+R()*.4,max:.9,size:.07+R()*.07,tex:eg,rot:0,vr:0,st:1});}
function fxSpray(P,h,amt){const R=Math.random,wt=gtex([200,235,255]),fm=gtex([255,255,255]);for(let j=0;j<amt;j++)E.parts.push({x:P[0]-h*.4+(R()-.5)*.5,y:P[1]+h*(.8+R()*.9),z:P[2]+.05,vx:-1.5-R()*2.5,vy:1+R()*2.5,vz:(R()-.5),g:7,life:.55,max:.55,size:.08+R()*.1,tex:R()<.5?wt:fm,rot:0,vr:0});}
function fxDust(P,h,amt,rgb){const R=Math.random,dt=gtex(rgb||[215,200,170]);for(let j=0;j<amt;j++){const a=R()*PI*2,r=.25+R()*.5;E.parts.push({x:P[0]+Math.cos(a)*r,y:P[1]+.05+R()*.35,z:P[2]+Math.sin(a)*r*.4,vx:-Math.sin(a)*2.5,vy:.4+R()*.6,vz:Math.cos(a)*.8,g:0,dr:1.5,life:.6,max:.6,size:.22+R()*.25,gs:.8,al:.45,tex:dt,rot:0,vr:0});}}
function fxGround(P,rgb,s,d){const gl=sigSp(gtex(rgb));tween(d,u=>{gl.pos=[P[0],.04,P[2]];gl.w=s*(1+.3*u);gl.h=s*.32;gl.a=.75*Math.sin(PI*Math.min(1,u*1.3));});at(d+.02,()=>rmSp(gl));}
function vfxTest(k){const t=mpos();if(k==='lightning'||k==='fire_pillar')vfx(k,[t[0],0,t[2]+.6],1.6,{bottom:1});else if(k==='flame_loop')vfx(k,[t[0],.7,t[2]+.6],.8,{loop:1,dur:2});else if(k==='tornado'||k==='sandstorm')vfx(k,[t[0],0,t[2]+.6],1.3,{bottom:1,loop:1,dur:2});else if(k==='tidal_wave')vfx(k,[t[0]+1.2,0,t[2]+.6],1.2,{bottom:1,flip:1,move:[-2.4,0],fps:20});else vfx(k,[t[0],t[1]+.3,t[2]+.6],1.5);}
// effect animation per hero / per monster element
const HV={h1:'holy_burst',h2:'holy_burst',h3:'leaf_swirl',h4:'fire_burst',h5:'ice_burst',h6:'holy_burst',h7:'dark_burst',h8:'holy_burst',h9:'fire_burst',h10:'dark_burst'};
const MV={fire:'fire_burst',dragon:'fire_burst',ice:'ice_burst',elec:'lightning',forest:'leaf_swirl',poison:'dark_burst',sea:'water_splash',ghost:'dark_burst',skel:'dark_burst',sky:'smoke_puff',mech:'hit_spark',desert:'smoke_puff'};
// effect art cut from image-AI sheets (src/part_fx.js, tools/mkfx.py): loaded once; callers pass a stand-in texture until it is ready
function fxLoad(){if(typeof FXSPR==='undefined'||E.fxl)return;E.fxl=1;Object.keys(FXSPR).forEach(k=>{const im=new Image();im.onload=()=>{try{E.tex['fx_'+k]=mkTex(im);}catch(e){}};im.src=FXSPR[k].u;});}
function fxTex(k,fb){return E.tex['fx_'+k]||fb;}
function fxAsp(k){const f=typeof FXSPR!=='undefined'&&FXSPR[k];return f?f.w/f.h:1;}
function hpos(){return[E.hero.base[0]+E.hero.off.x,1.7,E.hero.base[2]];}
function swing(dur){const h=E.hero;tween(dur,u=>{const a=u<.3?-2.2*ease(u/.3):u<.55?-2.2+2.4*ease((u-.3)/.25):.2*(1-ease((u-.55)/.45));h.armR.r[0]=a;
    h.off.y=.14*Math.sin(PI*cl(u/.6));h.off.x=.3*Math.sin(PI*cl(u/.8));h.off.sq=1-.08*Math.sin(PI*cl(u/.3));});}
// sparks: thin streaks stretched along their motion, white-hot head and coloured tail, thrown fast, slowed by air, pulled down, flickering out.
// About a quarter stay soft glows so the burst still feels warm. Colour comes from the texture (t.rgb) or gold.
function sparkTex(rgb){const k='sk'+rgb.join('-');if(E.tex[k])return E.tex[k];const c=cv(96,24),x=c.getContext('2d'),C=rgb.join(','),g=x.createLinearGradient(0,0,96,0);
  g.addColorStop(0,'rgba('+C+',0)');g.addColorStop(.55,'rgba('+C+',.9)');g.addColorStop(.82,'rgba(255,255,240,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,96,24);
  x.globalCompositeOperation='destination-in';const v=x.createLinearGradient(0,0,0,24);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(.5,'rgba(0,0,0,1)');v.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=v;x.fillRect(0,0,96,24);return E.tex[k]=mkTex(c);}
function goldBurst(p,n,sp,life,size,tx){const t=tx||E.tex.gold,rgb=(t&&t.rgb)||[255,200,90],sk=sparkTex(rgb.map(v=>Math.round(v*.85+255*.15)));
  for(let k=0;k<n;k++){const a=Math.random()*PI*2,glow=k%4===0,v=sp*(glow?.4+Math.random()*.6:.9+Math.random()*1.1),L=life*(.5+Math.random()*.6);
    E.parts.push(glow?{x:p[0],y:p[1],z:p[2],vx:Math.cos(a)*v,vy:Math.sin(a)*v*.9+sp*.2,vz:(Math.random()-.3)*v*.5,g:2.5,life:L,max:life,size:(size||.3)*(.6+Math.random()*.8),tex:t,rot:0,vr:0}
      :{x:p[0],y:p[1],z:p[2],vx:Math.cos(a)*v,vy:Math.sin(a)*v*.8+sp*.35,vz:(Math.random()-.3)*v*.4,g:7,dr:1.6,life:L*.8,max:life*.8,size:(size||.3)*(.35+Math.random()*.35),tex:sk,rot:0,vr:0,st:1});}}
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
function heroPlay(n,dur,delay){const f=()=>{if(E.hero){const o=E.hero;if(o.cur)o.ps={f:o.cur,t:E.time};o.pe=null;o.pl={n,t0:E.time,dur};}};delay?at(delay,f):f();}
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
// spirit beasts move like animals: a bounding run (rise and fall, nose up when rising, down when landing), squash on each landing and
// stretch in the air, dust at each footfall, a fading afterimage; on impact they burst into light and their element instead of vanishing
function beastRun(s,key,hh,ph,trail){const sn=Math.sin(ph),b=Math.abs(sn),land=Math.pow(1-b,3);
  s.h=hh*(1-.12*land+.05*b);s.w=hh*fxAsp(key)*(1+.1*land-.02*b);s.rot=.16*Math.cos(ph)*(sn>=0?1:-1);
  if(trail&&s.a>.5){if(Math.random()<.6)E.parts.push({x:s.pos[0],y:s.pos[1],z:s.pos[2]-.02,vx:0,vy:0,vz:0,g:0,life:.16,max:.16,size:s.h,ar:s.w/s.h,al:.6,tex:s.tex,rot:s.rot,vr:0});
    if(land>.6&&Math.random()<.5)E.parts.push({x:s.pos[0]-s.w*.3,y:.12,z:s.pos[2],vx:-.8,vy:.5,vz:0,g:0,life:.5,max:.5,size:.3,gs:.6,al:.6,tex:tSmokeG(),rot:Math.random()*6,vr:0});}
  return hh*.45*b;}
function beastPop(pos,b,hh){const et=emojiTex(b[1]),eg=gtex(b[2]),bt=fxTex(b[0],null);if(b[3]==='lightning')vfx('lightning',[pos[0]+.3,0,pos[2]+.05],Math.max(1.2,hh*1.4),{bottom:1});else if(b[3])vfx(b[3],[pos[0]+.3,pos[1],pos[2]+.05],Math.max(.9,hh*1.3));
  if(bt)E.parts.push({x:pos[0],y:pos[1],z:pos[2],vx:0,vy:0,vz:0,g:0,life:.22,max:.22,size:hh,ar:fxAsp(b[0]),al:1.6,gs:hh*4,tex:bt,rot:0,vr:0});
  flare(pos,hh*2.6,.3,eg);
  for(let j=0;j<18;j++){const a=Math.random()*PI*2,v=1.5+Math.random()*3;E.parts.push({x:pos[0]+(Math.random()-.5)*hh,y:pos[1]+(Math.random()-.5)*hh,z:pos[2],vx:Math.cos(a)*v,vy:Math.sin(a)*v+1,vz:0,g:1.5,dr:1.5,life:.7,max:.7,size:.18+Math.random()*.2,tex:j%3?eg:et,rot:a,vr:4});}}
// one beast runs from the summoner to the monster between t0 and t1 (normal attacks)
function beastDash(b,t0,t1,hh,zoff,ch,i){const key=b[0],sp={tex:emojiTex(b[1]),pos:[0,0,0],w:0,h:0,rot:0,a:0},lt=ch!=null?{tex:letterTex(ch,i),pos:[0,0,0],w:0,h:0,rot:0,a:0}:null,rmS=q=>{if(!q)return;const j=E.sprites.indexOf(q);if(j>=0)E.sprites.splice(j,1);};
  at(t0,()=>{E.sprites.push(sp);if(lt)E.sprites.push(lt);});
  tween(t1-t0,u=>{const s=hpos(),c=mpos(),x=s[0]+.9+(c[0]-.7-s[0]-.9)*u;sp.tex=fxTex(key,sp.tex);sp.a=u<.1?u/.1:1;const y=beastRun(sp,key,hh,u*PI*3,true);sp.pos=[x,hh*.92+y,s[2]+zoff];
    if(lt){lt.pos=[x,hh*2+y+.3,s[2]+zoff+.05];lt.w=lt.h=.75;lt.a=1;}},t0);
  at(t1,()=>{rmS(sp);rmS(lt);beastPop([mpos()[0]-.7,hh,hpos()[2]+zoff],b,hh);});}
// ===== normal attacks: every hero has its own path, body motion and finisher. Timing stays the same for all
// (a letter lands at ~0.74 s, the finale at ~0.68 s) so speech, sounds and the battle rhythm are unchanged. =====
function lHit(th,gl,star,k){const m=E.mon,t=mpos();k=k||1;vfx('hit_spark',[t[0]-.2,t[1]+.3,t[2]+.7],.75*k);burst(t,5,star,3.2,.32);goldBurst(t,Math.round(12*k),3.6,.45,.3,gl);flare(t,1.6*k,.3,gl);E.shake=Math.max(E.shake,.18*k);E.flash.mon=[th.fl[0],th.fl[1],th.fl[2],.5];
  tween(.26,u=>{const e=Math.sin(PI*u);m.off.x=.22*e*k;m.off.rz=-.1*e;m.off.sq=1-.1*e;});}
// a projectile (and the letter riding on it) from t0 to t1; path(u, heroPos, monPos) -> [x,y,z]
function flyL(tex,ch,i,t0,t1,path,o){o=o||{};const sp={tex,pos:[0,0,0],w:0,h:0,rot:0,a:0},lt=ch!=null?{tex:letterTex(ch,i),pos:[0,0,0],w:0,h:0,rot:0,a:0}:null;let last=null;
  at(t0,()=>{E.sprites.push(sp);if(lt)E.sprites.push(lt);});
  tween(t1-t0,u=>{const p=path(u,hpos(),mpos()),sz=o.sz||1;sp.pos=p;sp.a=1;sp.w=sz*(o.ar||1);sp.h=sz;
    if(o.orient&&last)sp.rot=Math.atan2(p[1]-last[1],p[0]-last[0])+(o.ro||0);if(o.spin)sp.rot=u*o.spin;
    if(lt){lt.pos=[p[0]-.05,p[1]+(o.ly==null?.6:o.ly),p[2]+.05];lt.w=lt.h=.75+.3*u;lt.a=1;lt.rot=.2*Math.sin(u*PI*2)*(i%2?1:-1);}
    if(o.trail&&Math.random()<.9)E.parts.push({x:p[0],y:p[1],z:p[2]-.05,vx:0,vy:0,vz:0,g:0,life:.3,max:.3,size:o.trail,gs:-.5,tex:o.ttex||tex,rot:Math.random()*6,vr:0});
    last=p;},t0);
  at(t1,()=>[sp,lt].forEach(q=>{if(!q)return;const j=E.sprites.indexOf(q);if(j>=0)E.sprites.splice(j,1);}));}
const lerp3=(a,b,e)=>[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e,a[2]+(b[2]-a[2])*e];
const HAND=s=>[s[0]+.9,s[1]+.5,s[2]+.9],TGT=c=>[c[0]-.2,c[1]+.3,c[2]+.5];
// melee: run to the monster (from wherever the hero is now) and back
function dashTo(t0,dur,back,bdur){const h=E.hero,dx=()=>(E.mon.base[0]-1.7)-h.base[0];let x0=null;
  tween(dur,u=>{if(x0===null)x0=h.off.x;h.off.x=x0+(dx()-x0)*ease(u);h.off.rz=-.12*Math.sin(PI*u);},t0);
  tween(bdur,u=>{h.off.x=dx()*(1-ease(u));h.off.y=.35*Math.sin(PI*u);},back);}
function letter(ch,i){
  if(!E.mon)return;const hid=hid0(),A=ATK[hid]||ATK.h1,th=ULT[hid]||ULT.h1,gl=utex(hid,th),star=ustar(hid,th),ray=uslash(hid,th),h=E.hero,IMP=.74;
  const hit=k=>at(IMP,()=>lHit(th,gl,star,k));
  if(hid==='h4'){heroPlay('attack',.75);   // 劍士: runs in and slashes, then hops back
    dashTo(0,.42,IMP+.04,.2);flyL(gl,ch,i,.05,IMP,(u,s,c)=>[s[0]+1.0,s[1]+.6,s[2]+.9],{sz:.6,trail:.3});
    at(IMP-.06,()=>{const t=mpos();sigLine(ray,[t[0]-.2,t[1]+.6,t[2]+.9],i%2?.7:-.7,4.2,.55,.25,gl);vfx('slash_arc',[t[0]-.2,t[1]+.6,t[2]+.95],1.0,{rot:i%2?.4:-.4});});hit(1.1);return;}
  heroAct(A.act,.75);const s0=hpos();at(.3,()=>{const f=HAND(hpos());flare(f,1.2,.25,gl);});
  if(hid==='h1'){   // 勇者: a straight thrust, the sword tip shoots a lance of light
    flyL(ray,ch,i,.45,IMP,(u,s,c)=>lerp3(HAND(s),TGT(c),u*u),{sz:.32,ar:4,orient:1,trail:.35,ttex:gl});hit(1);}
  else if(hid==='h2'){   // 魔法師: a homing star missile on a wavy S path
    flyL(gl,ch,i,.3,IMP,(u,s,c)=>{const p=lerp3(HAND(s),TGT(c),ease(u)),w=(1-u);return[p[0],p[1]+.8*Math.sin(u*PI*2)*w,p[2]+.5*Math.sin(u*PI*3)*w];},{sz:.55,trail:.32,ttex:star});hit(1);}
  else if(hid==='h3'){   // 弓箭手: a flat, very fast arrow; the archer kicks back
    at(.58,()=>{const f=HAND(hpos()),c=mpos();sigLine(ray,[(f[0]+c[0])/2,f[1],f[2]],0,(c[0]-f[0])*.55,.12,.2,gl);});
    flyL(tArrow(),ch,i,.58,IMP,(u,s,c)=>lerp3([s[0]+.9,s[1]+.35,s[2]+.9],[c[0]-.3,s[1]+.35,c[2]+.5],u),{sz:.22,ar:4,ly:.45});hit(1);}
  else if(hid==='h5'){   // 龍騎士: throws the spear in a straight line, trailing ice mist
    flyL(emojiTex('🔱'),ch,i,.4,IMP,(u,s,c)=>{const p=lerp3(HAND(s),TGT(c),u);return[p[0],p[1]+.3*Math.sin(PI*u),p[2]];},{sz:.6,orient:1,ro:0,trail:.3,ttex:gtex([170,230,255])});hit(1.05);}
  else if(hid==='h6'){   // 牧師: a ball of light floats down onto the monster inside a soft beam
    const bm=sigSp(gl);tween(.55,u=>{const c=mpos(),g=Math.sin(PI*u);bm.pos=[c[0],c[1]+2.2,c[2]+.4];bm.w=.55*g;bm.h=3.2*g;bm.a=.55*g;},.25);at(.85,()=>{const j=E.sprites.indexOf(bm);if(j>=0)E.sprites.splice(j,1);});
    flyL(gl,ch,i,.3,IMP,(u,s,c)=>[c[0],c[1]+4.2-3.9*(1-(1-u)*(1-u)),c[2]+.5],{sz:.7,trail:.3,ttex:star});hit(1);}
  else if(hid==='h7'){   // 盜賊: two quick daggers, low and flat
    const dg=emojiTex('🗡️');flyL(dg,null,i,.38,.6,(u,s,c)=>lerp3([s[0]+.9,.95,s[2]+.9],[c[0]-.3,1.1,c[2]+.5],u),{sz:.45,spin:24});at(.6,()=>lHit(th,gl,star,.5));
    flyL(dg,ch,i,.5,IMP,(u,s,c)=>lerp3([s[0]+.9,1.3,s[2]+.9],[c[0]-.3,1.5,c[2]+.5],u),{sz:.45,spin:-24});hit(.8);}
  else if(hid==='h8'){   // 召喚師: a spirit beast runs along the ground and rams the monster
    beastDash(H8B[i%4],.3,IMP,.55,1.0,ch,i);hit(1);}
  else if(hid==='h9'){   // 工程師: the shoulder cannon lobs a bolt high in the air
    at(.3,()=>{const p=hpos();goldBurst([p[0]+.4,p[1]+1.0,p[2]+.8],8,1.5,.5,.4,tSmokeG());});
    flyL(emojiTex('🔩'),ch,i,.3,IMP,(u,s,c)=>{const p=lerp3([s[0]+.5,s[1]+1.0,s[2]+.9],TGT(c),u);return[p[0],p[1]+3.0*Math.sin(PI*u),p[2]];},{sz:.5,spin:10,trail:.25,ttex:tSmokeG()});hit(1);}
  else{   // 神秘使者: a portal opens beside the monster and a crystal shoots out of it
    const pt=sigSp(tRune('#B8A8FF')),P=c=>[c[0]-1.5,c[1]+1.5,c[2]+.4];tween(.6,u=>{const c=mpos(),g=Math.sin(PI*u);pt.pos=P(c);pt.w=pt.h=.95*g;pt.rot=u*6;pt.a=g;},.2);at(.85,()=>{const j=E.sprites.indexOf(pt);if(j>=0)E.sprites.splice(j,1);});
    flyL(tCrystal(),ch,i,.5,IMP,(u,s,c)=>lerp3(P(c),TGT(c),u*u),{sz:.45,orient:1,ro:PI/2,trail:.25,ttex:gl});hit(1);}
}
function finale(word,big){
  if(!E.mon)return;const m=E.mon,hid=hid0(),A=ATK[hid]||ATK.h1,th=ULT[hid]||ULT.h1,gl=utex(hid,th),star=ustar(hid,th),ray=uslash(hid,th),wt=wordTex(word,th.gl,th.lo),h=E.hero,F=.68,rm=s=>{const j=E.sprites.indexOf(s);if(j>=0)E.sprites.splice(j,1);};
  if(hid==='h4'){heroPlay('attack',.8);dashTo(0,.32,F+.2,.25);}else heroAct(A.act,.8);
  // hero-specific finisher, landing at F
  if(hid==='h1'){   // overhead chop: hops up, a vertical crescent of light falls on the monster
    tween(.5,u=>{h.off.y=.6*Math.sin(PI*u);},.15);const cr=sigSp(ray);tween(F-.4,u=>{const c=mpos();cr.pos=[c[0],c[1]+3.6-3.2*u*u,c[2]+.8];cr.rot=PI/2;cr.w=1.8;cr.h=.6;cr.a=1;},.4);at(F,()=>rm(cr));
    at(F,()=>{const t=mpos();sigLine(ray,[t[0],t[1]+.4,t[2]+.9],PI/2,6,.9,.4,gl);});}
  else if(hid==='h2'){   // a rune opens under the monster and a pillar of light bursts up out of the ground
    const rn=sigSp(tRune('#FF8AE8')),pl=sigSp(gl);tween(1.1,u=>{const c=mpos(),g=u<.3?ease(u/.3):Math.max(0,1-(u-.6)/.4);rn.pos=[c[0],.12,c[2]+.6];rn.w=1.9*g;rn.h=.5*g;rn.rot=0;rn.a=g;},.15);
    tween(.6,u=>{const c=mpos(),g=u<.2?ease(u/.2):Math.max(0,1-(u-.2)/.8);pl.pos=[c[0],2.6,c[2]+.5];pl.w=1.2*g;pl.h=5.2*g;pl.a=.9*g;},F-.12);at(1.35,()=>{rm(rn);rm(pl);});}
  else if(hid==='h3'){   // three arrows at once: high, middle, low
    [-.5,.3,1.1].forEach((dy,k)=>flyL(tArrow(),null,k,.48,F,(u,s,c)=>lerp3([s[0]+.9,s[1]+.35,s[2]+.9],[c[0]-.3,c[1]+dy,c[2]+.5],u),{sz:.24,ar:4,orient:1}));}
  else if(hid==='h4'){   // spinning flame slash around the monster
    const ar=[0,1,2,3].map(()=>sigSp(ray));tween(.45,u=>{const c=mpos(),sp=u*14;h.off.rz=.3*Math.sin(sp);ar.forEach((s,j)=>{const a=sp+j*PI/2;s.pos=[c[0]-.5+Math.cos(a)*1.3,1.0+.3*Math.sin(a),c[2]+.6+Math.sin(a)*.5];s.rot=a+PI/2;s.w=1.8;s.h=.45;s.a=.9*Math.sin(PI*u);});
      if(Math.random()<.8)E.parts.push({x:c[0]+(Math.random()-.5)*2.4,y:.3,z:c[2]+.6,vx:0,vy:2.5,vz:0,g:0,life:.5,max:.5,size:.4,tex:emojiTex('🔥'),rot:0,vr:2});},.3);at(.8,()=>{ar.forEach(rm);h.off.rz=0;});}
  else if(hid==='h5'){   // ice spikes stab up out of the ground under the monster
    for(let j=0;j<7;j++){const s=sigSp(tShard());tween(.7,u=>{const c=mpos(),g=u<.3?ease(u/.3):1;s.pos=[c[0]-1.2+j*.4,.55*g,c[2]+.4+(j%2)*.3];s.w=.38;s.h=1.1*g*(1+.4*Math.sin(j*1.7));s.a=u<.7?1:(1-u)/.3;},F-.22+j*.02);at(F+.55+j*.02,()=>rm(s));}}
  else if(hid==='h6'){   // a cross of holy light flashes on the monster; feathers drift down
    const v=sigSp(gl),hz=sigSp(gl);tween(.7,u=>{const c=mpos(),g=u<.2?ease(u/.2):Math.max(0,1-(u-.2)/.8);v.pos=hz.pos=[c[0],c[1]+.6,c[2]+.7];v.w=.5*g;v.h=3*g;hz.w=2.2*g;hz.h=.45*g;v.a=hz.a=g;},F-.1);at(F+.65,()=>{rm(v);rm(hz);});
    at(F,()=>{const c=mpos();for(let j=0;j<8;j++)E.parts.push({x:c[0]+(Math.random()-.5)*3,y:c[1]+3,z:c[2]+.6,vx:(Math.random()-.5)*.6,vy:-1.2,vz:0,g:0,life:1.6,max:1.6,size:.3,tex:tFeather(),rot:Math.random()*6,vr:2});});}
  else if(hid==='h7'){   // daggers at three heights, then a shadow X slash
    const dg=emojiTex('🗡️');[.7,1.3,1.9].forEach((y,k)=>flyL(dg,null,k,.3+k*.05,F-.08+k*.02,(u,s,c)=>lerp3([s[0]+.9,y,s[2]+.9],[c[0]-.3,y+.1,c[2]+.5],u),{sz:.42,spin:26}));
    at(F,()=>{const t=mpos(),p=[t[0],t[1]+.6,t[2]+.9];sigLine(ray,p,.65,5,.7,.35,gl);sigLine(ray,p,-.65,5,.7,.35,gl);goldBurst(t,16,3,.6,.5,tSmoke());});}
  else if(hid==='h8'){   // all four spirit beasts charge together
    H8B.forEach((b,k)=>beastDash(b,.2+k*.06,F,.5,.5+k*.28,null,k));}
  else if(hid==='h9'){   // three small rockets curve in from different sides
    [[-1.5,3],[0,4.2],[1.2,2.6]].forEach((q,k)=>flyL(emojiTex('🚀'),null,k,.25+k*.06,F,(u,s,c)=>{const a=[s[0]+.5,s[1]+1,s[2]+.9],b=[(s[0]+c[0])/2+q[0],q[1],s[2]+.9],e=TGT(c);return bz(a,b,e,u);},{sz:.42,orient:1,ro:0,trail:.28,ttex:tSmokeG()}));}
  else{   // a small black hole opens on the monster, sucks in sparks, then pops
    const bh=sigSp(tSmoke());tween(.6,u=>{const c=mpos();bh.pos=[c[0],c[1]+.5,c[2]+.7];bh.w=bh.h=.3+1.1*ease(u);bh.rot=u*8;bh.a=.95;if(Math.random()<.9){const a=Math.random()*PI*2;E.parts.push({x:c[0]+Math.cos(a)*1.8,y:c[1]+.5+Math.sin(a)*1.4,z:c[2]+.7,vx:-Math.cos(a)*3.5,vy:-Math.sin(a)*3,vz:0,g:0,life:.45,max:.45,size:.22,tex:star,rot:0,vr:0});}},.1);at(F,()=>rm(bh));}
  // shared landing: the word appears on the monster with the big hit
  const sp={tex:wt.tex,pos:mpos(),w:0,h:0,rot:0,a:1};
  at(F,()=>{E.sprites.push(sp);const t=mpos();vfx('hit_spark',[t[0]-.2,t[1]+.3,t[2]+.7],1.2);if(hid!=='h8')vfx(HV[hid]||'holy_burst',[t[0],t[1]+.3,t[2]+.65],1.3);burst(t,20,star,5.5,.5);goldBurst(t,big?40:22,big?6.5:5,.7,.38,gl);flare(t,big?4.2:2.6,.5,gl);E.shake=big?.9:.7;E.flash.mon=[th.fl[0],th.fl[1],th.fl[2],.9];
    const rg=E.ring;if(rg){rg.p=[t[0],.05,t[2]];tween(.7,u=>{const r=.3+(big?3.2:2.2)*u;rg.s=[r,.01,r];rg.a=.95*(1-u);});}
    tween(.7,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);m.off.x=.8*e;m.off.rz=-.3*e;m.off.sq=1-.22*Math.sin(PI*cl(u*1.4));m.off.sc=1+.07*Math.sin(PI*u);});
    tween(.8,u=>{const t=mpos();sp.pos=[t[0]-.4,t[1]+.55+.3*u,t[2]+.8];const k=.42+.2*ease(Math.min(1,u*3));sp.h=k;sp.w=k*wt.asp;sp.a=u<.7?1:1-(u-.7)/.3;});});
  at(1.55,()=>rm(sp));
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
function ustar(hid,th){const k='us'+hid;if(E.tex[k])return E.tex[k];return E.tex[k]=mkTexA(sparkle(th.c),th.c);}
function uslash(hid,th){const k='ul'+hid;if(E.tex[k])return E.tex[k];const c=cv(256,40),x=c.getContext('2d'),r='rgba('+th.c.join(',')+',';let g=x.createLinearGradient(0,0,256,0);g.addColorStop(0,r+'0)');g.addColorStop(.5,r+'1)');g.addColorStop(1,r+'0)');x.fillStyle=g;x.beginPath();x.moveTo(0,20);x.quadraticCurveTo(128,0,256,20);x.quadraticCurveTo(128,40,0,20);x.fill();
  g=x.createLinearGradient(0,0,256,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.moveTo(20,20);x.quadraticCurveTo(128,11,236,20);x.quadraticCurveTo(128,29,20,20);x.fill();return E.tex[k]=mkTex(c);}
// ===== signature ultimates (unique look per hero) =====
function prT(name,t){if(t&&!t.pr)t.pr=name;return t;}   // drawQ draws prop art 'name' instead, once it is in PROPS
// a sprite drawn behind the hero and the monster (e.g. wings growing from the back); removed after `until` seconds
function backSp(tex,until){const s={tex,pos:[0,0,0],w:0,h:0,rot:0,a:0};(E.backs=E.backs||[]).push(s);at(until,()=>{const j=E.backs.indexOf(s);if(j>=0)E.backs.splice(j,1);});return s;}
function sigTex(k,w,h,f){if(E.tex[k])return E.tex[k];const c=cv(w,h),x=c.getContext('2d');f(x,w,h);return E.tex[k]=mkTex(c);}
const tSword=()=>prT('lightsword',sigTex('sg_sword',160,420,(x,w,h)=>{x.shadowColor='rgba(255,220,100,1)';x.shadowBlur=26;
  const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#FFE9A0');g.addColorStop(.5,'#FFFFFF');g.addColorStop(1,'#FFD060');x.fillStyle=g;
  x.beginPath();x.moveTo(62,120);x.lineTo(98,120);x.lineTo(98,360);x.lineTo(80,408);x.lineTo(62,360);x.closePath();x.fill();
  x.fillStyle='#FFC83D';x.fillRect(28,96,104,24);x.beginPath();x.arc(28,108,12,0,7);x.arc(132,108,12,0,7);x.fill();
  x.fillStyle='#FFFFFF';x.fillRect(72,34,16,64);x.beginPath();x.arc(80,26,16,0,7);x.fill();
  x.shadowBlur=0;x.strokeStyle='rgba(255,200,80,.85)';x.lineWidth=4;x.beginPath();x.moveTo(80,128);x.lineTo(80,380);x.stroke();}));
const tDragon=()=>sigTex('sg_dragon',256,256,(x,w,h)=>{x.font='200px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('🐲',128,138);x.globalCompositeOperation='source-atop';x.fillStyle='rgba(110,190,255,.62)';x.fillRect(0,0,w,h);x.fillStyle='rgba(235,248,255,.22)';x.fillRect(0,0,w,h);});
const tSmoke=()=>sigTex('sg_smoke',128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(40,10,80,.9)');g.addColorStop(.6,'rgba(60,20,110,.45)');g.addColorStop(1,'rgba(60,20,110,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
const tShard=()=>prT('icespike',sigTex('sg_shard',96,96,(x,w,h)=>{const g=x.createLinearGradient(20,0,76,96);g.addColorStop(0,'#FFFFFF');g.addColorStop(.5,'#BDEBFF');g.addColorStop(1,'#5CC0FF');x.fillStyle=g;x.shadowColor='#9FE0FF';x.shadowBlur=10;
  x.beginPath();x.moveTo(48,4);x.lineTo(68,52);x.lineTo(48,92);x.lineTo(28,52);x.closePath();x.fill();x.shadowBlur=0;x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=2;x.beginPath();x.moveTo(48,4);x.lineTo(48,92);x.stroke();}));
const tIce=()=>prT('iceblock',sigTex('sg_ice',256,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(225,246,255,.88)');g.addColorStop(.5,'rgba(130,205,255,.58)');g.addColorStop(1,'rgba(90,170,255,.72)');
  x.fillStyle=g;x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=6;x.beginPath();x.moveTo(62,18);x.lineTo(194,18);x.lineTo(238,60);x.lineTo(238,210);x.lineTo(194,240);x.lineTo(62,240);x.lineTo(18,210);x.lineTo(18,60);x.closePath();x.fill();x.stroke();
  x.strokeStyle='rgba(255,255,255,.75)';x.lineWidth=5;x.beginPath();x.moveTo(60,50);x.lineTo(110,90);x.moveTo(190,60);x.lineTo(150,120);x.moveTo(70,200);x.lineTo(120,160);x.stroke();}));
function sigBase(sentence,th,hid){
  const m=E.mon,gl=utex(hid,th),rm=s=>{const j=E.sprites.indexOf(s);if(j>=0)E.sprites.splice(j,1);};
  const words=String(sentence||'').replace(/[“”"]/g,'').split(/\s+/).filter(Boolean).slice(0,9);if(!words.length)words.push('!');
  const n=words.length,T=words.map((w,k)=>sentTex(w,th.hues[k%th.hues.length],th.gl,th.lo)),sps=T.map(t=>({tex:t.tex,pos:mpos(),w:0,h:0,rot:0,a:0}));
  const ban={tex:null,asp:1},bsp={tex:null,pos:mpos(),w:0,h:0,rot:0,a:0};   // no name banner: the stage shows English only
  const K={m,gl,rm,n,T,sps,ban,bsp,wsz:.56,hid,th,star:ustar(hid,th)};E.ulgl=gl;E.ulstar=K.star;sigCharge(K);return K;}
// charge-up shared by every ultimate: motes of light spiral up around the hero (no aura sprite: it would be drawn over the hero and wash him out)
function sigCharge(K){
  tween(1.3,u=>{const p=hpos();
    if(u<.8)for(let j=0;j<2;j++){const a=Math.random()*PI*2,R=.7+Math.random()*.5;E.parts.push({x:p[0]+Math.cos(a)*R,y:.2+Math.random()*.6,z:p[2]+Math.sin(a)*R*.6,vx:-Math.cos(a)*.35,vy:1.6+Math.random()*1.4,vz:0,g:0,dr:.6,life:.8,max:.8,size:.14+Math.random()*.14,gs:-.1,tex:Math.random()<.5?K.star:K.gl,rot:0,vr:2});}});
}
function sigBanner(K,tot){return;E.sprites.push(K.bsp);tween(tot,u=>{const t=u*tot,c=mpos();K.bsp.pos=[c[0]-.1,c[1]+2.6,c[2]+.9];const bk=ease(cl(t/.35)),bf=t>1.6?Math.max(0,1-(t-1.6)/.5):1;K.bsp.h=.95*bk;K.bsp.w=K.bsp.h*K.ban.asp;K.bsp.a=bf;});}
function sigWords(K,fn,tot){const halo=K.sps.map(()=>({tex:K.gl,pos:mpos(),w:0,h:0,rot:0,a:0})),last=K.sps.map(()=>null);
  halo.forEach(h=>E.sprites.push(h));K.sps.forEach(s=>E.sprites.push(s));
  tween(tot,u=>{const t=u*tot,c=mpos();for(let k=0;k<K.n;k++){const r=fn(k,t,c),s=K.sps[k],H=halo[k];if(!r){s.a=0;H.a=0;last[k]=null;continue;}s.pos=r.pos;s.a=r.a===undefined?1:r.a;s.rot=r.rot||0;const g=(r.sc===undefined?1:r.sc)*K.wsz;s.h=g;s.w=g*K.T[k].asp;
      H.pos=[r.pos[0],r.pos[1],r.pos[2]-.05];H.w=s.w*1.15+g*.8;H.h=g*2.1;H.a=.38*s.a*(.85+.15*Math.sin(t*7+k));
      const L=last[k];if(L&&s.a>.2){const d=Math.hypot(r.pos[0]-L[0],r.pos[1]-L[1]);if(d>.04&&Math.random()<Math.min(1,d*6))E.parts.push({x:r.pos[0]+(Math.random()-.5)*s.w*.6,y:r.pos[1]+(Math.random()-.5)*g*.5,z:r.pos[2]-.08,vx:(L[0]-r.pos[0])*4,vy:(L[1]-r.pos[1])*4+.2,vz:0,g:0,dr:2.5,life:.45,max:.45,size:.12+Math.random()*.12,gs:-.15,tex:Math.random()<.6?K.star:K.gl,rot:Math.random()*6,vr:3});}
      last[k]=r.pos.slice();}});
  at(tot+.05,()=>halo.forEach(K.rm));}
function sigLine(ray,pos,ang,len,hh,dur,gl){const sp={tex:ray,pos:pos,w:0,h:hh,rot:ang,a:1};E.sprites.push(sp);tween(dur,v=>{sp.w=len*(.3+.8*ease(v));sp.a=1-v*v;sp.h=hh*(1-v*.5);});at(dur+.04,()=>{const j=E.sprites.indexOf(sp);if(j>=0)E.sprites.splice(j,1);});}
function hitstop(d){E.hs=Math.max(E.hs||0,Math.min(d,.07));}   // short: a long freeze looks stiff
function sigRing(t,R,dur){hitstop(.11);const G=E.ulgl||E.tex.gold,ST=E.ulstar||G,wave={tex:G,pos:[t[0],t[1]+.3,t[2]+.4],w:0,h:0,rot:0,a:0};E.sprites.push(wave);
  tween(.9,u=>{const e=1-Math.pow(1-u,3);wave.w=wave.h=1.5+7.5*e;wave.a=.55*(1-u)*(1-u);});at(.95,()=>{const j=E.sprites.indexOf(wave);if(j>=0)E.sprites.splice(j,1);});
  at(.15,()=>{for(let j=0;j<22;j++){const a=Math.random()*PI*2,v=.6+Math.random()*1.6;E.parts.push({x:t[0]+(Math.random()-.5)*1.4,y:t[1]+(Math.random()-.2)*1.6,z:t[2]+.5,vx:Math.cos(a)*v,vy:.4+Math.random()*1.0,vz:0,g:-.3,dr:1.2,life:1.4+Math.random()*.6,max:2,size:.12+Math.random()*.16,gs:-.05,tex:Math.random()<.55?ST:G,rot:Math.random()*6,vr:1.5});}});
  const rg=E.ring;if(rg)tween(dur,u=>{rg.p=[t[0],.05,t[2]];const r=.3+R*u;rg.s=[r,.01,r];rg.a=.95*(1-u);});}
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
const tArrow=()=>prT('lightarrow',sigTex('sg_arrow',192,48,(x)=>{x.shadowColor='#7CFF8A';x.shadowBlur=8;x.fillStyle='#E8FFD8';x.fillRect(14,21,134,6);x.fillStyle='#fff';x.beginPath();x.moveTo(184,24);x.lineTo(146,10);x.lineTo(146,38);x.closePath();x.fill();x.fillStyle='#4CCB5A';x.beginPath();x.moveTo(6,10);x.lineTo(34,24);x.lineTo(6,38);x.lineTo(16,24);x.closePath();x.fill();}));
const tBow=()=>prT('windbow',sigTex('sg_bow',128,256,(x)=>{x.shadowColor='#7CFF8A';x.shadowBlur=14;x.lineCap='round';x.strokeStyle='#EFFFE0';x.lineWidth=10;x.beginPath();x.moveTo(34,14);x.quadraticCurveTo(140,128,34,242);x.stroke();x.strokeStyle='#5FD86A';x.lineWidth=4;x.stroke();
  x.shadowBlur=6;x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=2;x.beginPath();x.moveTo(34,14);x.lineTo(34,242);x.stroke();}));
const tCrack=()=>sigTex('sg_crack',512,512,(x)=>{let sd=7;const rn=()=>(sd=(sd*16807)%2147483647)/2147483647;x.translate(256,256);x.lineCap='round';x.lineJoin='round';const rays=[];
  for(let i=0;i<11;i++){let r=0,an=i/11*PI*2+rn()*.4;const pts=[[0,0]];while(r<240){r+=24+rn()*30;an+=(rn()-.5)*.5;const rr=Math.min(r,248);pts.push([Math.cos(an)*rr,Math.sin(an)*rr]);}rays.push(pts);}
  const draw=(w,c,b)=>{x.strokeStyle=c;x.lineWidth=w;x.shadowColor='#B49CFF';x.shadowBlur=b;rays.forEach(p=>{x.beginPath();x.moveTo(p[0][0],p[0][1]);p.forEach(q=>x.lineTo(q[0],q[1]));x.stroke();});
    [2,4,6].forEach(k=>{x.beginPath();rays.forEach((p,i)=>{const q=p[Math.min(p.length-1,k)];i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]);});x.closePath();x.stroke();});};
  draw(7,'rgba(170,140,255,.55)',18);draw(2.5,'rgba(255,255,255,.95)',6);});
const tBone=()=>prT('bone',sigTex('sg_bone',64,256,(x)=>{const g=x.createLinearGradient(8,0,56,0);g.addColorStop(0,'#CBBF9E');g.addColorStop(.45,'#FFFDF2');g.addColorStop(1,'#B9AC88');x.fillStyle=g;x.strokeStyle='#6E6250';x.lineWidth=3;
  x.beginPath();x.moveTo(32,6);x.quadraticCurveTo(44,120,43,212);x.quadraticCurveTo(60,222,52,240);x.quadraticCurveTo(32,252,12,240);x.quadraticCurveTo(4,222,21,212);x.quadraticCurveTo(20,120,32,6);x.closePath();x.fill();x.stroke();
  x.strokeStyle='rgba(120,100,70,.5)';x.lineWidth=2;x.beginPath();x.moveTo(31,60);x.lineTo(33,200);x.stroke();}));
const tSmokeG=()=>sigTex('sg_smokeg',128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(110,110,120,.85)');g.addColorStop(.6,'rgba(90,90,100,.45)');g.addColorStop(1,'rgba(90,90,100,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
function sigHit(m){tween(.2,u=>{const e=Math.sin(PI*u);m.off.x=.18*e;m.off.sq=1-.1*e;});}
function sigBig(m,t,tex,gl,ring){if(E.fin3){E.fin3=0;qk(0,.9,18);E.bgFlash=1;try{SFX.uHit('fire','L')}catch(e){}vfx(vfxOr('explosion_big','holy_burst'),[t[0],t[1]+.3,t[2]+.9],2.6,{delay:.08});const sp={tex:tRing('#FFE9A0'),pos:[t[0],.08,t[2]+.7],w:0,h:0,rot:0,a:0};E.sprites.push(sp);tween(.9,u=>{sp.w=1+9*ease(u);sp.h=sp.w*.28;sp.a=.9*(1-u);});at(.92,()=>rmSp(sp));}vfx('hit_spark',[t[0]-.2,t[1]+.3,t[2]+.75],1.7);vfx(HV[hid0()]||'holy_burst',[t[0],t[1]+.4,t[2]+.7],2.1);flare(t,6,.6,gl);goldBurst(t,60,7,.9,.4,gl);burst(t,22,tex,6.5,.6);E.shake=1.2;sigRing(t,4.4,.8);
  tween(.8,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);m.off.x=.9*e;m.off.rz=-.3*e;m.off.sq=1-.22*Math.sin(PI*cl(u*1.4));});}
const bz=(a,b,c,t)=>[(1-t)*(1-t)*a[0]+2*(1-t)*t*b[0]+t*t*c[0],(1-t)*(1-t)*a[1]+2*(1-t)*t*b[1]+t*t*c[1],(1-t)*(1-t)*a[2]+2*(1-t)*t*b[2]+t*t*c[2]];
function sigFlame(pos,life,fire){if(typeof VFX!=='undefined'){vfx('flame_loop',[pos[0],pos[1]+.25,pos[2]],.55,{loop:1,dur:life,rise:.5});return;}const sp={tex:fire,pos:pos.slice(),w:.9,h:.9,rot:0,a:1};E.sprites.push(sp);tween(life,u=>{sp.pos[1]=pos[1]+.9*u;sp.w=sp.h=(.5+.6*Math.sin(PI*Math.min(1,u*1.5)))*1.1;sp.rot=.25*Math.sin(u*30);sp.a=u<.7?1:1-(u-.7)/.3;});at(life+.05,()=>{const j=E.sprites.indexOf(sp);if(j>=0)E.sprites.splice(j,1);});}
// --- 弓箭手：百箭齊發 (horizontal: the words load onto the bow, a straight volley, then one charged wind arrow pierces right through) ---
function sigH3(sentence,th){const K=sigBase(sentence,th,'h3'),{m,gl,rm,n}=K,arrow=tArrow(),wind=uslash('h3',th),leaf=emojiTex('🍃'),h=E.hero,NV=n+6,V0=1.5,DT=.09,CH=V0+NV*DT+.2,FIRE=CH+.9,TOT=FIRE+1.4;
  swing(.8);
  const bow=()=>{const p=hpos();return[p[0]+1.0,p[1]+.3,p[2]+.9];};
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const B=bow(),f=ease(cl((t-.1-k*.05)/.6)),sp=k-(n-1)/2,tg=[B[0]+.5,B[1]+sp*.42,B[2]],tl=V0+k*DT;
    if(t<tl)return{pos:[B[0]+(tg[0]-B[0])*f+.08*Math.sin(t*9+k),B[1]+(tg[1]-B[1])*f,B[2]],a:1,sc:.5+.3*f};
    const q=cl((t-tl)/.28);if(q>=1)return null;const e=q*q;return{pos:[tg[0]+(c[0]-tg[0])*e,tg[1]+(c[1]+.6+sp*.15-tg[1])*e,tg[2]+(c[2]+.5-tg[2])*q],a:1,sc:.8};},TOT);
  const vol=[];for(let i=0;i<NV;i++)vol.push({s:sigSp(arrow),y:(Math.random()-.5)*1.6,tl:V0+i*DT,done:0});
  const big=sigSp(arrow),bigG=sigSp(gl),swirls=[0,1,2,3].map(()=>sigSp(wind));
  // the archer leans back while drawing the big arrow, then snaps forward on release
  tween(.3,u=>{h.off.x=-.35*ease(u);h.off.rz=.08*ease(u);},CH);tween(.2,u=>{h.off.x=-.35+.6*ease(u);h.off.rz=.08*(1-ease(u));},FIRE);tween(.4,u=>{h.off.x=.25*(1-ease(u));},FIRE+.3);
  tween(TOT,u=>{const t=u*TOT,c=mpos(),B=bow();
    vol.forEach(v=>{const q=(t-v.tl)/.22;if(q<0||q>1){v.s.a=0;if(q>1&&!v.done){v.done=1;goldBurst([c[0]-.3,c[1]+.5+v.y*.6,c[2]+.6],6,2.5,.35,.26,gl);if(Math.random()<.5){E.shake=Math.max(E.shake,.25);sigHit(m);E.flash.mon=[.8,1,.7,.45];}}return;}
      v.s.pos=[B[0]+(c[0]-.3-B[0])*q,B[1]+v.y*(1-q)+(c[1]+.5+v.y*.6-B[1])*q,B[2]];v.s.rot=0;v.s.w=1.3;v.s.h=.32;v.s.a=1;});
    const ck=ease(cl((t-CH)/.5)),fq=cl((t-FIRE)/.35),gone=t>FIRE+.35;
    if(t<CH||gone){big.a=0;bigG.a=0;}
    else{const x=B[0]+.6+(c[0]+6-B[0])*fq*fq;big.pos=[x,B[1],B[2]+.1];big.w=2.6*ck;big.h=.62*ck;big.a=1;big.rot=0;bigG.pos=big.pos;bigG.w=3.2*ck*(1+.15*Math.sin(t*20));bigG.h=1.6*ck;bigG.a=.6*ck;
      if(fq>0)for(let j=0;j<3;j++)E.parts.push({x:x-.8,y:B[1]+(Math.random()-.5)*.4,z:B[2],vx:-2,vy:(Math.random()-.5)*1.5,vz:0,g:0,dr:2,life:.5,max:.5,size:.3,tex:Math.random()<.4?leaf:gl,rot:Math.random()*6,vr:4});}
    swirls.forEach((s,j)=>{if(t<CH+.1||gone){s.a=0;return;}const x=fq>0?big.pos[0]-j*.6:B[0]+.6+j*.2;s.pos=[x,B[1]+.35*Math.sin(t*14+j*1.6),B[2]+.15];s.w=1.6;s.h=.25;s.rot=.4*Math.sin(t*14+j*1.6);s.a=.7*ck;});});
  at(FIRE+.22,()=>{const t=mpos();sigLine(wind,[t[0],t[1]+.6,t[2]+.9],0,14,1.1,.55,gl);sigBig(m,t,leaf,gl);E.flash.mon=[.85,1,.75,1];burst(t,24,leaf,7,.5);});
  at(TOT,()=>{[...K.sps,...vol.map(v=>v.s),big,bigG,...swirls].forEach(rm);h.off.x=0;h.off.rz=0;});return TOT;}
// --- 劍士：烈焰斬 (three sword sweeps send flame crescents racing along the ground; then a fire tornado erupts under the monster) ---
function sigH4(sentence,th){const K=sigBase(sentence,th,'h4'),{m,gl,rm,n}=K,fire=emojiTex('🔥'),emb=gtex([255,140,40]),ray=uslash('h4',th),h=E.hero,W=[1.3,2.0,2.7],ER=3.5,TOT=ER+1.6;
  const crest=W.map(()=>({c:sigSp(ray),g:sigSp(emb)}));
  W.forEach((ts,j)=>{at(ts-.25,()=>swing(.45));tween(.2,u=>{h.off.x=.4*Math.sin(PI*u);h.off.rz=(j%2?.12:-.12)*Math.sin(PI*u);},ts-.05);});
  // the words ride the three crescents
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const j=k%3,ts=W[j],p0=hpos(),from=[p0[0]+.9,p0[1]+.6,p0[2]+.9],sp=Math.floor(k/3);
    if(t<ts){const f=ease(cl((t-.1-k*.04)/.6)),tg=[p0[0]+.6+sp*.15,p0[1]+1.9+j*.45,p0[2]+.9];return{pos:[from[0]+(tg[0]-from[0])*f,from[1]+(tg[1]-from[1])*f,from[2]],a:1,sc:.45+.3*f,rot:.1*Math.sin(t*6+k)};}
    const q=cl((t-ts)/.55);if(q>=1)return null;return{pos:[p0[0]+1.2+(c[0]-p0[0]-1.2)*q,.55+sp*.38+j*.1,p0[2]+1.0],a:1,sc:.65};},TOT);
  tween(TOT,u=>{const t=u*TOT,c=mpos(),p=hpos();crest.forEach((o,j)=>{const q=(t-W[j])/.55;if(q<0||q>1){o.c.a=o.g.a=0;return;}const x=p[0]+1.2+(c[0]-p[0]-1.2)*q;
      o.c.pos=[x,.8,p[2]+1.05];o.c.w=1.4;o.c.h=1.6;o.c.rot=PI/2+(j%2?.25:-.25);o.c.a=1;o.g.pos=[x,.7,p[2]+1.0];o.g.w=1.6;o.g.h=1.8;o.g.a=.6;
      if(Math.random()<.9)E.parts.push({x:x-.3,y:.15+Math.random()*.5,z:p[2]+1,vx:-1,vy:1.6+Math.random(),vz:0,g:0,life:.5,max:.5,size:.4+Math.random()*.25,tex:Math.random()<.6?fire:emb,rot:0,vr:2});});});
  W.forEach(ts=>at(ts+.55,()=>{const t=mpos();goldBurst(t,14,4,.4,.3,emb);E.shake=Math.max(E.shake,.45);E.flash.mon=[1,.6,.3,.7];sigHit(m);for(let q=0;q<3;q++)sigFlame([t[0]+(q-1)*.6,.4,t[2]+.9],.7,fire);}));
  const tor=[];for(let i=0;i<14;i++)tor.push(sigSp(fire));
  tween(1.5,u=>{const c=mpos(),t=u*1.5;tor.forEach((s,i)=>{const lv=i/14,a=t*9+i*2.1,r=(.5+lv*1.1)*(u<.15?u/.15:1),y=.2+lv*3.6*ease(cl(u/.35));s.pos=[c[0]+Math.cos(a)*r,y,c[2]+.6+Math.sin(a)*r*.5];s.w=s.h=.8+lv*.5;s.rot=a*.2;s.a=u<.75?1:(1-u)/.25;});},ER);
  at(ER+.2,()=>{const t=mpos();sigBig(m,t,fire,emb);E.flash.mon=[1,.55,.2,1];});
  at(TOT,()=>{[...K.sps,...crest.flatMap(o=>[o.c,o.g]),...tor].forEach(rm);h.off.x=0;h.off.rz=0;});return TOT;}
// --- 召喚師：精靈召喚 (a golden summoning circle opens on the ground; four elemental spirit beasts burst out carrying the words and charge the monster; then the lion leaps out and pounces) ---
const H8B=[['h8_cat','🔥',[255,140,40],'fire_burst'],['h8_fox','❄️',[140,220,255],'ice_burst'],['h8_rabbit','⚡',[200,230,255],'lightning'],['h8_panda','🍃',[120,235,140],'leaf_swirl']];
function sigH8(sentence,th){const K=sigBase(sentence,th,'h8'),{m,gl,rm,n}=K,gold=gtex([255,215,110]),shard=tShard();
  const B0=1.0,BS=.55,LR=B0+4*BS+.2,LJ=LR+.6,HIT=LJ+.55,TOT=HIT+1.3,HB=1.1,LH=2.2;
  const CWh=1.8,CHh=CWh/fxAsp('h8_circle'),GC=()=>{const p=hpos();return[p[0]+1.8,.05,p[2]+1.1];};
  const circ=sigSp(gold),cg=sigSp(gold),lg=sigSp(gold),lion=sigSp(gold),bs=H8B.map(b=>({sp:sigSp(gl),k:b}));
  // the circle: grows in, pulses while the lion rises, fades after the final hit
  tween(TOT,u=>{const t=u*TOT,G=GC(),g=ease(cl((t-.15)/.5))*(t>HIT?Math.max(0,1-(t-HIT)/.6):1),pl=1+(t>LR-.3&&t<LJ?.12*Math.sin(PI*cl((t-LR+.3)/.9)):0);
    circ.tex=fxTex('h8_circle',gold);circ.w=CWh*g*pl;circ.h=CHh*g*pl;circ.pos=[G[0],G[1]+.5*circ.h,G[2]];circ.a=g;
    cg.pos=[G[0],.35,G[2]-.05];cg.w=CWh*1.3*g;cg.h=.9*g;cg.a=.35*g*(.8+.2*Math.sin(t*6));
    if(g>.5&&Math.random()<.7)E.parts.push({x:G[0]+(Math.random()-.5)*CWh*1.6,y:.1,z:G[2]+(Math.random()-.5)*.4,vx:0,vy:1.4+Math.random()*1.2,vz:0,g:0,life:.8,max:.8,size:.14+Math.random()*.1,gs:-.1,tex:K.star,rot:0,vr:2});});
  const bpos=(j,t,c)=>{const ts=B0+j*BS,G=GC();if(t<ts-.3)return null;
    if(t<ts){const f=ease(cl((t-(ts-.3))/.3));return{p:[G[0],.1+HB*f,G[2]+.05],s:.35+.65*f,a:f,run:0};}
    const q=cl((t-ts)/.38);if(q>=1)return null;const e=q*q*(3-2*q);return{p:[G[0]+(c[0]-.7-G[0])*e,HB+.25*Math.sin(PI*q),G[2]+.05+(c[2]+.5-G[2]-.05)*q],s:1,a:1,run:1};};
  tween(TOT,u=>{const t=u*TOT,c=mpos();bs.forEach((b,j)=>{const r=bpos(j,t,c),s=b.sp;s.tex=fxTex(b.k[0],gl);if(!r){s.a=0;return;}s.a=r.a;
    if(r.run){const y=beastRun(s,b.k[0],HB,(t-B0-j*BS)*16,true);s.pos=[r.p[0],HB*.92+y,r.p[2]];}
    else{const f=r.s,st=Math.sin(PI*cl((f-.35)/.65));s.h=HB*f*(1+.18*st);s.w=HB*f*fxAsp(b.k[0])*(1-.12*st);s.rot=0;s.pos=r.p;}
    const hh=s.h;if(r.run&&Math.random()<.9)E.parts.push({x:r.p[0]-hh*.9,y:r.p[1]-.3+(Math.random()-.5)*.7,z:r.p[2],vx:-2.2,vy:.5,vz:0,g:0,dr:2,life:.45,max:.45,size:.3,gs:-.2,tex:Math.random()<.5?emojiTex(b.k[1]):gtex(b.k[2]),rot:Math.random()*6,vr:3});});});
  // words wait over the summoner, then hop onto their beast as it climbs out
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const j=k%4,fl=Math.floor(k/4),p=hpos(),hv=[p[0]+.3+(k-(n-1)/2)*.42,p[1]+1.6+.1*Math.sin(t*3+k),p[2]+.6],r=bpos(j,t,c);
    if(!r)return t<B0+j*BS?{pos:hv,a:ease(cl((t-.1)/.5)),sc:.4}:null;
    const f=r.run?1:r.s,tg=[r.p[0],r.p[1]+HB*r.s+.2+fl*.38,r.p[2]+.05];return{pos:[hv[0]+(tg[0]-hv[0])*f,hv[1]+(tg[1]-hv[1])*f,hv[2]+(tg[2]-hv[2])*f],a:1,sc:.45};},TOT);
  H8B.forEach((b,j)=>at(B0+j*BS+.38,()=>{const t=mpos(),et=emojiTex(b[1]),eg=gtex(b[2]);beastPop([t[0]-.7,HB,GC()[2]+.05],b,HB);burst(t,12,et,5,.5);goldBurst(t,16,4,.45,.3,eg);flare(t,2.6,.35,eg);E.shake=Math.max(E.shake,.45);E.flash.mon=[b[2][0]/255,b[2][1]/255,b[2][2]/255,.7];sigHit(m);
    if(j===0)for(let q=0;q<4;q++)sigFlame([t[0]+(q-1.5)*.5,.35,t[2]+.9],.7,et);
    if(j===1)burst(t,14,shard,6,.45);
    if(j===2)for(let q=0;q<6;q++)E.parts.push({x:t[0]+(Math.random()-.5)*1.4,y:t[1]+3.5,z:t[2]+.7,vx:0,vy:-14,vz:0,g:0,life:.25,max:.25,size:.55,tex:et,rot:0,vr:0});
    if(j===3)for(let q=0;q<16;q++){const a=q/16*PI*2;E.parts.push({x:t[0]+Math.cos(a)*.4,y:t[1]+.2,z:t[2]+.6,vx:Math.cos(a)*3,vy:1.5+Math.sin(a)*2,vz:0,g:1,dr:1,life:.9,max:.9,size:.4,tex:et,rot:a,vr:6});}}));
  // the lion: rises out of the circle, roars, leaps in an arc and pounces
  tween(TOT-LR,u=>{const t=LR+u*(TOT-LR),c=mpos(),G=GC(),y0=.2+LH*.9,y1=c[1]+.3;lion.tex=fxTex('h8_lion',gold);let p,s=1,a=1,rot=0;
    if(t<LJ){const f=ease(cl((t-LR)/.45)),roar=Math.sin(PI*cl((t-LR-.42)/.3));p=[G[0],.2+(y0-.2)*f,G[2]-.1];s=(.3+.7*f)*(1+.07*roar);a=f;rot=.04*roar;}
    else if(t<HIT){const q=(t-LJ)/(HIT-LJ),e=q*q*(3-2*q);p=[G[0]+(c[0]-.3-G[0])*e,y0+(y1-y0)*e+1.4*Math.sin(PI*q),G[2]-.1+(c[2]+.6-G[2])*q];rot=.2-.45*q;s=1+.08*Math.sin(PI*q);
      if(Math.random()<.8)E.parts.push({x:lion.pos[0],y:lion.pos[1],z:lion.pos[2]-.02,vx:0,vy:0,vz:0,g:0,life:.18,max:.18,size:lion.h,ar:lion.w/Math.max(.01,lion.h),al:.55,tex:lion.tex,rot:lion.rot,vr:0});}
    else{p=[c[0]-.3,y1,c[2]+.6];a=Math.max(0,1-(t-HIT)/.4);}
    const st=t>LJ&&t<HIT?Math.sin(PI*(t-LJ)/(HIT-LJ)):0;lion.pos=p;lion.h=LH*s*(1-.06*st);lion.w=LH*s*fxAsp('h8_lion')*(1+.14*st);lion.a=a;lion.rot=rot;lg.pos=[p[0],p[1],p[2]-.05];lg.w=lg.h=LH*1.4*s;lg.a=.35*a;},LR);
  at(LR+.45,()=>{const G=GC();flare([G[0],1.6,G[2]],4,.5,gold);E.shake=Math.max(E.shake,.6);goldBurst([G[0],1.5,G[2]],30,4,.7,.35,gold);});
  at(HIT,()=>{const t=mpos();sigBig(m,t,K.star,gold);burst(t,20,K.star,7,.6);beastPop([t[0]-.3,t[1]+.3,t[2]+.6],['h8_lion','✨',[255,215,110]],LH*.8);goldBurst(t,40,6,1.0,.4,gold);E.flash.mon=[1,.95,.6,1];});
  at(TOT,()=>{[...K.sps,circ,cg,lg,lion,...bs.map(b=>b.sp)].forEach(rm);});return TOT;}
Object.assign(SIGF,{h2:sigH2,h3:sigH3,h4:sigH4,h6:sigH6,h8:sigH8,h9:sigH9,h10:sigH10});
// ===== second ultimates (第二大絕招): test lab only for now, not used in battles =====
const ULT2N={h1:'光盾衝鋒',h2:'冰火雙星',h3:'藤蔓束縛',h4:'烈焰旋風斬',h5:'龍槍流星',h6:'天使光柱',h7:'飛刀風暴',h8:'精靈大遊行',h9:'機器人援軍',h10:'時間停止'};
// 勇者：光盾衝鋒 — a golden shield forms, the hero charges into the monster, a dome of light bursts
function s2H1(sentence,th){const K=sigBase(sentence,th,'h1'),{m,gl,rm,n}=K,h=E.hero,shield=emojiTex('🛡️'),ray=uslash('h1',th),D=1.4,TOT=D+1.8,dx=()=>(m.base[0]-1.9)-h.base[0];
  const sh=sigSp(shield),shG=sigSp(gl);
  sigWords(K,(k,t,c)=>{if(t<.1||t>D+.3)return null;const p=hpos(),a=t*3+k/n*PI*2,R=1.3*ease(cl((t-.1)/.5));return{pos:[p[0]+.9+Math.cos(a)*R*.5,p[1]+.2+Math.sin(a)*R,p[2]+1],a:1,sc:.45};},TOT);
  tween(TOT,u=>{const t=u*TOT,p=hpos(),g=ease(cl(t/.4))*(t<D+.3?1:Math.max(0,1-(t-D-.3)/.6));sh.pos=[p[0]+.9,p[1],p[2]+1.1];sh.w=sh.h=1.5*g;sh.a=g;shG.pos=[sh.pos[0],sh.pos[1],sh.pos[2]-.05];shG.w=shG.h=2.6*g*(1+.1*Math.sin(t*12));shG.a=.55*g;
    if(t>D&&t<D+.3)for(let j=0;j<3;j++)E.parts.push({x:p[0]-.5,y:.4+Math.random()*1.6,z:p[2]+.8,vx:-4,vy:0,vz:0,g:0,dr:3,life:.4,max:.4,size:.35,tex:gl,rot:0,vr:0});});
  tween(.3,u=>{h.off.x=dx()*ease(u);},D);
  at(D+.3,()=>{const t=mpos(),dome=sigSp(tRing('#FFE27A'));tween(.9,u=>{dome.pos=[t[0],t[1]+.5,t[2]+.5];dome.w=dome.h=1+6*ease(u);dome.a=1-u;});at(.95,()=>rm(dome));
    sigBig(m,t,shield,gl);sigLine(ray,[t[0],t[1]+.5,t[2]+.9],0,9,.8,.5,gl);});
  tween(.45,u=>{h.off.x=dx()*(1-ease(u));},D+.9);
  at(TOT,()=>{[...K.sps,sh,shG].forEach(rm);h.off.x=0;});return TOT;}
// 魔法師：冰火雙星 — a fire orb and an ice orb circle the mage and fire in turn, then fuse into one purple star that slams down
function s2H2(sentence,th){const K=sigBase(sentence,th,'h2'),{m,gl,rm,n}=K,fireT=emojiTex('🔥'),iceT=tShard(),fg=gtex([255,120,40]),ig=gtex([120,210,255]),pg=gtex([200,120,255]),N=Math.max(6,n),S0=1.2,DT=.22,FU=S0+N*DT+.3,TOT=FU+1.6;
  const orbF=sigSp(fg),orbI=sigSp(ig),fu=sigSp(pg),O=(t,s)=>{const p=hpos(),a=t*4+s*PI;return[p[0]+.4+Math.cos(a)*1.1,p[1]+.9+Math.sin(a)*.5,p[2]+.9+Math.sin(a)*.3];};
  tween(FU,u=>{const t=u*FU,g=ease(cl(t/.5)),a=O(t,0),b=O(t,1);orbF.pos=a;orbI.pos=b;orbF.w=orbF.h=orbI.w=orbI.h=1.1*g*(1+.1*Math.sin(t*15));orbF.a=orbI.a=g;
    if(Math.random()<.5)E.parts.push({x:a[0],y:a[1],z:a[2]-.05,vx:0,vy:.3,vz:0,g:0,life:.4,max:.4,size:.28,gs:-.3,tex:fireT,rot:0,vr:3});
    if(Math.random()<.5)E.parts.push({x:b[0],y:b[1],z:b[2]-.05,vx:0,vy:.3,vz:0,g:0,life:.4,max:.4,size:.28,gs:-.3,tex:iceT,rot:Math.random()*6,vr:3});});
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const ts=S0+k*DT,s=k%2;if(t<ts){const p=O(t,s);return{pos:[p[0],p[1]+.55,p[2]],a:ease(cl((t-.1)/.5)),sc:.4};}
    const q=cl((t-ts)/.3);if(q>=1)return null;const st=O(ts,s);return{pos:[st[0]+(c[0]-st[0])*q,st[1]+.55+(c[1]+.05-st[1])*q,st[2]],a:1,sc:.6};},TOT);
  for(let i=0;i<N;i++){const s=i%2;at(S0+i*DT,()=>{const st=O(S0+i*DT,s),bolt=sigSp(s?ig:fg);
    tween(.3,u=>{const c=mpos();bolt.pos=[st[0]+(c[0]-st[0])*u,st[1]+(c[1]+.6-st[1])*u,st[2]];bolt.w=bolt.h=.7;bolt.a=1;E.parts.push({x:bolt.pos[0],y:bolt.pos[1],z:bolt.pos[2],vx:0,vy:0,vz:0,g:0,life:.25,max:.25,size:.45,gs:-1,tex:s?ig:fg,rot:0,vr:0});});
    at(.3,()=>{rm(bolt);const t=mpos();burst(t,8,s?iceT:fireT,4,.4);E.flash.mon=s?[.6,.85,1,.6]:[1,.6,.3,.6];E.shake=Math.max(E.shake,.3);sigHit(m);});});}
  tween(.6,u=>{const c=mpos(),e=ease(u),a=O(FU,0),b=O(FU,1),tg=[c[0],c[1]+3,c[2]+.6];orbF.pos=[a[0]+(tg[0]-a[0])*e+Math.cos(u*12)*(1-e),a[1]+(tg[1]-a[1])*e,tg[2]];orbI.pos=[b[0]+(tg[0]-b[0])*e-Math.cos(u*12)*(1-e),b[1]+(tg[1]-b[1])*e,tg[2]];orbF.a=orbI.a=1;},FU);
  at(FU+.6,()=>{orbF.a=orbI.a=0;const c=mpos();flare([c[0],c[1]+3,c[2]+.6],4,.4,pg);});
  tween(.5,u=>{const c=mpos();fu.pos=[c[0],c[1]+3-2.4*u*u,c[2]+.6];fu.w=fu.h=2.4+Math.sin(u*20);fu.a=1;},FU+.6);
  at(FU+1.1,()=>{fu.a=0;const t=mpos();sigBig(m,t,K.star,pg);burst(t,14,fireT,6,.5);burst(t,14,iceT,6,.5);E.flash.mon=[.85,.7,1,1];});
  at(TOT,()=>{[...K.sps,orbF,orbI,fu].forEach(rm);});return TOT;}
// 弓箭手：藤蔓束縛 — one seed arrow arcs into the monster, vines climb up and squeeze it, then burst into flowers
function s2H3(sentence,th){const K=sigBase(sentence,th,'h3'),{m,gl,rm,n}=K,arrow=tArrow(),vine=emojiTex('🌿'),flower=emojiTex('🌸'),leaf=emojiTex('🍃'),H=1.5,BL=H+1.6,TOT=BL+1.2;
  swing(.8);const a=sigSp(arrow),ag=sigSp(gl);
  tween(H,u=>{const t=u*H,p=hpos(),c=mpos(),q=cl((t-1.05)/.45),dX=c[0]-p[0]-1,dY=c[1]+.5-p[1]-.3,x=p[0]+1+dX*q,y=p[1]+.3+dY*q+Math.sin(PI*q)*1.2;
    a.pos=[x,y,p[2]+1];a.rot=Math.atan2(dY+1.2*PI*Math.cos(PI*q),dX);a.w=1.6;a.h=.4;a.a=t<1.05?ease(cl(t/.4)):1;ag.pos=a.pos;ag.w=2.2;ag.h=1;ag.a=.5*a.a;
    if(q>0)E.parts.push({x,y,z:p[2]+.9,vx:0,vy:-.2,vz:0,g:0,life:.5,max:.5,size:.3,tex:leaf,rot:Math.random()*6,vr:3});});
  sigWords(K,(k,t,c)=>{if(t<.1)return null;if(t<H){const p=hpos(),f=ease(cl((t-.1-k*.05)/.6)),an=k/n*PI*2+t*2;return{pos:[p[0]+1+Math.cos(an)*.9*f,p[1]+.3+Math.sin(an)*.6*f,p[2]+1],a:1,sc:.4+.2*f};}
    const q=cl((t-H)/1.2);if(q>=1)return null;const an=k/n*PI*2+q*8,r=1.3*(1-.3*q);return{pos:[c[0]+Math.cos(an)*r,.3+q*2.0+(k%3)*.25,c[2]+.6+Math.sin(an)*r*.5],a:1-q*q,sc:.5};},TOT);
  at(H,()=>{a.a=ag.a=0;const t=mpos();goldBurst(t,12,3,.4,.3,gl);sigHit(m);E.flash.mon=[.6,1,.6,.7];});
  const vs=[];for(let i=0;i<16;i++)vs.push(sigSp(vine));
  tween(BL+.6-H,u=>{const T=u*(BL+.6-H),c=mpos();vs.forEach((s,i)=>{const lv=i/16,g=ease(cl((T-lv*.6)/.35)),an=i*1.3+T*.8,r=1.0+.25*Math.sin(i);s.pos=[c[0]+Math.cos(an)*r,.2+lv*2.4,c[2]+.6+Math.sin(an)*r*.5];s.w=s.h=.8*g;s.rot=an;s.a=T>BL-H?Math.max(0,1-(T-(BL-H))/.4):g;});
    if(T<BL-H)m.off.sq=1-.04*Math.sin(T*16);},H);
  at(BL,()=>{const t=mpos();m.off.sq=1;sigBig(m,t,flower,gl);burst(t,30,flower,6,.6);burst(t,16,leaf,6,.5);E.flash.mon=[1,.8,.9,1];});
  at(TOT,()=>{[...K.sps,a,ag,...vs].forEach(rm);m.off.sq=1;});return TOT;}
// 劍士：烈焰旋風斬 — dashes in and spins into a whirlwind of flame slashes, then an upward finishing cut
function s2H4(sentence,th){const K=sigBase(sentence,th,'h4'),{m,gl,rm,n}=K,ray=uslash('h4',th),fire=emojiTex('🔥'),emb=gtex([255,140,40]),h=E.hero,D=1.1,SP=D+.3,SE=SP+1.6,TOT=SE+1.1,dx=()=>(m.base[0]-1.2)-h.base[0];
  tween(.3,u=>{h.off.x=dx()*ease(u);},D);
  const arcs=[0,1,2,3,4,5].map(()=>sigSp(ray));
  tween(SE-SP,u=>{const t=u*(SE-SP),c=mpos(),sp=t*14;h.off.rz=Math.sin(sp)*.25;h.off.sq=1+.05*Math.sin(sp*2);
    arcs.forEach((s,j)=>{const a=sp+j*PI/3,r=1.5;s.pos=[c[0]-.6+Math.cos(a)*r,.9+.5*Math.sin(a*.5+j),c[2]+.6+Math.sin(a)*r*.4];s.rot=a+PI/2;s.w=2.2;s.h=.5;s.a=.85*Math.min(1,t/.2)*(u>.85?(1-u)/.15:1);});
    if(Math.random()<.95)E.parts.push({x:c[0]-.6+(Math.random()-.5)*3,y:.2,z:c[2]+.6,vx:0,vy:2.5+Math.random()*2,vz:0,g:0,life:.6,max:.6,size:.4+Math.random()*.3,tex:Math.random()<.6?fire:emb,rot:0,vr:3});},SP);
  for(let j=0;j<8;j++)at(SP+.1+j*.18,()=>{const t=mpos();goldBurst(t,8,3.5,.35,.28,emb);E.shake=Math.max(E.shake,.3);E.flash.mon=[1,.6,.3,.55];sigHit(m);});
  sigWords(K,(k,t,c)=>{if(t<.1||t>SE)return null;const f=ease(cl((t-.1)/.5)),in2=t>SP,a=t*(in2?14:3)+k/n*PI*2,r=(in2?1.9:1.2)*f,p=hpos(),cen=in2?[c[0]-.6,1.3,c[2]]:[p[0],p[1]+.2,p[2]];return{pos:[cen[0]+Math.cos(a)*r,cen[1]+.4*Math.sin(a*.7),cen[2]+.7+Math.sin(a)*r*.4],a:1,sc:.45};},TOT);
  at(SE,()=>{const t=mpos();h.off.rz=0;h.off.sq=1;sigLine(ray,[t[0],t[1]+.6,t[2]+.9],PI/2,10,1.2,.6,gl);sigBig(m,t,fire,emb);E.flash.mon=[1,.55,.2,1];});
  tween(.5,u=>{h.off.x=dx()*(1-ease(u));h.off.y=.9*Math.sin(PI*u);},SE+.15);
  at(TOT,()=>{[...K.sps,...arcs].forEach(rm);h.off.x=0;h.off.y=0;h.off.rz=0;h.off.sq=1;});return TOT;}
// 龍騎士：龍槍流星 — leaps off the top of the screen and dives down as an ice comet; ice spikes burst out of the ground
function s2H5(sentence,th){const K=sigBase(sentence,th,'h5'),{m,gl,rm,n}=K,shard=tShard(),ig=gtex([120,210,255]),ray=uslash('h5',th),h=E.hero,UP=1.0,DIVE=2.0,HIT=2.35,TOT=HIT+1.6;
  tween(.4,u=>{h.off.y=-.25*Math.sin(PI*u);},UP-.4);tween(.35,u=>{h.off.y=9*ease(u);},UP);
  const com=sigSp(ig),tail=[0,1,2].map(()=>sigSp(ray));
  sigWords(K,(k,t,c)=>{if(t<.1||t>HIT)return null;const sp=k-(n-1)/2;if(t<DIVE)return{pos:[c[0]+sp*.55,c[1]+2.4+.15*Math.sin(t*3+k),c[2]+.6],a:ease(cl((t-.1)/.6)),sc:.5};
    const q=(t-DIVE)/(HIT-DIVE);return{pos:[c[0]+sp*.55*(1-q),c[1]+2.4-1.8*q,c[2]+.6],a:1-q,sc:.5};},TOT);
  tween(HIT-DIVE,u=>{const c=mpos(),q=u*u,s=[c[0]-2.2,9,c[2]+.7],e=[c[0],c[1]+.4,c[2]+.7],p=[s[0]+(e[0]-s[0])*q,s[1]+(e[1]-s[1])*q,s[2]],ang=Math.atan2(e[1]-s[1],e[0]-s[0]);com.pos=p;com.w=com.h=1.6;com.a=1;
    tail.forEach((r,j)=>{r.pos=[p[0]-Math.cos(ang)*(1+j*.9),p[1]-Math.sin(ang)*(1+j*.9),p[2]];r.rot=ang;r.w=2.4-.5*j;r.h=.6-.12*j;r.a=.9-.25*j;});
    for(let j=0;j<3;j++)E.parts.push({x:p[0],y:p[1],z:p[2],vx:(Math.random()-.5)*2,vy:2,vz:0,g:0,dr:2,life:.4,max:.4,size:.3,tex:shard,rot:Math.random()*6,vr:5});},DIVE);
  at(HIT,()=>{com.a=0;tail.forEach(r=>r.a=0);const t=mpos();sigBig(m,t,shard,ig);E.flash.mon=[.7,.9,1,1];
    for(let j=0;j<10;j++){const a=j/10*PI*2,s=sigSp(shard),px=t[0]+Math.cos(a)*1.6,pz=t[2]+.6+Math.sin(a)*.6;tween(.9,u=>{const g=u<.25?ease(u/.25):1;s.pos=[px,.5*g,pz];s.w=.6;s.h=1.5*g;s.a=u<.7?1:(1-u)/.3;},j*.03);at(.95+j*.03,()=>rm(s));}});
  tween(.45,u=>{h.off.y=9*(1-ease(u));},HIT+.6);
  at(TOT,()=>{[...K.sps,com,...tail].forEach(rm);h.off.y=0;});return TOT;}
// 牧師：天使光柱 — feather wings open behind the priest, beams of light strike the monster one after another
function s2H6(sentence,th){const K=sigBase(sentence,th,'h6'),{m,gl,rm,n}=K,fea=tFeather(),heart=emojiTex('💖'),ringT=tRing('#FFE9A0'),h=E.hero,B0=1.3,BD=.35,NB=5,FIN=B0+NB*BD+.3,TOT=FIN+1.4;
  const wing=[],bw=[backSp(gtex([255,240,190]),TOT),backSp(tWingP(),TOT),backSp(tWingP(),TOT)];   // angel wings behind the priest, mirrored for the left
  tween(TOT-.3,u=>{const t=u*(TOT-.3),p=hpos(),g=ease(cl(t/.6))*(t>FIN?Math.max(0,1-(t-FIN)/.6):1),S=1.15*g,fl=.1*Math.sin(t*3.6),[gw,wl,wr]=bw;
    gw.pos=[p[0],p[1]+.55,p[2]-.4];gw.w=2.6*g;gw.h=1.5*g;gw.a=.3*g;
    wr.pos=[p[0]+.15+S*.74,p[1]+.35+S*.66,p[2]-.3];wr.w=S;wr.h=S;wr.rot=-fl;wr.a=.92*g;wl.pos=[p[0]-.15-S*.74,p[1]+.35+S*.66,p[2]-.3];wl.w=-S;wl.h=S;wl.rot=fl;wl.a=.92*g;});
  tween(.5,u=>{h.off.y=.4*ease(u);},.4);tween(.5,u=>{h.off.y=.4*(1-ease(u));},FIN+.3);
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const p=hpos(),f=ease(cl((t-.1-k*.06)/.8)),tg=[p[0]+(k-(n-1)/2)*.5,p[1]+2.3+.2*Math.sin(t*2+k),p[2]+.6],dis=cl((t-B0-k*.15)/.5);if(dis>=1)return null;return{pos:[p[0]+(tg[0]-p[0])*f,p[1]+(tg[1]-p[1])*f+dis*3,p[2]+.6],a:1-dis,sc:.45+.2*f};},TOT);
  const beams=[];for(let i=0;i<NB;i++){const b=sigSp(gl),xo=[0,-1.1,1.1,-.5,.5][i];beams.push(b);tween(.7,u=>{const c=mpos(),g=u<.2?ease(u/.2):Math.max(0,1-(u-.2)/.8);b.pos=[c[0]+xo,c[1]+3,c[2]+.4];b.w=.9*g;b.h=8*g;b.a=.9*g;},B0+i*BD);
    at(B0+i*BD+.12,()=>{const c=mpos();goldBurst([c[0]+xo,c[1]+.3,c[2]+.6],12,3,.5,.3,gl);E.flash.mon=[1,1,.85,.6];E.shake=Math.max(E.shake,.3);sigHit(m);});}
  at(FIN,()=>{const t=mpos(),r=sigSp(ringT),p=hpos();sigBig(m,t,fea,gl);tween(.8,u=>{r.pos=[t[0],t[1]+.6,t[2]+.5];r.w=r.h=1+6*ease(u);r.a=1-u;});at(.85,()=>rm(r));
    for(let j=0;j<8;j++)E.parts.push({x:p[0]+(Math.random()-.5),y:p[1]+.5,z:p[2]+.9,vx:(Math.random()-.5)*1.5,vy:1.5+Math.random(),vz:0,g:0,dr:1,life:1.3,max:1.3,size:.4,tex:heart,rot:0,vr:0});});
  at(TOT,()=>{[...K.sps,...wing,...beams].forEach(rm);h.off.y=0;});return TOT;}
// 盜賊：飛刀風暴 — vanishes in smoke, daggers fly in from every side, reappears for one last slash
function s2H7(sentence,th){const K=sigBase(sentence,th,'h7'),{m,gl,rm,n}=K,dag=emojiTex('🗡️'),smoke=tSmoke(),ray=uslash('h7',th),h=E.hero,V=.9,R0=1.4,N=12,DT=.1,FIN=R0+N*DT+.5,TOT=FIN+1.2,dx=()=>(m.base[0]-1.6)-h.base[0];
  at(V,()=>{const p=hpos();goldBurst([p[0],p[1]+.5,p[2]+.6],30,3,.7,.6,smoke);h.off.y=40;});
  sigWords(K,(k,t,c)=>{if(t<.1||t>FIN)return null;const f=ease(cl((t-.1)/.6)),a=k/n*PI*2-t*1.5,r=2.4-.4*f;return{pos:[c[0]+Math.cos(a)*r,c[1]+.8+Math.sin(a)*r*.7,c[2]+.7],a:f*(t>FIN-.3?(FIN-t)/.3:1),sc:.45};},TOT);
  for(let i=0;i<N;i++){const a=i*2.4;at(R0+i*DT,()=>{const c=mpos(),s0=[c[0]+Math.cos(a)*3.2,c[1]+.8+Math.sin(a)*2.2,c[2]+.7],d=sigSp(dag);goldBurst(s0,6,1.5,.4,.4,smoke);
    tween(.2,u=>{const c2=mpos(),tg=[c2[0],c2[1]+.8,c2[2]+.7];d.pos=[s0[0]+(tg[0]-s0[0])*u,s0[1]+(tg[1]-s0[1])*u,s0[2]];d.rot=Math.atan2(tg[1]-s0[1],tg[0]-s0[0]);d.w=d.h=.9;d.a=1;});
    at(.2,()=>{rm(d);const t=mpos();goldBurst(t,8,3,.35,.28,gl);E.flash.mon=[.75,.5,1,.55];E.shake=Math.max(E.shake,.3);sigHit(m);});});}
  at(FIN-.5,()=>{h.off.y=0;h.off.x=0;const p=hpos();goldBurst([p[0],p[1]+.5,p[2]+.6],20,3,.6,.5,smoke);heroPlay('attack',.4);});
  // reappears back home and hurls one giant shadow dagger straight through the monster
  const gt=sigSp(ray),gd=sigSp(dag);tween(.5,u=>{const p=hpos(),c=mpos(),x0=p[0]+.6,y0=p[1]-.1,cy=c[1]+.6,sl=(cy-y0)/Math.max(.5,c[0]-x0),x1=c[0]+6,xx=x0+(x1-x0)*u,yy=y0+sl*(xx-x0),an=Math.atan(sl);
    gd.pos=[xx,yy,p[2]+.9];gd.w=gd.h=1.5;gd.rot=an;gd.a=1;gt.pos=[(x0+xx)/2,(y0+yy)/2,p[2]+.88];gt.w=(xx-x0)/2+.2;gt.h=.5*(1-u*.5);gt.rot=an;gt.a=.85;
    for(let j=0;j<2;j++)E.parts.push({x:xx-.5,y:yy+(R3()-.5)*.3,z:p[2]+.87,vx:-2,vy:R3()-.5,vz:0,g:0,life:.4,max:.4,size:.35,gs:.6,al:.6,tex:smoke,rot:0,vr:0});},FIN-.3);
  at(FIN+.21,()=>rm(gd));tween(.4,u=>{gt.a=.85*(1-u);},FIN+.21);
  at(FIN-.1,()=>{const t=mpos();hitstop(.1);sigLine(ray,[t[0],t[1]+.7,t[2]+.9],0,12,1.1,.6,gl);sigBig(m,t,dag,gl);goldBurst(t,30,5,1.0,.5,smoke);vfx('dark_burst',[t[0],t[1]+.5,t[2]+.85],1.8);});
  at(TOT,()=>{[...K.sps,gd,gt].forEach(rm);h.off.y=0;h.off.x=0;});return TOT;}
// 召喚師：精靈大遊行 — a long parade of little spirits runs from behind the summoner straight through the monster
function s2H8(sentence,th){const K=sigBase(sentence,th,'h8'),{m,gl,rm,n}=K,EM=H8B.map(b=>b[0]),dust=tSmokeG(),paw=emojiTex('🐾'),S0=1.2,NS=Math.max(10,n+4),DT=.13,END=S0+NS*DT+1.0,TOT=END+.9;
  const runs=[];for(let i=0;i<NS;i++)runs.push({s:sigSp(emojiTex(H8B[i%4][1])),k:EM[i%4],lane:i%3,ts:S0+i*DT,hit:0});
  tween(TOT,u=>{const t=u*TOT,c=mpos(),p=hpos();runs.forEach((r,i)=>{const q=(t-r.ts)/1.0;if(q<0||q>1){r.s.a=0;return;}const x0=p[0]-2.5,x=x0+(c[0]+5-x0)*q,z=p[2]+.6+r.lane*.35,y=.55+.3*Math.abs(Math.sin(q*PI*6+i));
      r.s.tex=fxTex(r.k,r.s.tex);r.s.pos=[x,.66+beastRun(r.s,r.k,.7,q*PI*6+i,true),z];r.s.a=q<.08?q/.08:q>.9?(1-q)/.1:1;
      if(Math.random()<.4)E.parts.push({x:x-.3,y:.15,z,vx:-1,vy:.4,vz:0,g:0,life:.5,max:.5,size:.4,gs:.5,tex:dust,rot:0,vr:0});
      if(!r.hit&&x>c[0]-.4){r.hit=1;goldBurst([c[0],c[1]+.4,c[2]+.6],6,3,.3,.26,gl);burst(c,3,paw,3,.35);E.shake=Math.max(E.shake,.25);sigHit(m);E.flash.mon=[.7,1,.85,.45];}});});
  sigWords(K,(k,t,c)=>{const r=runs[k%NS],q=(t-r.ts)/1.0,p=hpos();if(t<.1)return null;if(q<0)return{pos:[p[0]-.4+(k-(n-1)/2)*.45,p[1]+1.7,p[2]+.6],a:ease(cl((t-.1)/.5)),sc:.4};if(q>1)return null;return{pos:[r.s.pos[0],r.s.pos[1]+.75,r.s.pos[2]],a:r.s.a,sc:.4};},TOT);
  at(END-.4,()=>{const t=mpos();sigBig(m,t,paw,gl);burst(t,16,dust,5,.8);E.flash.mon=[.8,1,.9,1];});
  at(TOT,()=>{[...K.sps,...runs.map(r=>r.s)].forEach(rm);});return TOT;}
// 工程師：機器人援軍 — a robot drops in beside the engineer, the words are fed into its cannon, it fires a laser beam
function s2H9(sentence,th){const K=sigBase(sentence,th,'h9'),{m,gl,rm,n}=K,bot=emojiTex('🤖'),gear=emojiTex('⚙️'),sm=tSmokeG(),og=gtex([255,170,60]),DROP=1.2,CH=DROP+.5,FIRE=CH+.9,TOT=FIRE+1.8;
  const R=sigSp(bot),beam=sigSp(og),core=sigSp(gtex([255,255,255])),eye=sigSp(og),RP=()=>{const p=hpos();return[p[0]+1.95,1.1,p[2]+1.0];},RH=1.05;
  tween(TOT,u=>{const t=u*TOT,P=RP();let y=P[1];if(t<DROP){const q=cl((t-.3)/(DROP-.3));y=P[1]+8*(1-q*q);}R.tex=propTex(t<DROP+.3?'robot3':t<CH?'robot0':t<FIRE?'robot1':t<FIRE+1?'robot2':'robot0',bot);R.pos=[P[0],y,P[2]];R.h=RH*(t>DROP&&t<DROP+.2?1-.08*Math.sin(PI*(t-DROP)/.2):1);R.w=RH*propAsp('robot0');R.a=t<.3?0:t>TOT-.4?(TOT-t)/.4:1;R.rot=t>FIRE&&t<FIRE+1?.03*Math.sin(t*60):0;
    const ck=t<CH?0:t<FIRE?ease((t-CH)/(FIRE-CH)):t<FIRE+1?1:Math.max(0,1-(t-FIRE-1)/.3),E0=[P[0]+RH*.86,P[1]+RH*.1,P[2]+.1];eye.pos=E0;eye.w=eye.h=(.4+1.0*ck)*(1+.15*Math.sin(t*30));eye.a=ck;
    if(t>FIRE&&t<FIRE+1.3){const c=mpos(),len=(c[0]+6)-E0[0],k=t<FIRE+1?ease(cl((t-FIRE)/.12)):Math.max(0,1-(t-FIRE-1)/.3);beam.pos=[E0[0]+len/2,E0[1],E0[2]];beam.w=len/2;beam.h=.45*k*(1+.12*Math.sin(t*50));beam.a=k;core.pos=beam.pos;core.w=len/2;core.h=.16*k;core.a=k;
      if(Math.random()<.9)E.parts.push({x:c[0]-.2,y:E0[1]+(Math.random()-.5)*.5,z:E0[2]+.1,vx:-(1+Math.random()*3),vy:(Math.random()-.3)*4,vz:0,g:5,life:.5,max:.5,size:.3,tex:Math.random()<.5?gear:og,rot:0,vr:6});}
    else{beam.a=core.a=0;}});
  at(DROP,()=>{const P=RP();goldBurst([P[0],.3,P[2]],20,3,.6,.5,sm);E.shake=Math.max(E.shake,.6);});
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const P=RP(),p=hpos(),a=k/n*PI*2+t*2.5,s=[p[0]+Math.cos(a)*1.1,p[1]+.6+Math.sin(a)*.6,P[2]];if(t<CH)return{pos:s,a:ease(cl((t-.1)/.5)),sc:.4};
    const q=cl((t-CH-k*.06)/.4);if(q>=1)return null;const tg=[P[0]+RH*.86,P[1]+RH*.1,P[2]+.1];return{pos:[s[0]+(tg[0]-s[0])*q,s[1]+(tg[1]-s[1])*q,tg[2]],a:1-q*.5,sc:.4*(1-q*.6)};},TOT);
  for(let j=0;j<5;j++)at(FIRE+.1+j*.18,()=>{E.shake=Math.max(E.shake,.35);E.flash.mon=[1,.8,.5,.6];sigHit(m);});
  at(FIRE+1.0,()=>{const t=mpos();sigBig(m,t,gear,og);E.flash.mon=[1,.75,.4,1];});
  at(TOT,()=>{[...K.sps,R,beam,core,eye].forEach(rm);});return TOT;}
// 神秘使者：時間停止 — a clock seal appears, colours drain as time stops and the words freeze, then everything shatters into crystals
function s2H10(sentence,th){const K=sigBase(sentence,th,'h10'),{m,gl,rm,n}=K,rune=tRune('#B8A8FF'),crys=tCrystal(),clock=emojiTex('⏳'),pur=gtex([150,130,255]),ST=1.4,BR=ST+1.8,TOT=BR+1.3;
  const cvs=E.canvas,undo=()=>{try{cvs.style.filter='';}catch(e){}},seal=sigSp(rune),hand=sigSp(clock);
  tween(TOT,u=>{const t=u*TOT,c=mpos(),g=ease(cl((t-.2)/.6))*(t>BR?Math.max(0,1-(t-BR)/.4):1),P=[c[0]-.2,c[1]+.7,c[2]+.3];seal.pos=P;seal.w=seal.h=4.2*g;seal.rot=-Math.min(t,ST)*2.5;seal.a=.8*g;hand.pos=[P[0],P[1],P[2]+.05];hand.w=hand.h=1.1*g;hand.rot=Math.min(t,ST)*6;hand.a=g;});
  at(ST,()=>{try{cvs.style.transition='filter .2s';cvs.style.filter='grayscale(.85) brightness(.85) contrast(1.1)';}catch(e){}E.flash.mon=[.8,.8,1,.5];});
  at(BR,undo);setTimeout(undo,(TOT+1)*2000);
  sigWords(K,(k,t,c)=>{if(t<.1||t>BR)return null;const f=ease(cl((t-.1)/.6)),a=k/n*PI*2+Math.min(t,ST)*2.2,r=1.9*f;return{pos:[c[0]-.2+Math.cos(a)*r,c[1]+.7+Math.sin(a)*r*.75,c[2]+.7],a:1,sc:.5,rot:t>ST?.05*Math.sin(t*40+k):0};},TOT);
  tween(BR-ST,()=>{if(Math.random()<.5){const c=mpos();E.parts.push({x:c[0]+(Math.random()-.5)*3,y:c[1]+.7+(Math.random()-.5)*2.5,z:c[2]+.8,vx:0,vy:0,vz:0,g:0,life:.6,max:.6,size:.2,tex:K.star,rot:0,vr:0});}},ST);
  at(BR,()=>{const t=mpos();for(let k=0;k<n;k++){const a=k/n*PI*2+ST*2.2;burst([t[0]-.2+Math.cos(a)*1.9,t[1]+.7+Math.sin(a)*1.9*.75,t[2]+.7],6,crys,4,.4);}
    sigBig(m,t,crys,pur);burst(t,24,crys,7,.5);E.flash.mon=[.85,.75,1,1];});
  at(TOT,()=>{[...K.sps,seal,hand].forEach(rm);undo();});return TOT;}
const SIG2={h1:s2H1,h2:s2H2,h3:s2H3,h4:s2H4,h5:s2H5,h6:s2H6,h7:s2H7,h8:s2H8,h9:s2H9,h10:s2H10};
function ultimate2(sentence,hid){if(!E.mon)return;heroPlay('attack',1.2);return(SIG2[hid]||SIG2.h1)(sentence,ULT[hid]||ULT.h1);}
function ult2Name(hid){return ULT2N[hid]||ULT2N.h1;}
// --- 勇者：聖光審判 (raises the sword: a beam shoots up; a column of light opens over the monster; a giant sword sinks into view with the words circling it, then drops) ---
function sigH1(sentence,th){const K=sigBase(sentence,th,'h1'),{m,gl,rm,n}=K,h=E.hero,ray=uslash('h1',th),gold=gtex([255,225,120]),OPEN=.9,DESC=1.3,DROP=2.5,HIT=2.75,TOT=HIT+1.4;
  tween(.5,u=>{h.off.y=.25*ease(u);h.off.sq=1+.04*ease(u);},.1);tween(.4,u=>{h.off.y=.25*(1-ease(u));h.off.sq=1.04-.04*ease(u);},DROP);
  const up=sigSp(gold),col=sigSp(gold),swG=sigSp(gold),sw=sigSp(tSword());
  tween(1.0,u=>{const p=hpos(),g=u<.3?ease(u/.3):Math.max(0,1-(u-.3)/.7);up.pos=[p[0]+.5,p[1]+5,p[2]+.8];up.w=.3*g;up.h=6*g;up.a=.85*g;},.4);
  tween(TOT-OPEN,u=>{const t=OPEN+u*(TOT-OPEN),c=mpos(),g=ease(cl((t-OPEN)/.5))*(t<HIT?1:Math.max(0,1-(t-HIT)/.5));col.pos=[c[0],c[1]+4,c[2]+.2];col.w=1.3*g*(1+.06*Math.sin(t*9));col.h=7*g;col.a=.45*g;
    if(t<HIT&&Math.random()<.6*g)E.parts.push({x:c[0]+(Math.random()-.5)*2,y:c[1]+6,z:c[2]+.3,vx:0,vy:-2.5-Math.random()*2,vz:0,g:0,life:1.2,max:1.2,size:.16,tex:K.star,rot:0,vr:2});},OPEN);
  const SH=1.75,swY=t=>{const c=mpos(),fy=c[1]+.6+SH;if(t<DROP)return 6.3-.9*ease(cl((t-DESC)/(DROP-DESC)));if(t<HIT){const q=(t-DROP)/(HIT-DROP);return 5.4+(fy-5.4)*q*q;}return fy;};   // stays inside the stage view
  tween(HIT+.9-DESC,u=>{const t=DESC+u*(HIT+.9-DESC),c=mpos(),y=swY(t),g=ease(cl((t-DESC)/.4)),a=t<HIT+.5?1:Math.max(0,1-(t-HIT-.5)/.4);
    sw.pos=[c[0],y,c[2]+.7];sw.w=.67*g;sw.h=SH*g;sw.a=a;swG.pos=[c[0],y,c[2]+.65];swG.w=1.25*g;swG.h=2.6*g;swG.a=.5*a*g;
    if(t>DROP&&t<HIT)for(let j=0;j<2;j++)E.parts.push({x:c[0]+(Math.random()-.5)*.6,y:y+2,z:c[2]+.6,vx:0,vy:4,vz:0,g:0,life:.25,max:.25,size:.35,tex:gold,rot:0,vr:0});},DESC);
  sigWords(K,(k,t,c)=>{if(t<.1||t>HIT)return null;const p=hpos(),st=[p[0]+.5,p[1]+1,p[2]+.8],f=ease(cl((t-.2-k*.06)/.8)),cy=t>DESC?swY(t)-1.0:4.2,a=k/n*PI*2+t*1.8,r=1.3*(t<DROP?1:1-(t-DROP)/(HIT-DROP));
    return{pos:lerp3(st,[c[0]+Math.cos(a)*r,cy+Math.sin(a)*r*.35,c[2]+.75+Math.sin(a)*.2],f),a:1,sc:.42};},TOT);
  at(HIT,()=>{const t=mpos();sigBig(m,t,K.star,gold);goldBurst(t,40,6,.9,.4,gold);E.flash.mon=[1,1,.85,1];
    sigLine(ray,[t[0],t[1]+.5,t[2]+.9],0,10,.9,.55,gl);sigLine(ray,[t[0],t[1]+.5,t[2]+.9],PI/2,10,.9,.55,gl);sigLine(ray,[t[0],.15,t[2]+.8],0,9,.4,.7,gl);});
  at(TOT,()=>{[...K.sps,up,col,swG,sw].forEach(rm);h.off.y=0;h.off.sq=1;});return TOT;}
// --- 魔法師：星光流星雨 (the sky dims; stars and the words gather into a glowing cluster high up; meteors with long tails streak down one after another; a giant last meteor) ---
function sigH2(sentence,th){const K=sigBase(sentence,th,'h2'),{m,gl,rm,n}=K,h=E.hero,star=K.star,tail=uslash('h2',th),pink=gtex([255,150,230]),cvs=E.canvas,N=Math.max(6,n),M0=1.4,MD=.26,BIG=M0+N*MD+.25,TOT=BIG+1.5;
  const undo=()=>{try{cvs.style.filter='';}catch(e){}};at(.2,()=>{try{cvs.style.transition='filter .5s';cvs.style.filter='brightness(.72) saturate(1.15)';}catch(e){}});at(BIG+.3,undo);setTimeout(undo,(TOT+1)*2000);
  tween(.5,u=>{h.off.y=.2*Math.sin(PI*u);},.2);
  const SKY=c=>[c[0]-3.0,c[1]+4.3,c[2]+.4],core=sigSp(pink);
  tween(BIG+.1,u=>{const t=u*(BIG+.1),c=mpos(),g=ease(cl((t-.3)/.6)),P=SKY(c);core.pos=P;core.w=core.h=(1.5+.3*Math.sin(t*5))*g;core.a=.7*g;
    if(Math.random()<.8*g){const a=Math.random()*PI*2,r=2.3;E.parts.push({x:P[0]+Math.cos(a)*r,y:P[1]+Math.sin(a)*r*.6,z:P[2],vx:-Math.cos(a)*4,vy:-Math.sin(a)*2.4,vz:0,g:0,life:.55,max:.55,size:.18,tex:star,rot:0,vr:2});}});
  sigWords(K,(k,t,c)=>{if(t<.2)return null;const P=SKY(c),p=hpos(),f=ease(cl((t-.2-k*.06)/.9)),ts=M0+k*MD;
    if(t<ts){const a=k/n*PI*2+t*1.5;return{pos:lerp3([p[0]+.6,p[1]+1,p[2]+.8],[P[0]+Math.cos(a)*.9,P[1]+Math.sin(a)*.5,P[2]],f),a:1,sc:.35+.15*f};}
    const q=cl((t-ts)/.4);if(q>=1)return null;return{pos:lerp3(P,[c[0],c[1]+.5,c[2]+.7],q*q),a:1,sc:.5};},TOT);
  const met=(t0,dur,big)=>{const hd=sigSp(big?pink:star),tl=sigSp(tail),off=big?0:(Math.random()-.5)*1.2;
    tween(dur,u=>{const c=mpos(),s=SKY(c),e=[c[0]+off*.4,c[1]+.4,c[2]+.6],p=lerp3(s,e,u*u),ang=Math.atan2(e[1]-s[1],e[0]-s[0]),sz=big?1.4:.6;
      hd.pos=p;hd.w=hd.h=sz;hd.a=1;tl.pos=[p[0]-Math.cos(ang)*sz*1.6,p[1]-Math.sin(ang)*sz*1.6,p[2]-.02];tl.rot=ang;tl.w=sz*2.6*(.4+.6*u);tl.h=sz*.5;tl.a=.9;
      if(Math.random()<.9)E.parts.push({x:p[0],y:p[1],z:p[2]-.05,vx:0,vy:0,vz:0,g:0,life:.35,max:.35,size:sz*.35,gs:-.6,tex:star,rot:0,vr:0});},t0);
    at(t0+dur,()=>{rm(hd);rm(tl);if(big)return;const t=mpos();burst(t,7,star,4,.4);goldBurst(t,12,3.5,.4,.3,pink);flare(t,1.8,.3,pink);E.shake=Math.max(E.shake,.35);E.flash.mon=[1,.7,.95,.55];sigHit(m);});};
  for(let i=0;i<N;i++)met(M0+i*MD,.4,false);met(BIG-.45,.45,true);
  at(BIG,()=>{const t=mpos();sigBig(m,t,star,pink);burst(t,30,star,8,.7);E.flash.mon=[1,.75,.95,1];});
  at(TOT,()=>{[...K.sps,core].forEach(rm);undo();h.off.y=0;});return TOT;}
// --- 龍騎士：冰龍吐息 (inhales, lunges and breathes a widening blizzard; the monster frosts over, an ice block grows up from the ground around it, cracks and shatters) ---
function sigH5(sentence,th){const K=sigBase(sentence,th,'h5'),{m,gl,rm,n}=K,h=E.hero,big=E.big?1.3:1,snow=emojiTex('❄️'),shard=tShard(),mist=gtex([210,240,255]),streak=uslash('h5',th),B0=.9,B1=2.6,SH=3.35,TOT=SH+1.3;
  const mouth=()=>{const p=hpos();return[p[0]+1.0,p[1]+1.2,p[2]+.9];};
  tween(.5,u=>{const e=ease(u);h.off.x=-.3*e;h.off.rz=.1*e;},.3);
  tween(.25,u=>{const e=ease(u);h.off.x=-.3+.8*e;h.off.rz=.1-.25*e;},B0-.1);
  tween(.5,u=>{const e=ease(u);h.off.x=.5*(1-e);h.off.rz=-.15*(1-e);},B1);
  tween(B1-B0,()=>{const M=mouth(),c=mpos();for(let j=0;j<7;j++){const r=Math.random(),sp=Math.random()-.5,tg=[c[0]+sp*.6,c[1]+.5+sp*1.4,c[2]+.6],d=.35+.2*r;
      E.parts.push({x:M[0],y:M[1]+(Math.random()-.5)*.2,z:M[2],vx:(tg[0]-M[0])/d,vy:(tg[1]-M[1])/d,vz:0,g:0,life:d,max:d,size:.2+.4*r,gs:.9,tex:r<.35?snow:r<.6?shard:mist,rot:r*6,vr:4});}
    if(Math.random()<.5){const sl=sigSp(streak),ang=Math.atan2(c[1]+.6-M[1],c[0]-M[0])+(Math.random()-.5)*.25;tween(.3,v=>{sl.pos=[M[0]+Math.cos(ang)*v*4,M[1]+Math.sin(ang)*v*4,M[2]];sl.rot=ang;sl.w=1.4;sl.h=.18;sl.a=.7*(1-v);});at(.32,()=>rm(sl));}},B0);
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const M=mouth(),ts=B0+k*.12;if(t<ts){const f=ease(cl((t-.1)/.6)),a=k/n*PI*2+t*2;return{pos:[M[0]-.6+Math.cos(a)*.8*f,M[1]+.8+Math.sin(a)*.4*f,M[2]],a:f,sc:.4};}
    const q=cl((t-ts)/.5);if(q>=1)return null;return{pos:[M[0]+(c[0]-M[0])*q,M[1]+(c[1]+.6-M[1])*q+.3*Math.sin(q*9+k)*(1-q),M[2]],a:1-q*q,sc:.5};},TOT);
  const ice=sigSp(tIce());
  tween(SH-B0,u=>{const t=B0+u*(SH-B0),c=mpos(),fz=ease(cl((t-B0-.4)/1.2)),Hh=1.95*big*fz,crack=t>SH-.45?.06*Math.sin(t*70):0;E.flash.mon=[.55,.85,1,.6*fz];
    ice.pos=[c[0]+crack,Hh,c[2]+.8];ice.w=1.75*big*Math.min(1,fz*2);ice.h=Hh;ice.a=.85*fz;
    if(fz>.2&&fz<1&&Math.random()<.6)E.parts.push({x:c[0]+(Math.random()-.5)*2.4,y:Hh*2,z:c[2]+.85,vx:0,vy:.4,vz:0,g:0,life:.5,max:.5,size:.18,tex:K.star,rot:0,vr:2});},B0);
  at(SH-.45,()=>{E.shake=Math.max(E.shake,.4);const t=mpos();burst(t,6,shard,2.5,.3);});
  at(SH,()=>{rm(ice);const t=mpos();sigBig(m,t,shard,mist);E.flash.mon=[.9,1,1,1];
    for(let j=0;j<40;j++){const a=Math.random()*PI*2,v=3+Math.random()*5;E.parts.push({x:t[0]+(Math.random()-.5)*1.2,y:t[1]+.3+Math.random()*1.4,z:t[2]+.6,vx:Math.cos(a)*v,vy:2+Math.random()*4,vz:(Math.random()-.4)*2,g:7,life:1.0,max:1.0,size:.3+Math.random()*.32,tex:shard,rot:Math.random()*6,vr:(Math.random()-.5)*10});}});
  at(TOT,()=>{[...K.sps,ice].forEach(rm);h.off.x=0;h.off.rz=0;});return TOT;}
// --- 牧師：聖光祝福 (the priest floats up in prayer; the words rise into a halo that descends around the monster and tightens; a pillar of light; hearts heal the priest) ---
function sigH6(sentence,th){const K=sigBase(sentence,th,'h6'),{m,gl,rm,n}=K,h=E.hero,ringT=tRing('#FFE9A0'),fea=tFeather(),heart=emojiTex('💖'),warm=gtex([255,240,190]),D0=1.0,DN=2.4,HIT=2.9,TOT=HIT+1.4;
  tween(.6,u=>{h.off.y=.35*ease(u);},.3);tween(.5,u=>{h.off.y=.35*(1-ease(u));},HIT+.3);
  const hg=sigSp(warm),halo=sigSp(ringT),pil=sigSp(warm);
  const HL=t=>{const c=mpos(),q=ease(cl((t-D0)/(DN-D0)));return{c,y:c[1]+3.6-2.9*q,r:2.2-.8*q};};
  tween(TOT-D0,u=>{const t=D0+u*(TOT-D0),{c,y,r}=HL(t),g=ease(cl((t-D0)/.4))*(t<HIT?1:Math.max(0,1-(t-HIT)/.5));
    halo.pos=[c[0],y,c[2]+.5];halo.w=r*g;halo.h=r*.32*g;halo.a=g;hg.pos=halo.pos;hg.w=r*1.4*g;hg.h=r*.6*g;hg.a=.5*g;
    const pk=t<DN?0:t<HIT+.4?ease(cl((t-DN)/.3)):Math.max(0,1-(t-HIT-.4)/.4);pil.pos=[c[0],c[1]+3,c[2]+.4];pil.w=1.5*pk;pil.h=6.5*pk;pil.a=.85*pk;
    if(t<HIT&&Math.random()<.5*g)E.parts.push({x:c[0]+(Math.random()-.5)*r*2,y,z:c[2]+.5,vx:0,vy:-1.2,vz:0,g:0,life:.9,max:.9,size:.16,tex:K.star,rot:0,vr:2});
    if(t>DN&&t<HIT)E.flash.mon=[1,1,.85,.4];},D0);
  sigWords(K,(k,t,c)=>{if(t<.1||t>HIT)return null;const p=hpos(),st=[p[0]+.4,p[1]+1.2,p[2]+.6],f=ease(cl((t-.1-k*.07)/1.0)),{y,r}=HL(Math.max(t,D0)),a=k/n*PI*2+t*1.2;
    return{pos:lerp3(st,[c[0]+Math.cos(a)*r,y+.35+Math.sin(a)*r*.32,c[2]+.55],f),a:t>HIT-.2?(HIT-t)/.2:1,sc:.42};},TOT);
  at(HIT,()=>{const t=mpos(),p=hpos();sigBig(m,t,fea,warm);E.flash.mon=[1,1,.9,1];
    for(let j=0;j<10;j++)E.parts.push({x:t[0]+(Math.random()-.5)*3,y:t[1]+3,z:t[2]+.5,vx:(Math.random()-.5)*.6,vy:-1.1,vz:0,g:0,life:2,max:2,size:.3,tex:fea,rot:Math.random()*6,vr:2});
    for(let j=0;j<6;j++)E.parts.push({x:p[0]+(Math.random()-.5),y:p[1]+.5,z:p[2]+.9,vx:(Math.random()-.5)*1.2,vy:1.4+Math.random(),vz:0,g:0,dr:1,life:1.4,max:1.4,size:.4,tex:heart,rot:0,vr:0});});
  at(TOT,()=>{[...K.sps,hg,halo,pil].forEach(rm);h.off.y=0;});return TOT;}
// --- 盜賊：暗影連斬 (the light dims; the rogue blinks between the ground and the air around the monster in puffs of smoke, cutting away one word per strike; reappears for a giant X slash) ---
function sigH7(sentence,th){const K=sigBase(sentence,th,'h7'),{m,gl,rm,n}=K,ray=uslash('h7',th),smoke=tSmoke(),h=E.hero,cvs=E.canvas,N=Math.max(4,Math.min(7,n)),S0=1.3,STEP=.3,CR=S0+N*STEP+.2,TOT=CR+1.1;
  const undo=()=>{try{cvs.style.filter='';}catch(e){}};at(.15,()=>{try{cvs.style.transition='filter .35s';cvs.style.filter='brightness(.55) contrast(1.1) saturate(.85)';}catch(e){}});at(CR+.35,undo);setTimeout(undo,(TOT+1)*2000);
  const dx=()=>(m.base[0]-1.7)-h.base[0],puff=p=>{goldBurst([p[0],p[1]+.6,p[2]+.6],8,2.4,.5,.5,smoke);vfx('smoke_puff',[p[0],p[1]+.4,p[2]+.65],.9,{fps:32});};
  sigWords(K,(k,t,c)=>{if(t<.1||t>CR)return null;const f=ease(cl((t-.1)/.6)),a=k/n*PI*2+t*2.2,st=S0+(k%N)*STEP+.12;if(k<N&&t>st+.25)return null;
    return{pos:[c[0]+Math.cos(a)*1.9*f,c[1]+.7+Math.sin(a)*1.2*f,c[2]+.7],a:k<N&&t>st?1-(t-st)/.25:1,sc:.42};},TOT);
  for(let j=0;j<N;j++){const ts=S0+j*STEP,air=j%2===1;
    at(ts,()=>{puff(hpos());h.off.x=dx()+(air?.4:0);h.off.y=air?1.3:0;h.off.rz=air?-.3:0;puff(hpos());});
    at(ts+.1,()=>{const t=mpos(),ang=air?-.9:.55+(j%3)*.15;sigLine(ray,[t[0],t[1]+.6+(air?.4:0),t[2]+.9],ang,5,.55,.28,gl);vfx('slash_arc',[t[0],t[1]+.6+(air?.4:0),t[2]+.95],1.1,{rot:ang-.6,fps:30});goldBurst(t,10,4,.4,.3,gl);E.shake=Math.max(E.shake,.35);E.flash.mon=[.75,.5,1,.6];sigHit(m);});}
  at(CR-.15,()=>{puff(hpos());h.off.x=dx()-.6;h.off.y=0;h.off.rz=0;puff(hpos());});
  at(CR,()=>{const t=mpos(),p=[t[0],t[1]+.7,t[2]+.9];sigLine(ray,p,.65,11,1.0,.6,gl);sigLine(ray,p,-.65,11,1.0,.6,gl);sigBig(m,t,K.star,gl);goldBurst(t,30,5,1.0,.5,smoke);E.flash.mon=[1,1,1,1];});
  tween(.45,u=>{h.off.x=(dx()-.6)*(1-ease(u));},CR+.5);
  at(TOT,()=>{K.sps.forEach(rm);h.off.x=0;h.off.y=0;h.off.rz=0;undo();});return TOT;}
// --- 工程師：機械砲轟 (gears fly together into a turret beside the engineer; the words are loaded in; it spins up and fires a stream of tracers, then one big shell) ---
function sigH9(sentence,th){const K=sigBase(sentence,th,'h9'),{m,gl,rm,n}=K,gear=emojiTex('⚙️'),bolt=emojiTex('🔩'),sm=tSmokeG(),og=gtex([255,170,60]),steel=gtex([200,215,230]),BT=1.4,F0=BT+.6,NF=16,FD=.08,BIGS=F0+NF*FD+.3,TOT=BIGS+1.5;
  const TP=()=>{const p=hpos();return[p[0]+1.9,.8,p[2]+1.0];},HOME=[[0,0],[-.45,.35],[.45,.35],[0,.75],[0,-.3]];
  const gs=HOME.map(()=>sigSp(gear)),tur=sigSp(gear),muz=sigSp(og),TH=.82,TIP=()=>{const P=TP();return[P[0]+TH*propAsp('turret0')*.9,P[1]+.05+TH*.4,P[2]+.1];};
  tween(TOT,u=>{const t=u*TOT,P=TP(),spin=t>F0&&t<BIGS?t*30:t*3,out=t>TOT-.4?(TOT-t)/.4:1;
    gs.forEach((s,j)=>{const from=[P[0]-2+j*.8,P[1]+3+j*.3],q=ease(cl((t-.3-j*.12)/.6)),hp=[P[0]+HOME[j][0],P[1]+HOME[j][1]];s.pos=[from[0]+(hp[0]-from[0])*q,from[1]+(hp[1]-from[1])*q,P[2]];s.w=s.h=(j===0?.75:.45)*cl(q*3);s.rot=spin*(j%2?-1:1);s.a=cl(q*3)*out*(t<BT?1:Math.max(0,1-(t-BT)/.2));});
    const bk=ease(cl((t-BT)/.25)),rec=t>F0&&t<BIGS?.03*Math.sin(t*80):t>BIGS&&t<BIGS+.3?-.15*(1-(t-BIGS)/.3):0,fr=t<F0-.3?'turret0':t<F0?'turret1':t<BIGS?(Math.sin(t*95)>0?'turret2':'turret1'):t<BIGS+.3?'turret3':'turret0';
    tur.tex=propTex(fr,gear);tur.pos=[P[0]+rec,.05+TH*(.6+.4*bk),P[2]+.05];tur.h=TH*(.6+.4*bk);tur.w=tur.h*propAsp('turret0');tur.a=bk*out;
    const fl=t>F0&&t<BIGS+.3?(Math.sin(t*90)>0?1:.4):0,T0=TIP();muz.pos=T0;muz.w=muz.h=.5*fl;muz.a=.7*fl;});
  at(BT,()=>{const P=TP();goldBurst([P[0],P[1]+.3,P[2]],16,2,.5,.45,sm);E.shake=Math.max(E.shake,.3);});
  sigWords(K,(k,t,c)=>{if(t<.1)return null;const p=hpos(),P=TP(),f=ease(cl((t-.1)/.5)),a=k/n*PI*2+t*2,s=[p[0]+Math.cos(a)*1.0,p[1]+.9+Math.sin(a)*.5,p[2]+.8],q=cl((t-BT-k*.05)/.35);if(q>=1)return null;
    return{pos:lerp3(s,[P[0],P[1]+.5,s[2]],q),a:f*(1-q*.6),sc:.4*(1-q*.5)};},TOT);
  for(let i=0;i<NF;i++)at(F0+i*FD,()=>{const s=TIP(),tr=sigSp(og),dy=(Math.random()-.5)*.6;
    tween(.18,u=>{const c=mpos();tr.pos=lerp3(s,[c[0]-.2,c[1]+.3+dy,c[2]+.6],u);tr.w=.45;tr.h=.1;tr.a=1;});
    at(.18,()=>{rm(tr);if(i%2===0){const t=mpos();goldBurst(t,5,3,.3,.25,og);E.parts.push({x:t[0]-.2,y:t[1]+.4,z:t[2]+.7,vx:-1.5,vy:2,vz:0,g:6,life:.6,max:.6,size:.22,tex:bolt,rot:0,vr:8});E.shake=Math.max(E.shake,.2);sigHit(m);}});});
  const sh=sigSp(og);tween(.3,u=>{const c=mpos(),p=lerp3(TIP(),[c[0],c[1]+.4,c[2]+.6],u);sh.pos=[p[0],p[1]+.5*Math.sin(PI*u),p[2]];sh.w=sh.h=.8;sh.a=1;E.parts.push({x:sh.pos[0],y:sh.pos[1],z:sh.pos[2],vx:0,vy:.4,vz:0,g:0,life:.4,max:.4,size:.4,gs:.6,tex:sm,rot:0,vr:0});},BIGS);
  at(BIGS+.3,()=>{rm(sh);const t=mpos();sigBig(m,t,gear,og);burst(t,16,bolt,6,.5);goldBurst(t,30,4,1.0,.6,sm);E.flash.mon=[1,.75,.4,1];});
  at(TOT,()=>{[...K.sps,...gs,tur,muz,sh].forEach(rm);});return TOT;}
// --- 神秘使者：水晶隕落 (the crystal orb rises; the words fly up over the monster and fuse into one giant crystal, which falls and bursts into a fan of prism light) ---
function sigH10(sentence,th){const K=sigBase(sentence,th,'h10'),{m,gl,rm,n}=K,h=E.hero,crys=tCrystal(),ball=emojiTex('🔮'),pur=gtex([170,140,255]),G0=.9,FORM=2.2,FALL=2.7,HIT=2.95,TOT=HIT+1.6;
  const og=sigSp(pur),ob=sigSp(ball),bg=sigSp(pur),big=sigSp(crys);
  tween(.5,u=>{h.off.y=.2*ease(u);},.2);tween(.4,u=>{h.off.y=.2*(1-ease(u));},FALL);
  tween(FALL+.2,u=>{const t=u*(FALL+.2),p=hpos(),g=ease(cl((t-.1)/.4))*(t>FALL?Math.max(0,1-(t-FALL)/.2):1),P=[p[0]+.3,p[1]+1.9+.1*Math.sin(t*3),p[2]+.8];ob.pos=P;ob.w=ob.h=.75*g;ob.a=g;og.pos=P;og.w=og.h=(1.6+.3*Math.sin(t*8))*g;og.a=.5*g;});
  const SKY=c=>[c[0],c[1]+3.6,c[2]+.5];
  sigWords(K,(k,t,c)=>{if(t<.2||t>FORM)return null;const p=hpos(),o=[p[0]+.3,p[1]+1.9,p[2]+.8],S=SKY(c),f=ease(cl((t-.3-k*.08)/.8)),a=k/n*PI*2+t*2,r=1.4*(1-cl((t-1.5)/(FORM-1.5)));
    return{pos:lerp3(o,[S[0]+Math.cos(a)*r,S[1]+Math.sin(a)*r*.5,S[2]],f),a:t>FORM-.2?(FORM-t)/.2:1,sc:.45};},TOT);
  tween(HIT-G0+.2,u=>{const t=G0+u*(HIT-G0+.2),c=mpos(),S=SKY(c),gk=ease(cl((t-1.5)/(FORM-1.2)));let y=S[1];if(t>FALL){const q=cl((t-FALL)/(HIT-FALL));y=S[1]+(c[1]+.9-S[1])*q*q;}
    big.pos=[S[0],y,S[2]];big.w=1.0*gk;big.h=1.6*gk;big.a=t>HIT?0:gk;big.rot=PI+(t<FALL?.05*Math.sin(t*4):0);bg.pos=big.pos;bg.w=bg.h=3.4*gk*(1+.1*Math.sin(t*10));bg.a=t>HIT?0:.45*gk;
    if(t>1.3&&t<FORM&&Math.random()<.8){const a=Math.random()*PI*2;E.parts.push({x:S[0]+Math.cos(a)*2,y:S[1]+Math.sin(a)*1.2,z:S[2],vx:-Math.cos(a)*4,vy:-Math.sin(a)*2.4,vz:0,g:0,life:.5,max:.5,size:.25,tex:crys,rot:a,vr:3});}},G0);
  at(HIT,()=>{const t=mpos();sigBig(m,t,crys,pur);burst(t,26,crys,7,.5);E.flash.mon=[.85,.75,1,1];
    [[255,120,120],[255,200,100],[255,255,140],[130,255,150],[120,200,255],[180,140,255]].forEach((cc,j)=>{const a=PI/2+(j-2.5)*.38,b=sigSp(gtex(cc));
      tween(.9,u=>{const L=2.6*ease(Math.min(1,u*2));b.pos=[t[0]+Math.cos(a)*L*.5,t[1]+.5+Math.sin(a)*L*.5,t[2]+.8];b.rot=a;b.w=L*.5+.1;b.h=.14;b.a=1-u;});at(.95,()=>rm(b));});});
  at(TOT,()=>{[...K.sps,og,ob,bg,big].forEach(rm);h.off.y=0;});return TOT;}
// ===== shared helpers for the big moves =====
// first effect animation that exists (new sheets from docs/vfx-spritesheet-prompt.md are used as soon as they are added)
function vfxOr(...ks){if(typeof VFX==='undefined')return ks[ks.length-1];for(const k of ks)if(VFX[k])return k;return ks[ks.length-1];}
function dimScreen(f,t0,t1){const c=E.canvas,undo=()=>{try{c.style.filter='';}catch(e){}};at(t0,()=>{try{c.style.transition='filter .7s ease-in-out';c.style.filter=f;}catch(e){}});at(t1,undo);setTimeout(undo,(t1+1.5)*2000);}
function flashScreen(t,k){at(t,()=>{const c=E.canvas;try{c.style.transition='filter .09s ease-out';c.style.filter='brightness('+(1.22+(k||0)*.45)+') saturate(.85)';setTimeout(()=>{try{c.style.transition='filter .7s ease-in-out';c.style.filter='';}catch(e){}},110);}catch(e){}});}
// a glowing rune lying on the ground (a squashed billboard), fades in and out
// a monster powering up on the ground: a soft glow pooling under it, energy streaming up from the ground and dust kicked up (no drawn circle)
function groundCharge(x,z,col,rgb,R,t0,dur){const g={tex:gtex(rgb),pos:[x,.04,z],w:0,h:0,rot:0,a:0},sk=sparkTex(rgb);at(t0,()=>E.sprites.unshift(g));
  tween(dur,u=>{const k=Math.min(1,u*4)*(u>.8?(1-u)/.2:1);g.w=R*.75*(1+.06*Math.sin(u*30));g.h=R*.2;g.a=.55*k;
    if(RN()<.8*k){const a=RN()*PI*2,r=R*.35*(.4+RN()*.6);E.parts.push({x:x+Math.cos(a)*r,y:.05,z:z+Math.sin(a)*r*.3,vx:0,vy:2+RN()*2.5,vz:0,g:0,dr:1,life:.5,max:.5,size:.14,tex:sk,rot:0,vr:0,st:1});}
    if(RN()<.25*k)fxDust([x+(RN()-.5)*R*.6,0,z],.6,1);},t0);at(t0+dur+.02,()=>rmSp(g));}
function groundRune(x,z,col,rgb,R,t0,dur){const s={tex:tRune(col),pos:[x,.06,z],w:0,h:0,rot:0,a:0},g={tex:gtex(rgb),pos:[x,.3,z-.05],w:0,h:0,rot:0,a:0};at(t0,()=>{E.sprites.unshift(g);E.sprites.push(s);});
  tween(dur,u=>{const k=u<.2?ease(u/.2):u>.8?(1-u)/.2:1;s.w=R*k;s.h=R*.3*k;s.a=.95*k;g.w=R*1.3*k;g.h=R*.6*k;g.a=.45*k*(.8+.2*Math.sin(u*40));},t0);
  at(t0+dur+.02,()=>[s,g].forEach(q=>{const j=E.sprites.indexOf(q);if(j>=0)E.sprites.splice(j,1);}));}
function rmSp(s){const j=E.sprites.indexOf(s);if(j>=0)E.sprites.splice(j,1);}
// the hero takes a monster hit at dt: element effect, spark, flash, knock-back (small = a lighter hit inside a combo)
function heroHurt(dt,rgb,small,vk){const h=E.hero;at(dt,()=>{try{SFX.impact(small)}catch(e){}const t=hpos();
  if(vk){if(vk==='lightning')vfx(vk,[t[0]+.2,0,t[2]+.7],small?1.1:1.5,{bottom:1});else vfx(vk,[t[0]+.2,t[1],t[2]+.7],small?.9:1.3);}vfx('hit_spark',[t[0]+.3,t[1],t[2]+.75],small?.6:.85);
  goldBurst(t,small?10:22,4,.5,.34,gtex(rgb));E.shake=Math.max(E.shake,small?.3:.7);E.flash.hero=[rgb[0]/255,rgb[1]/255,rgb[2]/255,small?.45:.8];
  if(!small){heroPlay('hit',.7);tween(.6,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);h.off.x=-.9*e;h.off.rz=.35*e;h.off.sq=1-.2*Math.sin(PI*cl(u*1.5));});}});return dt+.12;}
// monster wind-ups: rear back, rise up, or lunge at the hero
function monWind(kind,dur){const m=E.mon;tween(dur,u=>{const e=Math.sin(PI*u);if(kind==='up'){m.off.y=.06*e;m.off.sq=1+.1*e;m.off.sc=1+.05*e;}else if(kind==='rear'){m.off.rz=.25*e;m.off.sq=1-.12*e;}
  else{m.off.x=u<.45?.35*ease(u/.45):.35-1.35*Math.sin(PI*(u-.45)/.55);m.off.sq=1-.1*e;}});at(dur,()=>{m.off.x=0;m.off.y=0;m.off.sq=1;m.off.rz=0;m.off.sc=1;});}
const MF=()=>{const p=mpos();return[p[0]-.8,p[1]+.2,p[2]+.5];},HT0=()=>{const p=hpos();return[p[0]+.2,p[1]-.2,p[2]+.5];};
// ===== second attack for every element (the battle picks one of the two at random) =====
function hurt2(type){if(!E.mon)return 0;const R=Math.random,p=hpos(),x=p[0]+.2,z=p[2]+.7;at(.3,()=>{try{SFX.matk(type)}catch(e){}});
  if(type==='fire'){   // a pillar of fire erupts under the hero
    monWind('rear',.5);groundCharge(x,z,'#FF8A3A',[255,140,50],1.6,.25,1.5);
    for(let j=0;j<3;j++)vfx('flame_loop',[x+(j-1)*.45,.6+(j%2)*.2,z+.05],.75+.1*(j%2),{loop:1,dur:1.0,delay:.7+j*.05,rise:.4});
    if(VFX.fire_pillar){fxGround([x,0,z],[255,120,40],1.2,.55);at(.66,()=>{E.shake=Math.max(E.shake,.45);});vfx('fire_pillar',[x,0,z+.1],1.35,{bottom:1,sink:.1,delay:.62,fps:22,sway:.5,tick:(P,u,h)=>{if(u>.15&&u<.75)fxEmbers(P,h,2);}});}else vfx('fire_burst',[x,1.3,z+.1],1.6,{delay:.75});return heroHurt(.8,[255,140,50],false,null);}
  if(type==='ice'){   // a line of ice spikes races along the ground to the hero
    monWind('rear',.45);const a=MF(),b=HT0();
    for(let j=0;j<7;j++){const q=(j+1)/7,xx=a[0]+(b[0]+.3-a[0])*q,s={tex:tShard(),pos:[xx,0,b[2]+.3],w:0,h:0,rot:0,a:1},t0=.35+j*.06;
      at(t0,()=>{E.sprites.push(s);goldBurst([xx,.2,b[2]+.4],5,2,.4,.25,gtex([200,240,255]));});
      tween(.7,u=>{const g=u<.25?ease(u/.25):1;s.w=.3;s.h=(.55+.5*q)*g;s.pos=[xx,s.h*.9,b[2]+.3+(j%2)*.25];s.a=u<.7?1:(1-u)/.3;},t0);at(t0+.72,()=>rmSp(s));}
    return heroHurt(.35+6*.06+.1,[140,220,255],false,'ice_burst');}
  if(type==='elec'){   // dark storm clouds gather over the hero; two warning bolts, then a big one strikes from the clouds down onto him
    monWind('up',.5);const HB=1.1,dk=gtex([55,55,85]),lt=gtex([200,210,255]),cs=[];
    if(VFX.storm_cloud)vfx('storm_cloud',[x,4.6,z-.2],1.3,{loop:1,dur:HB+.45,fps:14});else for(let j=0;j<7;j++){const s={tex:dk,pos:[0,0,0],w:0,h:0,rot:0,a:0},ox=(j-3)*.5,oy=(j%2)*.25;cs.push(s);E.sprites.push(s);
      tween(HB+.5,u=>{const t=u*(HB+.5),g=ease(cl((t-.15)/.4))*(t>HB+.2?Math.max(0,1-(t-HB-.2)/.3):1);s.pos=[x+ox,4.7+oy+.05*Math.sin(t*3+j),z-.2];s.w=1.0*g;s.h=.6*g;s.a=.92*g;});}
    const glo={tex:lt,pos:[x,4.75,z-.15],w:2.8,h:1.0,rot:0,a:0};E.sprites.push(glo);tween(HB+.5,u=>{const t=u*(HB+.5);glo.a=t>.45&&t<HB+.2&&R()<.22?.55:0;});
    [[.62,-.9,2.0],[.84,.8,2.1],[HB-.08,0,2.75]].forEach(([t0,ox,sz],i)=>at(t0,()=>{vfx('lightning',[x+ox,0,z],sz,{bottom:1,fps:30});E.bgFlash=1;E.shake=Math.max(E.shake,i===2?.6:.3);glo.a=.9;
      goldBurst([x+ox,.15,z+.1],i===2?18:8,4,.35,.22,gtex([255,240,150]));}));
    at(HB+.55,()=>{cs.forEach(rmSp);rmSp(glo);});return heroHurt(HB,[255,235,90],false,null);}
  if(type==='poison'){   // a toxic cloud rolls over the hero, dripping
    monWind('rear',.5);const pg=gtex([170,90,220]),gg=gtex([140,220,90]);
    tween(1.1,()=>{for(let j=0;j<3;j++)E.parts.push({x:x+(R()-.5)*1.8,y:p[1]+.4+(R()-.5)*1.2,z,vx:(R()-.5)*.4,vy:.2,vz:0,g:0,life:1,max:1,size:.4+R()*.4,gs:.5,al:.55,tex:R()<.5?pg:gg,rot:0,vr:0});
      if(R()<.4)E.parts.push({x:x+(R()-.5)*1.4,y:p[1]+1.2,z,vx:0,vy:-2.5,vz:0,g:3,life:.6,max:.6,size:.16,tex:gg,rot:0,vr:0});},.3);
    vfx(vfxOr('poison_cloud','dark_burst'),[x,p[1]+.3,z+.05],1.25,{delay:.4,a:.8});heroHurt(.6,[170,90,220],true,null);return heroHurt(1.1,[170,90,220],false,null);}
  if(type==='forest'){   // thorny vines burst out of the ground around the hero
    monWind('rear',.5);groundCharge(x,z,'#7CFF8A',[120,235,140],1.4,.25,1.2);
    if(VFX.thorn_burst)vfx('thorn_burst',[x,0,z+.05],1.1,{bottom:1,fps:20,delay:.4});else for(let j=0;j<5;j++){const s={tex:emojiTex('🌿'),pos:[0,0,0],w:0,h:0,rot:0,a:1},xx=x+(j-2)*.35,t0=.45+j*.05;at(t0,()=>E.sprites.push(s));
      tween(.8,u=>{const g=u<.3?ease(u/.3):1;s.w=s.h=.7*g;s.pos=[xx,.2+.8*g,z+(j%2)*.2];s.rot=(j-2)*.3+.2*Math.sin(u*12);s.a=u<.75?1:(1-u)/.25;},t0);at(t0+.82,()=>rmSp(s));}
    return heroHurt(.7,[120,235,140],false,'leaf_swirl');}
  if(type==='sea'){   // a rolling wave of splashes runs along the ground
    monWind('lunge',.6);const a=MF(),b=HT0();
    if(VFX.tidal_wave){vfx('tidal_wave',[a[0]-.2,0,b[2]+.35],1.0,{bottom:1,flip:1,move:[b[0]-a[0]-.4,0],fps:20,delay:.3,tick:(P,u,h)=>{if(u>.2&&u<.8)fxSpray(P,h,3);if(u>.55&&u<.6)E.shake=Math.max(E.shake,.35);}});for(let j=0;j<5;j++)vfx('water_splash',[b[0]+(R()-.5)*1.2,.4+R()*.6,b[2]+.5],.6,{delay:.85+j*.06});return heroHurt(.95,[120,200,255],false,null);}
    for(let j=0;j<6;j++){const q=j/5;vfx('water_splash',[a[0]+(b[0]-a[0])*q,.55,b[2]+.3],.65+.25*q,{delay:.35+j*.07,fps:32});}
    return heroHurt(.35+5*.07+.15,[120,200,255],false,'water_splash');}
  if(type==='desert'){   // a swirling sandstorm around the hero
    monWind('rear',.5);const sd=[gtex([230,200,140]),gtex([200,160,100])];
    tween(1.0,()=>{for(let j=0;j<5;j++){const a=R()*PI*2,r=.4+R()*1.1;E.parts.push({x:x+Math.cos(a)*r,y:.2+R()*2.2,z:z+Math.sin(a)*r*.4,vx:-Math.sin(a)*3,vy:.5,vz:Math.cos(a),g:0,life:.5,max:.5,size:.25+R()*.3,gs:.4,al:.7,tex:sd[j&1],rot:0,vr:0});}},.3);
    if(VFX.sandstorm)vfx('sandstorm',[x,0,z+.05],1.25,{bottom:1,sink:.1,loop:1,dur:1.1,delay:.4,a:.9,grow:.15,sway:.35,tick:(P,u,h)=>fxDust(P,h,2,[220,190,130])});else vfx('smoke_puff',[x,p[1],z],1.3,{delay:.5,a:.7});return heroHurt(.9,[220,180,110],false,null);}
  if(type==='sky'){   // a whirlwind travels across and hits the hero
    monWind('up',.5);const sk=sparkTex([235,245,255]);
    tween(.8,u=>{const c=lerp3(MF(),HT0(),u);for(let j=0;j<6;j++){const a=R()*PI*2,y=R()*2.4,r=.25+y*.35;E.parts.push({x:c[0]+Math.cos(a)*r,y:.1+y,z:c[2]+Math.sin(a)*r*.4,vx:-Math.sin(a)*4,vy:.6,vz:Math.cos(a)*1.5,g:0,dr:2,life:.35,max:.35,size:.14,tex:sk,rot:0,vr:0,st:1});}},.35);
    if(VFX.tornado){const a=MF(),b=HT0();vfx('tornado',[a[0],0,b[2]+.3],1.3,{bottom:1,sink:.08,loop:1,dur:1.05,delay:.3,move:[b[0]-a[0]+.2,0],mease:1,sway:.6,tick:(P,u,h)=>fxDust(P,h,2,[225,235,245])});}else vfx('smoke_puff',[x,1.0,z],1.2,{delay:.9,a:.8});return heroHurt(1.15,[200,230,255],false,null);}
  if(type==='mech'){   // charges a red laser and sweeps it over the hero
    monWind('rear',.4);const og=gtex([255,90,70]),bm={tex:og,pos:[0,0,0],w:0,h:0,rot:0,a:0},bc={tex:gtex([255,240,230]),pos:[0,0,0],w:0,h:0,rot:0,a:0},ch={tex:og,pos:MF(),w:0,h:0,rot:0,a:0};E.sprites.push(ch,bm,bc);if(VFX.laser_beam){bm.tex=bc.tex=null;at(.5,()=>vcol('laser_beam',MF(),HT0(),{loop:1,dur:.55,fps:24,sq:.35}));}
    tween(1.2,u=>{const t=u*1.2,a=MF(),b=HT0(),ck=t<.5?ease(t/.5):1;ch.pos=a;ch.w=ch.h=.3+.5*ck*(1+.2*Math.sin(t*50));ch.a=ck*(t<1?1:(1.2-t)/.2);
      if(t>.5&&t<1.05){const L=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=Math.atan2(b[1]-a[1],b[0]-a[0]),k=t<.56?(t-.5)/.06:t>.95?(1.05-t)/.1:1;bm.pos=bc.pos=[(a[0]+b[0])/2,(a[1]+b[1])/2,a[2]];bm.rot=bc.rot=ang;bm.w=bc.w=L/2;bm.h=.32*k*(1+.15*Math.sin(t*70));bc.h=.1*k;bm.a=bc.a=k;
        if(R()<.5)vfx('hit_spark',[b[0]+.1,b[1]+(R()-.5)*.4,b[2]+.3],.45,{fps:40});}else bm.a=bc.a=0;});
    at(1.25,()=>{rmSp(bm);rmSp(bc);rmSp(ch);});heroHurt(.6,[255,90,70],true,null);return heroHurt(1.0,[255,90,70],false,vfxOr('laser_hit','fire_burst'));}
  if(type==='ghost'){   // ghostly wisps fly out in curving paths, circle the hero and plunge in; colour drains from the screen for a moment
    monWind('up',.55);const wt=gtex([190,150,255]),HB=1.15;dimScreen('saturate(.35) brightness(.85) hue-rotate(20deg)',.35,HB+.25);
    for(let j=0;j<5;j++){const s={tex:wt,pos:MF(),w:0,h:0,rot:0,a:0},ph=j/5*PI*2,t0=.35+j*.05;at(t0,()=>E.sprites.push(s));
      tween(HB-t0,u=>{const a=MF(),b=HT0(),cx2=b[0]+.1,cy=b[1],ang=ph+u*PI*3,orb=u<.55?0:(u-.55)/.45,r=1.3*(1-orb*orb);
        const P=u<.55?lerp3(a,[cx2+Math.cos(ang)*1.3,cy+Math.sin(ang)*.9,b[2]],ease(u/.55)):[cx2+Math.cos(ang)*r,cy+Math.sin(ang)*.9*(r/1.3),b[2]];
        s.pos=P;s.w=s.h=.45+.1*Math.sin(u*30+j);s.a=.9;E.parts.push({x:P[0],y:P[1],z:P[2]-.01,vx:0,vy:.3,vz:0,g:0,life:.35,max:.35,size:.32,gs:-.7,al:.6,tex:wt,rot:0,vr:0});},t0);at(HB+.02,()=>rmSp(s));}
    vfx('dark_burst',[x,p[1],z],1.1,{delay:HB-.05,a:.9});return heroHurt(HB,[170,130,240],false,null);}
  if(type==='skel'){   // a cage of bones bursts out of the ground around the hero and snaps shut; bone shards fly
    monWind('rear',.5);const bn=tBone(),wt=gtex([245,238,220]),SN=.95;groundCharge(x,z,'#E8DCC0',[235,225,200],1.3,.25,1.0);
    for(let j=0;j<8;j++){const s={tex:bn,pos:[0,0,0],w:0,h:0,rot:0,a:1},sd=j<4?-1:1,k=j%4,xx=x+sd*(.5+k*.13),zz=z+(k-1.5)*.18,t0=.4+k*.04;at(t0,()=>{E.sprites.push(s);goldBurst([xx,.15,zz],4,2,.35,.2,wt);});
      tween(SN+.4-t0,u=>{const t=t0+u*(SN+.4-t0),g=ease(cl((t-t0)/.2)),c2=ease(cl((t-SN+.15)/.15)),rot=sd*(.15+.55*c2),hh=(.75+.15*k)*g;
        s.w=.14;s.h=hh;s.rot=rot;s.pos=[xx-Math.sin(rot)*hh,Math.cos(rot)*hh,zz];s.a=t<SN+.2?1:Math.max(0,1-(t-SN-.2)/.2);},t0);at(SN+.42,()=>rmSp(s));}
    at(SN,()=>{for(let j=0;j<18;j++)E.parts.push({x:x+(R()-.5)*.8,y:.6+R()*1.2,z:z+.1,vx:(R()-.5)*5,vy:2+R()*3,vz:0,g:9,life:.7,max:.7,size:.12+R()*.1,tex:bn,rot:R()*6,vr:(R()-.5)*14});E.shake=Math.max(E.shake,.5);});
    return heroHurt(SN,[230,220,200],false,'dark_burst');}
  if(type==='dragon'){   // a long stream of dragon fire
    monWind('rear',.5);if(VFX.fire_breath)vline('fire_breath',MF,HT0,{back:.35,muzzle:[255,170,70],loop:1,dur:.75,fps:24,sq:.5,delay:.35});else tween(.75,()=>{const a=MF(),b=HT0();for(let j=0;j<4;j++){const P=lerp3(a,b,R()*.15);E.parts.push({x:P[0],y:P[1]+(R()-.5)*.2,z:P[2],vx:(b[0]-a[0])*1.6,vy:(b[1]-a[1])*1.6+(R()-.5)*1.2,vz:0,g:0,life:.6,max:.6,size:.3+R()*.3,gs:1,tex:emojiTex('🔥'),rot:0,vr:0});}},.35);
    return heroHurt(.8,[255,120,60],false,'fire_burst');}
  return 0;}
// ===== special moves of elites ('e'), bosses ('b') and legends ('L'): charge, then a big strike in the monster's element =====
function monBarrage(type,tier){if(!E.mon)return 0;const m=E.mon,big=tier==='b'||tier==='L',L=tier==='L',S=L?1.5:big?1.2:1,T0=L?2.0:big?1.3:1.0,rgb=(HURT[type]||{}).c||[255,120,60],col='rgb('+rgb.join(',')+')',R=Math.random,sk=sparkTex(rgb);
  const mp=mpos();groundCharge(mp[0],mp[2]+.4,col,rgb,2.2*S,0,T0+.3);
  tween(T0,u=>{const e=Math.sin(PI*Math.min(1,u*1.3));m.off.y=.4*e*S;m.off.sc=1+.08*e;E.tint.mon=[rgb[0]/255,rgb[1]/255,rgb[2]/255,.5*e];
    if(R()<.8){const c=mpos(),a=R()*PI*2,r=2.2*S;E.parts.push({x:c[0]+Math.cos(a)*r,y:c[1]+Math.sin(a)*r*.7,z:c[2]+.5,vx:-Math.cos(a)*r*1.6,vy:-Math.sin(a)*r*1.1,vz:0,g:0,life:.6,max:.6,size:.2,tex:sk,rot:0,vr:0,st:1});}});
  at(T0,()=>{m.off.y=0;m.off.sc=1;});if(big)dimScreen(L?'brightness(.38) saturate(1.4) contrast(1.15)':'brightness(.66) saturate(1.1)',.1,L?T0+3.6:T0+1.7);
  at(.2,()=>{try{SFX.matk(type)}catch(e){}});at(T0-.1,()=>{try{SFX.matk(type)}catch(e){}});
  const p=hpos(),cx=p[0]+.2,z=p[2]+.7,n=L?12:big?7:5,DT=.16,FIN=T0+n*DT+.3;
  const style={fire:'meteor',dragon:'meteor',ice:'ice',elec:'storm',poison:'dark',ghost:'dark',skel:'dark',forest:'vine',sea:'wave',desert:'tornado',sky:'tornado',mech:'laser'}[type]||'meteor';
  const drop=(t0,xx,sz,tex,tail,land)=>{const hd={tex,pos:[0,0,0],w:0,h:0,rot:0,a:0},tl=tail?{tex:tail,pos:[0,0,0],w:0,h:0,rot:0,a:0}:null;at(t0,()=>{E.sprites.push(hd);if(tl)E.sprites.push(tl);});
    tween(.35,u=>{const s=[xx+2.6,6.5],e=[xx,.35],q=u*u,P=[s[0]+(e[0]-s[0])*q,s[1]+(e[1]-s[1])*q,z],ang=Math.atan2(e[1]-s[1],e[0]-s[0]);hd.pos=P;hd.w=hd.h=sz;hd.a=1;hd.rot=u*6;
      if(tl){tl.pos=[P[0]-Math.cos(ang)*sz*1.5,P[1]-Math.sin(ang)*sz*1.5,z-.02];tl.rot=ang;tl.w=sz*2.6;tl.h=sz*.6;tl.a=.9;}},t0);
    at(t0+.35,()=>{rmSp(hd);if(tl)rmSp(tl);land([xx,.4,z]);E.shake=Math.max(E.shake,.4);});};
  for(let j=0;j<n;j++){const t0=T0+j*DT,xx=cx+(L?.8:0)+(R()-.5)*(L?4.6:2.6);
    if(style==='meteor')drop(t0,xx,.45*S,emojiTex('🔥'),uslash('h4',ULT.h4),P=>{vfx('fire_burst',[P[0],.75,P[2]],.85*S);goldBurst(P,10,4,.5,.3,gtex(rgb));});
    else if(style==='ice')drop(t0,xx,.5*S,tShard(),null,P=>{vfx('ice_burst',[P[0],.7,P[2]],.8*S);});
    else if(style==='storm')at(t0,()=>{vfx('lightning',[xx,0,z],1.4*S,{bottom:1});E.bgFlash=1;E.shake=Math.max(E.shake,.35);});
    else if(style==='dark')at(t0,()=>{vfx(type==='poison'?vfxOr('poison_cloud','dark_burst'):'dark_burst',[xx,.6,z],.8*S);goldBurst([xx,.4,z],8,3,.5,.3,gtex(rgb));});
    else if(style==='vine')at(t0,()=>{const s={tex:emojiTex('🌿'),pos:[xx,0,z],w:0,h:0,rot:0,a:1};E.sprites.push(s);tween(.6,u=>{const g=u<.3?ease(u/.3):1;s.w=s.h=.8*S*g;s.pos=[xx,.25+.8*S*g,z];s.rot=.2*Math.sin(u*14);s.a=u<.7?1:(1-u)/.3;});at(.62,()=>rmSp(s));vfx('leaf_swirl',[xx,.6,z],.6*S,{delay:.1});});
    else if(style==='wave'){if(VFX.tidal_wave){if(j%2===0)at(t0,()=>{const a=MF();vfx('tidal_wave',[a[0]+.2,0,z-.3+j*.04],(.95+.25*j/n)*S,{bottom:1,flip:1,move:[cx-a[0]-.6,0],fps:22,tick:(P,u,h)=>{if(u>.2&&u<.8)fxSpray(P,h,2);}});});}else at(t0,()=>{const q=j/(n-1),a=MF();vfx('water_splash',[a[0]+(cx-a[0])*q,.7,z-.3],(.7+.4*q)*S,{fps:30});});}
    else if(style==='tornado')at(t0,()=>{const q=j/(n-1),a=MF(),c=[a[0]+(cx-a[0])*q,0,z];for(let k=0;k<10;k++){const an=R()*PI*2,y=R()*2.8*S,r=.3+y*.3;E.parts.push({x:c[0]+Math.cos(an)*r,y:.1+y,z:c[2]+Math.sin(an)*r*.4,vx:-Math.sin(an)*5,vy:.8,vz:Math.cos(an)*2,g:0,dr:2,life:.4,max:.4,size:.16,tex:sk,rot:0,vr:0,st:1});}if(VFX.tornado&&j%3===0){const b=MF();vfx('tornado',[b[0],0,z-.1],1.0*S,{bottom:1,sink:.08,loop:1,dur:1.0,move:[cx-b[0]+(R()-.5),0],mease:1,a:.95,sway:.6,tick:(P,u,h)=>fxDust(P,h,1,type==='desert'?[220,190,130]:[225,235,245])});}else vfx(VFX.sandstorm&&type==='desert'?'sandstorm':'smoke_puff',[c[0],type==='desert'?0:.6,c[2]],.6*S,type==='desert'?{a:.8,bottom:1}:{a:.6});});
    else if(style==='laser')at(t0,()=>{const b={tex:gtex(rgb),pos:[xx,3,z],w:0,h:0,rot:0,a:0};E.sprites.push(b);tween(.3,u=>{const k=Math.sin(PI*u);b.w=.3*S*k;b.h=6*k;b.a=k;});at(.32,()=>rmSp(b));at(.08,()=>vfx(vfxOr('laser_hit','fire_burst'),[xx,.6,z],.75*S));});
    if(j%2===1)heroHurt(t0+.36,rgb,true,null);}
  // the final blow lands on the hero; legends add a shock wave and a second burst
  const fk={meteor:'fire_burst',ice:'ice_burst',storm:'lightning',dark:type==='poison'?vfxOr('poison_cloud','dark_burst'):'dark_burst',vine:'leaf_swirl',wave:'water_splash',tornado:'smoke_puff',laser:vfxOr('laser_hit','fire_burst')}[style];
  at(FIN-.05,()=>{const t=hpos(),q=[t[0]+.2,t[1],t[2]+.75];if(fk==='lightning')vfx(fk,[q[0],0,q[2]],2.0*S,{bottom:1});else vfx(fk,q,1.5*S);vfx('hit_spark',q,1.2*S);flashScreen(0,L?.4:0);
    if(L){const rg=sigSp(tRing(col));tween(.8,u=>{rg.pos=[q[0],q[1],q[2]];rg.w=rg.h=.8+5*ease(u);rg.a=1-u;});at(.85,()=>rmSp(rg));vfx(vfxOr('explosion_big','holy_burst'),q,2.2,{delay:.1});}});
  return heroHurt(FIN,rgb,false,null);}
// ===== special moves (菁英 / 魔王 / 傳奇): two per element and tier, picked at random =====
// elite = a quick element move, boss = rune + roar then a big area move, legend = a cinematic (dark sky, giant sigil, the whole stage shakes) and a stage-wide cataclysm.
const RN=Math.random;
const tRock=()=>prT('boulder',sigTex('sg_rock',128,128,x=>{const g=x.createRadialGradient(50,44,6,64,64,64);g.addColorStop(0,'#B49A7A');g.addColorStop(.6,'#7A6248');g.addColorStop(1,'#4A3A2A');x.fillStyle=g;x.strokeStyle='#3A2C20';x.lineWidth=4;x.beginPath();
  [[64,8],[104,22],[120,60],[108,100],[70,120],[30,110],[10,72],[22,30]].forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();x.stroke();x.strokeStyle='rgba(60,45,30,.6)';x.lineWidth=3;x.beginPath();x.moveTo(40,40);x.lineTo(62,64);x.lineTo(56,92);x.moveTo(62,64);x.lineTo(92,58);x.stroke();}));
const tPyr=()=>prT('pyramid',sigTex('sg_pyr',256,200,x=>{const g=x.createLinearGradient(0,0,256,0);g.addColorStop(0,'#FFE7A0');g.addColorStop(.5,'#E8B94A');g.addColorStop(1,'#9C6F1E');x.fillStyle=g;x.shadowColor='#FFD36A';x.shadowBlur=18;x.beginPath();x.moveTo(128,8);x.lineTo(248,192);x.lineTo(8,192);x.closePath();x.fill();
  x.shadowBlur=0;x.strokeStyle='rgba(120,80,20,.6)';x.lineWidth=3;for(let i=1;i<6;i++){const y=8+i*31;x.beginPath();x.moveTo(128-(y-8)*.652,y);x.lineTo(128+(y-8)*.652,y);x.stroke();}
  x.fillStyle='#7CF7FF';x.shadowColor='#7CF7FF';x.shadowBlur=14;x.beginPath();x.ellipse(128,110,18,10,0,0,7);x.fill();x.fillStyle='#103040';x.beginPath();x.arc(128,110,5,0,7);x.fill();}));
const tBubble=()=>prT('bubble',sigTex('sg_bub',128,128,x=>{const g=x.createRadialGradient(64,64,30,64,64,62);g.addColorStop(0,'rgba(160,220,255,.12)');g.addColorStop(.85,'rgba(170,230,255,.45)');g.addColorStop(1,'rgba(255,255,255,.9)');x.fillStyle=g;x.beginPath();x.arc(64,64,60,0,7);x.fill();
  x.fillStyle='rgba(255,255,255,.85)';x.beginPath();x.ellipse(44,40,14,8,-.6,0,7);x.fill();}));
const tHand=col=>sigTex('sg_hand'+col,160,200,x=>{x.fillStyle=col;x.shadowColor=col;x.shadowBlur=20;x.globalAlpha=.85;x.beginPath();x.ellipse(80,150,46,44,0,0,7);x.fill();
  [[30,95,-.5],[55,70,-.2],[82,62,0],[108,72,.22],[132,108,.7]].forEach(([fx,fy,r])=>{x.save();x.translate(fx,fy+40);x.rotate(r);x.beginPath();x.ellipse(0,-30,11,38,0,0,7);x.fill();x.restore();});});
const tRoot=()=>prT('root',sigTex('sg_root',64,256,x=>{const g=x.createLinearGradient(0,0,64,0);g.addColorStop(0,'#4E3420');g.addColorStop(.5,'#8A6038');g.addColorStop(1,'#3E2816');x.fillStyle=g;x.strokeStyle='#2A1A0C';x.lineWidth=3;x.beginPath();x.moveTo(32,4);x.quadraticCurveTo(46,90,54,250);x.lineTo(10,250);x.quadraticCurveTo(18,90,32,4);x.closePath();x.fill();x.stroke();
  x.fillStyle='#5FB84A';[[40,80],[20,140],[46,190]].forEach(([a,b])=>{x.beginPath();x.ellipse(a,b,9,5,.6,0,7);x.fill();});}));
const tChain=()=>prT('chain',sigTex('sg_chain',200,48,x=>{x.strokeStyle='#5A5A66';x.lineWidth=9;for(let i=0;i<4;i++){x.beginPath();x.ellipse(28+i*48,24,26,14,0,0,7);x.stroke();}}));
const tWingP=()=>prT('wing',sigTex('sg_wing',128,128,x=>{x.fillStyle='rgba(255,252,240,.95)';x.shadowColor='rgba(255,230,150,.9)';x.shadowBlur=10;x.beginPath();x.moveTo(10,118);x.quadraticCurveTo(30,20,120,8);x.quadraticCurveTo(100,60,70,80);x.quadraticCurveTo(60,100,10,118);x.fill();}));
const tBlade=col=>sigTex('sg_blade'+col,256,128,x=>{x.shadowColor=col;x.shadowBlur=16;x.fillStyle=col;x.beginPath();x.moveTo(20,100);x.quadraticCurveTo(128,-20,236,100);x.quadraticCurveTo(128,30,20,100);x.fill();
  x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.moveTo(50,88);x.quadraticCurveTo(128,0,206,88);x.quadraticCurveTo(128,26,50,88);x.fill();});
// positions: hero hit point, hero ground point, monster front
const HP=()=>{const p=hpos();return[p[0]+.2,p[1]-.15,p[2]+.75];},HG=()=>{const p=hpos();return[p[0]+.2,0,p[2]+.7];},MP=()=>MF();
const fl=()=>emojiTex('🔥');
function SE(t,X){at(t,()=>{try{SFX.uEl(X.type)}catch(e){}});}
function HIT(P,X,vk,s){vfx(vk||MV[X.type]||'hit_spark',P,(s||1)*1.1);vfx('hit_spark',P,(s||1)*.8);goldBurst(P,12,4,.45,.28,X.g);}
// shake the whole stage box (CSS), not only the camera
function qk(t0,dur,amp){const el=E.canvas.parentElement||E.canvas,undo=()=>{try{el.style.transform='';}catch(e){}};
  tween(dur,u=>{const a=amp*(u<.08?u/.08:1-.75*u);try{el.style.transform='translate('+((RN()-.5)*a).toFixed(1)+'px,'+((RN()-.5)*a).toFixed(1)+'px)';}catch(e){}},t0);at(t0+dur+.02,undo);setTimeout(undo,(t0+dur+3)*1000);}
const VAL=v=>typeof v==='function'?v():v;
// projectile A -> B: o = {tex,w,h,arc,wob,spin,aim,ra,tr,trs,trl,ease,hit}
function shot(t0,dur,A,B,o){o=o||{};const s={tex:o.tex,pos:[0,0,0],w:0,h:0,rot:0,a:0};at(t0,()=>E.sprites.push(s));
  tween(dur,u=>{const a=VAL(A),b=VAL(B),q=o.ease?u*u:u,P=lerp3(a,b,q),u2=Math.min(1,u+.02),P2=lerp3(a,b,o.ease?u2*u2:u2);P[1]+=(o.arc||0)*Math.sin(PI*u)+(o.wob||0)*Math.sin(u*30);P2[1]+=(o.arc||0)*Math.sin(PI*u2)+(o.wob||0)*Math.sin(u2*30);
    const gi=Math.min(1,u*7);s.pos=P;s.w=(o.w||.4)*gi;s.h=(o.h||o.w||.4)*gi;s.a=gi;if(o.aim){if(u<.99)s.rot=Math.atan2(P2[1]-P[1],P2[0]-P[0])+(o.ra||0);}else s.rot=(o.spin||0)*u;
    if(o.tr&&RN()<.85)E.parts.push({x:P[0],y:P[1],z:P[2]-.01,vx:(RN()-.5)*.5,vy:(RN()-.5)*.5,vz:0,g:0,life:o.trl||.3,max:o.trl||.3,size:o.trs||(o.w||.4)*.9,gs:-.6,al:.8,tex:o.tr,rot:0,vr:0});},t0);
  at(t0+dur,()=>{rmSp(s);if(o.hit)o.hit(VAL(B));});}
// falls from the sky onto (x, y, z): o = {tex,w,h,dx,from,y,aim,ra,spin,tr,trs,hit}
function fallOn(t0,dur,x,z,o){o=o||{};const s={tex:o.tex,pos:[0,0,0],w:0,h:0,rot:0,a:0},dx=o.dx==null?2.2:o.dx,y1=o.y==null?.45:o.y,h0=o.from||6.5;at(t0,()=>E.sprites.push(s));
  tween(dur,u=>{const q=u*u,P=[x+dx*(1-q),h0+(y1-h0)*q,z];s.pos=P;s.w=o.w||.5;s.h=o.h||o.w||.5;s.a=1;s.rot=o.aim?Math.atan2(y1-h0,-dx)+(o.ra||0):(o.spin||0)*u;
    if(o.tr&&RN()<.9)E.parts.push({x:P[0],y:P[1],z:z-.01,vx:0,vy:0,vz:0,g:0,life:o.trl||.3,max:o.trl||.3,size:o.trs||(o.w||.5),gs:-.6,al:.8,tex:o.tr,rot:0,vr:0});},t0);
  at(t0+dur,()=>{rmSp(s);if(o.hit)o.hit([x,y1,z]);});}
// a column standing on the ground at P (grows up, flickers, fades)
function col(t0,dur,P,tex,w,h,o){o=o||{};const s={tex,pos:P.slice(),w:0,h:0,rot:0,a:0};at(t0,()=>E.sprites.push(s));
  tween(dur,u=>{const k=u<.15?ease(u/.15):Math.max(0,1-(u-.6)/.4);s.w=w*(o.wk?k:1)*(1+.08*Math.sin(u*50));s.h=h*Math.min(1,u/.15);s.pos=[P[0],(o.base!=null?o.base:P[1])+s.h,P[2]];s.a=(o.a||1)*k;},t0);at(t0+dur+.02,()=>rmSp(s));}
function ring(t0,P,c,R,dur,flat){const s={tex:tRing(c),pos:P.slice(),w:0,h:0,rot:0,a:0};at(t0,()=>E.sprites.push(s));tween(dur,u=>{const r=.3+R*ease(u);s.w=r;s.h=flat?r*.28:r;s.a=.9*(1-u);},t0);at(t0+dur+.02,()=>rmSp(s));}
// a stream of particles A -> B (breath, frost, flamethrower)
function stream(t0,dur,A,B,o){tween(dur,()=>{const a=VAL(A),b=VAL(B),sp=o.sp||1.7;for(let j=0;j<(o.n||3);j++){const P=lerp3(a,b,RN()*.1);
  E.parts.push({x:P[0],y:P[1]+(RN()-.5)*.2,z:P[2],vx:(b[0]-a[0])*sp,vy:(b[1]-a[1])*sp+(RN()-.5)*(o.spread||1),vz:0,g:o.g||0,life:o.life||.55,max:o.life||.55,size:(o.size||.3)*(.7+RN()*.6),gs:o.gs==null?1:o.gs,al:o.al||1,tex:o.tex,rot:RN()*6,vr:o.vr||0,st:o.st||0});}},t0);}
// whole-stage weather (rain, snow, sand, petals)
function weather(t0,dur,o){tween(dur,()=>{const c=mpos(),h=hpos(),cx=(c[0]+h[0])/2;for(let j=0;j<(o.n||3);j++)E.parts.push({x:cx+(RN()-.5)*(o.W||14),y:o.y0!=null?o.y0+RN()*(o.yr||0):RN()*6,z:h[2]+(RN()-.3)*2,vx:o.vx||0,vy:o.vy||0,vz:0,g:o.g||0,life:o.life||1,max:o.life||1,
  size:(o.size||.1)*(.6+RN()*.8),gs:o.gs||0,al:o.al||.8,tex:o.tex,rot:RN()*6,vr:o.vr||0,st:o.st||0});},t0);}
// one big object moving A -> B (ease-in): o = {spin,grow,lin,keep,tick}
function big(t0,dur,tex,A,B,w,h,o){o=o||{};const s={tex,pos:[0,0,0],w:0,h:0,rot:o.rot||0,a:0};at(t0,()=>E.sprites.push(s));
  tween(dur,u=>{const q=o.lin?u:u*u,P=lerp3(VAL(A),VAL(B),q),g=o.grow?Math.min(1,u*3):1;s.pos=P;s.w=w*g;s.h=h*g;s.a=1;if(o.spin)s.rot=(o.rot||0)+o.spin*u;if(o.tick)o.tick(P,u,s);},t0);at(t0+dur+(o.keep||0),()=>rmSp(s));return s;}
// glowing whirl on the ground (three pulsing rings)
function vort(t0,dur,P,c,R){for(let k=0;k<3;k++){const s={tex:tRing(c),pos:P.slice(),w:0,h:0,rot:0,a:0};at(t0+k*.1,()=>E.sprites.push(s));
  tween(dur-k*.1,u=>{const r=R*(1-.28*k)*(u<.2?u/.2:1)*(1-.12*Math.sin(u*20+k*2));s.pos=[P[0],.06+k*.02,P[2]];s.w=r;s.h=r*.3;s.a=.85*(u>.85?(1-u)/.15:1);},t0+k*.1);at(t0+dur+.02,()=>rmSp(s));}}
// a jagged lightning bolt A -> B, re-forked every few frames
function bolt(t0,dur,A,B,o){o=o||{};const N=o.n||9,segs=[],gls=[];for(let i=0;i<N;i++){segs.push({tex:sparkTex([255,250,210]),pos:[0,0,0],w:0,h:0,rot:0,a:0});gls.push({tex:gtex(o.rgb||[255,235,120]),pos:[0,0,0],w:0,h:0,rot:0,a:0});}
  at(t0,()=>{gls.forEach(s=>E.sprites.push(s));segs.forEach(s=>E.sprites.push(s));});let pts=null,lt=-1;
  tween(dur,u=>{const a=VAL(A),b=VAL(B);if(!pts||E.time-lt>.045){lt=E.time;pts=[];for(let i=0;i<=N;i++){const P=lerp3(a,b,i/N),j=(i===0||i===N)?0:(RN()-.5)*(o.jit||.7);pts.push([P[0]+j*.3,P[1]+j,P[2]]);}}
    const fa=(u<.15?u/.15:Math.max(0,1-(u-.6)/.4))*(RN()<.15?.35:1);for(let i=0;i<N;i++){const p=pts[i],q=pts[i+1],L=Math.hypot(q[0]-p[0],q[1]-p[1]),an=Math.atan2(q[1]-p[1],q[0]-p[0]),C=[(p[0]+q[0])/2,(p[1]+q[1])/2,p[2]+.02];
      segs[i].pos=C;segs[i].w=L*.62;segs[i].h=o.w||.16;segs[i].rot=an;segs[i].a=fa;gls[i].pos=C;gls[i].w=L*.7;gls[i].h=(o.w||.16)*4;gls[i].rot=an;gls[i].a=.45*fa;}},t0);
  at(t0+dur+.02,()=>{segs.forEach(rmSp);gls.forEach(rmSp);});}
// a straight beam A -> B (water cannon, laser, dragon beam)
function beam(t0,dur,A,B,rgb,W,o){o=o||{};const bm={tex:gtex(rgb),pos:[0,0,0],w:0,h:0,rot:0,a:0},bc={tex:gtex([255,255,245]),pos:[0,0,0],w:0,h:0,rot:0,a:0};at(t0,()=>E.sprites.push(bm,bc));
  tween(dur,u=>{const a=VAL(A),b=typeof B==='function'?B(u):B,L=Math.hypot(b[0]-a[0],b[1]-a[1]),an=Math.atan2(b[1]-a[1],b[0]-a[0]),k=u<.1?u/.1:u>.82?(1-u)/.18:1,C=[(a[0]+b[0])/2,(a[1]+b[1])/2,a[2]+.05];
    bm.pos=bc.pos=C;bm.rot=bc.rot=an;bm.w=bc.w=L/2;bm.h=W*k*(1+.14*Math.sin(u*70));bc.h=W*.33*k;bm.a=bc.a=k;if(o.tick)o.tick(b,u);},t0);at(t0+dur+.02,()=>{rmSp(bm);rmSp(bc);});}
// an effect drawn flowing right -> left (fire breath, horizontal lightning) laid along the line A -> B
function vline(k,A,B,o){o=o||{};const a0=VAL(A),b=VAL(B),L0=Math.hypot(b[0]-a0[0],b[1]-a0[1])||1,bk=o.back||0,a=[a0[0]+(a0[0]-b[0])/L0*bk,a0[1]+(a0[1]-b[1])/L0*bk,a0[2]],L=L0+bk,an=Math.atan2(b[1]-a[1],b[0]-a[0]),HL=L/2/(o.fill||.9),sq=o.sq||.6;
  if(o.muzzle){const g=sigSp(gtex(o.muzzle)),c=sigSp(gtex([255,255,240])),D=o.dur||.8,d0=o.delay||0;tween(D,u=>{const k2=Math.min(1,u*8)*(u>.85?(1-u)/.15:1),P=VAL(A);g.pos=[P[0]-.1,P[1],P[2]+.08];g.w=g.h=(.62+.1*Math.sin(u*45))*k2;g.a=.9*k2;c.pos=[P[0]-.1,P[1],P[2]+.09];c.w=c.h=.26*k2;c.a=.85*k2;},d0);at(d0+D+.02,()=>{rmSp(g);rmSp(c);});}
  return vfx(k,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2+.05],HL*sq,Object.assign({},o,{ar:1/sq,rot:an-PI,anchor:a}));}
// effect drawn flowing top -> bottom (laser) laid along A -> B
function vcol(k,A,B,o){o=o||{};const a=VAL(A),b=VAL(B),L=Math.hypot(b[0]-a[0],b[1]-a[1]),an=Math.atan2(b[1]-a[1],b[0]-a[0]),HL=L/2/(o.fill||.9),sq=o.sq||.4;
  return vfx(k,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2+.05],HL,Object.assign({},o,{ar:sq,rot:an+PI/2}));}
// a looping projectile effect flying A -> B; fwd = the direction the art points (fireball, wind blade: left = -PI; meteor: down-left)
function fxShot(k,t0,dur,A,B,size,o){o=o||{};at(t0,()=>{const a=VAL(A),b=VAL(B),an=Math.atan2(b[1]-a[1],b[0]-a[0]);vfx(k,a,size,{loop:1,hold:1,dur,fps:o.fps||20,move:[b[0]-a[0],b[1]-a[1]],rot:an-(o.fwd==null?PI:o.fwd)});});if(o.hit)at(t0+dur,()=>o.hit(VAL(B)));}
// a serpent dragon (art faces left): flies in high from the right, then dives onto the hero
function dragonFx(k,D0,D1,S){const d1=(D1-D0)*.7;at(D0,()=>{const c=mpos(),H=HP(),a=[c[0]+2.5,3.9,H[2]+.1],b=[H[0]+1.7,3.9,H[2]+.1];vfx(k,a,S,{loop:1,hold:1,dur:d1,fps:14,move:[b[0]-a[0],0]});});
  at(D0+d1,()=>{const H=HP(),a=[H[0]+1.7,3.9,H[2]+.1],an=Math.atan2(H[1]-a[1],H[0]-a[0]);vfx(k,a,S,{loop:1,hold:1,dur:D1-D0-d1,fps:14,move:[H[0]-a[0],H[1]-a[1]],rot:an-PI,mease:1});});}
function MX(type,tier){const rgb=(HURT[type]||{}).c||[255,120,60];return{type,tier,rgb,col:'rgb('+rgb.join(',')+')',g:gtex(rgb),sk:sparkTex(rgb)};}
// ---- wind-ups: elite = quick glow, boss = rune + rise + roar ring, legend = cinematic ----
function introE(X){const rgb=X.rgb;at(0,()=>{try{SFX.uCharge('e',X.type)}catch(e){}});monWind('rear',.55);const mp=mpos();fxGround([mp[0],0,mp[2]+.3],rgb,2,.7);
  tween(.6,u=>{E.tint.mon=[rgb[0]/255,rgb[1]/255,rgb[2]/255,.3+.35*Math.abs(Math.sin(u*16))];if(RN()<.9){const c=mpos(),a=RN()*PI*2,r=1.5;E.parts.push({x:c[0]+Math.cos(a)*r,y:c[1]+Math.sin(a)*r*.7,z:c[2]+.5,vx:-Math.cos(a)*r*2.2,vy:-Math.sin(a)*r*1.5,vz:0,g:0,life:.45,max:.45,size:.17,tex:X.sk,rot:0,vr:0,st:1});}});return .6;}
function introB(X){const m=E.mon,rgb=X.rgb,mp=mpos();at(0,()=>{try{SFX.uCharge('b',X.type)}catch(e){}});groundCharge(mp[0],mp[2]+.4,X.col,rgb,2.6,0,1.5);
  tween(1.2,u=>{const e=Math.sin(PI*Math.min(1,u*1.2));m.off.y=.05*e;m.off.sq=1-.1*Math.sin(PI*Math.min(1,u*2.4))*(u<.42?1:0)+.08*e*(u>=.42?1:0);m.off.sc=1+.07*e;E.tint.mon=[rgb[0]/255,rgb[1]/255,rgb[2]/255,.5*e];
    if(RN()<.9){const c=mpos(),a=RN()*PI*2,r=2.4;E.parts.push({x:c[0]+Math.cos(a)*r,y:c[1]+Math.sin(a)*r*.7,z:c[2]+.5,vx:-Math.cos(a)*r*1.6,vy:-Math.sin(a)*r*1.1,vz:0,g:0,life:.6,max:.6,size:.2,tex:X.sk,rot:0,vr:0,st:1});}});
  at(1.2,()=>{m.off.y=0;m.off.sc=1;const c=mpos();ring(0,[c[0],c[1]+.4,c[2]+.6],'#FFFFFF',4.8,.6);E.shake=Math.max(E.shake,.7);try{SFX.uRoar('b',X.type)}catch(e){}});return 1.3;}
// dark edges over the whole stage (a page overlay, so the vignette stays put while the stage shakes)
function tDebris(rgb){const L=sceneLight(),g0=(L&&L.gr)||[140,130,120],c=rgb||g0.map((v,i)=>Math.round(v*.45+[128,112,92][i]*.55)),d=c.map(v=>Math.round(v*.62)),hi=c.map(v=>Math.min(255,Math.round(v*1.25+20)));
  return sigTex('sg_deb'+c.join('-'),64,64,x=>{x.fillStyle='rgb('+c.join(',')+')';x.strokeStyle='rgb('+d.join(',')+')';x.lineWidth=3;x.beginPath();[[32,6],[54,16],[58,38],[44,56],[20,58],[6,40],[12,16]].forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();x.stroke();
    x.fillStyle='rgba('+hi.join(',')+',.55)';x.beginPath();x.moveTo(20,16);x.lineTo(34,12);x.lineTo(30,24);x.closePath();x.fill();});}
function vignette(t0,t1,col){const host=E.canvas.parentElement;if(!host)return;let ov=null;const kill=()=>{try{if(ov){ov.remove();ov=null;}}catch(e){}};
  at(t0,()=>{try{if(getComputedStyle(host).position==='static')host.style.position='relative';ov=document.createElement('div');ov.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2;opacity:0;transition:opacity .45s;background:radial-gradient(ellipse at 62% 58%,rgba(0,0,0,0) 30%,'+(col||'rgba(0,0,0,.82)')+' 100%)';host.appendChild(ov);requestAnimationFrame(()=>{if(ov)ov.style.opacity='1';});}catch(e){}});
  at(t1,()=>{try{if(ov)ov.style.opacity='0';}catch(e){}});at(t1+.5,kill);setTimeout(kill,(t1+3)*1000);}
// legend wind-up: the edges go dark, light rays burst out from behind the legend, rocks float up from the ground,
// an energy pillar shoots from the legend into the sky, then the roar
function introL(X){const m=E.mon,rgb=X.rgb,T=2.1,wh=gtex([255,255,255]),rays=[];at(0,()=>{try{SFX.uCharge('L',X.type)}catch(e){}});qk(0,T,4);
  for(let k=0;k<10;k++){const s=sigSp(k%2?X.g:wh);rays.push(s);}
  tween(T+.5,u=>{const t=u*(T+.5),c=mpos(),k=ease(cl((t-.15)/.7))*(t>T?Math.max(0,1-(t-T)/.5):1);rays.forEach((s,i)=>{const a=i/10*PI*2+t*.35,L=(2.6+.8*Math.sin(t*3+i*1.7))*k,r0=1.9;
      s.pos=[c[0]+Math.cos(a)*(r0+L/2),c[1]+.4+Math.sin(a)*(r0+L/2)*.8,c[2]-.3];s.w=L/2;s.h=.12+.06*(i%3);s.rot=Math.atan2(Math.sin(a)*.8,Math.cos(a));s.a=(i%2?.55:.4)*k;});},0);
  at(T+.52,()=>rays.forEach(rmSp));
  const rock=tDebris();tween(T,u=>{const c=mpos(),h=hpos();if(RN()<.35)E.parts.push({x:h[0]-2.5+RN()*(c[0]-h[0]+4),y:.05,z:h[2]+.4+(RN()-.5)*1.4,vx:(RN()-.5)*.2,vy:.6+RN()*.9,vz:0,g:-.15,life:1.6,max:1.6,size:.06+RN()*.1,al:.9,tex:rock,rot:RN()*6,vr:(RN()-.5)*3});
    const e=Math.sin(PI*Math.min(1,u*1.1));m.off.y=.1*e;m.off.sq=1+.06*e;m.off.sc=1+.1*e;E.tint.mon=[rgb[0]/255,rgb[1]/255,rgb[2]/255,.5*e];
    for(let j=0;j<3;j++){const a=RN()*PI*2,r=4+RN()*2;E.parts.push({x:c[0]+Math.cos(a)*r,y:c[1]+Math.sin(a)*r*.7,z:c[2]+.5,vx:-Math.cos(a)*r*1.6,vy:-Math.sin(a)*r*1.1,vz:0,g:0,life:.62,max:.62,size:.2,tex:RN()<.5?X.sk:wh,rot:0,vr:0,st:1});}});
  const mp=mpos();if(VFX.energy_pillar&&['fire','elec','desert','dragon'].includes(X.type))vfx('energy_pillar',[mp[0],mp[1]-.6,mp[2]-.2],3.6,{bottom:1,fps:16,delay:T-.6,ar:.8});else{col(T-.55,1.0,[mp[0],0,mp[2]-.2],X.g,1.1,7,{base:mp[1]-.4,wk:1,a:.75});col(T-.55,1.0,[mp[0],0,mp[2]-.19],wh,.35,7,{base:mp[1]-.4,wk:1,a:.9});}
  at(T,()=>{m.off.y=0;m.off.sc=1;const c=mpos();hitstop(.15);flashScreen(0,.5);ring(0,[c[0],c[1]+.4,c[2]+.6],'#FFFFFF',7,.8);ring(.1,[c[0],c[1]+.4,c[2]+.6],X.col,9,.8);E.shake=Math.max(E.shake,1.2);qk(0,.5,14);try{SFX.uRoar('L',X.type)}catch(e){}});
  return T+.15;}
// ---- the moves: MU[type][tier] = [move 1, move 2]; each takes (X, start time) and returns the time of the final hit ----
const MUN={fire:{e:['火球三連','火焰噴射'],b:['隕石雨','火柱陣'],L:['太陽墜落','火山爆發']},ice:{e:['冰錐連射','冰霜吐息'],b:['冰晶墜落','冰刺地獄'],L:['冰河撞擊','暴風雪']},
  elec:{e:['雷光直擊','電磁脈衝'],b:['雷暴','連鎖閃電'],L:['雷神之鎚','萬雷天降']},forest:{e:['藤鞭','種子機槍'],b:['荊棘爆發','巨木根'],L:['世界樹之怒','花之風暴']},
  poison:{e:['毒液彈','毒針'],b:['毒雲','毒沼噴泉'],L:['劇毒之雨','毒爆']},sea:{e:['水砲','泡泡彈'],b:['連環巨浪','漩渦水柱'],L:['大海嘯','怒濤水柱']},
  desert:{e:['沙刃','巨石投擲'],b:['沙塵龍捲','流沙陷阱'],L:['沙漠風暴','金字塔墜落']},sky:{e:['風刃','俯衝'],b:['龍捲風','羽毛風暴'],L:['天空裂斬','暴風神翼']},
  mech:{e:['機槍掃射','追蹤飛彈'],b:['軌道雷射','地雷陣'],L:['衛星砲','飛彈風暴']},ghost:{e:['幽冥之手','暗影彈'],b:['幽魂大軍','詛咒鎖鏈'],L:['冥界之門','永夜']},
  skel:{e:['骨矛','迴旋骨'],b:['骨刺陣','骷髏雨'],L:['白骨巨手','亡者之潮']},dragon:{e:['龍爪','龍炎彈'],b:['龍息','龍焰掃地'],L:['龍神降臨','天崩龍息']}};
const MU={
fire:{e:[
  (X,T)=>{for(let i=0;i<3;i++){SE(T+i*.22,X);if(VFX.fireball)fxShot('fireball',T+i*.22,.4,MP,HP,.55,{hit:P=>HIT(P,X,'fire_burst',.9)});else shot(T+i*.22,.4,MP,HP,{tex:fl(),w:.55,arc:.9-i*.3,tr:gtex([255,140,40]),trs:.5,hit:P=>HIT(P,X,'fire_burst',.9)});}return T+.44+.4;},
  (X,T)=>{SE(T,X);SE(T+.5,X);if(VFX.fire_breath)vline('fire_breath',MP,HP,{back:.35,muzzle:[255,170,70],loop:1,dur:1.0,fps:24,sq:.5,delay:T});else stream(T,1.0,MP,HP,{tex:fl(),n:4,size:.45,spread:.8,life:.5,gs:1.3});for(let j=0;j<3;j++)at(T+.35+j*.05,()=>{const H=HP();vfx('flame_loop',[H[0]+(j-1)*.35,.6,H[2]+.05],.7,{loop:1,dur:.8,rise:.3});});return T+.6;}],
 b:[
  (X,T)=>{const n=7;for(let j=0;j<n;j++){const t0=T+j*.16,last=j===n-1,xx=HP()[0]+(last?0:(RN()-.5)*2.6),z=HP()[2];SE(t0+.3,X);if(VFX.meteor)fxShot('meteor',t0,.36,[xx+2.6,6.5,z],[xx,.45,z],last?1.0:.6,{fwd:-3*PI/4,hit:P=>{HIT(P,X,'fire_burst',last?1.6:.9);E.shake=Math.max(E.shake,.4);}});else fallOn(t0,.36,xx,z,{tex:fl(),w:last?.9:.5,dx:2.6,tr:gtex([255,150,50]),trs:.6,hit:P=>{HIT(P,X,'fire_burst',last?1.6:.9);E.shake=Math.max(E.shake,.4);}});}return T+(n-1)*.16+.36;},
  (X,T)=>{const c=HG();for(let j=0;j<6;j++){const a=j/6*PI*2,xx=c[0]+Math.cos(a)*1.3,zz=c[2]+Math.sin(a)*.5,t0=T+j*.12;at(t0,()=>fxGround([xx,0,zz],[255,120,40],.9,.4));SE(t0+.25,X);vfx(vfxOr('fire_pillar','fire_burst'),[xx,0,zz],1.0,{bottom:1,sink:.1,delay:t0+.25,fps:24,sway:.4});}
    const tf=T+6*.12+.35;at(tf-.3,()=>fxGround([c[0],0,c[2]],[255,200,80],1.6,.5));vfx(vfxOr('fire_pillar','fire_burst'),[c[0],0,c[2]+.05],1.9,{bottom:1,sink:.1,delay:tf-.1,fps:24,sway:.5,tick:(P,u,h)=>{if(u<.6)fxEmbers(P,h,3);}});return tf;}],
 L:[
  (X,T)=>{X.filt='brightness(.55) sepia(.5) saturate(1.8) hue-rotate(-15deg)';const sun=()=>{const c=mpos(),h=hpos();return[(c[0]+h[0])/2,4.8,c[2]-.3];},DS=T+1.5,FT=DS+1.0,core=sigSp(gtex([255,250,220])),halo=sigSp(gtex([255,150,40]));
    tween(FT-T,u=>{const t=T+u*(FT-T),S=sun(),H=HP(),q=t<DS?0:ease((t-DS)/(FT-DS)),P=[S[0]+(H[0]-S[0])*q,S[1]+(H[1]-S[1])*q,S[2]+(H[2]-S[2])*q],g=Math.min(1,(t-T)/1.0);
      core.pos=P;core.w=core.h=1.3*g*(1+.05*Math.sin(t*30));core.a=VFX.sun_orb?0:1;halo.pos=[P[0],P[1],P[2]-.01];halo.w=halo.h=3.6*g*(1+.08*Math.sin(t*12));halo.a=.85;
      for(let j=0;j<2;j++){const a=RN()*PI*2,r=1.4*g;E.parts.push({x:P[0]+Math.cos(a)*r,y:P[1]+Math.sin(a)*r,z:P[2]+.01,vx:Math.cos(a)*1.5,vy:Math.sin(a)*1.5,vz:0,g:0,life:.45,max:.45,size:.6*g,gs:.6,tex:fl(),rot:0,vr:0});}
      if(t<DS){const a=RN()*PI*2,r=3.5;E.parts.push({x:P[0]+Math.cos(a)*r,y:P[1]+Math.sin(a)*r*.8,z:P[2],vx:-Math.cos(a)*r*1.8,vy:-Math.sin(a)*r*1.4,vz:0,g:0,life:.5,max:.5,size:.15,tex:sparkTex([255,170,60]),rot:0,vr:0,st:1});}},T);
    SE(DS,X);qk(DS,FT-DS,10);if(VFX.sun_orb){at(T,()=>vfx('sun_orb',sun(),1.6,{loop:1,hold:1,dur:DS-T,fps:14,grow:.6}));at(DS,()=>{const S=sun(),H=HP();vfx('sun_orb',S,2.56,{loop:1,hold:1,dur:FT-DS,fps:14,move:[H[0]-S[0],H[1]-S[1]],mease:1});});}
    at(FT+.02,()=>{rmSp(core);rmSp(halo);const H=HP();vfx(vfxOr('explosion_big','fire_burst'),H,3.0);vfx(vfxOr('explosion_big','fire_burst'),[H[0]-1.2,H[1]-.3,H[2]],2.2,{delay:.12});vfx(vfxOr('explosion_big','fire_burst'),[H[0]+1.2,H[1]-.2,H[2]],2.2,{delay:.22});
      for(let j=0;j<10;j++)vfx('fire_burst',[H[0]-5+j*1.1,.6,H[2]-.2],1.0,{delay:.1+Math.abs(j-4.5)*.05});ring(0,[H[0],.08,H[2]],'#FFB040',10,1.0,true);});return FT;},
  (X,T)=>{X.filt='brightness(.5) saturate(1.6) sepia(.3)';const c=mpos(),h=hpos(),z=h[2]+.7,x0=h[0]-3.5,x1=c[0]+1.5;qk(T,2.4,9);
    if(VFX.lava_crack){for(let j=0;j<5;j++){const xx=x0+(x1-x0)*j/4;vfx('lava_crack',[xx,0,z+(j%2)*.3-.15],1.2,{bottom:1,sink:.28,fps:8,delay:T+j*.08});}}else for(let j=0;j<7;j++){const xx=x0+(x1-x0)*j/6,s=sigSp(gtex([255,120,30]));tween(2.6,u=>{s.pos=[xx,.05,z+(j%2)*.3-.15];s.w=1.1*Math.min(1,u*5);s.h=.12;s.rot=(j%3-1)*.2;s.a=.9*(u>.85?(1-u)/.15:1)*(.7+.3*Math.sin(u*40+j));},T+j*.06);at(T+j*.06+2.62,()=>rmSp(s));}
    const N=10;for(let j=0;j<N;j++){const xx=x1-(x1-x0)*j/(N-1),t0=T+.3+j*.13;SE(t0,X);vfx(vfxOr('fire_pillar','fire_burst'),[xx,0,z+(j%2)*.25],1.3+.3*(j%2),{bottom:1,sink:.1,delay:t0,fps:24,sway:.5,tick:(P,u,hh)=>{if(u<.5&&RN()<.5)fxEmbers(P,hh,2);}});
      at(t0,()=>{for(let k=0;k<3;k++)E.parts.push({x:xx,y:.6,z:z,vx:(RN()-.5)*4,vy:4+RN()*3,vz:0,g:9,life:1.1,max:1.1,size:.18+RN()*.12,tex:tRock(),rot:RN()*6,vr:6});});}
    const FT=T+.3+N*.13+.25,H=HG();at(FT-.25,()=>fxGround([H[0],0,H[2]],[255,200,80],2,.5));vfx(vfxOr('fire_pillar','fire_burst'),[H[0],0,H[2]+.05],2.6,{bottom:1,sink:.1,delay:FT-.1,fps:24,sway:.4,tick:(P,u,hh)=>{if(u<.6)fxEmbers(P,hh,4);}});
    at(FT,()=>vfx(vfxOr('explosion_big','fire_burst'),HP(),2.6));return FT;}]},
ice:{e:[
  (X,T)=>{for(let i=0;i<5;i++){const t0=T+i*.12;SE(t0,X);shot(t0,.3,()=>{const a=MP();return[a[0],a[1]+(i%2?.25:-.15),a[2]];},HP,{tex:tShard(),w:.22,h:.5,aim:1,ra:-PI/2,tr:gtex([200,240,255]),trs:.25,hit:P=>HIT(P,X,'ice_burst',.7)});}return T+4*.12+.3;},
  (X,T)=>{SE(T,X);if(VFX.frost_breath)vline('frost_breath',MP,HP,{back:.35,muzzle:[200,235,255],loop:1,dur:1.0,fps:22,sq:.5,delay:T});else{stream(T,1.0,MP,HP,{tex:gtex([215,240,255]),n:4,size:.5,spread:.6,life:.5,gs:1.4,al:.5});stream(T,1.0,MP,HP,{tex:starTex(),n:2,size:.12,spread:.8,life:.5,gs:0,vr:3});}
    for(let k=0;k<7;k++){const a=k/7*PI*2,s={tex:tShard(),pos:[0,0,0],w:0,h:0,rot:0,a:0};at(T+.5+k*.04,()=>E.sprites.push(s));tween(.65,u=>{const H=HP(),g=ease(Math.min(1,u*3));s.pos=[H[0]+Math.cos(a)*.7,H[1]+Math.sin(a)*.9,H[2]+.05];s.w=.2*g;s.h=.5*g;s.rot=a+PI/2;s.a=u<.8?1:(1-u)/.2;},T+.5+k*.04);at(T+1.2,()=>rmSp(s));}
    at(T+.6,()=>{E.flash.hero=[.6,.85,1,.8];});at(T+1.15,()=>{for(let j=0;j<16;j++){const H=HP(),a=RN()*PI*2;E.parts.push({x:H[0],y:H[1],z:H[2]+.1,vx:Math.cos(a)*4,vy:Math.sin(a)*4+1,vz:0,g:7,life:.7,max:.7,size:.18,tex:tShard(),rot:RN()*6,vr:10});}});return T+1.15;}],
 b:[
  (X,T)=>{const n=7;for(let j=0;j<n;j++){const t0=T+j*.15,last=j===n-1,xx=HP()[0]+(last?0:(RN()-.5)*2.6),z=HP()[2];SE(t0+.3,X);fallOn(t0,.36,xx,z,{tex:tShard(),w:last?.5:.3,h:last?1.2:.75,dx:.6,aim:1,ra:-PI/2,tr:gtex([200,240,255]),trs:.4,hit:P=>HIT(P,X,'ice_burst',last?1.5:.8)});}return T+(n-1)*.15+.36;},
  (X,T)=>{const a=MP(),H=HG();for(let r=0;r<3;r++){const zz=H[2]+(r-1)*.35;for(let j=0;j<8;j++){const q=(j+1)/8,xx=a[0]+(H[0]-a[0])*q,t0=T+r*.1+j*.07,s={tex:tShard(),pos:[0,0,0],w:0,h:0,rot:0,a:1};
      at(t0,()=>{E.sprites.push(s);goldBurst([xx,.2,zz],4,2,.35,.2,gtex([200,240,255]));});if(j%3===0&&r===1)SE(t0,X);
      tween(.75,u=>{const g=u<.2?ease(u/.2):1;s.w=.28;s.h=(.5+.7*q)*g;s.pos=[xx,s.h*.9,zz];s.a=u<.7?1:(1-u)/.3;},t0);at(t0+.77,()=>rmSp(s));}}
    const FT=T+.2+8*.07+.05;at(FT,()=>{const P=HG();for(let k=0;k<6;k++){const s={tex:tShard(),pos:[0,0,0],w:0,h:0,rot:0,a:1},ang=(k-2.5)*.25;E.sprites.push(s);tween(.6,u=>{const g=ease(Math.min(1,u*4));s.w=.35;s.h=1.4*g;s.rot=ang;s.pos=[P[0]-Math.sin(ang)*s.h,Math.cos(ang)*s.h,P[2]+.05];s.a=u<.7?1:(1-u)/.3;});at(.62,()=>rmSp(s));}vfx('ice_burst',HP(),1.5);});return FT;}],
 L:[
  (X,T)=>{X.filt='saturate(.5) brightness(1.12) hue-rotate(12deg) contrast(1.05)';weather(T-1,3.2,{tex:starTex(),n:3,vx:-1,vy:-1.4,size:.12,life:2,al:.9,vr:2,y0:5.5,yr:1});const FT=T+1.4;
    big(T,1.4,tIce(),()=>{const h=HP();return[h[0]+3,7.5,h[2]+.2];},()=>{const h=HP();return[h[0],h[1]+.8,h[2]+.2];},2.2,2.2,{spin:-.4,tick:P=>{if(RN()<.8)E.parts.push({x:P[0]+(RN()-.5)*2,y:P[1]+1,z:P[2],vx:0,vy:2,vz:0,g:0,life:.4,max:.4,size:.25,gs:-.5,al:.6,tex:gtex([220,245,255]),rot:0,vr:0});}});
    SE(T+.3,X);qk(T,1.4,4);at(FT,()=>{const H=HP();for(let j=0;j<60;j++){const a=RN()*PI*2,sp=3+RN()*6;E.parts.push({x:H[0],y:H[1]+.6,z:H[2]+.1,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp+2,vz:0,g:8,life:1.2,max:1.2,size:.15+RN()*.25,tex:RN()<.6?tShard():starTex(),rot:RN()*6,vr:(RN()-.5)*14});}
      vfx('ice_burst',H,3);vfx('ice_burst',[H[0]-1.2,H[1]-.3,H[2]],2,{delay:.1});vfx('ice_burst',[H[0]+1.2,H[1]-.3,H[2]],2,{delay:.18});ring(0,[H[0],.08,H[2]],'#CFF2FF',9,1.0,true);});return FT;},
  (X,T)=>{X.filt='brightness(1.18) contrast(.85) saturate(.6)';weather(T,2.6,{tex:sparkTex([235,248,255]),n:8,vx:-9,vy:-1.5,size:.18,life:1.2,al:.85,st:1,W:16});weather(T,2.6,{tex:gtex([240,250,255]),n:2,vx:-4,vy:0,size:.9,gs:.5,life:1.4,al:.25,W:16});qk(T,2.6,5);SE(T,X);SE(T+1,X);
    if(VFX.tornado)for(let k=0;k<2;k++){const c=mpos();vfx('tornado',[c[0]+2,0,c[2]+(k?.3:-.2)],1.4,{bottom:1,sink:.08,loop:1,dur:1.6,delay:T+.2+k*.4,move:[-(c[0]-hpos()[0])-4,0],sway:.6,tick:(P,u,h)=>fxDust(P,h,1,[230,245,255])});}
    const FT=T+2.2,blk=sigSp(tIce());tween(1.0,u=>{const H=HP(),g=ease(Math.min(1,u*2.5));blk.pos=[H[0],H[1]+.1,H[2]+.15];blk.w=1.1*g;blk.h=1.4*g;blk.a=.85;},FT-1.0);
    at(FT-.9,()=>{E.flash.hero=[.7,.9,1,.9];});at(FT,()=>{rmSp(blk);const H=HP();for(let j=0;j<40;j++){const a=RN()*PI*2,sp=2+RN()*5;E.parts.push({x:H[0],y:H[1],z:H[2]+.2,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp+2,vz:0,g:8,life:1,max:1,size:.2+RN()*.2,tex:tShard(),rot:RN()*6,vr:(RN()-.5)*12});}vfx('ice_burst',H,2.6);});return FT;}]},
elec:{e:[
  (X,T)=>{if(VFX.lightning_h){SE(T,X);vline('lightning_h',MP,HP,{fps:30,sq:.42,delay:T});at(T+.12,()=>HIT(HP(),X,'hit_spark',.8));SE(T+.5,X);vline('lightning_h',MP,HP,{fps:30,sq:.55,delay:T+.5});at(T+.62,()=>{E.bgFlash=.6;});return T+.62;}
    SE(T,X);bolt(T,.35,MP,HP,{w:.2});at(T+.05,()=>HIT(HP(),X,'hit_spark',.8));SE(T+.45,X);bolt(T+.45,.4,MP,HP,{w:.28});at(T+.5,()=>{E.bgFlash=.6;});return T+.5;},
  (X,T)=>{const c=mpos(),orb=sigSp(gtex([255,240,140])),lt=sigSp(null);tween(.6,u=>{const P=[c[0],c[1]+1.6,c[2]+.6];orb.pos=P;orb.w=orb.h=(.3+.8*u)*(1+.2*Math.sin(u*60));orb.a=1;lt.tex=E.tex['vx_lightning'+(4+(Math.floor(u*30)&1))]||null;lt.pos=P;lt.w=.6;lt.h=.8;lt.rot=u*20;lt.a=.9;},T);at(T+.62,()=>{rmSp(orb);rmSp(lt);});
    const s={tex:tRing('#FFF08A'),pos:[0,0,0],w:0,h:0,rot:0,a:0},dist=()=>Math.abs(mpos()[0]-hpos()[0]);at(T+.6,()=>{E.sprites.push(s);try{SFX.uEl(X.type)}catch(e){}});
    tween(.5,u=>{const c2=mpos(),r=.3+dist()*u;s.pos=[c2[0],.08,c2[2]+.4];s.w=r;s.h=r*.3;s.a=.95;for(let j=0;j<3;j++){const a=RN()*PI*2;E.parts.push({x:c2[0]+Math.cos(a)*r,y:.1+RN()*.3,z:c2[2]+.4+Math.sin(a)*r*.3,vx:(RN()-.5)*3,vy:2+RN()*2,vz:0,g:6,life:.2,max:.2,size:.14,tex:sparkTex([255,240,150]),rot:0,vr:0,st:1});}},T+.6);at(T+1.12,()=>rmSp(s));return T+1.1;}],
 b:[
  (X,T)=>{const H=HG(),cls=[];if(VFX.storm_cloud){vfx('storm_cloud',[H[0]-.9,4.5,H[2]-.4],1.3,{loop:1,dur:1.75,delay:T-.25,fps:14});vfx('storm_cloud',[H[0]+.9,4.7,H[2]-.5],1.2,{loop:1,dur:1.65,delay:T-.15,fps:14});}else for(let j=0;j<6;j++){const s=sigSp(gtex([60,60,95]));cls.push(s);tween(1.6,u=>{const g=Math.min(1,u*4)*(u>.85?(1-u)/.15:1);s.pos=[H[0]+(j-2.5)*.7,4.8+(j%2)*.25,H[2]-.3];s.w=1.1*g;s.h=.65*g;s.a=.9*g;},T-.2);}at(T+1.45,()=>cls.forEach(rmSp));
    const n=6;for(let j=0;j<n;j++){const t0=T+.2+j*.17,last=j===n-1,xx=H[0]+(last?0:(RN()-.5)*2.8);at(t0,()=>{vfx('lightning',[xx,0,H[2]],last?2.6:1.9,{bottom:1,fps:30});E.bgFlash=1;E.shake=Math.max(E.shake,.4);goldBurst([xx,.15,H[2]],10,4,.35,.22,gtex([255,240,150]));});SE(t0,X);}return T+.2+(n-1)*.17;},
  (X,T)=>{const a=MP(),H=HP(),orbs=[];for(let i=0;i<4;i++){const P=[a[0]+(H[0]-a[0])*(i+1)/5,1.4+(i%2?1.2:.2),H[2]+.1],s=sigSp(gtex([255,240,150]));orbs.push(P);tween(1.4,u=>{const g=Math.min(1,u*5);s.pos=[P[0],P[1]+.1*Math.sin(u*20+i),P[2]];s.w=s.h=.45*g*(1+.2*Math.sin(u*50));s.a=g*(u>.9?(1-u)*10:1);},T);at(T+1.42,()=>rmSp(s));}
    const pts=[a,...orbs,H];for(let i=0;i<5;i++){const t0=T+.35+i*.18;SE(t0,X);if(VFX.lightning_h)vline('lightning_h',pts[i],pts[i+1],{fps:34,sq:.5,delay:t0});else bolt(t0,.3,pts[i],pts[i+1],{w:.22});at(t0+.05,()=>{goldBurst(pts[i+1],10,4,.35,.22,gtex([255,240,150]));E.bgFlash=.5;});}return T+.35+4*.18+.05;}],
 L:[
  (X,T)=>{X.filt='brightness(.32) contrast(1.3) saturate(1.2)';const H=HG(),cls=[];if(VFX.storm_cloud){const c=mpos(),gx=(c[0]+hpos()[0])/2;for(let j=0;j<4;j++)vfx('storm_cloud',[gx+(j-1.5)*2.4,4.7+(j%2)*.3,H[2]-.7],1.5,{loop:1,dur:2.7,delay:T-.5,fps:14});}else for(let j=0;j<12;j++){const s=sigSp(gtex([40,40,70]));cls.push(s);tween(2.6,u=>{const g=Math.min(1,u*3)*(u>.9?(1-u)*10:1),c=mpos(),gx=(c[0]+hpos()[0])/2;s.pos=[gx+(j-5.5)*1.0,5.0+(j%3)*.25,H[2]-.6];s.w=1.4*g;s.h=.8*g;s.a=.95*g;},T-.5);}at(T+2.2,()=>cls.forEach(rmSp));
    tween(1.4,()=>{if(RN()<.12){E.bgFlash=.7;const c=mpos();vfx('lightning',[c[0]+(RN()-.5)*8,3.2,H[2]-.5],.8,{fps:34});}},T);SE(T+.4,X);
    const FT=T+1.6;for(let k=-2;k<=2;k++)at(FT-.05+Math.abs(k)*.03,()=>vfx('lightning',[H[0]+k*.35,0,H[2]],3.0,{bottom:1,fps:28}));if(VFX.energy_pillar)vfx('energy_pillar',[H[0],0,H[2]+.1],3.4,{bottom:1,fps:20,delay:FT-.25,ar:.7});else col(FT-.08,.9,[H[0],0,H[2]+.1],gtex([255,255,230]),1.2,6.5,{base:0,wk:1});
    at(FT,()=>{E.bgFlash=1;for(let j=0;j<40;j++){const a=(RN()<.5?0:PI)+(RN()-.5)*.3,sp=4+RN()*8;E.parts.push({x:H[0],y:.1,z:H[2]+(RN()-.5)*.8,vx:Math.cos(a)*sp,vy:RN()*.5,vz:0,g:0,life:.5,max:.5,size:.2,tex:sparkTex([255,240,150]),rot:0,vr:0,st:1});}ring(0,[H[0],.08,H[2]],'#FFF08A',9,.8,true);});return FT;},
  (X,T)=>{X.filt='brightness(.4) contrast(1.25)';const c=mpos(),h=hpos(),z=h[2]+.7,x0=c[0]+1.5,x1=h[0]-3.5,N=22;qk(T,2.4,8);
    for(let j=0;j<N;j++){const t0=T+j*.07,xx=x0+(x1-x0)*j/(N-1)+(RN()-.5)*.6,zz=z+(RN()-.5)*.6,sz=1.6+RN()*.8;at(t0,()=>{vfx('lightning',[xx,0,zz],sz,{bottom:1,fps:32});E.bgFlash=.8;goldBurst([xx,.15,z],6,3,.3,.2,gtex([255,240,150]));});if(j%3===0)SE(t0,X);}
    const FT=T+N*.07+.4,H=HG();for(let k=0;k<3;k++)at(FT-.02,()=>vfx('lightning',[H[0]+(k-1)*.5,0,H[2]],2.9,{bottom:1,fps:28}));at(FT,()=>{E.bgFlash=1;vfx(vfxOr('explosion_big','hit_spark'),HP(),2.2);});return FT;}]},
forest:{e:[
  (X,T)=>{if(VFX.vine_whip){for(let i=0;i<2;i++){const t0=T+i*.55;SE(t0,X);at(t0,()=>{const a=MP(),b=HP(),S=Math.abs(a[0]-b[0])/2/.82;vfx('vine_whip',[(a[0]+b[0])/2+S*.12,0,b[2]+.1],S,{bottom:1,fps:20});});at(t0+.42,()=>HIT(HP(),X,'leaf_swirl',.8));}return T+.55+.42;}
    const vine=emojiTex('🌿');for(let i=0;i<2;i++){const t0=T+i*.4,s={tex:vine,pos:[0,0,0],w:0,h:0,rot:0,a:0};at(t0,()=>E.sprites.push(s));SE(t0,X);
    tween(.35,u=>{const a=MP(),H=HP(),L=Math.hypot(H[0]-a[0],H[1]-a[1])+.3,ang0=PI*.6,ang1=PI+(i?.12:-.12),ang=ang0+(ang1-ang0)*ease(u);s.pos=[a[0]+Math.cos(ang)*L*.5,a[1]+Math.sin(ang)*L*.5,a[2]+.1];s.w=L*.5;s.h=.4;s.rot=ang;s.a=1;},t0);
    at(t0+.36,()=>{rmSp(s);HIT(HP(),X,'leaf_swirl',.8);});}return T+.76;},
  (X,T)=>{for(let i=0;i<10;i++){const t0=T+i*.07;if(i%3===0)SE(t0,X);shot(t0,.28,MP,()=>{const h=HP();return[h[0],h[1]+(i%3-1)*.25,h[2]];},{tex:gtex([170,220,90]),w:.16,tr:gtex([120,200,80]),trs:.14,hit:P=>{goldBurst(P,4,3,.3,.2,gtex([150,230,110]));E.parts.push({x:P[0],y:P[1],z:P[2],vx:(RN()-.5)*2,vy:1+RN(),vz:0,g:3,life:.8,max:.8,size:.14,tex:emojiTex('🍃'),rot:RN()*6,vr:4});}});}
    const FT=T+10*.07+.3;at(FT,()=>vfx('leaf_swirl',HP(),1.3));return FT;}],
 b:[
  (X,T)=>{const H=HG();groundCharge(H[0],H[2],'#7CFF8A',[120,235,140],1.6,T-.2,1.4);if(VFX.thorn_burst){SE(T,X);[[-1.1,.9,.0],[1.1,.9,.08],[0,1.45,.16]].forEach(([dx,sz,d])=>vfx('thorn_burst',[H[0]+dx,0,H[2]+(dx?-.15:.1)],sz,{bottom:1,fps:20,delay:T+d}));at(T+.5,()=>vfx('leaf_swirl',HP(),1.4));return T+.45;}
    for(let j=0;j<7;j++){const s={tex:emojiTex('🌿'),pos:[0,0,0],w:0,h:0,rot:0,a:1},xx=H[0]+(j-3)*.35,t0=T+j*.08;at(t0,()=>E.sprites.push(s));if(j%2===0)SE(t0,X);
      tween(.9,u=>{const g=u<.3?ease(u/.3):1;s.w=s.h=.9*g;s.pos=[xx,.2+.9*g,H[2]+(j%2)*.2];s.rot=(j-3)*.3+.2*Math.sin(u*12);s.a=u<.75?1:(1-u)/.25;},t0);at(t0+.92,()=>rmSp(s));}
    const FT=T+7*.08+.2;at(FT,()=>vfx('leaf_swirl',HP(),1.6));return FT;},
  (X,T)=>{const a=MP(),H=HG(),N=6;if(VFX.root_burst){for(let j=0;j<3;j++){const q=(j+1)/3,t0=T+j*.25;SE(t0,X);vfx('root_burst',[a[0]+(H[0]-a[0])*q,0,H[2]+(j===2?.1:-.2)],.85+.3*j,{bottom:1,fps:20,delay:t0});}at(T+1.0,()=>{E.shake=Math.max(E.shake,.7);fxDust(HG(),1.2,10,[150,110,70]);});return T+1.0;}
    for(let j=0;j<N;j++){const q=(j+1)/N,xx=a[0]+(H[0]-a[0])*q,t0=T+j*.12,s={tex:tRoot(),pos:[0,0,0],w:0,h:0,rot:0,a:1};at(t0,()=>{E.sprites.push(s);fxDust([xx,0,H[2]],1,4,[150,110,70]);});if(j%2===0)SE(t0,X);
      tween(.7,u=>{const g=Math.sin(PI*Math.min(1,u*1.2)),hh=(.6+.5*q)*g;s.w=.22;s.h=hh;s.rot=.3*Math.sin(u*6+j);s.pos=[xx-Math.sin(s.rot)*hh,hh,H[2]+(j%2)*.25];s.a=1;},t0);at(t0+.72,()=>rmSp(s));}
    const FT=T+N*.12+.2,s=sigSp(tRoot());tween(.55,u=>{const P=HG(),g=u<.45?ease(u/.45):1,rot=u<.5?-.25:-.25+1.15*ease((u-.5)/.25);s.w=.4;s.h=1.6*g;s.rot=rot;s.pos=[P[0]+.7-Math.sin(rot)*s.h,Math.cos(rot)*s.h,P[2]+.1];s.a=u>.9?(1-u)*10:1;},FT-.4);
    at(FT+.17,()=>rmSp(s));at(FT,()=>{fxDust(HG(),1,10,[150,110,70]);E.shake=Math.max(E.shake,.6);});return FT;}],
 L:[
  (X,T)=>{X.filt='brightness(.6) saturate(1.4) hue-rotate(-20deg)';const c=mpos(),h=hpos(),z=h[2]+.7,x0=h[0]-3.5,x1=c[0]+1.5;qk(T,2.4,7);weather(T,2.4,{tex:emojiTex('🍃'),n:1,vx:-1.2,vy:-1.6,size:.16,life:2.2,vr:2,y0:5.5,yr:1});
    if(VFX.root_burst){for(let j=0;j<6;j++){const xx=x0+(x1-x0)*j/5,t0=T+.1+j*.12;vfx('root_burst',[xx,0,z-.25+(j%2)*.35],1.1+.25*(j%2),{bottom:1,fps:18,delay:t0});if(j%2===0)SE(t0,X);}}else for(let j=0;j<10;j++){const xx=x0+(x1-x0)*j/9,t0=T+.1+j*.08,s={tex:tRoot(),pos:[0,0,0],w:0,h:0,rot:0,a:1};at(t0,()=>{E.sprites.push(s);fxDust([xx,0,z],1,4,[150,110,70]);});if(j%3===0)SE(t0,X);
      tween(1.6,u=>{const g=ease(Math.min(1,u*3)),hh=(1.1+.5*(j%3))*g;s.w=.32;s.h=hh;s.rot=.35*Math.sin(j*1.7)+.08*Math.sin(u*8+j);s.pos=[xx-Math.sin(s.rot)*hh,hh,z-.3+(j%2)*.4];s.a=u>.85?(1-u)/.15:1;},t0);at(t0+1.62,()=>rmSp(s));}
    const FT=T+1.9;if(VFX.vine_whip){SE(FT-.4,X);at(FT-.42,()=>{const H=HG(),S=2.9;vfx('vine_whip',[H[0]+S*.88,0,H[2]+.1],S,{bottom:1,fps:20});});}else{const v=sigSp(emojiTex('🌿'));tween(.5,u=>{const H=HP(),S=[H[0]+2.6,6.4,H[2]],a1=Math.atan2(H[1]-S[1],H[0]-S[0]),ang=a1+.9*(1-ease(u)),L=Math.hypot(H[0]-S[0],H[1]-S[1])+.4;v.pos=[S[0]+Math.cos(ang)*L*.5,S[1]+Math.sin(ang)*L*.5,S[2]+.1];v.w=L*.5;v.h=.8;v.rot=ang;v.a=1;},FT-.4);
    tween(.4,u=>{v.a=1-u;},FT+.1);at(FT+.52,()=>rmSp(v));}
    at(FT,()=>{const H=HP();vfx('leaf_swirl',H,2.6);vfx(vfxOr('explosion_big','leaf_swirl'),H,1.8,{delay:.08});ring(0,[H[0],.08,H[2]],'#8CFF7A',8,.9,true);for(let j=0;j<24;j++)E.parts.push({x:H[0],y:H[1],z:H[2]+.1,vx:(RN()-.5)*7,vy:2+RN()*4,vz:0,g:5,life:1.2,max:1.2,size:.16,tex:emojiTex('🍃'),rot:RN()*6,vr:6});});return FT;},
  (X,T)=>{X.filt='brightness(.75) saturate(1.5) hue-rotate(-30deg)';const ctr=()=>{const H=HP();return[H[0],H[1]+1.6,H[2]+.1];};qk(T,2.2,5);SE(T,X);SE(T+1,X);
    tween(1.6,u=>{const C=ctr();for(let j=0;j<5;j++){const a=RN()*PI*2,r=5*(1-u*.3)+RN()*2;E.parts.push({x:C[0]+Math.cos(a)*r,y:C[1]+Math.sin(a)*r*.6,z:C[2],vx:-Math.cos(a)*r*1.4-Math.sin(a)*3,vy:-Math.sin(a)*r*.9+Math.cos(a)*2,vz:0,g:0,life:.7,max:.7,size:.18,tex:emojiTex('🌸'),rot:RN()*6,vr:5});}},T);
    const FT=T+2.1;if(VFX.flower_bloom)at(FT-1.22,()=>vfx('flower_bloom',ctr(),2.3,{fps:9}));else{const bud=sigSp(emojiTex('🌸')),gl=sigSp(gtex([255,190,230]));tween(FT-T-.5,u=>{const C=ctr(),g=ease(u);bud.pos=C;bud.w=bud.h=.3+2.4*g;bud.rot=u*4+(u>.75?(u-.75)*20:0);bud.a=1;gl.pos=[C[0],C[1],C[2]-.01];gl.w=gl.h=bud.w*1.8;gl.a=.6*g;},T+.5);
    at(FT-.05,()=>{rmSp(bud);rmSp(gl);});}at(FT,()=>{const C=ctr();vfx('holy_burst',C,3);vfx('leaf_swirl',C,2.4,{delay:.06});for(let j=0;j<50;j++){const a=RN()*PI*2,sp=2+RN()*6;E.parts.push({x:C[0],y:C[1],z:C[2],vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,vz:0,g:2,life:1.4,max:1.4,size:.15+RN()*.1,tex:RN()<.6?emojiTex('🌸'):starTex(),rot:RN()*6,vr:5});}});return FT;}]},
poison:{e:[
  (X,T)=>{for(let i=0;i<3;i++){const t0=T+i*.2;SE(t0,X);shot(t0,.45,MP,()=>{const h=HG();return[h[0]+(i-1)*.45,.35,h[2]];},{tex:gtex([170,90,220]),w:.4,arc:1.4,tr:gtex([150,230,90]),trs:.3,hit:P=>{vfx(vfxOr('poison_cloud','dark_burst'),[P[0],.5,P[2]],.7,{a:.8});const pd=sigSp(gtex([150,80,200]));tween(1.2,u=>{pd.pos=[P[0],.04,P[2]];pd.w=.6*Math.min(1,u*5);pd.h=.15;pd.a=.75*(1-u);});at(1.22,()=>rmSp(pd));}});}return T+.4+.45;},
  (X,T)=>{for(let i=0;i<8;i++){const t0=T+i*.05;if(i%3===0)SE(t0,X);shot(t0,.25,()=>{const a=MP();return[a[0],a[1]+(i%4-1.5)*.2,a[2]];},()=>{const h=HP();return[h[0],h[1]+(i%3-1)*.25,h[2]];},{tex:sparkTex([200,120,255]),w:.35,h:.07,aim:1,tr:gtex([170,90,220]),trs:.12,hit:P=>goldBurst(P,4,2,.3,.2,gtex([170,90,220]))});}
    at(T+.7,()=>{E.flash.hero=[.6,.35,.85,.8];vfx(vfxOr('poison_cloud','dark_burst'),HP(),.8,{a:.7});});return T+7*.05+.25;}],
 b:[
  (X,T)=>{const H=HG();for(let k=0;k<3;k++){const xx=H[0]+(k-1)*.8;SE(T+k*.2,X);vfx(vfxOr('poison_cloud','dark_burst'),[xx,1.2,H[2]+(k%2)*.2],1.3,{delay:T+k*.2,a:.85,grow:.3});}
    tween(1.3,()=>{for(let j=0;j<2;j++)E.parts.push({x:H[0]+(RN()-.5)*2.4,y:.2+RN()*.5,z:H[2],vx:0,vy:.8+RN(),vz:0,g:0,life:.8,max:.8,size:.08+RN()*.08,al:.85,tex:gtex([170,240,90]),rot:0,vr:0});},T);return T+.9;},
  (X,T)=>{const H=HG(),pd=sigSp(gtex([120,60,170]));tween(1.8,u=>{pd.pos=[H[0],.04,H[2]];pd.w=2.4*Math.min(1,u*2.5);pd.h=.55*Math.min(1,u*2.5);pd.a=.8*(u>.85?(1-u)/.15:1);if(RN()<.5)E.parts.push({x:H[0]+(RN()-.5)*pd.w,y:.08,z:H[2]+(RN()-.5)*.4,vx:0,vy:.6,vz:0,g:0,life:.5,max:.5,size:.12,al:.8,tex:gtex([170,240,90]),rot:0,vr:0});},T);at(T+1.82,()=>rmSp(pd));
    for(let k=0;k<5;k++){const xx=H[0]+(k-2)*.45,t0=T+.6+k*.1;SE(t0,X);if(VFX.poison_geyser)vfx('poison_geyser',[xx,0,H[2]+(k%2)*.15],.8+(k%2)*.25,{bottom:1,fps:18,delay:t0});else col(t0,.7,[xx,0,H[2]+(k%2)*.15],gtex([150,230,90]),.25,1.3+(k%2)*.4,{base:0,wk:1,a:.9});at(t0,()=>{for(let j=0;j<6;j++)E.parts.push({x:xx,y:.4+RN()*2,z:H[2],vx:(RN()-.5)*1.5,vy:1+RN()*2,vz:0,g:4,life:.7,max:.7,size:.1,tex:gtex([170,90,220]),rot:0,vr:0});});}return T+.6+4*.1+.2;}],
 L:[
  (X,T)=>{X.filt='brightness(.55) hue-rotate(55deg) saturate(1.5)';weather(T-.5,2.9,{tex:sparkTex([170,240,90]),n:6,vx:-.5,vy:-9,size:.16,life:.8,al:.8,st:1,y0:6,yr:.5,W:15});qk(T,2.4,5);SE(T,X);
    const c=mpos(),h=hpos(),z=h[2]+.7;for(let k=0;k<8;k++){const xx=h[0]-3.5+k*(c[0]-h[0]+4.5)/7,pd=sigSp(gtex([120,60,170]));tween(2.4,u=>{pd.pos=[xx,.04,z+(k%2)*.3-.15];pd.w=.8*Math.min(1,u*3);pd.h=.18;pd.a=.75*(u>.9?(1-u)*10:1);if(RN()<.15)E.parts.push({x:xx+(RN()-.5)*.6,y:.08,z:z,vx:0,vy:.7,vz:0,g:0,life:.5,max:.5,size:.1,al:.8,tex:gtex([170,240,90]),rot:0,vr:0});},T+k*.08);at(T+k*.08+2.42,()=>rmSp(pd));}
    const FT=T+2.1;if(VFX.poison_cloud)vfx('poison_cloud',[h[0]+.2,5,z],2.6,{delay:T+.3,dur:FT-T-.3,fps:8,move:[0,-3.6],mease:1,a:.95});
    at(FT,()=>{const H=HP();vfx(vfxOr('poison_cloud','dark_burst'),H,2.6);vfx(vfxOr('explosion_big','dark_burst'),H,1.8,{delay:.08});ring(0,[H[0],.08,H[2]],'#B46CFF',9,.9,true);});return FT;},
  (X,T)=>{X.filt='brightness(.5) saturate(1.5) hue-rotate(30deg)';const ctr=()=>{const c=mpos(),h=hpos();return[(c[0]+h[0])/2,2.6,h[2]+.4];},bb=sigSp(tBubble()),bg=sigSp(gtex([160,80,220])),GR=T+1.7;
    tween(GR-T,u=>{const C=ctr(),g=ease(u),wob=1+.08*Math.sin(u*25);bb.pos=C;bb.w=(.4+2.8*g)*wob;bb.h=(.4+2.8*g)/wob;bb.a=1;bg.pos=[C[0],C[1],C[2]-.01];bg.w=bg.h=bb.w*1.3;bg.a=.55;for(let j=0;j<2;j++){const a=RN()*PI*2,r=bb.w*1.1;E.parts.push({x:C[0]+Math.cos(a)*r,y:C[1]+Math.sin(a)*r,z:C[2],vx:-Math.sin(a),vy:Math.cos(a),vz:0,g:0,life:.5,max:.5,size:.12,al:.8,tex:gtex([170,240,90]),rot:0,vr:0});}},T);qk(T,GR-T,4);SE(T+.5,X);
    at(GR,()=>{rmSp(bb);rmSp(bg);const C=ctr();try{SFX.uEl(X.type)}catch(e){}ring(0,C,'#C08CFF',12,.9);ring(.08,[C[0],.08,C[2]],'#9CFF6A',12,1.0,true);for(let k=0;k<7;k++)vfx(vfxOr('poison_cloud','dark_burst'),[C[0]-4+k*1.3,1.0,C[2]+.3],1.3,{delay:.05+Math.abs(k-3)*.06,a:.9});
      for(let j=0;j<50;j++){const a=RN()*PI*2,sp=3+RN()*6;E.parts.push({x:C[0],y:C[1],z:C[2],vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,vz:0,g:3,life:1,max:1,size:.1+RN()*.1,tex:gtex(RN()<.5?[170,240,90]:[180,110,240]),rot:0,vr:0});}});return GR+.25;}]},
sea:{e:[
  (X,T)=>{SE(T,X);if(VFX.water_beam){vline('water_beam',MP,HP,{back:.35,muzzle:[150,215,255],loop:1,dur:.8,fps:22,sq:.42,delay:T});tween(.8,()=>{if(RN()<.3){const b=HP();vfx('water_splash',[b[0]+.1,b[1]+(RN()-.5)*.4,b[2]+.1],.5,{fps:36});}},T);}else beam(T,.8,MP,HP,[150,215,255],.35,{tick:b=>{if(RN()<.5)vfx('water_splash',[b[0]+.1,b[1]+(RN()-.5)*.4,b[2]+.1],.5,{fps:36});}});return T+.35;},
  (X,T)=>{for(let i=0;i<5;i++){const t0=T+i*.12;shot(t0,.7,()=>{const a=MP();return[a[0],a[1]+(i%3-1)*.4,a[2]];},HP,{tex:tBubble(),w:.32+.06*(i%3),wob:.35,hit:P=>{vfx('water_splash',P,.8);try{SFX.uEl(X.type)}catch(e){}}});}return T+4*.12+.7;}],
 b:[
  (X,T)=>{const a=MP(),c=mpos();for(let j=0;j<3;j++){const t0=T+j*.28;SE(t0,X);vfx(vfxOr('tidal_wave','water_splash'),[a[0]+.2,0,c[2]+.3-j*.1],1.1+.15*j,{bottom:1,flip:1,move:[hpos()[0]-a[0]-.4,0],fps:22,delay:t0,tick:(P,u,h)=>{if(u>.2&&u<.8)fxSpray(P,h,2);}});}return T+2*.28+.55;},
  (X,T)=>{const H=HG();if(VFX.whirlpool)vfx('whirlpool',[H[0],.15,H[2]],1.6,{loop:1,dur:1.6,fps:16,delay:T});else vort(T,1.6,H,'#9CDCFF',1.6);tween(1.4,u=>{for(let j=0;j<3;j++){const a=RN()*PI*2,r=1.6*(1-u*.4);E.parts.push({x:H[0]+Math.cos(a)*r,y:.1,z:H[2]+Math.sin(a)*r*.3,vx:-Math.sin(a)*4-Math.cos(a)*2,vy:.3,vz:(Math.cos(a)*4-Math.sin(a)*2)*.3,g:0,life:.35,max:.35,size:.12,al:.9,tex:gtex([200,240,255]),rot:0,vr:0});}},T);SE(T,X);
    tween(1.1,u=>{E.hero.off.y=-.2*Math.sin(PI*u);},T+.1);const FT=T+1.25;SE(FT-.1,X);if(VFX.water_spout)vfx('water_spout',[H[0],0,H[2]+.05],1.6,{bottom:1,fps:18,delay:FT-.4});else{col(FT-.1,.9,[H[0],0,H[2]+.05],gtex([150,215,255]),.55,2.6,{base:0,wk:1});col(FT-.1,.9,[H[0],0,H[2]+.06],gtex([240,250,255]),.2,2.6,{base:0,wk:1});}
    at(FT,()=>{for(let k=0;k<4;k++)vfx('water_splash',[H[0]+(RN()-.5),.6+RN()*2,H[2]+.1],.9,{delay:k*.06});});return FT;}],
 L:[
  (X,T)=>{X.filt='brightness(.55) saturate(1.4) hue-rotate(-10deg) contrast(1.1)';const c=mpos(),h=hpos(),FT=T+1.7;qk(T,1.9,8);SE(T,X);SE(T+.9,X);weather(T,1.9,{tex:gtex([190,230,255]),n:3,vx:-2,vy:-3,size:.08,life:1,al:.8,y0:5,yr:1});
    if(VFX.tidal_wave)vfx('tidal_wave',[c[0]+2.2,0,h[2]+.9],3.2,{bottom:1,flip:1,move:[-(c[0]-h[0])-3.2,0],fps:9.5,delay:T,tick:(P,u,hh)=>{if(u>.2&&u<.85)fxSpray(P,hh,6);}});else for(let k=0;k<8;k++)vfx('water_splash',[c[0]-k*.8,1,h[2]+.8],1.4,{delay:T+k*.15});
    at(FT,()=>{const H=HP();for(let k=0;k<6;k++)vfx('water_splash',[H[0]+(RN()-.5)*2.5,.5+RN()*2.5,H[2]+.2],1.3,{delay:k*.05});ring(0,[H[0],.08,H[2]],'#9CDCFF',9,1,true);});return FT;},
  (X,T)=>{X.filt='brightness(.6) saturate(1.3) hue-rotate(-15deg)';const c=mpos(),h=hpos(),z=h[2]+.7;qk(T,2.6,6);
    for(let k=0;k<6;k++){const xx=h[0]-2.5+k*(c[0]-h[0]+3.5)/5,t0=T+k*.12;SE(t0,X);if(VFX.water_spout)vfx('water_spout',[xx,0,z-.3],1.3,{bottom:1,fps:18,delay:t0});else col(t0,.9,[xx,0,z-.3],gtex([150,215,255]),.45,2.4,{base:0,wk:1});at(t0,()=>vfx('water_splash',[xx,2.2,z-.2],1));}
    const N=14,D0=T+.8,D1=D0+1.4,FT=D1,path=u=>{const C=mpos(),H=HP(),x0=C[0]+1,x1=H[0];if(u<.7){const q=u/.7;return[x0+(x1-1.5-x0)*q,3.2+1.6*Math.sin(PI*q)+.4*Math.sin(q*12),H[2]+.2];}const q=(u-.7)/.3,s=[x1-1.5,3.2+.4*Math.sin(12)];return[s[0]+(H[0]-s[0])*q*q,s[1]+(H[1]-s[1])*q*q,H[2]+.2];};
    const orbs=[];if(VFX.water_spout){for(let k=0;k<5;k++){const t0=D0+k*.2,last=k===4;at(t0,()=>{const C=mpos(),H=HG(),q=(k+1)/5;vfx('water_spout',[C[0]-1+(H[0]-(C[0]-1))*q,0,H[2]+.05],last?2.0:.9+.3*q,{bottom:1,fps:20});});SE(t0,X);}if(VFX.whirlpool)at(D0,()=>{const H=HG();vfx('whirlpool',[H[0],.15,H[2]],1.8,{loop:1,dur:1.4,fps:16});});}else for(let i=0;i<N;i++)orbs.push(sigSp(gtex(i===0?[240,250,255]:[120,200,255])));SE(D0,X);
    tween(D1-D0,u=>{orbs.forEach((s,i)=>{const uu=Math.max(0,u-i*.025),P=path(Math.min(1,uu));s.pos=P;s.w=s.h=(i===0?.75:.55-.025*i)*(uu>0?1:0);s.a=.95;if(i===0&&RN()<.8)fxSpray(P,.5,1);});},D0);at(D1+.02,()=>orbs.forEach(rmSp));
    at(FT,()=>{const H=HP();vfx('water_splash',H,2.4);vfx(vfxOr('explosion_big','water_splash'),H,1.6,{delay:.06});ring(0,[H[0],.08,H[2]],'#9CDCFF',8,.9,true);});return FT;}]},
desert:{e:[
  (X,T)=>{for(let i=0;i<3;i++){const t0=T+i*.16;SE(t0,X);shot(t0,.4,()=>{const a=MP();return[a[0],a[1]+(i-1)*.35,a[2]];},HP,{tex:tBlade('#E8C27A'),w:.6,h:.3,spin:-14,tr:gtex([220,190,130]),trs:.3,hit:P=>{HIT(P,X,'smoke_puff',.7);fxDust([P[0],0,P[2]],1,4,[220,195,140]);}});}return T+.32+.4;},
  (X,T)=>{const m=E.mon;tween(.4,u=>{m.off.y=.3*Math.sin(PI*u);m.off.rz=-.2*Math.sin(PI*u);},T-.1);SE(T+.2,X);
    shot(T+.2,.6,()=>{const a=MP();return[a[0],a[1]+.8,a[2]];},HP,{tex:tRock(),w:.75,arc:2.2,spin:-8,hit:P=>{for(let j=0;j<14;j++)E.parts.push({x:P[0],y:P[1],z:P[2],vx:(RN()-.5)*6,vy:1+RN()*4,vz:0,g:9,life:.9,max:.9,size:.15+RN()*.15,tex:tRock(),rot:RN()*6,vr:8});fxDust([P[0],0,P[2]],1.2,10,[200,170,120]);vfx('smoke_puff',P,1.1);E.shake=Math.max(E.shake,.7);}});return T+.8;}],
 b:[
  (X,T)=>{const a=MF(),h=HG();for(let k=0;k<3;k++){const t0=T+k*.25;SE(t0,X);if(VFX.tornado)vfx('tornado',[a[0],0,h[2]-.2+k*.15],1.1,{bottom:1,sink:.08,loop:1,dur:1.0,delay:t0,move:[h[0]-a[0]+(k-1)*.6,0],mease:1,sway:.6,tick:(P,u,hh)=>fxDust(P,hh,2,[220,190,130])});}
    if(VFX.sandstorm)vfx('sandstorm',[h[0],0,h[2]+.1],1.4,{bottom:1,sink:.1,loop:1,dur:1.0,delay:T+.6,a:.9,sway:.4});return T+1.15;},
  (X,T)=>{const H=HG();if(VFX.quicksand)vfx('quicksand',[H[0],.15,H[2]],1.5,{loop:1,dur:1.6,fps:14,delay:T});else vort(T,1.6,H,'#E8C88A',1.5);tween(1.5,()=>fxDust([H[0],0,H[2]],1.2,2,[220,195,140]),T);SE(T,X);at(T+.3,()=>{E.flash.hero=[.85,.7,.45,.5];});tween(1.0,u=>{E.hero.off.y=-.25*ease(u);},T+.3);at(T+1.5,()=>{E.hero.off.y=0;});
    for(let k=0;k<8;k++){const a=k/8*PI*2,t0=T+.9+k*.04,s={tex:tRock(),pos:[0,0,0],w:0,h:0,rot:0,a:0};at(t0,()=>E.sprites.push(s));tween(.5,u=>{const g=ease(Math.min(1,u*3));s.pos=[H[0]+Math.cos(a)*.9,.3+.8*g,H[2]+Math.sin(a)*.3];s.w=s.h=.3*g;s.rot=u*4;s.a=u<.8?1:(1-u)/.2;},t0);at(t0+.52,()=>rmSp(s));}
    const FT=T+1.3;SE(FT,X);return FT;}],
 L:[
  (X,T)=>{X.filt='sepia(.75) brightness(.7) saturate(1.3) contrast(1.1)';const c=mpos(),h=hpos(),gx=(c[0]+h[0])/2,z=h[2]+.7;qk(T,2.4,7);SE(T,X);
    weather(T,2.4,{tex:gtex([215,185,130]),n:5,vx:-7,vy:0,size:.6,gs:.5,life:1.4,al:.3,W:16});weather(T,2.4,{tex:sparkTex([230,200,150]),n:4,vx:-10,vy:-.5,size:.2,life:1,al:.8,st:1,W:16});
    if(VFX.sandstorm)vfx('sandstorm',[gx,0,z-.4],3.0,{bottom:1,sink:.1,loop:1,dur:2.3,delay:T,a:.85,sway:.3,grow:.2});
    for(let k=0;k<7;k++){const t0=T+.4+k*.2,y0=1+RN()*2.5,dy=(RN()-.5)*.8,dx2=(RN()-.5)*.6,sz=.35+RN()*.2;SE(t0,X);shot(t0,.45,()=>{const C=mpos();return[C[0]+3,y0,z];},()=>{const H=HP();return[H[0]+dx2,H[1]+dy,H[2]];},{tex:tRock(),w:sz,spin:-10,hit:P=>{goldBurst(P,8,3,.4,.25,gtex([200,170,120]));E.shake=Math.max(E.shake,.4);}});}
    const FT=T+.4+6*.2+.45;at(FT,()=>{const H=HP();vfx('smoke_puff',H,2.2);ring(0,[H[0],.08,H[2]],'#E8C88A',9,.9,true);});return FT;},
  (X,T)=>{X.filt='brightness(.65) sepia(.4) saturate(1.4)';const FT=T+1.9;SE(T+.5,X);
    big(T,FT-T,tPyr(),()=>{const H=HP();return[H[0],8,H[2]+.15];},()=>{const H=HP();return[H[0],1.6,H[2]+.15];},2.4,1.9,{keep:.3,tick:P=>{if(RN()<.7)E.parts.push({x:P[0]+(RN()-.5)*4,y:P[1]-1.5,z:P[2],vx:0,vy:-2,vz:0,g:2,life:.8,max:.8,size:.2,gs:.5,al:.5,tex:gtex([220,195,140]),rot:0,vr:0});}});
    const sh=sigSp(gtex([30,20,10]));tween(FT-T,u=>{const H=HG();sh.pos=[H[0],.04,H[2]];sh.w=2.6*u;sh.h=.5*u;sh.a=.55*u;},T);at(FT+.3,()=>rmSp(sh));qk(T,FT-T,3);
    at(FT,()=>{const H=HG();qk(0,.8,20);for(let j=0;j<40;j++)E.parts.push({x:H[0]+(RN()-.5)*4,y:.1,z:H[2]+(RN()-.5)*.6,vx:(RN()-.5)*8,vy:2+RN()*4,vz:0,g:7,life:1.2,max:1.2,size:.2+RN()*.3,gs:.4,al:.6,tex:gtex([220,195,140]),rot:0,vr:0});
      ring(0,[H[0],.08,H[2]],'#FFD36A',10,1,true);vfx('smoke_puff',[H[0]-1.2,.8,H[2]],1.6);vfx('smoke_puff',[H[0]+1.2,.8,H[2]],1.6);});return FT;}]},
sky:{e:[
  (X,T)=>{for(let i=0;i<3;i++){const t0=T+i*.15;SE(t0,X);if(VFX.wind_blade)fxShot('wind_blade',t0,.38,()=>{const a=MP();return[a[0],a[1]+(i-1)*.4,a[2]];},HP,.5,{hit:P=>HIT(P,X,'hit_spark',.8)});else shot(t0,.38,()=>{const a=MP();return[a[0],a[1]+(i-1)*.4,a[2]];},HP,{tex:tBlade('#EAF6FF'),w:.7,h:.35,aim:1,ra:-PI/2,tr:sparkTex([235,245,255]),trs:.4,hit:P=>HIT(P,X,'hit_spark',.8)});}return T+.3+.38;},
  (X,T)=>{X.moves=1;const m=E.mon,dx=()=>(hpos()[0]+1.0)-m.base[0];tween(.4,u=>{m.off.y=1.2*ease(u);m.off.x=.6*ease(u);},T-.2);SE(T+.2,X);
    tween(.3,u=>{const q=u*u;m.off.x=.6+(dx()-.6)*q;m.off.y=1.2*(1-q);m.off.rz=.5*Math.sin(PI*u);const c=mpos();for(let j=0;j<4;j++)E.parts.push({x:c[0]+(RN()-.5),y:c[1]+(RN()-.5),z:c[2]+.4,vx:3+RN()*3,vy:3,vz:0,g:0,life:.3,max:.3,size:.15,tex:sparkTex([235,245,255]),rot:0,vr:0,st:1});},T+.2);
    at(T+.5,()=>{HIT(HP(),X,'smoke_puff',1);E.shake=Math.max(E.shake,.8);});tween(.5,u=>{m.off.x=dx()*(1-ease(u));m.off.y=.5*Math.sin(PI*u);m.off.rz=0;},T+.55);at(T+1.1,()=>{m.off.x=0;m.off.y=0;m.off.rz=0;});return T+.5;}],
 b:[
  (X,T)=>{const a=MF(),h=HG();for(let k=0;k<3;k++){const t0=T+k*.22;SE(t0,X);if(VFX.tornado)vfx('tornado',[a[0],0,h[2]-.3+k*.2],1.2,{bottom:1,sink:.08,loop:1,dur:1.0,delay:t0,move:[h[0]-a[0]+(k-1)*.7,0],mease:1,sway:.7,tick:(P,u,hh)=>fxDust(P,hh,2,[225,235,245])});}return T+.44+.95;},
  (X,T)=>{const fe=emojiTex('🪶');for(let j=0;j<16;j++){const t0=T+j*.06,H=HP(),xx=H[0]+(RN()-.5)*2.2;if(j%4===0)SE(t0,X);fallOn(t0,.35,xx,H[2],{tex:fe,w:.35,dx:1.6,y:.5+RN()*1.4,aim:1,tr:sparkTex([235,245,255]),trs:.25,hit:P=>goldBurst(P,4,2,.3,.2,gtex([235,245,255]))});}return T+15*.06+.35;}],
 L:[
  (X,T)=>{X.filt='brightness(.55) contrast(1.2) saturate(.8)';const h=hpos(),z=h[2]+.7,cr=sigSp(gtex([255,255,255]));tween(1.0,u=>{const H=HP();cr.pos=[H[0],5.6,z-.5];cr.w=.15+.3*u;cr.h=2.2*Math.min(1,u*3);cr.a=.9;},T);tween(.6,u=>{cr.a=.9*(1-u);},T+1.8);at(T+2.42,()=>rmSp(cr));
    qk(T,2.4,7);SE(T+.5,X);SE(T+1.3,X);weather(T+.4,2,{tex:tRock(),n:1,vx:0,vy:4,size:.15,life:1.4,vr:6,y0:0,yr:.2,W:10});
    const FT=T+2.2;if(VFX.tornado)vfx('tornado',[h[0]+.2,0,z],2.8,{bottom:1,sink:.08,loop:1,dur:FT-T+.3,delay:T+.5,sway:.8,grow:.3,tick:(P,u,hh)=>fxDust(P,hh,3,[225,235,245])});
    tween(FT-T-.5,()=>{const H=HP();for(let j=0;j<3;j++){const a=RN()*PI*2,y=RN()*5,r=.5+y*.4;E.parts.push({x:H[0]+Math.cos(a)*r,y:y,z:H[2]+Math.sin(a)*r*.3,vx:-Math.sin(a)*7,vy:1.5,vz:Math.cos(a)*2,g:0,dr:2,life:.4,max:.4,size:.16,tex:sparkTex([235,245,255]),rot:0,vr:0,st:1});}},T+.5);return FT;},
  (X,T)=>{X.filt='brightness(.7) contrast(1.15) saturate(.9)';const w1=sigSp(gtex([235,245,255])),w2=sigSp(gtex([235,245,255]));SE(T,X);
    tween(1.4,u=>{const c=mpos(),g=ease(Math.min(1,u*2)),fw=1+.25*Math.sin(u*14);[w1,w2].forEach((s,i)=>{const sd=i?1:-1;s.pos=[c[0]+sd*1.6*g,c[1]+1.4,c[2]-.4];s.w=2.4*g*fw;s.h=.9*g;s.rot=sd*(.45+.2*Math.sin(u*14));s.a=.7*g;});},T);at(T+1.45,()=>{rmSp(w1);rmSp(w2);});
    const BL=T+1.1;qk(BL,1.0,14);weather(BL,1.0,{tex:sparkTex([240,248,255]),n:14,vx:-16,vy:0,size:.25,life:.6,al:.9,st:1,W:14});SE(BL,X);
    tween(.8,u=>{E.hero.off.x=-1.2*Math.sin(PI*u);E.hero.off.rz=.4*Math.sin(PI*u);},BL+.15);at(BL+1.0,()=>{E.hero.off.x=0;E.hero.off.rz=0;});const FT=BL+.3;at(FT,()=>vfx('smoke_puff',HP(),2));return FT;}]},
mech:{e:[
  (X,T)=>{for(let i=0;i<14;i++){const t0=T+i*.06,dy=(RN()-.5)*.6;if(i%2===0)at(t0,()=>{const a=MP();vfx('hit_spark',[a[0],a[1],a[2]+.05],.35,{fps:40});try{SFX.uEl(X.type)}catch(e){}});shot(t0,.18,MP,()=>{const h=HP();return[h[0],h[1]+dy,h[2]];},{tex:sparkTex([255,230,140]),w:.3,h:.06,aim:1,hit:P=>goldBurst(P,3,3,.25,.18,gtex([255,220,140]))});}return T+13*.06+.18;},
  (X,T)=>{for(let i=0;i<2;i++){const t0=T+i*.25;SE(t0,X);shot(t0,.75,()=>{const a=MP();return[a[0],a[1]+.6,a[2]];},HP,{tex:emojiTex('🚀'),w:.45,h:.45,arc:i?3.2:.6,aim:1,tr:gtex([200,200,210]),trs:.35,trl:.5,hit:P=>{vfx('fire_burst',P,1.2);vfx('smoke_puff',P,1,{delay:.05});E.shake=Math.max(E.shake,.6);}});}return T+.25+.75;}],
 b:[
  (X,T)=>{const H=HG(),n=6;for(let j=0;j<n;j++){const t0=T+j*.16,xx=H[0]+(j===n-1?0:(RN()-.5)*2.6),b={tex:gtex([255,90,70]),pos:[xx,3,H[2]],w:0,h:0,rot:0,a:0},cc={tex:gtex([255,240,230]),pos:[xx,3,H[2]+.01],w:0,h:0,rot:0,a:0};
      at(t0,()=>{if(VFX.laser_beam)vfx('laser_beam',[xx,0,H[2]],1.7,{bottom:1,loop:1,dur:.4,fps:24});else E.sprites.push(b,cc);try{SFX.uEl(X.type)}catch(e){}});tween(.32,u=>{const k=Math.sin(PI*u);b.w=.35*k;b.h=6*k;b.a=k;cc.w=.1*k;cc.h=6*k;cc.a=k;},t0);at(t0+.33,()=>{rmSp(b);rmSp(cc);});at(t0+.08,()=>vfx(vfxOr('laser_hit','fire_burst'),[xx,.6,H[2]],.8));}return T+(n-1)*.16+.1;},
  (X,T)=>{const H=HG(),ms=[];for(let k=0;k<6;k++){const a=k/6*PI*2,P=[H[0]+Math.cos(a)*1.1,.12,H[2]+Math.sin(a)*.35],s=sigSp(gtex([70,70,80])),r=sigSp(gtex([255,60,50])),t0=T+k*.06;ms.push(P);
      tween(1.5-k*.06,u=>{const t=u*(1.5-k*.06);s.pos=[P[0],P[1]+(t<.25?(1-t/.25)*2:0),P[2]];s.w=.28;s.h=.16;s.a=1;r.pos=[P[0],P[1]+.08,P[2]+.01];r.w=r.h=.16;r.a=Math.sin(t*(8+t*18))>0?1:.1;},t0);at(T+1.5,()=>{rmSp(s);rmSp(r);});}
    for(let k=0;k<6;k++)at(T+1.5+k*.07,()=>{vfx('fire_burst',[ms[k][0],.5,ms[k][2]],1.0);vfx('smoke_puff',[ms[k][0],.8,ms[k][2]],.9,{delay:.05});E.shake=Math.max(E.shake,.5);try{SFX.uEl(X.type)}catch(e){}});return T+1.5+5*.07;}],
 L:[
  (X,T)=>{X.filt='brightness(.45) contrast(1.2) saturate(1.2)';const ret=sigSp(tRing('#FF4A3A')),ret2=sigSp(tRing('#FF4A3A')),lh=sigSp(gtex([255,70,60])),lv=sigSp(gtex([255,70,60])),LK=T+1.3,FT=LK+.5;
    tween(LK-T+.3,u=>{const H=HP(),r=3.2*(1-ease(Math.min(1,u*1.2)))+.5,bl=(u>.75&&Math.sin(u*80)>0)?.3:1;ret.pos=ret2.pos=[H[0],H[1],H[2]+.2];ret.w=ret.h=r;ret2.w=ret2.h=r*.6;ret.rot=u*3;ret2.rot=-u*5;ret.a=ret2.a=.9*bl;lh.pos=lv.pos=[H[0],H[1],H[2]+.19];lh.w=r*1.3;lh.h=.03;lv.w=.03;lv.h=r*1.3;lh.a=lv.a=.8*bl;},T);
    for(let k=0;k<6;k++)at(T+k*.2,()=>{try{SFX.uBeep()}catch(e){}});at(LK+.32,()=>[ret,ret2,lh,lv].forEach(rmSp));SE(LK,X);
    const H=HG();if(VFX.laser_beam)vfx('laser_beam',[H[0],0,H[2]+.1],3.6,{bottom:1,loop:1,dur:1.0,fps:24,delay:LK,ar:1.5});else{col(LK,1.0,[H[0],0,H[2]+.1],gtex([255,90,70]),2.0,7,{base:0,wk:1});col(LK,1.0,[H[0],0,H[2]+.12],gtex([255,250,240]),.8,7,{base:0,wk:1});}
    at(FT,()=>{const P=HP();vfx(vfxOr('explosion_big','fire_burst'),P,3);vfx(vfxOr('explosion_big','fire_burst'),[P[0]-1.3,P[1]-.3,P[2]],2,{delay:.12});vfx(vfxOr('explosion_big','fire_burst'),[P[0]+1.3,P[1]-.3,P[2]],2,{delay:.2});ring(0,[P[0],.08,P[2]],'#FF7A5A',10,1,true);});return FT;},
  (X,T)=>{X.filt='brightness(.5) saturate(1.3) contrast(1.1)';const N=16;for(let i=0;i<N;i++){const t0=T+i*.06,ox=(RN()-.5);shot(t0,.45,()=>{const a=MP();return[a[0],a[1]+.5,a[2]];},()=>{const a=MP();return[a[0]-.5+ox,8,a[2]];},{tex:emojiTex('🚀'),w:.35,aim:1,tr:gtex([210,210,220]),trs:.3,trl:.6});if(i%3===0)SE(t0,X);}
    const c=mpos(),h=hpos(),z=h[2]+.7,x0=c[0]+.5,x1=h[0]-3.5;qk(T+1.1,1.8,9);
    for(let i=0;i<N;i++){const t0=T+1.1+i*.08,xx=i>=N-3?h[0]+.2+(i-N+2)*.4:x0+(x1-x0)*i/(N-4)+(RN()-.5)*.5;fallOn(t0,.35,xx,z+(RN()-.5)*.4,{tex:emojiTex('🚀'),w:.4,dx:.8,aim:1,tr:gtex([210,210,220]),trs:.3,hit:P=>{vfx('fire_burst',[P[0],.7,P[2]],1.2);vfx('smoke_puff',[P[0],.9,P[2]],1,{delay:.06});E.shake=Math.max(E.shake,.5);try{SFX.uEl(X.type)}catch(e){}}});}
    const FT=T+1.1+(N-1)*.08+.35;at(FT,()=>vfx(vfxOr('explosion_big','fire_burst'),HP(),2.6));return FT;}]},
ghost:{e:[
  (X,T)=>{if(VFX.ghost_hand){const H=HG();SE(T,X);vfx('ghost_hand',[H[0],0,H[2]+.15],1.05,{bottom:1,fps:18,delay:T});at(T+.62,()=>vfx('dark_burst',HP(),1.0));return T+.62;}
    const H=HG(),hd=sigSp(tHand('#B48CFF'));at(T,()=>{vfx('dark_burst',[H[0],.3,H[2]],.8,{a:.8});try{SFX.uEl(X.type)}catch(e){}});
    tween(.8,u=>{const g=u<.4?ease(u/.4):1,c2=u>.5?ease((u-.5)/.2):0;hd.pos=[H[0],.2+1.0*g,H[2]+.2];hd.w=.75*g*(1-c2*.25);hd.h=.95*g*(1-c2*.15);hd.rot=c2*.15;hd.a=u>.85?(1-u)/.15:.95;},T);at(T+.82,()=>rmSp(hd));at(T+.55,()=>vfx('dark_burst',HP(),1.1));return T+.55;},
  (X,T)=>{SE(T,X);const s=sigSp(tSmoke()),g=sigSp(gtex([160,100,255]));tween(.55,u=>{const a=MP(),b=HP(),P=lerp3(a,b,u);P[1]+=.3*Math.sin(u*14);s.pos=P;s.w=s.h=.6*(1+.15*Math.sin(u*40));s.rot=u*12;s.a=1;g.pos=[P[0],P[1],P[2]-.01];g.w=g.h=1.2;g.a=.7;
    E.parts.push({x:P[0],y:P[1],z:P[2]-.02,vx:0,vy:.3,vz:0,g:0,life:.4,max:.4,size:.45,gs:-.6,al:.6,tex:tSmoke(),rot:0,vr:0});},T);at(T+.56,()=>{rmSp(s);rmSp(g);vfx('dark_burst',HP(),1.4);});return T+.55;}],
 b:[
  (X,T)=>{const H=HG(),FT=T+1.6,PP=()=>{const h=HG();return[h[0]+.3,1.7,h[2]-.8];},wt=gtex([190,150,255]),sk=sparkTex([200,170,255]);
    // a dark portal opens behind the hero, spirits pour out of it, ghost hands burst up all around the hero, then a huge one grabs
    if(VFX.dark_portal)vfx('dark_portal',PP(),1.7,{loop:1,dur:2.0,fps:14,delay:T-.25,grow:.2});
    tween(1.35,()=>{if(RN()<.75){const P=PP(),B=HP();P[0]+=(RN()-.5)*1.2;P[1]+=(RN()-.5)*.6;E.parts.push({x:P[0],y:P[1],z:P[2],vx:(B[0]-P[0])*2,vy:(B[1]-P[1])*2+(RN()-.5),vz:0,g:0,life:.5,max:.5,size:.34,gs:-.4,al:.75,tex:wt,rot:0,vr:0});E.parts.push({x:P[0],y:P[1],z:P[2],vx:(B[0]-P[0])*2.2,vy:(B[1]-P[1])*2.2,vz:0,g:0,life:.4,max:.4,size:.14,tex:sk,rot:0,vr:0,st:1});}},T);
    [[-1.1,-.2],[1.0,-.25],[-.6,.25],[.7,.3]].forEach(([dx,dz],k)=>{const t0=T+.15+k*.17;SE(t0,X);if(VFX.ghost_hand)vfx('ghost_hand',[H[0]+dx,0,H[2]+dz],.75,{bottom:1,fps:22,delay:t0});else at(t0,()=>vfx('dark_burst',[H[0]+dx,.6,H[2]+dz],.8));});
    if(VFX.ghost_hand)vfx('ghost_hand',[H[0],0,H[2]+.25],1.3,{bottom:1,fps:20,delay:FT-.62});SE(FT-.6,X);
    at(FT,()=>{vfx('dark_burst',HP(),1.9);E.flash.hero=[.65,.45,1,.8];});return FT;},
  (X,T)=>{const H=HG();groundCharge(H[0],H[2],'#B48CFF',[170,120,255],1.8,T-.1,1.9);const BIND=T+.75,FT=T+1.45,chs=[],ch=tChain(),glo=gtex([180,120,255]);
    // four iron chains shoot out from the dark around the hero and bind them; they glow and strain, then shatter in a dark blast
    [[-2.6,3.0],[2.6,3.2],[-2.9,.1],[2.8,.2]].forEach(([ex,ey],k)=>{const segs=[],gls=[],t0=T+.15+k*.1;chs.push(segs,gls);SE(t0,X);
      tween(FT-t0+.05,u=>{const t=t0+u*(FT-t0+.05),Hp=HP(),A=[Hp[0]+ex,Hp[1]+ey-.4,Hp[2]+.05],tg=[Hp[0]+(k%2?.15:-.15),Hp[1]+(k<2?.25:-.25),Hp[2]+.1],q=ease(cl((t-t0)/.35)),B=lerp3(A,tg,q),
          L=Math.hypot(B[0]-A[0],B[1]-A[1]),an=Math.atan2(B[1]-A[1],B[0]-A[0]),th=.12,seg=th*4.1*2,n=Math.max(1,Math.ceil(L/seg)),strain=t>BIND?.025*Math.sin(t*55+k):0;
        while(segs.length<n){segs.push(sigSp(ch));gls.push(sigSp(glo));}
        segs.forEach((sg,i)=>{const gw=gls[i];if(i>=n){sg.a=0;gw.a=0;return;}const c=(i+.5)/n,P=[A[0]+(B[0]-A[0])*c-Math.sin(an)*strain,A[1]+(B[1]-A[1])*c+Math.cos(an)*strain,A[2]];sg.pos=P;sg.w=Math.min(seg,L/n)/2;sg.h=th;sg.rot=an;sg.a=1;
          gw.pos=[P[0],P[1],P[2]-.01];gw.w=sg.w*1.3;gw.h=th*3;gw.rot=an;gw.a=t>BIND?.55+.25*Math.sin(t*20+i):.25;});},t0);});
    at(FT+.07,()=>chs.forEach(a=>a.forEach(rmSp)));
    at(BIND,()=>{E.flash.hero=[.65,.45,1,.8];vfx('dark_burst',HP(),.9,{a:.7});E.shake=Math.max(E.shake,.4);});
    at(FT,()=>{const P=HP();vfx('dark_burst',P,1.9);for(let j=0;j<16;j++)E.parts.push({x:P[0],y:P[1],z:P[2]+.1,vx:(RN()-.5)*6,vy:1+RN()*4,vz:0,g:8,life:.8,max:.8,size:.18,tex:ch,rot:RN()*6,vr:10});});return FT;}],
 L:[
  (X,T)=>{X.filt='saturate(.25) brightness(.5) contrast(1.25)';const P0=()=>{const c=mpos(),h=hpos();return[(c[0]+h[0])/2+.5,4.4,h[2]-.2];},o=sigSp(tRing('#C8A8FF')),cr=sigSp(tSmoke()),gl=sigSp(gtex([150,100,255]));if(VFX.dark_portal){o.tex=cr.tex=null;vfx('dark_portal',P0(),1.9,{loop:1,dur:2.4,fps:14,delay:T,grow:.15});}
    tween(2.4,u=>{const P=P0(),g=ease(Math.min(1,u*2.5))*(u>.9?(1-u)*10:1);o.pos=P;o.w=3.2*g;o.h=1.5*g;o.a=.9*g;cr.pos=[P[0],P[1],P[2]+.01];cr.w=2.6*g;cr.h=1.2*g;cr.rot=u*6;cr.a=g;gl.pos=[P[0],P[1],P[2]-.01];gl.w=4.5*g;gl.h=2.2*g;gl.a=.5*g;},T);at(T+2.42,()=>[o,cr,gl].forEach(rmSp));qk(T,2.4,6);
    const wt=gtex([190,150,255]);for(let j=0;j<36;j++){const t0=T+.5+j*.04,s={tex:wt,pos:[0,0,0],w:0,h:0,rot:0,a:0},sx=(RN()-.5)*2.6,ty=(RN()-.5)*1.2,bx=(RN()-.5)*.4;at(t0,()=>E.sprites.push(s));
      tween(.6,u=>{const P=P0(),H=HP(),q=u*u,A=[P[0]+sx,P[1],P[2]],B=[H[0]+bx,H[1]+ty,H[2]],Q=[A[0]+(B[0]-A[0])*q,A[1]+(B[1]-A[1])*q+1.2*Math.sin(PI*u),A[2]];s.pos=Q;s.w=s.h=.35;s.a=.9;E.parts.push({x:Q[0],y:Q[1],z:Q[2]-.01,vx:0,vy:0,vz:0,g:0,life:.25,max:.25,size:.26,gs:-.7,al:.5,tex:wt,rot:0,vr:0});},t0);
      at(t0+.6,()=>{rmSp(s);goldBurst(HP(),3,2,.25,.18,wt);});if(j%6===0)SE(t0,X);}
    const FT=T+.5+35*.04+.6;at(FT,()=>{vfx('dark_burst',HP(),2.6);vfx(vfxOr('explosion_big','dark_burst'),HP(),1.8,{delay:.06});});return FT;},
  (X,T)=>{X.filt='brightness(.3) contrast(1.4)';const ey=[sigSp(gtex([255,40,40])),sigSp(gtex([255,40,40]))],ec=[sigSp(gtex([255,230,200])),sigSp(gtex([255,230,200]))],OP=T+.4,WV=T+1.5;
    tween(WV-T+.3,u=>{const t=T+u*(WV-T+.3),c=mpos(),h=hpos(),gx=(c[0]+h[0])/2,op=ease(Math.min(1,Math.max(0,(t-OP)/.3)))*(t>WV?Math.max(0,1-(t-WV)/.3):1),bl=(t>OP+.6&&t<OP+.7)?.1:1;
      ey.forEach((s,i)=>{s.pos=[gx+(i?1.4:-1.4),4.2,h[2]-.6];s.w=1.0*op;s.h=.45*op*bl;s.a=op;ec[i].pos=[s.pos[0],4.2,h[2]-.59];ec[i].w=.3*op;ec[i].h=.18*op*bl;ec[i].a=op;});},T);at(WV+.32,()=>[...ey,...ec].forEach(rmSp));
    SE(OP,X);const c=mpos(),h=hpos(),z=h[2]+.7,step=(c[0]-h[0]+3.5)/9;qk(WV,1.1,12);SE(WV,X);for(let k=0;k<10;k++){const xx=c[0]+.5-k*step;at(WV+k*.06,()=>{vfx('dark_burst',[xx,.9,z],1.4);E.shake=Math.max(E.shake,.5);});}
    const FT=WV+Math.max(0,(c[0]+.5-(h[0]+.2))/step)*.06;at(FT,()=>vfx('dark_burst',HP(),2.2));return FT;}]},
skel:{e:[
  (X,T)=>{SE(T,X);shot(T,.32,()=>{const a=MP();return[a[0],a[1]+.3,a[2]];},HP,{tex:tBone(),w:.16,h:.85,aim:1,ra:-PI/2,tr:gtex([240,235,220]),trs:.2,hit:P=>{for(let j=0;j<10;j++)E.parts.push({x:P[0],y:P[1],z:P[2],vx:(RN()-.5)*5,vy:1+RN()*3,vz:0,g:9,life:.7,max:.7,size:.12,tex:tBone(),rot:RN()*6,vr:12});vfx('dark_burst',P,.9);}});return T+.32;},
  (X,T)=>{for(let i=0;i<2;i++){const t0=T+i*.18,s={tex:tBone(),pos:[0,0,0],w:0,h:0,rot:0,a:0};SE(t0,X);at(t0,()=>E.sprites.push(s));
      tween(.9,u=>{const a=MP(),b=HP(),q=Math.sin(PI*u),P=[a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q+(i?.45:-.15)*Math.sin(PI*u*2),a[2]+.05];s.pos=P;s.w=.12;s.h=.55;s.rot=u*30;s.a=1;},t0);at(t0+.92,()=>rmSp(s));at(t0+.45,()=>HIT(HP(),X,'dark_burst',.7));}return T+.45;}],
 b:[
  (X,T)=>{const a=MP(),H=HG();for(let r=0;r<2;r++)for(let j=0;j<8;j++){const q=(j+1)/8,xx=a[0]+(H[0]-a[0])*q,zz=H[2]+(r?.2:-.2),t0=T+r*.1+j*.07,rot=r?.15:-.15,s={tex:tBone(),pos:[0,0,0],w:0,h:0,rot:0,a:1};
      at(t0,()=>{E.sprites.push(s);goldBurst([xx,.15,zz],3,2,.3,.2,gtex([240,235,220]));});tween(.7,u=>{const g=u<.25?ease(u/.25):1;s.w=.13;s.h=(.45+.6*q)*g;s.rot=rot;s.pos=[xx-Math.sin(rot)*s.h,s.h*Math.cos(rot),zz];s.a=u<.7?1:(1-u)/.3;},t0);at(t0+.72,()=>rmSp(s));if(j%3===0)SE(t0,X);}
    const FT=T+.1+8*.07+.1;at(FT,()=>vfx('dark_burst',HP(),1.4));return FT;},
  (X,T)=>{const H=HG();tween(1.4,()=>{if(RN()<.5)E.parts.push({x:H[0]+(RN()-.5)*2.4,y:.15,z:H[2],vx:(RN()-.5)*.4,vy:.15,vz:0,g:0,life:1.2,max:1.2,size:.6,gs:.5,al:.35,tex:gtex([90,60,140]),rot:0,vr:0});},T);
    for(let j=0;j<12;j++){const t0=T+j*.08,xx=H[0]+(RN()-.5)*2.4;if(j%3===0)SE(t0+.3,X);fallOn(t0,.38,xx,H[2]+(RN()-.5)*.4,{tex:tBone(),w:.12,h:.5,dx:.4,spin:10,y:.3,hit:P=>{goldBurst(P,5,3,.3,.2,gtex([240,235,220]));for(let k=0;k<3;k++)E.parts.push({x:P[0],y:.3,z:P[2],vx:(RN()-.5)*3,vy:1+RN()*2,vz:0,g:9,life:.6,max:.6,size:.1,tex:tBone(),rot:RN()*6,vr:10});}});}return T+11*.08+.38;}],
 L:[
  (X,T)=>{X.filt='brightness(.4) saturate(.6) contrast(1.25)';const H0=HG(),bx=H0[0]+1.3,z=H0[2]-.1,fing=[],palm=sigSp(gtex([235,228,210]));for(let i=0;i<5;i++)fing.push(sigSp(tBone()));qk(T,2.2,6);
    const SL=T+1.7,FT=SL+.22;at(T,()=>fxDust([bx,0,z],1.5,14,[150,140,130]));SE(T+.2,X);SE(SL,X);
    tween(FT-T+.4,u=>{const t=T+u*(FT-T+.4),rise=ease(Math.min(1,(t-T)/1.0)),sl=t<SL?0:ease(Math.min(1,(t-SL)/.22)),base=[bx,-1.5+3.2*rise,z],ang=-.15+1.25*sl,fade=t>FT+.2?Math.max(0,1-(t-FT-.2)/.2):1,vis=Math.min(1,rise*3);
      palm.pos=[base[0]-Math.sin(ang)*.3,base[1]+.2,z];palm.w=1.0;palm.h=.8;palm.a=.8*fade*vis;
      fing.forEach((s,i)=>{const fa=ang+(i-2)*.22,L=1.6-Math.abs(i-2)*.2;s.pos=[base[0]-Math.sin(fa)*(.6+L/2),base[1]+Math.cos(fa)*(.6+L/2),z+.01];s.w=.22;s.h=L/2;s.rot=fa;s.a=fade*vis;});},T);
    at(FT+.62,()=>{rmSp(palm);fing.forEach(rmSp);});at(FT,()=>{const P=HP();qk(0,.6,18);vfx('dark_burst',P,2.4);for(let j=0;j<30;j++)E.parts.push({x:P[0],y:.3,z:P[2],vx:(RN()-.5)*7,vy:2+RN()*4,vz:0,g:9,life:1,max:1,size:.14,tex:tBone(),rot:RN()*6,vr:12});ring(0,[P[0],.08,P[2]],'#E8DCC0',9,.9,true);});return FT;},
  (X,T)=>{X.filt='brightness(.35) saturate(.5) contrast(1.3)';const c=mpos(),h=hpos(),z=h[2]+.7,x0=c[0]+.8,x1=h[0]-3.5;qk(T,2.5,8);
    tween(2.4,()=>{if(RN()<.8)E.parts.push({x:x1+RN()*(x0-x1),y:.12,z:z+(RN()-.5)*1.2,vx:-.6,vy:.1,vz:0,g:0,life:1.5,max:1.5,size:.8,gs:.4,al:.32,tex:gtex([80,50,120]),rot:0,vr:0});},T);
    for(let w=0;w<3;w++)for(let j=0;j<12;j++){const xx=x0+(x1-x0)*j/11,t0=T+w*.35+j*.05,zz=z+(w-1)*.35,rot=(w-1)*.12,hh=.6+.3*(j%3),s={tex:tBone(),pos:[0,0,0],w:0,h:0,rot:0,a:1};at(t0,()=>E.sprites.push(s));
      tween(.6,u=>{const g=u<.25?ease(u/.25):1;s.w=.14;s.h=hh*g;s.rot=rot;s.pos=[xx-Math.sin(rot)*s.h,s.h,zz];s.a=u<.7?1:(1-u)/.3;},t0);at(t0+.62,()=>rmSp(s));if(j%4===0)SE(t0,X);}
    const FT=T+1.95,H=HG();for(let j=0;j<10;j++){const a=j/10*PI*2,s=sigSp(tBone()),sd=Math.cos(a)<0?-1:1;
      tween(.9,u=>{const g=ease(Math.min(1,u*2.5)),c2=ease(Math.max(0,Math.min(1,(u-.45)/.2))),rot=sd*(.1+.6*c2)*Math.abs(Math.cos(a)),hh=1.2*g,bx2=H[0]+Math.cos(a)*1.0,bz=H[2]+Math.sin(a)*.35;s.w=.16;s.h=hh;s.rot=rot;s.pos=[bx2-Math.sin(rot)*hh,Math.cos(rot)*hh,bz];s.a=u<.85?1:(1-u)/.15;},FT-.55);at(FT+.37,()=>rmSp(s));}
    at(FT,()=>{const P=HP();vfx('dark_burst',P,2.2);for(let j=0;j<24;j++)E.parts.push({x:P[0],y:.6,z:P[2],vx:(RN()-.5)*6,vy:2+RN()*3,vz:0,g:9,life:.9,max:.9,size:.13,tex:tBone(),rot:RN()*6,vr:12});});return FT;}]},
dragon:{e:[
  (X,T)=>{SE(T,X);for(let i=0;i<3;i++)at(T+i*.07,()=>{const H=HP();vfx('slash_arc',[H[0]+(i-1)*.25,H[1]+.1,H[2]+.1],1.1,{rot:-.9+.1*i,fps:36});});at(T+.1,()=>{HIT(HP(),X,'fire_burst',.9);E.flash.hero=[1,.3,.2,.8];});return T+.15;},
  (X,T)=>{SE(T,X);if(VFX.fireball)fxShot('fireball',T,.55,()=>{const a=MP();return[a[0],a[1]+.3,a[2]];},HP,.95,{hit:P=>{vfx('fire_burst',P,1.8);vfx(vfxOr('explosion_big','fire_burst'),P,1.2,{delay:.05});E.shake=Math.max(E.shake,.8);}});else shot(T,.55,()=>{const a=MP();return[a[0],a[1]+.3,a[2]];},HP,{tex:gtex([255,150,50]),w:.9,tr:fl(),trs:.6,trl:.4,hit:P=>{vfx('fire_burst',P,1.8);vfx(vfxOr('explosion_big','fire_burst'),P,1.2,{delay:.05});E.shake=Math.max(E.shake,.8);}});return T+.55;}],
 b:[
  (X,T)=>{SE(T,X);SE(T+.6,X);if(VFX.fire_breath)vline('fire_breath',MP,HP,{back:.35,muzzle:[255,170,70],loop:1,dur:1.4,fps:24,sq:.62,delay:T});else stream(T,1.4,MP,HP,{tex:fl(),n:6,size:.55,spread:1,life:.55,gs:1.4});for(let k=0;k<4;k++)at(T+.4+k*.06,()=>{const H=HP();vfx('flame_loop',[H[0]+(k-1.5)*.4,.6,H[2]+.05],.8,{loop:1,dur:1.0,rise:.3});});return T+.9;},
  (X,T)=>{const m=E.mon;tween(.4,u=>{m.off.y=.5*ease(u);},T-.2);tween(.4,u=>{m.off.y=.5*(1-ease(u));},T+1.5);SE(T+.2,X);SE(T+.8,X);
    const tg=u=>{const H=HG(),c=mpos();return[c[0]-1-(c[0]-1-(H[0]-1.2))*u,.2,H[2]];};
    if(VFX.fire_breath){for(let k=0;k<3;k++)at(T+.2+k*.4,()=>vline('fire_breath',MP(),tg((k+1)/3),{back:.35,muzzle:[255,170,70],fps:26,sq:.55,loop:1,dur:.45}));}else tween(1.2,u=>{const a=MP(),b=tg(u);for(let j=0;j<4;j++){const P=lerp3(a,b,RN()*.1);E.parts.push({x:P[0],y:P[1],z:P[2],vx:(b[0]-a[0])*2,vy:(b[1]-a[1])*2,vz:0,g:0,life:.5,max:.5,size:.5,gs:1.2,tex:fl(),rot:0,vr:0});}},T+.2);
    for(let k=0;k<8;k++)at(T+.45+k*.13,()=>{const b=tg((k+1)/8);vfx('flame_loop',[b[0],.6,b[2]+.05],.8,{loop:1,dur:1.0,rise:.4});});return T+1.2;}],
 L:[
  (X,T)=>{X.moves=1;X.filt='brightness(.5) saturate(1.6) sepia(.35)';const m=E.mon,UP=T+.1,D0=T+1.5,FT=T+2.0,BK=FT+.35,dx=()=>(hpos()[0]+.6)-m.base[0];qk(D0,.6,5);SE(T+.2,X);SE(D0,X);
    // the dragon leaps off the top of the screen, embers rain down, then it dives onto the hero wrapped in fire and springs back
    tween(.5,u=>{const e=ease(u);m.off.y=7*e*e;m.off.sq=1+.22*Math.sin(PI*Math.min(1,u*1.4));},UP);
    tween(D0-UP-.5,()=>{const H=HP();if(RN()<.6)E.parts.push({x:H[0]+(RN()-.5)*6,y:6,z:H[2]-.2,vx:-.4,vy:-2.5-RN()*2,vz:0,g:0,life:1.8,max:1.8,size:.12,tex:sparkTex([255,160,60]),rot:0,vr:0,st:1});},UP+.5);
    tween(FT-D0,u=>{const q=u*u;m.off.x=dx()*q;m.off.y=7*(1-q);m.off.rz=-.45*q;m.off.sq=1+.15*q;const c=mpos();for(let j=0;j<3;j++)E.parts.push({x:c[0]+(RN()-.5),y:c[1]+.4+RN(),z:c[2]+.3,vx:RN()-.5,vy:2+RN()*2,vz:0,g:0,life:.45,max:.45,size:.6,gs:1,tex:fl(),rot:0,vr:0});},D0);
    at(FT,()=>{const P=HP();vfx(vfxOr('explosion_big','fire_burst'),P,3);for(let k=0;k<8;k++)vfx('fire_burst',[P[0]-3.5+k,.6,P[2]-.2],1.1,{delay:.05+Math.abs(k-3.5)*.05});ring(0,[P[0],.08,P[2]],'#FF8A3A',10,1,true);});
    tween(.7,u=>{const e=ease(u);m.off.x=dx()*(1-e);m.off.y=1.0*Math.sin(PI*u);m.off.rz=-.45*(1-e);m.off.sq=1+.15*(1-e)-.08*Math.sin(PI*u*2)*(1-u);},BK);at(BK+.72,()=>{m.off.x=0;m.off.y=0;m.off.rz=0;m.off.sq=1;});return FT;},
  (X,T)=>{X.filt='brightness(.45) saturate(1.7) hue-rotate(-12deg)';const m=E.mon,B0=T+.5,B1=T+1.9,FT=T+1.2;tween(.6,u=>{m.off.y=.9*ease(u);},T-.3);tween(.5,u=>{m.off.y=.9*(1-ease(u));},B1+.1);qk(B0,B1-B0,10);SE(B0,X);SE(B0+.7,X);
    const tgt=u=>{const c=mpos(),H=HG();return[c[0]-1+((H[0]-1.6)-(c[0]-1))*Math.min(1,u*1.4),.1,H[2]];};
    beam(B0,B1-B0,MP,tgt,[255,140,50],.9,{tick:b=>{if(RN()<.25)vfx('fire_burst',[b[0],.5,b[2]],.9);}});
    for(let k=0;k<9;k++)at(B0+.15+k*.14,()=>{const b=tgt((.15+k*.14)/(B1-B0));vfx('flame_loop',[b[0],.6,b[2]+.1],.9,{loop:1,dur:1.3,rise:.4});});return FT;}]}};
// ===== softer boss moves: an eased rhythm (never metronome-like), a warning glow before anything comes out of the ground,
// springy spikes that settle and sink back, streams that grow out of the mouth, and lingering embers / mist / dust afterwards =====
function cadT(j,n,T,span){const q=j/Math.max(1,n-1);return T+span*Math.pow(q,1.25)+(j>0&&j<n-1?(RN()-.5)*.05:0);}
function warn(t0,P,rgb,R,lead){const sk=sparkTex(rgb);at(t0-lead,()=>fxGround([P[0],0,P[2]],rgb,R,lead+.35));tween(lead,u=>{if(RN()<.55*u)E.parts.push({x:P[0]+(RN()-.5)*R*.6,y:.05,z:P[2]+(RN()-.5)*.2,vx:0,vy:.6+RN(),vz:0,g:0,life:.5,max:.5,size:.07,tex:sk,rot:0,vr:0,st:1});},t0-lead);}
function sprg(u,up,down){up=up||.18;down=down||.72;if(u<up)return 1.14*ease(u/up);if(u<up+.14)return 1.14-.14*ease((u-up)/.14);if(u>down)return Math.max(0,1-ease((u-down)/(1-down)));return 1;}
const LGK={fire:[[255,150,60],'em'],dragon:[[255,150,60],'em'],ice:[[220,240,255],'mist'],elec:[[255,240,150],'spark'],poison:[[170,220,110],'mist'],forest:[[150,210,110],'leaf'],sea:[[200,235,255],'drop'],desert:[[215,190,140],'dust'],sky:[[230,240,255],'mist'],mech:[[200,200,205],'smoke'],ghost:[[170,130,240],'mist'],skel:[[180,170,160],'dust']};
function linger(t0,P,kind,amt){const k=LGK[kind]||[[200,200,200],'smoke'],rgb=k[0],mode=k[1],n=amt||1,sk=sparkTex(rgb),gt=gtex(rgb),sm=gtex([90,80,80]),lf=emojiTex('🍃');
  tween(1.2,u=>{const f=1-u;if(RN()>.6*f*n)return;const x=P[0]+(RN()-.5)*.9,z=P[2]+(RN()-.5)*.3;
    if(mode==='em'){E.parts.push({x,y:.1+RN()*.5,z,vx:(RN()-.5)*.3,vy:.5+RN()*.7,vz:0,g:0,life:1.1,max:1.1,size:.06,tex:sk,rot:0,vr:0,st:1});if(RN()<.5)E.parts.push({x,y:.2,z,vx:(RN()-.5)*.2,vy:.35,vz:0,g:0,life:1.5,max:1.5,size:.35,gs:.35,al:.22,tex:sm,rot:0,vr:0});}
    else if(mode==='leaf')E.parts.push({x,y:.4+RN(),z,vx:(RN()-.5)*.6,vy:-.4,vz:0,g:0,life:1.6,max:1.6,size:.13,tex:lf,rot:RN()*6,vr:1.5});
    else if(mode==='drop')E.parts.push({x,y:.3+RN()*.8,z,vx:(RN()-.5)*1.2,vy:1+RN(),vz:0,g:6,life:.8,max:.8,size:.07,al:.9,tex:gt,rot:0,vr:0});
    else if(mode==='spark')E.parts.push({x,y:.1+RN()*.4,z,vx:(RN()-.5)*2,vy:.5+RN(),vz:0,g:2,life:.35,max:.35,size:.1,tex:sk,rot:0,vr:0,st:1});
    else E.parts.push({x,y:.15+RN()*.3,z,vx:(RN()-.5)*.3,vy:.25+RN()*.25,vz:0,g:0,life:1.5,max:1.5,size:.4,gs:.4,al:mode==='dust'?.3:.25,tex:gt,rot:0,vr:0});},t0);}
function softer(type,tier,i,need,fn){const old=MU[type][tier][i];MU[type][tier][i]=(X,T)=>need.every(k=>typeof VFX!=='undefined'&&VFX[k])?fn(X,T):old(X,T);}
// 隕石雨
softer('fire','b',0,['meteor'],(X,T)=>{const n=7,span=1.25,H0=HG();let last=T;for(let j=0;j<n;j++){const big=j===n-1,t0=cadT(j,n,T,span),xx=H0[0]+(big?0:(RN()-.5)*2.8),z=H0[2]+(big?.05:(RN()-.5)*.4),sz=big?1.05:.5+RN()*.2,fall=.42;
  warn(t0+fall,[xx,0,z],[255,110,40],big?1.4:.7,.4);SE(t0+fall-.05,X);
  fxShot('meteor',t0,fall,[xx+2.4,6.6,z],[xx,.45,z],sz,{fwd:-3*PI/4,fps:18,hit:P=>{vfx('fire_burst',[P[0],.7,P[2]],big?1.8:1.0,{fps:20});vfx('smoke_puff',[P[0],.8,P[2]],big?1.4:.8,{delay:.08,a:.6,rise:.3});E.shake=Math.max(E.shake,big?.8:.35);linger(0,[P[0],0,P[2]],'fire',big?1.5:.8);if(big||RN()<.5)vfx('flame_loop',[P[0],.5,P[2]+.05],big?.7:.45,{loop:1,dur:1.1,rise:.2});}});last=t0+fall;}return last;});
// 火柱陣
softer('fire','b',1,['fire_pillar'],(X,T)=>{const c=HG(),n=6;for(let j=0;j<n;j++){const a=j/n*PI*2+.3,xx=c[0]+Math.cos(a)*1.35,zz=c[2]+Math.sin(a)*.5,t0=cadT(j,n,T+.3,.75),sz=.85+RN()*.3;warn(t0,[xx,0,zz],[255,120,40],.9,.35);SE(t0,X);
    vfx('fire_pillar',[xx,0,zz],sz,{bottom:1,sink:.1,delay:t0,fps:19,sway:.45,tick:(P,u,h)=>{if(u<.6&&RN()<.5)fxEmbers(P,h,1);}});linger(t0+.5,[xx,0,zz],'fire',.6);}
  const tf=T+1.5;warn(tf,[c[0],0,c[2]],[255,200,80],1.7,.5);vfx('fire_pillar',[c[0],0,c[2]+.05],1.9,{bottom:1,sink:.1,delay:tf-.1,fps:19,sway:.5,tick:(P,u,h)=>{if(u<.6)fxEmbers(P,h,3);}});linger(tf+.3,[c[0],0,c[2]],'fire',1.6);return tf;});
// 冰刺地獄
softer('ice','b',1,[],(X,T)=>{const a=MP(),H=HG(),sh=tShard();tween(.9,u=>{const x=a[0]+(H[0]-a[0])*ease(u);for(let j=0;j<2;j++)E.parts.push({x:x+(RN()-.5)*.5,y:.12,z:H[2]+(RN()-.5)*.9,vx:-.6,vy:.15,vz:0,g:0,life:1,max:1,size:.45,gs:.4,al:.28,tex:gtex([215,240,255]),rot:0,vr:0});},T);
  for(let r=0;r<3;r++){const zz=H[2]+(r-1)*.35;for(let j=0;j<8;j++){const q=(j+1)/8,xx=a[0]+(H[0]-a[0])*q,t0=T+r*.08+ease(q)*.75+(RN()-.5)*.03,hh=.5+.7*q,rot=(RN()-.5)*.3,s={tex:sh,pos:[0,0,0],w:0,h:0,rot,a:1};
    at(t0,()=>{E.sprites.push(s);goldBurst([xx,.15,zz],4,2,.35,.2,gtex([200,240,255]));});if(r===1&&j%3===0)SE(t0,X);
    tween(.85,u=>{const g=sprg(u,.16,.7);s.w=.27;s.h=hh*g;s.pos=[xx-Math.sin(rot)*s.h,Math.cos(rot)*s.h,zz];s.a=u<.92?1:(1-u)/.08;},t0);at(t0+.87,()=>rmSp(s));}}
  const FT=T+1.01;at(FT,()=>{const P=HG();for(let k=0;k<6;k++){const s={tex:sh,pos:[0,0,0],w:0,h:0,rot:0,a:1},ang=(k-2.5)*.25;E.sprites.push(s);tween(.8,u=>{const g=sprg(u,.14,.68);s.w=.36;s.h=1.4*g;s.rot=ang;s.pos=[P[0]-Math.sin(ang)*s.h,Math.cos(ang)*s.h,P[2]+.05];s.a=u<.92?1:(1-u)/.08;});at(.82,()=>rmSp(s));}vfx('ice_burst',HP(),1.5);linger(.2,P,'ice',1.4);});return FT;});
// 雷暴
softer('elec','b',0,['storm_cloud'],(X,T)=>{const H=HG();vfx('storm_cloud',[H[0]-.9,4.5,H[2]-.4],1.3,{loop:1,dur:2.1,delay:T-.45,fps:13,grow:.12});vfx('storm_cloud',[H[0]+.9,4.7,H[2]-.5],1.2,{loop:1,dur:2.0,delay:T-.35,fps:13,grow:.12});
  const n=6;let last=T;for(let j=0;j<n;j++){const big=j===n-1,t0=cadT(j,n,T+.25,1.05),xx=H[0]+(big?0:(RN()-.5)*2.8);warn(t0,[xx,0,H[2]],[255,240,140],big?1.2:.6,.3);SE(t0,X);
    at(t0,()=>{vfx('lightning',[xx,0,H[2]],big?2.6:1.9,{bottom:1,fps:26});E.bgFlash=.8;E.shake=Math.max(E.shake,big?.6:.3);goldBurst([xx,.15,H[2]],10,4,.35,.22,gtex([255,240,150]));});linger(t0+.1,[xx,0,H[2]],'elec',.7);last=t0;}return last;});
// 毒沼噴泉
softer('poison','b',1,['poison_geyser'],(X,T)=>{const H=HG(),pd=sigSp(gtex([120,60,170]));tween(2.0,u=>{const g=ease(Math.min(1,u*2.2));pd.pos=[H[0],.04,H[2]];pd.w=2.4*g*(1+.03*Math.sin(u*14));pd.h=.55*g;pd.a=.8*(u>.85?(1-u)/.15:1);
    if(RN()<.6*g)E.parts.push({x:H[0]+(RN()-.5)*pd.w,y:.06,z:H[2]+(RN()-.5)*.4,vx:0,vy:.4+RN()*.4,vz:0,g:0,life:.6,max:.6,size:.08+RN()*.08,gs:.15,al:.85,tex:gtex([170,240,90]),rot:0,vr:0});},T);at(T+2.02,()=>rmSp(pd));
  const n=5;let last=T;for(let k=0;k<n;k++){const xx=H[0]+(k-2)*.45+(RN()-.5)*.15,t0=cadT(k,n,T+.65,.55),sz=.75+(k%2)*.25+RN()*.1;warn(t0,[xx,0,H[2]],[170,240,90],.5,.3);SE(t0,X);vfx('poison_geyser',[xx,0,H[2]+(k%2)*.15],sz,{bottom:1,fps:17,delay:t0});linger(t0+.4,[xx,0,H[2]],'poison',.6);last=t0;}return last+.25;});
// 荊棘爆發
softer('forest','b',0,['thorn_burst'],(X,T)=>{const H=HG();groundCharge(H[0],H[2],'#7CFF8A',[120,235,140],1.8,T-.3,1.5);[[-1.1,.9,0],[1.1,.9,.13],[0,1.45,.3]].forEach(([dx,sz,d])=>{const P=[H[0]+dx,0,H[2]+(dx?-.15:.1)];warn(T+d,P,[120,235,140],sz*.9,.3);SE(T+d,X);vfx('thorn_burst',P,sz,{bottom:1,fps:17,delay:T+d});linger(T+d+.5,P,'forest',.8);});
  at(T+.65,()=>vfx('leaf_swirl',HP(),1.4));return T+.6;});
// 巨木根
softer('forest','b',1,['root_burst'],(X,T)=>{const a=MP(),H=HG();for(let j=0;j<3;j++){const q=(j+1)/3,t0=T+ease(q)*.6,P=[a[0]+(H[0]-a[0])*q,0,H[2]+(j===2?.1:-.2)];at(t0-.3,()=>{fxDust(P,1,6,[150,110,70]);E.shake=Math.max(E.shake,.25);});SE(t0,X);vfx('root_burst',P,.85+.3*j,{bottom:1,fps:17,delay:t0});linger(t0+.5,P,'desert',.7);}
  const FT=T+1.15;at(FT,()=>{E.shake=Math.max(E.shake,.6);fxDust(HG(),1.2,10,[150,110,70]);});return FT;});
// 世界樹之怒
softer('forest','L',0,['root_burst','vine_whip'],(X,T)=>{X.filt='brightness(.6) saturate(1.4) hue-rotate(-20deg)';const c=mpos(),h=hpos(),z=h[2]+.7,x0=h[0]-3.5,x1=c[0]+1.5;qk(T,2.4,7);weather(T,2.4,{tex:emojiTex('🍃'),n:1,vx:-1.2,vy:-1.6,size:.16,life:2.2,vr:2,y0:5.5,yr:1});
  for(let j=0;j<6;j++){const xx=x0+(x1-x0)*j/5,t0=cadT(j,6,T+.2,1.0),P=[xx,0,z-.25+(j%2)*.35];at(t0-.3,()=>fxDust(P,1,5,[150,110,70]));vfx('root_burst',P,1.1+.25*(j%2),{bottom:1,fps:16,delay:t0});if(j%2===0)SE(t0,X);linger(t0+.5,P,'forest',.6);}
  const FT=T+1.95;SE(FT-.4,X);at(FT-.45,()=>{const H=HG(),S=2.9;vfx('vine_whip',[H[0]+S*.88,0,H[2]+.1],S,{bottom:1,fps:18});});
  at(FT,()=>{const H=HP();vfx('leaf_swirl',H,2.6);vfx(vfxOr('explosion_big','leaf_swirl'),H,1.8,{delay:.08});ring(0,[H[0],.08,H[2]],'#8CFF7A',8,.9,true);linger(.1,[H[0],0,H[2]],'forest',2);});return FT;});
// 花之風暴: petals spiral smoothly inward (polar motion) instead of flying in straight lines
softer('forest','L',1,['flower_bloom'],(X,T)=>{X.filt='brightness(.75) saturate(1.5) hue-rotate(-30deg)';const ctr=()=>{const H=HP();return[H[0],H[1]+1.6,H[2]+.1];},FT=T+2.1,pt=emojiTex('🌸'),ps=[],D=FT-T-.6;qk(T,2.2,5);SE(T,X);SE(T+1,X);
  for(let i=0;i<36;i++){const s=sigSp(pt),a0=RN()*PI*2,r0=3.5+RN()*2,sp=1.6+RN()*1.2,yo=(RN()-.5)*1.6,t0=RN()*.5;ps.push(s);
    tween(D,u=>{const C=ctr(),uu=Math.max(0,(u*D-t0)/(D-t0)),r=r0*(1-ease(uu))+.3,a=a0+uu*sp*PI*2;s.pos=[C[0]+Math.cos(a)*r,C[1]+yo*(1-uu)+Math.sin(a)*r*.35,C[2]+Math.sin(a)*.3];s.w=s.h=.16*(1-uu*.4);s.rot=a*2;s.a=uu>0?Math.min(1,uu*6)*(uu>.9?(1-uu)*10:1):0;},T);}
  at(FT-.55,()=>ps.forEach(rmSp));at(FT-1.22,()=>vfx('flower_bloom',ctr(),2.3,{fps:9}));
  at(FT,()=>{const C=ctr();vfx('holy_burst',C,3);vfx('leaf_swirl',C,2.4,{delay:.06});for(let j=0;j<50;j++){const a=RN()*PI*2,spd=2+RN()*6;E.parts.push({x:C[0],y:C[1],z:C[2],vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,vz:0,g:2,dr:1.2,life:1.6,max:1.6,size:.15+RN()*.1,tex:RN()<.6?pt:starTex(),rot:RN()*6,vr:5});}});return FT;});
// 連環巨浪: waves speed up and slow down (eased), foam and droplets linger
softer('sea','b',0,['tidal_wave'],(X,T)=>{const a=MP(),c=mpos();for(let j=0;j<3;j++){const t0=T+j*.3+(RN()-.5)*.04;SE(t0,X);vfx('tidal_wave',[a[0]+.2,0,c[2]+.3-j*.1],1.1+.15*j,{bottom:1,flip:1,move:[hpos()[0]-a[0]-.4,0],mease:1,fps:19,delay:t0,tick:(P,u,h)=>{if(u>.2&&u<.85)fxSpray(P,h,2);}});}
  const FT=T+1.1;linger(FT,HG(),'sea',1.6);return FT;});
// 漩渦水柱
softer('sea','b',1,['whirlpool','water_spout'],(X,T)=>{const H=HG();vfx('whirlpool',[H[0],.15,H[2]],1.65,{loop:1,dur:1.75,fps:15,delay:T-.1,grow:.15});SE(T,X);
  tween(1.4,u=>{const k=ease(Math.min(1,u*3));for(let j=0;j<2;j++){const a=RN()*PI*2,r=1.5*(1-u*.4);if(RN()<k)E.parts.push({x:H[0]+Math.cos(a)*r,y:.1,z:H[2]+Math.sin(a)*r*.3,vx:-Math.sin(a)*3-Math.cos(a)*1.5,vy:.25,vz:(Math.cos(a)*3-Math.sin(a)*1.5)*.3,g:0,dr:.8,life:.45,max:.45,size:.12,al:.9,tex:gtex([200,240,255]),rot:0,vr:0});}},T);
  tween(1.2,u=>{E.hero.off.y=-.18*ease(Math.min(1,u*1.5))*(u>.85?(1-u)/.15:1);},T+.1);
  const FT=T+1.3;at(FT-.55,()=>vfx('water_splash',[H[0],.3,H[2]+.1],.7,{a:.8}));SE(FT-.1,X);vfx('water_spout',[H[0],0,H[2]+.05],1.6,{bottom:1,fps:17,delay:FT-.42});linger(FT+.3,H,'sea',1.5);return FT;});
// 流沙陷阱: the ground opens into a sand whirl that keeps turning (grains spiral in and sink), the hero struggles and is pulled down,
// then the sand erupts in a column and throws the hero up; dust settles afterwards
softer('desert','b',1,['quicksand'],(X,T)=>{const H=HG(),h=E.hero,FT=T+1.4,sand=[gtex([226,196,140]),gtex([190,150,95]),gtex([240,215,165])],gr=[];
  vfx('quicksand',[H[0],.12,H[2]],.95,{loop:1,dur:FT-T+.55,fps:10,delay:T-.15,grow:.75,a:.92});SE(T,X);
  // grains: each one spirals from the rim to the middle (faster near the middle) and sinks, then starts again at the rim
  for(let k=0;k<44;k++){const s=sigSp(sand[k%3]),ph=RN(),a0=RN()*PI*2,sp=.75+RN()*.5,sz=.05+RN()*.06;gr.push(s);
    tween(FT-T+.4,u=>{const t=u*(FT-T+.4),grow=ease(Math.min(1,t/.5)),f=(t*sp*.8+ph)%1,R=1.55*grow,r=R*(1-f)+.08,a=a0+f*f*PI*4,fade=t>FT-T?Math.max(0,1-(t-(FT-T))/.4):1;
      s.pos=[H[0]+Math.cos(a)*r,.05-.06*f,H[2]+Math.sin(a)*r*.28];s.w=s.h=sz*(1-f*.5);s.a=Math.sin(PI*f)*grow*fade;},T-.1);}
  at(FT+.32,()=>gr.forEach(rmSp));
  // dust lifting off the rim
  tween(FT-T,u=>{if(RN()<.5){const a=RN()*PI*2,R=1.5*ease(Math.min(1,u*3));E.parts.push({x:H[0]+Math.cos(a)*R,y:.08,z:H[2]+Math.sin(a)*R*.28,vx:-Math.sin(a)*.6,vy:.25+RN()*.3,vz:0,g:0,life:1.1,max:1.1,size:.3,gs:.35,al:.3,tex:sand[0],rot:0,vr:0});}},T);
  // the hero struggles and sinks; sand splashes around the legs
  at(T+.3,()=>{E.flash.hero=[.85,.7,.45,.35];});
  tween(FT-T-.3,u=>{const t=u*(FT-T-.3),k=ease(u);h.off.y=-.45*k;h.off.x=.06*Math.sin(t*13)*(.3+k);h.off.rz=.09*Math.sin(t*8.5)*(.3+k);
    if(RN()<.7){const P=hpos();E.parts.push({x:P[0]+(RN()-.5)*.7,y:.1,z:P[2]+.75,vx:(RN()-.5)*1.4,vy:1+RN()*1.4,vz:0,g:6,life:.5,max:.5,size:.06+RN()*.05,tex:sand[k>.5?1:2],rot:0,vr:0});}},T+.3);
  // eruption: a column of sand bursts up under the hero and throws them up, then they drop back
  at(FT-.05,()=>{const P=HG();E.shake=Math.max(E.shake,.6);for(let j=0;j<46;j++)E.parts.push({x:P[0]+(RN()-.5)*.7,y:.1+RN()*.4,z:P[2]+(RN()-.5)*.3,vx:(RN()-.5)*1.6,vy:3+RN()*4.5,vz:0,g:5,dr:.6,life:1.1,max:1.1,size:.28+RN()*.3,gs:.5,al:.55,tex:sand[j%3],rot:0,vr:0});
    for(let j=0;j<10;j++)E.parts.push({x:P[0],y:.3,z:P[2]+.1,vx:(RN()-.5)*4,vy:2+RN()*3,vz:0,g:9,life:.9,max:.9,size:.1+RN()*.08,tex:tDebris([196,160,108]),rot:RN()*6,vr:8});});
  tween(.6,u=>{h.off.y=u<.35?-.45+.85*ease(u/.35):.4*(1-ease((u-.35)/.65));h.off.x=0;h.off.rz=-.15*Math.sin(PI*u);},FT-.05);at(FT+.57,()=>{h.off.y=0;h.off.x=0;h.off.rz=0;});
  SE(FT-.05,X);linger(FT+.2,H,'desert',1.6);return FT;});
// 軌道雷射: a red targeting dot appears where each beam will land
softer('mech','b',0,['laser_beam'],(X,T)=>{const H=HG(),n=6;let last=T;for(let j=0;j<n;j++){const big=j===n-1,t0=cadT(j,n,T+.3,1.0),xx=H[0]+(big?0:(RN()-.5)*2.6),P=[xx,0,H[2]],dot=sigSp(gtex([255,60,50]));
    tween(.45,u=>{dot.pos=[xx,.05,H[2]];dot.w=(.5-.3*u)*(1+.2*Math.sin(u*40));dot.h=dot.w*.3;dot.a=.9*Math.min(1,u*4);},t0-.4);at(t0+.05,()=>rmSp(dot));at(t0-.4,()=>{try{SFX.uBeep()}catch(e){}});
    at(t0,()=>{vfx('laser_beam',[xx,0,H[2]],big?2.2:1.6,{bottom:1,loop:1,dur:.45,fps:22});try{SFX.uEl(X.type)}catch(e){}});at(t0+.08,()=>vfx(vfxOr('laser_hit','fire_burst'),[xx,.5,H[2]],big?1.1:.8));linger(t0+.3,P,'mech',.8);last=t0+.1;}return last;});
// 幽魂大軍
softer('ghost','b',0,['dark_portal','ghost_hand'],(X,T)=>{const H=HG(),FT=T+1.7,PP=()=>{const h=HG();return[h[0]+.3,1.7,h[2]-.8];},wt=gtex([190,150,255]),sk=sparkTex([200,170,255]);
  vfx('dark_portal',PP(),1.7,{loop:1,dur:2.2,fps:13,delay:T-.35,grow:.25});
  tween(1.45,u=>{const k=ease(Math.min(1,u*3));if(RN()<.75*k){const P=PP(),B=HP();P[0]+=(RN()-.5)*1.2;P[1]+=(RN()-.5)*.6;E.parts.push({x:P[0],y:P[1],z:P[2],vx:(B[0]-P[0])*1.8,vy:(B[1]-P[1])*1.8+(RN()-.5),vz:0,g:0,dr:.5,life:.6,max:.6,size:.34,gs:-.35,al:.7,tex:wt,rot:0,vr:0});E.parts.push({x:P[0],y:P[1],z:P[2],vx:(B[0]-P[0])*2,vy:(B[1]-P[1])*2,vz:0,g:0,life:.45,max:.45,size:.14,tex:sk,rot:0,vr:0,st:1});}},T);
  [[-1.1,-.2],[1.0,-.25],[-.6,.25],[.7,.3]].forEach(([dx,dz],k)=>{const t0=cadT(k,4,T+.2,.75),P=[H[0]+dx,0,H[2]+dz];warn(t0,P,[170,120,255],.6,.3);SE(t0,X);vfx('ghost_hand',P,.72+RN()*.08,{bottom:1,fps:19,delay:t0});linger(t0+.6,P,'ghost',.5);});
  warn(FT-.62,[H[0],0,H[2]+.25],[170,120,255],1.1,.35);vfx('ghost_hand',[H[0],0,H[2]+.25],1.3,{bottom:1,fps:18,delay:FT-.66});SE(FT-.6,X);
  at(FT,()=>{vfx('dark_burst',HP(),1.9);E.flash.hero=[.65,.45,1,.8];linger(.1,HG(),'ghost',1.6);});return FT;});
// 詛咒鎖鏈: the chains fly in with a sag that pulls tight, then strain
softer('ghost','b',1,[],(X,T)=>{const H=HG();groundCharge(H[0],H[2],'#B48CFF',[170,120,255],1.8,T-.1,1.9);const BIND=T+.8,FT=T+1.5,chs=[],ch=tChain(),glo=gtex([180,120,255]);
  [[-2.6,3.0],[2.6,3.2],[-2.9,.1],[2.8,.2]].forEach(([ex,ey],k)=>{const segs=[],gls=[],t0=T+.15+k*.1+(RN()-.5)*.04;chs.push(segs,gls);SE(t0,X);
    tween(FT-t0+.1,u=>{const t=t0+u*(FT-t0+.1),Hp=HP(),A=[Hp[0]+ex,Hp[1]+ey-.4,Hp[2]+.05],tg=[Hp[0]+(k%2?.15:-.15),Hp[1]+(k<2?.25:-.25),Hp[2]+.1],x=cl((t-t0)/.4),q=1-Math.pow(1-x,3),B=lerp3(A,tg,q),
        L=Math.hypot(B[0]-A[0],B[1]-A[1]),th=.12,seg=th*4.1*2,n=Math.max(1,Math.ceil(L/seg)),tight=ease(cl((t-t0-.25)/.5)),sag=.45*(1-tight),an=Math.atan2(B[1]-A[1],B[0]-A[0]),strain=t>BIND?.022*Math.sin(t*50+k):0,fade=t>FT?Math.max(0,1-(t-FT)/.1):1;
      while(segs.length<n){segs.push(sigSp(ch));gls.push(sigSp(glo));}
      const pt=c=>[A[0]+(B[0]-A[0])*c-Math.sin(an)*strain,A[1]+(B[1]-A[1])*c-sag*Math.sin(PI*c)+Math.cos(an)*strain,A[2]];
      segs.forEach((sg,i)=>{const gw=gls[i];if(i>=n){sg.a=0;gw.a=0;return;}const P0=pt(i/n),P1=pt((i+1)/n),P=[(P0[0]+P1[0])/2,(P0[1]+P1[1])/2,A[2]],a2=Math.atan2(P1[1]-P0[1],P1[0]-P0[0]),len=Math.hypot(P1[0]-P0[0],P1[1]-P0[1]);
        sg.pos=P;sg.w=Math.min(seg,len)/2;sg.h=th;sg.rot=a2;sg.a=fade;gw.pos=[P[0],P[1],P[2]-.01];gw.w=sg.w*1.3;gw.h=th*3;gw.rot=a2;gw.a=(t>BIND?.55+.25*Math.sin(t*16+i):.25)*fade;});},t0);});
  at(FT+.12,()=>chs.forEach(a=>a.forEach(rmSp)));
  at(BIND,()=>{E.flash.hero=[.65,.45,1,.7];vfx('dark_burst',HP(),.9,{a:.6});E.shake=Math.max(E.shake,.35);});
  at(FT,()=>{const P=HP();vfx('dark_burst',P,1.9);for(let j=0;j<16;j++)E.parts.push({x:P[0],y:P[1],z:P[2]+.1,vx:(RN()-.5)*6,vy:1+RN()*4,vz:0,g:8,life:.9,max:.9,size:.18,tex:ch,rot:RN()*6,vr:8});linger(.1,HG(),'ghost',1.2);});return FT;});
// 骨刺陣
softer('skel','b',0,[],(X,T)=>{const a=MP(),H=HG(),bn=tBone();tween(.9,u=>{const x=a[0]+(H[0]-a[0])*ease(u);if(RN()<.7)E.parts.push({x:x+(RN()-.5)*.4,y:.12,z:H[2]+(RN()-.5)*.6,vx:-.4,vy:.12,vz:0,g:0,life:1.2,max:1.2,size:.5,gs:.4,al:.28,tex:gtex([90,60,140]),rot:0,vr:0});},T);
  for(let r=0;r<2;r++)for(let j=0;j<8;j++){const q=(j+1)/8,xx=a[0]+(H[0]-a[0])*q,zz=H[2]+(r?.2:-.2),t0=T+r*.07+ease(q)*.75+(RN()-.5)*.03,rot=(r?.15:-.15)+(RN()-.5)*.12,hh=.45+.6*q,s={tex:bn,pos:[0,0,0],w:0,h:0,rot,a:1};
    at(t0,()=>{E.sprites.push(s);fxDust([xx,0,zz],.5,2,[180,170,160]);});tween(.8,u=>{const g=sprg(u,.17,.7);s.w=.13;s.h=hh*g;s.pos=[xx-Math.sin(rot)*s.h,s.h*Math.cos(rot),zz];s.a=u<.92?1:(1-u)/.08;},t0);at(t0+.82,()=>rmSp(s));if(j%3===0&&r===0)SE(t0,X);}
  const FT=T+.94;at(FT,()=>{vfx('dark_burst',HP(),1.4);linger(.1,HG(),'skel',1.3);});return FT;});
// 龍息: the stream grows out of the mouth
softer('dragon','b',0,['fire_breath'],(X,T)=>{SE(T,X);SE(T+.6,X);vline('fire_breath',MP,HP,{back:.35,muzzle:[255,170,70],loop:1,dur:1.4,fps:22,sq:.62,delay:T,reveal:.3});
  for(let k=0;k<4;k++)at(T+.35+k*.08,()=>{const H=HP();vfx('flame_loop',[H[0]+(k-1.5)*.4,.6,H[2]+.05],.8,{loop:1,dur:1.1,rise:.3});});linger(T+1.2,HG(),'fire',1.4);return T+.9;});
// 龍焰掃地: one continuous sweep (overlapping segments that cross-fade) instead of three jumps
softer('dragon','b',1,['fire_breath'],(X,T)=>{const m=E.mon;tween(.4,u=>{m.off.y=.5*ease(u);},T-.2);tween(.45,u=>{m.off.y=.5*(1-ease(u));},T+1.55);SE(T+.2,X);SE(T+.8,X);
  const tg=u=>{const H=HG(),c=mpos();return[c[0]-1-(c[0]-1-(H[0]-1.2))*u,.2,H[2]];};
  for(let k=0;k<7;k++){const u0=(k+1)/7;at(T+.2+k*.17,()=>vline('fire_breath',MP(),tg(u0),{back:.35,muzzle:[255,170,70],fps:22,sq:.55,loop:1,dur:.42,reveal:k===0?.2:0}));}
  for(let k=0;k<8;k++)at(T+.45+k*.13,()=>{const b=tg((k+1)/8);vfx('flame_loop',[b[0],.6,b[2]+.05],.8,{loop:1,dur:1.1,rise:.4});linger(.5,[b[0],0,b[2]],'fire',.4);});return T+1.25;});
function monUlt(type,tier,idx){if(!E.mon)return 0;const T3=tier==='L'?'L':tier==='b'?'b':'e',X=MX(type,T3),set=(MU[type]||MU.fire)[T3],k=idx===0||idx===1?idx:(RN()<.5?0:1);X.idx=k;
  const T0=T3==='L'?introL(X):T3==='b'?introB(X):introE(X),FT=set[k](X,T0);
  if(T3==='L')vignette(0,FT+.5);
  // soft follow-through: the monster leans into the blow as it lands and eases back (skipped when the move moves the monster itself)
  if(!X.moves){const m=E.mon,D=T3==='L'?1.1:.9;tween(D,u=>{const a=Math.sin(PI*Math.min(1,u*1.6))*Math.pow(1-u,.6);m.off.x=-.32*a;m.off.rz=-.08*a;m.off.sq=1-.06*Math.sin(PI*Math.min(1,u*3.2))*(1-u);},FT-.3);at(FT-.3+D+.02,()=>{m.off.x=0;m.off.rz=0;m.off.sq=1;});}const f=X.filt||(T3==='L'?'brightness(.42) saturate(1.35) contrast(1.12)':T3==='b'?'brightness(.66) saturate(1.12)':null);if(f)dimScreen(f,.1,FT+.6);
  at(FT,()=>{try{SFX.uHit(type,T3)}catch(e){}flashScreen(0,T3==='L'?.6:T3==='b'?.25:.05);hitstop(T3==='L'?.16:.08);E.shake=Math.max(E.shake,T3==='L'?1.6:1);});if(T3==='L')qk(FT,.9,18);
  return heroHurt(FT,X.rgb,false,null);}
function monUltName(type,tier,idx){const n=(MUN[type]||MUN.fire)[tier==='L'?'L':tier==='b'?'b':'e'];return n?n[idx||0]:'';}
// ===== ultimate finishers (終極絕招): bought as the 終極卷軸 scroll in the shop; the biggest move of each hero =====
const ULT3N={h1:'天界聖劍',h2:'元素極光砲',h3:'千羽貫日箭',h4:'煉獄斬',h5:'絕對零度',h6:'神聖審判',h7:'影之千刃',h8:'萬獸之王',h9:'終極機甲砲',h10:'時空崩壞'};
// 勇者：天界聖劍 — the sky opens over the hero; his sword grows into a colossal blade of light held straight up (the words ride on it); he swings it down onto the monster; holy pillars erupt along the cut
function s3H1(sentence,th){const K=sigBase(sentence,th,'h1'),{m,gl,rm,n}=K,h=E.hero,gold=gtex([255,225,120]),ray=uslash('h1',th),GROW=.5,FULL=1.9,SW=2.45,HIT=2.7,TOT=HIT+1.7;
  dimScreen('brightness(.72) sepia(.3) saturate(1.35)',.1,HIT+.5);
  const shaft=sigSp(gold);tween(HIT+.2,u=>{const t=u*(HIT+.2),p=hpos(),g=Math.min(1,t*2.5)*(t>HIT?Math.max(0,1-(t-HIT)/.2):1);shaft.pos=[p[0],p[1]+4.2,p[2]+.1];shaft.w=1.0*g*(1+.06*Math.sin(t*37));shaft.h=7*g;shaft.a=.5*g;
    if(R3()<.7*g)E.parts.push({x:p[0]+(R3()-.5)*1.8,y:p[1]+5,z:p[2]+.4,vx:0,vy:-3-R3()*2,vz:0,g:0,life:1.2,max:1.2,size:.13,tex:K.star,rot:0,vr:2});});
  tween(.5,u=>{h.off.y=.35*ease(u);},.1);tween(.35,u=>{h.off.y=.35*(1-ease(u));},HIT+.1);at(SW-.05,()=>heroPlay('attack',.4));
  // blade geometry: pivot at the hero's hands; held straight up while it grows, then swung down so the tip reaches past the monster
  const PV=()=>{const p=hpos();return[p[0]+.3,p[1]-.2+h.off.y,p[2]+.85];},
    REACH=()=>{const p=PV(),c=mpos();return Math.hypot(c[0]-p[0],c[1]+.2-p[1])+.8;},
    TG=()=>{const p=PV(),c=mpos();return Math.atan2(c[1]+.2-p[1],c[0]-p[0])-.1;},
    LEN=t=>{const g=.9+(3.2-.9)*ease(cl((t-GROW)/(FULL-GROW)));if(t<SW)return g;const q=cl((t-SW)/(HIT-SW));return g+(REACH()-g)*q;},
    ANG=t=>{if(t<SW)return PI/2+.05*Math.sin(t*3);const q=cl((t-SW)/(HIT-SW));return PI/2+(TG()-PI/2)*q*q;};
  const bg=sigSp(gold),bl=sigSp(tSword());let last=null;
  tween(TOT-GROW,u=>{const t=GROW+u*(TOT-GROW),p=PV(),L=LEN(t),A=ANG(t),d=[Math.cos(A),Math.sin(A)],C=[p[0]+d[0]*L*.5,p[1]+d[1]*L*.5,p[2]],fade=t<HIT+.55?1:Math.max(0,1-(t-HIT-.55)/.45),g=ease(cl((t-GROW)/.3));
    bl.pos=C;bl.h=L*.5;bl.w=L*.5*.38;bl.rot=A+PI/2;bl.a=g*fade;   // the sword texture's tip is at its bottom: rot = direction + 90°
    bg.pos=[C[0],C[1],C[2]-.02];bg.h=L*.62;bg.w=L*.3*(1+.08*Math.sin(t*30));bg.rot=bl.rot;bg.a=.55*g*fade;
    const tip=[p[0]+d[0]*L,p[1]+d[1]*L,p[2]];
    if(t>SW&&t<HIT+.04&&last)for(let j=0;j<7;j++){const P=lerp3(last,tip,j/7);E.parts.push({x:P[0],y:P[1],z:P[2],vx:(R3()-.5),vy:(R3()-.5),vz:0,g:0,life:.35,max:.35,size:.55,gs:-.8,tex:gold,rot:0,vr:0});}
    if(t>FULL-.7&&t<SW&&R3()<.6){const q=R3();E.parts.push({x:p[0]+d[0]*L*q,y:p[1]+d[1]*L*q,z:p[2]+.05,vx:(R3()-.5)*1.5,vy:(R3()-.5)*1.5,vz:0,g:0,life:.5,max:.5,size:.12,tex:K.star,rot:0,vr:3});}
    if(t>HIT+.5&&t<HIT+.95)for(let j=0;j<3;j++){const q=R3();E.parts.push({x:p[0]+d[0]*L*q,y:p[1]+d[1]*L*q,z:p[2]+.05,vx:(R3()-.5)*2,vy:.5+R3()*1.5,vz:0,g:0,life:.7,max:.7,size:.12,tex:K.star,rot:0,vr:3});}
    last=tip;},GROW);
  sigWords(K,(k,t,c)=>{if(t<.1||t>HIT)return null;const p=PV(),f=ease(cl((t-.15-k*.06)/.7)),oa=k/n*PI*2+t*3,O=[p[0]+Math.cos(oa)*1.0,p[1]+1.2+Math.sin(oa)*.4,p[2]+.05];
    if(t<GROW+.2)return{pos:lerp3([p[0]+.4,p[1]+1,p[2]],O,f),a:1,sc:.4};
    const L=LEN(t),A=ANG(t),q=.3+.65*(k+.5)/n,on=ease(cl((t-GROW-.2)/.5));return{pos:lerp3(O,[p[0]+Math.cos(A)*L*q,p[1]+Math.sin(A)*L*q,p[2]+.08],on),a:1,sc:.4,rot:on*(A-PI/2)};},TOT);
  at(HIT,()=>{const t=mpos();flashScreen(0,.45);sigBig(m,t,K.star,gold);vfx(vfxOr('explosion_big','holy_burst'),[t[0],t[1]+.3,t[2]+.85],2.4);E.flash.mon=[1,1,.85,1];
    sigLine(ray,[t[0]+1,.15,t[2]+.8],0,12,.5,.8,gl);
    for(let j=0;j<5;j++){const gx=t[0]-1.2+j*1.0,b=sigSp(gold),t0=.12+j*.09;tween(.9,u=>{const k=Math.sin(PI*u);b.pos=[gx,3.2,t[2]+.5];b.w=.45*k;b.h=6.5*k;b.a=.8*k;},t0);at(t0+.92,()=>rm(b));
      at(t0,()=>{vfx('holy_burst',[gx,.6,t[2]+.7],.9);goldBurst([gx,.3,t[2]+.7],10,4,.5,.3,gold);E.shake=Math.max(E.shake,.5);});}});
  at(TOT,()=>{[...K.sps,shaft,bl,bg].forEach(rm);h.off.y=0;});return TOT;}
// 魔法師：元素極光砲 — four element orbs (fire, ice, thunder, arcane) circle the mage while the words are drawn into them; they gather at the
// staff and fuse into one core; a huge beam of layered aurora light (pink, cyan, gold) blasts through the monster (no meteors: the first ultimate has those)
function s3H2(sentence,th){const K=sigBase(sentence,th,'h2'),{m,gl,rm,n}=K,h=E.hero,FUSE=1.7,FIRE=2.25,HIT=FIRE+.2,END=FIRE+1.1,TOT=END+1.2;
  dimScreen('brightness(.6) saturate(1.4) hue-rotate(-15deg)',.1,END+.3);
  tween(.5,u=>{h.off.y=.3*ease(u);},.1);tween(.5,u=>{h.off.y=.3*(1-ease(u));},END);
  const EL=[[255,120,40],[140,220,255],[255,240,120],[230,120,255]],orbs=EL.map(c=>({g:sigSp(gtex(c)),c:sigSp(gtex([255,255,255])),sk:sparkTex(c),gt:gtex(c)}));
  const ST=()=>{const p=hpos();return[p[0]+.9,p[1]+.1,p[2]+.85];};
  tween(FIRE+.05,u=>{const t=u*(FIRE+.05),p=hpos(),grow=ease(cl((t-.2)/.5)),fuse=ease(cl((t-FUSE)/(FIRE-FUSE))),S=ST(),on=t>FIRE?0:1;
    orbs.forEach((o,i)=>{const a=i/4*PI*2+t*(2.2+fuse*6),r=1.3*(1-fuse)*grow,P0=[p[0]+Math.cos(a)*r,p[1]+.4+Math.sin(a)*r*.5,p[2]+.6+Math.sin(a)*.2],P=lerp3(P0,S,fuse);
      o.g.pos=P;o.g.w=o.g.h=(.55+.08*Math.sin(t*20+i))*grow*(1-fuse*.4);o.g.a=.9*grow*on;o.c.pos=[P[0],P[1],P[2]+.01];o.c.w=o.c.h=.18*grow;o.c.a=grow*on;
      if(on&&RN()<.6*grow)E.parts.push({x:P[0],y:P[1],z:P[2],vx:(RN()-.5)*.8,vy:(RN()-.5)*.8,vz:0,g:0,life:.35,max:.35,size:.22,gs:-.5,al:.8,tex:o.gt,rot:0,vr:0});});},0);
  const core=sigSp(gtex([255,230,255])),cw=sigSp(gtex([255,255,255]));
  tween(FIRE-FUSE+.15,u=>{const S=ST(),k=ease(u);core.pos=S;core.w=core.h=(.3+1.0*k)*(1+.1*Math.sin(u*60));core.a=k;cw.pos=[S[0],S[1],S[2]+.01];cw.w=cw.h=.5*k;cw.a=k;
    if(RN()<.9){const a=RN()*PI*2,r=2;E.parts.push({x:S[0]+Math.cos(a)*r,y:S[1]+Math.sin(a)*r,z:S[2],vx:-Math.cos(a)*r*2.6,vy:-Math.sin(a)*r*2.6,vz:0,g:0,life:.38,max:.38,size:.15,tex:orbs[RN()*4|0].sk,rot:0,vr:0,st:1});}},FUSE);
  at(FIRE+.15,()=>{rm(core);rm(cw);});
  [[255,120,225,1.15],[120,220,255,.85],[255,235,140,.55]].forEach(([r,g2,b,W],i)=>beam(FIRE,END-FIRE,ST,()=>{const c=mpos();return[c[0]+3,c[1]+.3+.15*Math.sin(E.time*7+i*2),c[2]+.7];},[r,g2,b],W));
  tween(END-FIRE,u=>{const c=mpos();if(RN()<.5){const S=ST(),q=RN(),P=[S[0]+(c[0]+3-S[0])*q,S[1]+(c[1]+.3-S[1])*q,S[2]+.05],rg=sigSp(tRing('#FFFFFF'));tween(.35,v=>{rg.pos=P;rg.w=.15+.15*v;rg.h=.7+.9*v;rg.a=.8*(1-v);});at(.37,()=>rm(rg));}
    if(RN()<.5)vfx('hit_spark',[c[0]+(RN()-.5),c[1]+.3+(RN()-.5),c[2]+.85],.7,{fps:36});m.off.x=.12*Math.sin(u*80);},FIRE);
  at(FIRE,()=>{E.shake=Math.max(E.shake,.9);flashScreen(0,.2);heroPlay('attack',.5);try{SFX.uEl('elec')}catch(e){}});
  tween(.6,u=>{h.off.x=-.35*Math.sin(PI*u);},FIRE);
  at(HIT,()=>{const t=mpos();sigBig(m,t,K.star,gtex([255,150,230]));});
  at(END,()=>{m.off.x=0;const t=mpos();vfx(vfxOr('explosion_big','holy_burst'),[t[0],t[1]+.4,t[2]+.85],2.6);
    [[255,120,120],[255,200,100],[255,255,140],[130,255,150],[120,200,255],[180,140,255],[255,150,230]].forEach((cc,j)=>{const a=j/7*PI*2,b=sigSp(gtex(cc));tween(1.0,u=>{const L=3.6*ease(Math.min(1,u*2));b.pos=[t[0]+Math.cos(a)*L*.5,t[1]+.5+Math.sin(a)*L*.5,t[2]+.8];b.rot=a;b.w=L*.5+.1;b.h=.16;b.a=1-u;});at(1.05,()=>rm(b));});});
  sigWords(K,(k,t,c)=>{if(t<.1||t>FUSE+.2)return null;const p=hpos(),f=ease(cl((t-.1-k*.06)/.7)),a=k/n*PI*2+t*2.6,o=orbs[k%4].g.pos,in2=ease(cl((t-FUSE+.4)/.5));
    return{pos:lerp3(lerp3([p[0]+.4,p[1]+1.4,p[2]+.8],[p[0]+Math.cos(a)*1.9,p[1]+.6+Math.sin(a)*.8,p[2]+.8],f),o,in2),a:1-in2,sc:.4};},TOT);
  at(TOT,()=>{K.sps.forEach(rm);orbs.forEach(o=>{rm(o.g);rm(o.c);});h.off.y=0;h.off.x=0;m.off.x=0;});return TOT;}
// 弓箭手：千羽貫日箭 — leaps back and draws a giant bow of wind; the words and the wind spiral into one huge arrow; it fires straight through the monster leaving a tunnel of wind rings; a swarm of feather-arrows curves back in from behind
function s3H3(sentence,th){const K=sigBase(sentence,th,'h3'),{m,gl,rm,n}=K,h=E.hero,arrow=tArrow(),grn=gtex([150,255,140]),ray=uslash('h3',th),ring=tRing('#9CFF9A'),leaf=emojiTex('🍃'),wsk=sparkTex([150,255,140]),
    DRAW=.5,FIRE=2.1,PIERCE=FIRE+.17,RET=PIERCE+.35,NA=14,HIT=RET+NA*.05+.3,TOT=HIT+1.4;
  dimScreen('brightness(.78) saturate(1.3) hue-rotate(-12deg)',.1,HIT+.3);
  tween(.4,u=>{h.off.x=-.7*ease(u);h.off.y=.5*Math.sin(PI*u)+.15*ease(u);},.05);
  tween(.3,u=>{h.off.x=-.7-.35*Math.sin(PI*u);},FIRE);
  tween(.5,u=>{h.off.x=-.7*(1-ease(u));h.off.y=.15*(1-ease(u));},HIT+.3);
  const AP=()=>{const p=hpos();return[p[0]+.9,p[1]-.1+h.off.y,p[2]+.85];};
  const bowg=sigSp(grn),bow=sigSp(tBow()),arg=sigSp(grn),ar=sigSp(arrow);
  tween(FIRE+.05,u=>{const t=u*(FIRE+.05),p=AP(),on=t>FIRE?0:1,g=ease(cl((t-DRAW)/.4)),pull=ease(cl((t-DRAW-.3)/(FIRE-DRAW-.5)));
    bow.pos=[p[0]+.15,p[1],p[2]];bow.w=.75*g;bow.h=1.5*g;bow.a=g*on;bowg.pos=bow.pos;bowg.w=bowg.h=2.6*g*(1+.1*Math.sin(t*20));bowg.a=.4*g*on;
    const sz=.9+1.1*pull;ar.pos=[p[0]+.2-sz*.3*pull,p[1],p[2]+.03];ar.w=sz;ar.h=sz*.25;ar.rot=0;ar.a=g*on;
    arg.pos=[ar.pos[0]+sz*.75,ar.pos[1],ar.pos[2]-.01];arg.w=arg.h=(.5+.9*pull)*(1+.15*Math.sin(t*35));arg.a=.7*g*on;
    if(t>DRAW&&t<FIRE)for(let j=0;j<2;j++){const a=R3()*PI*2,r=1.8+R3(),lf=R3()<.3;E.parts.push({x:arg.pos[0]+Math.cos(a)*r,y:arg.pos[1]+Math.sin(a)*r*.7,z:p[2]+.05,vx:-Math.cos(a)*r*2.4,vy:-Math.sin(a)*r*1.7,vz:0,g:0,life:.4,max:.4,size:lf?.22:.15,tex:lf?leaf:wsk,rot:a,vr:4,st:lf?0:1});}});
  at(FIRE,()=>{E.shake=Math.max(E.shake,.6);flashScreen(0,.1);const p=AP();vfx('leaf_swirl',[p[0]+.5,p[1],p[2]+.05],1.0);heroPlay('attack',.3);});
  // the giant arrow: straight through the monster and off the stage, a beam behind it and wind rings around its path
  const beam=sigSp(ray),fg=sigSp(grn),fa=sigSp(arrow);let lastR=-1;
  tween(.45,u=>{const p0=AP(),c=mpos(),x0=p0[0]+.8,y0=p0[1],cy=c[1]+.3,sl=(cy-y0)/Math.max(.5,c[0]-x0),x1=c[0]+7,xx=x0+(x1-x0)*u,yy=y0+sl*(xx-x0),an=Math.atan(sl);
    fa.pos=[xx,yy,p0[2]+.1];fa.w=2.0;fa.h=.5;fa.rot=an;fa.a=1;fg.pos=[xx+.6,yy,p0[2]+.09];fg.w=fg.h=1.4;fg.a=.8;
    beam.pos=[(x0+xx)/2,(y0+yy)/2,p0[2]+.05];beam.w=(xx-x0)/2+.3;beam.h=.55;beam.rot=an;beam.a=.9;
    if(u-lastR>.06){lastR=u;const rs=sigSp(ring),P=[xx-.6,yy,p0[2]+.07];tween(.5,v=>{rs.pos=P;rs.w=.18+.25*v;rs.h=.5+1.1*v;rs.rot=an;rs.a=.8*(1-v);});at(.52,()=>rm(rs));}},FIRE);
  at(FIRE+.46,()=>{rm(fa);rm(fg);});tween(.6,u=>{beam.a=.9*(1-u);beam.h=.55*(1-u*.7);},FIRE+.46);
  at(PIERCE,()=>{const t=mpos();hitstop(.12);sigHit(m);vfx('leaf_swirl',[t[0],t[1]+.4,t[2]+.85],1.6);vfx('hit_spark',[t[0],t[1]+.4,t[2]+.9],1.4);goldBurst(t,30,6,.6,.35,grn);E.flash.mon=[.8,1,.8,1];E.shake=Math.max(E.shake,.8);});
  for(let i=0;i<NA;i++){const t0=RET+i*.05,a=sigSp(arrow),side=i%2?1:-1,hh=.5+R3()*2,ey=(R3()-.5)*.8;
    tween(.3,u=>{const c=mpos(),S=[c[0]+5.5,c[1]+.3+side*hh*.6],Q=[c[0]+2.2,c[1]+.3+side*hh*1.5],T=[c[0],c[1]+.3+ey],B=v=>[(1-v)*(1-v)*S[0]+2*(1-v)*v*Q[0]+v*v*T[0],(1-v)*(1-v)*S[1]+2*(1-v)*v*Q[1]+v*v*T[1]],P=B(u),P2=B(Math.min(1,u+.05));
      a.pos=[P[0],P[1],c[2]+.75];if(u<.99)a.rot=Math.atan2(P2[1]-P[1],P2[0]-P[0]);a.w=.85;a.h=.21;a.a=1;
      if(R3()<.6)E.parts.push({x:P[0],y:P[1],z:c[2]+.74,vx:0,vy:0,vz:0,g:0,life:.25,max:.25,size:.2,gs:-.6,tex:grn,rot:0,vr:0});},t0);
    at(t0+.3,()=>{rm(a);const c=mpos();goldBurst([c[0],c[1]+.3+ey,c[2]+.8],6,3,.3,.25,grn);sigHit(m);E.flash.mon=[.8,1,.8,.5];});}
  at(HIT,()=>{const t=mpos();flashScreen(0,.3);sigBig(m,t,leaf,grn);if(typeof VFX!=='undefined'&&VFX.tornado)vfx('tornado',[t[0],0,t[2]+.8],1.6,{bottom:1,sink:.08,loop:1,dur:1.0,sway:.6});vfx('leaf_swirl',[t[0],t[1]+.5,t[2]+.9],2.4);
    tween(.9,u=>{m.off.y=1.0*Math.sin(PI*u);m.off.rz=.3*Math.sin(u*PI*3);});});
  sigWords(K,(k,t,c)=>{if(t<.1||t>FIRE)return null;const p=AP(),tip=[p[0]+1.3,p[1],p[2]+.08],f=ease(cl((t-.15-k*.06)/.6)),pull=ease(cl((t-1.2)/(FIRE-1.3))),a=k/n*PI*2+t*4,r=1.6*(1-pull);
    return{pos:lerp3([p[0],p[1]+1,p[2]],[tip[0]+Math.cos(a)*r,tip[1]+Math.sin(a)*r*.6,tip[2]],f),a:1-pull*.8,sc:.42*(1-pull*.5)};},TOT);
  at(TOT,()=>{[...K.sps,bow,bowg,ar,arg,beam].forEach(rm);h.off.x=0;h.off.y=0;m.off.y=0;m.off.rz=0;});return TOT;}
// 劍士：煉獄斬 — dashes in for six crossing fire slashes, leaps high and cleaves straight down; pillars of fire burst up along the ground
function s3H4(sentence,th){const K=sigBase(sentence,th,'h4'),{m,gl,rm,n}=K,h=E.hero,ray=uslash('h4',th),emb=gtex([255,140,40]),D=1.0,S0=1.35,SD=.2,UP=S0+6*SD+.1,HIT=UP+.75,TOT=HIT+1.5,dx=()=>(m.base[0]-1.5)-h.base[0];
  tween(.3,u=>{h.off.x=dx()*ease(u);},D);
  for(let j=0;j<6;j++){const ts=S0+j*SD,ang=[.7,-.7,0,1.2,-1.2,.35][j];at(ts,()=>{const t=mpos(),P=[t[0],t[1]+.5,t[2]+.95];heroPlay('attack',.25);h.off.rz=(j%2?.2:-.2);vfx('slash_arc',P,1.3,{rot:ang-.5,fps:34});sigLine(ray,P,ang,5,.6,.25,gl);vfx('fire_burst',[t[0]+(R3()-.5),t[1]+.3,t[2]+.8],.6);E.shake=Math.max(E.shake,.4);E.flash.mon=[1,.6,.3,.65];sigHit(m);});}
  tween(.75,u=>{h.off.y=u<.45?2.6*ease(u/.45):2.6*(1-Math.pow((u-.45)/.55,2));h.off.rz=-.4*Math.sin(PI*u);},UP);
  sigWords(K,(k,t,c)=>{if(t<.1||t>UP)return null;const f=ease(cl((t-.1)/.6)),a=k/n*PI*2+t*(t>S0?7:2.5),r=1.8*f;return{pos:[c[0]+Math.cos(a)*r,c[1]+.6+Math.sin(a)*.8,c[2]+.7+Math.sin(a)*.4],a:1,sc:.42};},TOT);
  at(HIT,()=>{const t=mpos();h.off.rz=0;flashScreen(0,.3);sigLine(ray,[t[0],t[1]+.8,t[2]+.95],PI/2,12,1.4,.6,gl);sigBig(m,t,emojiTex('🔥'),emb);vfx('fire_burst',[t[0],t[1]+.4,t[2]+.85],2.6);
    for(let j=0;j<7;j++){if(VFX.fire_pillar)vfx('fire_pillar',[t[0]-2.4+j*.8,0,t[2]+.6+(j%2)*.3],1.05+.2*(j%2),{bottom:1,sink:.1,delay:j*.05,fps:24,sway:.5,tick:(P,u,h)=>{if(u<.7&&Math.random()<.6)fxEmbers(P,h,1);}});else vfx('flame_loop',[t[0]-2.4+j*.8,.8,t[2]+.6+(j%2)*.3],.85,{loop:1,dur:1.1,delay:j*.04,rise:.5});}});
  tween(.5,u=>{h.off.x=dx()*(1-ease(u));},HIT+.6);
  at(TOT,()=>{K.sps.forEach(rm);h.off.x=0;h.off.y=0;h.off.rz=0;});return TOT;}
// 龍騎士：絕對零度 — everything turns cold; ice crystals erupt in a ring; the monster is sealed in ice; the knight dives and shatters it
function s3H5(sentence,th){const K=sigBase(sentence,th,'h5'),{m,gl,rm,n}=K,h=E.hero,big=E.big?1.3:1,ig=gtex([150,220,255]),shard=tShard(),RG=1.2,SEAL=2.3,DIVE=3.0,HIT=3.4,TOT=HIT+1.5;
  dimScreen('saturate(.55) brightness(1.08) hue-rotate(12deg)',.1,HIT+.3);
  tween(HIT,()=>{const c=mpos();for(let j=0;j<2;j++)E.parts.push({x:c[0]-5+R3()*10,y:5.5,z:c[2]+R3()*1.5-.3,vx:-.5,vy:-1.6-R3(),vz:0,g:0,life:3,max:3,size:.08+R3()*.1,tex:R3()<.6?emojiTex('❄️'):ig,rot:R3()*6,vr:1});});
  for(let j=0;j<8;j++){const a=j/8*PI*2,s=sigSp(shard),t0=RG+j*.07;tween(TOT-t0,u=>{const t=t0+u*(TOT-t0),c=mpos(),g=ease(cl((t-t0)/.25));s.pos=[c[0]+Math.cos(a)*1.9,1.1*g*(1+.3*Math.sin(j*2.1)),c[2]+.5+Math.sin(a)*.6];s.w=.42;s.h=1.25*g*(1+.3*Math.sin(j*2.1));s.a=t<HIT?1:0;},t0);
    at(t0,()=>{const c=mpos();goldBurst([c[0]+Math.cos(a)*1.9,.3,c[2]+.5+Math.sin(a)*.6],6,2.5,.4,.26,ig);E.shake=Math.max(E.shake,.2);});}
  const ice=sigSp(tIce());tween(HIT-SEAL+.02,u=>{const c=mpos(),g=ease(cl(u*3)),H=2.05*big*g;ice.pos=[c[0],H,c[2]+.8];ice.w=1.8*big;ice.h=H;ice.a=.88*g;E.flash.mon=[.6,.9,1,.6*g];},SEAL);
  sigWords(K,(k,t,c)=>{if(t<.1||t>SEAL+.2)return null;const p=hpos(),f=ease(cl((t-.1-k*.06)/.9)),a=k/n*PI*2+t*1.5;return{pos:lerp3([p[0]+.5,p[1]+1,p[2]+.8],[c[0]+Math.cos(a)*1.4,c[1]+.8+Math.sin(a)*.9,c[2]+.75],f),a:t>SEAL?1-(t-SEAL)/.2:1,sc:.42};},TOT);
  tween(.4,u=>{h.off.y=9*ease(u);},DIVE-.6);const com=sigSp(ig),tl=sigSp(uslash('h5',th));
  tween(HIT-DIVE,u=>{const c=mpos(),s=[c[0]-2.4,9,c[2]+.8],e=[c[0],c[1]+.4,c[2]+.8],q=u*u,P=lerp3(s,e,q),ang=Math.atan2(e[1]-s[1],e[0]-s[0]);com.pos=P;com.w=com.h=1.8;com.a=1;tl.pos=[P[0]-Math.cos(ang)*1.4,P[1]-Math.sin(ang)*1.4,P[2]];tl.rot=ang;tl.w=2.8;tl.h=.7;tl.a=.9;},DIVE);
  at(HIT,()=>{rm(ice);rm(com);rm(tl);const t=mpos();flashScreen(0,.3);sigBig(m,t,shard,ig);for(let j=0;j<3;j++)vfx('ice_burst',[t[0]+(j-1)*.9,t[1]+.3+(j%2)*.4,t[2]+.8],1.6,{delay:j*.08});
    for(let j=0;j<46;j++){const a=R3()*PI*2,v=3+R3()*6;E.parts.push({x:t[0]+(R3()-.5)*1.4,y:t[1]+.3+R3()*1.6,z:t[2]+.7,vx:Math.cos(a)*v,vy:2+R3()*4,vz:0,g:7,life:1.1,max:1.1,size:.3+R3()*.35,tex:shard,rot:R3()*6,vr:(R3()-.5)*10});}});
  tween(.45,u=>{h.off.y=9*(1-ease(u));},HIT+.5);
  at(TOT,()=>{K.sps.forEach(rm);h.off.y=0;});return TOT;}
// 牧師：神聖審判 — giant feather wings open; beams of light converge from the sky; a great halo seals the monster; a cross of light explodes
function s3H6(sentence,th){const K=sigBase(sentence,th,'h6'),{m,gl,rm,n}=K,h=E.hero,fea=tFeather(),warm=gtex([255,240,190]),B0=1.4,HL=2.3,HIT=3.1,TOT=HIT+1.6;
  dimScreen('brightness(.85) sepia(.2) saturate(1.2)',.1,HIT+.4);tween(.6,u=>{h.off.y=.5*ease(u);},.3);tween(.5,u=>{h.off.y=.5*(1-ease(u));},HIT+.4);
  // two angel wings (image-AI prop 'wing', drawn spreading up to the right; mirrored for the left), rooted at the priest's back, slowly beating
  const wing=[],bw=[backSp(warm,TOT),backSp(tWingP(),TOT),backSp(tWingP(),TOT)];   // behind the priest, rooted at the shoulders, spreading to the sides
  tween(TOT-.2,u=>{const t=u*(TOT-.2),p=hpos(),g=ease(cl(t/.7))*(t>HIT+.3?Math.max(0,1-(t-HIT-.3)/.6):1),S=1.3*g,fl=.08*Math.sin(t*3.2),[gw,wl,wr]=bw;
    gw.pos=[p[0],p[1]+.6,p[2]-.4];gw.w=3.0*g;gw.h=1.7*g;gw.a=.35*g;
    wr.pos=[p[0]+.15+S*.74,p[1]+.35+S*.66,p[2]-.35];wr.w=S;wr.h=S;wr.rot=-fl;wr.a=.95*g;
    wl.pos=[p[0]-.15-S*.74,p[1]+.35+S*.66,p[2]-.35];wl.w=-S;wl.h=S;wl.rot=fl;wl.a=.95*g;});
  for(let i=0;i<4;i++){const ang=PI/2+(i-1.5)*.42;at(B0+i*.15,()=>{const c=mpos();sigLine(uslash('h6',th),[c[0]+Math.cos(ang)*3,c[1]+.6+Math.sin(ang)*3,c[2]+.6],ang,6.5,.7,.9,warm);vfx('holy_burst',[c[0],c[1]+.5,c[2]+.7],.8);E.flash.mon=[1,1,.85,.6];sigHit(m);});}
  const halo=sigSp(tRing('#FFE9A0'));tween(HIT-HL+.6,u=>{const t=HL+u*(HIT-HL+.6),c=mpos(),q=ease(cl((t-HL)/(HIT-HL))),y=c[1]+3.4-2.8*q,r=2.6-1.0*q;halo.pos=[c[0],y,c[2]+.55];halo.w=r;halo.h=r*.3;halo.a=t<HIT?1:Math.max(0,1-(t-HIT)/.5);},HL);
  sigWords(K,(k,t,c)=>{if(t<.1||t>HIT)return null;const p=hpos(),f=ease(cl((t-.1-k*.07)/1.0)),a=k/n*PI*2+t*1.3;return{pos:lerp3([p[0]+.4,p[1]+1.3,p[2]+.6],[c[0]+Math.cos(a)*1.7,c[1]+2.6+Math.sin(a)*.4,c[2]+.6],f),a:t>HIT-.2?(HIT-t)/.2:1,sc:.42};},TOT);
  at(HIT,()=>{const t=mpos(),p=hpos();flashScreen(0,.5);sigBig(m,t,fea,warm);vfx('holy_burst',[t[0],t[1]+.4,t[2]+.8],3.0);
    const v=sigSp(warm),hz=sigSp(warm);tween(1.0,u=>{const g=u<.15?u/.15:Math.max(0,1-(u-.15)/.85);v.pos=hz.pos=[t[0],t[1]+.6,t[2]+.8];v.w=.8*g;v.h=4.5*g;hz.w=3.4*g;hz.h=.7*g;v.a=hz.a=g;});at(1.05,()=>{rm(v);rm(hz);});
    for(let j=0;j<10;j++)E.parts.push({x:p[0]+(R3()-.5),y:p[1]+.5,z:p[2]+.9,vx:(R3()-.5)*1.5,vy:1.5+R3(),vz:0,g:0,dr:1,life:1.5,max:1.5,size:.4,tex:emojiTex('💖'),rot:0,vr:0});});
  at(TOT,()=>{[...K.sps,...wing,halo].forEach(rm);h.off.y=0;});return TOT;}
// 盜賊：影之千刃 — darkness; daggers appear one by one in a ring around the monster, all strike at once; a giant shadow X slash
function s3H7(sentence,th){const K=sigBase(sentence,th,'h7'),{m,gl,rm,n}=K,h=E.hero,dag=emojiTex('🗡️'),ray=uslash('h7',th),ND=16,A0=1.0,STRIKE=A0+ND*.07+.35,X=STRIKE+.45,TOT=X+1.4,dx=()=>(m.base[0]-1.6)-h.base[0];
  dimScreen('brightness(.4) contrast(1.15) saturate(.8)',.1,X+.3);
  const ds=[];for(let i=0;i<ND;i++){const a=i/ND*PI*2,s=sigSp(dag),t0=A0+i*.07;ds.push(s);
    tween(TOT-t0,u=>{const t=t0+u*(TOT-t0),c=mpos(),R=t<STRIKE?2.6:2.6*(1-ease(cl((t-STRIKE)/.15))),ctr=[c[0],c[1]+.7,c[2]+.7],g=ease(cl((t-t0)/.2));s.pos=[ctr[0]+Math.cos(a)*R,ctr[1]+Math.sin(a)*R*.75,ctr[2]];s.rot=a+PI;s.w=s.h=.5*g;s.a=t<STRIKE+.16?g:0;},t0);
    at(t0,()=>{const c=mpos();goldBurst([c[0]+Math.cos(a)*2.6,c[1]+.7+Math.sin(a)*1.95,c[2]+.7],4,1.5,.3,.3,tSmoke());});}
  at(STRIKE+.15,()=>{const t=mpos();vfx('dark_burst',[t[0],t[1]+.4,t[2]+.8],1.6);E.shake=1;E.flash.mon=[.8,.5,1,.9];sigHit(m);});
  at(A0-.3,()=>{const p=hpos();vfx('smoke_puff',[p[0],p[1]+.4,p[2]+.65],.9);h.off.y=40;});
  sigWords(K,(k,t,c)=>{if(t<.1||t>STRIKE+.1)return null;const f=ease(cl((t-.1)/.6)),a=k/n*PI*2-t*2;return{pos:[c[0]+Math.cos(a)*1.4*f,c[1]+.7+Math.sin(a)*1.0*f,c[2]+.75],a:1,sc:.42};},TOT);
  at(X-.2,()=>{h.off.y=0;h.off.x=dx();const p=hpos();vfx('smoke_puff',[p[0],p[1]+.4,p[2]+.65],.9);});
  at(X,()=>{const t=mpos(),P=[t[0],t[1]+.7,t[2]+.95];flashScreen(0,.2);vfx('slash_arc',P,2.2,{rot:.2});vfx('slash_arc',P,2.2,{rot:-1.6,delay:.08});sigLine(ray,P,.65,12,1.1,.6,gl);sigLine(ray,P,-.65,12,1.1,.6,gl);sigBig(m,t,dag,gl);vfx('dark_burst',[t[0],t[1]+.4,t[2]+.85],2.4,{delay:.05});});
  tween(.45,u=>{h.off.x=dx()*(1-ease(u));},X+.5);
  at(TOT,()=>{[...K.sps,...ds].forEach(rm);h.off.x=0;h.off.y=0;});return TOT;}
// 召喚師：萬獸之王 — all four spirit beasts charge together from different heights; a giant lion rises, roars a shock wave and pounces
function s3H8(sentence,th){const K=sigBase(sentence,th,'h8'),{m,gl,rm,n}=K,gold=gtex([255,215,110]),C0=.9,RUN=1.3,LR=RUN+.9,LJ=LR+.8,HIT=LJ+.55,TOT=HIT+1.5,LH=3.0;
  const p0=hpos();groundRune(p0[0]+1.8,p0[2]+1.1,'#FFD86A',[255,215,110],3.6,C0-.6,HIT-C0+1.4);
  H8B.forEach((b,k)=>beastDash(b,RUN+k*.12,RUN+k*.12+.55,.75,.3+k*.3,null,k));
  sigWords(K,(k,t,c)=>{if(t<.1||t>RUN+.6)return null;const p=hpos(),f=ease(cl((t-.1-k*.05)/.6));return{pos:lerp3([p[0]+.5,p[1]+1,p[2]+.8],[p[0]+1.8+(k-(n-1)/2)*.42,p[1]+1.9,p[2]+.9],f),a:t>RUN+.4?(RUN+.6-t)/.2:1,sc:.42};},TOT);
  const lion=sigSp(gold),lg=sigSp(gold),GC=()=>{const p=hpos();return[p[0]+1.8,.05,p[2]+1.0];};
  tween(TOT-LR,u=>{const t=LR+u*(TOT-LR),c=mpos(),G=GC(),y0=.2+LH*.9,y1=c[1]+.5;lion.tex=fxTex('h8_lion',gold);let P,s=1,a=1,rot=0,st=0;
    if(t<LJ){const f=ease(cl((t-LR)/.5)),roar=Math.sin(PI*cl((t-LR-.45)/.35));P=[G[0],.2+(y0-.2)*f,G[2]-.1];s=(.3+.7*f)*(1+.08*roar);a=f;}
    else if(t<HIT){const q=(t-LJ)/(HIT-LJ),e=q*q*(3-2*q);P=[G[0]+(c[0]-.3-G[0])*e,y0+(y1-y0)*e+1.6*Math.sin(PI*q),G[2]-.1+(c[2]+.6-G[2])*q];rot=.2-.45*q;st=Math.sin(PI*q);
      if(R3()<.8)E.parts.push({x:lion.pos[0],y:lion.pos[1],z:lion.pos[2]-.02,vx:0,vy:0,vz:0,g:0,life:.18,max:.18,size:lion.h,ar:lion.w/Math.max(.01,lion.h),al:.55,tex:lion.tex,rot:lion.rot,vr:0});}
    else{P=[c[0]-.3,y1,c[2]+.6];a=Math.max(0,1-(t-HIT)/.4);}
    lion.pos=P;lion.h=LH*s*(1-.06*st);lion.w=LH*s*fxAsp('h8_lion')*(1+.14*st);lion.a=a;lion.rot=rot;lg.pos=[P[0],P[1],P[2]-.05];lg.w=lg.h=LH*1.5*s;lg.a=.4*a;},LR);
  at(LR+.5,()=>{const G=GC(),rg=sigSp(tRing('#FFD86A'));tween(.7,u=>{rg.pos=[G[0],1.8,G[2]];rg.w=rg.h=1+6*ease(u);rg.a=1-u;});at(.75,()=>rm(rg));E.shake=Math.max(E.shake,.8);flashScreen(0,0);});
  at(HIT,()=>{const t=mpos();flashScreen(0,.4);sigBig(m,t,K.star,gold);beastPop([t[0]-.3,t[1]+.3,t[2]+.6],['h8_lion','✨',[255,215,110]],LH*.9);H8B.forEach((b,k)=>vfx(b[3]==='lightning'?'lightning':b[3],b[3]==='lightning'?[t[0]+(k-1.5)*.7,0,t[2]+.7]:[t[0]+(k-1.5)*.7,t[1]+.3,t[2]+.75],1.3,{delay:.05+k*.06,bottom:b[3]==='lightning'}));});
  at(TOT,()=>{[...K.sps,lion,lg].forEach(rm);});return TOT;}
// 工程師：終極機甲砲 — the robot drops in and the turret is built; both fire together; then a barrage of rockets and one huge explosion
function s3H9(sentence,th){const K=sigBase(sentence,th,'h9'),{m,gl,rm,n}=K,og=gtex([255,170,60]),sm=tSmokeG(),D=.9,F0=1.7,F1=2.9,RK=3.0,NR=8,HIT=RK+NR*.11+.4,TOT=HIT+1.6;
  const R=sigSp(og),T=sigSp(og),RP=()=>{const p=hpos();return[p[0]+1.4,1.1,p[2]+1.3];},TP=()=>{const p=hpos();return[p[0]+2.3,.85,p[2]+.6];};
  tween(TOT,u=>{const t=u*TOT,P=RP(),Q=TP(),out=t>TOT-.4?(TOT-t)/.4:1;let y=P[1];if(t<D){const q=cl((t-.2)/(D-.2));y=P[1]+8*(1-q*q);}
    R.tex=propTex(t<D+.3?'robot3':t<F0?'robot0':t<F1?'robot2':'robot1',og);R.pos=[P[0],y,P[2]];R.h=1.0;R.w=propAsp('robot0');R.a=(t<.2?0:1)*out;
    const bk=ease(cl((t-.6)/.3));T.tex=propTex(t<F0?'turret0':t<F1?(Math.sin(t*95)>0?'turret2':'turret1'):'turret0',og);T.h=.8*(.6+.4*bk);T.w=T.h*propAsp('turret0');T.pos=[Q[0],.05+T.h,Q[2]];T.a=bk*out;});
  at(D,()=>{const P=RP();goldBurst([P[0],.3,P[2]],20,3,.6,.5,sm);E.shake=Math.max(E.shake,.6);});
  for(let i=0;i<12;i++)at(F0+i*.1,()=>{const Q=TP(),P=RP(),c=mpos();[[Q[0]+.75,Q[1]+.35],[P[0]+.86,P[1]+.1]].forEach((s0,k)=>{const tr=sigSp(og);tween(.18,u=>{tr.pos=lerp3([s0[0],s0[1],Q[2]+.1],[c[0]-.2,c[1]+.3+(R3()-.5)*.6,c[2]+.6],u);tr.w=.45;tr.h=.1;tr.a=1;});at(.18,()=>{rm(tr);if(k===0&&i%2===0){vfx('hit_spark',[c[0]-.2,c[1]+.4,c[2]+.7],.5);sigHit(m);E.shake=Math.max(E.shake,.2);}});});});
  sigWords(K,(k,t,c)=>{if(t<.1||t>RK)return null;const p=hpos(),f=ease(cl((t-.1)/.5)),a=k/n*PI*2+t*2;return{pos:[p[0]+Math.cos(a)*1.1,p[1]+1+Math.sin(a)*.5,p[2]+.8],a:f*(t>RK-.3?(RK-t)/.3:1),sc:.4};},TOT);
  for(let i=0;i<NR;i++){const t0=RK+i*.11,q=[(R3()-.5)*3,2.5+R3()*2.5];flyL(emojiTex('🚀'),null,i,t0,t0+.45,(u,s,c)=>bz([s[0]+.6,s[1]+1.2,s[2]+.9],[(s[0]+c[0])/2+q[0],q[1]+1,s[2]+.9],TGT(c),u),{sz:.42,orient:1,ro:0,trail:.3,ttex:sm});
    at(t0+.45,()=>{const c=mpos();vfx('fire_burst',[c[0]+(R3()-.5)*.8,c[1]+.3+(R3()-.5)*.6,c[2]+.8],.75);E.shake=Math.max(E.shake,.35);sigHit(m);});}
  at(HIT,()=>{const t=mpos();flashScreen(0,.4);sigBig(m,t,emojiTex('⚙️'),og);vfx(vfxOr('explosion_big','fire_burst'),[t[0],t[1]+.4,t[2]+.85],2.6);for(let j=0;j<3;j++)vfx('smoke_puff',[t[0]+(j-1)*.9,t[1]+.6,t[2]+.8],1.2,{delay:.15+j*.06,a:.7});burst(t,16,emojiTex('🔩'),6,.5);});
  at(TOT,()=>{[...K.sps,R,T].forEach(rm);});return TOT;}
// 神秘使者：時空崩壞 — space itself cracks like glass around the monster in three jolts; three rifts tear open and crystal comets shoot out of them; a final tear splits the monster and the shattered space falls apart in prism light
function s3H10(sentence,th){const K=sigBase(sentence,th,'h10'),{m,gl,rm,n}=K,h=E.hero,crys=tCrystal(),pur=gtex([170,140,255]),wht=gtex([255,255,255]),ray=uslash('h10',th),CR=[.7,1.05,1.4],RIFT=1.7,NC=12,SPLIT=RIFT+.4+NC*.08+.25,SHAT=SPLIT+.4,TOT=SHAT+1.6;
  dimScreen('brightness(.55) saturate(1.5) hue-rotate(-25deg)',.1,SHAT+.2);
  tween(.5,u=>{h.off.y=.3*ease(u);},.1);tween(.4,u=>{h.off.y=.3*(1-ease(u));},SHAT);
  const ckg=sigSp(pur),ck=sigSp(tCrack());let lvl=0;
  CR.forEach((t0,i)=>at(t0,()=>{lvl=i+1;E.shake=Math.max(E.shake,.5+.2*i);flashScreen(0,.05*i);hitstop(.06);try{SFX.impact(true)}catch(e){}const c=mpos();goldBurst([c[0],c[1]+.6,c[2]+.9],14,4,.4,.25,wht);}));
  tween(SHAT-CR[0],u=>{const t=CR[0]+u*(SHAT-CR[0]),c=mpos(),sz=[0,2.2,3.4,4.6][lvl]*(1+.03*Math.sin(t*25)),pop=1+.15*Math.max(0,1-(t-CR[Math.max(0,lvl-1)])/.15);
    ck.pos=[c[0],c[1]+.6,c[2]+.95];ck.w=ck.h=sz*pop;ck.rot=.3;ck.a=.95;ckg.pos=[c[0],c[1]+.6,c[2]+.9];ckg.w=ckg.h=sz*1.2;ckg.a=.3;},CR[0]);
  const RP=c=>[[c[0]-1.9,c[1]+1.6],[c[0]+.2,c[1]+2.6],[c[0]+2.0,c[1]+1.3]],rifts=[0,1,2].map(()=>({o:sigSp(pur),c:sigSp(tSmoke()),e:sigSp(tRing('#D8C8FF'))}));
  tween(SPLIT+.1-RIFT,u=>{const t=RIFT+u*(SPLIT+.1-RIFT),c=mpos(),P=RP(c);rifts.forEach((r,i)=>{const g=ease(cl((t-RIFT-i*.12)/.3))*(t>SPLIT?Math.max(0,1-(t-SPLIT)/.1):1),q=[P[i][0],P[i][1],c[2]+.6];
    r.o.pos=q;r.o.w=1.0*g;r.o.h=1.6*g*(1+.06*Math.sin(t*20+i));r.o.a=.8*g;r.c.pos=[q[0],q[1],q[2]+.01];r.c.w=.38*g;r.c.h=.9*g;r.c.rot=t*2;r.c.a=g;r.e.pos=[q[0],q[1],q[2]+.02];r.e.w=.5*g;r.e.h=1.0*g;r.e.a=.9*g;});},RIFT);
  at(RIFT,()=>{E.shake=Math.max(E.shake,.4);});
  for(let i=0;i<NC;i++){const t0=RIFT+.4+i*.08,k=i%3,cm=sigSp(crys),tl=sigSp(ray),ey=(R3()-.5)*.6;
    tween(.22,u=>{const c=mpos(),S=RP(c)[k],T=[c[0],c[1]+.5+ey],P=[S[0]+(T[0]-S[0])*u,S[1]+(T[1]-S[1])*u,c[2]+.75],an=Math.atan2(T[1]-S[1],T[0]-S[0]);
      cm.pos=P;cm.w=.3;cm.h=.45;cm.rot=an-PI/2;cm.a=1;tl.pos=[P[0]-Math.cos(an)*.6,P[1]-Math.sin(an)*.6,P[2]-.01];tl.rot=an;tl.w=.8;tl.h=.2;tl.a=.9;},t0);
    at(t0+.22,()=>{rm(cm);rm(tl);const c=mpos();goldBurst([c[0],c[1]+.5+ey,c[2]+.85],8,3,.35,.25,pur);sigHit(m);E.flash.mon=[.85,.75,1,.6];});}
  at(SPLIT,()=>{hitstop(.1);E.shake=1;flashScreen(0,.3);});
  const tearg=sigSp(gtex([200,170,255])),tear=sigSp(wht);
  tween(SHAT-SPLIT+.3,u=>{const t=SPLIT+u*(SHAT-SPLIT+.3),c=mpos(),g=ease(cl((t-SPLIT)/.12)),o=t<SHAT?1:Math.max(0,1-(t-SHAT)/.3);
    tear.pos=[c[0],c[1]+.8,c[2]+1.0];tear.w=(.08+.25*cl((t-SPLIT)/(SHAT-SPLIT)))*g;tear.h=4.5*g;tear.rot=.12;tear.a=o;tearg.pos=tear.pos;tearg.w=tear.w*5+.3*g;tearg.h=5.2*g;tearg.rot=.12;tearg.a=.6*o;},SPLIT);
  at(SHAT,()=>{rm(ck);rm(ckg);const t=mpos();flashScreen(0,.7);sigBig(m,t,crys,pur);vfx(vfxOr('explosion_big','holy_burst'),[t[0],t[1]+.4,t[2]+.85],2.6);vfx('dark_burst',[t[0],t[1]+.4,t[2]+.8],2.2,{delay:.05});
    for(let j=0;j<46;j++){const a=R3()*PI*2,r=R3()*2.2,sp=2+R3()*5;E.parts.push({x:t[0]+Math.cos(a)*r,y:t[1]+.6+Math.sin(a)*r,z:t[2]+.95,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp+2,vz:0,g:7,life:1.3,max:1.3,size:.16+R3()*.22,tex:R3()<.5?crys:wht,rot:R3()*6,vr:(R3()-.5)*12});}
    [[255,120,120],[255,200,100],[255,255,140],[130,255,150],[120,200,255],[180,140,255],[255,150,230]].forEach((cc,j)=>{const a=j/7*PI*2,b=sigSp(gtex(cc));tween(1.0,u=>{const L=3.4*ease(Math.min(1,u*2));b.pos=[t[0]+Math.cos(a)*L*.5,t[1]+.5+Math.sin(a)*L*.5,t[2]+.8];b.rot=a;b.w=L*.5+.1;b.h=.16;b.a=1-u;});at(1.05,()=>rm(b));});});
  sigWords(K,(k,t,c)=>{if(t<.2||t>SPLIT+.2)return null;const p=hpos(),f=ease(cl((t-.2-k*.07)/.8)),a=k/n*PI*2+t*1.6,in2=ease(cl((t-SPLIT+.3)/.45)),O=[c[0]+Math.cos(a)*2.4,c[1]+.7+Math.sin(a)*1.6,c[2]+.75];
    return{pos:lerp3(lerp3([p[0]+.4,p[1]+1.6,p[2]+.8],O,f),[c[0],c[1]+.8,c[2]+1.0],in2),a:1-in2*in2,sc:.42*(1-in2*.6)};},TOT);
  at(TOT,()=>{[...K.sps,ck,ckg,tear,tearg].concat(...rifts.map(r=>[r.o,r.c,r.e])).forEach(rm);h.off.y=0;});return TOT;}
const R3=Math.random;
const SIG3={h1:s3H1,h2:s3H2,h3:s3H3,h4:s3H4,h5:s3H5,h6:s3H6,h7:s3H7,h8:s3H8,h9:s3H9,h10:s3H10};
function ultimate3(sentence,hid){if(!E.mon)return;heroPlay('attack',1.2);const th=ULT[hid]||ULT.h1,TOT=(SIG3[hid]||SIG3.h1)(sentence,th);E.fin3=1;at(TOT,()=>{E.fin3=0;});finIntro(th);vignette(0,TOT+.2);return TOT;}
// finisher wind-up like a legend's: light rays behind the hero, rocks floating up, a rumble and an energy pillar from the hero
function finIntro(th){const T=1.4,cg=gtex(th.c||[255,220,120]),wh=gtex([255,255,255]),rays=[],rock=tDebris();try{SFX.uCharge('L')}catch(e){}qk(0,T,4);
  for(let k=0;k<10;k++)rays.push(sigSp(k%2?cg:wh));
  tween(T+.5,u=>{const t=u*(T+.5),p=hpos(),k=ease(cl((t-.1)/.6))*(t>T?Math.max(0,1-(t-T)/.5):1);rays.forEach((s,i)=>{const a=i/10*PI*2-t*.35,L=(2.4+.7*Math.sin(t*3+i*1.7))*k,r0=1.5;
    s.pos=[p[0]+Math.cos(a)*(r0+L/2),p[1]-.2+Math.sin(a)*(r0+L/2)*.8,p[2]-.3];s.w=L/2;s.h=.11+.05*(i%3);s.rot=Math.atan2(Math.sin(a)*.8,Math.cos(a));s.a=(i%2?.55:.4)*k;});});
  at(T+.52,()=>rays.forEach(rmSp));
  tween(T,()=>{const c=mpos(),h=hpos();if(RN()<.35)E.parts.push({x:h[0]-2.5+RN()*(c[0]-h[0]+4),y:.05,z:h[2]+.4+(RN()-.5)*1.4,vx:(RN()-.5)*.2,vy:.6+RN()*.9,vz:0,g:-.15,life:1.6,max:1.6,size:.06+RN()*.1,al:.9,tex:rock,rot:RN()*6,vr:(RN()-.5)*3});});
  const p=hpos(),hc=th.c||[255,220,120],warmH=hc[0]>=240&&hc[2]<200;   // the energy-pillar art is gold: only for gold/orange heroes, the others get a pillar in their own colour
  if(VFX.energy_pillar&&warmH)vfx('energy_pillar',[p[0],p[1]-.9,p[2]-.3],3.4,{bottom:1,fps:16,delay:T-.6,ar:.8});else{col(T-.55,1.0,[p[0],0,p[2]-.3],cg,1.0,7,{base:p[1]-.9,wk:1,a:.7});col(T-.55,1.0,[p[0],0,p[2]-.29],wh,.3,7,{base:p[1]-.9,wk:1,a:.9});}
  at(T,()=>{const q=hpos();ring(0,[q[0],q[1],q[2]+.4],'#FFFFFF',5,.6);E.shake=Math.max(E.shake,.6);});}
function ult3Name(hid){return ULT3N[hid]||ULT3N.h1;}
function ultimate(sentence,hid){ // 大絕招 (per hero): the sentence's words are the ammo
  if(!E.mon)return;heroPlay('attack',1.2);if(SIGF[hid])return SIGF[hid](sentence,ULT[hid]);const th=ULT[hid]||ULT.h1,m=E.mon,star=ustar(hid,th),gl=utex(hid,th),slash=uslash(hid,th),FM=th.fall;
  const gb=(p,nn,sp,life,size)=>goldBurst(p,nn,sp,life,size,gl),rm=s=>{const j=E.sprites.indexOf(s);if(j>=0)E.sprites.splice(j,1);};
  const words=String(sentence||'').replace(/[“”"]/g,'').split(/\s+/).filter(Boolean).slice(0,9),n=words.length||1;if(!words.length)words.push('!');
  const T=words.map((w,k)=>sentTex(w,th.hues[k%th.hues.length],th.gl,th.lo)),sps=T.map(t=>({tex:t.tex,pos:mpos(),w:0,h:0,rot:0,a:0}));
  const ban={tex:null,asp:1},bsp={tex:null,pos:mpos(),w:0,h:0,rot:0,a:0};
  const orbs=(th.orb||[]).map(e=>({tex:emojiTex(e),pos:mpos(),w:0,h:0,rot:0,a:0})),pil={tex:gl,pos:mpos(),w:0,h:0,rot:0,a:0};
  swing(.8);const s0=hpos(),from=[s0[0]+.9,s0[1]+.6,s0[2]+.9];
  at(.05,()=>{flare(from,3,.5,gl);gb(from,22,3.5,.5,.32);});
  at(.1,()=>{if(th.pillar)E.sprites.push(pil);sps.forEach(s=>E.sprites.push(s));orbs.forEach(s=>E.sprites.push(s));});
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
function gtex(c){const k='gt'+c.join('-');if(E.tex[k])return E.tex[k];const cc=cv(128,128),x=cc.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba('+c.join(',')+',.85)');g.addColorStop(1,'rgba('+c.join(',')+',0)');x.fillStyle=g;x.fillRect(0,0,128,128);const t=mkTex(cc);t.rgb=c;return E.tex[k]=t;}
const HURT={fire:{e:'🔥',st:'ball',c:[255,130,40]},ice:{e:'❄️',st:'volley',n:3,c:[140,220,255]},elec:{e:'⚡',st:'bolt',c:[255,235,90]},
poison:{e:'☠️',st:'lob',c:[150,255,110]},forest:{e:'🍃',st:'swirl',n:6,c:[120,230,110]},sea:{e:'🌊',st:'sweep',c:[90,180,255]},
desert:{e:'🪨',st:'volley',n:3,arc:1.8,c:[240,190,110]},sky:{e:'🌪️',st:'dash',c:[210,230,255]},ghost:{e:'👻',st:'drift',c:[190,160,255]},
mech:{e:'🚀',st:'volley',n:3,fast:1,c:[255,170,60]},skel:{e:'🦴',st:'ball',spin:16,c:[235,225,210]},dragon:{e:'🔥',st:'breath',c:[255,90,40]}};
function hurt(emoji,type,mode){
  if(!E.mon)return;if(mode===2){const r2=hurt2(type);if(r2)return r2;}const h=E.hero,m=E.mon,H=HURT[type]||{e:emoji||'💥',st:'ball',c:[255,120,60]},st=H.st,c=H.c,tex=emojiTex(H.e),gl=gtex(c),star=starTex();
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
  at(.3,()=>{try{SFX.matk(type)}catch(e){}});   // launch sound, per element
  const hit=(dt,small)=>{HT=Math.max(HT,dt+.12);at(dt,()=>{try{SFX.impact(small)}catch(e){}const t=hpos(),vk=MV[type]||'hit_spark';if(small)vfx('hit_spark',[t[0]+.2,t[1],t[2]+.7],.7);else if(vk==='lightning')vfx(vk,[t[0]+.2,0,t[2]+.7],1.5,{bottom:1});else{vfx(vk,[t[0]+.2,t[1],t[2]+.7],1.25);vfx('hit_spark',[t[0]+.3,t[1],t[2]+.75],.8);}burst(t,small?6:14,star,small?3:4.5,.4);goldBurst(t,small?10:24,4,.5,.36,gl);E.shake=Math.max(E.shake,small?.3:.7);E.flash.hero=[c[0]/255,c[1]/255,c[2]/255,small?.45:.8];
    if(!small)heroPlay('hit',.7);
    if(!small)tween(.6,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);h.off.x=-.9*e;h.off.rz=.35*e;h.off.sq=1-.2*Math.sin(PI*cl(u*1.5));});});};
  const line=(arc,wob)=>u=>{const e=ease(u);return[lerp(F[0],T[0],e),lerp(F[1],T[1],e)+arc*Math.sin(PI*u)+(wob?wob*Math.sin(u*PI*4):0),lerp(F[2],T[2],e)];};
  // ---- particle attacks: every element is a moving effect (core glow + trail + impact), not one picture sliding over ----
  const Rn=Math.random,rnd=s=>(Rn()-.5)*2*s,G=gtex,smoke=G([85,75,85]);
  const pt=(p,o)=>E.parts.push({x:p[0],y:p[1],z:p[2],vx:o.v?o.v[0]:0,vy:o.v?o.v[1]:0,vz:o.v?o.v[2]:0,g:o.g||0,life:o.life||.4,max:o.life||.4,size:o.size||.3,tex:o.tex||gl,rot:o.rot!=null?o.rot:Rn()*6,vr:o.vr||0,gs:o.gs||0,dr:o.dr||0,al:o.al||1});
  const spray=(p,n,o)=>{for(let i=0;i<n;i++){const a=Rn()*2*PI,s=(o.spd||2)*(.4+Rn()*.8);
    pt([p[0]+rnd(o.jit||.12),p[1]+rnd(o.jit||.12),p[2]+rnd(.1)],Object.assign({},o,{v:[Math.cos(a)*s+(o.bx||0),Math.abs(Math.sin(a))*s*(o.upk==null?1:o.upk)+(o.by||0),rnd(s*.3)],size:(o.size||.3)*(.6+Rn()*.8),life:(o.life||.5)*(.6+Rn()*.7)}));}};
  // projectile: optional glowing core + emoji sprite on path(u); o.trail(p,d,u) runs every frame (d = movement since last frame)
  const proj=(delay,dur,path,o)=>{const core=o.core?{tex:o.core,pos:F.slice(),w:0,h:0,rot:0,a:0}:null,sp=o.tex===null?null:{tex:o.tex||tex,pos:F.slice(),w:0,h:0,rot:0,a:0};let last=path(0);
    at(delay,()=>{if(core)E.sprites.push(core);if(sp)E.sprites.push(sp);});
    tween(dur,u=>{const p=path(u),d=[p[0]-last[0],p[1]-last[1]];last=p;const t=E.time,k=(o.sz||1.1)*(o.grow?.75+.45*u:1)*(1+(o.pulse||0)*Math.sin(t*28));
      if(core){core.pos=[p[0],p[1],p[2]-.02];core.w=core.h=k*(o.coreK||1.5)*(1+.12*Math.sin(t*40));core.a=o.coreA||.9;}
      if(sp){sp.pos=p;sp.w=k*(o.wr||1);sp.h=k*(o.hr||1);sp.rot=o.aim&&(d[0]||d[1])?Math.atan2(d[1],d[0])+(o.aim0||0):o.spin?u*o.spin:(o.wob||0)*Math.sin(t*14);sp.a=o.fade?Math.min(1,Math.sin(PI*u)*2.2):1;}
      if(o.trail)o.trail(p,d,u);},delay);
    at(delay+dur+.01,()=>{if(core)rm(core);if(sp)rm(sp);});};
  const boom=(p,cc,n,big)=>{flare(p,big?2.8:1.6,big?.38:.26,G(cc));spray(p,n,{tex:G(cc),spd:big?3.6:2.6,g:3,life:.5,size:big?.34:.24,dr:1.5});};
  const S0=.35;   // projectiles leave after the monster's wind-up
  if(type==='fire'){   // fireball: flickering core, embers rising off it, smoke behind, explosion
    proj(S0,.5,line(.6),{core:G([255,150,40]),coreK:1.7,sz:1.0,grow:1,pulse:.07,wob:.3,trail:(p,d)=>{for(let i=0;i<3;i++)pt([p[0]+rnd(.18),p[1]+rnd(.18),p[2]-.05],{tex:G(i?[255,205,70]:[255,95,30]),v:[-d[0]*10+rnd(.5),.7+Rn()*.9,0],life:.32+Rn()*.2,size:.42+Rn()*.25,gs:-.9});
      if(Rn()<.5)pt(p,{tex:smoke,v:[rnd(.3),.9,0],life:.7,size:.3,gs:1,al:.45});}});
    at(.85,()=>{boom(T,[255,150,40],20,1);spray(T,6,{tex:smoke,spd:.8,life:.9,size:.45,gs:1.2,al:.5,upk:1.6});});hit(.85);}
  else if(type==='ice'){   // three spinning shards with frost mist, each shatters
    for(let k=0;k<3;k++){const a=.9*((k-1)*.9+.5),d0=.42,s=.32+k*.12;
      proj(s,d0,line(a),{core:G([175,230,255]),coreK:1.15,sz:.8,spin:14,trail:p=>{pt(p,{tex:G([225,245,255]),v:[rnd(.3),rnd(.3),0],life:.45,size:.22+Rn()*.15,gs:-.25,al:.8});if(Rn()<.35)pt(p,{tex:star,v:[rnd(.5),rnd(.5),0],life:.3,size:.16});}});
      at(s+d0,()=>{flare(T,1.4,.24,G([190,235,255]));spray(T,10,{tex:G([205,240,255]),spd:2.8,g:7,life:.5,size:.17});});hit(s+d0,k<2);}}
  else if(type==='elec'){   // two real lightning bolts: zig-zag glow segments that re-crackle, sparks on the ground
    const strike=(k)=>{const t=hpos(),x=t[0]+.1+k*.45,z=t[2]+.6;let segs=[];
      const zap=()=>{segs.forEach(rm);segs=[];let px=x+rnd(.7),py=t[1]+5.2;for(let i=1;i<=9;i++){const nx=i<9?x+rnd(.42):x,ny=t[1]+5.2-(5.5*i/9),dx=nx-px,dy=ny-py,len=Math.hypot(dx,dy),rot=Math.atan2(-dx,dy);
        [[G([255,235,110]),.42],[G([255,255,255]),.16]].forEach(([tx,w])=>{const s={tex:tx,pos:[(px+nx)/2,(py+ny)/2,z],w,h:len*.62,rot,a:1};E.sprites.push(s);segs.push(s);});px=nx;py=ny;}};
      zap();[.06,.12,.18].forEach(dt=>at(dt,zap));at(.26,()=>{segs.forEach(rm);segs=[];});
      E.flash.hero=[1,1,.7,.95];E.shake=.6;spray([x,t[1]-.3,z],16,{tex:G([255,240,120]),spd:4,g:6,life:.35,size:.14});flare([x,t[1]+.2,z],1.6,.2,G([255,250,180]));};
    [0,1].forEach(k=>{at(.4+k*.18,()=>strike(k));hit(.4+k*.18,k===0);});}
  else if(type==='poison'){   // bubbling skull blob on a high arc, dripping; splash + a cloud that lingers
    proj(S0,.65,line(2.6),{core:G([150,255,110]),coreK:1.35,sz:1.15,wob:.3,pulse:.08,trail:p=>{if(Rn()<.7)pt(p,{tex:G([140,240,90]),v:[rnd(.3),-1-Rn(),0],g:2.5,life:.5,size:.16+Rn()*.1});if(Rn()<.45)pt(p,{tex:G([185,120,255]),v:[rnd(.2),.3,0],life:.55,size:.2,gs:.6,al:.6});}});
    [-1,1].forEach(j=>proj(S0+.07,.6,u=>{const q=line(2.1)(u);q[2]+=j*.35;q[1]+=.15*Math.sin(u*PI*6);return q;},{tex:null,core:G([150,255,110]),coreK:.6,sz:.6}));
    at(1.0,()=>{boom(T,[140,240,90],18,1);for(let i=0;i<9;i++)pt([T[0]+rnd(.7),T[1]-.4+rnd(.4),T[2]],{tex:G([120,220,80]),v:[rnd(.3),.25,0],life:1.3,size:.5,gs:.55,al:.35});});hit(1.0);}
  else if(type==='forest'){   // a gust of leaves that flutter (sway + spin) in a stream
    for(let k=0;k<6;k++){proj(.3+k*.07,.55,u=>{const q=line(0,.5)(u);q[1]+=.28*Math.sin(u*PI*3+k);q[2]+=.4*Math.sin(u*PI*2+k);return q;},{sz:.78,spin:7+k,trail:p=>{if(Rn()<.5)pt(p,{tex:G([150,235,110]),v:[rnd(.4),rnd(.3),0],life:.4,size:.15});}});
      hit(.85+k*.07,k<5);}
    at(1.2,()=>spray(T,12,{tex:G([140,230,100]),spd:2.2,g:2,life:.6,size:.2}));}
  else if(type==='sea'){   // a real wave: water thrown up along a moving front that rises, curls and crashes onto the hero
    const wd=.62,X0=F[0],X1=T[0]+.2,base=.35,hgt=u=>.35+1.7*Math.sin(PI*Math.min(1,u*1.08)),sp=(X1-X0)/wd;
    tween(wd,u=>{const x=lerp(X0,X1,ease(u)),hh=hgt(u);
      for(let i=0;i<7;i++){const y=base+Rn()*hh;pt([x+rnd(.28),y,F[2]+rnd(.35)],{tex:Rn()<.72?G([60,150,255]):G([200,235,255]),v:[sp*.35+rnd(.6),1+Rn()*1.7,0],g:6.5,life:.45+Rn()*.25,size:.28+Rn()*.3,gs:-.15});}
      pt([x+rnd(.15),base+hh,F[2]],{tex:G([235,250,255]),v:[sp*.55,.6,0],g:3,life:.35,size:.42});
      if(Rn()<.5)pt([x-rnd(.5),base,F[2]+rnd(.3)],{tex:G([120,190,255]),v:[sp*.1,.2,0],life:.6,size:.5,gs:.4,al:.5});},S0);
    proj(S0,wd,u=>[lerp(X0,X1,ease(u)),base+hgt(u)*.85+.2,F[2]+.3],{core:G([90,180,255]),coreK:1.4,coreA:.7,sz:1.25,grow:1,wob:.18});
    at(S0+wd,()=>{boom(T,[90,180,255],10,1);spray(T,28,{tex:G([70,165,255]),spd:3.6,g:8,life:.6,size:.3,upk:1.5});spray(T,10,{tex:G([230,245,255]),spd:2.5,g:6,life:.5,size:.22,upk:1.6});});hit(S0+wd);}
  else if(type==='desert'){   // three tumbling rocks with dust trails; dust cloud and pebbles on impact
    for(let k=0;k<3;k++){const a=1.8*((k-1)*.9+.5),d0=.42,s=.32+k*.12;
      proj(s,d0,line(a),{sz:1.0,spin:9,trail:p=>{pt(p,{tex:G([205,175,125]),v:[rnd(.2),.2,0],life:.55,size:.28,gs:.8,al:.5});}});
      at(s+d0,()=>{spray(T,7,{tex:G([200,170,120]),spd:1,life:.8,size:.45,gs:1,al:.5,upk:1.4});spray(T,6,{tex,spd:2.4,g:9,life:.5,size:.14});});hit(s+d0,k<2);}}
  else if(type==='sky'){   // a spinning tornado with wind streaks orbiting it
    proj(S0,.45,line(0,.15),{sz:1.4,wr:1.15,wob:.35,trail:p=>{for(let i=0;i<4;i++){const a=E.time*18+i*PI/2;pt([p[0]+Math.cos(a)*.35,p[1]-.5+i*.3,p[2]+Math.sin(a)*.6],{tex:G([225,240,255]),v:[-Math.sin(a)*2.2,.7,Math.cos(a)*1.5],life:.3,size:.18,al:.8});}}});
    at(.8,()=>{boom(T,[210,230,255],14,1);});hit(.8);}
  else if(type==='ghost'){   // a ghost that wobbles over, fading in and out, leaving purple wisps
    proj(.4,.65,u=>{const q=line(.25,.5)(u);q[2]+=.3*Math.sin(u*PI*2);return q;},{sz:1.55,fade:1,wob:.25,core:G([190,160,255]),coreK:1.2,coreA:.5,trail:p=>{pt([p[0]+rnd(.3),p[1]+rnd(.3),p[2]-.1],{tex:G([190,160,255]),v:[rnd(.2),.4,0],life:.7,size:.3,gs:.7,al:.45});}});
    at(1.05,()=>{E.flash.hero=[.7,.6,1,.9];boom(T,[190,160,255],16,1);});hit(1.05);}
  else if(type==='mech'){   // three missiles that point where they fly, flame + smoke exhaust, each explodes
    for(let k=0;k<3;k++){const a=.9*((k-1)*.9+.5),d0=.32,s=.32+k*.12;
      proj(s,d0,line(a),{sz:.85,aim:1,aim0:-PI/4,trail:(p,d)=>{const b=[p[0]-d[0]*1.5,p[1]-d[1]*1.5,p[2]];pt(b,{tex:G([255,190,80]),v:[rnd(.2),rnd(.2),0],life:.16,size:.3,gs:-1.2});pt(b,{tex:smoke,v:[rnd(.2),.35,0],life:.6,size:.22,gs:.9,al:.45});}});
      at(s+d0,()=>{boom(T,[255,170,60],10,k===2);spray(T,4,{tex:smoke,spd:.6,life:.8,size:.4,gs:1,al:.5,upk:1.5});});hit(s+d0,k<2);}}
  else if(type==='skel'){   // bones thrown in a spinning arc, a puff of bone dust on impact
    [0,1].forEach(k=>{const s=S0+k*.14,d0=.48;proj(s,d0,line(.9+k*.5),{sz:1.0,spin:18,trail:p=>{if(Rn()<.4)pt(p,{tex:G([235,225,205]),v:[rnd(.2),rnd(.2),0],life:.3,size:.14});}});
      at(s+d0,()=>{spray(T,8,{tex:G([240,230,210]),spd:2.5,g:7,life:.45,size:.16});flare(T,1.3,.22,G([240,230,210]));});hit(s+d0,k===0);});}
  else if(type==='dragon'){   // dragon: fire gathers into a glowing orb at its mouth, then a roaring beam of flame hits the hero
    const M=[F[0]+.15,F[1]+.35,F[2]],orb={tex:G([255,170,60]),pos:M,w:0,h:0,rot:0,a:1},hal={tex:G([255,230,150]),pos:M,w:0,h:0,rot:0,a:.7};
    at(.05,()=>{E.sprites.push(hal);E.sprites.push(orb);});
    tween(.42,u=>{orb.w=orb.h=.25+.95*u+.07*Math.sin(E.time*55);hal.w=hal.h=orb.w*1.9;
      for(let i=0;i<3;i++){const a=Rn()*2*PI,r=1.4+Rn()*.9,p=[M[0]+Math.cos(a)*r,M[1]+Math.sin(a)*r*.8,M[2]];pt(p,{tex:G(Rn()<.5?[255,225,130]:[255,120,40]),v:[(M[0]-p[0])/.28,(M[1]-p[1])/.28,0],life:.28,size:.16,gs:-.3});}},.05);
    const beam=[];at(.47,()=>{rm(orb);rm(hal);flare(M,2.2,.3,G([255,200,90]));E.shake=Math.max(E.shake,.35);});
    tween(.5,u=>{beam.forEach(rm);beam.length=0;const dx=T[0]-M[0],dy=T[1]-M[1],len=Math.hypot(dx,dy),rot=Math.atan2(-dx,dy),k=(u<.15?u/.15:u>.78?(1-u)/.22:1)*(1+.12*Math.sin(E.time*70));
      [[G([255,110,40]),.85,.75],[G([255,200,100]),.48,.95],[G([255,255,230]),.2,1]].forEach(q=>{const s={tex:q[0],pos:[(M[0]+T[0])/2,(M[1]+T[1])/2,M[2]],w:q[1]*k,h:len*.56,rot,a:q[2]};E.sprites.push(s);beam.push(s);});
      for(let i=0;i<6;i++){const f=Rn();pt([M[0]+dx*f,M[1]+dy*f+rnd(.25),M[2]],{tex:G(Rn()<.5?[255,205,90]:[255,95,40]),v:[rnd(.7),.7+Rn()*1.1,0],life:.38,size:.22+Rn()*.15,gs:-.35});}
      if(Rn()<.6)pt([M[0]+dx*Rn(),M[1]+dy*Rn(),M[2]],{tex:smoke,v:[rnd(.3),.9,0],life:.7,size:.25,gs:.8,al:.4});},.47);
    at(.98,()=>{beam.forEach(rm);beam.length=0;});
    at(.6,()=>{boom(T,[255,150,60],12,0);});
    at(.92,()=>{boom(T,[255,120,40],24,1);spray(T,6,{tex:smoke,spd:.8,life:.9,size:.45,gs:1.2,al:.5,upk:1.6});});hit(.6,true);hit(.92);}
  else if(st==='ball'){fly(.35,.5,line(.7),{spin:H.spin||8,sz:1.35,grow:1});hit(.85);}
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
function forceBg(k){E.forceBg=k||null;}   // test tool: show this background whatever the monster
return{ensure,setup,vfxTest,forceBg,attack,letter,finale,ultimate,ultimate2,ultimate3,ult2Name,ult3Name,monUlt,monUltName,ultName,hurt,die,mount,E,monModel,heroModel,burst,idle};
})();
/* ---------- battle ---------- */
let B=null;
// Revenge words: missed words from lessons the player has fought. store.missed is shared with practice mode's
// 錯題本 (quiz mistakes, flashcard "不熟"), so words from lessons not played yet stay out of revenge until played.
const REV_MAX=10;
// the revenge monster grows with the number of missed words waiting: 1-3 / 4-6 / 7-9 / 10+
function revMon(n){if(typeof VMON==='undefined'||!VMON.length)return null;return VMON[Math.min(VMON.length-1,n>=10?3:n>=7?2:n>=4?1:0)].id;}
function revengeWords(){const g=G();const played=new Set();SETS.forEach(s=>{if(g.def[s.id]||g.stars[s.id])s.words.forEach(o=>{if(o)played.add(o.w);});});
  return store.missed.filter(w=>played.has(w)&&WORDS.get(w));}
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
    pool=revengeWords().map(w=>WORDS.get(w));if(!pool.length)return;
    hp=Math.min(REV_MAX,pool.length);mon=revMon(pool.length)||shuffle(MON_IDS)[0];name=monName(mon);k='k7';
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
    const crit=false,ult=(B.mana||0)>=mmax(B);B.ult=ult;B.ultKind=ult?(g.inv.finisher>0?'fin':Math.random()<.5?'1':'2'):'';if(B.ultKind==='fin')g.inv.finisher--;const dmg=ult?(B.ultKind==='fin'?4:3):1;
    if(!ult)B.mana=Math.min(mmax(B),(B.mana||0)+1);B.skill=B.mana>=mmax(B);
    B.ultExtra='';if(ult){const hid=g.heroId;if(hid==='h6'&&B.php<B.pm){B.php++;B.ultExtra='heal';}else if(hid==='h5'){B.frozen=true;B.ultExtra='freeze';}}
    B.right++;B.crit=crit;const keep=(B.kind==='set'&&B.asked.size<B.pool.length)?1:0;B.dmg=Math.max(0,Math.min(dmg,B.hp-keep));B.hp=Math.max(keep,B.hp-dmg);B.anim=crit?'crit':'hit';
    g.mast[w]=Math.min(3,(g.mast[w]||0)+1);if(B.kind==='revenge'||!(B.wrongSet&&B.wrongSet.has(w)))dropMissed(w);addXp(5);   // a word missed in this fight comes back as a revenge monster even if it is answered right later in the same fight
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
    if(E3.ok)SFX.wrong();else SFX.hurt();   // 3D: attack + impact sounds are played by ENG.hurt in time with the animation
  }
  const tk=B;
  if(ok){
    B.anim='spell';saveStore();render();
    spellAttack(w,q.t.ex,tk,()=>{B.anim='hit';render();syncBars(tk,E3.ok?300:380);setTimeout(()=>{if(B!==tk||S.view!=='battle')return;const wasUlt=tk.ult;if(tk.ult){tk.mana=0;tk.skill=false;tk.ult=false;syncBars(tk,0);}B.anim='';B.sheet=true;B.busy=false;if(!wasUlt)readSentence(tk,q.t.ex);else tk.reading=false;render();},E3.ok?1100:700);});
    return;
  }
  saveStore();render();
  // special moves, one tier up from the monster: normal (lessons, revenge) -> elite moves, elite -> boss moves, boss and legend -> legend moves.
  // every 3rd miss; a boss at 1/3 HP or less (last stand) and a legend every 2nd miss. Damage is still 1 heart.
  const mt=(MBY[B.mon]||{}).t,K=B.kind,every=K==='boss'?(B.hp<=B.maxhp/3?2:3):K==='legend'?2:3,spc=B.wrongN%every===0,tier=(K==='boss'||K==='legend')?'L':K==='elite'?'b':'e';B.special=spc;B.spTier=spc?tier:'';
  let hT=.25;if(E3.ok&&!B.iced){try{hT=(spc?ENG.monUlt(mt,tier):ENG.hurt(projOf(B.mon),mt,Math.random()<.5?2:1))||.9;}catch(e){}}
  syncBars(tk,Math.round(hT*1000));
  setTimeout(()=>{if(B!==tk||S.view!=='battle')return;B.anim='';B.sheet=true;B.busy=false;B.lockUntil=Date.now()+LOCK_MS;readSentence(tk,q.t.ex);render();
    setTimeout(()=>{if(B!==tk||S.view!=='battle')return;const nx=document.getElementById('nextB');if(nx&&nx.disabled&&!B.reading){nx.disabled=false;}},LOCK_MS+30);},E3.ok?Math.max(1500,Math.round(hT*1000)+600):1000);
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
    let wait=E3.ok?1250:650;if(E3.ok){try{if(tk.ult){const hid=G().heroId;wait=Math.round((tk.ultKind==='fin'?ENG.ultimate3(ex,hid):tk.ultKind==='2'?ENG.ultimate2(ex,hid):ENG.ultimate(ex,hid))*1000);}else ENG.finale(word,false);}catch(e){}}SFX.crit&&SFX.crit();
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
    const log=b.anim==='spell'||b.anim==='hit'||b.anim==='crit'?(b.ult?(()=>{let n='大絕招';try{const hid=G().heroId;n=b.ultKind==='fin'?'終極絕招・'+ENG.ult3Name(hid):b.ultKind==='2'?ENG.ult2Name(hid):ENG.ultName(hid);}catch(e){}return n+'！整句魔法化成彈藥，全力轟出！怪物 -'+(b.ultKind==='fin'?4:3)+' HP'+(b.ultExtra==='heal'?'，還回復 1 顆愛心 💖':b.ultExtra==='freeze'?'，怪物被冰凍，下次答錯不扣愛心 ❄️':'');})():'金色箭矢命中！怪物 -1 HP'):b.anim==='atk'?(b.iced?'怪物被冰凍住了，沒能反擊！愛心沒有減少 ❄️':b.healed?'怪物反擊！牠還回復了 1 HP':'怪物反擊！英雄受到傷害'):b.sheet?'':mana>=5?'魔力全滿！下一題答對，就放大絕招！':'選出正確的單字，用金色箭矢攻擊！';
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
  ${use3?'<div class="c3d"></div>':`<div class="mon-wrap"><div class="mon${(MBY[b.mon]||{}).f===0?' nf':''}">${monSvg(b.mon)}</div></div>
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
  const rtypes=[['stats','成長升級','多拿經驗，快點升級'],['cards','怪物卡片','收集 '+RMON.length+' 隻怪物'],['coins','金幣','買學習道具']];
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
  const rvn=revengeWords().length;
  const rev=rvn?`<button class="mcard revcard" data-act="revenge"><span class="mart">${(()=>{const id=revMon(rvn),s=id&&monSprite(id);return s?'<img class="msp" alt="" src="'+s.u+'">':'👻';})()}</span><span class="mname">${revMon(rvn)?monName(revMon(rvn)):'復仇怪'}</span><span class="mles">答錯的單字變成怪物回來了</span><span class="mnum">${rvn} 個字等你復仇${rvn>REV_MAX?`（每次 ${REV_MAX} 個）`:''}</span></button>`:'';
  return `<div class="ghead"><div class="gtitle"><span class="glogo">⚔️</span><div><b>單字打怪王</b><span>答對攻擊、答錯被反擊</span></div></div>
    <div class="gnav"><button class="link" data-act="snd" aria-label="音效">${g.snd?'🔊 音效':'🔇 靜音'}</button><button class="link" data-act="practice">練習模式</button><button class="link" data-act="test" aria-label="測試工具">🧪 測試</button></div></div>
  <section class="card gplayer"><div class="prow"><div class="heroav"><div class="heroimg">${heroImg()}</div><div class="lvbadge sm">Lv.${lv}</div></div>
    <div class="pinfo"><div class="xprow"><b>經驗值</b><span>${g.xp-a}/${b-a}</span></div><div class="gtrack"><i style="width:${pct}%"></i></div>
    <div class="pstats"><span>${HEART.replace('%c','')} ${pmax()}</span><span>📚 學會 ${learnedTotal()}/${ALL.length} 字</span><span>🪙 ${g.coins}</span>${g.inv.potion?`<span>🧪 ${g.inv.potion}</span>`:''}${g.inv.crystal?`<span>🔮 ${g.inv.crystal}</span>`:''}<span>🔥 連續 ${sn} 天</span></div></div></div>
    <div class="daily"><div class="xprow"><b>🎯 今日目標：答對 ${GOAL} 題</b><span>${Math.min(g.today,GOAL)}/${GOAL}${g.today>=GOAL?' ✓':''}</span></div><div class="gtrack d"><i style="width:${gp}%"></i></div></div>
    <div class="rsel"><div class="xprow"><b>🎁 額外寶箱獎勵</b></div><div class="seg s3">${rtypes.map(r=>`<button data-act="setReward" data-r="${r[0]}" aria-pressed="${g.reward===r[0]}">${r[1]}<small>${r[2]}</small></button>`).join('')}</div></div>
    <div class="btnrow"><button class="btn" data-act="coll">📖 怪物圖鑑</button><button class="btn" data-act="heroes">🦸 更換主角</button><button class="btn" data-act="shop">🛒 道具商店</button></div></section>
  <section class="mapsec"><div class="sec-h"><h2>選一隻怪物開打</h2></div>${rev?`<div class="mgrid">${rev}</div>`:''}<p class="soft">每週：打完全部課文（2★以上）→ 挑戰精英怪；每兩週：兩位精英都通過 → 挑戰魔王。</p>${cards}</section>${S.tpw?`<div class="tpwbg"><form class="card tpw" onsubmit="return false"><h3>🧪 測試工具</h3><p class="soft">請輸入密碼</p>
    <input id="tpwin" type="password" inputmode="numeric" autocomplete="off" aria-label="密碼">${S.tpw==='bad'?'<p class="tpwbad">密碼不對，再試一次</p>':''}
    <div class="btnrow"><button type="button" class="btn" data-act="testno">取消</button><button type="submit" class="btn primary" data-act="testgo">進入</button></div></form></div>`:''}`;
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
  // legends (傳奇): shown as dark silhouettes; how to earn them is not decided yet (g.lcards will hold the ones owned)
  const LG=typeof LMON!=='undefined'?LMON:[],lown=m=>!!(g.lcards||{})[m.id];
  const ltile=m=>{const T=TYPES.find(t=>t[0]===m.t)||TYPES[0],o=lown(m);return `<div class="rt legend${o?'':' locked'}" style="--c1:${T[3]};--c2:${T[4]}"><span class="rtt">${T[2]} ${T[1]}</span><div class="rtart"><img alt="" src="${LSPR[m.id].u}"${o?'':' class="sil"'}></div><div class="rtn">${o?m.zh:'？？？'}</div><div class="rtb L">傳奇</div></div>`;};
  const lsec=LG.length?`<h3 class="chd">👑 傳奇 <small>${LG.filter(lown).length}/${LG.length}</small></h3><p class="soft lnote">比魔王更難遇到的傳說怪物，取得方式即將公開！</p><div class="rgrid2">${LG.map(ltile).join('')}</div>`:'';
  const ltab=LG.length?`<button class="ctab" data-act="cdx" data-t="tL" aria-pressed="${tab==='tL'}">👑 傳奇<small> ${LG.filter(lown).length}/${LG.length}</small></button>`:'';
  let html=tab==='all'||tab==='tL'?lsec:'';
  const tt=TIERT.find(t=>t[0]===tab);
  if(tt){const list=RMON.filter(tt[2]);html+=`<h3 class="chd">${tt[1]} <small>${list.filter(own).length}/${list.length}</small></h3><div class="rgrid2">${list.map(m=>rtile(m.id,own(m),g.rcards[m.id]||0)).join('')}</div>`;}
  else if(tab!=='tL')TYPES.filter(t=>tab==='all'||tab===t[0]).forEach(t=>{
    const list=RMON.filter(m=>m.t===t[0]);
    html+=`<h3 class="chd">${t[2]} ${t[1]} <small>${list.filter(own).length}/${list.length}</small></h3><div class="rgrid2">${list.map(m=>rtile(m.id,own(m),g.rcards[m.id]||0)).join('')}</div>`;
  });
  return `<div class="cview2 codex"><div class="btop"><button class="x" data-act="goGame" aria-label="返回"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><h2 class="vt">怪物圖鑑</h2><span class="lvpill">${have}/${total}</span></div>
  <p class="soft">打贏怪物並拿到 2 顆星以上，就會收服牠；沒打到的怪物，可以從寶箱抽到。精英怪和魔王要先通過前面的課文。</p>
  <div class="ctabs" role="tablist">${tabs}${ltab}</div>${html}</div>`;
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
/* ---------- 測試工具 test lab: every hero action, every monster attack/sound, every monster sprite.
   Uses the real battle stage; never touches progress (no XP, coins, stars, hero choice). ---------- */
const TL={hid:null,mon:null,bg:null,auto:null,timers:[]};
const TL_WORD='magic',TL_SENT='The brave hero saves the happy little town.';
function tlTimer(ms,f){TL.timers.push(setTimeout(()=>{if(S.view==='test')f();},ms));}
function tlStop(){TL.timers.forEach(clearTimeout);TL.timers=[];if(TL.auto){clearInterval(TL.auto);TL.auto=null;}try{ENG.forceBg(null);}catch(e){}}   // never leak the forced background into real battles
function tlSetup(){if(!TL.hid)TL.hid=G().heroId;if(!TL.mon)TL.mon=RMON[0].id;if(ENG.ensure()){try{ENG.forceBg(TL.bg);ENG.setup(TL.mon,heroEq(),TL.hid,false);}catch(e){}}}
function tlType(){return (TLM().find(m=>m.id===TL.mon)||{}).t||'fire';}
const TLM=()=>RMON.concat(typeof LMON!=='undefined'?LMON:[],typeof VMON!=='undefined'?VMON:[]);   // test lab lists the legends and the revenge monster too
function tlName(){const h=HEROES.find(x=>x.id===TL.hid)||HEROES[0],m=TLM().find(x=>x.id===TL.mon)||RMON[0];return h.zh+' ('+h.id+') vs '+m.zh+' ('+m.id+' · '+((TYPES.find(t=>t[0]===m.t)||[])[1]||m.t)+')'+(typeof BGS!=='undefined'?' · 場景：'+((BGS[TL.bg||BGT[m.t]||BGT['default']]||{}).zh||''):'');}
// the test lab is for parents/teachers: a password keeps kids out (asked once per visit). Change it here.
const TEST_PW='0828';
function tpwTry(v){if(String(v||'').trim()===TEST_PW){S.tpw=false;S.tpOK=true;S.view='test';tlStop();tlSetup();render();window.scrollTo&&window.scrollTo(0,0);}else{S.tpw='bad';render();}}
function viewTest(){
  if(!TL.hid||!TL.mon)tlSetup();
  const b=(k,label,extra)=>`<button class="btn tlb" data-act="tl" data-k="${k}" ${extra||''}>${label}</button>`;
  const SND=[['hit','命中（主角）'],['crit','收尾／大絕招'],['wrong','答錯提示'],['impact','怪物打中'],['impact1','怪物打中（小）'],['hurt','答錯（平面版）'],['win','勝利'],['lose','失敗'],['coin','金幣'],['open','寶箱／升級'],['tap','按鈕']];
  return `<div class="tlab"><div class="tltop"><div class="qbar"><button class="x" data-act="goGame" aria-label="回到地圖"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><b class="tlt">🧪 測試工具 <small>不會影響遊戲進度</small></b></div>
  <section class="stage c3 tstage">${E3.ok?'<div class="c3d"></div>':'<p class="soft">這台裝置不支援 3D 畫面（WebGL），無法測試動畫。</p>'}<div class="tlname" id="tlname">${tlName()}</div></section></div>
  <section class="card tsec"><h3>主角動作</h3><div class="tgrid heroes">${HEROES.map(h=>`<button class="tlh${h.id===TL.hid?' on':''}" data-act="tl" data-k="hero" data-id="${h.id}"><img alt="" src="${(HSPR[h.id]||HSPR.h1).u}"><span>${h.zh}</span></button>`).join('')}</div>
    <div class="trow">${b('attack','⚔️ 攻擊')}${b('hit','💥 受傷')}${b('win','🏆 勝利')}${b('ult','🌟 大絕招')}${b('ult2','🌠 第二大絕招')}${b('ult3','🌌 終極絕招')}</div><p class="soft">第二大絕招：${(()=>{try{return ENG.ult2Name(TL.hid);}catch(e){return '';}})()}・終極絕招：${(()=>{try{return ENG.ult3Name(TL.hid);}catch(e){return '';}})()}（戰鬥中第一招和第二招隨機出現；有「終極卷軸」時改放終極絕招）</p><p class="soft">待機動作會一直播放；攻擊會丟出單字字母，最後收尾一擊。</p></section>
  <section class="card tsec"><h3>怪物攻擊（12 種屬性，含音效）</h3><p class="soft">第一種攻擊：</p><div class="trow">${TYPES.map(t=>b('matk',t[2]+' '+t[1],`data-t="${t[0]}"`)).join('')}</div>
    <p class="soft">第二種攻擊（戰鬥中兩種隨機出現）：</p><div class="trow">${TYPES.map(t=>b('matk2',t[2]+' '+t[1],`data-t="${t[0]}"`)).join('')}</div>
    <p class="soft">怪物絕招（每種屬性的菁英、魔王、傳奇各兩招，戰鬥中隨機出招；戰鬥中：普通怪用菁英招、精英怪用魔王招、魔王用傳奇招，每答錯 3 次放一次；魔王血量剩 1/3 以下時改成每答錯 2 次；只扣 1 顆愛心）。直接點：場上會自動換成那個屬性的怪物再放招。</p><div class="mulgrid">${TYPES.filter(T=>RMON.some(m=>m.t===T[0])).map(T=>`<div class="mulrow${T[0]===tlType()?' on':''}"><span class="mulel">${T[2]} ${T[1]}</span>${[['e','⭐'],['b','👑'],['L','🌟']].map(([tr,ic])=>[0,1].map(i=>b('mult',ic+' '+ENG.monUltName(T[0],tr,i),'data-id="'+tr+i+'" data-t="'+T[0]+'"')).join('')).join('')}</div>`).join('')}</div>
    <div class="trow">${b('die','💀 怪物倒下')}</div></section>
  ${typeof BGS!=='undefined'?`<section class="card tsec"><h3>場景（${Object.keys(BGS).length} 張）</h3><p class="soft">選一張場景固定顯示，用來檢查背景動畫、主角和怪物站的位置；選「依怪物屬性」恢復正常。</p>
    <div class="tgrid bgs"><button class="tlg${!TL.bg?' on':''}" data-act="tl" data-k="bg" data-id=""><span class="tlgauto">🔀</span><span>依怪物屬性</span></button>${Object.keys(BGS).map(k=>`<button class="tlg${TL.bg===k?' on':''}" data-act="tl" data-k="bg" data-id="${k}"><img alt="" src="${BGS[k].u}"><span>${BGS[k].zh}</span><small>${(BGS[k].types||[]).map(t=>t==='default'?'其他':((TYPES.find(x=>x[0]===t)||[])[1]||t)).join('、')}</small></button>`).join('')}</div></section>`:''}
  ${typeof VFX!=='undefined'?`<section class="card tsec"><h3>特效動畫（${Object.keys(VFX).length} 種）</h3><div class="trow">${Object.keys(VFX).map(k=>b('vfx',{fire_burst:'🔥 火焰爆炸',flame_loop:'🕯️ 燃燒火焰',ice_burst:'❄️ 冰晶碎裂',lightning:'⚡ 雷擊',leaf_swirl:'🍃 樹葉旋風',holy_burst:'✨ 聖光',dark_burst:'🌑 暗影',hit_spark:'💥 打擊火花',slash_arc:'🌙 斬擊',water_splash:'💧 水花',smoke_puff:'💨 煙霧'}[k]||k,`data-id="${k}"`)).join('')}</div><p class="soft">在怪物身上播放一次，檢查特效的動畫和去背。</p></section>`:''}
  <section class="card tsec"><h3>怪物圖（${RMON.length} 隻${TLM().length>RMON.length?' + 傳奇 '+(TLM().length-RMON.length)+' 隻':''}）</h3><div class="trow">${b('prev','◀ 上一隻')}${b('next','下一隻 ▶')}${b('auto',TL.auto?'⏸ 停止輪播':'▶ 自動輪播')}</div>
    <p class="soft">點一隻放到場上。格子底色是棋盤格，方便看出去背沒去乾淨（破圖、色邊、破洞）。</p>
    <div class="tgrid mons">${TLM().map(m=>`<button class="tlm${m.id===TL.mon?' on':''}${m.role==='L'?' leg':''}" data-act="tl" data-k="mon" data-id="${m.id}" title="${m.zh}"><img alt="" src="${monSprite(m.id)?monSprite(m.id).u:LSPR[m.id].u}"><span>${m.role==='L'?'👑':m.role==='v'?'👻':m.id.slice(1)} ${m.zh}</span></button>`).join('')}</div></section>
  <section class="card tsec"><h3>音效</h3><div class="trow">${SND.map(s=>b('snd',s[1],`data-t="${s[0]}"`)).join('')}</div>
    <h4>怪物出招音（只有聲音）</h4><div class="trow">${TYPES.map(t=>b('sndm',t[2]+' '+t[1],`data-t="${t[0]}"`)).join('')}</div>
    <h4>朗讀</h4><div class="trow">${b('say','🔊 單字 '+TL_WORD)}${b('say2','🔊 例句')}</div><p class="soft">聽不到聲音：先確認首頁的「音效」開著，以及裝置沒有靜音。</p></section></div>`;
}
function tlAct(k,ds){
  if(k==='hero'){tlStop();TL.hid=ds.id;tlSetup();render();return;}
  if(k==='mon'){if(TL.auto){clearInterval(TL.auto);TL.auto=null;}TL.mon=ds.id;tlSetup();render();return;}
  if(k==='bg'){TL.bg=ds.id||null;tlSetup();render();return;}
  if(k==='prev'||k==='next'){const L=TLM(),i=L.findIndex(m=>m.id===TL.mon),n=L.length;TL.mon=L[(i+(k==='next'?1:n-1))%n].id;tlSetup();render();return;}
  if(k==='auto'){if(TL.auto){clearInterval(TL.auto);TL.auto=null;render();return;}
    TL.auto=setInterval(()=>{if(S.view!=='test'){tlStop();return;}const L=TLM(),i=L.findIndex(m=>m.id===TL.mon);TL.mon=L[(i+1)%L.length].id;tlSetup();
      const nm=document.getElementById('tlname');if(nm)nm.textContent=tlName();document.querySelectorAll('.tlm').forEach(e=>e.classList.toggle('on',e.dataset.id===TL.mon));},1400);render();return;}
  if(k==='snd'){if(ds.t==='impact1')SFX.impact(true);else if(SFX[ds.t])SFX[ds.t]();return;}
  if(k==='sndm'){SFX.matk(ds.t);return;}
  if(k==='say'||k==='say2'){try{if(HAS_TTS){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(k==='say'?TL_WORD:TL_SENT);u.lang='en-US';u.rate=.85;speechSynthesis.speak(u);}}catch(e){}return;}
  // a new button while the previous action is still playing: cut it short and start fresh (ignoring the tap looked broken)
  if(E3.ok&&!ENG.idle()){tlStop();tlSetup();}
  if(!E3.ok)return;
  try{
    if(k==='attack'){const L=TL_WORD.toUpperCase().split('');L.forEach((ch,i)=>tlTimer(i*380,()=>{SFX.hit();ENG.letter(ch,i);}));tlTimer(L.length*380+200,()=>{ENG.finale(TL_WORD,false);SFX.crit();});}
    else if(k==='hit'){SFX.wrong();ENG.hurt(projOf(TL.mon),tlType());}
    else if(k==='matk'){SFX.wrong();ENG.hurt((TYPES.find(t=>t[0]===ds.t)||[])[2]||'💥',ds.t);}
    else if(k==='ult'){SFX.crit();ENG.ultimate(TL_SENT,TL.hid);}
    else if(k==='vfx'){ENG.vfxTest(ds.id);}
    else if(k==='ult2'){SFX.crit();ENG.ultimate2(TL_SENT,TL.hid);}
    else if(k==='ult3'){SFX.crit();ENG.ultimate3(TL_SENT,TL.hid);}
    else if(k==='matk2'){SFX.wrong();ENG.hurt('',ds.t,2);}
    else if(k==='mult'){const t=ds.t||tlType(),go=()=>{SFX.wrong();ENG.monUlt(t,ds.id[0],ds.id.length>1?+ds.id[1]:undefined);};
      if(t!==tlType()){const m=RMON.find(x=>x.t===t&&x.role==='n')||RMON.find(x=>x.t===t);if(TL.auto){clearInterval(TL.auto);TL.auto=null;}TL.mon=m.id;tlSetup();render();setTimeout(go,700);}else go();}
    else if(k==='win'||k==='die'){ENG.die(tlType());SFX.win();tlTimer(3200,()=>{tlSetup();});}
  }catch(e){}
}
function afterGameRender(){
  if(S.tpw){const i=document.getElementById('tpwin');if(i&&i.focus){i.focus();i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();tpwTry(i.value);}};}}
  if(S.view==='test'){if(E3.ok){const sl=app.querySelector('.c3d');if(sl)ENG.mount(sl);}return;}
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
    case 'goGame':try{speechSynthesis.cancel();}catch(e){}tlStop();B=null;S.view='game';render();top();break;
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
    case 'test':ac();if(S.tpOK){S.view='test';tlStop();tlSetup();render();top();}else{S.tpw=true;render();}break;
    case 'testgo':{const i=document.getElementById('tpwin');tpwTry(b.dataset.pw!=null?b.dataset.pw:i&&i.value);break;}
    case 'testno':S.tpw=false;render();break;
    case 'tl':ac();tlAct(b.dataset.k,b.dataset);break;
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
