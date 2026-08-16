#!/usr/bin/env python3
"""
GENUS//NS lab forum loop — ingest public AIgents Forum ideas, let agents absorb
them into experiment *process* (never rewrite locked compose prompts), and credit
every forum-derived application in the weekly newsletter.

Forum: https://aigents.berta.one/forum/genus-ns-lab

Commands:
  python scripts/forum_lab.py ingest [--absorb]
  python scripts/forum_lab.py absorb
  python scripts/forum_lab.py apply --idea ID --genome HEX [--kind process|presentation|packaging] [--note "..."]
  python scripts/forum_lab.py context
  python scripts/forum_lab.py refine --genome HEX [--digest DIGEST]   # soft auto-link for packaging
"""

from __future__ import annotations

import argparse
import html as html_lib
import json
import os
import re
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
GENUSNS = SCRIPT_DIR.parent if SCRIPT_DIR.name == "scripts" else SCRIPT_DIR.parent
DATA = Path(os.environ.get("GENUSNS_DATA_DIR") or (GENUSNS / "data")).resolve()

FORUM_URL = "https://aigents.berta.one/forum/genus-ns-lab"
FORUM_ORIGIN = "https://aigents.berta.one"
FORUM_LABEL = "GENUS//NS AIgents Forum"
UA = "GenusNS-forum-lab/1.0 (+https://genusns.com)"

IDEAS_PATH = DATA / "forum_ideas.json"
GUIDANCE_PATH = DATA / "lab_guidance.json"
CONTEXT_DIR = DATA / "agent_context"
CONTEXT_MD = CONTEXT_DIR / "FORUM.md"

SCHEMA = "genusns.forum-ideas.v1"
GUIDANCE_SCHEMA = "genusns.lab-guidance.v1"

