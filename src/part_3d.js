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
    sprite(q.tex,[X(u),Y(q.v),0],hw(s)*(q.ar||1),hh(s),q.rot||0,a,I,I);});
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
    E.u=U(E.pg,['uM','uVP','uNM','uOut','uPass','uCol','uL','uEye','uFlash','uAlpha','uMode','uTime','uRC','uRot2','uTex2']);E.us=U(E.ps,['uC','uS','uV','uPr','uRot','uTex','uA','uF']);
    E.qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,E.qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    arenaTexs();gl.uniform1i(E.u.uTex2,1);
    E3.ok=true;E.last=performance.now();
    if(!E.run){E.run=true;requestAnimationFrame(frame);}
    return true;
  }catch(e){E3.ok=false;E3.err=String(e&&e.message||e);return false;}
}
const SPR=id=>(typeof MSPR!=='undefined'&&MSPR[id])||(typeof RSPR!=='undefined'&&RSPR[id])||(typeof LSPR!=='undefined'&&LSPR[id])||null;
const MINFO=id=>(typeof MBY!=='undefined'&&MBY[id])||(typeof LMON!=='undefined'&&LMON.find(m=>m.id===id))||{};
function mon0(id){return E.big?3.3:2.8;}
function setup(monId,eq,hid,big){
  E.big=!!big;
  const m=SPR(monId)?{root:Gp(),sc:1}:monModel(monId),h=heroModel(eq);
  const SP=SPR(monId);if(SP&&!E.imgs[monId]){const im=new Image();im.src=SP.u;E.imgs[monId]={im,tex:null};}
  const mon={nf:MINFO(monId).f===0,img:SP?monId:null,root:SP?Gp():m.root,base:[E.big?3.4:3.0,0,.1],ry:-.8,sc:m.sc,off:{x:0,y:0,sq:1,rz:0,ry:0,sc:1},id:monId};
  const HA0=(typeof HANIM!=='undefined')&&hid&&HANIM[hid];if(HA0&&!HA0._ld){HA0._ld=1;['idle','attack','hit','win'].forEach(k=>HA0[k].forEach(f=>{const im=new Image();im.src=f.u;f.im=im;f.tex=null;if(im.decode)im.decode().catch(()=>{});}));}
  const HS=(typeof HSPR!=='undefined')&&hid&&HSPR[hid];if(HS&&!E.imgs['H'+hid]){const im=new Image();im.src=HS.u;E.imgs['H'+hid]={im,tex:null};}
  const hero={himg:HS?hid:null,root:HS?Gp():h.root,base:[-2.75,0,.4],ry:.8,sc:1,off:{x:0,y:0,sq:1,rz:0,ry:0,sc:1},armR:HS?{r:[0,0,0]}:h.armR,hand:h.hand,head:h.head};
  E.mon=mon;E.hero=hero;E.parts=[];E.tw=[];E.tl=[];E.sprites=[];E.flash={mon:null,hero:null};E.shake=0;
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
  ambInit();
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
function sprite(tex,pos,w,h,rot,a,V,Pr,F){
  const gl=E.gl,s=E.us;gl.useProgram(E.ps);gl.bindBuffer(gl.ARRAY_BUFFER,E.qb);gl.enableVertexAttribArray(0);gl.disableVertexAttribArray(1);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.uniform3fv(s.uC,pos);gl.uniform2f(s.uS,w,h);gl.uniformMatrix4fv(s.uV,false,V);gl.uniformMatrix4fv(s.uPr,false,Pr);gl.uniform1f(s.uRot,rot||0);gl.uniform1f(s.uA,a);gl.uniform4fv(s.uF,F||[0,0,0,0]);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(s.uTex,0);gl.disable(gl.DEPTH_TEST);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.enable(gl.DEPTH_TEST);
}
const ease=u=>u<0?0:u>1?1:u*u*(3-2*u);
const cl=u=>u<0?0:u>1?1:u;
function update(dt){
  const t=E.time;
  ambUpdate(dt);
  if(E.mon&&E.tex.glow&&Math.random()<dt*5)E.parts.push({x:-10+Math.random()*20,y:.4+Math.random()*4.5,z:-5+Math.random()*7,vx:.12+Math.random()*.2,vy:.04+Math.random()*.1,vz:0,g:0,life:4,max:4,size:.05+Math.random()*.06,tex:E.tex.glow,rot:0,vr:0,al:.65});   // drifting pollen / light motes
  // idle
  [E.mon,E.hero].forEach((o,i)=>{if(!o)return;o.off.sqi=1+.03*Math.sin(t*2.3+i);});
  const m=E.mon,h=E.hero;if(!m)return;
  m.bob=.05*Math.sin(t*2.3);h.bob=.04*Math.sin(t*2.6+1);m.idz=.016*Math.sin(t*1.7+1);h.idz=.012*Math.sin(t*2.1);
  [['mon',m],['hero',h]].forEach(([k,o])=>{const fl=E.flash[k];if(fl&&fl[3]>.3&&fl!==o._lf){o._lf=fl;o.jit=Math.min(1,fl[3]+.2);}o.jit=Math.max(0,(o.jit||0)-dt*3.2);o.jx=(o.jit||0)*Math.sin(t*70)*.16;});
  {const cur=E.tl;E.tl=[];cur.forEach(e=>{if(t>=e.t)e.fn();else E.tl.push(e);});}
  {const cur=E.tw,keep=[];E.tw=[];cur.forEach(w=>{const u=(t-w.t0)/w.dur;if(u<0){keep.push(w);return;}w.fn(cl(u));if(u<1)keep.push(w);});E.tw=keep.concat(E.tw);}
  E.parts=E.parts.filter(p=>{p.life-=dt;if(p.life<=0)return false;p.vy-=p.g*dt;if(p.dr){const k=Math.max(0,1-p.dr*dt);p.vx*=k;p.vy*=k;p.vz*=k;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.vr*dt;if(p.gs)p.size=Math.max(.02,p.size+p.gs*dt);return true;});   // gs: size change per second, dr: drag
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
    if(c&&c.tex){const f=o.off,sq=f.sq*(f.sqi||1),k=Math.max(.001,f.sc),asp=S.w/S.h,M=E.big?3.45:3.0,h0=Math.min(E.big?4.2:3.6,(E.big?5.2:4.6)/asp,M/Math.sqrt(asp));   // same visual area (sqrt(w*h)=M) for every monster: slimes, golems and long dragons look equally heavy next to the hero
      const h=h0*k*sq,w=(o.nf?1:-1)*h0*asp*k*(1+(1-sq)*.6),rot=-f.rz*.6-(o.idz||0);   // mirror art drawn facing right so every monster faces the hero (o.nf: already faces left)
      sprite(c.tex,[o.base[0]+f.x+(o.jx||0)+PSG*Math.sin(rot)*h/2,o.base[1]+f.y+(o.bob||0)+Math.cos(rot)*h/2+.02,o.base[2]+.2],w/2,h/2,rot,f.al==null?1:f.al,V,Pr,E.flash.mon);}}
  gl.enable(gl.DEPTH_TEST);
  E.sprites.forEach(s=>sprite(s.tex,s.pos,s.w,s.h,s.rot,s.a,V,Pr));
  E.parts.forEach(p=>sprite(p.tex,[p.x,p.y,p.z],p.size,p.size,p.rot,Math.min(1,p.life/.4)*(p.al||1),V,Pr));
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
function ustar(hid,th){const k='us'+hid;if(E.tex[k])return E.tex[k];return E.tex[k]=mkTexA(sparkle(th.c),th.c);}
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
function hitstop(d){E.hs=Math.max(E.hs||0,d);}
function sigRing(t,R,dur){hitstop(.11);const G=E.ulgl||E.tex.gold,ST=E.ulstar||G,wave={tex:G,pos:[t[0],t[1]+.3,t[2]+.4],w:0,h:0,rot:0,a:0};E.sprites.push(wave);
  tween(.9,u=>{const e=1-Math.pow(1-u,3);wave.w=wave.h=1.5+7.5*e;wave.a=.55*(1-u)*(1-u);});at(.95,()=>{const j=E.sprites.indexOf(wave);if(j>=0)E.sprites.splice(j,1);});
  at(.15,()=>{for(let j=0;j<22;j++){const a=Math.random()*PI*2,v=.6+Math.random()*1.6;E.parts.push({x:t[0]+(Math.random()-.5)*1.4,y:t[1]+(Math.random()-.2)*1.6,z:t[2]+.5,vx:Math.cos(a)*v,vy:.4+Math.random()*1.0,vz:0,g:-.3,dr:1.2,life:1.4+Math.random()*.6,max:2,size:.12+Math.random()*.16,gs:-.05,tex:Math.random()<.55?ST:G,rot:Math.random()*6,vr:1.5});}});
  const rg=E.ring;if(rg)tween(dur,u=>{rg.p=[t[0],.05,t[2]];const r=.3+R*u;rg.s=[r,.01,r];rg.a=.95*(1-u);});}
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
  at(.3,()=>{try{SFX.matk(type)}catch(e){}});   // launch sound, per element
  const hit=(dt,small)=>{HT=Math.max(HT,dt+.12);at(dt,()=>{try{SFX.impact(small)}catch(e){}const t=hpos();burst(t,small?6:14,star,small?3:4.5,.4);goldBurst(t,small?10:24,4,.5,.36,gl);E.shake=Math.max(E.shake,small?.3:.7);E.flash.hero=[c[0]/255,c[1]/255,c[2]/255,small?.45:.8];
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
return{ensure,setup,forceBg,attack,letter,finale,ultimate,ultName,hurt,die,mount,E,monModel,heroModel,burst,idle};
})();
