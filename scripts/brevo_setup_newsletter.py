#!/usr/bin/env python3
"""
Provision Brevo folder + contact list for GENUS//NS newsletter.

Auth:
  Set BREVO_API_KEY in the environment or in repo-root .env
  (Brevo -> SMTP & API -> API keys). Never commit the key.

Preferred campaign/newsletter sender: genusns@genusns.com
  (verify genusns.com in Brevo Senders if missing; list creation does not require it).

Usage:
  python scripts/brevo_setup_newsletter.py
  BREVO_API_KEY=xkeysib-… python scripts/brevo_setup_newsletter.py

Idempotent: reuses folder GENUS//NS and list GENUS//NS Newsletter when present.
Writes data/_brevo_newsletter.json and prints Coolify-ready env lines.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
GENUSNS = SCRIPT_DIR.parent
DATA = Path(os.environ.get("GENUSNS_DATA_DIR") or (GENUSNS / "data")).resolve()

API_BASE = "https://api.brevo.com/v3"
FOLDER_NAME = "GENUS//NS"
LIST_NAME = "GENUS//NS Newsletter"
PREFERRED_SENDER = "genusns@genusns.com"
OUT_PATH = DATA / "_brevo_newsletter.json"


def _load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        key, _, val = s.partition("=")
        key = key.strip()
        if key in os.environ:
            continue
        os.environ[key] = val.strip().strip('"').strip("'")


def _api_key() -> str:
    _load_dotenv(GENUSNS / ".env")
    _load_dotenv(GENUSNS / ".env.local")
    key = (os.environ.get("BREVO_API_KEY") or "").strip()
    if not key:
        print(
            "BREVO_API_KEY not set. Add it to the environment or GenusNS/.env "
            "(Brevo -> SMTP & API -> API keys), then re-run.",
            file=sys.stderr,
        )
        raise SystemExit(2)
    return key


def _request(method: str, path: str, key: str, body: dict | None = None) -> dict | list | None:
    url = API_BASE + path
    data = None
    headers = {
        "api-key": key,
        "Accept": "application/json",
        # Cloudflare blocks urllib's default User-Agent on some Brevo routes.
        "User-Agent": "GenusNS-brevo-setup/1.0 (+https://genusns.com)",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read()
            if not raw:
                return None
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")[:800]
        raise RuntimeError(f"{method} {path} -> HTTP {exc.code}: {err_body}") from exc


def _paginate_get(path: str, key: str, collection: str, limit: int = 50) -> list:
    items: list = []
    offset = 0
    while True:
        sep = "&" if "?" in path else "?"
        page = _request("GET", f"{path}{sep}limit={limit}&offset={offset}", key)
        if not isinstance(page, dict):
            break
        batch = page.get(collection) or []
        items.extend(batch)
        count = int(page.get("count") or len(items))
        offset += limit
        if offset >= count or not batch:
            break
    return items


def _find_or_create_folder(key: str) -> int:
    folders = _paginate_get("/contacts/folders", key, "folders")
    for f in folders:
        if str(f.get("name") or "") == FOLDER_NAME:
            fid = int(f["id"])
            print(f"Reuse folder id={fid} name={FOLDER_NAME!r}")
            return fid
    created = _request("POST", "/contacts/folders", key, {"name": FOLDER_NAME})
    assert isinstance(created, dict)
    fid = int(created["id"])
    print(f"Created folder id={fid} name={FOLDER_NAME!r}")
    return fid


def _find_or_create_list(key: str, folder_id: int) -> int:
    # Prefer lists inside the target folder (cheaper + scoped)
    lists = _paginate_get(f"/contacts/folders/{folder_id}/lists", key, "lists")
    for lst in lists:
        if str(lst.get("name") or "") == LIST_NAME:
            lid = int(lst["id"])
            print(f"Reuse list id={lid} name={LIST_NAME!r} (folder {folder_id})")
            return lid
    # Also scan all lists in case it exists under another folder
    all_lists = _paginate_get("/contacts/lists", key, "lists")
    for lst in all_lists:
        if str(lst.get("name") or "") == LIST_NAME:
            lid = int(lst["id"])
            print(f"Reuse list id={lid} name={LIST_NAME!r} (existing elsewhere)")
            return lid
    created = _request(
        "POST",
        "/contacts/lists",
        key,
        {"name": LIST_NAME, "folderId": folder_id},
    )
    assert isinstance(created, dict)
    lid = int(created["id"])
    print(f"Created list id={lid} name={LIST_NAME!r} folderId={folder_id}")
    return lid


def _sender_status(key: str) -> dict:
    """Return preferred-sender status; do not fail provisioning if missing."""
    out: dict = {
        "preferred": PREFERRED_SENDER,
        "found": False,
        "active": None,
        "ips": None,
        "note": None,
    }
    try:
        payload = _request("GET", "/senders", key)
    except RuntimeError as exc:
        out["note"] = f"GET /senders failed: {exc}"
        return out
    senders = []
    if isinstance(payload, dict):
        senders = payload.get("senders") or []
    pref = PREFERRED_SENDER.lower()
    match = None
    for s in senders:
        email = str(s.get("email") or "").lower()
        if email == pref:
            match = s
            break
    if not match:
        out["note"] = (
            f"{PREFERRED_SENDER} not in Brevo senders - "
            "verify genusns.com DNS in Brevo (Senders / Domains) before campaigns."
        )
        return out
    out["found"] = True
    out["active"] = match.get("active")
    out["ips"] = match.get("ips")
    # Brevo sometimes nests verification under ips[].
    verified_flags = []
    for ip in match.get("ips") or []:
        if isinstance(ip, dict) and "verified" in ip:
            verified_flags.append(bool(ip.get("verified")))
    if verified_flags:
        out["domain_verified"] = all(verified_flags)
    else:
        out["domain_verified"] = match.get("verified")
    if out.get("domain_verified") is False or out.get("domain_verified") is None:
        out["note"] = (
            f"Sender {PREFERRED_SENDER} present; confirm genusns.com domain "
            "verification in Brevo UI before sending campaigns."
        )
    else:
        out["note"] = f"Sender {PREFERRED_SENDER} ready."
    return out


def main() -> int:
    key = _api_key()
    account = _request("GET", "/account", key)
    assert isinstance(account, dict)
    email = account.get("email") or "?"
    company = account.get("companyName") or "?"
    print(f"Account OK: {email} ({company})")

    folder_id = _find_or_create_folder(key)
    list_id = _find_or_create_list(key, folder_id)
    sender = _sender_status(key)

    record = {
        "folderId": folder_id,
        "listId": list_id,
        "folderName": FOLDER_NAME,
        "listName": LIST_NAME,
        "preferredSender": PREFERRED_SENDER,
        "sender": sender,
        "accountEmail": email,
        "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    DATA.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH}")
    note = sender.get("note") or ""
    print(f"Sender: {note}")

    print()
    print("Coolify env (BREVO_API_KEY should already be set):")
    print(f"BREVO_NEWSLETTER_LIST_ID={list_id}")
    print("# optional: BREVO_FROM_EMAIL=genusns@genusns.com")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
