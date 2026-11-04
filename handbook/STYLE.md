# Style guide

The handbook should read as **professional, helpful, comprehensive, visually pleasing and beautifully designed**. This
file is the contract for every page, whoever writes it: Claude, Sol, Atlas, Hark or a human contributor.

## Voice

- Write for a capable adult who is new to DFO Online. Some readers know classic Daggerfall; most do not.
- Plain English, second person ("you"), present tense. Short sentences. One idea per paragraph.
- Lead with what the player does, then why it works. Numbers support advice; they are not the advice.
- Build-agnostic: show trade-offs ("a fighter values X, a caster values Y"), never "the best build".
- No hype, no jokes at the reader's expense, no "simply" or "just". No forum slang.
- Name things exactly as the game shows them (menu names, item names, quest titles), in **bold** the first time.
- Say what is not known rather than guessing: "The source does not set a fixed reward for this."

## Page anatomy

Every page follows this order. Omit a part only when it has nothing to say.

1. **Title**: a plain noun phrase ("Choosing a race"), not a question or a pun.
2. **Summary**: one sentence in the front matter; shown under the title, in previews, cards and search.
3. **At a glance** box: 3-5 bullets a player can act on immediately.
4. **Body**: sections with `##` headings in the order a player meets them. Tables for comparisons, numbered lists for
   procedures, callouts for warnings.
5. **Common mistakes** (where they exist): what new players get wrong and what it costs.
6. **Next**: one or two links onward in play order (the site adds previous/next automatically too).
7. **Sources**: a `## Sources` section at the end listing files and symbols. The build folds it into a disclosure, so
   readers can check every claim without it cluttering the page.

## Front matter

```yaml
---
title: Choosing a race
summary: The eight races, what each starts with, and how much the choice matters later.
stage: creation          # a stage id from stages.json
order: 20                # position within the stage; leave gaps of 10
gate: none               # none | level N | renown N | registered | quest "Title" | other "free text"
tags: [races, attributes, resistances]
verified: 0df2d87eb      # the DFO commit this page was last checked against
---
```

## Grounding rules

- Every rule, number and name comes from DFO's own source (`src/`, `server-account/src/`, `server/src/`) or its design
  records (`bible/`) at the `verified` commit. When the code and the bible disagree, the code wins and the page says so
  only if a player would notice.
- Numbers that come from code use facts: `{{fact firmament.starsPerRenown}}`. The fact registry in `facts/` records
  each value's file and symbol, and the extractor re-reads them after every sync. Hand-typed numbers are allowed only
  for illustrative examples, and must be labelled as examples.
- Describe the online game. Mention single-player behaviour only where a reader might expect it (for example, "unlike
  offline Daggerfall Unity, regional banks share one account").
- Never include, embed or describe extracted game assets: no ARENA2 images, sprites, textures, models, sounds, maps
  rendered from game files, or copied book or dialogue text. Original diagrams and illustrations only.
- Don't publish live player data (seat holders, names, prices) or anything read through a signed-in session.

## The online rule is the effective rule

DFO Online folds in many mods. Some are built into the port, some are vendored mods with their own switches, and
several touch the same formulas. A number read from the base game, from Daggerfall Unity, or from one mod in isolation
can be **wrong online**. Before stating any rule, find the code path that actually runs online:

1. **Start at the ledger.** `src/systems/online/onlineLane.js` says which switches are live online:
   - `ONLINE_ROOM_MOD_KEYS`: mod switches forced for everyone (the shared world: roads, towns, ships, raids, travel,
     the sea; and combat and loot balance: PCAAO, Meaner Monsters, Enemy Expansion, Unleveled Loot, Roleplay &
     Realism and its Items).
   - `ONLINE_WHOLE_MODS`: balance mods held **whole at their shipped defaults** online; their dials are not the
     player's.
   - `ONLINE_PLAYERS_OWN_MODS`: cosmetic mods each player switches for themselves; they never change a rule.
   - `ONLINE_FORCED_PREFS`, the Features registry's `online` declarations, and `ONLINE_FORCED_SETTINGS`: the port's own
     enhancements and Daggerfall Unity settings forced online.
2. **Follow the override, not the base.** When a mod replaces a formula, the base function still exists in the code
   but doesn't run online. Known replacements: combat to-hit, damage, armour, racial and expertise bonuses
   (`src/combat/pcaao.js`, not the classic parts of `src/combat/formulas.js`); enemy attack timing under Enhanced AI's
   telegraphed blows (`src/ai/`); loans, encumbrance and weapon rules (Roleplay & Realism); loot and materials
   (Unleveled Loot, Loot rarity); enemies (Meaner Monsters, Enemy Expansion); travel (Travel Options, Immersive Travel).
3. **Look for online branches.** `isOnlinePage`, `online` flags, `ctx.online`, and comments tagged with a field-bug or
   ledger code (for example `PROMO-NOW`, `REALM P0.2`) often change a rule for online play.
4. **Say when a rule depends on a setting.** If a rule depends on a switch the player controls online, the page names
   the setting and its default.
5. **Cite the override.** The Sources section names the file that actually decides the rule online, and the ledger
   entry that makes it live.

Research notes are not exempt: the first batch missed PCAAO's racial weapon bonuses and its versions of Expertise and
Adrenaline Rush, because it read the base functions.

## Progressive disclosure

- A page belongs to the first stage at which a player can meet its subject.
- A page may mention a later topic in one clause with a link. The site renders forward links with a "later" chip and
  shows the gate on hover. Never explain a later system in an earlier page.
- If an early decision has a late consequence (for example, a class's forbidden materials matter for festival gear),
  say so briefly and link forward.
- Readers can set "Where are you?" to their current stage; the site then dims later stages in the navigation.

## Callouts

```markdown
> [!tip] Bank before you leave town
> Dying online costs part of the gold you carry; banked gold is safe.

> [!warning] Two crafts only
> Only two crafts may rise above rank 50, and the choice is permanent.

> [!online] Online rule
> For differences from single-player Daggerfall Unity.

> [!example] Worked example
> For calculations, labelled as examples.
```

## Links, terms and images

- Link to other pages by path: `[Renown](../growth/renown.md)`. Section links use the heading's slug.
- Glossary terms live in `content/reference/glossary.md`; the site underlines the first use on each page and shows the
  definition on hover. Don't hand-link glossary terms.
- Images: original SVG diagrams or commissioned illustrations in `theme/art/`, with alt text and a caption. Every image
  file has an entry in `theme/art/CREDITS.md` naming its creator and confirming it contains no game assets.

## Words

| Use | Not |
|---|---|
| Renown | renown level (after first use) |
| the Firmament | star tree (except to explain it once) |
| Marks | silver (except to explain the in-game label) |
| registered account | full account |
| character level | level (when Renown is also in play) |
| the Iliac Bay | the map, the world |
