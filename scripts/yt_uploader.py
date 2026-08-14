#!/usr/bin/env python3
"""
yt_uploader.py — render + upload one GENUS//NS genome to YouTube (scheduled public).

For each genome it:
  1. renders cover + audio -> 1920x1080 MP4 (ffmpeg),
  2. uploads via the YouTube Data API v3 (resumable),
  3. sets it PRIVATE with publishAt = the genome's release date (goes public then),
  4. fills title + description (genome data from catalog.json + AI disclosure + links),
  5. sets Made-for-Kids = No and does NOT flag altered/AI content (matches "AI use: No").

Mirrors the Ditto uploader: one-time `login`, then `upload <ID> --date YYYY-MM-DD`.
Locked settings live in yt_config.json.

────────────────────────────────────────────────────────────────────────────────
ONE-TIME SETUP  (do this with the genusns@genusns.com account — the channel owner)
  1. https://console.cloud.google.com  -> create a project.
  2. Enable "YouTube Data API v3" (APIs & Services -> Library).
  3. APIs & Services -> Credentials -> Create OAuth client ID -> type "Desktop app".
     Download the JSON, save it next to this file as  client_secret.json.
  4. OAuth consent screen: add genusns@genusns.com as a Test user (keeps it simple).
  5. pip install google-api-python-client google-auth-oauthlib google-auth-httplib2
     (ffmpeg must be on PATH)
  6. python yt_uploader.py login        # opens a browser, sign in as genusns@genusns.com, approve

USAGE
  python yt_uploader.py upload 00D88E --date 2026-08-24
  python yt_uploader.py upload 00D88E --date 2026-08-24 --dry-run   # render only, no upload
Scheduling uses your channel's time zone at 00:00 unless YT_PUBLISH_TIME (HH:MM) is set.
"""
from __future__ import annotations
import argparse, datetime as dt, json, os, subprocess, sys
from pathlib import Path

ROOT      = Path(os.environ.get("GENUSNS_DATA", "E:/0dblabs/GenusNS/data"))
READY_DIR = ROOT / "READY_FOR_DITTO"
COVERS    = ROOT / "covers"
MASTERS   = ROOT / "masters"
CATALOG   = ROOT / "catalog.json"
VIDEO_DIR = ROOT / "videos"                       # rendered MP4s land here
LOG_FILE  = ROOT / "yt_upload_log.jsonl"
HERE      = Path(__file__).parent
CLIENT    = HERE / "client_secret.json"
TOKEN     = Path(os.environ.get("YT_TOKEN", ROOT / "_yt_token.json"))
CONFIG    = HERE / "yt_config.json"

SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube"]
CATEGORY_MUSIC = "10"

DEFAULTS = {
    "publish_time": os.environ.get("YT_PUBLISH_TIME", "00:00"),   # local HH:MM
    "tags": ["GENUS//NS", "AI music", "generative music", "instrumental electronic",
             "microtonal", "24-EDO", "ambient", "0dB_Labs", "Neural Syntax"],
    "site": "https://genusns.com",
    "youtube": "https://www.youtube.com/@genusns",
    "forum": "https://aigents.berta.one/forum/genus-ns-lab",
    "mood_bank": ["slow orbital pulses circling a still centre",
                  "quarter-tone drift over a patient low hum",
                  "interlocking cycles that never quite repeat",
                  "a lattice of detuned tones settling into place",
                  "sparse signals decaying across a dark field",
                  "microtonal rhythm folding back on itself"],
}

def cfg() -> dict:
    c = dict(DEFAULTS)
    if CONFIG.exists(): c.update(json.loads(CONFIG.read_text("utf-8")))
    return c

def log(m): print(f"[yt] {m}", flush=True)

def find_audio(gid: str) -> Path | None:
    for p in (
        READY_DIR / gid / "audio" / "master.mp3",
        MASTERS / f"{gid.lower()}.mp3",
        ROOT / "packages" / gid / "master.mp3",
    ):
        if p.exists():
            return p
    return None


def find_cover(gid: str) -> Path | None:
    for p in (
        READY_DIR / gid / "cover.jpg",
        READY_DIR / gid / "cover.png",
        COVERS / f"{gid.lower()}.png",
        ROOT / "packages" / gid / "cover.png",
        ROOT / "packages" / gid / "cover.jpg",
    ):
        if p.exists():
            return p
    return None

def render(gid: str) -> Path:
    audio, cover = find_audio(gid), find_cover(gid)
    if not audio: sys.exit(f"no audio for {gid}")
    if not cover: sys.exit(f"no cover for {gid}")
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    out = VIDEO_DIR / f"{gid}.mp4"
    if out.exists() and out.stat().st_size > 0:
        log(f"reuse {out.name}"); return out
    vf = ("scale=1080:1080:force_original_aspect_ratio=decrease,"
          "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p")
    subprocess.run(["ffmpeg","-y","-loop","1","-framerate","2","-i",str(cover),
                    "-i",str(audio),"-vf",vf,"-c:v","libx264","-preset","veryfast",
                    "-tune","stillimage","-crf","22","-r","12","-c:a","aac","-b:a","192k",
                    "-shortest","-movflags","+faststart",str(out)], check=True)
    log(f"rendered {out.name} ({out.stat().st_size//1024} KB)")
    return out

