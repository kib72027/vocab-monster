import re
P='/tmp/claude-0/-home-claude/a3c55631-b360-5eee-bc8c-a284734dea09/scratchpad/'
g=open(P+'part_game.js').read()
# ---- viewGame
i=g.index("  const defCount=SETS.filter");j=g.index("  const rev=store.missed.length")
g=g[:i]+r"""  const lcard=s=>{
    const mid=SETMON[s.id],L=learned(s),done=!!g.def[s.id],st=starsOf(s.id);
    return `<button class="mcard ${s.k}${done?' done':''}" data-act="fight" data-id="${s.id}"><span class="mart">${monSvg(mid)}</span>${done?starsHTML(st,'cs'):''}<span class="mname">${monName(mid)}</span><span class="mles">${s.week.replace("Week ","W")} · ${s.title}</span><span class="mprog"><i style="width:${Math.round(L/s.words.length*100)}%"></i></span><span class="mnum">學會 ${L}/${s.words.length} 字</span></button>`;};
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
"""+g[j:]
g=g.replace("  const rev=store.missed.length?","  const rev0=store.missed.length?",1) if False else g
# the old template used ${cards}${rev}${boss}; rev stays, boss removed
g=g.replace('<section class="mapsec"><div class="sec-h"><h2>選一隻怪物開打</h2></div><div class="mgrid">${cards}${rev}${boss}</div></section>',
  '<section class="mapsec"><div class="sec-h"><h2>選一隻怪物開打</h2></div>${rev?`<div class="mgrid">${rev}</div>`:\'\'}<p class="soft">每週：打完全部課文（2★以上）→ 挑戰精英怪；每兩週：兩位精英都通過 → 挑戰魔王。</p>${cards}</section>')
g=g.replace("['cards','怪物卡片','收集 90 隻怪物']","['cards','怪物卡片','收集 96 隻怪物']")
# ---- viewReward
i=g.index("function viewReward(){");j=g.index("function viewDefeat(){")
g=g[:i]+r"""function viewReward(){
  const r=B.res,bn=r.bonus;let rv='';
  if(!bn)rv=`<div class="reveal"><p class="soft">這次只拿到 1 顆星，沒有寶箱，也還沒收服牠。<br>看清楚題目、少答錯，拿到 2 顆星以上就能收服！</p></div>`;
  else if(!B.opened)rv=`<button class="chest" data-act="openChest" aria-label="打開寶箱">🎁<span>點一下，打開寶箱！</span></button>`;
  else if(bn.t==='xp')rv=`<div class="reveal"><div class="rbig">✨ +${bn.v}</div><p>額外經驗值！</p></div>`;
  else if(bn.t==='coins')rv=`<div class="reveal"><div class="rbig">🪙 +${bn.v}</div><p>${bn.lucky?'幸運加倍！':'額外金幣！'}</p></div>`;
  else rv=`<div class="reveal">${rtile(bn.id,true,bn.n,true)}<p>${bn.isNew?'新怪物加入圖鑑！':'重複的卡片 ×'+bn.n}</p></div>`;
  const wr=B.wrong.length?`<div class="wrongbox"><b>這次答錯的字，會變成復仇怪回來：</b><div class="chips">${B.wrong.map(w=>`<span>${w.w}</span>`).join('')}</div></div>`:'';
  const cap=r.gotMon?`<div class="lvup goal">📖 收服了 ${B.name}！${r.newMon?'新怪物加入圖鑑':'圖鑑 ×'+r.monN}</div>`:'';
  return `<div class="rview"><div class="rleft">${stageHTML(B,{beaten:true,noHp:true})}</div>
   <div class="rright"><h1>打倒了 ${B.name}！</h1>
   <div class="rstars">${starsHTML(r.stars,'big')}<small>答對 ${B.right} 題・答錯 ${B.wrongN} 題</small></div>
   ${r.lvUp?`<div class="lvup">🎉 升級了！Lv.${r.lv}</div>`:''}
   ${cap}
   ${B.goalMsg?`<div class="lvup goal">🎯 ${B.goalMsg}</div>`:''}
   <div class="rrows"><div><span>⭐ 經驗值</span><b>+${r.xp+B.right*5-r.xp}</b></div><div><span>⭐ 勝利獎勵</span><b>+${r.xp}</b></div><div><span>🪙 金幣</span><b>+${r.coins}</b></div></div>
   <div class="chestbox">${rv}</div>${wr}
   <div class="btnrow"><button class="btn primary" data-act="again2">再戰一次</button><button class="btn" data-act="goGame">回到地圖</button></div></div></div>`;
}
"""+g[j:]
# ---- cardHTML remove, rtile, viewColl
i=g.index("function cardHTML(id,r,big){");j=g.index("function viewHeroes(){")
g=g[:i]+r"""function rtile(id,own,cnt,big){
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
"""+g[j:]
open(P+'part_game.js','w').write(g)

