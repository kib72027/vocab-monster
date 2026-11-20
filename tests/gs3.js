const fs=require('fs');let click=null;
const app={className:'',innerHTML:'',addEventListener(t,f){if(t==='click')click=f;}};
const el=()=>({classList:{add(){},remove(){},toggle(){}},dataset:{},hidden:false,focus(){},style:{setProperty(){}},isConnected:true,appendChild(){}});
global.window={scrollTo(){},__noRush:true};global.document={getElementById(id){return id==='app'?app:el()},querySelector(){return el()},createElement(){return el()},addEventListener(){}};
global.localStorage={_d:{'reading-plus-vocab-v1':JSON.stringify({missed:[],best:0,g:{xp:10,coins:100,gear:{sword:2,shield:3},mast:{}}})},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v}};
const timers=[];global.setTimeout=f=>{timers.push(f);return 1};const flush=()=>{while(timers.length)timers.shift()()};
{const src=fs.readFileSync('app2.js','utf8');const i=src.lastIndexOf('})();');eval(src.slice(0,i)+'global.D={G,get B(){return B},ALL,learnedTotal,RMON};'+src.slice(i));}
const act=(a,ds={})=>click({target:{closest:()=>({dataset:Object.assign({act:a},ds),disabled:false})}});
const D=global.D,g=D.G(),A=(c,m)=>{if(!c){console.log('FAIL',m);process.exit(1)}};
// refund: sword2 = 30+60=90 (3*30), shield3 = 40*7=280 => 100+90+280=470
A(g.coins===100+90+280&&!g.gear,'refund '+g.coins);
act('shop');const clean=()=>app.innerHTML.replace(/data:image[^"]*/g,'');A(!clean().includes('undefined')&&!clean().includes('NaN'),'shop html');
A((app.innerHTML.match(/data-act="tool"/g)||[]).length===3,'3 tools');
act('heroes');A(clean().includes('更換主角')&&(app.innerHTML.match(/data-act="pickHero"/g)||[]).length===10&&!clean().includes('undefined'),'heroes view');act('pickHero',{id:'h4'});A(D.G().heroId==='h4','pick hero');
act('coll');A(!clean().includes('undefined')&&!clean().includes('NaN')&&(app.innerHTML.match(/class="rt( |")/g)||[]).length>=D.RMON.length,'codex all');act('cdx',{t:'fire'});A((app.innerHTML.match(/class="rt( |")/g)||[]).length===D.RMON.filter(m=>m.t==='fire').length,'codex fire');act('cdx',{t:'all'});
g.coins=1000;act('citem',{s:'hat',id:'straw'});A(g.eq.hat==='straw'&&g.own.includes('hat:straw')&&g.coins===980,'buy hat');
act('citem',{s:'hat',id:'straw'});A(g.eq.hat==='','unequip');
act('citem',{s:'hat',id:'crown'});A(!g.own.includes('hat:crown'),'locked crown');
D.ALL.slice(0,60).forEach(w=>g.mast[w.w]=3);A(D.learnedTotal()===60,'learned');
act('citem',{s:'back',id:'dragon'});A(g.eq.back==='dragon','buy dragon');
act('citem',{s:'weapon',id:'wand'});A(g.eq.weapon==='wand','wand');
act('citem',{s:'outfit',id:'tunic'});A(g.eq.outfit==='tunic','outfit stays');
act('tool',{id:'potion'});act('tool',{id:'potion'});act('tool',{id:'crystal'});act('tool',{id:'note'});act('tool',{id:'note'});
A(g.inv.potion===2&&g.inv.crystal===1&&g.inv.note===1,'tools '+JSON.stringify(g.inv));
act('goGame');A(app.innerHTML.includes('class="himg')&&app.innerHTML.includes('學會'),'home hero');
g.learned['w9-mosh']=1;   // skip the learn-first cards (covered in gsmoke.js)
act('fight',{id:'w9-mosh'});A(app.innerHTML.includes('class="hbat"'),'battle hero');A(app.innerHTML.includes('crystal'),'crystal btn');
act('crystal');const q=D.B.q;A(q.gone.length===2&&!q.gone.some(i=>q.choices[i].correct)&&g.inv.crystal===0,'crystal');
A(!app.innerHTML.includes('data-act="crystal"'),'btn gone');
// lose all hearts -> potions revive
let revived=0;for(let k=0;k<7;k++){const B=D.B;if(B.q.pick===null){const bad=B.q.choices.findIndex((c,i)=>!c.correct&&!(B.q.gone||[]).includes(i));act('pick',{i:String(bad)});flush();if(B.revived)revived++;act('nextB');flush();}}
console.log('revived',revived,'potions left',g.inv.potion,'view',global.D.B&&global.D.B.php);
A(revived>=1&&g.inv.potion<2,'potion used');
// note bonus: answer wrong then right
const c0=g.coins;
for(let k=0;k<30&&app.innerHTML.includes('class="choices"');k++){const B=D.B;const w=B.q.t.w;const right=B.q.choices.findIndex(c=>c.correct);act('pick',{i:String(right)});flush();act('nextB');flush();}
console.log('coins gained after',g.coins-c0);
console.log('GS3_OK');
