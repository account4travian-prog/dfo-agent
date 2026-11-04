---
title: Lady Brisienna
summary: The Emperor's first letter, the tavern meeting that starts the main story, and what happens if you never arrive.
stage: reference
order: 44
gate: quest "Privateer's Hold"
tags: [quest, main-quest, letter, tavern, brisienna]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - The main story begins with a letter from **Lady Brisienna**, the Emperor's agent in Daggerfall.
> - The letter names a tavern; go there and speak to her. The meeting is the quest.
> - The source starts a 14-day failure clock and an earlier invitation window, so read the letter's own date.
> - If you miss her, she reports you as a traitor and this main-story branch fails. There is no reward beyond the story.

## The quest facts

| Field | Value |
|---|---|
| Type | Main story, first chapter |
| Given by | Lady Brisienna, the Emperor's agent; she is in the tavern the letter names |
| Opens when | After you leave Privateer's Hold; the quest arrives by letter |
| How it reaches you | A letter, with the meeting place named in it |
| Time limit | The source starts a 14-day failure clock and a 7–14 day invitation clock; the letter's date is the one to follow |
| Can it fail? | Yes. Missing the meeting fails the approach to the main story and she reports you |
| Rewards | No gold or gear; it opens the next main-story chapter |
| Permanent choices | Missing the meeting is the failure; there is no alternate route from this chapter |
| Instance / party | A town tavern; no private dungeon |

## How you get it

The quest starts by letter after the opening dungeon. Read the letter before you sell anything or leave town: it names
the tavern where Lady Brisienna waits, and the date matters. The meeting is in a generated tavern, so the name in your
letter is the only reliable location.

> [!online] Online
> The letter is a quest letter, not a courier questline invitation. It can arrive in the same session as the opening;
> the journal is the authority on the place and date.

## What you do

1. Finish or leave Privateer's Hold.
2. Read the letter from Lady Brisienna and note the tavern and the date.
3. Travel to that tavern. Taverns keep normal opening hours; if the door is locked at night, wait or come back.
4. Find Lady Brisienna inside and speak to her. The journal updates when she has told you where to start.
5. Follow the next main-story lead: the royal families of Daggerfall, Wayrest and Sentinel.

## Choices that matter

There is no branch to choose here; the choice is whether you attend.

| Choice | Immediate effect | Later effect | Reversible? |
|---|---|---|---|
| Meet Lady Brisienna | The journal advances to the next chapter | The main story continues | No — it is the chapter's success |
| Miss the meeting | She reports you to the Emperor as a traitor | This approach to the main story fails | No |

## If it goes wrong

- **No letter yet.** The quest starts by letter after the opening. Check the Quests tab and the journal; if it has not
  appeared, keep playing the opening and check again in town.
- **Can't find the tavern.** Read the letter's place line again. It is a generated tavern, so a guide cannot give a fixed
  address. Ask directions in town or use the town map.
- **The door is locked.** Taverns have hours; wait until they open.
- **She is not there.** Check the date in the letter. The failure clock is real; reload a save only if you have one, and
  do not assume the quest can be restarted.
- **The journal says you failed.** This chapter's approach is over. The main story has alternate starts in classic
  Daggerfall, but this guide does not promise one in DFO; report what you saw if the journal contradicts the letter.

## Rewards and what it unlocks

There is no purse, gear choice or reputation payment in the source. The value is the next main-story chapter: the
journal sends you to the royal families of Daggerfall, Wayrest and Sentinel.

## Known notes

- The source's own clocks are 7–14 days for the invitation and 14 days for the failure. The letter is generated with a
  date; the journal's entry is more specific than this page.
- The quest file uses three letter items internally. Do not treat them as loot; they are the letter and its reminders.

## Next

- [Browse the complete quest guide](../../quests/) — the main-story list starts here.
- [Missing Prince](../../quests/#S0000001) — the next main-story step.
- [How this guide is checked](../how-this-guide-is-checked.md) — what Draft means and how to report a mistake.

## Sources

- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/_BRISIEN.txt`: `StartsBy: letter`, the `Clock _invitepc_`
  and `Clock _pcfailed_` lines, the `_meetladyb_` and `_pcfailed_` tasks, and the three letter items.
- `upstream/snapshot-e4f093166/src/systems/questlines/sheets/mainQuest.json`: the `_BRISIEN` objectives and outcomes
  (`met`, `snubbed`, `failed`).
- [UESP: Instructions from the Empire](https://en.uesp.net/wiki/Daggerfall:Instructions_from_the_Empire) for the
  classic quest's context; DFO source wins for the rules above.
