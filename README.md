# Reading Plus 單字打怪王 (Vocab Monster)

A kid-friendly vocabulary battle game for **4th-grade students in Taiwan**, based on the *Reading Plus* workbook (Weeks 1–18).
Open `index.html` in any modern browser (Chrome / Safari / Edge; desktop, phone, tablet). No server, no build step, no network needed.

> **For AI assistants / maintainers:** the whole game is **one self-contained file, `index.html`** (~4 MB, ~1900 lines; vanilla HTML/CSS/JS, no libraries, no frameworks). Images are embedded as base64 WebP data URIs on a few very long lines — **do not print those lines** (use `cut -c1-200`, `grep -o`, or search by marker). All UI text is Traditional Chinese; the quiz questions themselves are English-only on purpose.

## What the game does
- Student picks a lesson → fights that lesson's monster by answering English vocabulary questions (cloze sentence or "which word matches this meaning"). Right answer = a golden arrow hits the monster; wrong = the monster hits back (hearts are fixed at 5).
- Correct answers also read the word and its example sentence aloud (Web Speech API). When the mana bar is full, the next correct answer triggers an **ultimate move** (the sentence words orbit the monster, rise, then rain down; deals 2 damage).
- Rewards: XP, coins, treasure chest (monster cards), shop (revive potion / hint crystal / word note), dress-up heroes, monster codex.

## Game structure (current rules)
| Battle | Where | Words | HP / questions | Unlock |
|---|---|---|---|---|
| **Normal** | one per lesson (40 lessons) | that lesson | up to 8 | always open |
| **Elite** | one per week (18) | all words of that week | 10 | every lesson of the week has ≥ 2★ |
| **Boss** | one per 2 weeks (9: W1–2 … W17–18) | all words of the 2 weeks | 14 | both elites of those 2 weeks have ≥ 2★ |
| **Revenge** | from missed words | words answered wrong before | 6 | when there are missed words |

- **Stars (1–3)** = accuracy of the fight: ≥ 85 % → 3★, ≥ 65 % → 2★, else 1★. Reward multiplier 1 / 0.8 / 0.4.
  **1★ = no chest and the monster is NOT captured** (anti-guessing). ≥ 2★ captures the monster into the codex and rolls the chest.
- **Anti random-clicking** (kids tap without reading):
  1. Elite & boss monsters **heal 1 HP on a wrong answer** (normal monsters don't).
  2. Stars by accuracy (above).
  3. Clicks within `RUSH_MS = 1200` ms after a question appears are ignored with a toast "先讀完題目，再選答案喔！".
  4. After a wrong answer the "continue" button is locked for `LOCK_MS = 2000` ms while the correct answer is shown.
  (Tests can bypass 3 and 4 with `window.__noRush = true`.)
- Wrong words are re-queued in the same fight and become "revenge" words.
- Hearts max is fixed at 5, no random crits, the example sentence is always auto-read, the potion is usable from the HUD (+3 hearts) and also auto-revives at 0 hearts.

## Monsters (96)
- Codex has **96 monsters** (`RMON`), each `{id:'n001'…'n096', zh, en, t (element type), role}`.
  Roles: `n` normal lesson monster (40), `e` elite (18), `b` boss (9), `r` rare (chest only, 5), `x` spare (chest only, 24).
  Element types: fire, ice, elec, poison, forest, sea, desert, sky, ghost, mech, skel, dragon (`TYPES`).
- `MPLAN = {normal:[40 ids], elite:[18 ids], boss:[9 ids]}` assigns monsters. Lesson *i* uses `MPLAN.normal[i]`; the *w*-th week uses `MPLAN.elite[w]`; the *j*-th two-week block uses `MPLAN.boss[j]`.
- Art: full-body transparent WebP cut-outs (`RSPR[id] = {u: dataURI, w, h}`), originally 6 ChatGPT-generated 4×4 sheets cut out with OpenCV. Heroes: `HSPR` (10 heroes). `MON`/`MSPR` are the legacy 11 procedural monsters (no longer used for battles).

## Vocabulary data
- `RAW` = list of lessons `{id, week:"Week 7", title, words:[[word, zh, defText, example, pos] | "stringRef"]}` (40 lessons, 338 words).
- `VX[word] = {d:[3 English explanations], e:[3 example sentences]}`. At question time `variant(t)` picks a random definition and example sentence, so each question can differ.
- Data rules: explanations 4–10 words, examples 5–11 words, A1–A2 vocabulary, headword appears exactly in each example, headword never in the explanations.
- **Weeks 7–10** (old lessons) were matched to the story text in the workbook. **Weeks 1–6 and 11–18** were only simplified; story text for them has **not** been provided yet, so their sense/examples may still need to be matched to the stories later.
- Word → lesson merging: duplicates across lessons keep the first lesson's data (e.g. halt, machine, dizzy, startle…).

## Code map (search `index.html` by these markers/names)
- `/* ---------- storage ---------- */` — `localStorage` key **`reading-plus-vocab-v1`**; state object `store` with `store.g` (the game state) and `store.mast`/`store.missed` (mastery & missed words).
- `G()` — default game state: `xp, coins, mast, def, stars, boss, rcards, reward, heroId, own, eq, inv{potion,crystal,note}, today, streak, goalDay…`.
  `def[id]` = win count, `stars[id]` = best stars (`id` is a lesson id, `e<week>` for elites, `b<n>` for bosses), `rcards[monId]` = monster capture count.
- `/* ================= GAME: monster battles ================= */` — game logic & views: `startBattle(kind,id)`, `nextQ()`, `answerB(idx)`, `nextB()`, `spellAttack`, `finish(win)`, `rollBonus()`, `viewGame()`, `viewBattle()`, `viewReward()`, `viewColl()`, `rtile()`; helpers `ELITES`, `BOSSES`, `starsOf`, `eliteOpen`, `bossOpen`.
- `/* ================= 3D: tiny WebGL toon engine (no libraries) ================= */` — custom WebGL engine `ENG` (`setup`, `hurt`, `finale`, `ultimate`, sprite billboards with depth test off, particle system). Battle arena, hero & monster sprites, golden arrows, waterfalls. Falls back to a 2D stage (`stageHTML`) when WebGL isn't available.
- `/* ---------- views ---------- */` / `/* ---------- actions ---------- */` — practice mode (flashcards, normal quiz) and the global click handler `switch(a)` for all `data-act="…"` buttons.
- Data blocks: `RAW`, `VX`, `RMON`, `RSPR`, `MPLAN`, `HSPR` (very long lines).

## Editing tips
- Use the editor's search; never `cat` the file (base64 lines are huge). To change data, edit `RAW`/`VX` (find a word with `grep -o '"word":' …` or search `VX`).
- The click handler is event-delegated on `#app`; re-render happens via `render()`; after `render()` call sites expect `afterGameRender()` to mount the canvas.
- Test hook used in local smoke tests: `window.__noRush = true` (skips the 1.2 s / 2 s anti-guess delays).
- Persistence is per browser/device (localStorage). Clearing site data resets progress.

## Open items / ideas
- Provide story text for Weeks 1–6 and 11–18 so definitions/examples can be matched to the stories.
- Assign monsters to lessons by story theme (currently interleaved by element).
- The after-answer sheet still shows the Chinese meaning (quiz prompts themselves are English-only).
- Ultimate move deals 2 damage (could be reverted to 1).
