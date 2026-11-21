# 特效動畫圖（VFX sprite sheet）Prompt

用途：取代遊戲裡用表情符號（🔥 ❄️ ⚡ 🍃 ✨）做的特效。每張圖是一段特效動畫：4×4 格、16 格畫面，由左到右、由上到下播放。

拿到圖後放到 `assets/vfx/`，檔名照下表（例如 `fire_burst.png`），我負責切格並放進遊戲。

## 共用規則（每張都要貼在 prompt 最後面）

```text
FORMAT
Sprite sheet for a 2D mobile game visual effect, square image 2048x2048, a 4x4 grid of 16 equal cells.
The 16 cells are the frames of ONE animation, played left to right, top to bottom (frame 1 top-left, frame 16 bottom-right).
The effect is centered in every cell, at the same scale and position in every cell, and never touches the cell borders.
Pure black background (#000000) everywhere, no grid lines, no borders between cells.

STYLE
Stylized hand-painted anime game VFX, bright glowing colors, soft glow edges, clean shapes, high detail,
the kind of effect seen in polished fantasy mobile RPGs. Smooth motion between frames.

DO NOT INCLUDE
No characters, no creatures, no weapons, no text, no numbers, no logo, no watermark, no frame, no background scenery.
```

## 要生成的特效（依重要程度排序）

| # | 檔名 | 用在哪裡 | 特效描述（貼在共用規則前面） |
|---|---|---|---|
| 1 | `fire_burst.png` | 火焰攻擊打中、劍士、火焰貓、火系怪物 | `A fire explosion: frames 1-3 a small bright spark, frames 4-8 a big round burst of orange and yellow flames with a white-hot core, frames 9-13 the flames break apart into curling tongues and embers, frames 14-16 fading wisps of smoke and a few embers.` |
| 2 | `flame_loop.png` | 地上燃燒的火焰、火焰龍捲風 | `A single burning campfire-style flame, seamless looping animation: the flame flickers and dances, tips curl and split, orange outside, yellow inside, white-hot at the base. Frame 16 flows back into frame 1.` |
| 3 | `ice_burst.png` | 冰系攻擊、冰狐、龍騎士 | `An ice shatter: frames 1-4 sharp blue-white ice crystals grow out from the center, frames 5-9 they crack and burst outward into glittering shards, frames 10-16 the shards spin away and dissolve into frosty mist and tiny sparkles.` |
| 4 | `lightning.png` | 雷電攻擊、雷電兔、雷系怪物 | `A vertical lightning strike from the top of the cell to the bottom: frames 1-2 thin flickering lead bolt, frames 3-6 a thick blinding white-blue bolt with branching forks and a bright flash at the bottom, frames 7-12 the bolt flickers and thins, frames 13-16 small electric arcs crackle at the bottom and fade.` |
| 5 | `leaf_swirl.png` | 森林／毒系、熊貓、弓箭手藤蔓 | `A swirling burst of green leaves and glowing green magic: frames 1-4 a small green glow, frames 5-10 a spiral whirlwind of bright green leaves and light petals spreading outward, frames 11-16 leaves drift outward and fade with green sparkles.` |
| 6 | `holy_burst.png` | 牧師、勇者、光系招式 | `A holy light burst: frames 1-4 a bright golden point, frames 5-9 an explosion of warm golden light with sharp light rays radiating outward and a soft halo ring, frames 10-16 the rays shrink and the glow fades into floating golden sparkles.` |
| 7 | `dark_burst.png` | 盜賊、幽靈系、暗影招式 | `A dark shadow burst: frames 1-4 a swirling purple-black orb, frames 5-10 it explodes into curling purple and black smoke tendrils with violet glowing edges, frames 11-16 the smoke thins out into wisps and small violet sparks.` |
| 8 | `hit_spark.png` | 所有普通攻擊打中的瞬間 | `A sharp impact hit effect: frames 1-3 a bright white-yellow star-shaped flash, frames 4-8 a burst of sharp streaking sparks and a thin expanding shock ring, frames 9-16 sparks fly outward, the ring fades, a few sparks remain and vanish.` |
| 9 | `slash_arc.png` | 劍士、勇者、盜賊的斬擊 | `A sword slash: a wide crescent-shaped arc of white light with a cyan-blue glowing edge sweeping from upper left to lower right across the cell; frames 1-4 the arc sweeps in, frames 5-8 full bright arc with sparkles along it, frames 9-16 it thins from the tail and fades away.` |
| 10 | `water_splash.png` | 海洋系怪物攻擊、水滴 | `A water splash: frames 1-4 a blob of clear blue water hits the center, frames 5-10 it bursts into a crown-shaped splash with droplets flying outward, frames 11-16 droplets fall and fade with a little white foam.` |
| 11 | `smoke_puff.png` | 盜賊消失、腳步塵土、砲口 | `A soft puff of grey-white smoke: frames 1-4 a small dense puff appears, frames 5-12 it billows outward into round fluffy clouds, frames 13-16 it thins and fades away.` |

