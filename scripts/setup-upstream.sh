#!/usr/bin/env bash
# Clone (or update) the two forks this workspace studies, into upstream/.
#
#   bash scripts/setup-upstream.sh          clone anything missing, then fetch both remotes
#
# Each fork keeps two remotes:
#   origin   - your fork on GitHub (account4travian-prog/...), where you push branches
#   upstream - the original project, where new work arrives
#
# upstream/ is ignored by this workspace's git: each clone is its own repository with its
# own history. Nothing here ever pushes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/upstream"

clone() {
  local name="$1" fork="$2" original="$3"
  local dir="$ROOT/upstream/$name"
  if [ ! -d "$dir/.git" ]; then
    echo "== cloning $name"
    # --filter=blob:none keeps the clone small: old file versions download only when asked for.
    git clone --filter=blob:none "https://github.com/$fork.git" "$dir"
    git -C "$dir" remote add upstream "https://github.com/$original.git"
  fi
  echo "== fetching $name"
  git -C "$dir" fetch --quiet origin
  git -C "$dir" fetch --quiet upstream
  git -C "$dir" remote set-head upstream -a >/dev/null 2>&1 || true
  echo "   on $(git -C "$dir" rev-parse --abbrev-ref HEAD) at $(git -C "$dir" rev-parse --short HEAD)"
  echo "   upstream is $(git -C "$dir" rev-list --count HEAD..upstream/HEAD 2>/dev/null || echo '?') commits ahead"
}

clone daggerfall-js-source account4travian-prog/daggerfall-js-source Lattymoy/daggerfall-js-source
clone daggerfall-unity     account4travian-prog/daggerfall-unity     Interkarma/daggerfall-unity
