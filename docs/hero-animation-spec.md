# 角色動畫圖需求（給 ChatGPT）

請依照下面的規格，為「附上的參考角色」產生動畫圖。
每個角色要產 **4 張圖**，一張一種動作，每張都是**一排**。
所有圖都要使用**同一個角色**，設計、比例、顏色、服裝跟參考圖完全一致。

---

## 一、共通規格（每張圖都要符合）

1. **背景：**
   - 優先：**透明背景的 PNG**。
   - 如果做不到透明，請改成**單一純色 `#00FF00`（亮綠）**，不要地面、不要陰影、不要漸層。
   - 如果角色本身有綠色，改用 `#FF00FF`（洋紅）。
   - **不要用白色或灰白棋盤格當背景**（角色有白色、銀色的部分，會被一起去掉）。
2. **排列：**
   - 只有**一排**，從左到右依序排列。
   - 每一格大小相同，格與格之間留出空白。
   - 角色和特效都不能碰到或跨到旁邊的格子。
3. **圖上不要有任何文字、編號、標題、框線。**
4. **每一格的角色：**
   - 大小、頭身比例、服裝、配色都要一致。
   - 腳底（站立的那條線）在每一格的同一個高度。
   - 身體重心在每一格的同一個水平位置。
5. **方向：**
   - 主角面向**右**。
   - 怪物面向**左**（朝向主角）。
6. **解析度：** 越大越好，每一格至少 **512 × 512**。
7. **不要畫特效**（揮劍的弧光、命中的爆光、魔法光芒等），特效由程式處理。

---

## 二、主角（4 張）

| 圖 | 格數 | 內容 |
|---|---|---|
| **Idle 待機** | 6 格 | 站立呼吸，披風和頭髮輕微晃動。第 6 格要能接回第 1 格，循環播放時不會跳動。 |
| **Attack 攻擊** | 6 格 | 1 蓄力 → 2 後仰拉開 → 3 揮出 → 4 揮到最大 → 5 收招 → 6 回到站姿 |
| **Hit 受傷** | 4 格 | 1 被擊中 → 2 往後仰 → 3 痛苦表情 → 4 站穩 |
| **Victory 勝利** | 6 格 | 跳起、舉武器歡呼，最後一格回到站姿 |

---

## 三、怪物（4 張）

| 圖 | 格數 | 內容 |
|---|---|---|
| **Idle 待機** | 6 格 | 呼吸、尾巴或鬃毛輕微擺動，第 6 格要能接回第 1 格。 |
| **Attack 攻擊** | 6 格 | 蓄力後仰 → 往前撲咬或發招 → 收回 |
| **Hit 受傷** | 4 格 | 被打到往後仰、閉眼，再站穩 |
| **Defeat 倒下** | 5 格 | 失去力氣、倒地，最後一格是倒在地上的樣子 |

---

## 四、提示詞範本（直接複製使用）

> Using the attached character as the exact reference (same design, proportions, colors, outfit), generate a sprite animation strip: **[Idle / Attack / Hit / Victory / Defeat]**, **[6 / 4 / 5]** frames in ONE horizontal row, equal-size cells with empty space between them, no text, no numbers, no borders. Transparent PNG background (if transparency is not possible, use a solid flat **#00FF00** background with no ground, no shadow and no gradient). The character faces **[right / left]**. Keep the feet on the same baseline and the body at the same horizontal position in every frame. Keep the character the same size in every frame. Do not draw slash, hit or magic effects. Frames: **[貼上第二或第三節對應的內容]**.

---

## 五、建議流程

1. 先只做 **1 位主角 + 1 隻怪物**（共 8 張），傳給我試做。
2. 確認效果沒問題，再做其他角色。
3. 如果要產的圖太多，可以先做常出場的角色，其他維持現在的動畫。
4. 拿到圖後，先確認背景是否真的透明（可以放在彩色背景上看）。
5. 如果各格大小、位置不一致，傳給我，我會對齊腳底再切。
   角色造型不一致的話我就修不了，要請 ChatGPT 重畫。
