---
title: Your first 90 minutes
summary: A suggested first session from the Play page to your first town quest and questline letter.
stage: begin
order: 27
gate: none
status: draft
tags: [first session, onboarding, tutorial, first town, starter]
verified: e4f093166
---

> [!tip] At a glance
> - This page is a route, not a rulebook: each step links to the page that explains the system.
> - Expect the first half hour to be setup and character creation, the middle to be Privateer's Hold, and the last part to be your first town.
> - Decide on an account before you invest time. A guest can play, but several systems stay closed until you register.
> - Questline letters arrive only in a town, outdoors, by day, about one new line per hour of your character's clock.

## Before the clock starts

Two decisions shape the session, and both are easier before you are in the game.

1. **Browser or desktop app.** The browser needs a current Chrome, Edge, Firefox or Safari with WebGL2. The desktop app keeps real save files, works offline and reads your Daggerfall install from disk; it is not code-signed yet, so the first launch warns. Both are opened through [daggerfalljs.dev](https://daggerfalljs.dev/), and the desktop downloads are listed there. On a phone, the browser client takes a zip of the game data and adds touch controls.
2. **Guest or registered account.** A guest account can connect, fight, chat and quest. It cannot use professions or Stores, the market, player guilds or Marks, and questline deeds are not recorded for it. Registration adds a username and password to the same account and keeps what you have already done. If you plan to play past an evening, decide to register now; recovery codes are shown once. See [Your account](your-account.md).

You also need your own copy of Daggerfall. The client asks for the **ARENA2** folder once (or the zip on a phone). On Steam it is usually under `DF/DAGGER/ARENA2`. Picking the enclosing folder instead is the first common failure; see [Playing in the browser](playing-in-the-browser.md) and [Your first launch](your-first-launch.md).

## Suggested pace

The times below are a pace, not a requirement. A first session that reaches town with a banked purse and one quest started is a success.

| Minutes | What you are doing |
|---|---|
| 0–10 | Choose the client, supply ARENA2, decide guest or registered |
| 10–25 | Create the character |
| 25–55 | Learn the controls in Privateer's Hold and leave it |
| 55–70 | Walk the road to Gothway Garden |
| 70–90 | Bank, shop, find work, join a guild, read the questline list |

## 10–25: create the character

Character creation is a sequence of screens, and its choices are explained in [The creation screens](../creation/creation-screens.md). The short version:

- **Race and class.** Races are in [Choosing a race](../creation/races.md); the eighteen standard classes are in [Classes](../creation/classes.md); mixing your own is [Custom classes](../creation/custom-classes.md).
- **Attributes and skills.** Your class fixes the three skill groups that decide how you level. [Attributes and skills](../creation/attributes-and-skills.md) explains what each attribute does.
- **The rest of the wizard.** Reflexes, background questions and starting gear follow, then appearance and the character summary.
- **Online leveling.** Online characters use classic Daggerfall leveling only; the Oblivion-style option is visible but unavailable (`src/systems/chargenSession.js`: `withLevelingChoice`, LEVEL-ONLINE-2).

A first character does not need to be optimal. It needs a weapon skill you will use, enough Endurance to survive, and a class whose restrictions you can live with. The page [Choices that are hard to undo](../creation/hard-to-undo.md) is worth two minutes.

## 25–55: Privateer's Hold

You wake in **Privateer's Hold**. The welcome tutorial has five short subjects: Welcome, Moving Around, Using Things, The Bars and the Compass, and The Menu and Saving (`src/systems/tutorialCatalogue.js`: `TUTORIAL_TOUR`). Read them; they are the game's own explanation of controls and interface.

Your task is to look through your pack, find the dungeon's exit door, and head for town. The source does not define the Hold's internal layout, so use the [compass and map](../hold/moving.md) rather than expecting a fixed route. Useful pages while you are inside:

- [Your first minutes](../hold/first-minutes.md): the welcome guidance, the journal (**L**) and notebook (**N**).
- [Moving through the Hold](../hold/moving.md) and [Fighting](../hold/fighting.md): movement, attack directions and the first fights.
- [Loot and inventory](../hold/loot-and-inventory.md): containers, weight and identifying.
- [Health, fatigue and rest](../hold/health-fatigue-and-rest.md): why you should not fight on an empty fatigue bar.
- [Dying online](../hold/dying-online.md): where you return and what a death costs.

Leave through the dungeon's exit door. Outside, the Julian LeFay monument stands beside the landing; the road ahead leads to **Gothway Garden**, the first town (`src/scenes/worldModes.js`: `tryExitDungeon`, `returnLanding`; `src/world/lefayMonument.js`).

> [!warning] The public Hold is one way online
> Once you leave the public online room, it refuses re-entry. Finish anything you want to do inside before you take the exit. Your own private instance of the Hold is a separate copy you can re-enter later (`src/scenes/instanceDoor.js`, `src/net/instanceRoom.js`: HOLD-ONCE).

## 55–70: the road to town

Follow the road to Gothway Garden. The short walk is your first look at the Overworld: weather, travel pace and the difference between roads and wilds. If something chases you, do not stop to fight it in the open; a town gate and its watch are ahead.

When you arrive, the first thing to do is not to shop. It is to read the town: [Reading a town](../town/reading-a-town.md) explains the map, building kinds and opening hours.

## 70–90: your first town

1. **Bank what you carry.** Death online costs part of the gold you carry; banked gold is safe ([Banks](../town/banks.md); `docs/23-playing-online.md`, "A plan", step 1: a tenth of the carried gold). The Bank of the Empire account is one account across the regions.
2. **Sell the loot you do not need and buy the one thing you lack.** [Shops and prices](../town/shops-and-prices.md) covers haggling and town prosperity. Food, a cure or a better weapon are reasonable first purchases.
3. **Check the notice board.** The board's bounty and **Work** tabs give a first paid task without a guild ([Notice boards](../town/notice-boards.md)).
4. **Join a guild.** The Fighters Guild is the simplest first guild for a new fighter; it trains, repairs and sends you to a private dungeon, and its quests give a gear choice. See [The NPC guilds](../town/npc-guilds.md) and [Mages Guild services](../town/mages-guild-services.md) if you cast.
5. **Look at the questline list.** Pause-window **Quests** tab lists every line with what it waits on. The first introductions open at level 2 (**The Court Crafter**) and level 3 (**Written in the Stars**) (`src/systems/questlines/qlLines.js`: `introCrafts`, `introFirmament`).
6. **Wait for the courier if you must.** Letters arrive only in a town, outdoors, by day, at most one new line per hour of your character's clock (about seven real minutes), and never while another first letter is in flight (`docs/23-playing-online.md`: "Letters arrive slowly"; `docs/32-questions.md`: "Why haven't my questline letters arrived?"). If a step needs a building your town lacks, it waits and retries after a day of character time.

That is enough for one session. End in town, banked and rested, with one quest started and the next letter understood.

## What success looks like

- You know which mode you are in and which account you are on.
- You have left Privateer's Hold and reached Gothway Garden.
- Your gold is banked, not carried.
- You have one guild or board task and have read the Questlines list.
- You know where your save lives and how to return.

## Common mistakes

- **Spending the first session in character creation.** A workable character beats a perfect one; creation pages are here for later characters.
- **Carrying all your gold.** A death online costs part of the carried purse; bank it first.
- **Waiting in a dungeon for a questline letter.** Letters need a town, the outdoors and daylight.
- **Buying a profession's first rank before registering.** Professions and Stores are closed to guests.
- **Treating the public Hold as a place to come back to.** Online, it is one way.

## Next

- [Your first minutes in Privateer's Hold](../hold/first-minutes.md)
- [Reading a town](../town/reading-a-town.md)

## Sources

- `https://daggerfalljs.dev/` and `index.html`: Play page, ARENA2 pick, browser support, desktop app, saves, account-optional wording
- `src/systems/tutorialCatalogue.js`: `TUTORIAL_TOUR`, the five tutorial subjects
- `src/systems/chargenSession.js`: `withLevelingChoice`, online classic-leveling rule
- `src/systems/questlines/qlLines.js`: `introCrafts` (level 2, online, account), `introFirmament` (level 3, online)
- `src/scenes/worldModes.js`: `tryExitDungeon`, `returnLanding`; `src/systems/startDungeon.js`: `HOLD_ONCE_TEXT`
- `src/world/lefayMonument.js`: `LEFAY1`, `LEFAY_TOWN`; `src/systems/gothwayBoards.js`: `GOTHWAY-BOARDS`
- `src/systems/settings/settingsDefaults.js`: `StartCellX`, `StartCellY`, `StartInDungeon`
- `docs/23-playing-online.md`: questline letters, death gold cost, first-week plan; `docs/32-questions.md`: the letter question
- The source does not state a fixed session length or a required route through Privateer's Hold.
