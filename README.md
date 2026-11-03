# DFO Agent: an AI agent that plays a game, under a learning seal

An embodied agent for **DFO Online** (a fan-made browser remake of Daggerfall). It was built as a test setup first and a game player second. The question behind it: what does an agent actually learn from experience, and how would you prove the knowledge was earned rather than leaked?

**My role:** owner, designer, evaluator. I specified the architecture, the seal, and the acceptance rules; AI agents implemented under my direction. Full record: `PORTFOLIO-DEEP-DFO` write-up (in the portfolio hub).

## Architecture
- **Body:** a 20 Hz policy-table reflex layer, no model. It holds a 15-second lease and a latched operator stop.
- **Mind:** two sealed models behind a single controller, a Haiku tactician and a Sonnet strategist. The controller refuses stale replies and double-toggles.
- **Logging:** every action is recorded as *attempted / accepted / observed*, attempted is never reported as done.

## The learning seal (contamination control)
- The playing agent has **no tools, files, or web access**, canary-tested: a planted canary checks the seal holds before any run counts.
- It may plan only from a **sourced notebook**: every fact tagged *saw / tried / read / told-by-whom*.
- A **baseline quiz** (~40 questions pinned to code lines) separates *trained* knowledge, *learned* knowledge, and *trained-but-wrong* knowledge.
- An independent **auditor flags unearned facts and is forbidden to correct them**, correcting would leak; the leak rate is the measured output.

## Pilot results (single runs, read them that way)
| Task | Memory on | Memory off | Note |
|---|---|---|---|
| Door navigation | 92 s / 22 calls | 179 s / 36 calls | A hint, nothing more (n=1) |
| First fight | won, 132 s | won, 85 s | Both wins came from the declared starter reflex, bare fists, not from memory |

The agent has not yet chosen on its own to fight or to arm itself. Three harness-fairness defects found by the pilots (door use, dungeon weapon rig, seen-door gating) were fixed in the harness, not in the agent's favour.

## Also here
- **TerraSol attempts:** parallel model-built versions of the same problem, kept for comparison.
- **Handbook research:** 12 files, zero uncited bullets; one headline finding reversed on re-check.
- **Character planner:** build planning measured against the game's own combat model.
- **Social arm (designed, not started):** a disclosure gate with a checker model, no PvP (the tool for it does not exist), disengagement final, and it goes online only with the game owner's agreement.

Substrate repos: `daggerfall-js-source`, `daggerfall-unity` (the game forks this agent plays in).
