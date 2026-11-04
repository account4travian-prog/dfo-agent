# Handoff: design direction and original artwork for the DFO Online Handbook

**For:** Hark, or any agent that does visual design or image generation.
**From:** Claude, 2026-10-21. **Report back to:** the files named below; the user will tell Claude when they are posted.

## The brief in five words

The user's words for how the handbook should feel: **professional, helpful, comprehensive, visually pleasing,
beautifully designed.**

It is a player's handbook and wiki for DFO Online, a browser MMO built on The Elder Scrolls II: Daggerfall's world
(the Iliac Bay). Readers are new players, often on a laptop or phone, reading in short sessions. Read
[../README.md](../README.md), [../STRUCTURE.md](../STRUCTURE.md) and [../STYLE.md](../STYLE.md) first.

## Direction

Think of a well-made field atlas or a modern museum guide, with a quiet nod to the late-medieval Iliac Bay: ink,
vellum, brass, sea charts, heraldry. It must look current and calm, never like a fantasy-game splash screen.

- Generous whitespace, strong typographic hierarchy, restrained colour, excellent legibility.
- Light (vellum) and dark (ink) themes of equal quality.
- One accent colour family (brass/gold) plus one cool (sea) for links and maps.
- Ornament only where it helps navigation: stage numerals, section rules, small heraldic marks for guilds and stages.

## Deliverables

Put everything under `%USERPROFILE%\Documents\DFO\handbook\design\` (create it). Only create files there.

1. **Two or three design directions** as static HTML mockups (no build tools, no external scripts; Google Fonts are
   fine), each with:
   - the home page (stage map of the 11 stages, search, "Where are you?" selector, start-here card);
   - one article page (use the real text of a page if one exists in `handbook/content/`, otherwise the "Choosing a
     race" outline from STRUCTURE.md), with sidebar, contents, an "At a glance" box, a table, two callouts, a hover
     preview card and the Sources disclosure;
   - colour tokens for light and dark, type scale, spacing scale, written as CSS custom properties at the top.
   Name them `design/direction-a.html`, `design/direction-b.html`, ...; add `design/DIRECTIONS.md` explaining each
   in a paragraph.
2. **Wordmark** for "The DFO Online Handbook": SVG, works in one colour, light and dark. Must not imitate the Elder
   Scrolls, Daggerfall or Bethesda logos or typefaces.
3. **Stage illustrations**: one per stage (11, see `stages.json`), a consistent series. Suggested subjects: a
   lantern at a threshold (before you begin), a quill and character sheet (creation), a sea-cave dungeon mouth
   (Privateer's Hold), a walled market town at dawn (first town), a road with a carriage and milestone (getting
   around), a star chart over an anvil and herb basket (finding your feet), a gem-set blade beside a ship's wheel (gear
   and the sea), a town gate with banners under a storm sky (the wider Bay), a kneeling armoured rival before a burning
   portal (rivals and the Breach), a ship at a misty horizon (the late game), an open book (reference). Wide format (2400 x 900, also cropping to 1200 x 1200), WebP or PNG, plus a small SVG or
   line version for cards if practical.
4. **Icon set** (SVG, 24px grid, stroke style matching the wordmark): callouts (tip, warning, online rule, example),
   gates (level, Renown, registered account, quest), and town services (bank, general store, temple, tavern, guild
   hall, armorer, weapon smith, stable, port, carriage).
5. `design/CREDITS.md`: for every image, who or what made it, the prompt or method, and a line confirming it contains
   no game assets.

## Hard rules

- **No game assets of any kind**: no screenshots, sprites, textures, UI, maps, fonts or audio from Daggerfall,
  Daggerfall Unity, DFO or any Bethesda product, and nothing traced or image-to-image generated from them.
- No Bethesda, Elder Scrolls or Daggerfall logos, seals or lookalikes. Original heraldry only.
- No real people's likenesses, no signatures or watermarks, no text baked into illustrations (the site sets text).
- Keep each image under 600 KB (WebP preferred), and SVGs clean (no embedded rasters).

## When you finish

Append a line to `handbook\design\DONE.md` listing what you delivered, then tell the user.
