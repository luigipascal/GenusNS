#!/usr/bin/env bash
# Contabo — Saturday UTC bulletin to Brevo list.
set -euo pipefail
ROOT=/opt/genusns
export GENUSNS_DATA_DIR="${GENUSNS_DATA_DIR:-$ROOT/data}"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
LOG="$LOG_DIR/newsletter-$STAMP.log"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

{
  echo "=== genusns newsletter $STAMP ==="
  sudo docker run --rm \
    --env-file "$ROOT/.env" \
    -e GENUSNS_DATA_DIR=/data \
    -v "$GENUSNS_DATA_DIR:/data" \
    -v "$ROOT/worker:/app:ro" \
    -w /app \
    genusns-worker:latest \
    python newsletter_weekly.py --send
  echo "=== done ==="
} >>"$LOG" 2>&1
