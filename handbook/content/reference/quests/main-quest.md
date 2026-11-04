---
title: The main story
summary: How the main quest begins, the chapter records the journal tracks, and how to recover when a chapter goes quiet.
stage: reference
order: 43
gate: none
tags: [quest, main-quest, lysandus, totem, reference]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - The main story starts with a letter from **Lady Brisienna** after the opening dungeon.
> - It is a set of chapter records, not one linear quest; the journal names the current chapter and the next lead.
> - Several chapters wait on an earlier one, a meeting, or a ruler's summons, so check the journal before travelling.
> - The story is optional in DFO; it is the long answer to what happened to Lysandus and the Emperor's letter.
> - The pinned pack also contains background controllers; they are not chapters you play.

## Before you start

The main story begins with [Lady Brisienna](lady-brisienna.md), the Emperor's agent, after you leave Privateer's
Hold. Everything after that is a chain of chapter records: a royal court asks for something, a place must be searched,
or a message must be delivered. The journal is the route; this page is the map of the chapter names.

> [!warning] The main story has permanent refusals
> Refusing a ruler's request can close the branch that request opens. Read the offer before you decline. This guide does
> not promise a second chance in DFO.

## The chapters

The chapter order below is the order of the records in the pinned pack. It is **not** a promise that every character
sees every chapter in exactly this order: the classic main story branches, and the journal is the authority for your
character.

| # | Chapter | What it asks | Guide |
|---:|---|---|---|
| 1 | Lady Brisienna | Meet the Emperor's agent at the tavern named in her letter | [Full guide](lady-brisienna.md) |
| 2 | Missing Prince | Find proof of what became of Prince Lhotun's brother | [Quest entry](../../quests/#S0000001) |
| 3 | Prince Helseth's Blackmail | Carry Prince Helseth's letter and bring back the reply | [Quest entry](../../quests/#S0000002) |
| 4 | Freeing Medora | Find the horn of the Great Unicorn and bring it to Medora | [Quest entry](../../quests/#S0000003) |
| 5 | Morgiah's Wedding | Carry Princess Morgiah's letter to Scourg Barrow and return with the answer | [Quest entry](../../quests/#S0000004) |
| 6 | Concern for Nulfaga | Find Nulfaga in Shedungent and speak with her | [Quest entry](../../quests/#S0000005) |
| 7 | Elysana's Robe | Bring Princess Elysana's robe to Lord Castellian | [Quest entry](../../quests/#S0000006) |
| 8 | The Werebeast | End the werewolf of Tristore Laboratory | [Quest entry](../../quests/#S0000007) |
| 9 | Who Gets the Totem | Meet Lady Brisienna and decide where the Totem goes | [Quest entry](../../quests/#S0000008) |
| 10 | Elysana's Betrayal | Answer Princess Elysana's summons at Castle Wayrest | [Quest entry](../../quests/#S0000009) |
| 11 | Stronghold of the Blades | Meet the Underking's agent in Sentinel | [Quest entry](../../quests/#S0000010) |
| 12 | Barenziah's Book | Answer Queen Barenziah's letter, then recover the lost chapter | [Quest entry](../../quests/#S0000011) |
| 13 | The Emperor's Courier | Find the Emperor's messenger and learn what happened to the letter | [Quest entry](../../quests/#S0000012) |
| 14 | Mynisera's Letters | Answer Queen Aubk-i's letter at Castle Daggerfall | [Quest entry](../../quests/#S0000013) |
| 15 | Lysandus' Revenge | Bring down Lord Woodborne, by death or disgrace | [Quest entry](../../quests/#S0000015) |
| 16 | Journey to Aetherius | Find the Mantella in the Mantellan Crux and touch it | [Quest entry](../../quests/#S0000016) |
| 17 | Wayrest Painting | Answer Queen Akorithi's summons at Castle Sentinel | [Quest entry](../../quests/#S0000017) |
| 18 | Dust of Restful Death | Ask Gortwog where the Dust can be found | [Quest entry](../../quests/#S0000018) |
| 19 | Orcish Treaty | Find who holds the Emperor's letter and return to Mynisera | [Quest entry](../../quests/#S0000020) |
| 20 | Lich's Soul | Answer the King of Worms' summons at Scourg Barrow | [Quest entry](../../quests/#S0000021) |
| 21 | Lysandus' Revelation | Return to Medora in Direnni Tower when the month has passed | [Quest entry](../../quests/#S0000022) |

The pack also has optional side chapters (Lord K'avar and the Former Student parts), background records that run
Daggerfall's curse and the Totem claimants' moves, and the Mantella/backbone controllers. They are not separate chapter
pages here; the browser lists them under **Main quest**.

## How to read the journal

- The **Quests** tab lists the active chapter, its latest entry and its time remaining. The newest entry is the current
  instruction; older entries are context.
- The journal names the place, person or ruler to visit. A generated site is *your* site; a guide cannot give a fixed
  map pin.
- If an entry says to wait, the chapter is not broken. Several chapters wait for a month, a summons or another
  chapter's outcome.
- If you have more than one active main-story entry, finish the one the journal calls current before chasing the other.

## If it goes quiet

1. Re-read the newest journal entry. It names the next person or place.
2. Check the Quests tab. A chapter waiting on a ruler's summons or a month is waiting, not stalled.
3. Visit the court or tavern the entry names. Main-story meetings happen at fixed castles and generated taverns.
4. If a ruler refused you, the branch may be closed. This guide does not promise another opening; reload a save if you
   have one, or continue with the chapters that remain.
5. If the journal and the world disagree, note the chapter, the source file and what you saw, and report it through
   [How this guide is checked](../how-this-guide-is-checked.md).

## Rewards and what it unlocks

The main story is not a gold-per-chapter ladder. It pays story access, titles and the ending, with the ordinary quest
rewards on the side. For the payment rules that do apply, see [Quest rewards](../quest-rewards.md). The story is
optional in DFO; [the late game](../../late/endgame.md) explains what else competes for that time.

## Next

- [Browse the complete quest guide](../../quests/)
- [The questline ladder](../questline-ladder.md) — the online lines that run alongside the main story.
- [Lady Brisienna](lady-brisienna.md) — the first chapter in full.

## Sources

- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/`: `_BRISIEN.txt` and `S0000*.txt`; chapter names, starting
  conditions, objectives/tasks and outcomes.
- `upstream/snapshot-e4f093166/src/systems/questlines/sheets/mainQuest.json`: objectives and outcomes for the chapter
  records, including the optional K'avar/Former Student sheets and the background controllers.
- `handbook/content/reference/questline-ladder.md`, `quest-rewards.md`, `lady-brisienna.md`: DFO-facing rules and the
  first chapter's guide.
- [UESP: Daggerfall Main Quest](https://en.uesp.net/wiki/Daggerfall:Main_Quest) for classic context; DFO source wins
  where the two differ.
