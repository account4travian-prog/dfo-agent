---
title: How this guide is checked
summary: What the page footer means, what a Draft badge means, and how to report a mistake.
stage: reference
order: 5
gate: none
status: published
verified: e4f093166
tags: [trust, sources, draft, corrections]
---

> [!tip] At a glance
> - Every page names the game commit it was checked against in its footer.
> - Numbers that come from the game's source are re-read automatically; other numbers are checked by hand.
> - A **Draft** badge means the page has been checked against the source, but not yet read end to end by the maintainer.
> - If a rule looks wrong, tell us where — the Discord is the quickest route.

## Two kinds of checking

The Handbook is not copied from another wiki. Each page is written against DFO's own source and design records.

- **Rules.** A writer reads the code paths that actually run online, then names the file and symbol in the page's
  Sources disclosure. Combat, loot, travel and the online lane are the usual places where the online rule differs from
  classic Daggerfall.
- **Numbers.** Values in the fact registry are read straight from the source when the guide syncs, so those update when
  the game changes. A number typed by hand is only as current as the page's checked-against commit.

The footer tells you both: the game commit the numbers were read at, and the older commit the page was last reviewed at.
If those are far apart, read the page with that in mind.

## What the badges mean

- **Draft** — the page has been checked against the game's source, but no one has yet read it end to end for sense,
  completeness or contradictions with other pages. Treat its rules as sourced but its coverage as unfinished.
- **No badge** — the page has been through that read-through and is the most reliable state the guide has.
- **Planned** — the page is announced in the structure but not written yet.

A Draft page is not a guess. It is a page whose claims are cited but whose practical advice may still be thin.

## What we do not do

- We do not publish live player data, seat holders, prices or anything read through a signed-in session.
- We do not include Daggerfall's game assets, extracted art, sounds or copied book text.
- We do not claim a rule the source does not set; where the source is silent, the page says so.

## If a page is wrong

Tell us what the page says, what the game does, and how you know. The
[DFO Discord](https://discord.gg/jM2JdwSM8w) is the quickest route to the maintainer; the project's
[issue tracker](https://github.com/Lattymoy/daggerfall-js-source/issues) is for game bugs rather than Handbook
corrections. A wrong rule matters more than a typo: include the commit in the footer and, if you can, the file or
symbol that disagrees.

## Next

- [The glossary](glossary.md)
- [What changed](what-changed.md)

## Sources

- `handbook/facts/sync.json`: the game commit the numbers were read at, and the guide's review baseline
- `handbook/facts/facts.json`, `handbook/facts/registry.mjs`: the fact values and where each is read
- `handbook/STYLE.md`: the grounding, sourcing and no-assets rules this page describes
- `handbook/HANDOFF.md`: the review state of the pages
