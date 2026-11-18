import re
P='/tmp/claude-0/-home-claude/a3c55631-b360-5eee-bc8c-a284734dea09/scratchpad/'
g=open(P+'part_game.js').read()
def rep(old,new,cnt=1):
    global g
    assert g.count(old)>=1,('missing',old[:80])
    if cnt==1: assert g.count(old)==1,('multi',g.count(old),old[:80])
    g=g.replace(old,new)

# --- 1. top defs
i=g.index("const SETMON=");j=g.index("const RAR=")
g=g[:i]+r"""const MBY={};RMON.forEach(m=>{MBY[m.id]=m;});
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
"""+g[j:]
rep("const PROJ=","const PROJ=") if False else None
# PROJ removed with the slice? re-add helper
g=g.replace("const RAR=['普通','稀有','閃亮'];","const RAR=['普通','稀有','閃亮'];\nconst PROJ={};\nfunction projOf(id){const m=MBY[id];const T=m&&TYPES.find(t=>t[0]===m.t);return (T&&T[2])||'💥';}",1)

# --- G defaults
rep("heroId:'h1',rcards:{}};","heroId:'h1',rcards:{},stars:{}};")
# --- TYPES: drop elite/rare/boss categories, tier label by role
g=re.sub(r",\['elite','精英怪'[^\]]*\],\['rare','稀有怪'[^\]]*\],\['boss','關卡魔王'[^\]]*\]\];",r"];",g,1)
rep("const TIERN={elite:'精英',rare:'稀有',boss:'魔王'};","const TIERN={e:'精英',r:'稀有',b:'魔王'};")

# --- startBattle
i=g.index("function startBattle(kind,id){");j=g.index("function nextQ(){")
g=g[:i]+r"""function startBattle(kind,id){
  const g=G();rollDay();
  let pool,mon,hp,name,k;
  if(kind==='set'){
    const s=SETS.find(x=>x.id===id);pool=s.words.slice();hp=Math.min(8,pool.length);mon=SETMON[id];name=monName(mon);k=s.k;
  }else if(kind==='elite'||kind==='boss'){
    const b=BATTLE[id];if(!b)return;
    if(kind==='elite'?!eliteOpen(b):!bossOpen(b))return;
    pool=uniqWords(b.sets);pool=shuffle(pool).sort((a,c)=>(g.mast[a.w]||0)-(g.mast[c.w]||0));
    hp=Math.min(kind==='boss'?14:10,pool.length);mon=b.mon;name=monName(mon);k=b.k;
  }else{
    pool=store.missed.map(w=>WORDS.get(w)).filter(Boolean);if(!pool.length)return;
    hp=Math.min(6,pool.length);mon=shuffle(MON_IDS)[0];name='復仇・'+monName(mon);k='k7';
  }
  const queue=((kind==='boss'||kind==='elite')?pool.slice(0,hp):shuffle(pool).slice(0,hp));
  B={kind,id,mon,name,k,pool,queue,hp,maxhp:hp,shown:hp,php:pmax(),pm:pmax(),mana:0,skill:false,q:null,sheet:false,anim:'',dmg:0,crit:false,right:0,wrongN:0,healed:false,lockUntil:0,qStart:0,wrong:[],lvl0:lvlOf(g.xp),qn:0,busy:false,opened:false,res:null,goalMsg:''};
  nextQ();
  if(ENG.ensure()){try{ENG.setup(mon,heroEq(),G().heroId,kind==='boss');}catch(e){E3.ok=false;}}
  S.view='battle';render();top();
}
"""+g[j:]
# --- nextQ qStart
rep("B.q={type,t,choices:makeChoices(t,type),pick:null,hint:false};","B.q={type,t,choices:makeChoices(t,type),pick:null,hint:false};B.qStart=Date.now();")
# --- answerB: rush guard
rep("  const q=B.q,g=G();q.pick=idx;","  if(!(typeof window!=='undefined'&&window.__noRush)&&Date.now()-B.qStart<RUSH_MS){rushToast();return;}\n  const q=B.q,g=G();q.pick=idx;")
rep("    B.mana=0;B.skill=false;B.anim='atk';B.noteMsg=false;B.revived=false;B.php--;","    B.mana=0;B.skill=false;B.anim='atk';B.noteMsg=false;B.revived=false;B.php--;B.wrongN++;\n    B.healed=false;if((B.kind==='elite'||B.kind==='boss')&&B.hp<B.maxhp){B.hp++;B.healed=true;}")
rep("  if(E3.ok){try{ENG.hurt(PROJ[B.mon]);}catch(e){}}\n  setTimeout(()=>{if(B!==tk||S.view!=='battle')return;B.anim='';B.sheet=true;B.busy=false;render();},E3.ok?1500:1000);",
"  if(E3.ok){try{ENG.hurt(projOf(B.mon));}catch(e){}}\n  setTimeout(()=>{if(B!==tk||S.view!=='battle')return;B.anim='';B.sheet=true;B.busy=false;B.lockUntil=Date.now()+LOCK_MS;render();\n    setTimeout(()=>{if(B!==tk||S.view!=='battle')return;const nx=document.getElementById('nextB');if(nx&&nx.disabled){nx.disabled=false;nx.textContent=B.php<=0?'繼續':'繼續戰鬥';}},LOCK_MS+30);},E3.ok?1500:1000);")
# nextB lock
rep("function nextB(){\n  if(!B||B.busy)return;","function nextB(){\n  if(!B||B.busy)return;\n  if(Date.now()<B.lockUntil)return;")
# --- rollBonus
i=g.index("function rollBonus(){");j=g.index("function finish(win){")
g=g[:i]+r"""function rollBonus(){
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
"""+g[j:]
# --- finish
i=g.index("function finish(win){");j=g.index("/* ---------- game views ---------- */")
g=g[:i]+r"""function finish(win){
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

"""+g[j:]
# --- monSvg
rep("function monSvg(id){return MSPR[id]?'<img class=\"msp\" alt=\"\" src=\"'+MSPR[id].u+'\">':MON[id].svg;}",
"function monSvg(id){const s=monSprite(id);return s?'<img class=\"msp\" alt=\"\" src=\"'+s.u+'\">':(MON[id]?MON[id].svg:'');}")
# --- stageHTML
rep("if(b.anim==='atk'&&!use3)fx+=`<span class=\"proj\">${PROJ[b.mon]||'💥'}</span>","if(b.anim==='atk'&&!use3)fx+=`<span class=\"proj\">${projOf(b.mon)}</span>")
rep("ms=MSPR[b.mon],mana","ms=monSprite(b.mon),mana")
rep("(b.ult?'大絕招！整句魔法環繞怪物，再從天而降！怪物 -2 HP':'金色箭矢命中！怪物 -1 HP'):b.anim==='atk'?'怪物反擊！英雄受到傷害'",
    "(b.ult?'大絕招！整句魔法環繞怪物，再從天而降！怪物 -2 HP':'金色箭矢命中！怪物 -1 HP'):b.anim==='atk'?(b.healed?'怪物反擊！牠還回復了 1 HP':'怪物反擊！英雄受到傷害')")
