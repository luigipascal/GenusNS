#!/usr/bin/env python3
"""
Daily GenusNS autonomy on Contabo (cheap + reliable: host cron, MiniMax API).

Steady state (after bootstrap stock):
  1. Consume *majority-approved* compiled genomes only (MiniMax)
  2. Generate ≤2 min master via MiniMax into backlog (skip existing masters)
  3. Package + enqueue
  4. Publish at most one track (UTC day)

Usage:
  python scripts/daily_autonomy.py           # generate pending approved + publish one
  python scripts/daily_autonomy.py --publish-only
  python scripts/daily_autonomy.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
GENUSNS = SCRIPT_DIR.parent if SCRIPT_DIR.name == "scripts" else SCRIPT_DIR.parent
DATA = Path(os.environ.get("GENUSNS_DATA_DIR") or (GENUSNS / "data")).resolve()
# Lab (Genus) — majority-approved genomes live here. Publication never invents species.
HUMANIZER = Path(
    os.environ.get("GENUS_HUMANIZER_ROOT") or os.environ.get("HUMANIZER_ROOT") or r"E:\0dblabs\humanizer"
)
sys.path.insert(0, str(SCRIPT_DIR))

from minimax_client import generate_instrumental_mp3  # noqa: E402

try:
    import forum_lab  # noqa: E402
except ImportError:  # worker image without forum_lab yet
    forum_lab = None  # type: ignore


def _load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _load_json(path: Path, fallback):
    if not path.is_file():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def _published_ids() -> set[str]:
    pub = _load_json(DATA / "published.json", {"entries": []})
    return {str(e.get("id", "")).upper()[:6] for e in pub.get("entries", [])}


def _norm(id_: str) -> str:
    return "".join(c for c in id_ if c in "0123456789abcdefABCDEF")[:6].upper()


# MiniMax stubs (4651EB = 136 KB / 4.2 s) are not masters. ~12 s @ 256 kbps.
MIN_MASTER_BYTES = 400_000
MIN_MASTER_MS = 60_000


def _master_audio_paths(short: str) -> list[Path]:
    return [
        DATA / "packages" / short / "master.mp3",
        DATA / "masters" / f"{short.lower()}.mp3",
        DATA / "READY_FOR_DITTO" / short / "audio" / "master.mp3",
    ]


def _has_master(short: str) -> bool:
    return any(
        p.is_file() and p.stat().st_size >= MIN_MASTER_BYTES
        for p in _master_audio_paths(short)
    )


def _approved_paths() -> list[Path]:
    roots = [DATA / "approved"]
    lab = HUMANIZER / ".genus" / "approved"
    if lab.is_dir():
        roots.append(lab)
    seen: set[str] = set()
    out: list[Path] = []
    for root in roots:
        if not root.is_dir():
            continue
        for p in sorted(root.glob("*.json")):
            if p.stem in seen:
                continue
            seen.add(p.stem)
            out.append(p)
    return out


def _locked_brief(digest: str) -> dict | None:
    """Locked compose prompt from compiled pack or synced experiment — never invented."""
    pack = HUMANIZER / ".genus" / "compiled" / digest
    for brief_path in (
        pack / "foundry_brief.json",
        DATA / "experiments" / digest / "foundry_brief.json",
        DATA / "experiments" / digest / "COMPOSE_INSTRUCTION.json",
        DATA / "compiled" / digest / "foundry_brief.json",
    ):
        if not brief_path.is_file():
            continue
        try:
            data = json.loads(brief_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        prompt = (data.get("prompt") or "").strip()
        if not prompt:
            nested = (data.get("foundry") or {}).get("prompt") if isinstance(data.get("foundry"), dict) else ""
            prompt = (nested or "").strip()
        if not prompt:
            continue
        duration = int(data.get("duration_ms") or 60_000)
        duration = max(10_000, min(120_000, duration))
        return {
            "prompt": prompt,
            "title": data.get("title") or data.get("genre") or f"Genus-{digest[:6].upper()}",
            "duration_ms": duration,
            "bpm": data.get("bpm") or data.get("tempo_proxy_bpm"),
            "key": data.get("key") or "EDO",
            "structure": data.get("structure"),
            "instruction_path": str(brief_path),
        }
    return None


def _experiment_law(digest: str, rec: dict, pack: Path) -> dict:
    gdef = _load_json(pack / "genre_definition.json", {})
    law = gdef.get("law") or rec.get("genome") or {}
    pitch = law.get("pitch") or {}
    meter = law.get("meter") or {}
    spectral = law.get("spectral") or {}
    form = law.get("form") or {}
    form_path = _load_json(pack / "form_path.json", {})
    events = _load_json(pack / "events.json", {})
    brief = _load_json(pack / "foundry_brief.json", {})
    eu = meter.get("subdivision_euclidean") or [3, 8]
    short = _norm(digest)
    prov = (rec.get("genome") or {}).get("provenance") or {}
    event_list = events.get("events") if isinstance(events.get("events"), list) else []
    return {
        "digest": digest,
        "canonicalId": f"GENUS//NS:{short}",
        "name": gdef.get("name") or rec.get("name") or f"Genus-{short}",
        "edo": int(pitch.get("edo") or 12),
        "tonicHz": float(pitch.get("tonic_hz") or 220),
        "generatorCents": float(pitch.get("generator_cents") or 700),
        "allowedDegrees": list(pitch.get("allowed_degrees") or []),
        "bpm": float(brief.get("bpm") or brief.get("tempo_proxy_bpm") or 120),
        "cycleLength": int(meter.get("cycle_length") or 8),
        "accentResidues": list(meter.get("accent_residues") or []),
        "euclidean": [int(eu[0]), int(eu[1])] if len(eu) >= 2 else [3, 8],
        "spectral": {
            "centroid": float(spectral.get("centroid_mu") or 0.5),
            "centroidSigma": float(spectral.get("centroid_sigma") or 0.1),
            "roughnessMax": float(spectral.get("roughness_max") or 0.5),
            "inharmonicity": float(spectral.get("inharmonicity") or 0),
        },
        "form": {
            "nodes": list(form.get("nodes") or []),
            "edges": list(form.get("edges") or []),
        },
        "eventCount": int(events.get("event_count") or len(event_list)),
        "formPath": list(form_path.get("path") or form.get("nodes") or []),
        "loopSec": events.get("loop_sec"),
        "rhythmRule": law.get("rhythm_rule"),
        "nearestKnown": prov.get("nearest_known"),
        "noveltyDistance": prov.get("novelty_distance"),
    }


def write_site_catalog() -> int:
    """Publication catalog the live site reads (no web rebuild required)."""
    laws: list[dict] = []
    exp_root = DATA / "experiments"
    if exp_root.is_dir():
        for d in sorted(exp_root.iterdir()):
            if not d.is_dir():
                continue
            law = _load_json(d / "LAW.json", None)
            if isinstance(law, dict) and law.get("digest"):
                laws.append(law)
    (DATA / "catalog.json").write_text(
        json.dumps(laws, indent=2), encoding="utf-8"
    )
    print(f"catalog.json species={len(laws)}")
    return len(laws)


def try_render_covers() -> None:
    """Genome-wheel PNGs. If Node/sharp is missing, the site lazy-renders via /api/cover."""
    write_site_catalog()
    tsx = GENUSNS / "packages" / "pipeline" / "src" / "cli" / "generate-covers.ts"
    cmds = (
        ["pnpm", "--filter", "@genusns/pipeline", "covers"],
        ["npx", "--yes", "tsx", str(tsx)],
    )
    for cmd in cmds:
        try:
            r = subprocess.run(
                cmd,
                cwd=str(GENUSNS),
                capture_output=True,
                text=True,
                timeout=900,
            )
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            print(f"covers skip {cmd[0]}: {exc}")
            continue
        if r.stdout:
            print(r.stdout[-1500:], flush=True)
        if r.returncode == 0:
            print("covers rendered", flush=True)
            return
        if r.stderr:
            print(r.stderr[-800:], flush=True)
    print("covers: GET /api/cover/<id> will render on first listen")


def sync_approved_species() -> int:
    """Mirror majority-approved compiled packs into data/ so MiniMax + the site can consume them."""
    lab_a = HUMANIZER / ".genus" / "approved"
    lab_c = HUMANIZER / ".genus" / "compiled"
    if not lab_a.is_dir():
        print(f"sync skip: no lab approved dir ({lab_a})")
        write_site_catalog()
        return 0
    dest_a = DATA / "approved"
    dest_a.mkdir(parents=True, exist_ok=True)
    n = 0
    for rec_path in sorted(lab_a.glob("*.json")):
        digest = rec_path.stem
        pack = lab_c / digest
        brief_p = pack / "foundry_brief.json"
        if not brief_p.is_file():
            continue
        shutil.copy2(rec_path, dest_a / rec_path.name)
        rec = _load_json(rec_path, {})
        brief = _load_json(brief_p, {})
        prompt = (brief.get("prompt") or "").strip()
        if not prompt:
            continue
        exp = DATA / "experiments" / digest
        exp.mkdir(parents=True, exist_ok=True)
        shutil.copy2(brief_p, exp / "foundry_brief.json")
        for name in (
            "prompts.json",
            "genre_definition.json",
            "form_path.json",
            "events.json",
            "MANIFEST.json",
            "grid.json",
            "tuning.json",
            "loop_approx.mid",
        ):
            src = pack / name
            if src.is_file():
                shutil.copy2(src, exp / name)
        short = _norm(digest)
        ci = {
            "title": brief.get("title") or f"Genus-{short}",
            "prompt": prompt,
            "duration_ms": max(MIN_MASTER_MS, min(120_000, int(brief.get("duration_ms") or 120_000))),
            "bpm": brief.get("bpm") or brief.get("tempo_proxy_bpm"),
            "key": brief.get("key") or "EDO",
            "structure": brief.get("structure"),
            "digest": digest,
            "approved": True,
        }
        (exp / "COMPOSE_INSTRUCTION.json").write_text(
            json.dumps(ci, indent=2), encoding="utf-8"
        )
        law = _experiment_law(digest, rec, pack)
        (exp / "LAW.json").write_text(json.dumps(law, indent=2), encoding="utf-8")
        n += 1
    write_site_catalog()
    print(f"sync approved+compiled -> experiments: {n}")
    return n


def _find_candidates() -> list[dict]:
    """Approved compiled species with a locked prompt, no usable master yet. Never unapproved."""
    out: list[dict] = []
    for rec in _approved_paths():
        digest = rec.stem
        short = _norm(digest)
        if _has_master(short):
            continue
        locked = _locked_brief(digest)
        if not locked:
            print(f"WAIT {short}: approved but not compiled / no locked prompt")
            continue
        out.append(
            {
                "short": short,
                "digest": digest,
                "prompt": locked["prompt"],
                "title": locked["title"],
                "duration_ms": locked["duration_ms"],
                "bpm": locked["bpm"],
                "key": locked["key"],
                "structure": locked["structure"],
                "instruction_path": locked["instruction_path"],
            }
        )
    return out


def _trim_120(src: Path) -> Path:
    out = src.with_name(src.stem + "_120" + src.suffix)
    for cmd in (
        ["ffmpeg", "-y", "-i", str(src), "-t", "120", "-c", "copy", str(out)],
        ["ffmpeg", "-y", "-i", str(src), "-t", "120", "-b:a", "256k", str(out)],
    ):
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return out
        except (FileNotFoundError, subprocess.CalledProcessError):
            continue
    raise RuntimeError("ffmpeg required to cap masters at 120s")


def _package(short: str, digest: str, master: Path, brief: dict) -> Path:
    pkg = DATA / "packages" / short
    raw = pkg / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    master_dst = pkg / "master.mp3"
    shutil.copy2(master, master_dst)

    cover_src = DATA / "covers" / f"{short.lower()}.png"
    if not cover_src.is_file():
        cover_src = DATA / "READY_FOR_DITTO" / short / "cover.png"
    if cover_src.is_file():
        shutil.copy2(cover_src, pkg / "cover.png")

    exp = DATA / "experiments" / digest
    for name in (
        "LAW.json",
        "COMPOSE_INSTRUCTION.json",
        "foundry_brief.json",
        "prompts.json",
        "MANIFEST.json",
        "genre_definition.json",
        "grid.json",
        "tuning.json",
        "form_path.json",
        "loop_approx.mid",
        "events.json",
    ):
        src = exp / name
        if not src.is_file():
            # provenance / ditto kit
            alt = DATA / "READY_FOR_DITTO" / short / "provenance" / name
            src = alt if alt.is_file() else src
        if src.is_file():
            shutil.copy2(src, raw / name)

    contents = f"GENUSNS_{short} — FULL PACKAGE\nGenus master + provenance.\n"
    forum_derived: list = []
    if forum_lab is not None:
        try:
            forum_derived = forum_lab.attach_forum_to_brief(short, digest, brief)
        except Exception as exc:  # noqa: BLE001
            print(f"forum attach skip {short}: {exc}")
            forum_derived = list(brief.get("forumDerived") or [])
        for fd in forum_derived:
            title = fd.get("title") or "forum idea"
            url = fd.get("url") or ""
            kind = fd.get("kind") or "process"
            contents += f"\nForum-derived ({kind}): {title}\n"
            if url:
                contents += f"  {url}\n"
            if fd.get("note"):
                contents += f"  Note: {fd['note']}\n"
    (pkg / "CONTENTS.txt").write_text(contents, encoding="utf-8")
    meta = {
        "schema": "genusns.buyer-package.v1",
        "canonical_id": f"GENUS//NS:{short}",
        "digest": digest,
        "generation": {
            "provider": "minimax",
            "prompt": brief["prompt"],
            "duration_ms": brief.get("duration_ms"),
            "instrumental": True,
            "host": "contabo-autonomy",
        },
    }
    if forum_derived:
        meta["forumDerived"] = forum_derived
    (pkg / "PACKAGE.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    zip_path = pkg / f"GENUSNS_{short}.zip"
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(master_dst, arcname="master.mp3")
        if (pkg / "cover.png").is_file():
            zf.write(pkg / "cover.png", arcname="cover.png")
        zf.write(pkg / "CONTENTS.txt", arcname="CONTENTS.txt")
        zf.write(pkg / "PACKAGE.json", arcname="PACKAGE.json")
        for f in raw.iterdir():
            if f.is_file():
                zf.write(f, arcname=f"raw/{f.name}")
    return zip_path


def _stage_master(short: str, master: Path) -> None:
    audio_dir = DATA / "READY_FOR_DITTO" / short / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(master, audio_dir / "master.mp3")
    masters = DATA / "masters"
    masters.mkdir(parents=True, exist_ok=True)
    shutil.copy2(master, masters / f"{short.lower()}.mp3")


def _enqueue(short: str, digest: str, zip_path: Path) -> None:
    path = DATA / "backlog.json"
    bl = _load_json(path, {"schema": "genusns.backlog.v1", "queue": []})
    queue = bl.setdefault("queue", [])
    if any(_norm(e.get("id", "")) == short for e in queue):
        return
    if short in _published_ids():
        return
    queue.append(
        {
            "id": short,
            "digest": digest,
            "readyAt": _utc_now(),
            "packageZip": str(zip_path),
        }
    )
    path.write_text(json.dumps(bl, indent=2), encoding="utf-8")


def generate_pending(*, dry_run: bool = False, limit: int = 24) -> list[str]:
    """MiniMax consumes every approved compiled species that still lacks a master."""
    candidates = _find_candidates()
    print(f"pending approved without master: {len(candidates)} (limit={limit})")
    done: list[str] = []
    for c in candidates[: max(1, limit)]:
        try:
            short = generate_one(dry_run=dry_run, candidate=c)
            if short:
                done.append(short)
        except Exception as exc:  # noqa: BLE001
            print(f"FAIL {c['short']}: {exc}")
            continue
    print(f"generated {len(done)} approved species")
    return done


def generate_one(*, dry_run: bool = False, candidate: dict | None = None) -> str | None:
    c = candidate or (_find_candidates()[0] if _find_candidates() else None)
    if not c:
        print("no generate candidates (no approved-without-master, or missing locked prompt)")
        return None
    print(f"GENERATE {c['short']} digest={c['digest']} (approved)")
    print(f"prompt[:120]={c['prompt'][:120]!r}")
    if dry_run:
        return c["short"]

    audio = generate_instrumental_mp3(prompt=c["prompt"], title=c["title"])
    if len(audio) < MIN_MASTER_BYTES:
        raise RuntimeError(
            f"MiniMax stub too short ({len(audio)} bytes); refuse < {MIN_MASTER_BYTES}"
        )
    tmp_dir = DATA / "_gen_tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    raw_path = tmp_dir / f"{c['short']}.mp3"
    raw_path.write_bytes(audio)
    trimmed = _trim_120(raw_path)
    _stage_master(c["short"], trimmed)
    zip_path = _package(c["short"], c["digest"], trimmed, c)
    _enqueue(c["short"], c["digest"], zip_path)
    log = DATA / "generation_log.jsonl"
    with log.open("a", encoding="utf-8") as fh:
        fh.write(
            json.dumps(
                {
                    "ok": True,
                    "short": c["short"],
                    "digest": c["digest"],
                    "zip": str(zip_path),
                    "host": "contabo-autonomy",
                    "at": _utc_now(),
                },
                ensure_ascii=False,
            )
            + "\n"
        )
    print(f"OK {c['short']} -> {zip_path}")
    return c["short"]


def sync_stripe() -> None:
    script = SCRIPT_DIR / "sync_stripe_catalog.py"
    if not script.is_file():
        return
    env = os.environ.copy()
    env["GENUSNS_DATA_DIR"] = str(DATA)
    try:
        subprocess.run(
            [sys.executable, str(script)],
            cwd=str(GENUSNS),
            env=env,
            check=False,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"stripe catalog skip: {exc}")


def publish_one() -> None:
    cmd = [sys.executable, str(SCRIPT_DIR / "publish_daily.py")]
    env = os.environ.copy()
    env["GENUSNS_DATA_DIR"] = str(DATA)
    # publish_daily resolves GENUSNS from script parent; data is under GENUSNS/data
    # Override by ensuring DATA path: patch via env read in publish_daily — currently uses GENUSNS/data.
    subprocess.run(cmd, check=False, cwd=str(GENUSNS), env=env)


def main() -> int:
    try:
        sys.stdout.reconfigure(line_buffering=True)
        sys.stderr.reconfigure(line_buffering=True)
    except Exception:
        pass
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--publish-only", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--one",
        action="store_true",
        help="Generate a single pending approved species (default: all pending)",
    )
    ap.add_argument(
        "--limit",
        type=int,
        default=int(os.environ.get("GENUSNS_GENERATE_MAX", "24")),
        help="Max MiniMax jobs this run (approved without master only)",
    )
    args = ap.parse_args()
    _load_dotenv(GENUSNS / ".env")
    _load_dotenv(HUMANIZER / ".env")
    print(f"DATA={DATA}")
    print(f"HUMANIZER={HUMANIZER}")
    if forum_lab is not None and not args.dry_run:
        try:
            # Refresh public lab board → guidance agents can use (prompts stay locked).
            forum_lab.ingest(absorb=True)
        except Exception as exc:  # noqa: BLE001
            print(f"forum ingest skip: {exc}")
    if not args.publish_only:
        sync_approved_species()
        try_render_covers()
        if args.one:
            generate_one(dry_run=args.dry_run)
        else:
            generate_pending(dry_run=args.dry_run, limit=args.limit)
    if not args.dry_run:
        os.environ["GENUSNS_DATA_DIR"] = str(DATA)
        publish_one()
        sync_stripe()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