def genome(gid: str) -> dict:
    if not CATALOG.exists(): return {}
    for e in json.loads(CATALOG.read_text("utf-8")):
        if e.get("canonicalId","").upper().endswith(gid.upper()) or \
           e.get("digest","").lower().startswith(gid.lower()):
            return e
    return {}

def title(gid: str) -> str:
    g = genome(gid)
    edo = g.get("edo")
    tuning = f"{edo}-EDO" if edo else "24-EDO"
    return f"GENUS//NS \u2014 {gid} [AI \u00b7 {tuning} generative]"

def description(gid: str, iso_date: str, c: dict) -> str:
    g = genome(gid)
    edo = g.get("edo"); bpm = g.get("bpm"); tonic = g.get("tonicHz"); cyc = g.get("cycleLength")
    mood = c["mood_bank"][int(gid, 16) % len(c["mood_bank"])] if all(ch in "0123456789ABCDEFabcdef" for ch in gid) else c["mood_bank"][0]
    facts = []
    if tonic: facts.append(f"Tonic ~{round(tonic)} Hz")
    if bpm:   facts.append(f"{bpm} BPM")
    if cyc:   facts.append(f"{cyc}-step cycle")
    tuning = f"{edo}-EDO" if edo else "24-EDO"
    return (
        f"GENUS//NS \u2014 {gid}\n"
        f"Genome {gid} \u00b7 Single \u00b7 {tuning} \u00b7 release {iso_date}\n\n"
        f"Genome {gid} is a self-running system tuned in {tuning} (quarter-tones): {mood}. "
        f"Seeded, grown, and left to resolve on its own.\n"
        + (("  ".join(facts) + ".\n") if facts else "")
        + f"\nSite: {c['site']}\nYouTube: {c.get('youtube', 'https://www.youtube.com/@genusns')}\nForum: {c['forum']}\n\n"
        f"0dB_Labs \u00b7 composed & produced as Neural Syntax \u00b7 published by Rondanini Publishing\n\n"
        f"\u26a0 AI-generated \u2014 music and artwork. Not a recording of human performance.\n\n"
        f"#GENUSNS #AImusic #generativemusic #microtonal #{tuning.replace('-','')} #instrumental #0dBLabs"
    )

def service():
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    creds = None
    if TOKEN.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CLIENT.exists(): sys.exit(f"missing {CLIENT} (see setup in header)")
            creds = InstalledAppFlow.from_client_secrets_file(str(CLIENT), SCOPES).run_local_server(port=0)
        TOKEN.write_text(creds.to_json(), encoding="utf-8")
    return build("youtube", "v3", credentials=creds)

def publish_at(iso_date: str, hhmm: str) -> str:
    h, m = map(int, hhmm.split(":"))
    local = dt.datetime.fromisoformat(iso_date).replace(hour=h, minute=m)
    return local.astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")

def already_done(gid: str) -> str | None:
    if not LOG_FILE.exists(): return None
    for line in LOG_FILE.read_text("utf-8").splitlines():
        try:
            r = json.loads(line)
            if r.get("id") == gid and r.get("ok"): return r.get("videoId")
        except Exception: pass
    return None

def write_log(rec: dict):
    rec["ts"] = dt.datetime.now(dt.timezone.utc).isoformat()
    with LOG_FILE.open("a", encoding="utf-8") as f: f.write(json.dumps(rec) + "\n")

def cmd_login():
    service(); log(f"authorized. token -> {TOKEN}")

def cmd_upload(gid: str, iso_date: str, dry: bool):
    gid = gid.upper()
    dt.date.fromisoformat(iso_date)
    if (vid := already_done(gid)):
        log(f"{gid} already on YouTube ({vid}) — skipping."); return
    c = cfg()
    mp4 = render(gid)
    if dry:
        log(f"dry-run: rendered {mp4}, would schedule {gid} public on {iso_date}"); return
    from googleapiclient.http import MediaFileUpload
    yt = service()
    body = {
        "snippet": {"title": title(gid), "description": description(gid, iso_date, c),
                    "tags": c["tags"], "categoryId": CATEGORY_MUSIC},
        "status": {"privacyStatus": "private", "publishAt": publish_at(iso_date, c["publish_time"]),
                   "selfDeclaredMadeForKids": False, "madeForKids": False},
    }
    log(f"uploading {gid} -> scheduled public {iso_date} {c['publish_time']}")
    req = yt.videos().insert(part="snippet,status", body=body,
                             media_body=MediaFileUpload(str(mp4), resumable=True, mimetype="video/mp4"))
    resp = None
    while resp is None:
        status, resp = req.next_chunk()
        if status: log(f"  {int(status.progress()*100)}%")
    vid = resp["id"]
    write_log({"ok": True, "id": gid, "date": iso_date, "videoId": vid,
               "url": f"https://youtu.be/{vid}"})
    log(f"done: {gid} -> https://youtu.be/{vid} (public on {iso_date})")

def main():
    ap = argparse.ArgumentParser(description="GENUS//NS YouTube uploader (render + schedule).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("login")
    up = sub.add_parser("upload")
    up.add_argument("genome"); up.add_argument("--date", required=True); up.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if a.cmd == "login": cmd_login()
    else: cmd_upload(a.genome, a.date, a.dry_run)

if __name__ == "__main__":
    main()
