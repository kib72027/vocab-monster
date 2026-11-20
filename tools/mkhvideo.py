#!/usr/bin/env python3
"""Hero animation frames from videos (instead of grid sprite sheets) -> src/part_hanim_<id>.js
Input : assets/video/<id>/<id>_{idle,attack,hit,victory}.mp4  (solid green background, fixed camera)
        assets/video/<id>/frames.json  which video frames to use, e.g.
          {"idle":"auto", "attack":[14,20,...], "hit":[...], "win":[...], "flip":["idle"]}
        "flip" (optional) mirrors clips that the video AI drew facing left; every action must face right like the others.
        "auto" = every IDLE_STEP-th frame from 0 up to the frame that best matches frame 0 (seamless loop).
Output: assets/heroes/<id>/frames/<action>_<n>.png, src/part_hanim_<id>.js (HANIM + HSPR portrait)
Why pick frames by hand: AI video smears fast strikes (motion blur, baked-in slash arcs, a dagger through the face);
skip those frames, the engine draws its own attack effects. Adjacent video frames are close, so whole sequences can
be played (unlike grid sheets, which jump between poses and need key poses only).
Engine timing: attack ~0.75 s, hit 0.7 s, win 1.3 s then holds its LAST frame; idle runs at HANIM.fps.
Start attack/hit near the idle pose and end back in it, or the switch to/from idle jumps; pick frames densely (every 2-4).
Usage : python3 tools/mkhvideo.py h7"""
import sys,os,json
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as nd
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from mkhsheet import webp
from nmcut2 import key as dkey   # colour-distance matting: keeps green clothes (h3) that a hue key would cut away
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACT=[('idle','idle'),('attack','attack'),('hit','hit'),('win','victory')]
CHAR_H=260      # character height in output pixels (on screen the engine scales by k, so this only sets texture detail; keeps 10 heroes ~1.5 MB each)
DESPILL=False   # set per hero by frames.json "despill": true
IDLE_STEP=3     # idle plays at video_fps/IDLE_STEP (HANIM.fps); the engine blends neighbouring frames, so 8 fps still looks smooth
def read(path,want=None):
    cap=cv2.VideoCapture(path);fr={};i=0;read.fps=cap.get(cv2.CAP_PROP_FPS) or 24
    while True:
        ok,f=cap.read()
        if not ok:break
        if want is None or i in want:fr[i]=cv2.cvtColor(f,cv2.COLOR_BGR2RGB)
        i+=1
    return fr,i
def cutout(rgb):
    # work on the character's region only (matting a whole 1080p frame is slow)
    g=rgb.astype(int);bg=np.median(np.concatenate([g[:8,:8].reshape(-1,3),g[:8,-8:].reshape(-1,3)]),0)
    ys,xs=np.nonzero(np.abs(g-bg).sum(-1)>90);P=40
    y0,y1,x0,x1=max(0,ys.min()-P),min(rgb.shape[0],ys.max()+P),max(0,xs.min()-P),min(rgb.shape[1],xs.max()+P)
    sub,_=dkey(rgb[y0:y1,x0:x1],bg)
    if DESPILL:   # heroes with no green in their design: glows that mixed with the green screen turn back to blue/cyan
        c=sub[...,:3].astype(int);mx=np.maximum(c[...,0],c[...,2]);c[...,1]=np.minimum(c[...,1],mx);sub[...,:3]=c
    rgba=np.zeros(rgb.shape[:2]+(4,),np.uint8);rgba[y0:y1,x0:x1]=sub
    m=rgba[...,3]>128;lab,n=nd.label(nd.binary_dilation(m[::4,::4],iterations=4))
    if n>1:   # keep the character, drop compression specks
        sz=nd.sum(m[::4,::4],lab,range(1,n+1));big=max(sz)
        keep=np.kron(np.isin(lab,[i+1 for i,s in enumerate(sz) if s>0.02*big]),np.ones((4,4),bool))[:m.shape[0],:m.shape[1]]
        keep=np.pad(keep,((0,m.shape[0]-keep.shape[0]),(0,m.shape[1]-keep.shape[1])))
        rgba[...,3]=np.where(keep,rgba[...,3],0)
    return rgba