## 注意

- **背景一定要純黑**：我會用亮度去背，黑色會變成透明，發光的邊緣會保留下來。如果 AI 一直畫出深藍、深灰或有花紋的背景，請在 prompt 裡再強調一次 `pure black background #000000`。
- **每一格的位置和大小要一致**：特效的中心要一直在格子中間，播放時才不會跳動。
- **16 格要是同一段動畫**：從小到大再消失，不要每格畫不一樣的東西。
- 不用 11 張一次做完，**先做 1～4 號**（火、持續燃燒的火、冰、雷），這幾張最常出現。
- 如果某張不滿意，可以只重做那一張。

---

## 第二批：怪物第二攻擊、怪物絕招、終極絕招用的特效

遊戲已經寫好會用這些檔名；圖還沒放進來時會先用現有的特效代替，放進 `assets/vfx/` 再跑 `python3 tools/mkvfx.py` 就會自動換上（共用規則一樣貼在最後面）。

| # | 檔名 | 用在哪裡 | 特效描述 |
|---|---|---|---|
| 12 | `explosion_big.png` | 傳奇絕招、終極絕招的最後一擊 | `A huge fantasy explosion: frames 1-3 a blinding white core, frames 4-9 a massive round blast of white, gold and orange fire with a bright shock ring spreading out, frames 10-14 the fireball breaks into billowing glowing smoke and flying sparks, frames 15-16 dark smoke fading.` |
| 13 | `fire_pillar.png` | 火系怪物第二攻擊（腳下噴出火柱） | `A tall pillar of fire erupting straight up from the ground, the pillar fills most of the cell height: frames 1-3 a glowing crack and sparks on the ground at the bottom, frames 4-10 a thick roaring column of orange and yellow flame shoots up with a white-hot core, frames 11-16 the column thins, breaks into flame tongues and embers and fades.` |
| 14 | `tornado.png` | 天空系怪物攻擊、怪物絕招（龍捲風） | `A swirling whirlwind tornado standing on the ground, narrow at the bottom and wide at the top, made of pale blue-white wind streaks, small leaves and dust, seamless looping animation: the funnel spins and sways. Frame 16 flows back into frame 1.` |
| 15 | `tidal_wave.png` | 海洋系怪物攻擊、怪物絕招（大浪） | `A big curling ocean wave rushing from right to left, deep blue water with white foam on the crest: frames 1-4 the wave rises, frames 5-10 it curls over and crashes forward with spray, frames 11-16 it breaks into splashing foam and droplets and fades.` |
| 16 | `poison_cloud.png` | 毒系怪物攻擊（毒霧） | `A toxic poison cloud: frames 1-4 a few purple and green bubbles burst, frames 5-12 a thick swirling cloud of glowing purple and lime-green gas with bubbles and skull-shaped wisps spreads out, frames 13-16 it thins and drifts away.` |
| 17 | `sandstorm.png` | 沙漠系怪物攻擊（沙塵暴） | `A swirling sandstorm: a round whirling cloud of tan and brown sand and small pebbles spinning fast, dust streaks curving around, seamless looping animation. Frame 16 flows back into frame 1.` |
| 18 | `laser_hit.png` | 機械系怪物雷射打中 | `A laser impact: frames 1-3 a bright red-white point flash, frames 4-10 a burst of red and orange energy with sharp sparks and a melting glow, frames 11-16 sparks scatter and the glow fades with a little smoke.` |

---

## 第三批：取代絕招裡「看起來很假」的部分

我把所有絕招都檢查過一遍。下面這些地方目前是用**程式畫的光團、光條，或把一張小圖旋轉、放大**做出來的，所以看起來很假（例如藤鞭只是一張藤蔓圖片在轉）。請照下表生成特效圖，放進 `assets/vfx/` 跟我說，我會一個一個換進招式裡。

共用規則和前兩批一樣（純黑背景、4×4 共 16 格、同一段動畫）。**寫「toward the LEFT」的特效，一定要畫成往畫面左邊移動**（怪物在右邊、主角在左邊）。

### A 組：最假的幾個，請先做

