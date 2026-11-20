# 主角／怪物精靈圖 Prompt（詳細版）

用途：請圖片 AI（ChatGPT、Google Flow 等）依一張**角色原圖**，產出遊戲用的動作精靈圖。
每個動作產**一張格子圖**。拿到圖後傳給我，我負責切圖、去背、對齊、放進遊戲。

> 這份取代之前的 `hero-animation-spec.md` 和 `hero-video-spec.md`。
> 實測結論：影片 AI 常常自己推拉鏡頭（角色忽大忽小）、加灰塵特效；格子圖的角色大小與位置比較穩定，所以用格子圖。

---

## 一、先填這四格（每個角色只填一次）

| 項目 | 填寫 |
|---|---|
| 角色代號與名字 | 例：h1 紅髮劍士 |
| 武器 | 例：一把長劍（劍身銀色、護手金色） |
| 武器拿在哪一隻手 | **以角色原圖為準**，例：角色的右手（面向右時，是畫面左邊那隻手） |
| 角色面向 | 面向**右**（怪物面向**左**） |

---

## 二、每個動作要幾格才會順？

遊戲裡逐格播放，大約每秒 10 到 12 格，我另外會在格與格之間做淡入淡出，讓動作更滑。
格數太少會一格一格跳，格數太多 AI 容易出錯（武器消失、左右手互換、超出格子）。

| 動作 | 格數 | 排列（欄 × 列） | 說明 |
|---|---|---|---|
| Idle 待機 | **8** | 4 × 2 | 可無縫循環；第 8 格要能接回第 1 格 |
| Attack 攻擊 | **8** | 4 × 2 | 少於 6 格會跳；8 格剛好 |
| Hit 受傷 | **6** | 3 × 2 | 受傷很短，6 格足夠 |
| Victory 勝利 | **8** | 4 × 2 | 跳起來要有起跳、最高點、落地 |
| Defeat 倒下（只有怪物） | **6** | 3 × 2 | 最後一格是倒在地上的樣子 |

---

## 三、要不要去背景？

**請 AI 直接畫在純綠色背景 `#00FF00` 上，不要要求透明背景。** 我會自己去背。
理由：AI 說的「透明背景」常常其實是白底或灰白棋盤格，白色（盔甲、牙齒）會連角色一起被摳掉，反而更麻煩。

- 角色本身有綠色（綠色衣服、植物、毒怪）：改用純洋紅 `#FF00FF` 背景。
- 背景必須是**一整片同一個顏色**：沒有地面、陰影、光暈、漸層、格線、文字。
- 如果工具真的能輸出透明 PNG，也可以用，但請先把圖放在彩色背景上確認真的是透明。

---

## 四、通用 Prompt（每個動作都貼這一段，再加上第五節的動作內容）

