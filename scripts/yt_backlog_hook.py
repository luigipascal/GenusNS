#!/usr/bin/env python3
"""
yt_backlog_hook.py — schedule the next GENUS//NS genome's video, on the right date.

Publish-date packing (independent of how often you run it):
  • 2 videos per day until the existing catalog backlog is scheduled, then 1 per day.
  • Dates are stored in yt_schedule.json; run this as often as you like — the date
    math packs 2/day regardless of run frequency.

Selection: genomes from catalog.json, oldest first, not already on YouTube, assets present.
Calls yt_uploader.py to render + upload + schedule (public on the assigned date).

COMMANDS
  python yt_backlog_hook.py list             # show queue + next date
  python yt_backlog_hook.py run --dry-run    # pick + render, no upload
  python yt_backlog_hook.py run              # schedule the next one
  python yt_backlog_hook.py set-last <DATE> [--slots N]   # seed the date cursor
  python yt_backlog_hook.py mark <ID> [...]  # mark ids already on YouTube

  Seed to continue after the first video (00D88E, scheduled 24 Aug as slot 1 of that day):
    python yt_backlog_hook.py mark 00D88E
    python yt_backlog_hook.py set-last 2026-08-24 --slots 1
  => next picks resume at 24 Aug slot 2, then 25 Aug (x2), ... until backlog done, then 1/day.

ENV
  GENUSNS_DATA      default E:/0dblabs/GenusNS/data
  YT_PER_DAY_BACKLOG default 2      YT_PER_DAY_AFTER default 1
  YT_BACKLOG_COUNT  default = size of catalog.json (existing genomes)
  YT_MIN_LEAD       default 1       (never schedule closer than this many days out)
"""
from __future__ import annotations
import argparse, datetime as dt, json, os, subprocess, sys
from pathlib import Path

ROOT      = Path(os.environ.get("GENUSNS_DATA", "E:/0dblabs/GenusNS/data"))
READY_DIR = ROOT / "READY_FOR_DITTO"
COVERS    = ROOT / "covers"
MASTERS   = ROOT / "masters"
CATALOG   = ROOT / "catalog.json"
YT_LOG    = ROOT / "yt_upload_log.jsonl"
SCHEDULE  = ROOT / "yt_schedule.json"
UPLOADER  = Path(__file__).with_name("yt_uploader.py")

PER_DAY_BACKLOG = int(os.environ.get("YT_PER_DAY_BACKLOG", "2"))
PER_DAY_AFTER   = int(os.environ.get("YT_PER_DAY_AFTER", "1"))
MIN_LEAD        = int(os.environ.get("YT_MIN_LEAD", "1"))

def _log(m): print(f"[yt-hook] {m}", flush=True)

def catalog_ids() -> list[str]:
    ids = []
    for e in json.loads(CATALOG.read_text("utf-8")):
        cid = e.get("canonicalId", "")
        gid = cid.split(":")[-1].upper() if ":" in cid else e.get("digest", "")[:6].upper()
        if gid: ids.append(gid)
    return ids

def backlog_count() -> int:
    env = os.environ.get("YT_BACKLOG_COUNT")
    return int(env) if env else len(catalog_ids())

def yt_records() -> list[dict]:
    if not YT_LOG.exists(): return []
    out = []
    for line in YT_LOG.read_text("utf-8").splitlines():
        try: out.append(json.loads(line))
        except Exception: pass
    return out

def done_ids(recs) -> set[str]:
    return {r.get("id", "").upper() for r in recs if r.get("ok")}

def has_assets(gid: str) -> bool:
    audio = (
        (READY_DIR / gid / "audio" / "master.mp3").exists()
        or (MASTERS / f"{gid.lower()}.mp3").exists()
        or (ROOT / "packages" / gid / "master.mp3").exists()
    )
    cover = (
        (READY_DIR / gid / "cover.jpg").exists()
        or (READY_DIR / gid / "cover.png").exists()
        or (COVERS / f"{gid.lower()}.png").exists()
        or (ROOT / "packages" / gid / "cover.png").exists()
        or (ROOT / "packages" / gid / "cover.jpg").exists()
    )
    return audio and cover

