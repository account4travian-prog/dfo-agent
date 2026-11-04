# Deploying the handbook

The handbook is hosted on **Cloudflare Pages**, project `dfo-handbook`, at `handbook.wardenlog.org` (and
`dfo-handbook.pages.dev`). Until launch it sits behind **Cloudflare Access**, so only allowed people can open it.

## Reproducing the map build

The `--map` build reads `docs/build/` (about 163 MB), which is gitignored because it is generated from the player's
own Daggerfall files with the private field-guide tools. A clean clone therefore cannot produce a map build on its own.

On a new machine:

1. Install Daggerfall (Steam/GOG/DaggerfallGameFiles) and point `ARENA2_PATH` at the `ARENA2` folder.
2. Point `DFO_SRC` at the game source checkout's `src/` and run `node planner/tools/build-world-map.mjs`
   (this writes `docs/build/world-map.html`, `world-map.json`, `paths.json` and the town data; see
   `docs/build/README.md` for the exact source/commit and the map checks).
3. Run `node handbook/tools/build.mjs --map` and confirm `handbook/dist/reference/bay-map/index.html` exists.

Without that data the build still succeeds but emits the local-map note instead of the map. Deploying without `--map`
is supported; the map is the only part that needs the data. The road/track/river layer also carries the Hazelnut
permission question in "Launch" below.

## Feedback, analytics and edit links

- The site runs **no analytics** and sets no third-party cookies; the only external request is the Google Fonts
  stylesheet. Keep it that way unless the owner decides otherwise.
- Reader feedback goes to the DFO Discord and the game's issue tracker, linked in the footer and on
  `reference/how-this-guide-is-checked/`. `site.config.json` has `feedbackUrl` for a dedicated Handbook form when one
  exists.
- `editBaseUrl` stays empty until the Handbook's own public repository is chosen. When set, article footers gain
  "Edit this page on GitHub" automatically.
- `baseUrl` (currently `https://handbook.wardenlog.org`) drives canonical URLs, Open Graph tags, `sitemap.xml` and
  `robots.txt`. Update it before a domain change.

## Current setup (done 2026-10-22)