| # | 檔名 | 現在很假的地方 | 用在哪些招式 | 特效描述 |
|---|---|---|---|---|
| 19 | `vine_whip.png` | 一張藤蔓圖片在旋轉 | 森林菁英「藤鞭」、傳奇「世界樹之怒」 | `A thick thorny green vine whip lashing toward the LEFT: frames 1-4 the vine coils back on the right side, frames 5-9 it snaps forward in a fast curved whip motion to the far left with motion blur and flying leaves, frames 10-16 it recoils back to the right and fades. At full stretch the vine fills the width of the cell.` |
| 20 | `thorn_burst.png` | 藤蔓圖片從地上冒出來 | 森林魔王「荊棘爆發」、森林怪物第二攻擊 | `A cluster of sharp thorny green vines bursting up out of the ground at the bottom of the cell: frames 1-3 the ground cracks with a green glow, frames 4-9 several thorny vines shoot upward and twist, frames 10-13 they hold and wiggle, frames 14-16 they sink back and fade with a few leaves.` |
| 21 | `root_burst.png` | 手畫的樹根 | 森林魔王「巨木根」、傳奇「世界樹之怒」 | `Huge gnarled brown tree roots erupting from the ground at the bottom of the cell: frames 1-3 dirt and rocks burst up, frames 4-9 thick roots rise high and arch over, frames 10-13 they slam down, frames 14-16 dust settles and they fade.` |
| 22 | `lightning_h.png` | 用光條拼出來的閃電 | 雷電菁英「雷光直擊」、魔王「連鎖閃電」 | `A horizontal lightning bolt shooting from the right edge to the LEFT edge of the cell: frames 1-2 a thin crackling lead, frames 3-7 a thick blinding white-blue jagged bolt with branches across the whole width, frames 8-12 it flickers and re-forks, frames 13-16 small arcs fade.` |
| 23 | `fire_breath.png` | 火焰小圖示一顆一顆噴出去 | 火焰菁英「火焰噴射」、龍「龍息」「龍焰掃地」 | `A roaring stream of dragon fire blowing from the right edge toward the LEFT, filling the width of the cell, seamless looping animation: the stream churns and flickers, wide and bright orange-yellow with a white-hot core, curling flame tongues and sparks at the front. Frame 16 flows back into frame 1.` |
| 24 | `storm_cloud.png` | 灰色光團當烏雲 | 雷電魔王「雷暴」、傳奇「雷神之鎚」、雷電怪物第二攻擊 | `A dark heavy thundercloud seen from the side, wide and flat in the upper part of the cell, seamless looping animation: the cloud slowly churns and lightning flashes light it up from inside in a few frames. Frame 16 flows back into frame 1.` |
| 25 | `ghost_hand.png` | 手畫的紫色手 | 幽靈菁英「幽冥之手」 | `A ghostly translucent purple hand rising out of a dark swirl on the ground at the bottom of the cell: frames 1-4 the swirl opens, frames 5-9 the clawed hand reaches up high, frames 10-12 it closes into a grabbing fist, frames 13-16 it dissolves into purple smoke.` |
| 26 | `flower_bloom.png` | 花朵圖片放大旋轉 | 森林傳奇「花之風暴」 | `A giant magical pink flower bud in the center: frames 1-4 the bud glows and swells, frames 5-10 the petals open into a huge glowing blossom, frames 11-16 the blossom bursts into a storm of pink petals and golden pollen light that fly outward.` |

### B 組：其他也想換的

