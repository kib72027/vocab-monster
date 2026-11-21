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
