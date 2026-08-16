# GENUS//NS smart-links sync

Harvests **Ditto smart-links** from StartMail and attaches each one to its song
so genusns.com can show **STREAM ON PLATFORMS**.

## Run

```bash
# PowerShell
$env:GENUSNS_IMAP_PASS = "your-startmail-app-password"
$env:GENUSNS_DATA_DIR = "E:\0dblabs\GenusNS\data"
python scripts/smartlinks_sync.py --dry-run
python scripts/smartlinks_sync.py
```

Config: `data/smartlinks/smartlinks_config.json` (`data_dir` = `..`).
Writes `data/smartlinks.json` and stamps `smartLink` on catalog / published entries.

Contabo daily cron runs this when `GENUSNS_IMAP_PASS` is set in `/opt/genusns/.env`.
