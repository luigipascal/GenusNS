#!/usr/bin/env bash
# Contabo host cron — GenusNS daily publish (and generate when MiniMax key present).
# Fixed: LF endings; host python when genusns-worker image is absent;
# always force host data path after sourcing .env (docker uses /data).
set -euo pipefail
ROOT=/opt/genusns
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
LOG="$LOG_DIR/daily-$STAMP.log"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

{
  echo "=== genusns daily $STAMP ==="

  # Forum → agent guidance (HTML scrape; prompts stay locked)
  if [[ -f "$ROOT/worker/forum_lab.py" ]]; then
    export GENUSNS_DATA_DIR="$ROOT/data"
    echo "forum_lab ingest --absorb"
    (cd "$ROOT/worker" && python3 forum_lab.py ingest --absorb) || echo "forum_lab skip"
  elif [[ -f "$ROOT/scripts/forum_lab.py" ]]; then
    export GENUSNS_DATA_DIR="$ROOT/data"
    echo "forum_lab ingest --absorb (scripts)"
    (cd "$ROOT/scripts" && python3 forum_lab.py ingest --absorb) || echo "forum_lab skip"
  fi

  # Smart-links: once daily via cron-smartlinks-daily.sh (18:15 UTC), not here.

  if sudo docker image inspect genusns-worker:latest >/dev/null 2>&1; then
    export GENUSNS_DATA_DIR=/data
    echo "via docker genusns-worker:latest DATA=$GENUSNS_DATA_DIR"
    sudo docker run --rm \
      --env-file "$ROOT/.env" \
      -e GENUSNS_DATA_DIR=/data \
      -v "$ROOT/data:/data" \
      -v "$ROOT/worker:/app:ro" \
      -w /app \
      genusns-worker:latest \
      python daily_autonomy.py --publish-only
  else
    export GENUSNS_DATA_DIR="$ROOT/data"
    echo "docker image missing — host python publish_daily DATA=$GENUSNS_DATA_DIR"
    cd "$ROOT/worker"
    python3 publish_daily.py
  fi
  echo "=== done ==="
} >>"$LOG" 2>&1