rep("${b.kind==='boss'?'魔王・':b.kind==='revenge'?'復仇・':''}${b.name}</div>\n      <div class=\"bar mh\">","${b.kind==='boss'?'魔王・':b.kind==='elite'?'精英・':b.kind==='revenge'?'復仇・':''}${b.name}</div>\n      <div class=\"bar mh\">")
rep("const cls=['stage',b.mon==='boss'?'boss':''","const cls=['stage',b.kind==='boss'?'boss':''")
rep("${b.kind==='boss'?'<b>魔王</b>':b.kind==='revenge'?'<b class=\"rv\">復仇</b>':''}${b.name}</div>`}","${b.kind==='boss'?'<b>魔王</b>':b.kind==='elite'?'<b>精英</b>':b.kind==='revenge'?'<b class=\"rv\">復仇</b>':''}${b.name}</div>`}")
# --- viewBattle: sheet + lock
rep("const extra=(ok&&B.noteMsg?' 📒+3 金幣':'')+(!ok&&B.revived?'　🧪 復活藥水發動，回復愛心！':'');",
    "const extra=(ok&&B.noteMsg?' 📒+3 金幣':'')+(!ok&&B.healed?'　👹 怪物回復了 1 HP':'')+(!ok&&B.revived?'　🧪 復活藥水發動，回復愛心！':'');\n  const locked=!ok&&Date.now()<B.lockUntil;")
rep("<button class=\"btn block ${ok?'good':'bad'}\" id=\"nextB\" data-act=\"nextB\">${finalHit?'打倒牠！':(B.php<=0?'繼續':'繼續戰鬥')}</button>",
    "<button class=\"btn block ${ok?'good':'bad'}\" id=\"nextB\" data-act=\"nextB\" ${locked?'disabled':''}>${locked?'先看清楚正確答案…':finalHit?'打倒牠！':(B.php<=0?'繼續':'繼續戰鬥')}</button>")
open(P+'part_game.js','w').write(g)
print('ok part1')
