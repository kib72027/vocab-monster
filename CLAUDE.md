# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Kid-friendly English vocabulary battle game (Reading Plus workbook, Weeks 1–18) for 4th graders in Taiwan. Vanilla HTML/CSS/JS, no libraries, no server, no network. All UI text is Traditional Chinese; quiz prompts are English-only on purpose. `README.md` holds the full game rules (battle, stars, rewards, anti-guessing) — read it before changing gameplay.

## Commands

```
python3 build.py                 # regenerate index.html from src/ (only needs Python 3)
python3 tools/mkhsheet.py <id>   # cut assets/heroes/<id>/source/*.jpg into frames + src/part_hanim_<id>.js, then rebuild
python3 tools/nmcut2.py          # re-cut assets/monsters/monster-sheet-1..5.jpg into RSPR (add --dry to only write assets/monsters/cut/)
node tools/merge_vocab.js        # merge data/vocab/*_out*.json into src/part_data.js
```

Play/test: open `index.html` directly in a browser (the in-app browser pane needs `.claude/launch.json`, a local http server on port 8765). Python is not installed system-wide on this machine; run the tools with `uv run --no-project --with pillow --with numpy --with scipy python …`. There is no lint and no test runner.
- `tests/gsmoke.js`, `tests/gs3.js`: Node smoke tests that `eval` the app JS against a stubbed DOM. They read `app2.js` from the current directory, so copy/point that at the app script first. Fail by printing `FAIL ...` and exiting 1.
- `tests/*.py`: Playwright screenshot scripts. Paths (`P=...`) point to an old sandbox — adjust before running. WebGL needs Chromium flags `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- Set `window.__noRush = true` in tests to skip the anti-guess delays (`RUSH_MS` 1.2 s, `LOCK_MS` 2 s).

## Build / file rules (important)

- `index.html` is **generated** — never edit it by hand. Concatenation order: `part_head2.html` + `part_data.js` + `part_monsters.js` + `part_sprites.js` + `part_roster.js` + `part_hanim_*.js` + `part_app2.js`.
- `build.py` **rewrites sources in place** via two splices:
  1. `src/part_3d.js` → into `src/part_game.js` between `/* ================= 3D: tiny WebGL` and `/* ---------- battle ---------- */`
  2. game block of `part_game.js` → into `src/part_app2.js` between `/* ================= GAME: monster battles` and `/*GAMEEND*/`
  So edit the WebGL engine only in `part_3d.js`, battle logic/views in `part_game.js`, and everything else (storage, practice mode, click handler) in `part_app2.js` outside the game block. Don't break those markers.
- **Never print whole files containing base64 art** (`index.html`, `part_roster.js`, `part_sprites.js`, `part_hanim_*.js`): images are WebP data URIs on huge single lines. Use `grep -o`, `cut -c1-200`, or search by marker.

## Architecture

- **State**: `localStorage` key `reading-plus-vocab-v1` → `store` with `store.g` (game state from `G()`: xp, coins, `def[id]` win counts, `stars[id]` best stars, `rcards[monId]`, heroId, inv, streak, `learned[lessonId]`…) plus `store.mast` / `store.missed`. Ids: lesson id for normal, `e<week>` elite, `b<n>` boss.
- **UI**: one delegated click handler on `#app` (`switch(a)` on `data-act="…"`); re-render with `render()`, then `afterGameRender()` mounts the canvas.
- **Battle flow** (`part_game.js`): `startBattle(kind,id)` → `nextQ()` → `answerB(idx)` → `nextB()` → `finish(win)` (star thresholds 0.85 / 0.65) → `rollBonus()`. Elite/boss heal on wrong answer is in `answerB()`. Hearts/mana/HP bars update only when the attack animation actually lands (`ENG.hurt` returns hit time), not on click.
- **Rendering** (`part_3d.js`): custom WebGL toon engine `ENG` (`setup`, `hurt`, `finale`, `ultimate`, billboards with depth test off, particles). Per-hero ultimates in the `SIGF` table. Falls back to 2D `stageHTML` without WebGL.
- **Data**: `RAW` = 40 lessons `{id, week, title, words:[[word, zh, defText, example, pos] | "ref"]}`; `VX[word] = {d:[3 defs], e:[3 examples]}`, `variant(t)` picks one at random per question. Data rules: definitions 4–10 words, examples 5–11 words, A1–A2 vocabulary, headword appears exactly in each example and never in definitions. Duplicate words across lessons keep the first lesson's data.
- **Monsters**: `RMON` (80, ids `n001`–`n080`, roles n/e/b/r/x, element `t` from `TYPES`), art in `RSPR[id]`. `MPLAN.normal[i]` / `.elite[w]` / `.boss[j]` assign monsters to lessons / weeks / two-week blocks. `MON`/`MSPR` are legacy and unused in battles.
- **Heroes**: `HSPR` (10 heroes). Heroes with `HANIM[hid]` (from `part_hanim_<id>.js`) use frame animation (idle loop, attack, hit, win); others use a static sprite + programmatic motion.

## Hero animation rules

Read `docs/animation-lessons.md` before touching hero animation. In short: no cross-fade between different poses (hard cut; cross-fade only within similar idle frames); idle uses only frames facing the same way as the actions (`mkhsheet.py` picks the reference); attack = wind-up + strike, hit = one flinch frame, motion done in code; align frames by feet; bleed edge colour into transparent pixels and save WebP with `exact=True`; WebGL blending must be `blendFuncSeparate(SRC_ALPHA, ONE_MINUS_SRC_ALPHA, ONE, ONE_MINUS_SRC_ALPHA)` (not `ZERO, ONE`, and don't set clearColor alpha to 1 — the sky is page CSS showing through). Verify motion by video, not still screenshots.

New sprite sheets come from image AI using `docs/hero-spritesheet-prompt.md` / `docs/monster-spritesheet-prompt.md` (green `#00FF00` background, magenta `#FF00FF` for green monsters; heroes face right, monsters face left).
