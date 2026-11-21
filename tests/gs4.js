// Checks for the 80-monster roster, video hero animation data, and revenge rules (only fought lessons, up to 10 per fight).
// Run like the other smoke tests: node gs4.js next to app2.js (the <script> of index.html).
const fs=require('fs');let click=null;
const app={className:'',innerHTML:'',addEventListener(t,f){if(t==='click')click=f;}};
const el=()=>({classList:{add(){},remove(){},toggle(){}},dataset:{},hidden:false,focus(){},style:{setProperty(){}},isConnected:true,appendChild(){}});
global.window={scrollTo(){},__noRush:true};
global.document={getElementById(id){return id==='app'?app:el()},querySelector(){return el()},createElement(){return el()},addEventListener(){}};
const KEY='reading-plus-vocab-v1';
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v}};
// revenge setup: 4 missed words from a fought lesson + 5 from a lesson never played
const src=fs.readFileSync('app2.js','utf8');
{const i0=src.indexOf('const RAW='),raw=eval(src.slice(i0,src.indexOf(']}];',i0)+4)+'RAW');
 const w=s=>s.words.map(e=>typeof e==='string'?e:e[0]);const a=raw[0],z=raw[raw.length-1];
 global.__played=w(a).slice(0,4);global.__unplayed=w(z).slice(0,5);
 localStorage._d[KEY]=JSON.stringify({missed:[...__played,...__unplayed],g:{def:{[a.id]:1},stars:{[a.id]:3},learned:{[a.id]:1}}});global.__a=a.id;global.__raw=raw;}
