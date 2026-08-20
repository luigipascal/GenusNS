#!/usr/bin/env python3
"""
Create/update a live Stripe Product + Price for one newly published species.

Existing published tracks already sell via Checkout `price_data` and the
success-page session lookup — no webhook required. This script is for
connecting *new* daily publishes one id at a time.

Usage:
  python scripts/sync_stripe_catalog.py --ids 5E8574
"""

from __future__ import annotations

import json
import os
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
GENUSNS = SCRIPT_DIR.parent
DATA = Path(os.environ.get("GENUSNS_DATA_DIR") or (GENUSNS / "data")).resolve()
CATALOG_FILE = DATA / "stripe_catalog.json"
SITE = "https://genusns.com"
PRICE_PENCE = int(os.environ.get("STRIPE_TRACK_PRICE_GBP_PENCE") or "199")
CTX = ssl.create_default_context()


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


def _key() -> str:
    key = os.environ.get("STRIPE_SECRET_KEY") or os.environ.get("STRIPE_RESTRICTED_KEY")
    if not key:
        raise SystemExit("STRIPE_SECRET_KEY not set")
    if not key.startswith("sk_live_") and not key.startswith("rk_live_"):
        print("WARNING: not a live key — aborting (this catalog is for genusns.com live sales)")
        raise SystemExit(2)
    return key


def _req(method: str, path: str, fields: dict | None = None) -> dict:
    url = "https://api.stripe.com/v1" + path
    data = None
    headers = {"Authorization": f"Bearer {_key()}"}
    if fields is not None:
        data = urllib.parse.urlencode(fields, doseq=True).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        raise RuntimeError(f"Stripe {method} {path} -> {exc.code}: {body[:800]}") from exc


def _published_ids(only: list[str] | None) -> list[dict]:
    pub = json.loads((DATA / "published.json").read_text(encoding="utf-8"))
    entries = pub.get("entries") or []
    if only:
        want = {x.upper()[:6] for x in only}
        entries = [e for e in entries if str(e.get("id", "")).upper()[:6] in want]
    return entries


def _load_catalog() -> dict:
    if CATALOG_FILE.is_file():
        return json.loads(CATALOG_FILE.read_text(encoding="utf-8"))
    return {"schema": "genusns.stripe-catalog.v1", "currency": "gbp", "unit_amount": PRICE_PENCE, "products": {}}


def ensure_product(short: str, digest: str) -> dict:
    pid = f"genusns_{short.lower()}"
    lookup = f"genusns_{short.lower()}_gbp"
    name = f"GENUS//NS — {short} full package"
    description = (
        f"GENUS//NS:{short} full package (one price): Genus master ≤2min, cover.png, "
        "LAW.json, compose instruction, foundry brief + prompts, loop MIDI, "
        "grid/tuning/form artefacts, manifest. Not audio-only."
    )
    fields = {
        "name": name,
        "description": description,
        "url": f"{SITE}/g/{short.lower()}",
        "shippable": "false",
        "images[0]": f"{SITE}/api/cover/{short.lower()}",
        "metadata[project]": "genusns",
        "metadata[trackId]": short.lower(),
        "metadata[digest]": digest,
        "metadata[canonicalId]": f"GENUS//NS:{short}",
        "default_price_data[currency]": "gbp",
        "default_price_data[unit_amount]": str(PRICE_PENCE),
        "default_price_data[metadata][project]": "genusns",
        "default_price_data[metadata][trackId]": short.lower(),
        "expand[]": "default_price",
    }
    try:
        prod = _req("POST", "/products", {**fields, "id": pid})
        created = True
    except RuntimeError as exc:
        if "already exists" not in str(exc).lower() and "resource_already_exists" not in str(exc).lower():
            raise
        prod = _req(
            "POST",
            f"/products/{pid}",
            {
                "name": name,
                "description": description,
                "url": f"{SITE}/g/{short.lower()}",
                "images[0]": f"{SITE}/api/cover/{short.lower()}",
                "metadata[project]": "genusns",
                "metadata[trackId]": short.lower(),
                "metadata[digest]": digest,
                "metadata[canonicalId]": f"GENUS//NS:{short}",
                "expand[]": "default_price",
            },
        )
        created = False

    price_id = prod.get("default_price")
    if isinstance(price_id, dict):
        price_id = price_id.get("id")
    if not price_id:
        # Product existed without a default price — create one.
        price = _req(
            "POST",
            "/prices",
            {
                "product": pid,
                "currency": "gbp",
                "unit_amount": str(PRICE_PENCE),
                "lookup_key": lookup,
                "transfer_lookup_key": "true",
                "metadata[project]": "genusns",
                "metadata[trackId]": short.lower(),
            },
        )
        price_id = price["id"]
        _req("POST", f"/products/{pid}", {"default_price": price_id})
    else:
        # Attach a stable lookup_key when missing.
        try:
            _req(
                "POST",
                f"/prices/{price_id}",
                {"lookup_key": lookup, "transfer_lookup_key": "true"},
            )
        except RuntimeError:
            pass

    rec = {
        "id": short,
        "digest": digest,
        "productId": pid if prod.get("id") == pid else prod.get("id"),
        "priceId": price_id,
        "lookupKey": lookup,
        "unitAmount": PRICE_PENCE,
        "currency": "gbp",
        "url": f"{SITE}/g/{short.lower()}",
        "created": created,
    }
    print(f"{'CREATE' if created else 'UPDATE'} {short} product={rec['productId']} price={price_id}")
    return rec


def main() -> int:
    _load_dotenv(GENUSNS / ".env")
    args = [a for a in sys.argv[1:] if a != "--ids"]
    only = None
    if "--ids" in sys.argv:
        idx = sys.argv.index("--ids")
        raw = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else ""
        only = [x.strip() for x in raw.split(",") if x.strip()]
    elif args:
        only = [x.strip() for x in args[0].split(",") if x.strip()]

    entries = _published_ids(only)
    if not entries:
        print("no published entries to sync")
        return 0

    catalog = _load_catalog()
    catalog["unit_amount"] = PRICE_PENCE
    products = catalog.setdefault("products", {})
    n = 0
    for e in entries:
        short = str(e.get("id", "")).upper()[:6]
        digest = str(e.get("digest") or "")
        rec = ensure_product(short, digest)
        products[short] = rec
        n += 1
    CATALOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_FILE.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    print(f"synced={n} wrote={CATALOG_FILE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
