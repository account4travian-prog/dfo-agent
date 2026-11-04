---
title: Noble work
summary: Plan deliveries, exchanges and discreet violence for nobles while watching changing deadlines and hidden standing costs.
stage: reference
order: 64
gate: none
tags: [quest, pattern, nobles, delivery, reputation]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Record every recipient and whether you must return with an exchanged item.
> - Recheck the clock after each handover.
> - Payment can accompany a loss of standing with another faction.
> - Read refusal and surrender choices before committing.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver/guild | Noble questor; social work |
| Gate | Character level or reputation; some offers restrict gender, adult content or repeat acceptance |
| Where | Generated contacts, palaces and dungeons; some places appear only after starting |
| Time | Often tight, sometimes separate delivery legs; online deadlines charge played time |
| Reward shape | Scripted gold or objects; eligible success can add gear and Renown |
| Instance | **Your instance** when offered; full-size private quest dungeons admit your party |


## How to read the offer

Record patron, region, contacts, cargo, deadline and final recipient. Check whether delivery ends the task or starts another leg. Recheck **Quests** and **Time remains** after exchanges: another clock may start.

Read refusal prompts before deciding; the family has no universal safe-refusal rule. Distinguish generated work from named story invitations and the [questline ladder](../questline-ladder.md).

## The shapes you will see

1. **Direct delivery.** **A Peace Offering** (`R0C10Y13`) uses a palace contact; **Contraband Goods** (`R0C10Y11`) uses another generated recipient. Carry the assigned object and confirm hand-in.
2. **Exchange and return.** **Gold Smuggling** (`R0C10Y02`) exchanges a gold bar for an item the patron wants back. Keep the return cargo and read demands from attackers before surrendering it.
3. **Chained delivery.** **A Special Substance** (`R0C10Y17`) and **An Item on Loan** (`R0C10Y18`) add another item, recipient and clock. Record the new destination.
4. **Discreet violence.** **Deadly Diplomacy** (`R0C10Y05`) assigns a dungeon opponent. Complete the kill, then find the named payment contact.
5. **Recovery.** **The Heirloom** (`R0C10Y06`) places a trinket underground. Recover that object; ordinary jewellery does not replace it.


## Quick path

1. Read eligibility, objective and refusal choices before accepting.
2. Record every named contact, destination, item and clock.
3. Plan the route and leave space for exchanged goods.
4. Visit the contact or enter the quest instance when offered.
5. Deliver, recover or defeat the assigned target; read updates.
6. Follow each new leg and reach the stated final recipient.


## What gets players stuck

Use this fix order:

1. Recheck the latest leg, recipient and clock; the first handover may not finish the job.
2. Confirm the generated site and instance. Ask for [directions](../../town/talking-to-people.md); search secret rooms and dressing underground.
3. Check inventory for assigned cargo. Keep it apart from sale loot.
4. Read injury-triggered demands before further attacks. A fast kill may bypass feedback; report missing progress rather than assuming another kill repairs it.
5. Check reputation consequences before blaming a bug. **An Item on Loan** explicitly lowers Thieves Guild standing on successful delivery.
6. Report the ID, site and last entry if blocked. Online reload and sold-item recovery remain unverified.


## Rewards and standing

[Quest rewards](../quest-rewards/) explains payment and eligible gear. Online protection removes the ordinary failure penalty; explicit scripted reputation changes still apply, including expiry consequences. Paid success can harm another faction. No universal purse or safe refusal is established.

## Sources

- `handbook/quests/quests.json`: the seven example IDs above.
- `upstream/snapshot-e4f093166/src/systems/quest/questLists.js`: `getSocialQuest` gates; index membership labels are misleading here.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task structure only.
- `upstream/snapshot-e4f093166/src/systems/quest/clock.js`, `quest.js`, `actions.js` (`ChangeReputeWith`): clocks and distinct reputation paths.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; related pages linked above.
