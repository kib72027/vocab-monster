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
