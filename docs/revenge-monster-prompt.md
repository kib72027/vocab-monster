# 復仇怪 Prompt

用途：「復仇怪」是**答錯的單字變成怪物回來找你**。現在復仇戰是隨便抽一隻普通怪物，看不出是復仇怪。請圖片 AI 畫一隻專屬的復仇怪，拿到圖後放到 `assets/monsters/revenge/`，我負責去背、切格、放進遊戲。

## 設計概念
一隻調皮又有點生氣的「錯題幽靈」：身體是**揉皺的考卷**，上面有**紅色打叉**和寫錯的英文字母，身邊飄著亂飛的字母，帶著紫色火焰光暈。要可愛、不可怕（給國小四年級）。

做 **2×2 共 4 隻**，同一隻怪物的 4 個等級（錯的字越多，出現越強的那隻）：

| 格 | 等級 | 什麼時候出現 |
|---|---|---|
| 1（左上） | 小復仇怪 | 錯 1～3 個字 |
| 2（右上） | 復仇怪 | 錯 4～6 個字 |
| 3（左下） | 大復仇怪 | 錯 7～9 個字 |
| 4（右下） | 復仇怪王 | 錯 10 個字以上 |

## 給圖片 AI 的 prompt（English）

**畫風一致的小技巧：** 附上一張遊戲裡的怪物圖（例如 `assets/monsters/set-1/` 裡的圖）當參考，跟 AI 說「match the art style of the attached monster」。

```text
A 2x2 grid (4 equal cells) showing the SAME original monster character at 4 power levels, for a cute fantasy mobile RPG.

THE MONSTER: "the Mistake Ghost" - a mischievous little phantom whose body is a crumpled sheet of school test paper,
with big red X marks and red circles drawn on it, a few wrong English letters scribbled on its body, two glowing
angry-but-cute eyes and a jagged grin, wispy paper-tail bottom instead of legs, small stubby paper arms,
floating loose alphabet letters around it, a purple flame aura.

LEVELS (left to right, top to bottom):
Cell 1: small and cute, a single crumpled page, a tiny purple aura, two floating letters.
Cell 2: bigger, a few pages stuck together, a stronger purple flame aura, more floating letters, holding a red pencil like a spear.
Cell 3: large, a thick stack of crumpled test papers forming its body, a red pen crown, an angry face, a swirling ring of letters.
Cell 4: the king - huge, a cape made of red-marked test papers, a golden crown with an "X" emblem, holding a giant red pencil scepter,
        blazing purple flames, a storm of flying letters around it.

STYLE
Cute stylized chibi fantasy mobile RPG art, hand-painted, soft clean shading, bold readable shapes, thin dark outline,
vibrant colors. Kid-friendly: mischievous, not scary. Match the art style of the attached monster image.

POSE AND FORMAT
Every monster FACES LEFT (toward the player on the left), full body visible, centered in its own cell, not touching the
cell borders, the same scale feel across levels (each level clearly bigger and more powerful than the last).
Square image 2048x2048. Solid pure green background (#00FF00) everywhere, completely flat, no shadow, no floor, no grid lines.

DO NOT INCLUDE
No text, no words, no numbers, no logo, no watermark, no frame, no background scenery, no other characters.
```

## 注意
- **一定要面向左邊**（主角在左邊）。
- 背景純綠 `#00FF00`；如果 AI 把怪物畫成綠色，請改用純洋紅 `#FF00FF` 背景。
- 字母可以有，但不要有完整的單字或句子（`no words`）。
- 可以做兩版（`revenge-1.png`），我挑比較好的。
