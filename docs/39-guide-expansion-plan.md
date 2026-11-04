# Guide expansion: research findings and page plan

Research date: 2026-10-25. Reports: `audit/work/research/guide-landscape.md` (formats/topics over ~20 years) and
`audit/work/research/player-questions.md` (recurring DFO/DFU/classic questions). This file is the bridge from research
to the pages we ship.

## What the research says

The guide ecosystem splits into three layers: UESP owns classic Daggerfall reference, Daggerfall Workshop/GitHub owns
DFU installation and modding, and the long tail (old FAQs, GameFAQs, videos, Reddit, Discord) is stale or ephemeral.
None of them cover DFO Online's rules, because those rules live in source code.

The most useful formats are: fixed facts before prose, indexes by giver/faction/place, a quick path plus a detailed
walkthrough, explicit failure/recovery, visible freshness, search aliases, maps/deep links, and a correction route.
The anti-patterns are undated walls of text, one-true-build claims, copied game assets, and content-farm numbers.

The biggest genuine gaps are **not** more classic content. They are:

- online deltas and what a classic/DFU veteran must unlearn;
- time/caps economics and "what do I do this session";
- how the progression ladders interact;
- DFO-only social, storage, server, and no-mod/no-import answers;
- decision-support for combat, magic items, money, and where to go;
- a searchable "I'm stuck" and startup recovery route.

## Page plan

All pages are source-checked against `upstream/snapshot-e4f093166`, `status: draft`, `verified: e4f093166`, and follow
`handbook/STYLE.md`.

| Page | Reader question | Research basis |
|---|---|---|
| `begin/offline-and-online.md` | What works without an account/network, and what does solo lose? | Official DFO page; account/online mode |
| `begin/first-90-minutes.md` | What do I actually do from the play page to the first town? | First-run questions; onboarding pages |
| `reference/coming-from-daggerfall.md` | I know Daggerfall/DFU; what changed? | Online deltas; top P1 topic |
| `reference/mods-saves-and-wipes.md` | Can I use mods/import a save, and is my character permanent? | Official negatives; source silence |
| `town/play-with-a-friend.md` | How do I group with a friend safely? | DFO-only multiplayer questions |
| `feet/session-planner.md` | I have one hour/evening; what should I do? | Caps, event clock, questline gates |
| `feet/progression-map.md` | What am I meant to improve, and in what order? | Level/Renown/Firmament/professions/companions |
| `creation/online-builds.md` | Which safe build works under online rules? | Build questions; PCAAO/online leveling |
| `town/standing-and-reputation.md` | Why do people, guilds and guards treat me differently? | Reputation question cluster |
| `gear/safe-storage.md` | Where do I put my stuff, and what is safe? | Safe-storage question |
| `feet/money-routes.md` | What earns, what costs time, and what should I do first? | Money/opportunity-cost questions |
| `hold/combat-math.md` | Why can't I hit, and how do the online formulas work? | Combat-math questions; PCAAO |
| `gear/spellmaking-math.md` | How do I design a spell that does what I want? | Spellmaking question cluster |
| `gear/magic-item-economy.md` | Are magic items worth it, and how do I make one? | Item-maker/enchanting gap |
| `hold/bestiary.md` | What am I fighting, and what resists what? | Enemy questions; online enemy mods |
| `hold/privateers-hold-walkthrough.md` | How do I get through the opening dungeon? | "Stuck in Privateer's Hold" recurrence |
| `hold/stuck-and-recovery.md` | I'm stuck/bugged; what is the ladder? | Quest soft-lock cluster; black-screen questions |

## Guardrails

- Link the existing page instead of repeating it. These are decision/support pages, not replacements for the system
  references.
- Separate online overrides from base Daggerfall/DFU formulas. `reference/online-ruleset.md` is the ledger.
- Do not copy UESP text, game assets, maps, or dialogue. Use original prose, tables, and source citations.
- Where the source is silent (for example wipe policy), say so. Do not invent an answer.
- Add aliases and question-shaped headings so search finds "stuck", "mods", "safe storage", "black screen", "why can't
  I hit", "reputation", and "wipe".
- Refresh the assistant index, run tests/check/build, and deploy after integration.

## Verification plan

1. Each writer reports source paths and unverified claims.
2. Lead checks every new page's internal links and front matter.
3. Run `node handbook/tools/check.mjs`, `node --test handbook/tools/test/`, and a full build.
4. Rebuild `handbook/assistant/data/index.json`.
5. Deploy and record the release.


## Status shipped (2026-10-25)

The 17 pages in the table are written, linked and deployed. The handbook is now **153 content pages** (up from 136), with
roughly **20,000 new words** of source-backed guides. Research reports:

- `audit/work/research/guide-landscape.md` — 30-source inventory, 11 guide archetypes, 34 candidate topics.
- `audit/work/research/player-questions.md` — 24 ranked DFO/DFU question clusters and 30 article requests.

Integration: every new page is in the built navigation and search index; existing hubs link to the new pages; the FAQ
adds the mode/mods/save/friend/storage/standing/stuck questions; `reference/questions.md` now points at the new answers.
The assistant corpus is refreshed to 452 docs.

Verification: **114 tests pass, 0 fail, 2 existing skips**; **153 pages, 0 content errors**; Pages release
`fd7ba5c3` from `5ed1994`; Worker `3936f591`. Access gate returns 302 as before.
