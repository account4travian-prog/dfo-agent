# DFO Agent: an AI agent that plays a game, under a learning seal

An embodied agent for **DFO Online** (a fan-made browser remake of Daggerfall), built as an evaluation task: what does an agent learn, and how do you prove the knowledge was earned rather than leaked?

**My role:** owner, designer, evaluator. I set the experiment's goals and ground rules, ruled on the seal's scope and strictness, and made the acceptance calls; AI agents implemented under my direction.

## The learning seal
- The playing agent has **no tools, files, or web access**, canary-tested: a planted canary must fail before a run counts.
- It plans only from a **sourced notebook**; every fact is tagged *saw / tried / read / told-by-whom*.
- An independent **auditor flags unearned facts and is forbidden to correct them**, because a correction would leak. A **baseline quiz** (~40 questions, each answer pinned to a code line) is built to sort trained, learned, and trained-but-wrong knowledge. The per-run leak audits and the quiz's baseline run were deferred in a 2026-10-18 scope cut, so no quiz scores or leak rate exist; the design is in place and the measurement is not claimed.

## Pilot results (one run per arm)
| Task | Memory on | Memory off | Note |
|---|---|---|---|
| Light the torch | 108 s / 17 calls | 13 s / 5 calls | Too easy to separate the arms; memory-off faster |
| Door navigation | 92 s / 22 calls | 179 s / 36 calls | Hint only (n=1); the memory arm carried the earlier notebook |
| First fight | won, 132 s | won, 85 s | Starter reflex only, bare fists, not memory |

One trial per arm, so nothing can be concluded about memory in general.

The agent has not yet chosen on its own to fight or to arm itself. The end goal I set (leave the start dungeon, join the Fighters Guild, complete a first quest) has not been completed: seven cave trials ended without the agent leaving the cave, and trial 8 found and used the door in about five minutes, then died to a rat at it.

Three harness defects, each found by a run it had ruined, were fixed in the harness, not in the agent's favor: a door the reflex layer could not use, a weapon rig read wrong underground, and a door fix that misread a wall corner.

The agent runs a 20 Hz policy-table reflex layer with no model and a 15-second lease, two sealed models behind a single controller, and attempted/accepted/observed logging.

## Also here
TerraSol, parallel model-built attempts at the same problem; handbook research, 12 files with zero uncited bullets and one headline finding reversed on re-check; a character planner measured against the game's own combat model.

**Social arm:** a design written before any code, never run. A disclosure gate has the agent say it is an AI on first contact; the action layer has no PvP tool; disengagement is final; the online switch stays off until the game owner agrees.

Substrate repos: `daggerfall-js-source`, `daggerfall-unity` (the game forks this agent plays in).
