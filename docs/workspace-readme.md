# DFO workspace

A workspace for understanding **DFO Online** (a browser remake of Daggerfall), planning characters for
it, and, later, contributing to it.

## What's here

| Folder | What | In this repository's git? |
|---|---|---|
| `docs/` | What DFO is and how its rules work: start with [01-what-dfo-is.md](docs/01-what-dfo-is.md) | yes |
| `planner/` | The character planner ([docs/04-character-planner.md](docs/04-character-planner.md)) | yes |
| `scripts/` | Helper scripts | yes |
| `upstream/daggerfall-js-source/` | Your fork of DFO Online | no: its own git repository |
| `upstream/daggerfall-unity/` | Your fork of Daggerfall Unity, which DFO translates from | no: its own git repository |

The two forks are kept out of this repository on purpose. Each has its own history and its own two
"remotes":

- `origin`: your fork on GitHub;
- `upstream`: the original project.

Run `bash scripts/setup-upstream.sh` to clone them on a new machine, or to fetch what's new.

## The docs

1. [What DFO is](docs/01-what-dfo-is.md): its three layers (Daggerfall Unity's rules, bundled mods,
   DFO's own systems), online vs offline, and how to find your way around its code.
2. [Character creation](docs/02-character-creation.md): every step and number.
3. [Rule interactions](docs/03-rule-interactions.md): the High Elf question and the other tricks the
   code reveals.
4. [The character planner](docs/04-character-planner.md): how to run it, what it does, and how it
   stays accurate.
5. [The strongest melee character](docs/05-strongest-melee.md): a Khajiit hand-to-hand fighter, measured
   with DFO's own combat model, with ready-to-import class files in `planner/presets/`.
6. [Improving NPCs: the constraints](docs/06-npc-constraints.md): what the game, its servers, its budgets and its
   process allow, before choosing a scope.

## Running the planner

```bash
node planner/tools/extract-game-data.mjs
```

Run that once: it reads your Daggerfall files.

```bash
node planner/tools/serve.mjs
```

Then open http://localhost:5178/.

## How version control works here (a short guide)

Git records every change as a **commit**: a saved snapshot with a message explaining it. Nothing is lost
once committed. A few commands cover nearly everything:

```bash
git status
```

What changed since the last commit.

```bash
git log --oneline
```

The list of commits, newest first.

```bash
git diff
```

The exact lines changed and not yet committed.

```bash
git add -A
```

Stage every change for the next commit.

```bash
git commit -m "Say what changed and why"
```

Record a commit.

House rules:

- Commit small, finished steps, each with a message that says *why*.
- Run the planner tests before committing a change to the planner:
  `node --test "planner/test/*.test.mjs"`.
- Never commit Daggerfall's own files, or anything extracted from them. `.gitignore` already blocks the
  usual ones.
- Work on DFO itself happens inside `upstream/daggerfall-js-source` on a **branch**, never on `main`.
