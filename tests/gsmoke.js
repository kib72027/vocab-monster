const fs=require('fs');let click=null,keydown=null;
const app={className:'',innerHTML:'',addEventListener(t,f){if(t==='click')click=f;}};
const stubEl=()=>({classList:{add(){},remove(){},toggle(){}},dataset:{},hidden:false,focus(){},style:{setProperty(){}},isConnected:true,appendChild(){}});
global.window={scrollTo(){},__noRush:true};
global.document={getElementById(id){return id==='app'?app:stubEl()},querySelector(){return stubEl()},createElement(){return stubEl()},addEventListener(t,f){if(t==='keydown')keydown=f;}};
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v}};
const timers=[];global.setTimeout=(f)=>{timers.push(f);return 1;};
global.requestAnimationFrame=f=>f();
{const src=fs.readFileSync('app2.js','utf8');const i=src.lastIndexOf('})();');eval(src.slice(0,i)+'global.__dbg={get B(){return B},G,SETS,ELITES,BOSSES,starsOf,get S(){return S}};'+src.slice(i));}
const flush=()=>{while(timers.length)timers.shift()();};
const act=(a,ds={})=>click({target:{closest:()=>({dataset:Object.assign({act:a},ds),disabled:false})}});
const D=global.__dbg;
function assert(c,m){if(!c){console.log('FAIL',m);process.exit(1);}}
function check(label){assert(app.innerHTML.replace(/data:image[^"]*/g,'').length>200&&!app.innerHTML.replace(/data:image[^"]*/g,'').includes('undefined')&&!app.innerHTML.replace(/data:image[^"]*/g,'').includes('NaN'),label+' html bad: '+app.innerHTML.replace(/data:image[^"]*/g,'').slice(0,200));}
check('game home');assert(app.innerHTML.includes('單字打怪王'),'home title');
assert((app.innerHTML.match(/data-act="fight"/g)||[]).length===40,'40 monsters');
assert(app.innerHTML.includes('disabled'),'boss locked');
// a lesson never fought opens the word cards first; ldone only works once every card was heard (timers stand in for speech)
function learnThrough(){let g=0;while(D.S.view==='learn'&&g++<60){flush();const L=D.S.learn;act(L.i===L.words.length-1?'ldone':'lnext');}flush();}
{act('fight',{id:'w9-mosh'});assert(D.S.view==='learn','unlearned lesson opens learn view, got '+D.S.view);check('learn');
 for(let i=0;i<D.S.learn.words.length-1;i++)act('lnext');act('ldone');assert(D.S.view==='learn','ldone blocked until all cards heard');act('goGame');}
