---
title: Moving through the Hold
summary: Walk, turn, look, jump, crouch, and run while watching the space around you.
stage: hold
order: 20
gate: none
tags: [movement, controls, exploration]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Use **W/A/S/D** to move and the **left/right arrows** to turn by default.
> - **Space** jumps; **C** crouches and sneaks; **Left Shift** runs.
> - Climbing and swimming spend fatigue. Online, sheathe a non-melee weapon before climbing.
> - **Home** centres your view if you have looked away from level.
> - Rebind any control in **Settings** → **Controls** → **Key bindings**.

## Move and look

The default keyboard controls let you move in four directions with W/A/S/D and turn with the left and right arrow keys.
Use **Insert** and **Delete** to look up and down. Press **Home** to centre the view.

## Change your pace

Press **Left Shift** while moving to run. Press **C** to crouch or sneak. **Space** jumps. Auto-run is bound to the
middle mouse button by default.

These are defaults, not requirements. Change them under **Settings** → **Controls** → **Key bindings**. The source has
separate primary and secondary bindings, so you can set a gamepad action alongside a keyboard or mouse one.

## Jump, climb and swim

Jump with **Space**. Climbing and swimming use fatigue, so leave some in reserve if you expect to climb or cross water.
Swimming fatigue depends on the Swimming roll.

Online, the Roleplay & Realism rule prevents you from climbing with a drawn weapon other than bare hands. Sheathe a
bow or other weapon before you mantle or clamber over an obstacle. A vault is a leap, so the rule does not block it.

## Explore carefully

Move through doorways and around obstacles with the view centred on where you intend to go. The Hold is a dungeon, so
keep enough room to turn toward sounds or threats before pressing the weapon swing control. For combat movement, see
[Fighting](fighting.md).

## Next

- [Fighting](fighting.md)
- [Loot and inventory](loot-and-inventory.md)

## Sources

- `src/systems/inputActions.js`: `DEFAULT_BINDINGS`, `DEFAULT_SECONDARY_BINDINGS`
- `src/systems/statMods.js`: `FATIGUE_LOSS`, `FATIGUE_DRAIN_SCALE`
- `src/systems/roleplayRealism/rrRealism.js`: `NO_CLIMB_HOLDING_WEAPON`, `rrParkourRefusal`, `rrClimbingChance`
- `src/systems/online/onlineLane.js`: `roleplay-realism` in `ONLINE_WHOLE_MODS`
- `src/ui/settings/settingsMap.js`: `CATEGORIES`
- Research note: `handbook/research/B1.md`, `handbook/research/H1.md`
