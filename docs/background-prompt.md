# 戰鬥場景背景圖 Prompt

用途：請圖片 AI 產生戰鬥畫面的背景圖。拿到圖後放到 `assets/backgrounds/`，我負責放進遊戲，取代目前程式畫的場景。

## 給圖片 AI 的 prompt（English）

```text
Wide panoramic battle background for a cute mobile RPG, 21:9 aspect ratio (for example 2560x1100), no characters.

STYLE
Cute stylized 3D chibi fantasy scene, highly polished mobile game art style, rounded cute forms, smooth clean textures,
soft and clean lighting, vibrant saturated colors.

SCENE
A floating island with a rounded white castle and purple pointed roofs in the far background, lush green grass with soft
rounded shapes, cascading waterfalls flowing off the island edges, bright blue sky with fluffy white clouds,
purple banners on golden poles at the left and right edges.

LAYOUT (important)
- Camera at about the height of a person's chest, looking slightly down at a wide circular stone platform.
- The circular stone platform fills the lower 45% of the image, seen at a low angle (a flat ellipse), with a softly glowing
  blue magical circle in its center.
- The platform must be EMPTY and FLAT: two characters will stand on it later, one at the left third and one at the right
  third. Keep the area above the platform's left third and right third free of objects (no poles, trees or pillars there).
- Horizon / far island at about 45% from the top. Castle small and centered in the distance.
- Banners and poles only at the far left and far right edges.
- Important things stay inside the middle 60% of the width (the sides may be cut off on narrow screens).

DO NOT INCLUDE
No animals, no creatures, no characters, no people, no text, no logo, no UI, no frame or border, no watermark.
```

## 注意
- **比例要寬（21:9）**：平板和電腦是橫向畫面，太窄兩邊會留白。直立的手機只會看到中間，所以重要的東西放中間。
- **平台要空的**：主角站左邊三分之一、怪物站右邊三分之一。
- 想換其他風格（例如柔和手繪田園風）時，只要改 STYLE 和 SCENE，LAYOUT 和 DO NOT INCLUDE 保留。
- 可以多生幾張不同場景（森林、雪地、海邊、火山……），之後可以依怪物屬性換背景。

---

## 第二批：目前缺少的場景（請生成這 4 張）

現在每種屬性的怪物會在固定的場景打。檢查後，下面 4 種屬性沒有合適的場景，只能借用別的：

| 屬性 | 現在用的場景 | 不搭的例子 | 需要的新場景（檔名） |
|---|---|---|---|
| 海洋 | 天空城堡 | 章魚、鯊魚、水滴寶寶站在城堡前 | 海底神殿 `sea.jpg` |
| 機械 | 天空城堡 | 機械蜘蛛、齒輪巨人站在城堡前 | 機械工廠 `factory.jpg` |
| 沙漠 | 森林神殿 | 仙人掌、木乃伊、寶箱怪站在森林裡 | 沙漠遺跡 `desert.jpg` |
| 毒 | 森林神殿 | 毒蜘蛛、毒蠍、多頭蛇站在明亮的森林裡 | 毒沼澤 `swamp.jpg` |

放進 `assets/backgrounds/` 跟我說，我會設定平台位置和環境動畫（氣泡、蒸汽、沙塵、毒霧），再換進遊戲。

每張都用上面那段 prompt 的 **STYLE、LAYOUT、DO NOT INCLUDE**，只把 **SCENE** 換成下面的內容：

### 1. `sea.jpg`：海底神殿（海洋）
```text
SCENE
An underwater temple at the bottom of a bright tropical sea: a wide round platform of white stone and pale coral in the
center, ancient white pillars with seashells in the far background, colorful coral reefs and swaying seaweed at the left
and right edges, sunbeams shining down through clear turquoise water, small bubbles floating up, a softly glowing aqua
magical circle in the platform's center.
```

### 2. `factory.jpg`：機械工廠（機械）
```text
SCENE
A big steampunk workshop factory: a wide round platform made of riveted steel plates with a softly glowing orange magical
gear-shaped circle in its center, huge brass gears and pipes on the walls in the background, glowing furnace windows,
soft steam clouds, conveyor belts and cogs at the far left and right edges, warm orange and cool blue lights.
```

### 3. `desert.jpg`：沙漠遺跡（沙漠）
```text
SCENE
Ancient desert ruins at sunset: a wide round platform of cracked sandstone tiles with a softly glowing golden magical
circle in its center, sand dunes and a small pyramid far in the background, broken sandstone pillars and a few cacti and
palm trees only at the far left and right edges, warm orange sky with a few soft clouds.
```

### 4. `swamp.jpg`：毒沼澤（毒）
```text
SCENE
A spooky but cute poison swamp in a dark forest: a wide round platform of mossy stone with a softly glowing purple-green
magical circle in its center, bubbling green-purple swamp water around it, twisted dark trees with hanging vines and
glowing mushrooms in the background and at the left and right edges, light purple fog, a dim greenish sky.
```

### 注意
- 平台一樣要**空的、平的**，左邊三分之一和右邊三分之一的上方不要有東西（主角和怪物要站在那裡）。
- 怪物不要畫進去（DO NOT INCLUDE 要保留）。
- 每張做兩版也可以，檔名加 `-1`（例如 `sea-1.jpg`），我挑比較好的。
