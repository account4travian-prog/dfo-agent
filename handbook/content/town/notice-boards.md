---
title: Notice boards
summary: Read town notices and bounty listings, or use the Work board to find and post player commissions.
stage: town
order: 80
gate: none
tags: [notice board, bounties, work, commissions]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - The Notice board shows town news, a pointer to the separate Bounty Board where one is available, server notices and player notes.
> - The Work tab shows Court and regional guild writs, plus crafting commissions; its forms are separate from reading notes.
> - Player notes can stay up for one, three or seven days, and one account may keep three live notes across boards.
> - Read the terms on a listing before accepting work; the board is a meeting point, not a guarantee of a particular reward.

## Read the board

Use the physical notice board to browse town news, server notices and player notes. Where the town has a separate Bounty Board, its notice points you there to read the hunts ([how money is earned](../feet/making-money.md)). A town's notice boards share the same set of player notes, so a note posted at one board is visible from its other notice boards. The window marks items that are new to you.

Player notes have a subject and body, a chosen lifespan of one, three or seven days, and may carry one response button. The available buttons can ask to join the author's party or guild ([meeting other players](meeting-players.md)), challenge them to [a duel](../late/pvp-and-duels.md), or open a commission form. The request still goes through the normal party, guild, duel or crafting rules.

## Work and commissions

Open the Work tab to browse Court and regional guild writs, as well as [crafting](../feet/crafting.md) commissions. A commission names a crafter, a piece, its minimum quality and the pay. You can fill or decline commissions addressed to you, and post one yourself. A player note's **Commission a piece** button opens the form with that note's author named. Review the terms before you post or fill a commission.

You can keep up to three of your own notes live across all boards. Choose a duration that fits the message, and take down an old note when it no longer applies. A note can also be reported; the system hides a note from everyone after enough eligible reports while it waits for moderation.

> [!tip] Finding work
> The Bounty Board and the Work tab serve different purposes. Read the listing type and its terms before you set out or deliver an item.

## Common mistakes

- **Posting the same announcement at several boards.** One account may keep only three live notes across all boards, so duplicate posts use the slots your other notices need. Cost: a notice expires before anyone acts on it.
- **Accepting a Work listing without reading its terms.** Court and guild writs, bounties and crafting commissions take different deliveries and pay from different boards; a trip begun for the wrong listing costs the journey.
- **Letting a note reach the report threshold.** A reported note is hidden from everyone while it waits for moderation ([meeting other players](meeting-players.md)); a recruitment or commission note can vanish before it is answered. Cost: the deal falls through.

## Next

- [Courier letters](courier-letters.md)
- [Talking to people](talking-to-people.md)

## Sources

- `src/net/boardLaw.js`: `NOTES_LIVE_MAX`, `NOTE_DAYS`, `BOARD_NOTES_SHOWN`, `BOARD_NOTICES_SHOWN`, `NOTE_BUTTONS`
- `src/net/noticeBook.js`: town board reading, unseen notes, retry behavior
- `src/systems/bounty/bountyBoard.js`: `questBoardIndices`, `noticeBoardIndex`, bounty-board law
- `src/ui/noticeWindow.js`, `src/ui/workTab.js`: Notices and Work tabs
- `src/net/writLaw.js`, `src/net/writBook.js`: guild writ and commission rules
- Research: `handbook/research/T1.md` (town services; board details verified directly in source)
