import io,base64,json,re
from PIL import Image
L=[
# S1
("綠史萊姆","Green Slime","forest"),("獨眼蝙蝠怪","Cyclops Bat","elite"),("冰晶巨人","Ice Golem","ice"),("熔岩巨人","Lava Golem","fire"),
("骨龍","Bone Dragon","skel"),("紫蘑菇怪","Purple Mushroom","poison"),("青苔石巨人","Moss Golem","forest"),("紅龍","Red Dragon","dragon"),
("食人花","Piranha Plant","forest"),("藍焰精靈","Blue Flame Spirit","sky"),("尖刺犀牛","Spike Rhino","desert"),("紫毒蜘蛛","Purple Spider","poison"),
("紫章魚","Purple Octopus","sea"),("哥布林戰士","Goblin Warrior","forest"),("藍冰龍","Blue Dragon","dragon"),("水晶史萊姆","Crystal Slime","rare"),
# S2
("火焰史萊姆","Fire Slime","fire"),("火焰小惡魔","Fire Imp","fire"),("火鳳凰","Fire Phoenix","rare"),("岩漿巨人","Magma Golem","fire"),
("烈焰龍","Flame Dragon","dragon"),("火焰精靈","Fire Spirit","fire"),("雷電獸","Thunder Beast","elec"),("雷鷹","Thunder Eagle","sky"),
("熔岩巨獸","Lava Brute","fire"),("雷電機甲","Thunder Mech","elec"),("電光鼠","Spark Mouse","elec"),("雷電球","Storm Orb","elec"),
("火焰獅","Flame Lion","fire"),("烈焰戰士","Flame Knight","elite"),("熔岩蛇龍","Lava Serpent","dragon"),("火焰魔王","Fire Demon Lord","boss"),
# S3
("冰霜巨人","Frost Giant","ice"),("霜狼","Frost Wolf","ice"),("企鵝國王","Penguin King","elite"),("冰雪幽靈","Ice Ghost","ghost"),
("冰晶龍","Ice Dragon","dragon"),("雙頭海蛇","Twin Sea Serpent","sea"),("鯊魚戰士","Shark Warrior","sea"),("紅螃蟹","Red Crab","sea"),
("海盜章魚","Pirate Octopus","elite"),("水母怪","Jellyfish","sea"),("河豚怪","Pufferfish","sea"),("人魚女王","Mermaid Queen","boss"),
("大白鯊","Great Shark","sea"),("水晶螃蟹","Crystal Crab","sea"),("水晶龜","Crystal Turtle","rare"),("海龍","Sea Dragon","dragon"),
# S4
("樹人","Treant","forest"),("哥布林矛兵","Goblin Spearman","forest"),("巨口食人花","Giant Plant","forest"),("森林鹿","Forest Stag","forest"),
("蘑菇戰士","Mushroom Warrior","forest"),("史萊姆王","King Slime","elite"),("劇毒蜘蛛","Venom Spider","poison"),("尖刺龜","Spike Turtle","forest"),
("花精靈","Flower Dryad","forest"),("雙頭食人花","Twin Plant","poison"),("岩甲獸","Armor Beast","desert"),("綠幽靈","Green Ghost","ghost"),
("水晶樹人","Crystal Treant","rare"),("毒龍","Poison Dragon","poison"),("老樹人","Elder Treant","elite"),("紫蘑菇","Violet Mushroom","poison"),
# S5
("機械戰士","Mech Warrior","mech"),("機械之眼","Mech Eye","mech"),("黃色機甲巨人","Yellow Mech Golem","mech"),("骷髏法師","Skeleton Mage","skel"),
("骷髏戰士","Skeleton Warrior","skel"),("紫色幽靈","Purple Ghost","ghost"),("死神","Reaper","skel"),("骷髏石巨人","Bone Golem","skel"),
("蝙蝠惡魔","Bat Demon","ghost"),("木乃伊","Mummy","desert"),("殭屍","Zombie","ghost"),("科學怪人","Frankenstein","elite"),
("熔岩惡魔","Lava Demon","fire"),("黑暗騎士","Dark Knight","elite"),("暗影骨龍","Shadow Bone Dragon","skel"),("藍焰骷髏","Blue Flame Skull","ghost"),
# S6
("熔岩巨像","Lava Colossus","elite"),("鳳凰","Phoenix","rare"),("青苔巨像","Mossy Colossus","forest"),("黃金騎士巨像","Gold Knight Golem","mech"),
("冰晶巨像","Ice Colossus","ice"),("骷髏國王","Skeleton King","boss"),("鎖鏈幽魂","Chain Wraith","ghost"),("吸血鬼","Vampire","elite"),
("紫毛怪","Purple Beast","elite"),("牛頭怪","Minotaur","elite"),("沙漠木乃伊","Desert Mummy","desert"),("南瓜巫師","Pumpkin Witch","elite"),
("骷髏史萊姆","Skull Slime","poison"),("石頭怪","Stone Monster","desert"),("水晶怪","Crystal Beast","rare"),("紅惡魔","Red Demon","boss"),
]
assert len(L)==96
ELEM={'獨眼蝙蝠怪':'ghost','烈焰戰士':'fire','企鵝國王':'ice','火焰魔王':'fire','人魚女王':'sea','水晶史萊姆':'ice','火鳳凰':'fire','水晶龜':'sea','海盜章魚':'sea','史萊姆王':'forest','水晶樹人':'forest','老樹人':'forest','科學怪人':'mech','黑暗騎士':'skel','熔岩巨像':'fire','鳳凰':'sky','骷髏國王':'skel','吸血鬼':'ghost','紫毛怪':'poison','牛頭怪':'desert','南瓜巫師':'ghost','水晶怪':'ice','紅惡魔':'fire'}
BOSS=['冰晶巨像','人魚女王','熔岩巨像','火焰魔王','暗影骨龍','骷髏國王','熔岩蛇龍','鳳凰','紅惡魔']
ELITE=['史萊姆王','企鵝國王','獨眼蝙蝠怪','海盜章魚','老樹人','烈焰戰士','科學怪人','紫毛怪','牛頭怪','雷電機甲','吸血鬼','南瓜巫師','黃色機甲巨人','死神','黑暗騎士','黃金騎士巨像','藍冰龍','紅龍']
RARE=['水晶史萊姆','火鳳凰','水晶龜','水晶樹人','水晶怪']
byname={zh:f'n{i+1:03d}' for i,(zh,en,t) in enumerate(L)}
assert len(set(byname))==96
for n in BOSS+ELITE+RARE: assert n in byname,n
assert not set(BOSS)&set(ELITE)
rest=[zh for zh,en,t in L if zh not in BOSS+ELITE+RARE]
tt={zh:ELEM.get(zh,t) for zh,en,t in L}
# interleave by element, choose 40 normals
from collections import defaultdict
grp=defaultdict(list)
for z in rest: grp[tt[z]].append(z)
order=[];keys=sorted(grp,key=lambda k:-len(grp[k]))
while any(grp[k] for k in keys):
    for k in keys:
        if grp[k]: order.append(grp[k].pop(0))