THEME_RULES: list[tuple[str, re.Pattern[str], str]] = [
    (
        "falsifiability",
        re.compile(r"falsif|disprove|null hypothesis|holdout|criteria", re.I),
        "Prefer claims that can be disproved (boundaries, holdouts, null tests) over vibe labels.",
    ),
    (
        "provenance",
        re.compile(r"provenance|type specimen|audit|genome-to-species|claim", re.I),
        "Keep genome→species mapping auditable; stamp provenance when process choices change.",
    ),
    (
        "taxonomy",
        re.compile(r"taxonom|taxon|genre boundar|classification|look-alike|naming", re.I),
        "Treat genre/taxon names as falsifiable boundaries, not branding alone.",
    ),
    (
        "silence",
        re.compile(r"silence|pause|unclassified|unsaid", re.I),
        "Silence/pause can be a taxonomic feature — do not discard negative space in form notes.",
    ),
    (
        "decipherment",
        re.compile(r"linear[- ]?[ab]|decipher|phonetic|sign\b|atom", re.I),
        "Borrow decipherment discipline: test labels against holdout prediction, not post-hoc story.",
    ),
    (
        "authorship",
        re.compile(r"author|owns|accountability|who pays|economic", re.I),
        "Keep agent disclosure and imprint credits explicit in packaging and letters.",
    ),
]


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load_ideas() -> dict[str, Any]:
    if IDEAS_PATH.is_file():
        try:
            return json.loads(IDEAS_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {
        "schema": SCHEMA,
        "forumUrl": FORUM_URL,
        "updatedAt": None,
        "ideas": [],
    }


def _save_ideas(doc: dict[str, Any]) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    doc["schema"] = SCHEMA
    doc["forumUrl"] = FORUM_URL
    doc["updatedAt"] = _utc_now()
    IDEAS_PATH.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _clean_title(raw: str) -> str:
    t = html_lib.unescape(re.sub(r"<[^>]+>", "", raw or ""))
    return " ".join(t.split()).strip()


def fetch_forum_html() -> str:
    req = urllib.request.Request(
        FORUM_URL,
        headers={"User-Agent": UA, "Accept": "text/html"},
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_topics(page: str) -> list[dict[str, str]]:
    """Extract topic cards: path, title, optional bot author."""
    out: list[dict[str, str]] = []
    seen: set[str] = set()
    card = re.compile(
        r'href="(/forum/genus-ns-lab/([a-z0-9][a-z0-9\-]*))"\s*>'
        r"(.*?)</a>",
        re.I | re.S,
    )
    for m in card.finditer(page):
        path, slug, blob = m.group(1), m.group(2), m.group(3)
        if path in seen:
            continue
        hm = re.search(r"<h2[^>]*>(.*?)</h2>", blob, re.I | re.S)
        if not hm:
            continue
        title = _clean_title(hm.group(1))
        if not title or len(title) < 8:
            continue
        if "genus//ns lab" in title.lower() and len(title) < 24:
            continue
        author = ""
        am = re.search(
            r"badge-bot[^>]*>.*?-->\s*([^<]+)|badge-bot[^>]*>\s*([^<]+)",
            blob,
            re.I | re.S,
        )
        if am:
            author = _clean_title(am.group(1) or am.group(2) or "")
        seen.add(path)
        out.append(
            {
                "id": slug,
                "path": path,
                "url": FORUM_ORIGIN + path,
                "title": title,
                "author": author,
            }
        )
    return out


def ingest(*, absorb: bool = False) -> dict[str, Any]:
    page = fetch_forum_html()
    topics = parse_topics(page)
    doc = _load_ideas()
    by_id = {i["id"]: i for i in doc.get("ideas", []) if isinstance(i, dict) and i.get("id")}
    now = _utc_now()
    new_count = 0
    for t in topics:
        existing = by_id.get(t["id"])
        if existing:
            existing["title"] = t["title"]
            existing["url"] = t["url"]
            existing["path"] = t["path"]
            if t.get("author"):
                existing["author"] = t["author"]
            existing["lastSeenAt"] = now
        else:
            new_count += 1
            by_id[t["id"]] = {
                "id": t["id"],
                "title": t["title"],
                "url": t["url"],
                "path": t["path"],
                "author": t.get("author") or "",
                "firstSeenAt": now,
                "lastSeenAt": now,
                "status": "open",
                "themes": [],
                "applications": [],
            }
    doc["ideas"] = sorted(
        by_id.values(),
        key=lambda x: x.get("lastSeenAt") or "",
        reverse=True,
    )
    _save_ideas(doc)
    if absorb:
        absorb_open()
        doc = _load_ideas()
    write_agent_context(doc)
    print(f"forum ingest: {len(topics)} on page, {new_count} new, store={IDEAS_PATH}")
    return doc


def _themes_for_title(title: str) -> list[str]:
    return [name for name, rx, _ in THEME_RULES if rx.search(title)]


def absorb_open() -> dict[str, Any]:
    """Promote open ideas → absorbed + refresh lab_guidance themes."""
    doc = _load_ideas()
    theme_ideas: dict[str, list[str]] = defaultdict(list)
    now = _utc_now()
    for idea in doc.get("ideas", []):
        themes = _themes_for_title(idea.get("title") or "")
        idea["themes"] = themes
        if idea.get("status") == "open":
            idea["status"] = "absorbed"
            idea["absorbedAt"] = now
        for th in themes:
            theme_ideas[th].append(idea["id"])

    priorities = []
    for name, _rx, guidance in THEME_RULES:
        ids = theme_ideas.get(name) or []
        if not ids:
            continue
        priorities.append(
            {
                "theme": name,
                "guidance": guidance,
                "fromIdeas": ids[:12],
                "status": "active",
                "updatedAt": now,
            }
        )
    guidance_doc = {
        "schema": GUIDANCE_SCHEMA,
        "forumUrl": FORUM_URL,
        "updatedAt": now,
        "priorities": priorities,
        "law": (
            "Forum ideas refine process, packaging, and lab guidance only. "
            "Locked MiniMax / compose prompts are never rewritten from the forum."
        ),
    }
    DATA.mkdir(parents=True, exist_ok=True)
    GUIDANCE_PATH.write_text(
        json.dumps(guidance_doc, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    _save_ideas(doc)
    write_agent_context(doc)
    print(f"absorb: {len(priorities)} active themes -> {GUIDANCE_PATH}")
    return guidance_doc


def write_agent_context(doc: dict[str, Any] | None = None) -> Path:
    doc = doc or _load_ideas()
    guidance: dict[str, Any] = {}
    if GUIDANCE_PATH.is_file():
        try:
            guidance = json.loads(GUIDANCE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            guidance = {}
    CONTEXT_DIR.mkdir(parents=True, exist_ok=True)
    lines = [
        "# GENUS//NS — Forum lab context",
        "",
        f"Source: {FORUM_URL}",
        f"Updated: {doc.get('updatedAt') or _utc_now()}",
        "",
        "## Law",
        "",
        "Absorb and use public forum ideas to refine *how* agents run experiments "
        "(falsifiability, provenance, packaging notes, process checks).",
        "**Do not** rewrite locked compose / MiniMax prompts from forum threads.",
        "Anything applied from the forum must be stamped (`forumDerived`) and will "
        "appear in the weekly newsletter.",
        "",
        "## Active guidance",
        "",
    ]
    for p in guidance.get("priorities") or []:
        lines.append(f"- **{p.get('theme')}**: {p.get('guidance')}")
    if not guidance.get("priorities"):
        lines.append("_No themes yet — run `forum_lab.py ingest --absorb`._")
    lines += ["", "## Open / absorbed ideas (latest)", ""]
    for idea in (doc.get("ideas") or [])[:24]:
        st = idea.get("status") or "open"
        themes = ",".join(idea.get("themes") or []) or "—"
        apps = len(idea.get("applications") or [])
        lines.append(
            f"- [{st}] [{idea.get('title')}]({idea.get('url')}) "
            f"(themes: {themes}; applications: {apps})"
        )
    lines += [
        "",
        "## Apply an idea to a genome",
        "",
        "```",
        'python scripts/forum_lab.py apply --idea <slug> --genome HEX --kind process --note "..."',
        "python scripts/forum_lab.py refine --genome HEX   # soft auto-link from guidance",
        "```",
        "",
    ]
    CONTEXT_MD.write_text("\n".join(lines), encoding="utf-8")
    return CONTEXT_MD


def apply_idea(
    *,
    idea_id: str,
    genome: str,
    kind: str = "process",
    note: str = "",
    agent: str = "forum-lab",
) -> dict[str, Any]:
    genome = re.sub(r"[^a-fA-F0-9]", "", genome).upper()[:6]
    if len(genome) != 6:
        raise ValueError(f"bad genome id: {genome!r}")
    if kind not in ("process", "presentation", "packaging"):
        raise ValueError("kind must be process|presentation|packaging")
    doc = _load_ideas()
    idea = next((i for i in doc.get("ideas", []) if i.get("id") == idea_id), None)
    if not idea:
        matches = [i for i in doc.get("ideas", []) if str(i.get("id", "")).startswith(idea_id)]
        if len(matches) == 1:
            idea = matches[0]
        else:
            raise KeyError(f"idea not found: {idea_id}")
    apps = idea.setdefault("applications", [])
    now = _utc_now()
    for a in apps:
        if a.get("genomeId") == genome and a.get("kind") == kind:
            a["note"] = note or a.get("note") or ""
            a["at"] = now
            a["agent"] = agent
            break
    else:
        apps.append(
            {
                "genomeId": genome,
                "kind": kind,
                "note": note,
                "at": now,
                "agent": agent,
                "forumUrl": idea.get("url"),
                "forumTitle": idea.get("title"),
            }
        )
    idea["status"] = "applied"
    idea["lastAppliedAt"] = now
    _save_ideas(doc)
    write_agent_context(doc)
    _stamp_package(genome, idea, kind, note)
    print(f"applied {idea['id'][:40]}... -> {genome} ({kind})")
    return idea


def _stamp_package(genome: str, idea: dict[str, Any], kind: str, note: str) -> None:
    pkg = DATA / "packages" / genome / "PACKAGE.json"
    if not pkg.is_file():
        return
    try:
        meta = json.loads(pkg.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return
    derived = meta.get("forumDerived") or []
    entry = {
        "ideaId": idea.get("id"),
        "title": idea.get("title"),
        "url": idea.get("url"),
        "kind": kind,
        "note": note,
        "at": _utc_now(),
    }
    derived = [d for d in derived if not (d.get("ideaId") == idea.get("id") and d.get("kind") == kind)]
    derived.append(entry)
    meta["forumDerived"] = derived
    pkg.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    contents = DATA / "packages" / genome / "CONTENTS.txt"
    if contents.is_file():
        block = (
            f"\nForum-derived ({kind}): {idea.get('title')}\n"
            f"  {idea.get('url')}\n"
            + (f"  Note: {note}\n" if note else "")
        )
        text = contents.read_text(encoding="utf-8")
        if idea.get("url") and idea["url"] not in text:
            contents.write_text(text.rstrip() + block, encoding="utf-8")


def _tokenize(text: str) -> set[str]:
    stop = {
        "the",
        "and",
        "for",
        "with",
        "that",
        "this",
        "from",
        "genus",
        "neural",
        "syntax",
    }
    return {t for t in re.findall(r"[a-z0-9]{3,}", (text or "").lower()) if t not in stop}


def refine_genome(
    *, genome: str, digest: str | None = None, max_apply: int = 2
) -> list[dict[str, Any]]:
    """
    Soft auto-link: score absorbed forum ideas against species LAW / genre text,
    apply top matches as process refinements (does not touch locked prompts).
    """
    genome = re.sub(r"[^a-fA-F0-9]", "", genome).upper()[:6]
    corpus_parts: list[str] = []
    if digest:
        exp = DATA / "experiments" / digest
        for name in (
            "LAW.json",
            "genre_definition.json",
            "COMPOSE_INSTRUCTION.json",
            "foundry_brief.json",
        ):
            p = exp / name
            if p.is_file():
                corpus_parts.append(p.read_text(encoding="utf-8", errors="replace")[:8000])
    pack = DATA / "packages" / genome / "raw"
    if pack.is_dir():
        for name in ("LAW.json", "genre_definition.json"):
            p = pack / name
            if p.is_file():
                corpus_parts.append(p.read_text(encoding="utf-8", errors="replace")[:8000])
    if GUIDANCE_PATH.is_file():
        corpus_parts.append(GUIDANCE_PATH.read_text(encoding="utf-8", errors="replace")[:4000])
    corpus = _tokenize("\n".join(corpus_parts)) or _tokenize(genome)

    doc = _load_ideas()
    scored: list[tuple[float, dict[str, Any]]] = []
    for idea in doc.get("ideas", []):
        if idea.get("status") not in ("open", "absorbed", "applied"):
            continue
        if any(a.get("genomeId") == genome for a in idea.get("applications") or []):
            continue
        itok = _tokenize(idea.get("title") or "")
        if not itok:
            continue
        overlap = len(corpus & itok)
        if overlap < 2:
            continue
        score = overlap / max(4, len(itok))
        if idea.get("themes"):
            score += 0.15 * len(idea["themes"])
        scored.append((score, idea))
    scored.sort(key=lambda x: x[0], reverse=True)
    applied: list[dict[str, Any]] = []
    for score, idea in scored[:max_apply]:
        if score < 0.25:
            continue
        note = (
            f"Auto-refined from forum (score={score:.2f}): process check only; "
            f"locked compose prompt unchanged."
        )
        apply_idea(
            idea_id=idea["id"],
            genome=genome,
            kind="process",
            note=note,
            agent="forum-lab-auto",
        )
        applied.append({"ideaId": idea["id"], "title": idea["title"], "score": score})
    if not applied:
        print(f"refine {genome}: no strong forum matches")
    return applied


def applications_since(days: int = 7, now: datetime | None = None) -> list[dict[str, Any]]:
    now = now or datetime.now(timezone.utc)
    since = (now - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    out: list[dict[str, Any]] = []
    doc = _load_ideas()
    for idea in doc.get("ideas", []):
        for a in idea.get("applications") or []:
            at = a.get("at") or ""
            if at >= since:
                out.append(
                    {
                        "ideaId": idea.get("id"),
                        "title": idea.get("title") or a.get("forumTitle"),
                        "url": idea.get("url") or a.get("forumUrl"),
                        "genomeId": a.get("genomeId"),
                        "kind": a.get("kind"),
                        "note": a.get("note") or "",
                        "at": at,
                        "agent": a.get("agent") or "",
                    }
                )
    out.sort(key=lambda x: x.get("at") or "", reverse=True)
    return out


def newsletter_absorption_blocks(days: int = 7) -> tuple[str, str]:
    """Plain text + HTML table rows for weekly bulletin."""
    apps = applications_since(days)
    intro = (
        "FROM THE FORUM — USED IN EXPERIMENTS — agents absorbed public lab threads "
        "into process/packaging (locked compose prompts unchanged). Every line below "
        "is forum-derived work."
    )
    if not apps:
        body = (
            "No forum ideas were stamped onto genomes this week. "
            "Debate continues on the lab board; agents will absorb when matches appear."
        )
        text = "\n".join([intro, body, f"Join {FORUM_LABEL}: {FORUM_URL}"])
        html_block = (
            "<tr><td style='padding-top:22px;font-family:Consolas,monospace;font-size:11px;"
            "letter-spacing:0.16em;color:#c45c32;'>FROM THE FORUM — USED IN EXPERIMENTS</td></tr>"
            f"<tr><td style='padding-top:8px;font-size:15px;line-height:1.6;'>{html_lib.escape(intro)}</td></tr>"
            f"<tr><td style='padding-top:10px;font-size:15px;line-height:1.6;'>{html_lib.escape(body)}</td></tr>"
            f"<tr><td style='padding-top:12px;'><a href='{html_lib.escape(FORUM_URL)}' "
            f"style='font-family:Consolas,monospace;font-size:12px;letter-spacing:0.14em;color:#c45c32;'>"
            f"{html_lib.escape(FORUM_LABEL)}</a></td></tr>"
        )
        return text, html_block

    lines = []
    items = []
    for i, a in enumerate(apps[:12], 1):
        title = a.get("title") or "forum idea"
        genome = a.get("genomeId") or "?"
        kind = a.get("kind") or "process"
        url = a.get("url") or FORUM_URL
        lines.append(f"{i}. [{genome}] {kind}: {title} → {url}")
        items.append(
            "<tr><td style='padding:6px 0;font-size:14px;line-height:1.45;'>"
            f"<span style='font-family:Consolas,monospace;color:#c45c32;'>{html_lib.escape(genome)}</span>"
            f" · {html_lib.escape(kind)} · "
            f"<a href='{html_lib.escape(url)}' style='color:#e8e4d8;'>{html_lib.escape(title)}</a>"
            "</td></tr>"
        )
    text = "\n".join([intro, *lines, f"Join {FORUM_LABEL}: {FORUM_URL}"])
    html_block = (
        "<tr><td style='padding-top:22px;font-family:Consolas,monospace;font-size:11px;"
        "letter-spacing:0.16em;color:#c45c32;'>FROM THE FORUM — USED IN EXPERIMENTS</td></tr>"
        f"<tr><td style='padding-top:8px;font-size:15px;line-height:1.6;'>{html_lib.escape(intro)}</td></tr>"
        f"<tr><td style='padding-top:10px;'><table role='presentation' width='100%'>{''.join(items)}</table></td></tr>"
        f"<tr><td style='padding-top:12px;'><a href='{html_lib.escape(FORUM_URL)}' "
        f"style='font-family:Consolas,monospace;font-size:12px;letter-spacing:0.14em;color:#c45c32;'>"
        f"{html_lib.escape(FORUM_LABEL)}</a></td></tr>"
    )
    return text, html_block


def attach_forum_to_brief(short: str, digest: str, brief: dict[str, Any]) -> list[dict[str, Any]]:
    """Called from daily_autonomy packaging — refine + return forumDerived list."""
    try:
        refine_genome(genome=short, digest=digest, max_apply=2)
    except Exception as exc:  # noqa: BLE001
        print(f"forum refine skip {short}: {exc}")
    derived: list[dict[str, Any]] = []
    doc = _load_ideas()
    for idea in doc.get("ideas", []):
        for a in idea.get("applications") or []:
            if a.get("genomeId") == short:
                derived.append(
                    {
                        "ideaId": idea.get("id"),
                        "title": idea.get("title"),
                        "url": idea.get("url"),
                        "kind": a.get("kind"),
                        "note": a.get("note"),
                        "at": a.get("at"),
                    }
                )
    brief["forumDerived"] = derived
    return derived


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_in = sub.add_parser("ingest", help="Scrape lab forum into data/forum_ideas.json")
    p_in.add_argument("--absorb", action="store_true", help="Also absorb open ideas into guidance")

    sub.add_parser("absorb", help="Promote open ideas → lab_guidance themes")

    p_ap = sub.add_parser("apply", help="Stamp a forum idea onto a genome")
    p_ap.add_argument("--idea", required=True)
    p_ap.add_argument("--genome", required=True)
    p_ap.add_argument("--kind", default="process", choices=["process", "presentation", "packaging"])
    p_ap.add_argument("--note", default="")

    p_rf = sub.add_parser("refine", help="Soft auto-link forum ideas to a genome")
    p_rf.add_argument("--genome", required=True)
    p_rf.add_argument("--digest", default=None)

    sub.add_parser("context", help="Rewrite data/agent_context/FORUM.md")

    args = ap.parse_args()
    if args.cmd == "ingest":
        ingest(absorb=args.absorb)
    elif args.cmd == "absorb":
        absorb_open()
    elif args.cmd == "apply":
        apply_idea(idea_id=args.idea, genome=args.genome, kind=args.kind, note=args.note)
    elif args.cmd == "refine":
        refine_genome(genome=args.genome, digest=args.digest)
    elif args.cmd == "context":
        path = write_agent_context()
        print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
