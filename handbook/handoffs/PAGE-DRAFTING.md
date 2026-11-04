# Handoff: drafting handbook pages from research notes

**For:** any drafting agent (Luna, Sol, Atlas, Hark or a person). **Reviewer:** Claude.

## Before you write

1. Read [../STYLE.md](../STYLE.md) (the contract) and [../STRUCTURE.md](../STRUCTURE.md) (where your pages sit).
2. Read the exemplar pages; match their shape, tone and density:
   - `content/creation/custom-classes.md` (tables, example callout, online-rule callout, design advice)
   - `content/creation/races.md` (short page, one strong table, a saving-throw explanation)
   - `content/travel/hired-carriages.md` (procedure page)
3. Read the research note(s) for your topic in `research/`.

## The one rule that matters most: verify, don't copy

Research notes are a starting point, not a source. **Re-check every claim you use against the code** at the
commit in the page's `verified` field (`0df2d87eb` until the next sync), and fix or drop anything that doesn't hold.
Reviews of the first batch found research notes that were wrong on:

- direction of effect (reflexes: higher makes fights *harder*, not easier);
- stacking (racial and class resistances *do* add together);
- scope of a limit (seven advantages *and* seven disadvantages, not seven in total);
- an online override missed (NPC guild promotions don't wait 28 days online: `PROMO-NOW`).

- the overriding mod (PCAAO replaces classic combat formulas online: racial weapon bonuses, Expertise, Adrenaline
  Rush and to-hit all differ from the base functions the research read).

- defaults (a verifier read Daggerfall Unity's own default from `settingsDefaults.js` and reported Gesture as the
  default swing mode; DFO's `PORT_DEFAULTS` in `src/systems/settings/settings.js` overrides it with Click or Hold).
  For any default, check `PORT_DEFAULTS`, the Features registry and the online lane before the Daggerfall Unity file.

So for each rule: open the cited file, read the function, and confirm the number, the direction, the scope and any
online-only branch. Then follow [STYLE.md: The online rule is the effective rule](../STYLE.md#the-online-rule-is-the-effective-rule):
check `src/systems/online/onlineLane.js` for whether a mod overrides that system online, and read the override.

## Writing

- One Markdown file per page at `content/<stage>/<slug>.md`, front matter exactly as STYLE.md shows.
- Plain English for a new player; no build advice for a specific character; trade-offs, not prescriptions.
- Never explain a later stage's system. Link forward in one clause; the site marks it "later".
- Every page ends with `## Next` and `## Sources` (files and symbols, plus the research note).
- Use `{{fact id}}` for numbers that exist in `facts/registry.mjs`; add a short note in your report for numbers that
  should become facts.
- Don't copy game text (books, dialogue, quest scripts). Don't describe or embed game images.

## Report

List the pages you wrote, and for each: claims you corrected from the research note, claims you dropped as
unverifiable, and open questions. Claude reviews every page before it is published.
