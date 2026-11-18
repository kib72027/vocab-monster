import cv2, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
img=cv2.imread('hposter2.png')
# (x0,x1,y0,y1)
BOX={0:(40,340,25,452),1:(340,650,60,455),2:(640,930,100,452),3:(895,1170,85,452),4:(1140,1500,85,455),
 5:(10,305,515,910),6:(315,680,525,910),7:(615,890,520,908),8:(905,1215,525,910),9:(1220,1530,515,910)}
HINT={8:[('l',1172,662,1142,785,14)],6:[('l',322,842,398,772,9),('l',668,838,592,772,9)],
 4:[('l',1185,235,1235,320,26),('l',1445,205,1405,325,26)],3:[('l',955,335,1150,395,12)]}
def cuth(i,scale=2):
    x0,x1,y0,y1=BOX[i]
    c=img[y0:y1,x0:x1];c=cv2.resize(c,None,fx=scale,fy=scale,interpolation=cv2.INTER_CUBIC)
    h,w=c.shape[:2];m=np.full((h,w),cv2.GC_PR_BGD,np.uint8)
    m[int(h*.03):int(h*.99),int(w*.08):int(w*.92)]=cv2.GC_PR_FGD
    m[int(h*.25):int(h*.85),int(w*.40):int(w*.60)]=cv2.GC_FGD
    m[:int(h*.01),:]=cv2.GC_BGD;m[:,:int(w*.01)]=cv2.GC_BGD;m[:,w-int(w*.01):]=cv2.GC_BGD
    hm=np.zeros((h,w),np.uint8)
    for t in HINT.get(i,[]):cv2.line(hm,(int((t[1]-x0)*scale),int((t[2]-y0)*scale)),(int((t[3]-x0)*scale),int((t[4]-y0)*scale)),255,t[5]*scale)
    m[hm>0]=cv2.GC_FGD
    b=np.zeros((1,65));f=np.zeros((1,65))
    cv2.grabCut(c,m,None,b,f,8,cv2.GC_INIT_WITH_MASK)
    fg=((m==1)|(m==3));fg=ndi.binary_fill_holes(fg);fg=ndi.binary_opening(fg,iterations=1)
    L,n=ndi.label(fg);sz=ndi.sum(fg,L,range(1,n+1));fg=np.isin(L,[k+1 for k,s in enumerate(sz) if s>=sz.max()*.12 or ndi.maximum(hm>0,L,k+1)])
    a=ndi.gaussian_filter(fg.astype(np.float32),1.4);a=np.clip((a-.3)/.4,0,1)
    im=Image.fromarray(np.dstack([cv2.cvtColor(c,cv2.COLOR_BGR2RGB),(a*255).astype(np.uint8)]),'RGBA');im=im.crop(im.getbbox())
    if im.height>280:im=im.resize((round(im.width*280/im.height),280),Image.LANCZOS)
    return im
if __name__=='__main__':
    W=Image.new('RGB',(10*200,300),(120,170,120))
    for i in range(10):
        im=cuth(i);im.save(f'rost/p{i}.png');t=im.copy();t.thumbnail((196,290));W.paste(t,(i*200,0),t)
    W.save('rost/psheet.png')
