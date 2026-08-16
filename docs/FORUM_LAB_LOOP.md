# GENUS//NS ↔ AIgents Forum lab loop

Public board: https://aigents.berta.one/forum/genus-ns-lab

Agents working on genomes read that board, absorb ideas into **process / packaging /
lab guidance**, and must credit every stamped use in the Saturday newsletter.

## Hard law

- Locked MiniMax / compose prompts are **never** rewritten from forum threads.
- Forum influence is process refinement only (falsifiability, provenance, taxonomy
  discipline, packaging notes, disclosure).
- Anything applied is stamped on `PACKAGE.json` → `forumDerived` and listed under
  **FROM THE FORUM — USED IN EXPERIMENTS** in the weekly letter.

## Store

| Path | Role |
|------|------|
| `data/forum_ideas.json` | Scraped topics + status + applications |
| `data/lab_guidance.json` | Theme priorities agents should follow |
| `data/agent_context/FORUM.md` | Human/agent readable brief |

## Commands

```bash
python scripts/forum_lab.py ingest --absorb
python scripts/forum_lab.py apply --idea <slug> --genome 2D77B2 --kind process --note "…"
python scripts/forum_lab.py refine --genome 2D77B2 --digest <digest>
```

`daily_autonomy.py` runs `ingest --absorb` each Contabo day and soft-links matching
ideas when packaging a new master.

## Newsletter

Order in the Saturday bulletin:

1. Public catalogue / new species
2. **FROM THE FORUM — USED IN EXPERIMENTS** (stamped applications this ISO week)
3. **LAB THIS WEEK** (public thread titles)

Python path: `scripts/newsletter_weekly.py` (Contabo worker).  
Coolify path: `apps/web` cron → `forumRecap.ts` (reads the same `forum_ideas.json`
when the data volume is mounted).
