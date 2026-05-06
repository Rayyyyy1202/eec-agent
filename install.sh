#!/usr/bin/env bash
# EEC Skills installer — copies skills + shared schemas into ~/.claude/skills/
# Usage:
#   ./install.sh                # install all 9 MVP skills
#   ./install.sh --dry-run      # show what would be installed
#   ./install.sh --uninstall    # remove all eec-* skills + shared
#   ./install.sh --skill 05     # install only one skill (matches eec-05-*)

set -euo pipefail

SKILLS_DIR="${HOME}/.claude/skills"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SKILLS=(
  "eec-01-research"
  "eec-02-product-selection"
  "eec-03-brand-identity"
  "eec-04-creative-factory"
  "eec-05-site-build"
  "eec-06-tracking"
  "eec-07a-tech-seo"
  "eec-07b-content-marketing"
  "eec-08-paid-ads"
  "eec-09-optimization"
)

DRY_RUN=0
UNINSTALL=0
ONLY_SKILL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --uninstall) UNINSTALL=1; shift ;;
    --skill) ONLY_SKILL="$2"; shift 2 ;;
    -h|--help)
      head -n 7 "$0" | tail -n 6 | sed 's/^# *//'
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[dry-run] $*"
  else
    eval "$@"
  fi
}

if [[ $UNINSTALL -eq 1 ]]; then
  echo "Uninstalling EEC skills from $SKILLS_DIR"
  for s in "${SKILLS[@]}"; do
    if [[ -d "$SKILLS_DIR/$s" ]]; then
      run "rm -rf '$SKILLS_DIR/$s'"
      echo "  removed $s"
    fi
  done
  if [[ -d "$SKILLS_DIR/eec-shared" ]]; then
    run "rm -rf '$SKILLS_DIR/eec-shared'"
    echo "  removed eec-shared"
  fi
  echo "Done."
  exit 0
fi

mkdir -p "$SKILLS_DIR"

# 1) Install shared schemas + docs as eec-shared/ — referenced by every skill
echo "Installing shared layer → $SKILLS_DIR/eec-shared/"
run "rm -rf '$SKILLS_DIR/eec-shared'"
run "cp -R '$REPO_ROOT/shared' '$SKILLS_DIR/eec-shared'"

# 2) Install each skill
for s in "${SKILLS[@]}"; do
  if [[ -n "$ONLY_SKILL" ]] && [[ "$s" != *"$ONLY_SKILL"* ]]; then
    continue
  fi
  src="$REPO_ROOT/$s"
  dst="$SKILLS_DIR/$s"
  if [[ ! -d "$src" ]]; then
    echo "  skip $s (not found in repo)"
    continue
  fi
  echo "Installing $s → $dst"
  run "rm -rf '$dst'"
  run "cp -R '$src' '$dst'"
done

if [[ $DRY_RUN -eq 0 ]]; then
  echo ""
  echo "✓ Install complete. Verify with:"
  echo "    ls $SKILLS_DIR | grep eec-"
  echo ""
  echo "Trigger any skill via slash command, e.g.:"
  echo "    /eec-01-research portable blender"
fi
