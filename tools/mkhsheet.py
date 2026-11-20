#!/usr/bin/env python3
"""Cut a hero's grid sprite sheets into transparent frames + generate src/part_hanim_<id>.js.
Input : assets/heroes/<id>/source/{idle,attack,hit,victory}.jpg  (green #00FF00 background; idle/attack/victory 4x2, hit 3x2)
Output: assets/heroes/<id>/frames/<action>_<n>.png and src/part_hanim_<id>.js
Frames are found as connected blobs (weapons may cross cell edges); each is placed on a shared canvas at its
cell-relative position, so feet baseline and body position stay consistent as drawn.
Usage : python3 tools/mkhsheet.py h2"""
import sys,os,io,base64,json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACT=[('idle','idle',8,4),('attack','attack',8,4),('hit','hit',6,3),('win','victory',8,4)]
SC=0.5
def key(im):
    a=np.asarray(im.convert('RGB')).astype(np.float32);r,g,b=a[...,0],a[...,1],a[...,2]
    d=g-np.maximum(r,b);al=np.clip((70-d)/50,0,1)
    g2=np.where(d>0,np.maximum(r,b),g)
    return np.dstack([r,g2,b,al*255]).astype(np.uint8),d
def bleed(im):
    # colour of fully transparent pixels = nearest opaque pixel, so bilinear filtering never mixes in white/green halos
    a=np.asarray(im).copy();m=a[...,3]>8
    if m.any():
        i=nd.distance_transform_edt(~m,return_distances=False,return_indices=True);a[...,:3]=a[i[0],i[1],:3]
    return Image.fromarray(a,'RGBA')
def webp(im,q=88):
    im=bleed(im);b=io.BytesIO();im.save(b,'WEBP',quality=q,method=2,exact=True);return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
def blobs(d,n):
    m=nd.binary_opening(d[::2,::2]<60,iterations=1);l,k=nd.label(nd.binary_dilation(m,iterations=3));l=np.kron(l,np.ones((2,2),int))[:d.shape[0],:d.shape[1]];m=np.kron(m,np.ones((2,2),bool))[:d.shape[0],:d.shape[1]]
    sz=nd.sum(m,l,range(1,k+1));ids=[i+1 for i,s in enumerate(sz) if s>3000]
    if len(ids)!=n:raise SystemExit(f'expected {n} frames, found {len(ids)}')
    return l,ids
def main(hid):
    base=os.path.join(R,'assets','heroes',hid);os.makedirs(base+'/frames',exist_ok=True)
    raw={};ext=[1e9,-1e9]
    for act,fn,n,cols in ACT:
        im=Image.open(f'{base}/source/{fn}.jpg');rgba,d=key(im);H,W=d.shape;l,ids=blobs(d,n);cw=W/cols;rh=H/2;fr=[]
        info=[]
        for i in ids:
            ys,xs=np.where(l==i);info.append((int(ys.mean()>=rh),xs.mean(),i))
        info.sort();
        for row,cx,i in info:
            c=int(cx//cw);ox=int(c*cw+cw/2);oy=int(row*rh)
            mk=(l==i)
            pic=rgba.copy();pic[...,3]=np.where(mk,pic[...,3],0)
            ys,xs=np.where(mk&(pic[...,3]>20));bb=(xs.min(),ys.min(),xs.max()+1,ys.max()+1)
            # canvas coords: x rel. to cell centre, y rel. to cell top
            lo=ys>=bb[3]-0.12*(bb[3]-bb[1]);fr.append([pic,ox,oy,bb,row,xs[lo].mean()])  # feet-x: boots stay planted, so alignment on them keeps the body steady
        # rows are drawn at different heights by the AI: align each row's feet to the sheet's lowest feet;
        # idle is a standing loop, so align every frame's feet and body centre to frame 0
        mb=max(f[3][3]-f[2] for f in fr)
        for r_ in (0,1):
            rb=[f[3][3]-f[2] for f in fr if f[4]==r_]
            if rb:
                for f in fr:
                    if f[4]==r_:f[2]-=mb-max(rb)
        if act=='idle':
            f0=fr[0]
            for f in fr:
                f[2]=f[2]+(f[3][3]-f[2])-(f0[3][3]-f0[2])-(f[3][3]-f[2])+(f[3][3]-f[2])  # placeholder, replaced below
                f[2]=f[3][3]-(f0[3][3]-f0[2]);f[1]=f[5]-(f0[5]-f0[1])
        if act=='idle':REF=(fr[0][3][3]-fr[0][2],fr[0][5]-fr[0][1])
        else:   # start pose of every action sits exactly where the idle pose is, so actions join without a jump
            f=fr[0];db=(f[3][3]-f[2])-REF[0];dx=(f[5]-f[1])-REF[1]
            for g in fr:g[2]+=db;g[1]+=dx
        for f in fr:
            ext[0]=min(ext[0],f[3][1]-f[2]);ext[1]=max(ext[1],f[3][3]-f[2])
        raw[act]=fr
    top=max(0,int(ext[0])-12);bot=int(ext[1])+12;CWs=1000;CH=bot-top
    data={};portrait=None
    for act,fr in raw.items():
        out=[];sm=[]
        for k,(pic,ox,oy,bb,_r,_c) in enumerate(fr):
            cv=Image.new('RGBA',(CWs,CH),(0,0,0,0));reg=Image.fromarray(pic).crop(bb)
            cv.alpha_composite(reg,(int(round(bb[0]-ox+CWs//2)),int(round(bb[1]-oy-top))))
            cv=cv.resize((int(CWs*SC),int(CH*SC)),Image.LANCZOS);cv.save(f'{base}/frames/{act}_{k}.png')
            out.append({'u':webp(cv),'w':cv.width,'h':cv.height});sm.append(np.asarray(cv.resize((125,int(125*cv.height/cv.width)))).astype(float))
            if act=='idle' and k==0:
                bbx=cv.getbbox();portrait=cv.crop((bbx[0]-4,bbx[1]-4,bbx[2]+4,bbx[3]+4));ch=bbx[3]-bbx[1]
        if act=='idle':
            # AI idle sheets often turn the head or change pose between frames; cross-fading those looks choppy.
            # Keep only frames that look like frame 0, chained into a loop; if none do, use frame 0 alone (engine adds breathing).
            d=lambda i,j:np.abs(sm[i]-sm[j]).mean();keep=[0];rest=[i for i in range(1,len(out)) if d(0,i)<3.6]
            while rest:
                j=min(rest,key=lambda i:d(keep[-1],i));keep.append(j);rest.remove(j)
            out=[out[i] for i in keep];print(' idle loop frames',keep)
        data[act]=out
    portrait.save(f'{base}/frames/portrait.png')
    kk=round(3.4*(CH*SC)/ch/1.12,2)
    js='/* generated by tools/mkhsheet.py */\nconst HANIM=(typeof HANIM!=="undefined")?HANIM:{};\n'
    js=js.replace('const HANIM=(typeof HANIM!=="undefined")?HANIM:{};','if(typeof HANIM==="undefined")var HANIM={};')
    js+=f'HANIM[{json.dumps(hid)}]=Object.assign({{k:{kk}}},{json.dumps(data,separators=(",",":"))});\n'
    js+=f'HSPR[{json.dumps(hid)}]={{u:{json.dumps(webp(portrait,90))},w:{portrait.width},h:{portrait.height}}};\n'
    p=os.path.join(R,'src',f'part_hanim_{hid}.js');open(p,'w').write(js);print(hid,'canvas',cv.size,'k',kk,len(js)//1024,'KB')
if __name__=='__main__':main(sys.argv[1])