const timers=[];global.setTimeout=f=>{timers.push(f);return 1};const flush=()=>{while(timers.length)timers.shift()()};
global.requestAnimationFrame=f=>0;
{const i=src.lastIndexOf('})();');eval(src.slice(0,i)+'global.BGS0=typeof BGS!=="undefined"?BGS:undefined;global.D={G,get B(){return B},get S(){return S},RMON,RSPR,MPLAN,HANIM,HSPR,HEROES,store,LMON,LSPR,VMON,VSPR,revMon};'+src.slice(i));}
const act=(a,ds={})=>click({target:{closest:()=>({dataset:Object.assign({act:a},ds),disabled:false})}});
const D=global.D,A=(c,m)=>{if(!c){console.log('FAIL',m);process.exit(1)}};
const clean=()=>app.innerHTML.replace(/data:image[^"]*/g,'');

// roster: 80 monsters, art for each, plan points at existing monsters with matching roles
A(D.RMON.length>=80&&new Set(D.RMON.map(m=>m.id)).size===D.RMON.length,'monster ids unique, got '+D.RMON.length);
A(D.RMON.every(m=>D.RSPR[m.id]&&D.RSPR[m.id].w>0&&D.RSPR[m.id].h>0&&/^data:image\/webp;base64,/.test(D.RSPR[m.id].u)),'every monster has art');
const by=Object.fromEntries(D.RMON.map(m=>[m.id,m]));
A(D.MPLAN.normal.length===40&&D.MPLAN.elite.length===18&&D.MPLAN.boss.length===9,'plan sizes');
const all=[...D.MPLAN.normal,...D.MPLAN.elite,...D.MPLAN.boss];
A(new Set(all).size===67&&all.every(id=>by[id]),'plan ids unique and exist');
A(D.MPLAN.normal.every(id=>by[id].role==='n')&&D.MPLAN.elite.every(id=>by[id].role==='e')&&D.MPLAN.boss.every(id=>by[id].role==='b'),'plan roles');
A(D.RMON.some(m=>m.role==='x'||m.role==='r'),'chest pool not empty');

// heroes: all 10 have video animation (fps), four clips, portrait
A(D.HEROES.length===10,'10 heroes');
for(const h of D.HEROES){const H=D.HANIM[h.id];
  A(H&&H.fps>0&&H.k>0,h.id+' HANIM with fps');
  for(const c of ['idle','attack','hit','win'])A(H[c]&&H[c].length>=8&&H[c].every(f=>f.w>0&&f.h>0&&/^data:image\/webp;base64,/.test(f.u)),h.id+' '+c+' frames');
  A(D.HSPR[h.id]&&D.HSPR[h.id].w>0,h.id+' portrait');}

// home: monster count text, revenge counts only the fought lesson's words
act('goGame');A(clean().includes('收集 '+D.RMON.length+' 隻怪物'),'home shows the monster count');
// legends: stored for later, not part of the collection yet
act('goGame');act('coll');A((app.innerHTML.match(/class="rt legend locked"/g)||[]).length===4,'codex shows 4 locked legends');act('cdx',{t:'tL'});A((app.innerHTML.match(/rt legend/g)||[]).length===4&&!/rt locked role-/.test(app.innerHTML),'legend tab shows only legends');act('goGame');
A(D.VMON.length===4&&D.VMON.every(m=>D.VSPR[m.id]&&!D.RMON.some(r=>r.id===m.id)),'4 revenge levels stored apart');A(D.revMon(1)==='V01'&&D.revMon(5)==='V02'&&D.revMon(8)==='V03'&&D.revMon(12)==='V04','revenge level follows missed-word count');A(D.LMON.length===4&&D.LMON.every(m=>D.LSPR[m.id]&&D.LSPR[m.id].w>0&&!D.RMON.some(r=>r.id===m.id)),'4 legends stored apart');
A(/4 個字等你復仇/.test(clean()),'revenge card counts 4 (fought lesson only): '+(clean().match(/\d+ 個字等你復仇[^<]*/)||['none'])[0]);
act('revenge');A(D.S.view==='battle'&&D.B.kind==='revenge','revenge battle starts');
A(D.B.maxhp===4,'revenge hp 4, got '+D.B.maxhp);
A(D.B.pool.every(w=>__played.includes(w.w)),'revenge pool only from fought lesson');
A(!/復仇・復仇・/.test(clean()),'revenge name not doubled');
let n=0;while(D.S.view==='battle'&&n++<40){const q=D.B.q;act('pick',{i:String(q.choices.findIndex(c=>c.correct))});flush();act('nextB');flush();}
A(D.S.view==='reward','revenge won');
A(__played.every(w=>!D.store.missed.includes(w)),'revenge words cleared after win');
A(__unplayed.every(w=>D.store.missed.includes(w)),'unplayed-lesson words kept for practice mode');
act('goGame');A(!/等你復仇/.test(clean()),'no revenge card left');

// a word missed in a lesson fight stays for revenge even though the fight asks it again and it is answered right then
{act('goGame');act('fight',{id:__a});flush();A(D.S.view==='battle','lesson battle starts ('+D.S.view+')');
 const q0=D.B.q,w0=q0.t.w;act('pick',{i:String(q0.choices.findIndex(c=>!c.correct))});flush();act('nextB');flush();
 let k=0,again=0;while(D.S.view==='battle'&&k++<60){const q=D.B.q;if(q.t.w===w0)again++;act('pick',{i:String(q.choices.findIndex(c=>c.correct))});flush();act('nextB');flush();}
 A(again>0,'the missed word was asked again in the same fight');A(D.store.missed.includes(w0),'missed word kept for revenge after being answered right later in the fight');
 act('goGame');A(/等你復仇/.test(clean()),'revenge card shows after a lesson fight with a mistake');D.store.missed.splice(0);}
// monster special moves: one tier up (lesson -> elite moves 'e', elite -> boss moves 'b', boss -> legend moves 'L'); every 3rd miss, a boss at 1/3 HP or less every 2nd
{const miss=(kind,n,setup)=>{act('goGame');act('fight',{id:__a});flush();D.B.kind=kind;D.B.wrongN=0;if(setup)setup();const out=[];for(let i=0;i<n;i++){D.B.php=5;D.B.busy=false;D.B.lockUntil=0;const q=D.B.q;act('pick',{i:String(q.choices.findIndex(c=>!c.correct))});out.push(D.B.spTier||'-');flush();act('nextB');flush();}act('goGame');D.store.missed.splice(0);return out.join('');};
 const a=miss('set',6),b=miss('elite',3),c=miss('boss',3,()=>{D.B.hp=20;D.B.maxhp=20;}),d=miss('boss',4,()=>{D.B.maxhp=30;D.B.hp=5;});
 A(a==='--e--e','lesson monster: elite move every 3rd miss ('+a+')');A(b==='--b','elite: boss move on the 3rd miss ('+b+')');A(c==='--L','boss: legend move on the 3rd miss ('+c+')');A(d==='-L-L','boss at 1/3 HP: legend move every 2nd miss ('+d+')');}
// ultimates: with a 終極卷軸 the ultimate is the hero's finisher (uses one scroll, 4 damage); otherwise the first or second ultimate at random
{const g=D.G();g.inv.finisher=1;act('goGame');act('fight',{id:__a});flush();D.B.mana=99;const hp0=D.B.hp,q=D.B.q;act('pick',{i:String(q.choices.findIndex(c=>c.correct))});
 A(D.B.ultKind==='fin'&&g.inv.finisher===0,'scroll turns the ultimate into the finisher ('+D.B.ultKind+')');A(hp0-D.B.hp===Math.min(4,hp0-1)||hp0-D.B.hp===4,'finisher deals 4 damage');flush();act('nextB');flush();
 const kinds=new Set();for(let i=0;i<30;i++){D.B.mana=99;D.B.busy=false;const q2=D.B.q;if(!q2)break;D.B.hp=99;act('pick',{i:String(q2.choices.findIndex(c=>c.correct))});if(D.B.ult)kinds.add(D.B.ultKind);flush();act('nextB');flush();if(D.S.view!=='battle')break;}
 A(kinds.has('1')&&kinds.has('2')&&!kinds.has('fin'),'without a scroll both ultimates appear: '+[...kinds]);act('goGame');}
// cap: 20 missed words from two fought lessons -> card says 每次 10 個, fight has 10 hp
{const g=D.G(),w=s=>s.words.map(e=>typeof e==='string'?e:e[0]);const s1=__raw[1],s2=__raw[2];g.def[s1.id]=1;g.def[s2.id]=1;
 D.store.missed.push(...w(s1),...w(s2));act('goGame');const t=clean().match(/(\d+) 個字等你復仇（每次 10 個）/);
 A(t&&+t[1]>10,'card shows 每次 10 個');act('revenge');A(D.B.maxhp===10,'revenge capped at 10, got '+D.B.maxhp);}
// test lab: shows every hero / monster / sound button, never changes progress
{act('goGame');A(/data-act="test"/.test(app.innerHTML),'home has test button');act('test');A(D.S.view!=='test'&&/id="tpwin"/.test(app.innerHTML),'test lab asks for a password');
 act('testgo',{pw:'0000'});A(D.S.view!=='test'&&/tpwbad/.test(app.innerHTML),'wrong password refused');act('testno');A(!/tpwin/.test(app.innerHTML),'cancel closes the dialog');act('test');act('testgo',{pw:'0828'});A(D.S.view==='test','right password opens the test lab');act('goGame');const g=D.G(),snap=JSON.stringify([g.xp,g.coins,g.heroId,g.stars,g.def,g.rcards]);
 act('test');A(D.S.view==='test','test view');const h=clean();A(!/undefined|NaN/.test(h),'test html clean');
 A((app.innerHTML.match(/data-k="hero"/g)||[]).length===10,'10 hero buttons');A((app.innerHTML.match(/data-k="mon"/g)||[]).length===D.RMON.length+D.LMON.length+D.VMON.length,'all monsters + legends + revenge listed');
 A((app.innerHTML.match(/data-k="bg"/g)||[]).length===Object.keys(global.BGS0||{}).length+1||typeof global.BGS0==='undefined','one scene button per background + auto');
 A((app.innerHTML.match(/data-k="matk"/g)||[]).length===12&&(app.innerHTML.match(/data-k="sndm"/g)||[]).length===12,'12 element attacks and sounds');
 const other=g.heroId==='h3'?'h4':'h3';act('tl',{k:'hero',id:other});act('tl',{k:'mon',id:'n050'});act('tl',{k:'next'});act('tl',{k:'prev'});
 act('tl',{k:'bg',id:Object.keys(global.BGS0||{x:1})[0]});act('tl',{k:'bg',id:''});for(const k of ['attack','hit','win','ult','die'])act('tl',{k});for(const t of ['hit','crit','wrong','impact','impact1','hurt','win','lose','coin','open','tap'])act('tl',{k:'snd',t});act('tl',{k:'sndm',t:'elec'});
 act('tl',{k:'auto'});act('tl',{k:'auto'});flush();A(D.S.view==='test','still in test view');
 A(JSON.stringify([g.xp,g.coins,g.heroId,g.stars,g.def,g.rcards])===snap,'test lab does not change progress');act('goGame');A(D.S.view==='game','back home');}
console.log('GS4_OK');
