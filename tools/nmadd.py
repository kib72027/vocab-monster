#!/usr/bin/env python3
"""Add extra monsters from grid sheets to src/part_roster.js.
  assets/monsters/set-2/monsters.json, set-3/... -> RMON + RSPR (new collectable monsters; ids n081...; every
                                                    assets/monsters/set-N folder except set-1, in order)
  assets/monsters/legend/legends.json            -> LMON + LSPR (legendary monsters, kept apart: not used by the game yet)
(set-1 = the original 80 monsters, cut by tools/nmcut2.py.)
Each json lists {sheet, cell, id, zh, en, t[, role, face]} and optionally grid = {sheet: [cols, rows]} (default: 2x2 for
3:2 sheets, else 4x4); cells not listed are skipped (look-alikes of existing monsters).
Re-running replaces entries with the same id, so it is safe to run again after editing the json.
Cut-outs are saved to <folder>/cut/<id>.png for review.
Usage: python3 tools/nmadd.py [--dry]"""
import sys,os,io,re,json,base64
import numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from nmcut2 import key,cells,bleed
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def cut(path,cols,rows,box):
    a=np.asarray(Image.open(path).convert('RGB'));rgba,kind=key(a,shadow=True);res=[]   # these sheets paint a floor shadow
    for ci,mk in enumerate(cells(rgba[...,3],cols,rows)):
        pic=rgba.copy();pic[...,3]=np.where(mk,pic[...,3],0)
        ys,xs=np.nonzero(pic[...,3]>20)
        if not len(ys):res.append(None);continue
        im=Image.fromarray(pic).crop((xs.min()-2,ys.min()-2,xs.max()+3,ys.max()+3))
        s=min(1,box[1]/im.height,box[0]/im.width)
        if s<1:im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
        res.append(im)
    return res,kind
def enc(im):
    b=io.BytesIO();bleed(im).save(b,'WEBP',quality=82,method=4,exact=True);return base64.b64encode(b.getvalue()).decode()
def grid(path,cfg):
    g=cfg.get('grid',{}).get(os.path.basename(path))
    if g:return tuple(g)
    w,h=Image.open(path).size;return (2,2) if 1.3<w/h<1.6 else (4,4)   # the legend sheet is 2x2 (3:2), monster sheets 4x4 (16:9 or square)
def load(folder,box):
    cfg=json.load(open(os.path.join(folder,os.path.basename(folder) and '')+[f for f in os.listdir(folder) if f.endswith('.json')][0],encoding='utf-8'))
    out=[];cache={};os.makedirs(os.path.join(folder,'cut'),exist_ok=True)
    for m in cfg['monsters']:
        p=os.path.join(folder,m['sheet'])
        if p not in cache:cols,rows=grid(p,cfg);cache[p]=cut(p,cols,rows,box)[0];print(' cut',m['sheet'],f'{cols}x{rows}')
        im=cache[p][m['cell']]
        if im is None:raise SystemExit(f"{m['id']}: cell {m['cell']} of {m['sheet']} is empty")
        im.save(os.path.join(folder,'cut',m['id']+'.png'));out.append((m,im))
    return out
def main(dry):
    p=os.path.join(R,'src','part_roster.js');js=open(p,encoding='utf-8').read()
    # 1) collectable monsters
    M=os.path.join(R,'assets','monsters');sets=sorted((d for d in os.listdir(M) if d.startswith('set-') and d!='set-1'),key=lambda d:int(d[4:]))
    new=[x for d in sets for x in load(os.path.join(M,d),(360,264))]
    RM=json.loads(re.search(r'const RMON=(\[.*?\]);',js).group(1));ids={m['id']:i for i,m in enumerate(RM)}
    for m,im in new:
        e={'id':m['id'],'zh':m['zh'],'en':m['en'],'t':m['t'],'role':m.get('role','x')}
        if m.get('face')=='left':e['f']=0   # art already faces left: engine must not mirror it
        if m['id'] in ids:RM[ids[m['id']]]=e
        else:RM.append(e)
        ent=f"{m['id']}:{{u:\"data:image/webp;base64,{enc(im)}\",w:{im.width},h:{im.height}}}"
        pat=m['id']+r':\{u:"data:image/[a-z]+;base64,[A-Za-z0-9+/=]+",w:\d+,h:\d+\}'
        if re.search(pat,js):js=re.sub(pat,lambda _:ent,js)
        else:i=js.index('const RSPR={');j=js.index('};',i);js=js[:j]+','+ent+js[j:]
    js=re.sub(r'const RMON=\[.*?\];',lambda _:'const RMON='+json.dumps(RM,ensure_ascii=False)+';',js,count=1)
    # 2) legends: separate tables, rewritten every run
    leg=load(os.path.join(R,'assets','monsters','legend'),(440,320))
    js=re.sub(r'\n/\* legends \*/.*?/\* end legends \*/\n','\n',js,flags=re.S)
    LM=[dict({'id':m['id'],'zh':m['zh'],'en':m['en'],'t':m['t'],'role':'L'},**({'f':0} if m.get('face')=='left' else {})) for m,_ in leg]
    LS=','.join(f"{m['id']}:{{u:\"data:image/webp;base64,{enc(im)}\",w:{im.width},h:{im.height}}}" for m,im in leg)
    js=js.rstrip('\n')+'\n/* legends */\nconst LMON='+json.dumps(LM,ensure_ascii=False)+';\nconst LSPR={'+LS+'};\n/* end legends */\n'
    if not dry:open(p,'w',encoding='utf-8').write(js)
    print(('would write' if dry else 'wrote'),len(RM),'monsters +',len(LM),'legends;',len(js)//1024,'KB')
if __name__=='__main__':main('--dry' in sys.argv)