function fightSet(id,wrongFirst){
  act('fight',{id});learnThrough();assert(D.S.view==='battle',id+' battle after learning, got '+D.S.view);check('battle');let n=0,wrongDone=0;
  while(D.S.view==='battle'&&n<80){
    const B=D.B;const q=B.q;
    let idx=q.choices.findIndex(c=>c.correct);
    if(wrongFirst&&wrongDone<1){idx=q.choices.findIndex(c=>!c.correct);wrongDone++;}
    act('pick',{i:String(idx)});check('answered');flush();assert(D.B.sheet||D.S.view!=='battle','sheet shows');
    check('sheet');
    act('nextB');flush();n++;
  }
  return n;
}
let n=fightSet('w9-mosh',true);
assert(D.S.view==='reward','reward view after win, got '+D.S.view+' n='+n);check('reward');
assert(app.innerHTML.includes('chest'),'chest');act('openChest');check('opened');assert(!app.innerHTML.includes('class="chest"'),'opened');
console.log('mosh battle questions:',n,'xp',D.G().xp,'coins',D.G().coins);
// defeat path
act('goGame');act('fight',{id:'w7-sara'});learnThrough();
let guard=0;while(D.S.view==='battle'&&guard++<30){const q=D.B.q;act('pick',{i:String(q.choices.findIndex(c=>!c.correct))});flush();act('nextB');flush();}
assert(D.S.view==='defeat','defeat view, got '+D.S.view);check('defeat');assert(D.G().xp>=0);
// locked elite/boss
act('goGame');
assert(/elitecard[^"]*locked/.test(app.innerHTML),'elite locked at start');
act('elite',{id:'e1'});assert(D.S.view!=='battle','locked elite must not start');
act('boss',{id:'b0'});assert(D.S.view!=='battle','locked boss must not start');
// anti-guess: rush guard (click right after question shows is ignored)
{window.__noRush=false;act('goGame');act('fight',{id:'w1-office'});learnThrough();const q0=D.B.q;act('pick',{i:'0'});assert(D.B.q.pick===null,'rush click ignored');
 D.B.qStart=Date.now()-2000;act('pick',{i:String(D.B.q.choices.findIndex(c=>!c.correct))});assert(D.B.q.pick!==null,'normal click works');flush();
 assert(D.B.sheet&&D.B.lockUntil>Date.now()&&/disabled/.test(app.innerHTML.match(/<button[^>]*id="nextB"[^>]*>/)[0]),'wrong -> next locked');
 act('nextB');assert(D.B.sheet,'nextB blocked during lock');window.__noRush=true;D.B.lockUntil=0;act('nextB');assert(!D.B.sheet,'nextB after lock');
 assert(D.B.hp===D.B.maxhp,'normal monster does not heal');act('goGame');}
// win every lesson with 3 stars, then elites, then bosses
for(const s of D.SETS){act('goGame');fightSet(s.id,false);assert(D.S.view==='reward',s.id+' win');assert(D.G().stars[s.id]===3,s.id+' 3 stars');}
act('goGame');assert(!/elitecard[^"]*locked/.test(app.innerHTML),'elites unlocked');
assert(/bosscard locked/.test(app.innerHTML),'boss still locked');
// elite heal on wrong + stars by accuracy
act('elite',{id:'e1'});check('elite battle');assert(D.B.maxhp===10,'elite hp '+D.B.maxhp);
{let q=D.B.q;const hp0=D.B.hp;act('pick',{i:String(q.choices.findIndex(c=>c.correct))});flush();act('nextB');flush();
 assert(D.B.hp===hp0-1,'hit');q=D.B.q;act('pick',{i:String(q.choices.findIndex(c=>!c.correct))});assert(D.B.hp===hp0,'elite healed on wrong');flush();act('nextB');flush();}
let k=0;while(D.S.view==='battle'&&k++<80){const q=D.B.q;act('pick',{i:String(q.choices.findIndex(c=>c.correct))});flush();act('nextB');flush();}
assert(D.S.view==='reward','elite win');assert(D.G().stars.e1===2||D.G().stars.e1===3,'elite stars '+D.G().stars.e1);assert(D.G().rcards[D.B.mon],'elite monster collected');check('elite reward');
act('goGame');
for(const e of D.ELITES){if(e.id==='e1')continue;act('goGame');act('elite',{id:e.id});assert(D.S.view==='battle',e.id+' start');let kk=0;while(D.S.view==='battle'&&kk++<80){const q=D.B.q;act('pick',{i:String(q.choices.findIndex(c=>c.correct))});flush();act('nextB');flush();}assert(D.S.view==='reward',e.id+' win');}
act('goGame');assert(!/bosscard locked/.test(app.innerHTML),'boss unlocked');
act('boss',{id:'b0'});check('boss battle');assert(D.B.maxhp===14,'boss hp');
k=0;while(D.S.view==='battle'&&k++<80){const q=D.B.q;act('pick',{i:String(q.choices.findIndex(c=>c.correct))});flush();act('nextB');flush();}
assert(D.S.view==='reward','boss win');check('boss reward');
// 1-star case: lots of wrong answers then win -> no chest, no monster
act('goGame');act('fight',{id:'w10-stage'});learnThrough();{let w=0,t=0;while(D.S.view==='battle'&&t++<80){const q=D.B.q;const bad=w<4&&D.B.php>2;if(bad)w++;act('pick',{i:String(bad?q.choices.findIndex(c=>!c.correct):q.choices.findIndex(c=>c.correct))});flush();act('nextB');flush();}}
if(D.S.view==='reward'){assert(D.B.res.stars<=2,'few stars');if(D.B.res.stars===1){assert(!D.B.res.bonus,'1 star -> no chest');}}
act('goGame');assert(app.innerHTML.includes('復仇怪')||D.G().xp>0,'ok');
for(const v of ['revenge']){act('revenge');}
check('revenge');
act('goGame');act('coll');check('coll');act('goGame');act('shop');check('shop');

act('goGame');act('setReward',{r:'cards'});assert(D.G().reward==='cards');
act('fight',{id:'w9-mosh'});let m=0;while(D.S.view==='battle'&&m++<40){const q=D.B.q;act('pick',{i:String(q.choices.findIndex(c=>c.correct))});flush();act('nextB');flush();}
assert(D.S.view==='reward');act('openChest');assert(app.innerHTML.includes('rc'),'card shown');
act('goGame');act('setReward',{r:'coins'});act('practice');assert(D.S.view==='home');check('practice home');assert(app.innerHTML.includes('回打怪遊戲'));
console.log('level',D.G().xp,'streak',D.G().streak,'today',D.G().today,'cards',Object.keys(D.G().cards).length);
console.log('GAME_SMOKE_OK');
