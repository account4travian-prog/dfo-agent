---
title: Keys and commands
summary: DFO's default keyboard and mouse bindings, the chat channels and commands you can use, and where to rebind actions.
stage: reference
order: 70
gate: none
status: draft
tags: [controls, key bindings, chat, commands]
verified: e4f093166
---

> [!tip] At a glance
> - These are DFO Online's shipped defaults; your **Controls** screen shows your current bindings.
> - Rebind actions under **Settings › Controls › Key bindings**.
> - **Enter** opens online chat; press **Y** to free the mouse cursor.
> - Use `/help`, `/lang`, `/emotes` or `/breach help` for lists from inside the game.

## Common default keys

| Key or button | Default action |
|---|---|
| Esc | Open the pause menu when no overlay is open; close/back out of overlays |
| W / S | Move forward / backward |
| A / D | Move left / right |
| Left / Right Arrow | Turn left / right |
| Space | Jump; also float up while swimming or levitating |
| C / Left Shift | Crouch / run |
| R / T | Rest / transport |
| Left mouse / right mouse | Activate the center object / swing weapon |
| Middle mouse (wheel button) | Party ping: marks a point for your party (mark 5 s, route 12 s) |
| F3 | Toggle auto-run |
| Mouse back / forward side button | Weapon technique / toggle first- and third-person view |
| Z / H | Ready weapon / switch hand |
| Backspace / Q / ` | Cast / recast / abort spell |
| U | Use magic item |
| I / F5 / F6 | Status / character sheet / inventory |
| L / N / M / V | LogBook / NoteBook / AutoMap / TravelMap |
| F | Social interaction |
| Enter | Open online chat (offline, Enter frees the mouse cursor) |
| Y | Free the mouse cursor |
| E / Tab | Interact / QuickDial |
| P / J | Quick Loot All / Quick Loot Open |
| 1 / 2 / 3 / 4 | QuickUse1 / QuickUse2 / QuickSpell / QuickOffHand |
| 5–0 | Hotbar slots 5–10 |
| F8 | Screenshot |
| F9 / F11 | Offline quick save / quick load; loading during online play is disabled. See [Saving and returning](../begin/saving-and-returning.md). |
| Left Alt (hold) | Interaction-mode wheel: Steal, Grab, Info or Talk |

Several actions share a key by context. For example, Space's float action applies while swimming or levitating; the Controls screen is the authority for the context and your active binding.

## Other shipped actions

| Action | Default key |
|---|---|
| Look up / look down / centre view | Insert / Delete / Home |
| Torch toggle / drop / throw | O / G / X |
| Mount horse / summon horse | Comma / Period |
| SaddlePanel / ShipHold | F2 / F4 |
| FollowPaths ashore / Spyglass aboard ship | K |
| Float up / down | Page Up / Page Down |
| Switch shoulder | B |
| Auto perspective | Numpad + |
| Legacy family view | Numpad / |
| Choose act at a gathering spot / more sail at the helm | Up Arrow |
| Open Professions off the helm / less sail at the helm | Down Arrow |
| Boat disembark | Quote (') |
| Boat light toggle | Semicolon (;) |
| Boat sail toggle | End |
| Boat trim left / right | Left / right bracket ([ / ]) |
| Boat trim modifier | Backslash (\) |
| Boat time scale up / down / reset | Numpad * / Numpad - / Numpad Enter |

Sneak (held, without crouching), TravelView, WalkMode and DebugOverlay ship unbound. C remains the default Crouch action, which also sneaks. TravelView is the separate Overworld view; V is TravelMap. A controller has separate mappings. You can rebind any supported action in Controls; do not assume a key described in an older guide is free.

## Chat channels

Use a slash command or the chat tabs to select a channel:

| Channel | Commands |
|---|---|
| World | `/world`, `/g` |
| Region | `/region`, `/r` |
| Local | `/local`, `/l`, `/say`, `/s` |
| Party | `/party`, `/p` |
| Guild | `/guild`, `/gu` |
| Trade | `/trade`, `/tr` |
| Looking for group | `/lfg` |
| Language channel | `/lc` (after joining one with `/lang`) |
| Local, out of character | `/ooc` |

Trade and LFG are opt-in channels: `/join trade` or `/join lfg` adds the tab, `/leave` removes it, and saying something on one joins it. Local chat is nearby in-character speech; `/ooc` sends a nearby out-of-character line. `/lang [code|off]` joins or leaves a language channel.

## Useful commands

- `/help` lists commands. `/lang` lists language channels, and `/emotes` lists available gestures.
- `/roll` or `/dice` makes a dice roll; `/me` describes an action, `/rp` sends a roleplay line, and `/wave`, `/bow` and `/nod` are gesture commands.
- `/ready` explains party resting online; `/leader` travels to your party leader; `/travel` gets you ready for the leader's journey (the leader uses it to call the journey off). `/mentor` shows whether you are mentoring your party; mentoring switches on by itself.
- `/mail` or `/mailbox` opens mail. `/find` or `/who` finds players; `/search [name]` searches a name.
- `/unstuck` leaves by the door you came in, or outdoors takes you to the nearest town; `/unstuck cancel` stops it.
- `/block`, `/unblock` and `/blocked` manage your block list. `/report <name> [category][: note]` reports player conduct; `/rules` shows the Code of Conduct.
- `/bug` opens a private report form. It is different from `/report`.
- `/breach` opens Elite Breach commands; `/breach help` prints their help.

Unknown slash commands are refused rather than broadcast as ordinary chat; start a line with `//` to send text that begins with a slash. `/event` is a developer's live-event command, not a player utility.

## Common mistakes

- Treating an old guide's suggested rebind key as unassigned can collide with a shipped mod action; check your live Controls list first.
- Sending a slash typo as chat will not broadcast it as text.
- Mixing up `/bug` and `/report` sends a private issue report when you meant to report a player, or vice versa.

## Next

- [Questions new players ask](questions.md)
- [The glossary](glossary.md)

## Sources

- `src/systems/inputActions.js`: `DEFAULT_BINDINGS`, `DEFAULT_SHARES`, action names and groups (Unity Mouse0/1/2 = left/right/middle)
- `src/ui/input.js`: `MOUSE_CODES` (Mouse3 and Mouse4 are the back and forward side buttons)
- `src/ui/input.js`: `routeAction` (Escape opens pause without an overlay; overlay close takes priority)
- `src/ui/enhanced/enhancedMenu.js`: pause Escape/back handling
- `src/scenes/dungeonContext.js`: `quickLoad`, `ONLINE-LOAD1` (online loading refusal)
- `src/systems/save/saveSlots.js`: `QUICK_SAVE_NAME`, save slots and browser/desktop storage
- `src/systems/save/save.js`: `snapshotPlayer`
- `src/player/pointerLock.js`: Enter is the chat's online; FreeMouse (Y) always frees the cursor
- `src/systems/gamepad.js`: controller mapping shape
- `src/ui/settings/settingsMap.js`: Settings tabs and Controls location
- `src/net/chatCommands.js`: `CHANNEL_COMMANDS`, `JOIN_CHANNELS`, `HOST_COMMANDS`, `HELP_LINES`, `parseChatLine`
- `src/net/chat.js`: `OPT_CHANNELS` and chat channel behavior
- `src/systems/mentorMode.js`: automatic mentoring
- `src/net/dice.js`, `src/net/safety/safetyLaw.js`: dice and safety command validation
- Research note: `handbook/research/X1.md`; `handbook/research/B1.md`
