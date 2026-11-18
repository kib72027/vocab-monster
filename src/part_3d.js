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
  if(n.add)gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
  const fl=E.flash[it.grp];gl.uniform4fv(u.uFlash,fl||[0,0,0,0]);
  gl.drawElements(gl.TRIANGLES,g.n,gl.UNSIGNED_SHORT,0);
  if(n.add)gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
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
  m.bob=.05*Math.sin(t*2.3);h.bob=.04*Math.sin(t*2.6+1);
  E.tl=E.tl.filter(e=>{if(t>=e.t){e.fn();return false;}return true;});
  E.tw=E.tw.filter(w=>{const u=(t-w.t0)/w.dur;if(u<0)return true;w.fn(cl(u));return u<1;});
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
  sm.forEach((q,i)=>{const o=q[0],n=E.shadows[i],jump=Math.max(0,o.off.y);n.p=[o.base[0]+o.off.x,.03,o.base[2]];const r=q[1]*(1-jump*.15);n.s=[r,.01,r*.7];tr.unshift({n,W:local(n),grp:'env'});});
  gl.disable(gl.BLEND);
  gl.enable(gl.CULL_FACE);
  
  gl.cullFace(gl.BACK);op.forEach(it=>drawItem(it,0,VP,eye));
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);tr.forEach(it=>drawItem(it,0,VP,eye));
  // sprites
  gl.disable(gl.CULL_FACE);
  if(E.tex.cloud)E.clouds.forEach(c=>{const x=((c.x+E.time*c.sp+60)%120)-60;sprite(E.tex.cloud,[x,c.y,c.z],c.s,c.s*.5,0,c.a,V,Pr);});
  gl.disable(gl.DEPTH_TEST);
  if(E.hero.himg){const o=E.hero,c=E.imgs['H'+o.himg],S=HSPR[o.himg];
    if(c&&!c.tex&&c.im.complete&&c.im.naturalWidth)c.tex=mkTex(c.im);
    if(c&&c.tex){const f=o.off,sq=f.sq,k=Math.max(.001,f.sc),asp=S.w/S.h,h0=Math.min(3.4,3.7/asp);
      const h=h0*k*sq,w=h0*asp*k*(1+(1-sq)*.6);
      sprite(c.tex,[o.base[0]+f.x,o.base[1]+f.y+h/2+.02,o.base[2]+.3],w/2,h/2,-f.rz*.6,1,V,Pr,E.flash.hero);}}
  if(E.mon.img){const o=E.mon,c=E.imgs[o.img],S=SPR(o.img);
    if(c&&!c.tex&&c.im.complete&&c.im.naturalWidth)c.tex=mkTex(c.im);
    if(c&&c.tex){const f=o.off,sq=f.sq*(f.sqi||1),k=Math.max(.001,f.sc),asp=S.w/S.h,h0=Math.min(E.big?4.3:3.5,3.9/asp);
      const h=h0*k*sq,w=h0*asp*k*(1+(1-sq)*.6);
      sprite(c.tex,[o.base[0]+f.x,o.base[1]+f.y+(o.bob||0)+h/2+.02,o.base[2]+.2],w/2,h/2,-f.rz*.6+f.ry*.0,1,V,Pr,E.flash.mon);}}
  gl.enable(gl.DEPTH_TEST);
  if(E.tex.cglow){const gp=.65+.35*Math.sin(E.time*2.2);[[-4.9,-1.7],[4.9,-1.7]].forEach(p=>sprite(E.tex.cglow,[p[0],4.6,p[1]],1.9*gp+.5,1.9*gp+.5,0,.9,V,Pr));}
  E.sprites.forEach(s=>sprite(s.tex,s.pos,s.w,s.h,s.rot,s.a,V,Pr));
  E.parts.forEach(p=>sprite(p.tex,[p.x,p.y,p.z],p.size,p.size,p.rot,Math.min(1,p.life/.4),V,Pr));
  gl.depthMask(true);
}
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
function heroAct(act,dur){const h=E.hero,hid=hid0(),th=ULT[hid]||ULT.h1,gl=utex(hid,th);
  const Q={lunge:[.45,1.7,.28,.3,0,.25],dash:[.6,2.6,.3,.35,0,.3],throw:[.5,.5,.4,.32,0,.3],draw:[.7,.2,.3,.1,0,.12],cast:[.1,.25,.08,.15,.55,.1]}[act]||[.4,1,.25,.25,0,.2];
  const bx=Q[0],fx=Q[1],rb=Q[2],rf=Q[3],yc=Q[4],yf=Q[5];
  at(.02,()=>{const p=hpos();flare([p[0]+.5,p[1]+.3,p[2]+.8],2.2,.35,gl);goldBurst([p[0]+.5,p[1]+.3,p[2]+.8],8,2,.4,.28,gl);});
  tween(dur,u=>{const T=.35,back=u<T?ease(u/T):1-ease(cl((u-T)/.2)),fwd=u<T?0:Math.sin(PI*cl((u-T)/(1-T)));
    h.off.x=-bx*back+fx*fwd;h.off.rz=rb*back-rf*fwd;h.off.sq=1-.12*back+.06*fwd;
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
function ultimate(sentence,hid){ // 大絕招 (per hero): the sentence's words are the ammo
  if(!E.mon)return;const th=ULT[hid]||ULT.h1,m=E.mon,star=ustar(hid,th),gl=utex(hid,th),slash=uslash(hid,th),FM=th.fall;
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
  const hit=(dt,small)=>at(dt,()=>{const t=hpos();burst(t,small?6:14,star,small?3:4.5,.4);goldBurst(t,small?10:24,4,.5,.36,gl);E.shake=Math.max(E.shake,small?.3:.7);E.flash.hero=[c[0]/255,c[1]/255,c[2]/255,small?.45:.8];
    if(!small)tween(.6,u=>{const e=Math.sin(PI*u)*Math.pow(1-u,.5);h.off.x=-.9*e;h.off.rz=.35*e;h.off.sq=1-.2*Math.sin(PI*cl(u*1.5));});});
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
}
function die(){
  if(!E.mon)return;const m=E.mon,h=E.hero,star=starTex();
  E.flash.mon=[1,1,1,.9];burst(mpos(),26,star,6,.55);
  tween(1.25,u=>{const e=ease(u);m.off.y=1.4*e;m.off.ry=14*e;m.off.sc=Math.max(.001,1-e);});
  at(.55,()=>burst(mpos(),18,star,5,.5));
  tween(1.1,u=>{h.off.y=.7*Math.abs(Math.sin(u*PI*2));h.armR.r[0]=-2.6*Math.sin(PI*cl(u*2));},.3);
}
function mount(slot){if(slot&&E.canvas&&E3.ok)slot.appendChild(E.canvas);}
function idle(){return!E.tw.length&&!E.tl.length;}
return{ensure,setup,attack,letter,finale,ultimate,ultName,hurt,die,mount,E,monModel,heroModel,burst,idle};
})();