| # | 檔名 | 現在很假的地方 | 用在哪些招式 | 特效描述 |
|---|---|---|---|---|
| 27 | `frost_breath.png` | 白色光團 | 冰菁英「冰霜吐息」 | `An icy blizzard breath stream blowing from the right edge toward the LEFT across the cell, seamless looping animation: swirling white-blue frost mist with snowflakes and tiny ice crystals. Frame 16 flows back into frame 1.` |
| 28 | `water_beam.png` | 藍色光條 | 海洋菁英「水砲」 | `A powerful horizontal water cannon jet from the right edge to the LEFT edge of the cell, seamless looping animation: a thick spiraling blue water stream with white foam and droplets spraying off. Frame 16 flows back into frame 1.` |
| 29 | `laser_beam.png` | 紅色光條 | 機械魔王「軌道雷射」、傳奇「衛星砲」、機械怪物第二攻擊 | `A vertical red energy laser beam from the top of the cell to the bottom, seamless looping animation: a bright white core with a glowing red-orange outer beam, energy rings rippling down along it and sparks where it hits the bottom. Frame 16 flows back into frame 1.` |
| 30 | `fireball.png` | 火焰小圖示加光團 | 火焰菁英「火球三連」、龍菁英「龍炎彈」 | `A blazing fireball flying toward the LEFT, seamless looping animation: a round core of white-yellow fire with swirling orange flames and a long flickering fire tail trailing to the right. Frame 16 flows back into frame 1.` |
| 31 | `meteor.png` | 火焰圖示往下掉 | 火焰魔王「隕石雨」 | `A flaming rock meteor falling diagonally from the upper right toward the lower LEFT, seamless looping animation: a dark rock wrapped in fire with a long blazing tail and smoke. Frame 16 flows back into frame 1.` |
| 32 | `water_spout.png` | 藍色光柱 | 海洋魔王「漩渦水柱」、傳奇「水龍」 | `A tall spout of water erupting straight up from the bottom of the cell: frames 1-3 the water surface bulges, frames 4-10 a thick swirling column of blue water and foam shoots up to the top, frames 11-16 it collapses into falling splashes.` |
| 33 | `poison_geyser.png` | 綠色光柱 | 毒魔王「毒沼噴泉」 | `A geyser of bubbling toxic purple and lime-green liquid erupting straight up from the bottom of the cell: frames 1-3 bubbles, frames 4-10 the column shoots up with toxic droplets, frames 11-16 it splashes down into fizzing bubbles.` |
| 34 | `whirlpool.png` | 地上的圓圈 | 海洋魔王「漩渦水柱」 | `A swirling water whirlpool seen from a low side angle (a flat ellipse on the ground), seamless looping animation: spiraling blue water and white foam rushing into a dark center. Frame 16 flows back into frame 1.` |
| 35 | `quicksand.png` | 地上的圓圈 | 沙漠魔王「流沙陷阱」 | `A swirling quicksand pit seen from a low side angle (a flat ellipse on the ground), seamless looping animation: tan sand spiraling into a dark sinking center with dust lifting off the edge. Frame 16 flows back into frame 1.` |
| 36 | `dark_portal.png` | 圓圈加煙 | 幽靈傳奇「冥界之門」 | `A swirling dark portal in the center, seamless looping animation: a ring of purple and black energy spinning around a deep dark center, wisps of purple smoke and small spirit lights pulled into it. Frame 16 flows back into frame 1.` |
| 37 | `wind_blade.png` | 手畫的月牙 | 天空菁英「風刃」、沙漠菁英「沙刃」 | `A crescent-shaped blade of wind flying toward the LEFT, seamless looping animation: a sharp pale white-blue curved slash of air with swirling streaks and a few leaves, the curve bulging toward the left. Frame 16 flows back into frame 1.` |
| 38 | `sun_orb.png` | 光團 | 火焰傳奇「太陽墜落」 | `A blazing miniature sun in the center, seamless looping animation: a white-hot core, a boiling orange-red surface, solar flares and a flickering fiery corona around it. Frame 16 flows back into frame 1.` |
| 39 | `lava_crack.png` | 橘色光條 | 火焰傳奇「火山爆發」 | `A glowing crack splitting open across the ground in the lower part of the cell, wide and flat: frames 1-5 the crack spreads from the center to both sides, frames 6-12 bright orange lava glows and bubbles in it with sparks rising, frames 13-16 it cools and dims.` |
| 40 | `energy_pillar.png` | 白色光條 | 傳奇蓄力、雷電傳奇「雷神之鎚」 | `A tall vertical pillar of white-gold energy shooting from the bottom of the cell to the top: frames 1-3 a thin bright line, frames 4-10 a wide blinding column with spiraling energy and sparks, frames 11-16 it narrows and fades into floating light particles.` |
| 41 | `water_dragon.png` | 一串藍色光球 | 海洋傳奇「水龍」 | `A long serpent dragon made entirely of flowing water flying toward the LEFT, its body undulating in an S-shape across the cell, seamless looping animation: a glowing blue water body, a foam mane, spraying droplets. Frame 16 flows back into frame 1.` |
| 42 | `fire_dragon.png` | 一串橘色光球 | 龍傳奇「龍神降臨」 | `A long serpent dragon made entirely of fire flying toward the LEFT, its body undulating in an S-shape across the cell, seamless looping animation: a blazing orange-yellow flame body, a burning mane, trailing embers. Frame 16 flows back into frame 1.` |

### 注意
- 這批很多張，**先做 A 組 8 張**（19～26），這幾張改善最明顯。
- **方向很重要**：寫「toward the LEFT」的一定要往左。如果 AI 畫成往右，我也可以翻轉，但請跟我說是哪幾張。
- 跟前兩批一樣，每張可以做兩版（檔名加 `-1`），我挑比較好的。
- 石頭、骨頭、冰刺、金字塔、泡泡、光劍這類「東西」，請看 [道具圖 prompt](prop-spritesheet-prompt.md) 的第二批。
