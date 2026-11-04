---
title: Controls and settings
summary: Learn the default movement and combat bindings, choose a swing mode, and rebind actions from Settings.
stage: begin
order: 50
gate: none
tags: [controls, settings, keyboard, mouse, gamepad]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Move with **W/A/S/D**, jump with **Space**, and run with **Left Shift** by default.
> - **Right click** swings a weapon; **Z** readies or sheathes it; **H** switches hands.
> - DFO defaults to **Click or Hold** swings (random direction). Change the swing mode in **Settings** → **Controls**.
> - Rebind actions under **Settings** → **Controls** → **Key bindings**.

## Default movement controls

| Action | Default |
|---|---|
| Move | W/A/S/D |
| Turn | Left and right arrow keys |
| Look up/down | Insert/Delete |
| Centre view | Home |
| Jump | Space |
| Crouch/sneak | C |
| Run | Left Shift |
| Auto-run | Middle mouse button |

These are the shipped keyboard and mouse bindings; you can rebind them. The game also has a secondary binding set for
gamepads.

## Combat controls

| Action | Default |
|---|---|
| Ready or sheath weapon | Z |
| Swing weapon | Right mouse button |
| Switch hands | H |
| Weapon technique | Mouse3, the mouse's back side button |

On a touch screen, the technique action is a hold button labelled **Tech**. Gamepad technique input has no default
secondary binding in the source, so bind it if you want to use it.

## Choose how swings work

DFO's default **Weapon Swing Mode** is **Click or Hold**: a click swings, and holding the button keeps swinging, each
swing in a random direction. **Click** swings once per press. **Gesture** (single-player Daggerfall Unity's default)
makes you hold the button and drag the mouse, and the drag direction chooses the swing. Choose a mode under
**Settings** → **Controls**.

Your swing-mode setting is not forced online. The online lane forces **Allow Magic Repairs**, but it does not force a
weapon swing mode.

## Rebind an action

1. Open **Settings**.
2. Choose **Controls** → **Key bindings**.
3. Select the action and assign its primary binding; assign a secondary gamepad binding if useful.

The settings screen also has **Graphics**, **Gameplay**, **Combat**, **World**, **Interface**, **Audio**,
**Accessibility**, and **Mods & files** tabs.

## Next

- [Moving through the Hold](../hold/moving.md)
- [Fighting](../hold/fighting.md)

## Sources

- `src/systems/inputActions.js`: `DEFAULT_BINDINGS`, `DEFAULT_SECONDARY_BINDINGS`
- `src/systems/settings/settings.js`: `PORT_DEFAULTS` `Controls/WeaponSwingMode` '2' (Click or Hold), overriding Daggerfall Unity's '0' in `settingsDefaults.js` (SWING-DEFAULT1)
- `src/systems/settings/settings.js`: settings store and online setting overrides
- `src/systems/controlsConfig.js`: swing-mode names and `swingHint`
- `src/ui/settings/settingsMap.js`: `CATEGORIES`
- `src/systems/online/onlineLane.js`: `ONLINE_FORCED_SETTINGS`
- Research note: `handbook/research/B1.md`
