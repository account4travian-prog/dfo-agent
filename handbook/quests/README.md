# Quest guide data

`quests.json` is the committed, dialogue-free index behind `/quests/`. It covers every player-facing quest:

- 265 quests in the pinned DFU quest pack, minus the 21 `__DEMO` engine scripts = 244;
- 39 online questline steps from DFO's `src/systems/questlines/` = 283.

It is not a copy of the game's message text. Each record keeps facts a guide needs: id, name, kind, category, group,
questor/faction, starts-by, membership/rank/reputation requirement, time limit, generated place types, target foe/item
kinds, reward, source filename, sheet objective/outcome text for the fixed quests, and questline line/step metadata.

## Regenerate

The full extraction contains the quest pack's message text and is deliberately kept out of the repository (under
`audit/`, which is gitignored). The public data is derived from it:

```powershell
# public, dialogue-free extraction + local full text (for page writing, never commit the full file)
node handbook/tools/extract-quests.mjs
node handbook/tools/extract-quests.mjs --full audit/work/quests-full.json

# build the committed browser index from the local full extraction
$env:QUEST_EXTRACTION = 'audit/work/quests-full.json'
node handbook/tools/build-quest-index.mjs
Remove-Item Env:QUEST_EXTRACTION
```

The extractor is pinned to `upstream/snapshot-e4f093166/vendor/dfu-quests` (DFU quest pack, MIT, commit
`81e89e90c27bc3c1a7a61871e545fad129174dec`). Do not use live game files.

## Policy

- No message panels, journal prose or other copied dialogue in the public index or in guide pages.
- Generated locations are always described as generated; never publish a fixed location for a per-character quest.
- The data file is the source of the quest lists in `/quests/`; the page must not invent a quest that is not here.
- Numbers and rules are checked against DFO `e4f093166`; update the index after a game sync and record the change.