NORMAL=order[:40];SPARE=order[40:]
print(len(rest),len(NORMAL),len(SPARE))
role={}
for z in BOSS: role[z]='b'
for z in ELITE: role[z]='e'
for z in RARE: role[z]='r'
for z in NORMAL: role[z]='n'
for z in SPARE: role[z]='x'
M=[];S=[]
for i,(zh,en,t) in enumerate(L):
    si,ci=divmod(i,16)
    im=Image.open(f'nm/s{si+1}_{ci+1:02d}.png').convert('RGBA')
    s=min(1,220/im.height,300/im.width)
    if s<1: im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    b=io.BytesIO();im.save(b,'WEBP',quality=76,method=4)
    id=f'n{i+1:03d}'
    M.append({'id':id,'zh':zh,'en':en,'t':tt[zh],'role':role[zh]})
    S.append(f'{id}:{{u:"data:image/webp;base64,{base64.b64encode(b.getvalue()).decode()}",w:{im.width},h:{im.height}}}')
old=open('part_roster_old.js').read()
head=old[:old.index('const RMON')]
js=head+'const RMON='+json.dumps(M,ensure_ascii=False)+';\nconst RSPR={'+','.join(S)+'};\n'
js+='const MPLAN='+json.dumps({'normal':[byname[z] for z in NORMAL],'elite':[byname[z] for z in ELITE],'boss':[byname[z] for z in BOSS]})+';\n'
open('part_roster.js','w').write(js)
from collections import Counter
print(Counter(m['t'] for m in M),len(js)//1024,'KB')
