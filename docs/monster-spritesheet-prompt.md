# 怪物精靈圖 Prompt（詳細版）

用途：請圖片 AI（ChatGPT、Midjourney、Google Flow 等）依一張**怪物原圖**，產出遊戲用的動作精靈圖（Sprite Sheet）。
每個動作產**一張格子圖**。拿到圖後傳給我，我負責切圖、去背、對齊、放進遊戲。

---

## 一、先填這四格（每隻怪物只填一次）

| 項目 | 填寫 | 備註 |
|---|---|---|
| 怪物代號與名稱 | 例：m1 垃圾桶怪 (Binny) | 對應遊戲中的怪物名稱 |
| 主要特徵 / 攻擊部位 | 例：尖牙大嘴、鐵蓋、兩隻短手 | 沒有手拿武器就寫怪物的攻擊身體部位 |
| 角色面向 | **面向左 (Faces LEFT)** | ⚠️ 怪物必須面向左邊，與主角（面向右）對峙 |
| 背景顏色 | **純綠色 `#00FF00`** 或 **純洋紅 `#FF00FF`** | ⚠️ 若怪物本身有綠色（如史萊姆、青蛙、植物），**一定要改用純洋紅 `#FF00FF`** |

---

## 二、怪物需要的 4 個動作規格

| 動作 | 格數 | 排列（欄 × 列） | 說明 |
|---|---|---|---|
| **Idle 待機** | **8** | 4 × 2 | 面向左；原地呼吸、身體微幅上下彈性收縮，第 8 格要能順接第 1 格 |
| **Attack 攻擊** | **8** | 4 × 2 | 面向左；蓄力後往左側撲擊、咬擊、揮爪或吐出攻擊物，再收回站姿 |
| **Hit 受傷** | **6** | 3 × 2 | 面向左；受到來自左側的打擊，身體向右後方震退、歪斜、眼冒金星或閉眼 |
| **Defeat 倒下** | **6** | 3 × 2 | 面向左；失去力量倒臥地面、癱軟倒下、最後一格靜止在地面上 |

---

## 三、通用 Prompt 模板（English Template）

> 將 `[MONSTER_NAME]`、`[FEATURE]`、`[ACTION]`、`[COLS]`、`[ROWS]`、`[N]` 與最後的動作逐格描述代入：

```text
Using the attached monster character image as the exact reference, create a game sprite sheet: ONE image containing [N] animation frames of the SAME monster performing the action "[ACTION]", arranged in a grid of [COLS] columns x [ROWS] rows, read left-to-right then top-to-bottom as the frame order 1..[N].

CHARACTER CONSISTENCY
- The monster must be identical to the reference in every frame: same body shape, textures, colors, eyes, teeth, mouth, proportions and art style. Do not redesign or alter features.
- Key features ([FEATURE]) must stay consistent in every single frame.
- The monster ALWAYS faces LEFT toward the player in every frame and never turns around, turns its back, or faces right.

SIZE AND POSITION
- The monster is the exact same size in every frame: same scale, same height, same proportions. No zoom in, no zoom out, no perspective distortion.
- Every frame has its own invisible cell of identical size. The monster stands/rests in the middle of the cell with its BASE / FEET on the same horizontal baseline (about 10% above the bottom edge of the cell) in every frame.
- The monster (including lunging or stretching during attack) must stay completely inside its own cell with at least 15% empty margin on every side. Nothing may touch or cross a cell edge or overlap a neighbouring cell.
- Equal cell sizes, perfectly aligned rows and columns. No visible grid lines, borders, frame numbers, labels or text.

BACKGROUND
- A single solid flat pure green #00FF00 (or pure magenta #FF00FF if monster is green) background everywhere. No ground texture, no floor, no shadows on the ground, no glow, no gradient, no dust particles.

STYLE AND QUALITY
- Same clean, high-resolution, cel-shaded / cartoon game-art style as the reference, sharp edges, high resolution (at least 3000 px wide).
- No motion blur, no afterimages, no ghosting, no speed lines.
- NO extra visual effects: no sparks, no slash lines, no elemental magic rings, no impact stars. Draw only the monster itself.

FRAME-BY-FRAME DESCRIPTION
[貼上下方對應動作的逐格內容]
```

---

## 四、各動作逐格描述（直接貼入上方最後一段）

### 1. Idle 待機（8 格，4 × 2，面向左）
```text
A living monster idle breathing / bouncing loop facing LEFT.
Frame 1: Neutral ready stance of the reference image, facing left.
Frames 2-4: Inhaling / expanding slightly, chest or body squashes and stretches slightly upward, eyes looking forward to the left.
Frame 5: Peak of the breath / stretch.
Frames 6-7: Exhaling / settling back down with organic elasticity.
Frame 8: Smoothly returns to the identical pose of Frame 1 to make a seamless loop.
Feet/base remain planted on the ground baseline.
```

### 2. Attack 攻擊（8 格，4 × 2，面向左）
```text
A monster melee attack lunging toward the LEFT, then recovering.
Frame 1: Neutral ready stance facing left.
Frame 2: Leaning backward slightly, coiling body to anticipate attack.
Frame 3: Wind-up: pulling body and head back to the right, mouth opening wide or raising claws/arms.
Frame 4: Peak of the anticipation, tensed and ready.
Frame 5: Rapid forward thrust/lunge toward the left side.
Frame 6: Full extension: biting forward or striking hard toward the left target.
Frame 7: Follow-through and momentary hold of the extended pose.
Frame 8: Snapping back and recovering to the neutral ready stance of Frame 1.
No impact effects or speed lines.
```

### 3. Hit 受傷（6 格，3 × 2，面向左）
```text
The monster is hit by a player strike coming from the left, reacts, and recovers.
Frame 1: Neutral ready stance facing left.
Frame 2: Moment of impact: head and body flinch violently backward (to the right), eyes squint shut in shock or mouth opens in pain.
Frame 3: Maximum knockback recoil: upper body pushed backward to the right, slightly lifted off baseline.
Frame 4: Staggering and trying to regain balance, grimacing.
Frame 5: Leaning forward back toward the left, eyes refocusing.
Frame 6: Recovered back to the neutral ready stance of Frame 1.
No hit spark or star effects.
```

### 4. Defeat 倒下（6 格，3 × 2，面向左）
```text
The monster is defeated and collapses to the ground facing left.
Frame 1: Neutral ready stance facing left, looking exhausted.
Frame 2: Struck hard, eyes closing, body slumping.
Frame 3: Staggering backward to the right, losing balance and consciousness.
Frame 4: Knees/body buckling down, sinking toward the floor.
Frame 5: Falling over onto the ground, head hitting the surface.
Frame 6: Motionless defeated pose lying flat or slumped on the ground, eyes closed (or X-eyes), completely still.
No smoke poofs or fade out.
```

---

## 五、常見問題與注意事項

1. **怪物面向一定要是左邊（Facing Left）：** 主角站在畫面左邊面向右邊，怪物站在畫面右邊面向左邊。
2. **顏色衝突：** 如果怪物本身有綠色（如史萊姆、植物怪物、綠色皮膚外星人），背景請務必指定純洋紅 `#FF00FF`（Magenta），否則去背時怪物的身體會變透明！
3. **沒有武器的怪：** 模板中已經去除手持武器的硬性要求，改為鎖定怪物的身體特徵（Body shape, teeth, eyes）。
