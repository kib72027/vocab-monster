import cv2,numpy as np,os,sys
from PIL import Image
A='/mnt/user-data/attachments/a3c55631-b360-5eee-bc8c-a284734dea09/'
FILES=['8a964867','df3504b2','9e75c93e','88c4e306','740531d2','e6f6c9d1']
def cut(cell,core=None,tol=5,shadow=True):
    h,w=cell.shape[:2]
    lab=cv2.cvtColor(cell,cv2.COLOR_BGR2LAB).astype(np.float32)
    sm=cv2.GaussianBlur(cell,(0,0),1.0)
    d=np.zeros((h,w),np.float32)
    bgm=np.zeros((h,w),bool)
    hsv=cv2.cvtColor(sm,cv2.COLOR_BGR2HSV)
    bluish=(hsv[...,0]>95)&(hsv[...,0]<115)&(hsv[...,1]<150)&(hsv[...,2]>170)
    seeds=[(x,y) for x in range(0,w,6) for y in (0,h-1)]+[(x,y) for y in range(0,h,6) for x in (0,w-1)]
    TOL=tol
    for (x,y) in seeds:
        if bgm[y,x] or not bluish[y,x]: continue
        m=np.zeros((h+2,w+2),np.uint8)
        cv2.floodFill(sm.copy(),m,(x,y),(0,0,0),(TOL,TOL,TOL),(TOL,TOL,TOL),cv2.FLOODFILL_MASK_ONLY|(255<<8)|8)
        bgm|=m[1:-1,1:-1]>0
    bgm&=((hsv[...,0]>92)&(hsv[...,0]<120)&(hsv[...,1]<200)&(hsv[...,2]>140))
    # ground shadow: bluish, low-sat region inside lower part, connected to bgm
    yy,xx=np.mgrid[0:h,0:w]
    cand=(bluish|((hsv[...,0]>95)&(hsv[...,0]<118)&(hsv[...,1]<190)&(hsv[...,2]>150)))&(yy>h*0.6)
    sh=(cand|bgm).astype(np.uint8)
    n2,l2=cv2.connectedComponents(sh,connectivity=4)
    ids=set(np.unique(l2[bgm]))-{0}
    shm=np.isin(l2,list(ids))&cand
    # only accept shadow pixels that are not in strong-edge/ detailed (ice) areas: require local low variance
    g=cv2.cvtColor(cell,cv2.COLOR_BGR2GRAY).astype(np.float32)
    var=cv2.GaussianBlur(g*g,(0,0),2)-cv2.GaussianBlur(g,(0,0),2)**2
    shm&=var<60
    if shadow: bgm|=shm
    d[~bgm]=60
    # grabcut
    mask=np.full((h,w),cv2.GC_PR_FGD,np.uint8)
    mask[bgm]=cv2.GC_BGD
    mask[d>40]=cv2.GC_FGD
    # erode sure fg (avoid bg in fg)
    mask[(d<=40)&(~bgm)]=cv2.GC_PR_FGD
    b=np.zeros((1,65));f=np.zeros((1,65))
    cv2.grabCut(cell,mask,None,b,f,4,cv2.GC_INIT_WITH_MASK)
    fg=((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD)).astype(np.uint8)
    # keep largest comps
    n,l,st,_=cv2.connectedComponentsWithStats(fg,connectivity=8)
    if n>1:
        cx0,cy0,cx1,cy1=core
        ok=[i for i in range(1,n) if cx0<=_[i][0]<=cx1 and cy0<=_[i][1]<=cy1]
        if not ok: ok=list(range(1,n))
        big=max(st[i,4] for i in ok)
        keep=[i for i in ok if st[i,4]>=0.02*big]
        fg=np.isin(l,keep).astype(np.uint8)
    bl_loose=((hsv[...,0]>96)&(hsv[...,0]<112)&(hsv[...,1]>35)&(hsv[...,1]<135)&(hsv[...,2]>190))&(yy>h*0.55)
    if not shadow: bl_loose[:]=False
    # fill holes that are not connected to border
    inv=1-fg;n,l=cv2.connectedComponents(inv,connectivity=4)
    bl=set(np.unique(np.r_[l[0],l[-1],l[:,0],l[:,-1]]))
    for i in range(1,n):
        if i not in bl: fg[(l==i)&(~bl_loose)]=1
    fg=cv2.morphologyEx(fg,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    a=cv2.GaussianBlur(fg.astype(np.float32)*255,(0,0),0.9)
    return a.astype(np.uint8)
SPECIAL={(2,3)}
def run(si,ci,pad=16):
    im=cv2.imread(A+FILES[si]+'-image.png')
    r,c=divmod(ci,4)
    x0=max(0,c*384-pad);x1=min(1536,(c+1)*384+pad);y0=max(0,r*256-pad);y1=min(1024,(r+1)*256+pad)
    cell=im[y0:y1,x0:x1].copy()
    a=cut(cell,(c*384-x0,r*256-y0,(c+1)*384-x0,(r+1)*256-y0))
    # restrict to own cell core: drop comps whose centroid outside the core
    rgba=cv2.cvtColor(cell,cv2.COLOR_BGR2BGRA)
    if (si,ci) in SPECIAL: a=cut(cell,(c*384-x0,r*256-y0,(c+1)*384-x0,(r+1)*256-y0),tol=2,shadow=False)
    rgba[...,3]=a
    # soften bluish ground remnants (only when they are a small part of the monster)
    hh=cell.shape[0];hsv=cv2.cvtColor(cell,cv2.COLOR_BGR2HSV)
    rem=(hsv[...,0]>96)&(hsv[...,0]<112)&(hsv[...,1]>35)&(hsv[...,1]<135)&(hsv[...,2]>190)&(a>0)
    rem[:int(hh*0.55)]=False
    if rem.sum()<0.07*(a>0).sum() and (si,ci) not in SPECIAL:
        rem=cv2.dilate(rem.astype(np.uint8),np.ones((3,3),np.uint8))>0
        rgba[...,3][rem&(a>0)]=0
        a2=cv2.GaussianBlur(rgba[...,3],(0,0),0.7);rgba[...,3]=a2
    ys,xs=np.nonzero(a>20)
    rgba=rgba[ys.min():ys.max()+1,xs.min():xs.max()+1]
    return rgba
if __name__=='__main__':
    os.makedirs('nm',exist_ok=True)
    for si in range(6):
        for ci in range(16):
            cv2.imwrite(f'nm/s{si+1}_{ci+1:02d}.png',run(si,ci))
    # contact sheets on dark gray
    for si in range(6):
        sheet=np.full((4*260,4*390,3),(200,160,210),np.uint8)
        for ci in range(16):
            m=cv2.imread(f'nm/s{si+1}_{ci+1:02d}.png',cv2.IMREAD_UNCHANGED);r,c=divmod(ci,4)
            hh,ww=m.shape[:2];s=min(250/hh,380/ww,1);m=cv2.resize(m,(int(ww*s),int(hh*s)))
            y=r*260+5;x=c*390+5;roi=sheet[y:y+m.shape[0],x:x+m.shape[1]]
            al=m[...,3:]/255.;roi[:]=(m[...,:3]*al+roi*(1-al)).astype(np.uint8)
        cv2.imwrite(f'nm/sheet{si+1}.png',sheet)
