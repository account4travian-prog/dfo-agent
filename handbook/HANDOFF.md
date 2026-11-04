# Handbook handoff (2026-10-24)

Start here when picking the handbook up in a new session. Everything below is committed on `main` of the DFO workspace
(`%USERPROFILE%\Documents\DFO`); the 2026-10-24 roadmap work is on branch `handbook/roadmap-2026-10`, fast-forwarded
to `main` after review. See `git log`.

## 2026-10-24 update (roadmap batches 0–4 and the build side of 6)

- The guide grew from 84 to **101 articles**. New: first launch, saving and returning, menus and screens, first week,
  making money, Mages Guild services, enchanting/spellmaking/potions, danger and regions, example build plans,
  thievery, PvP and duels, curses, guns, quest rewards, endgame, troubleshooting, and "How this guide is checked".
- Facts were re-read at game commit **`e4f093166` (24 Oct 2026)**, 47 facts (13 new), and the footer now shows two
  clocks: the source commit/date for numbers and the older page-review baseline/date.
- "What changed" covers `0df2d87eb..e4f093166` and keeps the previous entry as an archive; the open-PvP sea, account
  homes, guild cap and the new systems are corrected.
- The site now emits canonical/OG/Twitter metadata, `sitemap.xml`, `robots.txt`, a root-absolute 404, Play/Discord/
  Source/issue footer links and a readable Draft badge explanation; the mobile search sheet and the deep-URL 404 are
  fixed; search v2 adds stop words, stemming, synonyms, stage bias and typo fallback.
- Deep-research absorption: companions, Firmament, city control, masteries, money/market, training, ships, survival and
  the first-week plan now carry the numbers and worked routes from `docs/23`–`docs/35`.
- The character planner is published at `reference/character-planner/` with its own home-page button (`--planner`); the
  map's old service-chip matrix became one pin plus one typed finder. Batch 5 added six original diagrams, a compact
  mobile ToC, 44px touch targets and scoped table headers.