- Pages project `dfo-handbook`; first deployment 2026-10-22.
- **Preview access** restricted in the project's settings, which created the Access application
  "dfo-handbook - Cloudflare Pages" for `*.dfo-handbook.pages.dev` (policy: the owner's email only).
- Access application **"DFO Handbook (staging)"** for `handbook.wardenlog.org` and `dfo-handbook.pages.dev`, using
  the reusable **"Owner Only"** policy (also used by the "writing" app).
- Custom domain `handbook.wardenlog.org` (CNAME to `dfo-handbook.pages.dev`).
- Verified from outside: every address redirects to the Access login; no handbook content is served without it.

> **Never edit the "Owner Only" policy to open the handbook.** It also protects `writing.wardenlog.org` and
> `writing-api.wardenlog.org`; loosening it would open those too. To launch, change the handbook's own application
> (below).

## One-time setup (Cloudflare dashboard)

(How it was first set up; kept for rebuilding the project elsewhere.)

These need dashboard permissions that the Wrangler login doesn't have. Do them **before the first deployment**: a
Pages site is public at its `pages.dev` address from the first upload.

### 1. Put Access in front of the site

Zero Trust → Access → Applications → **Add an application** → **Self-hosted**.

- Application name: `DFO Handbook (staging)`
- Add these hostnames (one public hostname each):
  - `dfo-handbook.pages.dev`
  - `*.dfo-handbook.pages.dev` (branch previews)
  - `handbook.wardenlog.org`
- Policy: **Allow**, include **Emails** → only the addresses that may see it before launch. Never use
  `Include Everyone` or `Include all valid emails`.
- Login method: **One-time PIN** (as for the agent hub's viewer).
- Save.

Why the dashboard: Wrangler's login has no Access or Zero Trust permission (`wrangler login --scopes-list`), so no
Wrangler command can create this. The agent hub's Access applications were set up the same way.

### 2. Attach the custom domain

Workers & Pages → `dfo-handbook` → **Custom domains** → **Set up a custom domain** → `handbook.wardenlog.org`.
Because wardenlog.org is on the same Cloudflare account, the DNS record is created for you.

## Deploying

From the DFO workspace (Wrangler is installed in `%USERPROFILE%\Documents\wardenlog-agent-hub`):

```powershell
node handbook/tools/check.mjs
node handbook/tools/build.mjs --map --planner
npx --prefix %USERPROFILE%\Documents\wardenlog-agent-hub wrangler pages deploy handbook/dist --project-name dfo-handbook --branch main
```

- `--map` adds the Bay and town maps (the owner approved publishing them, 2026-10-22). It reads the map data in
  `docs/build/` (from the private guide's map tools), which must exist on the building machine.
- The `/quests/` guide is built from the committed `handbook/quests/quests.json`; no extra flag or local game data is
  needed. To regenerate it after a sync, run `node handbook/tools/extract-quests.mjs` then
  `node handbook/tools/build-quest-index.mjs` with `QUEST_EXTRACTION=audit/work/quests-full.json`, and commit only the
  dialogue-free output (see `handbook/quests/README.md`).
- `/ask/` always works as the static extractive assistant from the built search index/facts. It also calls the
  optional Worker at `/api/ask` for a checked written answer; if the model is unavailable, over budget or unverified,
  the quoted cards remain. The Worker lives in `handbook/assistant/` and deploys separately:

  ```powershell
  cd handbook/assistant
  npx --prefix %USERPROFILE%\Documents\wardenlog-agent-hub wrangler deploy
  ```

  The Worker route is `handbook.wardenlog.org/api/*` (inherits Access); it has a **$5 estimated monthly budget**,
  uses the Workers AI free 10k-Neuron/day allowance for testing, and keeps quotas off until opened beyond testers. See
  `handbook/assistant/README.md`.
- `--planner` adds the character planner at `reference/character-planner/` and the home-page button. It needs
  `planner/data/game-data.json` (extracted from your own Daggerfall files) and copies the app to `dist/planner/`.
- Never deploy a build made with `--game-data`: that adds the class base-stats table, which is not yet approved for
  publishing.
- `--branch main` updates the production site; any other branch name makes a preview at
  `<branch>.dfo-handbook.pages.dev`.
- After deploying, check the gate: opening the site in a private window should show the Cloudflare Access login.

## Launch

Before launch, settle these:

- **Road data permission.** The map's roads, tracks, rivers and streams are Basic Roads' hand-authored data by
  Hazelnut. Its code is MIT, but the data has no licence; DFO uses it by Hazelnut's personal permission to DFO's
  developer (`vendor/roads-hazelnut/README.md` in DFO). Get Hazelnut's permission for the handbook too (or confirm DFO's
  covers it) before the site goes public; otherwise build without the road layer.
- **Class base-stats table** (`--game-data`): still undecided; leave out.
- **Planner data.** `--planner` ships `planner/data/game-data.json` (class and biography data extracted from Daggerfall).
  The class numbers are game facts; the biography text is the game's writing. It is behind Access on staging: before a
  public launch decide whether to ship the data or make the planner read a visitor-supplied ARENA2 folder.

When the content is reviewed and those are settled: delete the **"DFO Handbook (staging)"** Access
application (or remove its two hostnames). Leave the previews application in place so branch previews stay private.
The site is then public. Do not touch "Owner Only".

## Deployment log

- **2026-10-24** — production deployment `0b752642-e6ce-4d4c-981c-ab66ba795c85` (source `1f6cf3e`), built with
  `node handbook/tools/check.mjs` (0 errors) and `node handbook/tools/build.mjs --map`; 191 files uploaded (124 new).
  Access gate verified after deploy: `handbook.wardenlog.org` and `dfo-handbook.pages.dev` both return 302 to
  `frosty-dew-bc8c.cloudflareaccess.com`. Content is therefore live behind Access, not public.
- **2026-10-24** — sidebar interaction release `32582b16-1a9d-44a6-bc7b-69f6ec1572d4` (source `263120a`): left-navigation
  links now open the side reader on a plain click instead of a hover preview; Access gate re-verified (302).
- **2026-10-24** — sidebar preview revision `7414ddbf-68e2-4f01-a33b-eb7c87518851` (source `5b5331e`): left-navigation
  links open their preview box on click (no hover); **Read this page** in the box visits the page, Ctrl+click opens the
  side reader. Access gate re-verified (302).
- **2026-10-24** — planner/map/batch-5 release `35466cba-6b8b-4e6e-b395-df5507198f5d` (source `104bb94`): planner
  page + home button, typed map finder, six diagrams and mobile interaction polish; 214 files uploaded. Access gate
  re-verified (302).
- **2026-10-25** — quest-guide release `e360d4fe-d842-41a2-825a-9f9bae01cb8e` (source `f7ccfda`):
  the complete `/quests/` browser (283 quests), home and reference links, 284 new search entries and the quest data/UI;
  218 files uploaded. Access gate re-verified (302).

- **2026-10-25** — guide-assistant/fixed-page release `195823f7-5286-48ba-9ee1-9386aa66ef9b` (source `617b055`):
  static `/ask/` extractive assistant, the first fixed quest page (`/reference/lady-brisienna/`) and its browser link;
  223 files uploaded. Access gate re-verified (302).

- **2026-10-25** — expanded quest-guide release `55f01dd3-923a-480e-b5df-e1d368deeeff` (source `28a6504`):
  main-story overview, four questline guides and three generated-quest pattern pages; 110 articles, browser links and
  fixed-page data. 231 files in the deployment (132 new). Access gate re-verified (302).

- **2026-10-25** — complete quest-guide coverage `27a84282-b9c4-4b12-ae35-64088724cbea` (source `991d5dd`):
  all 14 questlines and all 14 generated-quest families now have fixed guides; 131 articles and 30 quest-guide pages.
  252 files in the deployment (153 new). Access gate re-verified (302).

- **2026-10-25** — Archivist model layer: Pages `624b8383-d075-43b4-9715-748c868eb70f` (source `40243ad`);
  Worker version `7c655ec5-2bed-4778-8b81-8545346eec6c` deployed at `handbook.wardenlog.org/api/*`. The Worker
  uses Workers AI qwen3-30b-a3b, a $5 estimated monthly budget and the Workers Free 10k-Neuron/day testing allowance.
  Access gate re-verified on `/ask/` and `/api/health` (302).

- **2026-10-25** — Archivist portrait/animation release `f4e9ff6a-ffd2-4a5a-834d-c67dbec19f91` (source `cbe565b`):
  Sol 6.1 original reading-desk portrait, inlined for CSS reading/speaking loops, animation map, and explicit Ask-button
  loading/error feedback. Worker unchanged at `7c655ec5`. Access gate re-verified (302).

- **2026-10-25** — factions/feedback/float release `9a3dd7ab-65ea-48fc-b513-59005c684876` (source `2cd9629`):
  five faction pages, Mages Guild service split, request-answer/manuscript/update endpoints, /contribute page, a
  draggable home-page Archivist chat head and the animated portrait. Worker `e14d7613`; 262 files in the deployment.
  Access gate re-verified (302).

- **2026-10-25** — help-widget redesign `527d0bff-4c30-4d28-bf1c-6b6c543bba0b` (source `ad0603e`):
  fixed-overlay Archivist launcher with the animated Sol portrait, drag persistence, open/minimize/close/reopen states
  and a 360px chat panel; no hero grid participation. Worker unchanged at `e14d7613`. Access gate re-verified (302).

- **2026-10-25** — Archivist launcher enlarged `19f09579-c857-4a75-a88e-19a2cfabaf56` (source `12b81f4`):
  130 px circular frame now shows the complete Sol portrait (face, hood, hand and book) instead of a face crop; drag
  margin adjusted. Worker unchanged at `e14d7613`. Access gate re-verified (302).

- **2026-10-25** — Archivist animation fix `d7183486-96df-4b7f-9715-419be7e9c57f` (source `1affcc1`):
  brass clasp no longer participates in the breathing transform, breathing no longer scales, the home launcher omits
  the page-turn, and reading/speaking loops are longer and eased. Worker unchanged at `e14d7613`. Access gate
  re-verified (302).

- **2026-10-25** — mouth-transform fix `dd3c1eed-ac54-4820-879c-d81d0dcece9c` (source `8977560`):
  the home launcher was missing the portrait's base transform-box/origins, so the speaking mouth scaled around the SVG
  origin and looked like a coin between the eyes. Restored mouth rest scale, head/book/hand origins and speaking poses.
  Worker unchanged at `e14d7613`. Access gate re-verified (302).

- **2026-10-25** — inline widget answers `b4ba5094-bade-4dba-b4f5-447824b2f56d` (source `8b27f00`):
  the floating Archivist now loads the search index lazily, searches in place, expands to a 460px scrollable window with
  quoted passages and calls /api/ask for an optional written answer. No page navigation. Worker unchanged at
  `e14d7613`; 263 files. Access gate re-verified (302).


- **2026-10-25** — guide expansion `fd7ba5c3-8b58-447d-b474-76a252b89029` (source `5ed1994`): 17 new source-backed guides and FAQ/navigation/search integration; 153 content pages, 280 files deployed. Worker `3936f591` carries the refreshed 452-doc assistant corpus. Access gate re-verified (302).
