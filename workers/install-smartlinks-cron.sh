# Install Contabo crontab line for once-daily smart-links harvest (18:15 UTC).
# Run on the Contabo host (or via ssh):
#   bash /opt/genusns/worker/install-smartlinks-cron.sh
set -euo pipefail
ROOT=/opt/genusns
SRC="$ROOT/worker/cron-smartlinks-daily.sh"
DST="$ROOT/cron-smartlinks-daily.sh"
LINE="15 18 * * * $DST"

cp -f "$SRC" "$DST"
chmod +x "$DST" "$SRC"

# Idempotent crontab upsert
tmp=$(mktemp)
crontab -l 2>/dev/null | grep -v 'cron-smartlinks-daily' >"$tmp" || true
echo "$LINE" >>"$tmp"
crontab "$tmp"
rm -f "$tmp"
echo "Installed: $LINE"
crontab -l | grep smartlinks || true
