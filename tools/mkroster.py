import json, io, base64
from PIL import Image
from cut import slots
ZH={'Slime':('史萊姆','forest'),'Big Slime':('大史萊姆','forest'),'King Slime':('史萊姆王','elite'),'Rainbow Slime':('彩虹史萊姆','rare'),'Poison Slime':('毒茄史萊姆','poison'),
'Goblin':('哥布林','forest'),'Treant':('樹人','forest'),'Dryad':('樹精靈','forest'),'Forest Spirit':('森林之靈','forest'),'Leaf Monster':('葉子怪','forest'),
'Little Fish':('小魚怪','sea'),'Shark':('鯊魚怪','sea'),'Octopus':('章魚怪','sea'),'Sea Turtle':('海龜怪','sea'),'Sea Serpent':('海蛇龍','sea'),
'Robot':('機器人','mech'),'Mech Spider':('機械蜘蛛','mech'),'Mech Dragon':('機械龍','mech'),'Battle Bot':('戰鬥機器人','mech'),'Gear Golem':('齒輪巨人','mech'),
'Baby Dragon':('幼龍','dragon'),'Fire Dragon':('紅龍','dragon'),'Ice Dragon':('冰龍','dragon'),'Earth Dragon':('大地龍','dragon'),'Shadow Dragon':('暗影龍','dragon'),
'Giant':('巨人','elite'),'Troll':('巨魔','elite'),'Ogre':('食人魔','elite'),'Cyclops':('獨眼巨人','elite'),'Stone Giant':('石巨人','elite'),
'Dark Dragon':('暗黑龍王','boss'),'Ice Queen':('冰晶女王','boss'),'Demon King':('魔王','boss'),'Ancient Golem':('遠古巨像','boss'),'Chaos Lord':('混沌領主','boss'),
'Fire Imp':('火焰小鬼','fire'),'Lava Monster':('熔岩怪','fire'),'Fire Golem':('火焰巨人','fire'),
'Lightning Golem':('閃電巨人','elec'),'Storm Dragon':('風暴龍','elec'),'Magic Orb':('電光球','elec'),
'Sand Worm':('沙蟲','desert'),'Scorpion Monster':('蠍子怪','desert'),'Sand Golem':('沙石巨人','desert'),'Desert Dragon':('沙漠龍','desert'),
'Ghost':('幽靈','ghost'),'Phantom':('幻影','ghost'),'Spirit':('精魂','ghost'),'Shadow':('暗影','ghost'),
'Imp':('小惡魔','elite'),'Demon':('惡魔','elite'),'Dark Knight':('黑暗騎士','elite'),'Demon Lord':('惡魔領主','elite'),'Hellhound':('地獄犬','elite'),
'Spellbook':('魔法書怪','elite'),'Wizard':('小巫師','elite'),'Magic Golem':('魔法巨人','elite'),'Elemental':('元素精靈','elite'),
'Golden Slime':('黃金史萊姆','rare'),'Crystal Dragon':('水晶龍','rare'),'Shadow Phoenix':('暗影鳳凰','rare'),'Rainbow Dragon':('彩虹龍','rare'),'Star Guardian':('星辰守護者','rare'),
'Frost Dragon':('霜龍','ice'),'Ice Golem':('冰霜巨人','ice'),'Snowman':('雪人','ice'),
'Toxic Slime':('毒蛙','poison'),'Venom Spider':('毒蜘蛛','poison'),'Poison Dragon':('毒龍','poison'),'Toxic Plant':('毒草怪','poison'),
'Cloud Spirit':('雲朵精靈','sky'),'Sky Dragon':('天空龍','sky'),'Air Elemental':('空氣精靈','sky'),'Zephyr':('西風精靈','sky'),
'Skeleton':('骷髏兵','skel'),'Skeleton Archer':('骷髏弓手','skel'),'Death Knight':('死亡騎士','skel'),'Lich':('巫妖','skel'),
'Flower':('花朵怪','forest'),'Mushroom':('蘑菇怪','forest'),'Vine Monster':('藤蔓怪','forest'),'Carnivorous Plant':('食人花','forest'),'Mandrake':('曼德拉草','forest'),
'Phoenix':('鳳凰','elite'),'Griffin':('獅鷲','elite'),'Minotaur':('牛頭怪','elite'),'Sphinx':('人面獅','elite'),'Unicorn':('獨角獸','elite')}
ZH['Ice Queen#15']=('冰雪女王','ice');ZH['Fire Dragon#8']=('烈焰龍','fire')
M=[];out=[];seen=set()
for i,(n,en,typ,cx,cy,hw) in enumerate(slots):
    key=en
    if en=='Ice Queen' and n==15:key='Ice Queen#15'
    if en=='Fire Dragon' and n==8:key='Fire Dragon#8'
    zh,t=ZH[key]
    x0,x1=int(cx-hw+5),int(cx+hw-5);y0,y1=int(cy-31),int(cy+32)
    from cut import img as _im
    import cv2
    im=Image.fromarray(cv2.cvtColor(_im[y0:y1,x0:x1],cv2.COLOR_BGR2RGB));im=im.resize((im.width*3,im.height*3),Image.LANCZOS)
    from PIL import ImageFilter
    im=im.filter(ImageFilter.UnsharpMask(2,60,2))
    b=io.BytesIO();im.save(b,'WEBP',quality=80,method=6)
    out.append((f'r{len(M)+1:03d}',zh,en,t,base64.b64encode(b.getvalue()).decode(),im.width,im.height))
    M.append(1)
