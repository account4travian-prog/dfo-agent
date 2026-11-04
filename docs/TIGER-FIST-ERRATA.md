# Tiger Fist guide: errata and items to re-check

Running list of corrections for the private Tiger Fist field guide (docs 05 and 23-35), found while building the public
handbook. Apply them at the next update of the field guide, then move each line to "Applied".

The guide was last checked against DFO main `4bba28c6c`. The handbook works from `0df2d87eb` (2026-10-21).

## Open

| Found | Where in the Tiger Fist guide | Issue | Source |
|---|---|---|---|
| 2026-10-21 | All docs | Re-verify against `0df2d87eb`: 53 non-merge commits since `4bba28c6c` touched professions (`professionLaw`, `recipeLaw`, `server-account/src/professions.js`, `alchemy.js`), the market, the festival and Starfall law, two questline scripts (`QLIS01`, `QLOC02`), weather, ships (Come Sail Away) and revenants. The guide's pinned tests still pass at `0df2d87eb`, so the pinned numbers hold; unpinned text in these areas needs reading. | `git log 4bba28c6c..0df2d87eb` |
| 2026-10-21 | Doc 30 (Getting Around), "Mages Guild teleport and party travel" | Missing two online facts: (1) the paid-teleport switch is the **player's own** Travel Options setting online (only four other Travel Options switches are forced), so any member can turn it on and pay (8 − rank) × 200 gold; (2) online a member's own rank stops at 7 and ranks 8-9 are chapter seats, so the free rank-8 service is for chapter officers. For Tiger Fist: joining the Mages Guild and enabling paid teleport is a real no-magic travel option. | `src/systems/online/onlineLane.js` `ONLINE_ROOM_MOD_KEYS['travel-options']`; `src/systems/travel/travelOptions.js` `teleportCost`; `src/net/npcChapterLaw.js` `ROLL_BOOK_RANK_MAX` |
| 2026-10-21 | Doc 30, "Your own cart or wagon" | "A low-condition wagon becomes slow" holds only on the **Hard** upkeep setting; on the default Boons setting the wagon's pace never drops below normal. (Atlas, research V1.) | `src/systems/wagon/wagonUpkeep.js` `wagonState`; research `handbook/research/V1.md` |
| 2026-10-21 | Doc 30, "The cart method" | "410 of the Bay's 3,444 settlements have such a gate" came from the guide's own map extract, not from DFO's code. Keep it, but label it as counted from the game's map data. (Atlas, research V1.) | research `handbook/research/V1.md` |
| 2026-10-21 | Doc 27 (Caps, Timers and Catch-Up), hourly limits | Profession (600), Marks (120) and market (60/120) limits are called "rolling" windows. They are fixed windows that reset on each clock hour. | `server-account/src/accounts.js` `overRate` (fixed window, floor(now / window)) |
| 2026-10-21 | Doc 27, Royal Tourney row | "Sign-up closes ten minutes before battle" is the siege-roster rule (`SIGN_CLOSES_MS`); the Royal Tourney has no such cutoff, only its pair limit. | `src/net/townSeatLaw.js` `SIGN_CLOSES_MS`, `signOpen` |

## Checked and still correct

- **Racial weapon bonus (doc 05):** the Khajiit bare-hand bonus under PCAAO is right (up to +10 damage at 100 in the
  four attributes it reads). The handbook's first research note missed racial bonuses entirely; the guide did not.
- **Adrenaline Rush (doc 05):** +8 to hit below a sixth of health is PCAAO's online value. Correct.
- **To-hit from Agility (doc 05):** your Agility minus the foe's, divided by 4 (PCAAO). Correct.
- **NPC guild promotion (doc 35):** no waiting period online (`PROMO-NOW`). Correct.

## Applied

(none yet)
