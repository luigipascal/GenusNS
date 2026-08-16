# GENUS//NS smart-links sync

Harvests **Ditto smart-links** from StartMail once a day and updates
`data/smartlinks.json`. The live site reads that file from the Contabo data
volume — new links appear without a Coolify redeploy.

## Production (Contabo)

| Job | Schedule (UTC) | Script |
|-----|----------------|--------|
| Daily publish | `15 6 * * *` | `/opt/genusns/cron-daily.sh` |
| Smart-links harvest | `15 18 * * *` | `/opt/genusns/cron-smartlinks-daily.sh` |

Evening slot gives Ditto time to email after the day’s release/upload.
Requires `GENUSNS_IMAP_PASS` (and optional `GENUSNS_IMAP_USER`) in `/opt/genusns/.env`
— sourced from AlterEgo `FINANCE_IMAP_*` (neuralsyntax@0dblabs.com / StartMail).

Logs: `/opt/genusns/logs/smartlinks-*.log`

## Manual

```bash
# PowerShell
$env:GENUSNS_IMAP_PASS = "…"   # or load from GenusNS .env
$env:GENUSNS_DATA_DIR = "E:\0dblabs\GenusNS\data"
python scripts/smartlinks_sync.py --dry-run
python scripts/smartlinks_sync.py
```

Config: `data/smartlinks/smartlinks_config.json` (worker copy beside the script on Contabo).
Also probes `https://ditto.fm/<id>` for published species and writes
`data/smartlinks_pending.json` for anything still waiting (site shows
**PLATFORMS COMING UP**).
