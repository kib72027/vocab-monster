# 道具與夥伴圖 Prompt（取代表情符號物品）

用途：遊戲裡還有一些用表情符號畫的「東西」，例如工程師的機器人 🤖、飛刀 🗡️、齒輪 ⚙️、火箭 🚀、盾牌 🛡️。這些看起來很假，請圖片 AI 畫成跟主角同風格的圖。

拿到圖後放到 `assets/props/`，檔名照下表，我負責去背、切格、放進遊戲。

**畫風一致的小技巧：** 生成時附上一張主角圖（例如 `assets/heroes/h9/avatar.jpg` 工程師）當參考，跟 AI 說「match the art style of the attached character」。

---

## 共用規則（每張都貼在 prompt 最後面）

```text
STYLE
Cute stylized chibi fantasy mobile RPG art, hand-painted, soft clean shading, gentle highlights, bold readable shapes,
thin dark outline, vibrant colors. Match the art style of the attached character image.

FORMAT
Square image 2048x2048. Solid pure green background (#00FF00) everywhere, completely flat, no gradient, no shadow on the
ground, no floor. Each object is centered in its own cell, fully visible, not touching the cell borders, with clear empty
space around it. No grid lines.

DO NOT INCLUDE
No text, no numbers, no logo, no watermark, no frame, no background scenery, no extra objects.
```

> ⚠️ 背景用純綠 `#00FF00`；如果物品本身是綠色（例如葉子、藤蔓），那張改用**純洋紅 `#FF00FF`**，並把共用規則裡的 `#00FF00` 換掉。

---

## 1. `robot.png`：工程師的機器人夥伴（最重要）

用在：工程師第二大絕招「機器人援軍」。2×2 格，同一隻機器人的 4 個動作。

```text
A 2x2 grid (4 equal cells) of the SAME small cute helper robot built by a young fantasy engineer: round brass and
steel body, glowing cyan eyes, one arm is a small cannon, little antenna, gears and rivets, sturdy short legs.
The robot faces RIGHT in every cell and looks identical in every cell (same design, colors and size).
Cell 1 (top-left): standing ready, slight lean forward.
Cell 2 (top-right): charging up, the arm cannon raised and pointing right, its muzzle glowing orange.
Cell 3 (bottom-left): firing, recoil leaning back, a bright orange-white muzzle flash at the cannon tip pointing right.
Cell 4 (bottom-right): landing from a jump, knees bent, small dust puff at the feet.
```

## 2. `turret.png`：工程師的砲塔

用在：工程師第一大絕招「機械砲轟」。2×2 格，同一座砲塔。

```text
A 2x2 grid (4 equal cells) of the SAME small cute steampunk gatling turret on a short tripod: brass and steel, gears on
the side, a rotating multi-barrel gun pointing RIGHT, a little glowing core. Identical design and size in every cell.
Cell 1: idle. Cell 2: barrels spinning (motion lines), core glowing. Cell 3: firing, bright muzzle flash at the barrel
tip on the right. Cell 4: firing a big shot, stronger flash, recoil leaning back, puff of smoke.
```

## 3. `weapons.png`：武器與機械零件

用在：各主角的普通攻擊、收尾、大絕招。4×4 格，16 樣不同的物品，**有方向性的東西一律指向右邊**。

```text
A 4x4 grid (16 equal cells), one different object per cell, all in the same style and similar size:
1 a sharp silver throwing dagger pointing right
2 an ice-blue dragon knight spear pointing right, frosty glow on the tip
3 a chunky orange-handled wrench
4 a shiny steel bolt and nut
5 a bronze cog gear
6 a small steel gear with teeth
7 a cute small rocket pointing right with a flame at its tail
8 a round cannonball with a lit fuse
9 a golden knight shield with a blue gem in the center, front view
10 a glowing purple crystal ball with swirling mist inside
11 a golden hourglass with glowing blue sand
12 a pink glowing heart
13 a white angel feather
14 a golden glowing paw print
15 a sharp purple magic crystal shard
16 a sharp light-blue ice shard
```

## 4. `nature.png`：自然類（用**洋紅**背景）

用在：森林場景飄落的葉子、弓箭手的藤蔓、花瓣。2×2 格。

```text
A 2x2 grid (4 equal cells), one object per cell, on a solid pure magenta background (#FF00FF):
1 a single bright green leaf
2 a curling green vine with small leaves
3 a pink cherry blossom flower
4 a single pink flower petal
```

---

## 注意

- **物品要在格子正中央，不要碰到格線**，我才能乾淨地切開。
- **背景要純色、不能有陰影或地板**，去背才會乾淨。
- **有方向的東西（飛刀、長槍、火箭、機器人、砲塔）要面向右邊**，因為主角在左邊、怪物在右邊。
- 每樣做兩張讓我挑也可以，檔名加 `-1`（例如 `robot-1.png`）。
- 不用一次做完，**先做 1～3 號**（機器人、砲塔、武器）。

---

## 第二批：`props-2.png`，取代絕招裡手畫的東西

絕招裡的石頭、骨頭、冰刺、金字塔、泡泡、光劍、光箭、風之弓目前是程式畫的簡單圖形，看起來很假。
**這張圖放進 `assets/props/` 後，遊戲會自動換上，不用改招式**。所以每樣東西的**方向一定要照下面寫的畫**（程式是照這個方向去轉動它們）。

4×4 格，純綠背景 `#00FF00`，共用規則貼在最後面。

```text
A 4x4 grid (16 equal cells), one different object per cell, all in the same style and similar size.
Every object is centered in its own cell, fully visible, not touching the cell borders.
IMPORTANT: draw each object in EXACTLY the direction written below.
1 a large rough brown-grey boulder, round and heavy
2 a small jagged rock chunk
3 a golden ancient pyramid with a glowing cyan eye symbol, seen from the front
4 a clear shiny soap bubble with a white highlight, mostly transparent in the middle
5 a single white bone spike, standing STRAIGHT UP, the sharp pointed end at the TOP, the knobby joint at the bottom
6 a giant skeletal hand, palm facing the viewer, fingers pointing STRAIGHT UP, wrist at the bottom
7 a big translucent blue ice block with sharp edges, cube-like
8 a sharp light-blue ice spike, standing STRAIGHT UP, the point at the TOP
9 a round dark metal land mine with a small red light on top
10 a short piece of heavy iron chain, horizontal
11 a thick gnarled brown tree root with a few small leaves, standing STRAIGHT UP, the pointed tip at the TOP
12 a glowing golden holy sword of light, pointing STRAIGHT DOWN (blade tip at the BOTTOM, handle at the top)
13 a glowing green arrow of light, pointing straight to the RIGHT
14 a glowing green bow made of wind and leaves, facing RIGHT (the bow curves out to the right, the string on the left)
15 a single large glowing white feathered angel wing, spreading upward to the right
16 a cute cartoon skull, front view
```

### 注意
- **方向最重要**：5、6、8、11 朝上，12 朝下，13、14 朝右。方向不對的話，招式裡的東西會歪掉或倒過來。
- 這張是綠背景；冰塊、泡泡要畫得清楚有邊框，去背後才看得到。
- 可以做兩版（`props-2-1.png`），我挑比較好的。
