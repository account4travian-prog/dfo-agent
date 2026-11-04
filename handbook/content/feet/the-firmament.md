---
title: The Firmament
summary: The Firmament's signs, paths and two point pools, and how to spend and refund them.
stage: feet
order: 30
gate: level 3
tags: [firmament, renown, stars, professions]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Open it from the pause menu's **Growth** tab. **Written in the Stars** introduces it at character level 3 online, and the service needs a registered account.
> - Choose one of seven starts, then buy only stars connected to what you already hold. A keystone can be reached but not passed through.
> - Renown supplies Stars for the combat sky; profession ranks supply Craft points for the life ring only.
> - Below Renown 10, refunds are free. From Renown 10 each refunded Star costs 10 Marks; a whole-sky respec costs 10,000 gold.
> - Every channel and every group has a cap, so stacking one damage bonus stops helping.

## The opening route: pause, Growth, Firmament

The Firmament is a tree of passive bonuses held by the account service, so it works online only. Open the pause menu and choose the **Growth** tab. That tab also holds Level and Specialisations; the **Firmament** section draws the sky. Press **Accept** to keep a change.

The introduction questline **Written in the Stars** opens at character level 3 for online play. It teaches the choice of a sign; the tree itself is read in the Growth tab. The service needs a registered account to store the allocation.

## Two purses

![Firmament point purses and a connected branch ending at a keystone](theme/art/diagram-firmament.svg "Caption: Craft points fund life-ring stars first, while Stars also fund combat paths that stop at keystones.")

Renown gives Stars: {{fact firmament.starsPerRenown}} for every Renown level after the first, so 18 at Renown 10 and 98 at Renown 50.

Craft points come from professions. The law sums your ranks across the ten profession tracks, counts each track at most 100, and gives 1 Craft point per 8 total ranks. Ten rank-100 tracks therefore give 125 Craft points. Craft points buy **life-ring stars only**; they can never buy a blow, a spell or a ward.

When a life star is bought, the game spends Craft points first and any remaining Stars after. Spending a Star on the life ring is therefore a real choice, not an automatic one.

## Starts and paths

There are seven free starts: **The Mage**, **The Shadow**, **The Thief**, **The Steed**, **The Warrior**, **The Ritual**, and **The Serpent** in the middle. The six signs surround the inner ring; the Serpent reaches all six. A start is where a path begins, not a class or a build.

Allocate only a star that is one line from your start or from a star you already hold. Select a distant star and the window previews the shortest route and charges for every missing star on it. A keystone ends its path: you can own it, but you cannot buy past it to another star. Cross-links join some branches so you can enter sideways.

The sky names its tiers **small**, **notable** and **keystone**. Every non-start star costs one point whatever its tier or ring. Small stars tend to one focused bonus; notables combine several; a combat keystone gives a larger benefit with a cost, while a life keystone has no negative stat.

## Caps: why more of the same stops helping

Each channel has a maximum the whole sky may add, listed in the law's `STAT_DEFS`. Common ones: one weapon-family damage channel at most 30%, a combat skill at most +15 points, an attribute +15, evasion a 10% chance, armour 10, maximum Health 75, blows taken at most 30% less, and spell-cost reduction 25%.

The blow and the cast are then capped again as groups when they are read. The ordinary weapon channels of one blow are capped together at **+30%**, with a **−20% floor**; the whole blow, including conditional bonuses such as an unaware foe, is capped at **+50%**. A keystone's drawback is paid after its benefit has been capped, so it cannot be hidden by the cap.

## Refunds and the respec

A refund is free below Renown {{fact firmament.refundFreeBelowRenown}}. At that Renown and above, every refunded Star costs {{fact firmament.refundCostPerStar}} Marks. The charge counts every star removed, including a connecting star's dependents: taking a link back also takes any star that no longer reaches your start through what remains.

Your first sign is free. Changing it refunds the old tree and charges for the stars taken back at the same rate.

The whole-sky respec is a separate action. It clears your sign and every allocated star for {{fact firmament.respecGold}} gold whatever your Renown, without the Marks charge. Share codes carry a tree between players, but a code made under a different version of the sky is refused rather than misread.

## What to spend points on first

Find the wedge that matches the offence you already use: a spell school, a weapon family, fists or archery. Buy outward along that path toward its notable and its keystone. A keystone is a trade, so read its drawback before you commit.

Do not open a second damage branch until you have checked the shared group caps. Once the blow or cast group is full, points usually go further in defence: blows taken, armour, maximum Health and regeneration each have a separate budget. Attributes and combat skills are small per point but feed every formula behind an attack and a defence, so they rarely waste a point.

Spend Craft points on the life-ring stars for the professions you actually rank — yield and experience first, then carry weight or travel fatigue. Craft points arrive slowly, so plan the order.

## When the sky sleeps

The Firmament is in force while you are online and have chosen a sign. It sleeps offline and while mentoring. Its combat channels also sleep in refereed duels and Arena bouts, and the sky never raises damage against another player.

The life channels — gathering, prices, carry, travel fatigue — work in ordinary online play, because there is no fight in a price. In a siege and in the Wrothgarian open zone the combat channels still work against NPC foes, but a strike or spell aimed at a player is rolled with the sky taken off.

## Common mistakes

- **Buying toward a distant star without reading the route.** You pay for every missing star the preview shows.
- **Treating a keystone as a free bonus.** Its drawback counts against the same channel and group caps as its benefit.
- **Spending Craft points on combat.** They cannot buy combat stars.
- **Refunding after Renown 10 without counting the cascade.** A connecting star takes its dependents with it, and each is charged.
- **Assuming the sky works everywhere.** It sleeps offline, while mentoring, and in duels and Arena bouts.

## Next

- [Renown](renown.md)
- [Craft specialisations](../gear/craft-specialisations.md)

## Sources

- `src/ui/growth/growthTab.js`: `drawGrowthTab`, `firmamentPage` (the pause menu's Growth tab and its Firmament section)
- `src/systems/questlines/qlLines.js`: `introFirmament`, `lineOpens` (Written in the Stars opens at character level 3, online)
- `src/net/firmament/firmamentLaw.js`: `STARS_PER_RENOWN`, `starsFor`, `CRAFT_RANKS_PER_POINT`, `craftPointsFor`, `STAT_DEFS`, `BLOW_CAP`, `BLOW_FLOOR`, `BLOW_TOTAL_CAP`, `CAST_COST_CAP`, `blowPct`, `castCostPct`, `pathTo`, `treeFault`, `refundTakes`, `fits`, `pointsLeft`, `treeOfCode`, `REFUND_FREE_BELOW_RENOWN`, `REFUND_SILVER_PER_STAR`, `FIRM_RESPEC_GOLD`
- `src/net/firmament/firmamentTree.js`: `START_KEYS`, `SIGNS`, `FIRM_NODES`
- `src/net/firmament/firmamentBook.js`: registered-account checks and `respec`
- `src/systems/firmamentLive.js`: `firmamentInForce`, `firmStat`
- `src/systems/firmamentPowers.js`: `firmamentAwake`, `withoutFirmament`, player-target rules
- `bible/06-Systems/Firmament.md`: design intent for the two purses and the budget
- Research: `handbook/research/P2.md`, `handbook/research/M.md`
