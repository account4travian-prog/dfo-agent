# Handbook tooling

Requires Node 22 or newer. Uses only Node built-ins; no install step, packages or external scripts.

```powershell
$env:DFO_SRC = 'C:/path/to/daggerfall-js-source/src'
$env:DFO_COMMIT = '0df2d87eb' # required only for snapshots without git metadata
node handbook/tools/extract-facts.mjs
node --test handbook/tools/test/
node handbook/tools/check.mjs
node handbook/tools/build.mjs
node handbook/tools/build.mjs --map --planner # optional pages: map data and planner data must exist locally
node handbook/tools/extract-quests.mjs # public quest facts; add --full audit/work/quests-full.json for local text
node handbook/tools/build-quest-index.mjs # rebuild handbook/quests/quests.json from the local full extraction
node handbook/tools/serve.mjs # loopback, port 5197; Ctrl+C stops it
```

The extractor prints added, changed and removed facts before updating `facts/facts.json`. It also evaluates every
table with `origin: 'source'` and saves its rows in `facts/tables.json`, with the same commit and extraction time.
Both sets are evaluated and validated before either snapshot is written. It reads exported pure
modules, with documented source-regex readers for browser-bound modules. A failed fact read leaves the previous
snapshots intact. Numbers are rendered as bare values: pages supply their own units. Builds need only the checked-in
JSON, not the game source or `DFO_SRC`. Source tables use the saved rows, and their commit must match the facts.
Game-data tables still require `--game-data` and a local extract. Renown Stars are earned after the first Renown
level; labels preserve that qualification.

The checker reports all content errors it can find and exits 1 for errors, 0 for warnings only. A differing
`verified` hash warns that a recheck is needed: hashes alone cannot prove chronological ancestry without a source
repository. It does not claim that an unfamiliar hash is definitely older. Slugs must be lowercase words separated
by hyphens, unique within a stage. Page folders must match their stage. Gates follow STYLE.md's vocabulary.

The build validates before replacing `dist/`. Missing destinations while pages are being written are intentional
check failures; fix the content, then rerun. Zero-content builds still produce a usable home, every stage overview,
reference landing page, 404 and stage-only search index. Stage order and counts come from `stages.json`, not fixed IDs.
Markdown links are relative to the source page; they become relative pretty URLs at build time.

