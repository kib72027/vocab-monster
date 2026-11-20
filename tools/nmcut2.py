#!/usr/bin/env python3
"""Cut the monster sheets (assets/monsters/monster-sheet-1..5.jpg, 4x4, solid magenta or green background)
into transparent sprites and replace their RSPR entries in src/part_roster.js.
Sheet k holds monsters n{16(k-1)+1 .. 16k}, row by row (80 monsters). Names, roles and MPLAN live in part_roster.js.
Usage : python3 tools/nmcut2.py            (writes src/part_roster.js, cut-outs in assets/monsters/cut/)
        python3 tools/nmcut2.py --dry      (previews only)"""
import sys,os,io,re,base64
import numpy as np
from PIL import Image
from scipy import ndimage as nd
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V2=os.path.join(R,'assets','monsters')
BOX=(360,264)      # max sprite size (old art was 300x220); the engine only uses the aspect ratio
def bgkind(a):
    e=np.concatenate([a[:8].reshape(-1,3),a[-8:].reshape(-1,3),a[:,:8].reshape(-1,3),a[:,-8:].reshape(-1,3)]);r,g,b=np.median(e,0)
    return 'green' if g>r and g>b else 'magenta'
def key(a,bgc=None):
    """alpha from 'how much background colour' a pixel has; only background connected to the sheet border is removed,
    so purple/pink/green parts inside a monster stay opaque. Semi-transparent edges are un-mixed from the background (no fringe).
    bgc: the measured background colour (videos are not pure #00FF00); default = pure key colour."""
    a=a.astype(np.float32);r,g,b=a[...,0],a[...,1],a[...,2];kind=bgkind(a)
    if kind=='green':d=g-np.maximum(r,b);bg=np.array([0,255,0],np.float32)
    else:d=np.minimum(r,b)-g;bg=np.array([255,0,255],np.float32)
    if bgc is not None:bg=np.asarray(bgc,np.float32)
    dist=np.sqrt(((a-bg)**2).sum(-1))   # distance to the pure key colour; rim light that reflects the key colour stays well above 80
    # background = strongly bg-coloured pixels; enclosed pockets (inside tentacle loops, between legs) count too,
    # since no monster part is that saturated green/magenta (the sheet is chosen so)
    cand=dist<80;lab,n=nd.label(cand);ids=np.arange(1,n+1)
    sz=nd.sum(cand,lab,ids);md=nd.median(dist,lab,ids)
    border=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
    # border-connected regions are background; an enclosed pocket only if it really is the flat background colour
    # (purple/pink highlights on a monster are bg-ish but much further from pure #FF00FF / #00FF00)
    bgreg=np.isin(lab,[i for i in ids if i in border or (sz[i-1]>=6 and md[i-1]<60)])
    fg=~bgreg;core=nd.binary_erosion(fg,iterations=3)
    # matting in the edge band: obs = A*F + (1-A)*bg, with F = colour of the nearest solid interior pixel
    idx=nd.distance_transform_edt(~core,return_distances=False,return_indices=True);F=a[idx[0],idx[1]]
    band=nd.binary_dilation(fg,iterations=2)&~core
    v=F-bg;A=np.clip(((a-bg)*v).sum(-1)/np.maximum((v*v).sum(-1),1),0,1)
    al=np.where(core,1.0,np.where(band,A,0.0))
    A3=al[...,None];rgb=np.where(band[...,None]&(A3>0.05),(a-(1-A3)*bg)/np.maximum(A3,0.05),a)
    rgb=np.where(band[...,None],np.clip(rgb,np.minimum(F,a)-40,np.maximum(F,a)+40),rgb)   # no colour overshoot on the rim
    al=nd.gaussian_filter(al,0.6)*(al>0)
    return np.dstack([np.clip(rgb,0,255),np.clip(al,0,1)*255]).astype(np.uint8),kind
