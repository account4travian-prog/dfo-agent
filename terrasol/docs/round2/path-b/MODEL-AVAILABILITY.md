# Luna/Terra/Sol availability finding (Path B)

Evidence date: 2026-10-28. This is a local **metadata** finding, not a model call. No
credential, auth, token or private identity file was read or copied.

## Source and method

`src/mind/model-metadata.mjs` reads only Codex's locally cached model descriptors
(`models_cache.json`) from, in order:

1. `DFO_MODELS_CACHE`
2. `$CODEX_HOME/models_cache.json`
3. `~/.codex-dfo-roles/models_cache.json`
4. `~/.codex/models_cache.json`

The inspected machine returned the role models from
`%USERPROFILE%\.codex-dfo-roles\models_cache.json` (`fetched_at: 2026-10-27T09:53:04Z`).
`node tools/mind-preflight.mjs` (dry run, zero model calls) selected:

```json
{
  "luna": "gpt-6-luna",
  "terra": "gpt-6.1-terra",
  "sol": "gpt-6.1-sol"
}
```

## Candidate evidence

The cache lists these role-family entries with `visibility: "list"` and
`supported_in_api: true`:

| Family | Locally listed candidates | Selected |
| --- | --- | --- |
| Luna | `gpt-6-luna` (priority 5), `gpt-5.6-luna` (priority 9) | `gpt-6-luna` (highest listed generation) |
| Terra | `gpt-6.1-terra`, `gpt-5.6-terra` | `gpt-6.1-terra` |
| Sol | `gpt-6.1-sol`, `gpt-6-sol`, `gpt-5.6-sol` | `gpt-6.1-sol` |

Selection rule: exact family suffix, highest numeric generation, then priority.
There is no `gpt-6.1-luna` in the local cache, so `gpt-6-luna` is the concrete
available Luna identifier for this machine.

## Configuration result

- `DEFAULT_ROLES.luna.model` is `gpt-6-luna`; `loadMindConfig` verifies it against
  the local metadata and records `models.resolution` (source/fetchedAt/selected)
  in the worker log.
- Explicit config/`DFO_LUNA_MODEL` still wins; a missing or different identifier
  is never silently replaced by another model.
- Default engineering session caps: `maxInputTokens: 1500000`, `maxCalls: 240`,
  `maxOutputTokens: 60000`; override with config or
  `DFO_MIND_MAX_INPUT_TOKENS`/`DFO_MIND_MAX_CALLS`. These are safety limits, not
  a conversion from a subscription allowance.
- The bounded real-role preflight is prepared at `tools/mind-preflight.mjs`.
  It refuses paid execution unless both `--execute` and
  `DFO_REAL_ROLE_PREFLIGHT=1` are set. It was **not executed** from this worktree;
  Codex owns the authorized real-role preflight after reconciliation.
