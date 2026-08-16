#!/usr/bin/env python3
"""
smartlinks_sync.py — harvest Ditto smart-links from the StartMail mailbox and
attach each one to its song in the GENUS//NS catalogue.

See data/smartlinks/README.md (or scripts/smartlinks/README.md).
"""
from __future__ import annotations

import argparse
import datetime as dt
import email
import imaplib
import json
import os
import re
import sys
from email.header import decode_header, make_header
from pathlib import Path

HERE = Path(__file__).resolve().parent
# Prefer sibling config; fall back to data/smartlinks if this lives under scripts/
CONFIG_CANDIDATES = [
    HERE / "smartlinks_config.json",
    HERE.parent.parent / "data" / "smartlinks" / "smartlinks_config.json",
    HERE.parent / "smartlinks" / "smartlinks_config.json",
]

DEFAULTS = {
    "imap_host": "imap.startmail.com",
    "imap_port": 993,
    "imap_user": "neuralsyntax@0dblabs.com",
    "mailbox": "INBOX",
    "sender_contains": ["dittomusic.com", "ditto.fm", "@ditto"],
    "subject_contains": ["ditto", "live", "release", "smart link", "genus"],
    "link_hosts": [
        "ditto.fm",
        "found.ee",
        "ffm.to",
        "hypeddit",
        "distrokid",
        "dittomusic.com/l/",
        "li.sten.to",
        "linktr.ee",
    ],
    # Relative to the config file's directory (data/smartlinks → parent = data/)
    "data_dir": "..",
    "catalog_file": "catalog.json",
    "published_file": "published.json",
    "field_name": "smartLink",
    "id_regex": r"\b([0-9A-Fa-f]{6})\b",
    "since_days": 60,
}


def log(m: str) -> None:
    print(f"[smartlinks] {m}", flush=True)


def cfg() -> dict:
    c = dict(DEFAULTS)
    for path in CONFIG_CANDIDATES:
        if path.is_file():
            c.update(json.loads(path.read_text("utf-8")))
            c["_config_path"] = str(path)
            break
    return c


def data_root(c: dict) -> Path:
    env = os.environ.get("GENUSNS_DATA_DIR")
    if env:
        return Path(env).resolve()
    cfg_path = Path(c.get("_config_path") or HERE / "smartlinks_config.json")
    return (cfg_path.parent / c.get("data_dir", "..")).resolve()


def load_whitelist(c: dict, root: Path) -> set[str]:
    ids: set[str] = set()
    catalog = root / c["catalog_file"]
    if catalog.is_file():
        try:
            doc = json.loads(catalog.read_text("utf-8"))
            for e in doc if isinstance(doc, list) else doc.get("entries", []):
                cid = e.get("canonicalId", "")
                gid = cid.split(":")[-1] if ":" in cid else (e.get("id") or e.get("digest", "")[:6])
                if gid:
                    ids.add(str(gid).upper()[:6])
        except json.JSONDecodeError:
            log(f"WARN: bad catalog JSON at {catalog}")
    else:
        log(f"WARN: catalog not found at {catalog}")

    published = root / c["published_file"]
    if published.is_file():
        try:
            doc = json.loads(published.read_text("utf-8"))
            for e in doc if isinstance(doc, list) else doc.get("entries", []):
                gid = str(e.get("id") or "").upper()
                if len(gid) == 6:
                    ids.add(gid)
        except json.JSONDecodeError:
            pass
    return {i for i in ids if re.fullmatch(r"[0-9A-F]{6}", i)}


def _decode(s) -> str:
    try:
        return str(make_header(decode_header(s or "")))
    except Exception:
        return s or ""


def _body_text(msg) -> str:
    parts = []
    if msg.is_multipart():
        for p in msg.walk():
            ct = p.get_content_type()
            if ct in ("text/plain", "text/html"):
                try:
                    parts.append(
                        p.get_payload(decode=True).decode(
                            p.get_content_charset() or "utf-8", "replace"
                        )
                    )
                except Exception:
                    pass
    else:
        try:
            parts.append(
                msg.get_payload(decode=True).decode(
                    msg.get_content_charset() or "utf-8", "replace"
                )
            )
        except Exception:
            pass
    return "\n".join(parts)


def extract_link(text: str, link_hosts: list[str]) -> str | None:
    urls = re.findall(r"https?://[^\s\"'<>\)\]]+", text)
    urls = [u.rstrip(".,);]") for u in urls]
    for host in link_hosts:
        for u in urls:
            if host in u:
                return u
    return None


