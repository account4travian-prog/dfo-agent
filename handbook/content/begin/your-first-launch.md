---
title: Your first launch
summary: What happens from the play page to your first character, and how to get back in later.
stage: begin
order: 25
gate: none
status: draft
tags: [first launch, start, character slot, returning, saving]
verified: e4f093166
---

> [!tip] At a glance
> - Choose **Play** on the official site.
> - Pick your **ARENA2** folder once to supply the game files.
> - An account is optional offline; you need one to play online.
> - Your first character wakes in **Privateer's Hold**.
> - Closing the tab does not end your online character. Browser-storage saves belong to that browser.

## Press Play

Open the [official site](https://daggerfalljs.dev/) and choose **Play**. This opens the [play page](https://daggerfalljs.dev/play/) at `/play/`.

You need your own copy of The Elder Scrolls II: Daggerfall, which has been free since 2009. Your game files stay on your device.

On your first visit, pick the ARENA2 folder or drop it onto the page. For a Steam installation, look under `DF/DAGGER/ARENA2`. Pick that folder itself, rather than its parent. On a phone, supply the zip instead. The page remembers your selection, so you do not repeat this on each launch. See [Playing in the browser](playing-in-the-browser.md) for setup help.

## Your first character

Enter character creation and follow the prompts. The [creation screens guide](../creation/creation-screens.md) explains the choices as you meet them.

Online, you are asked which leveling system to use. Only classic Daggerfall leveling is available online: the Oblivion-style option is visible but unavailable. Seeing that option does not mean you can select it for an online character.

After the character summary, you wake in Privateer's Hold. Follow [Your first minutes](../hold/first-minutes.md) when you arrive. On a phone, touch controls appear automatically. On a computer, use WASD and the mouse, F6 for your pack, and Esc for the other menus.

## Coming back

Open the site and choose **Play** again. Your online character is tied to your account; see [Your account](your-account.md) for account guidance. Closing the tab does not delete that character.

Browser saves live in browser storage. Clearing the site's data removes those local saves, and another browser does not share them. The desktop app keeps real save files that you can back up. An online character's progress is held by the account service, so it follows the account rather than one browser; that is why registering before you invest time matters (see [Your account](your-account.md)).

Online, the game saves as you go and on exit. Loading a save during play is disabled, so do not plan around saving before a decision and loading to undo it. Offline single-player allows saving and loading; F9 quick saves and F11 quick loads there.

## If nothing appears

Reload the page first. Use a current version of Chrome, Edge, Firefox or Safari with WebGL2 support. If your game files have moved, pick the ARENA2 folder again.

If the problem remains, use the [issue tracker](https://github.com/Lattymoy/daggerfall-js-source/issues) or ask in the [official Discord](https://discord.gg/jM2JdwSM8w).

## Common mistakes

- **Picking the wrong folder.** Supply ARENA2 itself, not the Steam library or the enclosing DAGGER folder.
- **Clearing browser data.** This removes local saves. Keep that consequence in mind before clearing site storage.
- **Expecting to load mid-session online.** The online game blocks loading during play; the offline save/load loop does not apply.

## Next

- [Playing in the browser](playing-in-the-browser.md)
- [Your account](your-account.md)

- [Your first 90 minutes](first-90-minutes.md)
## Sources

- [Official site](https://daggerfalljs.dev/) and its [play page](https://daggerfalljs.dev/play/): Play, the ARENA2 folder pick, accounts, controls, browser support, storage and the issue tracker
- `upstream/snapshot-e4f093166/index.html`, `play/index.html`: the landing and play pages the site is built from
- `src/systems/chargenSession.js`: `withLevelingChoice` and the online classic-leveling rule (LEVEL-ONLINE-2)
- `src/systems/save/saveSlots.js`: save slots, `QuickSave`, and the desktop shell's real save files (`appStorage`)
- `src/scenes/dungeonContext.js`: `ONLINE-LOAD1` — "Loading is disabled during online play"
- The source does not establish the exact returning-character screen or the exit-save completion timing; this page does not assume either.
