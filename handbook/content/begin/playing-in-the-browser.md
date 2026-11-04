---
title: Playing in the browser
summary: Open the web client, provide your own Daggerfall data when prompted, and get past the common startup problems.
stage: begin
order: 20
gate: none
tags: [browser, setup, graphics, install]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Open DFO Online at [daggerfalljs.dev](https://daggerfalljs.dev/) and choose **Play** to reach `/play/`.
> - Have your own Daggerfall copy ready. The browser game does not ship the original ARENA2 data.
> - On your first visit the game asks you to pick your ARENA2 folder once; on a phone you can hand over a zip instead.
> - The client uses WebGL2; a current Chrome, Edge, Firefox or Safari works.

## Get the game data

DFO needs the original Daggerfall data files — the project calls the folder **ARENA2**. They are not bundled with DFO and
stay on your device. The official site recommends any of these free sources:

- [Steam](https://store.steampowered.com/app/1812390/)
- [GOG](https://www.gog.com/game/the_elder_scrolls_chapter_ii_daggerfall)
- [DaggerfallGameFiles.zip](https://forums.dfworkshop.net/viewtopic.php?t=2360)

On a Steam installation the folder is usually `DF/DAGGER/ARENA2`. The guide's
[first-launch page](your-first-launch.md) covers what happens after you press Play.

## Open the client

The project's landing page is separate from the game. Choose its **Play** link to open `/play/`. DFO draws its
presentation with WebGL2 in the browser.

## Provide the original data

When the play page asks for the folder, select your ARENA2 folder (or drop the zip on the page on a phone). The game
remembers that choice; you are not asked again on that browser.

> [!note] Your files stay yours
> The desktop build also reads ARENA2 from your own Daggerfall folder. DFO's repository does not contain those game
> data files.

## If the screen does not appear

Work through these in order:

1. **Reload the page.** A first WebGL2 start can fail while the browser builds its graphics context.
2. **Try a current browser.** The official site lists Chrome, Edge, Firefox and Safari; an old browser or a disabled
   WebGL2 may refuse the client.
3. **Check the data folder.** If you picked the wrong folder, or moved Daggerfall after picking it, the client cannot
   read ARENA2. Pick the folder again from the installation's `ARENA2` directory.
4. **Report it.** If it still fails, say what you did on the project's
   [issue tracker](https://github.com/Lattymoy/daggerfall-js-source/issues) or the
   [DFO Discord](https://discord.gg/jM2JdwSM8w).

The source does not specify a supported-browser list or a minimum graphics-card requirement; the official site is the
authority for what the project currently supports.

## Common mistakes

- **Picking the Daggerfall install folder instead of ARENA2.** The client reads the data folder, not the installer.
- **Moving or reinstalling Daggerfall after the first pick.** The remembered path stops working; pick the folder again.
- **Using an old browser and blaming the game.** WebGL2 support is the usual cause of a blank start.
- **Expecting the browser to store a backup.** Browser storage belongs to that browser; the desktop app keeps real files.

## Next

- [Your first launch](your-first-launch.md)
- [Your account](your-account.md)
- [Interface skins](interface-and-skins.md)

- [Your first 90 minutes](first-90-minutes.md)
- [Offline and online](offline-and-online.md)
## Sources

- `https://daggerfalljs.dev/`: the free Daggerfall sources, the Play page, the ARENA2 folder pick, browser support, the
  issue tracker and the Discord
- `README.md`: landing page, `play/index.html`, `/play/`, WebGL2, original ARENA2 requirement, and desktop data access
- Research note: `handbook/research/B1.md`
