# The DFO Online Handbook

A player's guide and wiki for DFO Online, written for a new player and easy to extend. It walks through the game in
the order the game opens up to you: from creating a character, through Privateer's Hold and your first town, to
guilds, Renown, professions, companions, city control and the late game. Every rule and number is checked against the
game's own source.

It is a static site. It builds with Node and no installed packages, and the output can be hosted on GitHub Pages,
Cloudflare Pages (wardenlog.org) or any static host.

## Reading experience

The handbook carries over what makes the private Tiger Fist field guide easy to read:

- **Previews that quote:** hover or focus a link outside the left navigation to see the target's first real paragraph,
  its stage and its gate; left-navigation links show the same preview box when you click them.
- **Delve without losing your place:** references open in a side panel beside the page, with its own Back, breadcrumb,
  Open as page and Close. Your place in the page you were reading never moves. In the left navigation, a plain click
  opens the preview box and its **Read this page** link visits the page; Ctrl+click (⌘ on a Mac) opens the side panel.
  Elsewhere, Ctrl+click opens the panel and a plain click follows the link.
- **Glossary on hover:** terms are underlined on first use, with their definition on hover.
- **Search everywhere**, a **"Where are you?"** stage selector that dims what you haven't reached, light and dark
  themes, and a layout that works from a phone up.
- **Checklists** for daily and weekly routines that reset on the game's UTC clock.
- **The Bay map** (place search, a pin plus a typed "what are you looking for?" finder, and local town maps) in local
  builds; see the note in STRUCTURE.md on publishing game-derived map data.
- **The character planner** (`--planner` builds): DFO's creation screens, rule checks, share links and class export,
  embedded at `/reference/character-planner/`.
- **The quest guide** at `/quests/`: every player-facing quest (283 records) with facts, sheet objectives for the main
  story and questlines, pattern guidance, rewards and a recovery ladder; `/quests/#<id>` is a stable deep link. The
  fixed layer covers the main-story overview, Lady Brisienna, all 14 questlines and all 14 generated-quest families.
- **Ask the guide** at `/ask/`: the Archivist. Quoted handbook passages are always available; an optional Worker
  (`/api/ask`, behind Access) adds a short checked answer through Workers AI, with a $5 estimated monthly cap and
  static fallback. Live/player/price questions are refused. The home page has a draggable Archivist chat head.
- **Feedback routes**: every article has **Request an update**; when the assistant finds no coverage it offers **Submit a
  Manuscript** (`/contribute/`) and **Request answer**. The Worker stores both in the editor queue; submissions are
  moderated and edited.
- **Decision guides** (2026 expansion): orientation for players coming from Daggerfall/DFU, offline/online, the first
  90 minutes, mods/saves/wipes, playing with a friend, session planning, the progression map, beginner builds, the three
  standing tracks, safe storage, money routes, online combat maths, spellmaking, magic-item economy, the bestiary,
  the Privateer's Hold walkthrough and stuck/recovery. Research is in `docs/39-guide-expansion-plan.md`.

## Folder layout

```text
handbook/
  README.md            this file
  STRUCTURE.md         the progression outline: stages, unlock gates, and every planned page
  STYLE.md             voice, page anatomy, grounding rules and progressive disclosure
  stages.json          the stages in play order (the site's spine)
  content/             one Markdown file per page, in a folder per stage
  facts/               numbers read from the game's source, so pages update when the game changes
  theme/               the site's CSS, scripts and original artwork
  tools/               build, check and fact extraction (Node 22, no dependencies)
  handoffs/            briefs for other agents (research, design, imagery)
  research/            source notes those agents write back; raw material, not published
  dist/                the built site (generated; not committed)
```

## Writing a page

1. Find where it belongs in [STRUCTURE.md](STRUCTURE.md). A topic goes in the first stage at which a player can meet it.
2. Create `content/<stage>/<slug>.md` with the front matter described in [STYLE.md](STYLE.md#front-matter).
3. Write it to the page anatomy in STYLE.md. Use `{{fact id}}` for any number that comes from the game, so it stays
   right after the next sync.
4. Run the checks and preview (see below). The check fails on broken links, unknown facts, missing sources or a page
   with no stage.

## Building

```powershell
node handbook/tools/extract-facts.mjs   # after a game sync: refresh facts/facts.json from upstream/daggerfall-js-source
node handbook/tools/check.mjs           # validate content
node handbook/tools/build.mjs           # write handbook/dist/
```

`extract-facts.mjs` reads DFO from `upstream/daggerfall-js-source` (or `DFO_SRC`). The build itself only needs the
committed `facts/facts.json`, so a host can build the site without the game's source.

## Ground rules

- **Grounded:** every rule comes from DFO's source or design records at a named commit. No guesses, no forum lore.
- **Build-agnostic:** explain choices and trade-offs; do not prescribe one character.
- **In play order:** a page never assumes knowledge from a later stage. Forward links are marked as "later".
- **No game assets:** no images, models, sounds or extracted data files from Daggerfall's ARENA2 or DFO's art. Artwork
  is original. Diagrams are drawn from facts, in this site's own style.
- **Online first:** DFO Online's rules, with offline differences noted only where a player would meet them.