```
Using the attached character image as the exact reference, create a game sprite sheet: ONE image containing [N] animation frames of the SAME character performing the action "[ACTION]", arranged in a grid of [COLS] columns x [ROWS] rows, read left-to-right then top-to-bottom as the frame order 1..[N].

CHARACTER CONSISTENCY
- The character must be identical to the reference in every frame: same face, hair, outfit, colors, proportions and art style. Do not redesign anything.
- The weapon "[WEAPON]" must be clearly visible in EVERY single frame. Never remove it, hide it completely, replace it with an empty hand, or change its shape/size/color. If the pose puts the weapon behind the body, keep at least the blade/head of it visible past the shoulder.
- The weapon is always held in the character's [RIGHT/LEFT] hand, exactly as in the reference. NEVER swap hands, NEVER mirror the character, NEVER move the weapon to the other hand in any frame.
- The character faces [RIGHT/LEFT] in every frame and never turns around or turns its back.

SIZE AND POSITION
- The character is the exact same size in every frame: same head size, same body height, same scale. No zoom in, no zoom out, no frame is bigger or smaller than another. Do not use perspective changes.
- Every frame has its own invisible cell of identical size. The character stands in the middle of the cell with the FEET on the same horizontal baseline (about 10% above the bottom edge of the cell) in every frame, except during a jump.
- The character (including the weapon at its widest swing) must stay completely inside its own cell with at least 15% empty margin on every side. Nothing may touch or cross a cell edge or overlap a neighbouring cell. To leave room for the weapon, draw the character at about 60-65% of the cell height.
- Equal cell sizes, perfectly aligned rows and columns. No grid lines, borders, frame numbers, labels or text.

BACKGROUND
- A single solid flat pure green #00FF00 background everywhere. No ground, no floor, no shadow, no glow, no gradient, no texture, no particles.

STYLE AND QUALITY
- Same clean, high-resolution, cel-shaded game-art style as the reference, sharp edges, high resolution (at least 3000 px wide).
- No motion blur, no afterimages, no ghosting, no speed lines, no trails.
- NO effects of any kind: no slash arcs, no magic, no sparks, no dust, no smoke, no impact stars, no hit flashes. Draw only the character and its weapon.

FRAME-BY-FRAME DESCRIPTION
[把第五節對應動作的逐格內容貼在這裡]
```

---

## 五、各動作的逐格內容（貼到上面最後一段）

### Idle 待機（8 格，4 × 2）
```
A calm standing idle loop with very small movement. Frame 1 is the neutral ready stance of the reference pose. Frames 2-4: slow breathing in, shoulders and chest rise slightly, hair, cape and clothes drift slightly one way. Frame 5 is the highest point of the breath. Frames 6-7: breathing out, body settles slightly lower, hair and cloth drift back. Frame 8 is almost identical to frame 1 so that the loop repeats seamlessly. One blink may occur around frame 5. Feet never move. The weapon stays held in the same hand and only sways slightly.
```

### Attack 攻擊（8 格，4 × 2）
```
A fast weapon attack toward the right, then returning to the ready stance. Frame 1: neutral ready stance (same as idle frame 1). Frame 2: body leans back slightly and the weapon starts to be drawn back. Frame 3: wind-up, weapon pulled far back (above or behind the shoulder), body coiled, knees bent. Frame 4: peak of the wind-up, a short held pose, weapon still clearly visible. Frame 5: the strike begins, body lunges forward, weapon swinging through the middle of the arc. Frame 6: full extension, weapon fully extended forward at the target, body leaning forward. Frame 7: follow-through, weapon past the target, body slightly off balance. Frame 8: recovering, back close to the ready stance of frame 1. Show the weapon in a clear distinct position in every frame; do not draw any slash effect.
```
（法杖／魔法類角色：把 swing 改成 "thrust the staff forward and cast"，仍然不要畫魔法特效。）

### Hit 受傷（6 格，3 × 2）
```
The character is struck and reacts, then recovers. Frame 1: neutral ready stance. Frame 2: the moment of impact, body flinches, eyes squeeze shut, mouth open in pain. Frame 3: maximum recoil, upper body thrown backward, head tilted back, one foot lifting, weapon still held. Frame 4: staggering back one step, grimacing with clenched teeth. Frame 5: regaining balance, leaning forward again, eyes opening. Frame 6: back to the neutral ready stance of frame 1. Do not draw any impact effect, stars or lines.
```

### Victory 勝利（8 格，4 × 2）
```
A happy victory jump, then back to the ready stance. Frame 1: neutral ready stance. Frame 2: crouching down to prepare the jump, knees bent. Frame 3: leaving the ground, arms and weapon starting to rise. Frame 4: peak of the jump, high in the air, weapon raised overhead, big happy open-mouth smile. Frame 5: still airborne, starting to come down, cheering. Frame 6: landing, knees bent, squashed pose. Frame 7: standing tall, weapon raised in a proud cheering pose, eyes closed with a smile. Frame 8: back to the neutral ready stance. Keep the weapon in the same hand in every frame. Jump height: the character may rise up to 25% of the cell height; the head must still stay inside the cell.
```

