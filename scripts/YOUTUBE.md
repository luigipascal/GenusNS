# GENUS//NS YouTube uploader

Renders each genome's cover+audio into a 1920×1080 video and schedules it **public on its
release date**. Same shape as the Ditto uploader. **2 videos/day until the existing catalog
is scheduled, then 1/day.**

Run from the repo root:

```bash
python scripts/yt_backlog_hook.py list
python scripts/yt_backlog_hook.py run --dry-run
python scripts/yt_backlog_hook.py run
```

## Files
- `scripts/yt_uploader.py` — render + upload + schedule one genome (YouTube Data API).
- `scripts/yt_backlog_hook.py` — pick the next genome + assign its date, call the uploader.
- `scripts/yt_config.json` — publish time, links, tags, mood-bank.

`client_secret.json` and `data/_yt_token.json` stay off git.

## One-time setup (genusns@genusns.com — the channel owner)
1. https://console.cloud.google.com → create a project.
2. Enable **YouTube Data API v3**.
3. Credentials → **OAuth client ID → Desktop app** → save JSON as `scripts/client_secret.json`.
4. OAuth consent screen → add **genusns@genusns.com** as a test user.
5. `pip install google-api-python-client google-auth-oauthlib google-auth-httplib2` (ffmpeg on PATH).
6. `python scripts/yt_uploader.py login` → sign in as **genusns@genusns.com**.

## Continue after 00D88E (already scheduled public 24 Aug, slot 1)
```bash
python scripts/yt_backlog_hook.py mark 00D88E
python scripts/yt_backlog_hook.py set-last 2026-08-24 --slots 1
```

Quota: ~1,600 units per upload, default 10,000/day → about 6 uploads/day max. Cadence is 2/day on purpose.