def eligible() -> list[str]:
    done = done_ids(yt_records())
    out = []
    for gid in catalog_ids():
        if gid in done: continue
        if not has_assets(gid):
            _log(f"skip {gid}: assets missing"); continue
        out.append(gid)
    return out

def read_cursor() -> dict:
    if SCHEDULE.exists():
        try: return json.loads(SCHEDULE.read_text("utf-8"))
        except Exception: pass
    return {"last_date": None, "slots_used": 0}

def write_cursor(cur: dict):
    SCHEDULE.write_text(json.dumps(cur), encoding="utf-8")

def next_date(scheduled_so_far: int) -> tuple[str, dict]:
    """Return (iso_date, new_cursor). Packs PER_DAY_BACKLOG/day until backlog done."""
    cur = read_cursor()
    per_day = PER_DAY_BACKLOG if scheduled_so_far < backlog_count() else PER_DAY_AFTER
    today = dt.datetime.now(dt.timezone.utc).date()
    floor = today + dt.timedelta(days=MIN_LEAD)
    last = dt.date.fromisoformat(cur["last_date"]) if cur.get("last_date") else None
    if last and cur.get("slots_used", 0) < per_day:
        date = max(last, floor); slots = cur["slots_used"] + 1
    else:
        date = max((last + dt.timedelta(days=1)) if last else floor, floor); slots = 1
    return date.isoformat(), {"last_date": date.isoformat(), "slots_used": slots}

def cmd_list():
    q = eligible(); cur = read_cursor()
    nd, _ = next_date(len(done_ids(yt_records())))
    _log(f"eligible={len(q)}  backlog_count={backlog_count()}  cursor={cur}  next_date={nd}")
    for i, gid in enumerate(q[:12]): _log(f"  {i+1:>3}. {gid}" + ("  <= next" if i == 0 else ""))

def cmd_set_last(date_iso: str, slots: int):
    dt.date.fromisoformat(date_iso)
    write_cursor({"last_date": date_iso, "slots_used": slots}); _log(f"cursor set: {date_iso} slot {slots}")

def cmd_mark(ids):
    with YT_LOG.open("a", encoding="utf-8") as f:
        for gid in ids:
            f.write(json.dumps({"ok": True, "id": gid.upper(), "note": "manual/mark",
                                "ts": dt.datetime.now(dt.timezone.utc).isoformat()}) + "\n")
            _log(f"marked {gid.upper()}")

def cmd_run(dry: bool):
    q = eligible()
    if not q: _log("no eligible genomes — YouTube is caught up."); return
    gid = q[0]
    date, new_cur = next_date(len(done_ids(yt_records())))
    _log(f"next: {gid}  schedule={date}")
    cmd = [sys.executable, str(UPLOADER), "upload", gid, "--date", date] + (["--dry-run"] if dry else [])
    if subprocess.run(cmd).returncode != 0:
        _log("uploader failed (cursor not advanced)"); sys.exit(1)
    if not dry:
        write_cursor(new_cur); _log(f"scheduled {gid} for {date}; cursor -> {new_cur}")

def main():
    ap = argparse.ArgumentParser(description="GENUS//NS YouTube scheduling hook.")
    sub = ap.add_subparsers(dest="cmd")
    r = sub.add_parser("run"); r.add_argument("--dry-run", action="store_true")
    sub.add_parser("list")
    s = sub.add_parser("set-last"); s.add_argument("date"); s.add_argument("--slots", type=int, default=1)
    m = sub.add_parser("mark"); m.add_argument("ids", nargs="+")
    a = ap.parse_args()
    if   a.cmd == "list":     cmd_list()
    elif a.cmd == "set-last": cmd_set_last(a.date, a.slots)
    elif a.cmd == "mark":     cmd_mark(a.ids)
    else:                     cmd_run(getattr(a, "dry_run", False))

if __name__ == "__main__":
    main()
