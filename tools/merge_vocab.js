const fs=require('fs');
const src=fs.readFileSync('part_data.js','utf8');
const m=new Function(src+';return {RAW,VX}')();
const {RAW,VX}=m;
const rd=f=>JSON.parse(fs.readFileSync('vocab/'+f+'.json','utf8'));
const outs=[...[1,2,3,4].flatMap(i=>rd('old_out'+i)),...[1,2,3].flatMap(i=>rd('new_out'+i))];
const by={};outs.forEach(o=>{(by[o.w]=by[o.w]||[]).push(o)});
const titleToLesson={};RAW.forEach(l=>titleToLesson[l.title]=l.id);
let upd=0,miss=[];
const seen=new Set();
RAW.forEach(l=>l.words.forEach((w,i)=>{
  const key=Array.isArray(w)?w[0]:w;
  const cand=by[key];
  if(!cand){miss.push(key);return;}
  // prefer entry for this lesson
  let o=cand.find(c=>c.lesson===l.id||titleToLesson[c.lesson]===l.id)||cand[0];
  if(Array.isArray(w)){w[1]=o.zh;w[2]=o.defs[0];w[3]=o.exs[0];if(o.pos)w[4]=o.pos;}
  if(!seen.has(key)){VX[key]={d:o.defs,e:o.exs};seen.add(key);upd++;}
}));
console.log('updated',upd,'missing',miss);
let outTxt='/* ---------- DATA: [word, 中文, English meaning, example, pos] ; VX = 3 meanings / examples per word ---------- */\nconst RAW='+JSON.stringify(RAW,null,0).replace(/\},\{"id"/g,'},\n{"id"')+';\nconst VX='+JSON.stringify(VX)+';\n';
fs.writeFileSync('part_data.js',outTxt);