# ---- 3D engine
t=open(P+'part_3d.js').read()
def rt(old,new):
    global t
    assert t.count(old)==1,(t.count(old),old[:70]);t=t.replace(old,new)
rt("function mon0(id){return id==='boss'?3.3:2.8;}","const SPR=id=>(typeof MSPR!=='undefined'&&MSPR[id])||(typeof RSPR!=='undefined'&&RSPR[id])||null;\nfunction mon0(id){return E.big?3.3:2.8;}")
rt("function setup(monId,eq,hid){\n  const m=monModel(monId),h=heroModel(eq);","function setup(monId,eq,hid,big){\n  E.big=!!big;\n  const m=(typeof RSPR!=='undefined'&&RSPR[monId])?{root:Gp(),sc:1}:monModel(monId),h=heroModel(eq);")
rt("const SP=(typeof MSPR!=='undefined')&&MSPR[monId];","const SP=SPR(monId);")
rt("base:[monId==='boss'?3.4:3.0,0,.1]","base:[E.big?3.4:3.0,0,.1]")
rt("(E.mon.id==='boss'?6.0:5.3)","(E.big?6.0:5.3)")
rt("(E.mon.id==='boss'?1.2:1)","(E.big?1.2:1)")
rt("S=MSPR[o.img]","S=SPR(o.img)")
rt("Math.min(o.id==='boss'?4.3:3.5,3.9/asp)","Math.min(E.big?4.3:3.5,3.9/asp)")
open(P+'part_3d.js','w').write(t)

# ---- app2 handlers
a=open(P+'part_app2.js').read()
old="    case 'boss':ac();SFX.tap();if(allDefeated())startBattle('boss');break;"
assert old in a
a=a.replace(old,"    case 'boss':ac();SFX.tap();startBattle('boss',b.dataset.id);break;\n    case 'elite':ac();SFX.tap();startBattle('elite',b.dataset.id);break;")
open(P+'part_app2.js','w').write(a)

# ---- CSS
h=open(P+'part_head2.html').read()
css="""
.weekh{font:800 18px var(--font-display);margin:18px 2px 8px;color:var(--ink)}
.stars{display:inline-flex;gap:1px;font-size:15px;line-height:1}.stars i{font-style:normal;color:#D5DBE6}.stars i.on{color:#FFB400;text-shadow:0 1px 0 rgba(0,0,0,.15)}
.stars.cs{position:absolute;right:8px;top:14px;background:rgba(255,255,255,.9);border-radius:999px;padding:2px 6px}
.stars.big{font-size:38px;gap:4px}
.rstars{display:flex;flex-direction:column;align-items:center;gap:2px;margin:4px 0 6px}.rstars small{font-weight:800;color:var(--muted)}
.elitecard{background:linear-gradient(#FFF3D6,var(--paper));border-color:#E8A93B;box-shadow:0 5px 0 #E8A93B}.elitecard::before{background:#E8A93B}
.elitecard.locked{filter:grayscale(1);opacity:.62;cursor:not-allowed}
.mtier{position:absolute;left:8px;top:14px;background:#E8A93B;color:#fff;font:800 11px var(--font-body);border-radius:999px;padding:2px 9px}.mtier.boss{background:#8E6BE8}
.bossrow .bosscard{grid-column:1/-1}.bosscard.done .mnum,.elitecard.done .mnum{color:var(--good-solid,#2E9E5B)}
.rtb.e{background:#E8A93B}.rtb.b{background:#8E6BE8}.rtb.r{background:#18B79A}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .elitecard{background:linear-gradient(#3A2D12,var(--paper))}}
:root[data-theme="dark"] .elitecard{background:linear-gradient(#3A2D12,var(--paper))}
"""
k=h.index(":root[data-theme=\"dark\"] .bosscard,:root[data-theme=\"dark\"] .revcard")
e=h.index("\n",k)
h=h[:e+1]+css+h[e+1:]
open(P+'part_head2.html','w').write(h)
print('ok part2')