HE=[('h1','勇者','Brave Knight','近戰','舉起盾牌守護大家的騎士。'),('h2','魔法師','Mage','魔法','用閃亮魔法照亮單字的小魔女。'),('h3','弓箭手','Archer','遠攻','百發百中的森林弓箭手。'),('h4','劍士','Swordsman','近戰','熱血的紅髮劍士，揮劍從不退縮。'),('h5','龍騎士','Dragon Knight','夥伴','和冰龍一起冒險的龍騎士。'),('h6','牧師','Priest','輔助','用溫柔光芒守護隊友的牧師。'),('h7','盜賊','Rogue','敏捷','身手敏捷、行動神祕的盜賊。'),('h8','召喚師','Summoner','召喚','能呼喚夥伴精靈的貓耳召喚師。'),('h9','工程師','Mechanic','機械','拿著大扳手的發明小天才。'),('h10','神秘使者','Mystic','神祕','掌握水晶球力量的神祕魔女。')]
hs=[]
for i,h in enumerate(HE):
    im=Image.open(f'rost/h{i}.png')
    if im.height>240:im=im.resize((round(im.width*240/im.height),240),Image.LANCZOS)
    b=io.BytesIO();im.save(b,'WEBP',quality=84,method=6);hs.append((h,base64.b64encode(b.getvalue()).decode(),im.width,im.height))
js='/* ---------- ROSTER: heroes & monster codex ---------- */\n'
js+='const HEROES=['+','.join(json.dumps({'id':h[0],'zh':h[1],'en':h[2],'job':h[3],'desc':h[4]},ensure_ascii=False) for h,_,_,_ in hs)+'];\n'
js+='const HSPR={'+','.join(f'{h[0]}:{{u:"data:image/webp;base64,{d}",w:{w},h:{hh}}}' for h,d,w,hh in hs)+'};\n'
js+='const RMON=['+','.join(json.dumps({'id':o[0],'zh':o[1],'en':o[2],'t':o[3]},ensure_ascii=False) for o in out)+'];\n'
js+='const RSPR={'+','.join(f'{o[0]}:{{u:"data:image/webp;base64,{o[4]}",w:{o[5]},h:{o[6]}}}' for o in out)+'};\n'
open('part_roster.js','w').write(js)
from collections import Counter
print(len(out),Counter(o[3] for o in out),len(js)//1024,'KB')
