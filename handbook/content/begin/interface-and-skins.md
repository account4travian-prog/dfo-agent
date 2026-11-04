---
title: Interface and skins
summary: Choose a Classic or Enhanced Plus interface, then find the menus and quickbar controls you will use most.
stage: begin
order: 40
gate: none
tags: [interface, skins, menus, hotbar]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Choose the interface under **Overhauls** → **UI Overhaul**.
> - The two base skins are **Classic** and **Enhanced Plus**; **GrimoireUI** and **DFO Grimoire** are additional looks.
> - In the enhanced interface, choose a hotbar or diamond quickbar layout.
> - The pause menu's **Settings** opens the settings screen; controls are a tab inside it.

## Choose an interface

Open **Overhauls**, then its **UI Overhaul** panel. Choose **Classic** for the original interface or **Enhanced Plus**
for DFO's enhanced interface. The panel also offers **GrimoireUI**, which dresses Classic, and **DFO Grimoire**, which
dresses Enhanced Plus. Changing the interface reloads the game.

Your interface choice stays yours online. The online lane does not force a skin, and the chat, friends, party and
trading panels are available with either interface.

## Find the menus

In the enhanced interface, **Settings** is available from the main menu and during play. **Controls** is a tab inside
**Settings**, with **Key bindings** in that tab; it is not a separate menu.

## Quickbar layouts

The enhanced interface lets you choose a ten-slot **hotbar** or a **diamond** quickbar. Classic uses the diamond
quickbar. This layout is a personal preference online too.

## Interface skin and character appearance

The interface skin changes menus and HUD presentation. It does not change your character's appearance. Character
appearance is chosen separately; see [Appearance](../creation/appearance.md) when you reach character creation.

## Next

- [Controls and settings](controls-and-settings.md)

## Sources

- `src/systems/uiSkin.js`: `SKINS`, `DEFAULT_SKIN`, `SKIN_NAMES`, `HOTBAR_STYLES`
- `src/systems/overhauls.js`: `OVERHAUL_PANELS` and UI option rows
- `src/ui/enhanced/enhancedMenu.js`: enhanced main menu and settings pane
- `src/ui/pauseDoor.js`: pause menu access to the enhanced menu
- `src/ui/settings/settingsMap.js`: `CATEGORIES`, Controls and Key bindings
- `src/systems/features.js`: quickbar style choices
- `src/systems/online/onlineLane.js`: `ONLINE_FORCED_PREFS` (skin is not forced)
- Research note: `handbook/research/B1.md`