def extract_ids(text: str, id_regex: str, whitelist: set[str]) -> list[str]:
    found = [m.upper() for m in re.findall(id_regex, text)]
    seen: set[str] = set()
    out: list[str] = []
    for gid in found:
        if gid in whitelist and gid not in seen:
            seen.add(gid)
            out.append(gid)
    return out


def is_ditto(from_hdr: str, subj: str, c: dict) -> bool:
    f, s = from_hdr.lower(), subj.lower()
    if any(tok in f for tok in c["sender_contains"]):
        return True
    return any(tok in s for tok in c["subject_contains"])


def parse_message(raw: bytes, c: dict, whitelist: set[str]) -> list[dict]:
    msg = email.message_from_bytes(raw)
    frm = _decode(msg.get("From"))
    subj = _decode(msg.get("Subject"))
    if not is_ditto(frm, subj, c):
        return []
    text = subj + "\n" + _body_text(msg)
    url = extract_link(text, c["link_hosts"])
    if not url:
        return []
    ids = extract_ids(text, c["id_regex"], whitelist)
    if not ids:
        ids = extract_ids(subj, c["id_regex"], whitelist)
    return [{"id": gid, "url": url, "subject": subj} for gid in ids]


def harvest_imap(c: dict, whitelist: set[str]) -> list[dict]:
    pw = os.environ.get("GENUSNS_IMAP_PASS")
    if not pw:
        sys.exit(
            "Set GENUSNS_IMAP_PASS (StartMail mailbox / app password) in the environment first."
        )
    log(f"IMAP {c['imap_user']}@{c['imap_host']}:{c['imap_port']} / {c['mailbox']}")
    M = imaplib.IMAP4_SSL(c["imap_host"], int(c["imap_port"]), timeout=60)
    M.login(c["imap_user"], pw)
    M.select(c["mailbox"], readonly=True)
    since = (dt.date.today() - dt.timedelta(days=int(c["since_days"]))).strftime("%d-%b-%Y")
    # Targeted SEARCH — full SINCE fetch on a busy inbox hangs for hours.
    num_set: set[bytes] = set()
    searches = [
        f'(FROM "dittomusic.com" SINCE {since})',
        f'(FROM "ditto.fm" SINCE {since})',
        f'(FROM "noreply@ditto" SINCE {since})',
        f'(SUBJECT "smart link" SINCE {since})',
        f'(SUBJECT "Smart Link" SINCE {since})',
        f'(SUBJECT "is live" SINCE {since})',
        f'(SUBJECT "your release" SINCE {since})',
        f'(TEXT "ditto.fm" SINCE {since})',
        f'(TEXT "found.ee" SINCE {since})',
    ]
    for q in searches:
        try:
            typ, data = M.search(None, q)
        except Exception as exc:  # noqa: BLE001
            log(f"search skip {q!r}: {exc}")
            continue
        if typ == "OK" and data and data[0]:
            for num in data[0].split():
                num_set.add(num)
    log(f"IMAP candidates: {len(num_set)} messages")
    out: list[dict] = []
    for num in sorted(num_set, key=lambda x: int(x)):
        t, d = M.fetch(num, "(RFC822)")
        if t == "OK" and d and d[0]:
            out.extend(parse_message(d[0][1], c, whitelist))
    M.logout()
    return out


def harvest_eml(path: Path, c: dict, whitelist: set[str]) -> list[dict]:
    files = sorted(path.glob("*.eml")) if path.is_dir() else [path]
    out: list[dict] = []
    for f in files:
        out.extend(parse_message(f.read_bytes(), c, whitelist))
    return out


def load_map(path: Path) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text("utf-8"))
        except Exception:
            pass
    return {}


def inject(json_path: Path, id_key: str, field: str, mapping: dict, force: bool) -> int:
    if not json_path.exists():
        log(f"skip {json_path.name}: not found")
        return 0
    doc = json.loads(json_path.read_text("utf-8"))
    entries = doc if isinstance(doc, list) else doc.get("entries", [])
    n = 0
    for e in entries:
        raw = e.get(id_key, "")
        gid = (raw.split(":")[-1] if ":" in str(raw) else raw).upper()
        if gid in mapping:
            url = mapping[gid]["url"]
            if e.get(field) and not force and e[field] != url:
                continue
            if e.get(field) != url:
                e[field] = url
                n += 1
    json_path.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8")
    return n