### Defeat 倒下（怪物用，6 格，3 × 2）
```
The monster is defeated. Frame 1: neutral ready stance. Frame 2: struck, flinching, eyes shut. Frame 3: staggering backward, losing strength. Frame 4: knees buckling, body sinking down. Frame 5: falling over to the ground. Frame 6: lying on the ground, eyes closed, motionless. No smoke, stars or effects.
```

---

## 六、生成完先自己檢查（有一項不符合就重畫）

- [ ] 每一格武器都在，而且是同一把
- [ ] 每一格武器都在同一隻手，沒有左右手互換、沒有整個角色被鏡像
- [ ] 角色每一格一樣大（頭的大小一致）
- [ ] 每一格腳底在同一條線上（跳躍除外）
- [ ] 角色和武器都沒有碰到或超出自己的格子，也沒有和隔壁格子重疊
- [ ] 背景是純綠色，沒有陰影、地面、格線
- [ ] 沒有殘影、模糊、特效、文字、編號
- [ ] 格數正確、順序正確（由左到右、由上到下）
- [ ] Idle 的第 8 格和第 1 格很像；Attack/Hit/Victory 的最後一格和第一格是同一個站姿

---

## 七、常見錯誤的「補救 Prompt」（只重畫有問題的格子，其他格子不變）

**武器不見：**
```
Regenerate the same sheet. Keep all other frames exactly as they are. Only fix frame [K]: the [WEAPON] is missing. Draw the character in the same pose but holding the [WEAPON] in the [RIGHT/LEFT] hand, clearly visible, same size and design as in the other frames.
```

**左右手相反：**
```
Regenerate the same sheet. Keep all other frames exactly as they are. Only fix frame [K]: the weapon is in the wrong hand. The weapon must be held in the character's [RIGHT/LEFT] hand like in the reference image and in every other frame. Do not mirror the character.
```

**超出格子或太靠邊：**
```
Regenerate the same sheet with every character drawn smaller, about 60% of the cell height, centered in its cell with at least 15% empty margin on all sides, so that the weapon never touches a cell edge.
```

**角色大小不一致：**
```
Regenerate the same sheet. Every frame must show the character at exactly the same scale as the reference (same head size, same body height). Do not zoom or change the camera distance between frames.
```

**有特效或殘影：**
```
Regenerate the same sheet with absolutely no motion blur, afterimages, slash arcs, dust, sparks or any effect. Only the character and the weapon on a flat green background.
```

---

## 八、小技巧

- **每次都要附上同一張角色原圖。**
- **一次產 4 張，挑最好的一張。** 通常 4 張裡只有 1 張完全沒問題。
- **一個動作一張圖，** 不要把所有動作塞在同一張。
- 格數越多越容易出錯。如果 8 格老是壞，可以改成 6 格，我用淡入淡出補順。
- 有 1 到 2 格壞掉也沒關係，我可以丟掉那幾格用相鄰格補；但**整張圖角色大小不一致、或武器消失超過 2 格**，建議整張重畫。

---

## 九、交付給我

1. 每個動作的格子圖（PNG 優先，其次 JPG），**用「檔案」傳，不要截圖、不要用相簿**。
2. 角色原圖。
3. 角色代號（例如 h1）以及要取代的是哪一位。
4. 如果有格子順序不是由左到右、由上到下，請告訴我。

## 十、我會做的事（不用你做）

- 依角色輪廓切格（不依固定格線，劍尖碰到邊也能切）。
- 去綠背景、去綠邊。
- 用腳底和身體重心對齊每一格，並檢查大小是否一致。
- 丟掉壞格、用相鄰格補。
- 接進遊戲，並把原圖和切好的格子分資料夾放進 GitHub（`assets/heroes/<角色>/source`、`frames`）。
