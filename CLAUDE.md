# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Kid-friendly English vocabulary battle game (Reading Plus workbook, Weeks 1–18) for 4th graders in Taiwan. Vanilla HTML/CSS/JS, no libraries, no server, no network. All UI text is Traditional Chinese; quiz prompts are English-only on purpose. `README.md` holds the full game rules (battle, stars, rewards, anti-guessing) — read it before changing gameplay.

## Commands

```
python3 build.py                 # regenerate index.html from src/ (only needs Python 3)
python3 tools/mkhsheet.py <id>   # cut assets/heroes/<id>/source/*.jpg into frames + src/part_hanim_<id>.js, then rebuild
python3 tools/mkhvideo.py <id>   # hero frames from videos in assets/video/<id>/ (frames.json picks the frames); ALL heroes use this now — don't run mkhsheet (it would overwrite)
python3 tools/mkbg.py            # battle backgrounds: assets/backgrounds/backgrounds.json (+ images) -> src/part_bg.js (BGS/BGT, chosen by monster element)
python3 tools/mkprops.py         # props/helpers: assets/props/*.jpg (prompt docs/prop-spritesheet-prompt.md) -> src/part_props.js (PROPS); emoji objects (🗡️🔱⚙️🚀🛡️🔮💖🍃🤖…) are drawn as these (PMAP in part_3d.js)
python3 tools/mkvfx.py           # effect animations: assets/vfx/*.jpg (4x4 = 16 frames on black, PICK chooses the version) -> src/part_vfx.js (VFX); engine plays them with vfx(name,pos,size,opts)
python3 tools/mkfx.py            # ultimate effect art: assets/heroes/h8/finisher/{beasts,lion}.jpg -> src/part_fx.js (FXSPR; summoner's spirit beasts, lion, golden circle)
python3 tools/nmadd.py           # add/update extra monsters (assets/monsters/set-2, set-3, …) and legends (assets/monsters/legend) in part_roster.js
python3 tools/nmcut2.py          # re-cut assets/monsters/set-1/monster-sheet-1..5.jpg into RSPR (add --dry to only write set-1/cut/)
node tools/merge_vocab.js        # merge data/vocab/*_out*.json into src/part_data.js
```