`facts/sync.json` is the committed provenance record: `sourceCommit`/`sourceDate` for the snapshot the numbers follow,
`guideCommit`/`guideDate` for when the prose was last reviewed, `commitsBehind`, `checkedAt`, and an optional
`commitDates` map from hash to date. The footer reads it as two clocks ("Numbers checked against DFO … · Pages reviewed
at …") and keeps the per-page `Page verified <hash>` line, adding a date only when that hash is in the record. An absent
file falls back to the facts commit with no dates, and a page is never claimed as reviewed at a commit it was not
verified at. BOMs in checked-in JSON are tolerated. `404.html` is built with root-absolute assets and navigation
(`/theme/…`, `/`, `/reference/`) because the site deploys at the domain root: a missing deep URL then renders styled
chrome with a working search root (`data-root="/"`). Every other page stays relative and sub-path previews keep working.

`site.config.json` accepts `editBaseUrl`, for example `https://github.com/OWNER/REPO/edit/main/handbook/content`.
It is empty until the actual public repository is selected; no repository URL is invented. When configured, every
article includes its GitHub edit link. The launch keys are `baseUrl` (canonical origin, used for absolute canonical/OG
URLs, the home `WebSite` JSON-LD, `sitemap.xml` and the `robots.txt` sitemap line), `sourceUrl`, `communityUrl`,
`issuesUrl` and `feedbackUrl`. `feedbackUrl` stays empty until the owner supplies one; the footer and home note then
fall back to Discord and the issue tracker for errata. Open Graph `og:image` stays deliberately absent until original
raster art exists rather than pointing at a placeholder. Internal site URLs remain relative, except the 404.

Images must live in `theme/art/`. Use a relative path from the Markdown file or `theme/art/name.svg`. Each image
needs descriptive alt text and an entry in `theme/art/CREDITS.md` naming its creator and confirming original art
without game assets. Optional stage art is `theme/art/stage-<stage-id>.svg` (preferred) or `.webp`, and also requires
a credits entry. Home tiles and stage overviews share that lookup. Tiles crop plates to a centered square on
vellum, falling back to a Roman numeral; stage overviews retain their decorative compass fallback. The home grid
uses four columns above 1200px, three through tablet widths, and two at 600px and below, including narrow reference
panels. Each tile is one stage link, with a small Roman ring I-X or R, title and gate; source stage numbers stay intact.
Full promises are accessible descriptions and appear over the artwork on hover or keyboard focus without changing
row heights. Tiles use their own promise preview, leaving the normal article/link preview behavior intact.
`theme/icons.svg` contains the 24px callout, gate and town-service symbols. `tools/icons.mjs` selects only known
symbols and leaves accessible text labels in HTML. The wordmark is inlined from `theme/art/wordmark.svg` so that
its `currentColor` and live heading-face text inherit the page theme and fonts; `mark.svg` is the adaptive favicon.

For a generic fixture preview (without changing real content), run the tests and serve its generated folder:

```powershell
node handbook/tools/serve.mjs handbook/tools/test/fixtures/dist 5197
```

Tests cover the renderer, facts, URL resolution, glossary, validation and complete fixture/empty builds. Both test
outputs are ignored by `handbook/.gitignore`. The fixture stage contract is isolated from concurrent author edits.
The pure helpers and `build(options)` / `check(options)` exports also accept fixture paths for other checks.

Theme tokens in `theme/handbook.css` control colour, type, spacing, radii and shadow. One Google Fonts stylesheet
loads Cormorant Garamond semibold, Source Serif 4 and Inter, with `display=swap` and system fallbacks for offline use.
Body copy is 18px / 1.6; interface labels use Inter. Ink, muted text and sea links meet AA on their component
backgrounds in both themes. The specified light brass has 4.18:1 contrast on vellum, so it is restricted to marks,
numerals and rules (tested at 3:1); badge and eyebrow copy use muted ink. Theme and reader-stage preferences catch
storage failures. Search fetches only
the site's own JSON and is implemented in `theme/search.mjs` (copied by the build), so the ranking can be unit
tested in Node. It normalises and de-stops the query, lightly stems plurals and verb endings, expands a synonym map
(death, join/apply, money/gold/Marks, save/progress, ship/boat, levels, guilds, companions, cost/price, what's
new/change, mobile/phone), scores title/tags/summary/headings/body with the original 25/12/8/6/1 weights, prefers
whole-query phrases in the title or summary, and applies a stage-proximity boost from “Where are you?” so pages at or
before the reader's stage outrank later ones. The list still shows eight rows, with the real total in “Showing N of M
matches” and a browse-all-stages link in the empty and short states; a query with no hits offers one-edit “Did you
mean” terms from the indexed vocabulary instead of failing silently. Without JavaScript, navigation stays expanded and
every page is readable. Search uses arrows
and Enter; `/` focuses it. At 520px and below the results panel is a fixed sheet pinned inside the viewport (left/right
1rem, width auto, below the wrapped header) instead of a right-anchored dropdown that clipped 68px off a 390px screen;
desktop keeps the anchored dropdown. Draft and planned sidebar markers are decorative dots (`aria-hidden`) explained
once by a hidden legend the stage nav references with `aria-describedby`; full status badges keep their visible label
plus a `title` and visually hidden explanation, and the home page explains what Draft means and how to report a
mistake. Internal-link and glossary previews open on focus, ArrowDown enters the preview, and Esc
dismisses it. Left-navigation links do not preview on hover or focus: a plain click opens the preview box, whose "Read
this page" link visits the page; Ctrl+click opens the side reader, and modifier-clicks keep the browser's behaviour.
Touch taps follow the original link. Print styles expose sources and remove navigation.

Host note: `404.html` uses root-absolute assets and navigation because the site deploys at the domain root. When a
static host serves it at a missing deep URL, its chrome and search root still resolve; if the same file is previewed
under a sub-path, those root-absolute URLs point above the preview root. Every other page stays relative. Configure
the host to redirect missing paths to the actual `404.html` URL if the address bar should show the canonical 404 URL.
