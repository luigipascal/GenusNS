#!/usr/bin/env bash
# Contabo — once daily: harvest Ditto smart-links from StartMail → data/smartlinks.json
# Site (Coolify) reads the shared /opt/genusns/data volume; no redeploy needed for new links.
set -euo pipefail
ROOT=/opt/genusns
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
LOG="$LOG_DIR/smartlinks-$STAMP.log"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

{
  echo "=== genusns smartlinks $STAMP ==="
  export GENUSNS_DATA_DIR="$ROOT/data"

  if [[ -z "${GENUSNS_IMAP_PASS:-}" ]]; then
    echo "GENUSNS_IMAP_PASS missing — skip"
    exit 0
  fi

  if [[ -f "$ROOT/worker/smartlinks_sync.py" ]]; then
    cd "$ROOT/worker"
    python3 smartlinks_sync.py
  elif [[ -f "$ROOT/scripts/smartlinks_sync.py" ]]; then
    cd "$ROOT/scripts"
    python3 smartlinks_sync.py
  else
    echo "smartlinks_sync.py not found"
    exit 1
  fi

  # Pending count for the log
  if [[ -f "$ROOT/data/smartlinks_pending.json" ]]; then
    python3 - <<'PY'
import json
from pathlib import Path
p = Path("/opt/genusns/data/smartlinks_pending.json")
n = len(json.loads(p.read_text(encoding="utf-8")).get("pending") or [])
m = len(json.loads(Path("/opt/genusns/data/smartlinks.json").read_text(encoding="utf-8")))
print(f"smartlinks_map={m} pending_platforms={n}")
PY
  fi
  echo "=== done ==="
} >>"$LOG" 2>&1