def feet(a):
    ys,xs=np.nonzero(a[...,3]>128);lo=ys>=ys.max()-0.08*(ys.max()-ys.min())
    return xs[lo].mean(),ys.max(),(xs.min(),ys.min(),xs.max()+1,ys.max()+1)
def main(hid):
    global DESPILL
    vd=os.path.join(R,'assets','video',hid);cfg=json.load(open(f'{vd}/frames.json',encoding='utf-8'));DESPILL=bool(cfg.get('despill'))
    out=os.path.join(R,'assets','heroes',hid,'frames');os.makedirs(out,exist_ok=True)
    for f in os.listdir(out):
        if f.endswith('.png'):os.remove(os.path.join(out,f))
    raw={}
    for act,fn in ACT:
        path=f'{vd}/{hid}_{fn}.mp4';pick=cfg[act]
        if pick=='auto':
            th,n=read(path);sm={i:cv2.resize(f,(240,135)).astype(float) for i,f in th.items()}
            L=min(range(int(n*.6),n),key=lambda i:np.abs(sm[i]-sm[0]).mean())
            pick=list(range(0,L,IDLE_STEP));print(f' idle loop ends at frame {L}: {len(pick)} frames')
            fr={i:th[i] for i in pick}
        else:fr,n=read(path,set(pick))
        missing=[i for i in pick if i not in fr]
        if missing:raise SystemExit(f'{act}: frames {missing} not in video ({n} frames)')
        raw[act]=[cutout(fr[i]) for i in pick]
        if act in cfg.get('flip',[]):raw[act]=[np.ascontiguousarray(a[:,::-1]) for a in raw[act]]   # clip drawn facing the other way (h6 idle faces left)
    # fixed camera: keep every clip as drawn, but put each clip's first frame (the shared start pose) where idle's first frame is
    fx0,fy0,_=feet(raw['idle'][0]);place={}
    for act,L in raw.items():
        fx,fy,_=feet(L[0]);place[act]=(fx0-fx,fy0-fy)
    bbs=[]
    for act,L in raw.items():
        dx,dy=place[act]
        for a in L:
            ys,xs=np.nonzero(a[...,3]>20);bbs.append((xs.min()+dx,ys.min()+dy,xs.max()+dx,ys.max()+dy))
    bbs=np.array(bbs);half=max(fx0-bbs[:,0].min(),bbs[:,2].max()-fx0)+16;top=bbs[:,1].min()-16;bot=bbs[:,3].max()+16
    _,_,b0=feet(raw['idle'][0]);sc=CHAR_H/(b0[3]-b0[1])
    W=int(2*half);H=int(bot-top);OW,OH=round(W*sc),round(H*sc)
    imgs={}
    for act,L in raw.items():
        dx,dy=place[act];imgs[act]=[]
        for k,a in enumerate(L):
            cv=Image.new('RGBA',(W,H),(0,0,0,0));cv.alpha_composite(Image.fromarray(a),(int(round(half-fx0+dx)),int(round(-top+dy))))
            cv=cv.resize((OW,OH),Image.LANCZOS);cv.save(f'{out}/{act}_{k}.png');imgs[act].append(cv)
    data={act:[{'u':webp(cv,76),'w':cv.width,'h':cv.height} for cv in L] for act,L in imgs.items()}
    pc=imgs['idle'][0];bx=pc.getbbox();portrait=pc.crop((bx[0]-4,bx[1]-4,bx[2]+4,bx[3]+4));portrait.save(f'{out}/portrait.png')
    kk=round(3.4*OH/(bx[3]-bx[1])/1.12,2)
    js='/* generated by tools/mkhvideo.py from assets/video/'+hid+'/ */\nif(typeof HANIM==="undefined")var HANIM={};\n'
    js+=f'HANIM[{json.dumps(hid)}]=Object.assign({{k:{kk},fps:{round(read.fps/IDLE_STEP,2)}}},{json.dumps(data,separators=(",",":"))});\n'
    js+=f'HSPR[{json.dumps(hid)}]={{u:{json.dumps(webp(portrait,90))},w:{portrait.width},h:{portrait.height}}};\n'
    p=os.path.join(R,'src',f'part_hanim_{hid}.js');open(p,'w',encoding='utf-8').write(js)
    print(hid,'canvas',(OW,OH),'k',kk,{a:len(v) for a,v in imgs.items()},len(js)//1024,'KB')
if __name__=='__main__':main(sys.argv[1])