def cells(alpha,cols=4,rows=4):
    H,W=alpha.shape;cw=W/cols;rh=H/rows
    m=alpha>40;lab,n=nd.label(nd.binary_dilation(m,iterations=2));lab[~m]=0
    cy=np.minimum((np.arange(H)//rh).astype(int),rows-1);cx=np.minimum((np.arange(W)//cw).astype(int),cols-1)
    cell=cy[:,None]*cols+cx[None,:]
    out=[np.zeros((H,W),bool) for _ in range(cols*rows)];small=[]
    for i,sl in enumerate(nd.find_objects(lab),1):
        if sl is None:continue
        mk=lab[sl]==i;s=mk.sum()
        if s<60:continue
        if s<6000:small.append((sl,mk));continue
        cnt=np.bincount(cell[sl][mk],minlength=cols*rows);big=[c for c in range(cols*rows) if cnt[c]>0.2*s]
        if len(big)>1:
            print('  warning: two monsters touch, split at cell border',big)
            for c in big:out[c][sl]|=mk&(cell[sl]==c)
        else:out[int(cnt.argmax())][sl]|=mk
    dist=[nd.distance_transform_edt(~o[::4,::4]) for o in out]
    for sl,mk in small:   # loose bits (slime drops, sparks) belong to the nearest monster; far-away specks are dropped
        ys,xs=np.nonzero(mk);ys=np.minimum((ys+sl[0].start)//4,dist[0].shape[0]-1);xs=np.minimum((xs+sl[1].start)//4,dist[0].shape[1]-1)
        dd=[dt[ys,xs].min() for dt in dist];c=int(np.argmin(dd))
        if dd[c]<25:out[c][sl]|=mk
    return out
def bleed(im):
    a=np.asarray(im).copy();m=a[...,3]>8
    if m.any():
        i=nd.distance_transform_edt(~m,return_distances=False,return_indices=True);a[...,:3]=a[i[0],i[1],:3]
    return Image.fromarray(a,'RGBA')
def cut_sheet(path):
    a=np.asarray(Image.open(path).convert('RGB'));rgba,kind=key(a);res=[]
    for ci,mk in enumerate(cells(rgba[...,3])):
        if mk.sum()<20000:raise SystemExit(f'{path}: cell {ci} empty')
        pic=rgba.copy();pic[...,3]=np.where(nd.binary_dilation(mk,iterations=2),pic[...,3],0)
        ys,xs=np.nonzero(pic[...,3]>20);im=Image.fromarray(pic).crop((xs.min()-2,ys.min()-2,xs.max()+3,ys.max()+3))
        s=min(1,BOX[1]/im.height,BOX[0]/im.width)
        if s<1:im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
        res.append(im)
    return res,kind
def main(dry):
    p=os.path.join(R,'src','part_roster.js');js=open(p,encoding='utf-8').read();os.makedirs(V2+'/cut',exist_ok=True);done=0
    for k in range(1,6):
        f=f'{V2}/monster-sheet-{k}.jpg'
        ims,kind=cut_sheet(f);print('sheet',k,kind,'background')
        for j,im in enumerate(ims):
            mid=f'n{16*(k-1)+j+1:03d}';im.save(f'{V2}/cut/{mid}.png')
            b=io.BytesIO();bleed(im).save(b,'WEBP',quality=82,method=4,exact=True)
            new=f'{mid}:{{u:"data:image/webp;base64,{base64.b64encode(b.getvalue()).decode()}",w:{im.width},h:{im.height}}}'
            js,n=re.subn(mid+r':\{u:"data:image/[a-z]+;base64,[A-Za-z0-9+/=]+",w:\d+,h:\d+\}',lambda _:new,js)
            if n!=1:raise SystemExit(f'{mid}: found {n} RSPR entries')
            done+=1
    if not dry:open(p,'w',encoding='utf-8').write(js)
    print('replaced' if not dry else 'would replace',done,'sprites;',len(js)//1024,'KB')
if __name__=='__main__':main('--dry' in sys.argv)