- **2026-10-25:** guide expansion shipped: 17 new source-backed guides (offline/online, first 90 minutes, Daggerfall/DFU conversion, mods/saves/wipes, friend play, session planning, progression map, beginner builds, standing, safe storage, money routes, combat maths, spellmaking, magic-item economy, bestiary, Privateer's Hold, stuck recovery). The handbook is now 153 content pages; FAQ, navigation, search and assistant index updated. See `docs/39-guide-expansion-plan.md`.
- **2026-10-25:** the quest guide is live at `/quests/` with a complete 283-quest index, source facts, sheet objectives
  for the main story and questlines, pattern guidance and recovery advice. The fixed layer covers the main-story
  overview, Lady Brisienna, all 14 questlines and all 14 generated-quest families. `/ask/` is **The Archivist**: always
  available quoted passages plus an optional Workers AI answer at `/api/ask`, with a $5 estimated budget and the
  Workers Free 10k-Neuron/day testing allowance. First eval: 14/14. Research is in `docs/research/`; external DeepSeek
  eval, quota tuning and the editorial pass remain.
- **Deployed 2026-10-24:** production `35466cba` from `104bb94`, behind Access (302 verified; planner, typed map finder, diagrams and mobile polish).
- **Deployed 2026-10-25:** production `e360d4fe` from `f7ccfda`, behind Access (302 verified; complete quest guide at `/quests/`).
- **Deployed 2026-10-25:** production `195823f7` from `617b055`, behind Access (302 verified; Phase 0 `/ask/` assistant and the first fixed quest page).
- **Deployed 2026-10-25:** production `55f01dd3` from `28a6504`, behind Access (302 verified; main/questline/pattern quest guides).
- **Deployed 2026-10-25:** production `27a84282` from `991d5dd`, behind Access (302 verified; all questlines and generated families covered).
- **Deployed 2026-10-25:** production `624b8383` from `40243ad` (Pages) and Worker `7c655ec5` at `/api/*`; Archivist UI/portrait, Workers AI answer layer, $5 budget cap; Access 302 verified.
- **Deployed 2026-10-25:** production `f4e9ff6a` from `cbe565b` (Pages); Sol 6.1 original reading-desk portrait, reading/speaking CSS loops, animation map and Ask-button feedback. Access 302 verified.
- **Deployed 2026-10-25:** production `9a3dd7ab` from `2cd9629` (Pages) and Worker `e14d7613`; faction pages, Mages Guild service split, feedback routes, `/contribute/` and the draggable home-page Archivist chat head. Access 302 verified.
- **Deployed 2026-10-25:** production `527d0bff` from `ad0603e` (Pages); fixed-overlay Archivist help widget with the animated Sol portrait, chat panel, minimize/close/reopen and drag persistence. Access 302 verified.
- **Deployed 2026-10-25:** production `19f09579` from `12b81f4` (Pages); 130 px Archivist launcher showing the full Sol portrait, with drag margin adjusted. Access 302 verified.
- **Deployed 2026-10-25:** production `d7183486` from `1affcc1` (Pages); brass clasp fixed outside the breathing layer, smoother/longer animation loops and no page-turn flicker on the home launcher. Access 302 verified.
- **Deployed 2026-10-25:** production `dd3c1eed` from `8977560` (Pages); fixed the speaking mouth scaling around the wrong origin (the coin between the eyes), plus the base portrait transforms on the home launcher. Access 302 verified.
- **Deployed 2026-10-25:** production `b4ba5094` from `8b27f00` (Pages); the floating Archivist now searches and answers in place, with quoted passages, model answer, no-coverage actions and no navigation. Access 302 verified.
- **Still open:** Phase 1 assistant decision (model, spend cap, Cloudflare-only vs external); an editorial read-through
  of the new questline/pattern pages; the rest of batch 5 (map payload/URL-addressability, self-hosted fonts, side-panel
  touch parity); the 92 remaining `status: draft` pages still need a human read-through; the ongoing change-digest/CI
  track is not built;
  road-data, planner-data and class-base-stats permissions are unchanged. Draft pages are now explained by the badge
  and "How this guide is checked".

## What exists

- **The DFO Online Handbook**: a public-facing, build-agnostic player's guide and wiki in `handbook/`, ordered the way
  the game opens up (11 stages built on the game's introduction questlines; see `STRUCTURE.md`).
- **101 pages**: 1 published review page (**How this guide is checked**), **92 marked `status: draft`**, and 8 older pages carrying no status (reviewed earlier). Most draft pages are checked against the source, not all
  read end to end; see the footer/`reference/how-this-guide-is-checked.md` for what Draft means).
- **Framework** (`handbook/tools/`, `handbook/theme/`): static site, Node, no dependencies; 68+ tests
  (`node --test handbook/tools/test/`). Quoting hover previews; Ctrl+click opens a reference in a side panel (plain
  click navigates); glossary tooltips; search; "Where are you?" stage selector; checklists; planned/draft pages; data
  tables; facts read from DFO's code "as online" (`handbook/facts/`).
- **Design**: Field Atlas (Hark's direction A) with Museum Guide's stage tiles (direction B) on the home page; 11
  original stage illustrations, wordmark and icons (credits in `theme/art/CREDITS.md`).
- **Bay and town maps** (`--map` build): approved for publishing by the user. Roads, tracks, rivers and streams from
  Basic Roads (Hazelnut). Town views with every building named and floating windows.
- **Research notes** in `handbook/research/` (G, C1-C3, B1, H1-H3, T1-T3, V1, P1-P3, Q1, M, S1, E1, E2, W1, R1, R2, L1,
  X1, X2). `M.md` is the online mod ledger (read its reviewer's note).

## Hosting

Live and **private** at `https://handbook.wardenlog.org` (and `dfo-handbook.pages.dev`), behind Cloudflare Access.
Full details, the deploy command and the launch rule are in [DEPLOY.md](DEPLOY.md). Key points:

- Build and deploy: `node handbook/tools/check.mjs`, `node handbook/tools/build.mjs --map`, then the Wrangler command in
  DEPLOY.md. **Never deploy a `--game-data` build** (class base-stats table not approved).
- After every deploy, check the gate from outside (curl should get a 302 to `cloudflareaccess.com`).
- **Never edit the "Owner Only" Access policy**: it also protects writing.wardenlog.org. Launch = delete the
  "DFO Handbook (staging)" application.
- Wrangler's login can deploy Pages but has no Access/Zero Trust permission; dashboard work goes through Claude in
  Chrome (the user has it installed) or the user.

## Rules that matter (learned the hard way)

1. **The online rule is the effective rule.** DFO folds in many mods; base functions often don't run online. Start
   at `src/systems/online/onlineLane.js`; online combat is `src/combat/pcaao.js`. See `STYLE.md`.
2. **Defaults**: DFO's `PORT_DEFAULTS` (`src/systems/settings/settings.js`) override Daggerfall Unity's
   `settingsDefaults.js` (example: the default swing mode is Click or Hold).
3. **Check every agent's work against the code**, including verifiers' work: they introduced errors twice.
4. **No game assets** in committed files; game-derived map data lives in gitignored `docs/build/`.
5. Commit on branch `claude/handbook` in the worktree, then fast-forward `main`. Atlas wrote files into the main
   checkout; remove identical untracked copies before fast-forwarding or the merge refuses.

## Where the game source is

DFO main `e4f093166` (2026-10-24; the guide's older review baseline is `0df2d87eb`). The clone at
`upstream/daggerfall-js-source` has another branch checked out (`feat/drunk-feel`): read main with
`git -C upstream/daggerfall-js-source show e4f093166:<path>`; a read-only extracted snapshot used by the roadmap run is
`upstream/snapshot-e4f093166/`. Fact extraction: `DFO_SRC=<snapshot>/src DFO_COMMIT=e4f093166 node handbook/tools/extract-facts.mjs`.

## Next steps, in order

1. **Review the 92 drafts and the 8 unmarked pages** (read each, re-check risky claims in code, remove `status: draft`). The badge is now
   explained in "How this guide is checked" and the sidebar legend; do not remove the explanation with the badges.
2. **Batch 5 (deferred): original diagrams and interaction polish** — HUD/hotbar, town map legend, creation flow, item
   card, travel view, Firmament; mobile ToC/touch targets, side-panel keyboard/touch, map URLs/payload, self-hosted
   fonts. `audit/REPORT-2026-10-24.md` has the list.
3. **Change automation (deferred "never rot")**: commit-digest tool, scheduled staleness check, generated What changed,
   facts registry growth, docs → handbook pipeline. Until then, run the sync drill below.
4. **Sync drill** after the next fork sync: re-extract facts at the new commit, update `handbook/facts/sync.json`
   (source commit/date/commits-behind), check the diff, and append that update's "What changed".
5. **Before public launch**: Hazelnut's permission for the road data (or confirm DFO's covers the handbook); the
   class base-stats decision; then delete the staging Access app. The build-side launch work is done (metadata,
   sitemap/robots, 404, footer links, reproducible-map note in DEPLOY.md).
6. Smaller: check Node 22; apply `docs/TIGER-FIST-ERRATA.md` (five entries) to the private Tiger Fist guide and
   re-read it against the current commit.

## Agents

- Codex: at most one Sol (`gpt-6.1-sol`) and three Lunas (`gpt-6-luna`) at once. Sol's sandbox can't run git:
  Claude reviews and commits its work. Run with
  `codex exec -m <model> -C <worktree> -s workspace-write --add-dir <scratch> -o <report> - < <brief>`.
- Atlas and Hark (other agents the user runs) work from files in `handoffs/`; they have wrapped up
  (`handoffs/WRAPUP-2026-10-21.md`).

## Local preview

The worktree's `.claude/launch.json` (local only, never commit it) has a `handbook-preview` entry serving
`handbook/dist` on port 5197. Ports 5180 and 5181 belong to the user's own dev servers.




