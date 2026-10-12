#!/usr/bin/env bash
# Regenerate frames (+ audio with "all"), then re-assemble and re-inject transitions per project.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
S="$HERE/../../.claude/skills/faceless-explainer/scripts"
python3 "$HERE/gen.py" "${1:-frames}"
for p in neartech-01-il-progetto neartech-02-il-processo neartech-03-governance-e-valore; do
  cd "$HERE/../$p"
  node "$S/assemble-index.mjs" --storyboard ./STORYBOARD.md --hyperframes . | grep -E "total duration"
  node "$S/transitions.mjs" inject --storyboard ./STORYBOARD.md --hyperframes . >/dev/null
  node "$S/transitions.mjs" verify --storyboard ./STORYBOARD.md --index ./index.html | tail -1
done
