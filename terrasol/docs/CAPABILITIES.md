# Player capabilities and controls

This is a source-backed working catalogue, not a record of live tests. The starting persona is Rowan, a new **online** character. Rowan can use the ordinary game interface and the complete normal set of player controls; actions are not limited to an older automation bridge. The operator uses Playwright's browser input and the visible game image and visible DOM. A control is an expectation to verify in its current context, not proof that an action succeeded. Confirm outcomes from the game before proceeding, and account for dialogs, focus, pointer lock, saved bindings, character state and availability.

The source reviewed is `DFO/upstream/daggerfall-js-source`, Git ref `refs/remotes/upstream/main` at `e4f09316684d78d194553d3c94cbaa9bbdaa9b7b`. The checked-out HEAD can differ; the evidence below refers to that ref. Keyboard defaults are rebindable and the active settings may differ.

| Area | Default actions and expected observable result |
|---|---|
| Create and enter | Use the online front door and visible account and character creation screens. Select and confirm choices on screen; verify the character and online mode before play. Guest and registered accounts have different system access. |
| Move and look | W/A/S/D move; mouse looks; Space jumps; C crouches/sneaks; Left Shift runs; F3 toggles auto-run. Confirm movement visually and stop input when the intended movement ends. |
| Interact | E interacts; left mouse activates the centered object. Hold Left Alt, move toward a mode and release to choose Grab, Info, Talk or Steal. Tab opens the quick dial. Use the visible prompt and selected mode to interpret a result. |
| Fight | Z readies or sheathes; hold right mouse and move it to swing in the source engine's default Gesture mode; H switches hands. The swing mode and bindings can be changed. The swing action repeats mouse gestures and can hold movement keys. Confirm the weapon is ready and observe the target and health. |
| Cast | Backspace invokes **CastSpell**, opening the spellbook. Select a known spell to ready it; the cast press is left mouse. Q invokes recast; backquote aborts a readied spell. Observe spell state, magicka and the result; a spell may require a target or have other restrictions. |
| Equipment and character | F6 opens inventory, F5 the character sheet, I status. Use visible pack controls to inspect, equip and use items. Results depend on the item and character. |
| Maps and travel | M opens local AutoMap; V opens the TravelMap. Choose a location using the visible map and travel controls. The separate TravelView action ships without a default key. Verify the selected destination and arrival. |
| Rest, transport, logs | R opens rest, T transport, L journal and N notebook. Follow the visible choices and verify the resulting state; resting and transport are context dependent. |
| Social and chat | F invokes social interaction; on a nearby player it can offer party or friend actions. Enter opens online chat when the game permits it; type in the field and Enter sends. Y frees the mouse independently. Social availability and chat focus must be observed. The user has authorized autonomous player conversation as needed or wanted during gameplay. |
| Loot and quick actions | P takes all and J opens the container when quick loot is available; number keys and visible hotbar slots can trigger assigned quick actions. Inspect the target and resulting inventory. |
| Pause and settings | Escape opens pause or closes the active overlay. Settings → Controls contains bindings. Use normal UI to choose settings and verify them before assuming defaults. |
| Save, load, death | Offline supports F9 quicksave and F11 quickload. Online play uses account checkpoints and blocks loading during play; online death offers a timed respawn at a safe place with a gold cost. Offline death follows the load-a-save path. Verify the current mode and death screen. |

These are normal game affordances, not assurances that all are enabled in every scene, account, skin or state. Use visible UI and ordinary input for any additional features the game offers, including inventory, dialogue, quests, shops, maps and character setup. A previous bridge's synthetic DOM events are untrusted, and the chat panel checks for trusted keyboard input; that bridge's inability to open chat is not a general game limitation. Playwright input must still be verified in the running environment.

## Source pointers at the stated ref

- `src/systems/inputActions.js`: `DEFAULT_BINDINGS`, action registry and binding comments.
- `src/ui/input.js`: routing for overlays, input actions and pause.
- `src/scenes/dungeonContext.js`: spellbook construction, `playerAttackInput`, and `quickLoad` online guard.
- `src/ui/spellbookWindow.js` and `src/ui/spellbookDoor.js`: spellbook selection and readying.
- `src/ui/chatPanel.js`: `CHAT_OPEN_ACTION`, trusted keyboard check and field handling.
- `src/ui/deathScreen.js`, `src/scenes/world.js`, and `src/systems/save/saveSlots.js`: death, online checkpoint and offline save behavior.
- Local handbook: `begin/menus-and-screens.md`, `begin/offline-and-online.md`, and `begin/first-90-minutes.md`. Handbook pages carry their own verification dates; current source takes precedence where they differ.