def probe_ditto_fm(gid: str, timeout: int = 12) -> str | None:
    """If https://ditto.fm/<id> is live, return that URL."""
    import urllib.error
    import urllib.request

    url = f"https://ditto.fm/{gid.lower()}"
    req = urllib.request.Request(
        url,
        method="HEAD",
        headers={"User-Agent": "GenusNS-smartlinks/1.0 (+https://genusns.com)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if 200 <= getattr(resp, "status", 200) < 400:
                return url
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303, 307, 308):
            return url
    except Exception:
        pass
    # Some hosts reject HEAD — try GET range
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "GenusNS-smartlinks/1.0 (+https://genusns.com)",
            "Range": "bytes=0-0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if 200 <= getattr(resp, "status", 200) < 400:
                return url
    except urllib.error.HTTPError as e:
        if e.code in (206, 301, 302, 303, 307, 308):
            return url
    except Exception:
        pass
    return None


def write_pending(root: Path, published_ids: set[str], mapping: dict) -> Path:
    pending = []
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for gid in sorted(published_ids):
        if gid in mapping:
            continue
        pending.append(
            {
                "id": gid,
                "expectedUrl": f"https://ditto.fm/{gid.lower()}",
                "status": "awaiting_ditto_smartlink",
            }
        )
    path = root / "smartlinks_pending.json"
    doc = {
        "schema": "genusns.smartlinks-pending.v1",
        "note": (
            "Published on genusns.com but no harvested/probed smart-link yet. "
            "Cowork: finish Ditto distribution / create smart-link; sync will pick it up. "
            "Site shows PLATFORMS COMING UP until then."
        ),
        "updatedAt": now,
        "pending": pending,
    }
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def load_published_ids(root: Path, c: dict) -> set[str]:
    path = root / c["published_file"]
    ids: set[str] = set()
    if not path.is_file():
        return ids
    try:
        doc = json.loads(path.read_text("utf-8"))
        for e in doc if isinstance(doc, list) else doc.get("entries", []):
            gid = str(e.get("id") or "").upper()
            if re.fullmatch(r"[0-9A-F]{6}", gid):
                ids.add(gid)
    except json.JSONDecodeError:
        pass
    return ids


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Harvest Ditto smart-links -> attach to GENUS//NS catalogue."
    )
    ap.add_argument("--dry-run", action="store_true", help="parse + report, write nothing")
    ap.add_argument("--list", action="store_true", help="print current smartlinks.json and exit")
    ap.add_argument("--from-eml", metavar="PATH", help="parse .eml file(s) instead of IMAP")
    ap.add_argument("--force", action="store_true", help="overwrite an existing smartLink field")
    a = ap.parse_args()
    c = cfg()
    root = data_root(c)
    map_path = root / "smartlinks.json"

    if a.list:
        print(json.dumps(load_map(map_path), indent=2))
        return

    whitelist = load_whitelist(c, root)
    log(f"data={root}")
    log(f"catalogue IDs known: {len(whitelist)}")

    captured = (
        harvest_eml(Path(a.from_eml), c, whitelist)
        if a.from_eml
        else harvest_imap(c, whitelist)
    )
    log(f"captured {len(captured)} (id,url) pairs from mail")

    mapping = load_map(map_path)
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    added = 0
    for r in captured:
        cur = mapping.get(r["id"])
        if not cur or cur.get("url") != r["url"]:
            mapping[r["id"]] = {
                "url": r["url"],
                "source": "ditto-email",
                "subject": r["subject"],
                "capturedAt": now,
            }
            added += 1
    log(f"{added} new/changed links; {len(mapping)} total in mapping")

    for gid in sorted(mapping):
        log(f"  {gid} -> {mapping[gid]['url']}")

    published_ids = load_published_ids(root, c)
    # Promote live ditto.fm/<id> pages even before the email arrives
    probed = 0
    for gid in sorted(published_ids):
        if gid in mapping:
            continue
        url = probe_ditto_fm(gid)
        if not url:
            continue
        mapping[gid] = {
            "url": url,
            "source": "ditto-fm-probe",
            "subject": "probed live ditto.fm slug",
            "capturedAt": now,
        }
        probed += 1
        log(f"probe live {gid} -> {url}")
    if probed:
        log(f"probed {probed} live ditto.fm links")

    if a.dry_run:
        log("dry-run: nothing written.")
        return

    root.mkdir(parents=True, exist_ok=True)
    map_path.write_text(json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8")
    n1 = inject(root / c["catalog_file"], "canonicalId", c["field_name"], mapping, a.force)
    n2 = inject(root / c["published_file"], "id", c["field_name"], mapping, a.force)
    pending_path = write_pending(root, published_ids, mapping)
    log(f"wrote {map_path.name}; set {c['field_name']} on {n1} catalog + {n2} published entries")
    log(f"pending platforms: {len(json.loads(pending_path.read_text('utf-8')).get('pending', []))} -> {pending_path.name}")
    log("done. commit + deploy the data files for the site to show the links.")


if __name__ == "__main__":
    main()
