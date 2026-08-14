#!/usr/bin/env python3
"""Render EP001 spoken script with MiniMax T2A if FOUNDRY_MINIMAX_API_KEY is set.

  python scripts/podcast_tts.py
  -> data/podcast/ep001-00d88e.mp3  and  apps/web/public/podcast/ep001-00d88e.mp3
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "docs" / "podcast" / "EP001_00D88E_script.txt"
OUT_DATA = ROOT / "data" / "podcast" / "ep001-00d88e.mp3"
OUT_PUBLIC = ROOT / "apps" / "web" / "public" / "podcast" / "ep001-00d88e.mp3"
API_BASE = (os.environ.get("FOUNDRY_MINIMAX_API_BASE") or "https://api.minimax.io").rstrip("/")
MODEL = os.environ.get("GENUSNS_PODCAST_TTS_MODEL", "speech-2.8-hd")
VOICE = os.environ.get("GENUSNS_PODCAST_VOICE_ID", "ttv-voice-2025112518363025-J6Tn9IpY")


def _key() -> str:
    key = (os.environ.get("FOUNDRY_MINIMAX_API_KEY") or os.environ.get("MINIMAX_API_KEY") or "").strip()
    if not key:
        raise SystemExit("FOUNDRY_MINIMAX_API_KEY not set")
    return key


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser(description="GENUS//NS Dispatch EP001 MiniMax Tess TTS")
    ap.add_argument(
        "--voice",
        default=VOICE,
        help="MiniMax voice_id (paste Tess or any ttv-voice-… / English_… id)",
    )
    args = ap.parse_args()
    voice = (args.voice or VOICE).strip()
    print(f"voice={voice}")
    text = SCRIPT.read_text(encoding="utf-8").strip()
    if len(text) > 10000:
        print(f"warning: {len(text)} chars; MiniMax sync cap is 10000 — prefer Genus Podcast tab (async)")
    body = {
        "model": MODEL,
        "text": text,
        "stream": False,
        "voice_setting": {
            "voice_id": voice,
            "speed": 0.95,
            "vol": 1,
            "pitch": 0,
        },
        "audio_setting": {"sample_rate": 32000, "bitrate": 128000, "format": "mp3"},
    }
    req = urllib.request.Request(
        f"{API_BASE}/v1/t2a_v2",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {_key()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"TTS HTTP {exc.code}: {exc.read().decode('utf-8', 'replace')[:400]}") from exc
    data = payload.get("data") or {}
    hex_audio = data.get("audio")
    if not hex_audio:
        raise SystemExit(f"no audio in response: {payload.get('base_resp')}")
    raw = bytes.fromhex(hex_audio)
    for dest in (OUT_DATA, OUT_PUBLIC):
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(raw)
        print(f"wrote {dest} ({len(raw)} bytes)")


if __name__ == "__main__":
    main()
