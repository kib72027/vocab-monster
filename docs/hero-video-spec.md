# 主角動作影片需求（給影片生成 AI）

目標：用**一張現有的主角原圖**（image-to-video），生成幾段短影片。
我會把影片切成逐格圖，去背、對齊後做成遊戲用的動畫。
所以重點是：**角色不能變形、鏡頭不能動、背景要純綠色、角色要夠大。**

---

## 一、輸入

- 附上**主角原圖**作為第一格（起始畫面）。
- 角色的臉、頭髮、服裝、武器、配色必須全程與原圖一致。
- 如果原圖不是綠色背景，請先把背景換成純綠色 `#00FF00`，其他都不要動。

---

## 二、每一段影片都要符合（共通規格）

1. **背景：** 單一純色 `#00FF00`（亮綠），沒有地面、陰影、漸層、光暈、粒子。
   角色本身有綠色時改用洋紅 `#FF00FF`。
2. **鏡頭：** 完全固定，不推近、不拉遠、不搖、不轉。
3. **角色大小與位置：**
   - 角色佔畫面高度約 **80%**，完整入鏡，頭頂和腳底都不要被切到。
   - 角色站在畫面**正中央**，腳底的位置全程大致不變（跳躍時除外）。
   - 武器揮出去時也不能超出畫面。
4. **方向：** 角色面向**右邊**（3/4 側面，朝向右方的敵人）。全程不要轉身。
5. **畫質：** 至少 **720p**，越高越好；**不要**動態模糊、殘影、拖影、閃爍。
6. **格式：** 輸出 **MP4**（或 WebM）。**不要輸出 GIF**（GIF 只有 256 色，邊緣會很髒）。
7. **長度：** 每段 **1.5 到 2.5 秒**，一段只做一個動作。
8. **不要特效：** 不要揮劍弧光、魔法光、爆炸、火花、文字、字幕、浮水印。特效由遊戲用程式處理。

---

## 三、要生成的 4 段影片

| 檔名 | 長度 | 動作內容 | 特別要求 |
|---|---|---|---|
| `idle.mp4` | 2 到 2.5 秒 | 站立待機：自然呼吸、身體微微起伏，披風、頭髮、衣角輕輕飄動，偶爾眨眼 | **結尾要接回開頭**（可以無縫循環播放）；動作幅度小，不要走動 |
| `attack.mp4` | 1.5 到 2 秒 | 攻擊：先蓄力（身體後仰、武器拉到身後）→ 快速揮出或施法 → 揮到最大 → 收招 → 回到站姿 | 最後回到和第一格相同的站姿；不要畫攻擊特效 |
| `hit.mp4` | 1.5 秒 | 被打到：身體後仰、表情痛苦（閉眼或咬牙）、重心往後退一步 → 站穩 | 最後回到站姿；不要畫受傷特效 |
| `victory.mp4` | 2 秒 | 勝利：開心跳起來、舉起武器歡呼、落地 | 最後回到站姿 |

每段的**第一格和最後一格都要是同一個站姿**（也就是原圖的姿勢），這樣動作之間才接得起來。

---

## 四、提示詞範本（每段影片各貼一次）

> Animate the attached character illustration into a short looping game-sprite style clip.
> Action: **[idle / attack / hit / victory，寫上第三節對應的動作內容]**.
> Keep the character's face, hair, outfit, weapon and colors exactly identical to the reference in every frame. The character faces right and never turns around.
> Background: solid flat **#00FF00** green only, no ground, no shadow, no gradient, no particles.
> Camera: completely static, no zoom, no pan, no shake. The character stays centered, about 80% of the frame height, fully inside the frame, feet position stable.
> No motion blur, no ghosting, no trails, no text, no watermark, no slash/magic/impact effects.
> Duration **[1.5–2.5] seconds**, **[24 or 30] fps**, at least 720p. The clip starts and ends on the same standing pose.

---

## 五、交付給我的東西

1. 4 個影片檔：`idle.mp4`、`attack.mp4`、`hit.mp4`、`victory.mp4`。
2. 主角的**原圖**（有的話，原檔 PNG）。
3. 告訴我這是哪一位主角（例如 h2 魔法師、h1 勇者）。

用「檔案」的方式傳給我，不要用截圖或相簿，避免被壓縮。

---

## 六、我會怎麼處理（不用你做）

- 把影片切成逐格圖，去掉綠色背景。
- 逐格對齊：用腳底和身體重心把每格對到同一個點，去掉鏡頭和角色的漂移。
- 挑出最順的 8 到 12 格；丟掉有殘影或變形的格子。
- 接進遊戲，並放進 GitHub（`assets/heroes/<角色>/`，分資料夾整理）。

---

## 七、檢查清單（生成完先看一次）

- [ ] 背景是純綠色，沒有陰影或漸層
- [ ] 鏡頭沒有動（拉近、搖晃都不行）
- [ ] 角色沒有變形，臉和服裝和原圖一樣
- [ ] 沒有殘影、模糊、拖影
- [ ] 角色完整在畫面內，揮武器沒有超出畫面
- [ ] 第一格和最後一格是同一個站姿
- [ ] 檔案是 MP4 或 WebM，不是 GIF
- [ ] idle 可以無縫循環

不符合其中任何一項，請重新生成那一段，不用全部重做。
