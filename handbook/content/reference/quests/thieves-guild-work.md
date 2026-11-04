---
title: Thieves Guild work
summary: Read theft and smuggling offers, protect the assigned goods, and recognise when a quiet job changes direction.
stage: reference
order: 61
gate: none
tags: [quest, pattern, thieves-guild, theft, smuggling]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Record the object, contacts, destination and deadline before accepting.
> - Keep assigned goods for delivery; they are not your payment.
> - Read demands and new directions before continuing a fight.
> - Guild employment does not protect you from the watch.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver/guild | Thieves Guild work in the General Populace pool; giver recorded as thief |
| Gate | Member jobs have rank requirements; initiation is separate |
| Where | Generated houses, sites and contacts; some destinations appear after starting |
| Time | Offer-specific deadlines; online these charge played time |
| Reward shape | Scripted gold or items; eligible success can add gear and Renown |
| Instance | Choose **Your instance** when offered; private quest dungeons are full-size and admit your party |


## How to read the offer

Record region, building, object, recipient, return contact and deadline. Check **Quests** and **Time remains**. Smuggling may exchange cargo for something you must carry back. Names, defenders and payment vary.

Membership starts through an invitation; see [thievery](../../town/thievery.md) and [NPC guilds](../../town/npc-guilds.md). These jobs differ from the [questline ladder](../questline-ladder.md).

## The shapes you will see

1. **House theft.** **Valuable Artwork** (`O0B10Y05`) and **The Jewel Heist** (`O0B10Y06`) place an object in a generated house. Find that object and return it; defeating defenders alone does not finish the job.
2. **Exchange and return.** **A Hot Stone** (`O0B00Y00`) and **Arms Supply** (`O0B00Y01`) exchange supplied goods for gems. Visit the assigned contact, then carry the proceeds to the giver.
3. **Changing delivery.** **Drugs Delivery** (`O0B00Y12`) introduces a note and alternate contact. Read the note and current entry before choosing your recipient.
4. **Compromised heist.** **Antique Ivory** (`O0B00Y11`) can lead from theft to a safehouse after trouble. Follow the changed destination. Injury-triggered demands make persuasion and quiet violence choices to read, rather than a reason to attack everyone.


## Quick path

1. Check membership, rank and the offered action.
2. Record destinations, contacts, goods and deadline; prepare access tools.
3. Collect supplied goods or visit the assigned property.
4. Choose the quest instance when offered and find the specific object.
5. Read new notes, demands and journal entries before acting.
6. Complete every exchange and reach the final recipient with the assigned goods.


## What gets players stuck

Use this fix order:

1. Confirm the latest destination, named building and instance. Generated sites have no universal map pin; ask for [directions](../../town/talking-to-people.md).
2. Search rooms, secret doors, containers and dressing. Separate the quest object from sale loot; do not keep it as a trophy.
3. Check combat feedback before further attacks. Some demands trigger on injury; a fast kill is not proof that every stage ran.
4. Recheck the deadline and changed contacts. If necessary, leave and re-enter through the same instance option.
5. Treat guards and witnesses as a legal problem: [the law](../../town/the-law.md) still applies. Report a blocked quest with its ID, site and last entry; online reload and sold-item recovery remain unverified.


## Rewards and standing

See [quest rewards](../quest-rewards/) for variable payment and eligible gear. Ordinary online failure has no faction penalty; scripted choices and crimes remain separate. **Arms Supply** penalises surrendering or retaining goods.

## Sources

- `handbook/quests/quests.json`: the six example IDs above, requirements, targets, clocks and rewards.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task structure only.
- `upstream/snapshot-e4f093166/src/systems/quest/clock.js`, `quest.js`, `actions.js`: clocks, ordinary failure and scripted reputation.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; related handbook pages linked above.