Play/test: open `index.html` directly in a browser (the in-app browser pane needs `.claude/launch.json`, a local http server on port 8765). Python is not installed system-wide on this machine; run the tools with `uv run --no-project --with pillow --with numpy --with scipy python …`. There is no lint and no test runner.
- `tests/gsmoke.js` (learn flow, all 40 lessons, elites/bosses, defeat, anti-guess, stars/chest, revenge, shop, practice), `tests/gs3.js` (shop, heroes, codex, crystal/potion), `tests/gs4.js` (80-monster roster/MPLAN, video hero data, revenge rules): Node smoke tests that `eval` the game script against a stubbed DOM. They read `app2.js` from the current directory = the `<script>` content of `index.html`. Node isn't installed; run them like this (from a scratch folder holding app2.js and the test): `uv run --no-project --with nodejs-bin python -m nodejs gsmoke.js` — each prints `…_OK` or `FAIL …`.
- `tests/*.py`: Playwright screenshot scripts. Paths (`P=...`) point to an old sandbox — adjust before running. WebGL needs Chromium flags `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- Set `window.__noRush = true` in tests to skip the anti-guess delays (`RUSH_MS` 1.2 s, `LOCK_MS` 2 s).

## Build / file rules (important)

- `index.html` is **generated** — never edit it by hand. Concatenation order: `part_head2.html` + `part_data.js` + `part_monsters.js` + `part_sprites.js` + `part_roster.js` + `part_bg.js` + `part_fx.js` + `part_vfx.js` + `part_props.js` + `part_hanim_*.js` + `part_app2.js`.
- `build.py` **rewrites sources in place** via two splices:
  1. `src/part_3d.js` → into `src/part_game.js` between `/* ================= 3D: tiny WebGL` and `/* ---------- battle ---------- */`
  2. game block of `part_game.js` → into `src/part_app2.js` between `/* ================= GAME: monster battles` and `/*GAMEEND*/`
  So edit the WebGL engine only in `part_3d.js`, battle logic/views in `part_game.js`, and everything else (storage, practice mode, click handler) in `part_app2.js` outside the game block. Don't break those markers.
- **Never print whole files containing base64 art** (`index.html`, `part_roster.js`, `part_sprites.js`, `part_hanim_*.js`): images are WebP data URIs on huge single lines. Use `grep -o`, `cut -c1-200`, or search by marker.

## Architecture

- **State**: `localStorage` key `reading-plus-vocab-v1` → `store` with `store.g` (game state from `G()`: xp, coins, `def[id]` win counts, `stars[id]` best stars, `rcards[monId]`, heroId, inv, streak, `learned[lessonId]`…) plus `store.mast` / `store.missed`. Ids: lesson id for normal, `e<week>` elite, `b<n>` boss.
- **UI**: one delegated click handler on `#app` (`switch(a)` on `data-act="…"`); re-render with `render()`, then `afterGameRender()` mounts the canvas.
- **Moves**: heroes have three ultimates in `part_3d.js`: `SIGF` (first), `SIG2` (second) — the battle picks one at random — and `SIG3` (終極絕招, used when the player owns a 終極卷軸 `g.inv.finisher` from the shop; consumed, 4 damage). Monsters: `hurt(emoji,type,mode)` with mode 2 = `hurt2` (second attack per element, chosen at random); elites (every 3rd miss) and bosses (every 2nd) use `monUlt(type,'e'|'b')`, legends `'L'` (test lab only). `vfxOr(...)` uses a new effect sheet when it exists and falls back otherwise.
- **Battle flow** (`part_game.js`): `startBattle(kind,id)` → `nextQ()` → `answerB(idx)` → `nextB()` → `finish(win)` (star thresholds 0.85 / 0.65) → `rollBonus()`. Elite/boss heal on wrong answer is in `answerB()`. Hearts/mana/HP bars update only when the attack animation actually lands (`ENG.hurt` returns hit time), not on click.
- **Rendering** (`part_3d.js`): custom WebGL toon engine `ENG` (`setup`, `hurt`, `finale`, `ultimate`, billboards with depth test off, particles). Per-hero ultimates in the `SIGF` table. Falls back to 2D `stageHTML` without WebGL.
- **Data**: `RAW` = 40 lessons `{id, week, title, words:[[word, zh, defText, example, pos] | "ref"]}`; `VX[word] = {d:[3 defs], e:[3 examples]}`, `variant(t)` picks one at random per question. Data rules: definitions 4–10 words, examples 5–11 words, A1–A2 vocabulary, headword appears exactly in each example and never in definitions. Duplicate words across lessons keep the first lesson's data.
- **Monsters**: `RMON` (125, ids `n001`–`n125`; all monster art is under `assets/monsters/` (set-1 = original 80, set-2/set-3 = extras, legend); n081+ added by `tools/nmadd.py` from `assets/monsters/set-N/monsters.json`; legends in separate `LMON`/`LSPR`, not used in battles yet (codex shows them locked; the stage draws them much larger with a gold aura, `E.leg`); roles n/e/b/r/x, element `t` from `TYPES`), art in `RSPR[id]`. The engine mirrors monster art so it faces the hero (left); `f:0` in RMON marks art that already faces left (set via `face:'left'` in a set's `monsters.json`). Monster size = equal visual area (sqrt(w*h)), not equal height. `MPLAN.normal[i]` / `.elite[w]` / `.boss[j]` assign monsters to lessons / weeks / two-week blocks. `MON`/`MSPR` are legacy and unused in battles.
- **Test lab** (`viewTest`/`tlAct` in `part_game.js`; "🧪 測試" in the home top bar, behind a password `TEST_PW`, asked once per visit; the stage stays pinned while scrolling): real battle stage to replay every hero action, monster attack, sound and monster sprite; must never change progress.
- **Heroes**: `HSPR` (10 heroes). Heroes with `HANIM[hid]` (from `part_hanim_<id>.js`) use frame animation (idle loop, attack, hit, win); others use a static sprite + programmatic motion.

## Hero animation rules

Read `docs/animation-lessons.md` before touching hero animation. In short: no cross-fade between different poses (hard cut; cross-fade only within similar idle frames); idle uses only frames facing the same way as the actions (`mkhsheet.py` picks the reference); attack = wind-up + strike, hit = one flinch frame, motion done in code; align frames by feet; bleed edge colour into transparent pixels and save WebP with `exact=True`; WebGL blending must be `blendFuncSeparate(SRC_ALPHA, ONE_MINUS_SRC_ALPHA, ONE, ONE_MINUS_SRC_ALPHA)` (not `ZERO, ONE`, and don't set clearColor alpha to 1 — the sky is page CSS showing through). Verify motion by video, not still screenshots.

New sprite sheets come from image AI using `docs/hero-spritesheet-prompt.md` / `docs/monster-spritesheet-prompt.md` (green `#00FF00` background, magenta `#FF00FF` for green monsters; heroes face right, monsters face left).
