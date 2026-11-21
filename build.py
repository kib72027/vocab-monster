#!/usr/bin/env python3
"""Rebuild index.html from src/ (run from anywhere:  python3 build.py).
Order: head(css+html) + data + legacy monsters + sprites + roster + battle backgrounds (src/part_bg.js) + hero animation frames (src/part_hanim_*.js) + app (game block + 3D engine spliced in).
Edit these: src/part_3d.js (WebGL engine), src/part_game.js (battle logic & views),
src/part_app2.js (everything outside the game block: practice mode, click handler, storage...),
src/part_data.js (RAW/VX vocabulary), src/part_head2.html (CSS). src/part_roster.js / part_sprites.js hold base64 art.
NOTE: part_game.js and part_app2.js are rewritten in place (3D engine -> part_game.js -> game block of part_app2.js)."""
import os,glob
P=os.path.join(os.path.dirname(os.path.abspath(__file__)),'src')+os.sep
R=lambda f:open(P+f,encoding='utf-8').read()
g=R('part_game.js')
i=g.index('/* ================= 3D: tiny WebGL');j=g.index('/* ---------- battle ---------- */')
g=g[:i]+R('part_3d.js').rstrip()+'\n'+g[j:]
open(P+'part_game.js','w',encoding='utf-8').write(g)
a=R('part_app2.js')
i=a.index('/* ================= GAME: monster battles');j=a.index('/*GAMEEND*/')
a=a[:i]+g.replace('+${r.xp+B.right*5-r.xp}','+${B.right*5}').replace('/*GAMEEND*/','')+a[j:]
open(P+'part_app2.js','w',encoding='utf-8').write(a)
d=R('part_data.js').replace('/*APP*/','')
v=R('part_head2.html')+d+R('part_monsters.js')+R('part_sprites.js')+R('part_roster.js')+(R('part_bg.js') if os.path.exists(P+'part_bg.js') else '')+''.join(open(f,encoding='utf-8').read() for f in sorted(glob.glob(P+'part_hanim_*.js')))+a+'</script>'
t='<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>'+v+'</body></html>'
out=os.path.join(os.path.dirname(P.rstrip(os.sep)),'index.html')
open(out,'w',encoding='utf-8').write(t)
print('wrote',out,len(t)//1024,'KB')
