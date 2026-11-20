#!/usr/bin/env python3
"""Cut a hero's grid sprite sheets into transparent frames + generate src/part_hanim_<id>.js.
Input : assets/heroes/<id>/source/{idle,attack,hit,victory}.jpg  (green #00FF00 background; idle/attack/victory 4x2, hit 3x2)
Output: assets/heroes/<id>/frames/<action>_<n>.png and src/part_hanim_<id>.js
Frames are assigned to grid cells (blobs crossing a border are split, stray bits dropped); each is placed on a shared canvas at its
cell-relative position, so feet baseline and body position stay consistent as drawn.
Usage : python3 tools/mkhsheet.py h2"""
import sys,os,io,base64,json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACT=[('idle','idle',8,4),('attack','attack',8,4),('hit','hit',6,3),('win','victory',8,4)]   # specified frames / columns; grid() checks the real column count
SC=0.5
DEBUG=0
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
def blobs(d,cols,rows=2):
    """One mask per grid cell, in frame order. A blob belongs to the cell holding most of its pixels
    (weapons may stick out of their cell); a blob that is big in two cells (two frames touching) is split at the cell border.
    Tiny specks are dropped."""
    H,W=d.shape;cw=W/cols;rh=H/rows
    m=nd.binary_opening(d<60,iterations=1);l,k=nd.label(nd.binary_dilation(m,iterations=2));l[~m]=0
    cell=(np.minimum((np.arange(H)//rh).astype(int),rows-1)[:,None]*cols+np.minimum((np.arange(W)//cw).astype(int),cols-1)[None,:])
    out=[np.zeros((H,W),bool) for _ in range(cols*rows)];small=[]
    for i,sl in enumerate(nd.find_objects(l),1):
        if sl is None:continue
        mk=l[sl]==i;n=mk.sum()
        if n<800:continue
        if n<20000:small.append((sl,mk));continue
        cs=cell[sl][mk];cnt=np.bincount(cs,minlength=cols*rows)
        big=[c for c in range(cols*rows) if cnt[c]>max(8000,0.25*n)]
        if len(big)>1:
            if DEBUG:print("split",big,cnt.tolist())
            # two frames touch (e.g. a sword tip touching the boot of the frame above): split at the cell border,
            # then anything of the upper frame hanging below its feet (a thin tip) is handed to the frame below
            cl=cell[sl].copy();y0=sl[0].start
            for c in big:
                r_=c//cols
                if r_+1>=rows or c+cols not in big:continue
                pc=mk&(cl==c);op=nd.binary_opening(pc,structure=np.ones((1,61),bool))   # rows with a run >= 61 px: boots yes, a blade tip no
                if not op.any():continue
                fb=np.nonzero(op.any(1))[0].max()+3          # feet bottom of the solid body
                if DEBUG:print(" cell",c,"fb",fb+y0)
                yy=np.arange(pc.shape[0])[:,None]+y0
                hang=pc&(np.arange(pc.shape[0])[:,None]>fb)&(yy>=(r_+1)*rh-150)
                cl[hang]=c+cols
            for c in set(cl[mk].tolist()):out[c][sl]|=mk&(cl==c)
        else:out[int(cnt.argmax())][sl]|=mk
    # detached pieces (a weapon tip poking into the next cell) go to the nearest character, not to the cell they sit in
    dist=[nd.distance_transform_edt(~o[::4,::4]) for o in out]
    for sl,mk in small:
        ys,xs=np.nonzero(mk);ys=(ys+sl[0].start)//4;xs=(xs+sl[1].start)//4
        ys=np.minimum(ys,dist[0].shape[0]-1);xs=np.minimum(xs,dist[0].shape[1]-1)
        c=int(np.argmin([dt[ys,xs].min() for dt in dist]));out[c][sl]|=mk
    for c,o in enumerate(out):
        # drop stray bits (e.g. a neighbour's weapon tip) that are not near this cell's character
        g,kk=nd.label(nd.binary_dilation(o[::4,::4],iterations=6))
        if kk>1:
            szs=nd.sum(o[::4,::4],g,range(1,kk+1));keep=np.kron(g==int(np.argmax(szs))+1,np.ones((4,4),bool))[:H,:W]
            out[c]=o=o&np.pad(keep,((0,max(0,H-keep.shape[0])),(0,max(0,W-keep.shape[1]))))
        if o.sum()<20000:raise SystemExit(f'cell {c} is empty or too small ({o.sum()} px)')
    return out
def grid(d,want):
    """The image AI does not always follow the requested column count (e.g. an 8-frame hit sheet).
    Try 3 and 4 columns and keep the one whose characters sit closest to their cell centres."""
    best=None;W=d.shape[1]
    for cols in dict.fromkeys((want,3,4)):
        try:cells=blobs(d,cols)
        except SystemExit:continue
        cw=W/cols;err=0
        for ci,mk in enumerate(cells):
            xs=np.nonzero(mk.any(0))[0];c=ci%cols;err+=abs((xs.min()+xs.max())/2-(c+.5)*cw)/cw
            lb,nb=nd.label(mk[::4,::4]);err+=sum(s>1250 for s in nd.sum(mk[::4,::4],lb,range(1,nb+1)))-1   # a wrong grid cuts characters in pieces
        err/=len(cells)
        if best is None or err<best[0]-0.02:best=(err,cols,cells)
    if best is None:raise SystemExit('no 3x2 or 4x2 grid fits this sheet')
    return best[1],best[2]
def main(hid):
    base=os.path.join(R,'assets','heroes',hid);os.makedirs(base+'/frames',exist_ok=True)
    raw={};ext=[1e9,-1e9]
    for act,fn,n,cols in ACT:
        im=Image.open(f'{base}/source/{fn}.jpg');rgba,d=key(im);H,W=d.shape;fr=[]
        cols,cells=grid(d,cols);cw=W/cols;rh=H/2
        if cols*2!=n:print(f' {act}: sheet is {cols}x2, not the specified {n//2}x2')
        for ci,mk in enumerate(cells):
            row,c=divmod(ci,cols);ox=int(c*cw+cw/2);oy=int(row*rh)
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
    top=max(0,int(ext[0])-12);bot=int(ext[1])+12;CWs=1400;CH=bot-top
    imgs={};sm={}
    for act,fr in raw.items():
        imgs[act]=[];sm[act]=[]
        for k,(pic,ox,oy,bb,_r,_c) in enumerate(fr):
            cv=Image.new('RGBA',(CWs,CH),(0,0,0,0));reg=Image.fromarray(pic).crop(bb)
            cv.alpha_composite(reg,(int(round(bb[0]-ox+CWs//2)),int(round(bb[1]-oy-top))))
            cv=cv.resize((int(CWs*SC),int(CH*SC)),Image.LANCZOS);cv.save(f'{base}/frames/{act}_{k}.png')
            imgs[act].append(cv);sm[act].append(np.asarray(cv.resize((125,int(125*cv.height/cv.width)))).astype(float))
    d=lambda x,y:np.abs(x-y).mean()
    # Idle reference = the idle frame that best matches how the other actions start and end
    # (AI sheets sometimes draw idle front-facing but attacks 3/4-facing; matching avoids a pop when an action starts).
    ends=[sm[a][0] for a in ('attack','hit','win')]+[sm[a][-1] for a in ('attack','hit','win')]
    I=sm['idle'];ref=min(range(len(I)),key=lambda i:sum(d(I[i],e) for e in ends))
    # Keep only idle frames close to the reference, chained into a loop (cross-fading very different poses looks choppy);
    # if none are close, the reference frame is used alone and the engine adds breathing.
    keep=[ref];rest=[i for i in range(len(I)) if i!=ref and d(I[ref],I[i])<5.0]
    while rest:
        j=min(rest,key=lambda i:d(I[keep[-1]],I[i]));keep.append(j);rest.remove(j)
    print(' idle ref',ref,'loop',keep)
    data={}
    for act in imgs:
        # Attack/hit: AI frames jump between poses and facings, which looks choppy however it is blended.
        # Use only key poses (wind-up, strike / flinch); the engine fades idle -> pose -> idle and adds the motion.
        KEY={'attack':[3,5,5],'hit':[1,1]}
        L=[imgs['idle'][i] for i in keep] if act=='idle' else [imgs[act][i] for i in KEY[act]] if act in KEY else imgs[act]
        data[act]=[{'u':webp(cv),'w':cv.width,'h':cv.height} for cv in L]
    pc=imgs['idle'][ref];bbx=pc.getbbox();portrait=pc.crop((bbx[0]-4,bbx[1]-4,bbx[2]+4,bbx[3]+4));ch=bbx[3]-bbx[1]
    portrait.save(f'{base}/frames/portrait.png')
    kk=round(3.4*(CH*SC)/ch/1.12,2)
    js='/* generated by tools/mkhsheet.py */\nconst HANIM=(typeof HANIM!=="undefined")?HANIM:{};\n'
    js=js.replace('const HANIM=(typeof HANIM!=="undefined")?HANIM:{};','if(typeof HANIM==="undefined")var HANIM={};')
    js+=f'HANIM[{json.dumps(hid)}]=Object.assign({{k:{kk}}},{json.dumps(data,separators=(",",":"))});\n'
    js+=f'HSPR[{json.dumps(hid)}]={{u:{json.dumps(webp(portrait,90))},w:{portrait.width},h:{portrait.height}}};\n'
    p=os.path.join(R,'src',f'part_hanim_{hid}.js');open(p,'w').write(js);print(hid,'canvas',cv.size,'k',kk,len(js)//1024,'KB')
if __name__=='__main__':main(sys.argv[1])
