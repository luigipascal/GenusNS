# GENUS//NS — Master Specification

**Status:** controlling architecture (corrected 2026-08-13)  
**Repos:** Living Interface addendum — `docs/LIVING_INTERFACE.md`

---

## Identity

| Name | Role |
|------|------|
| **Genus** | Desktop laboratory (`E:\0dblabs\humanizer`) — Compose, Refine, Genre Genesis |
| **GENUS//NS** | Artist, registry, publication layer, public website |
| **Neural Syntax** | Operator / parent identity |
| **0dB_Labs** | Label (trading name of Rondanini Publishing Ltd) |
| **Rondanini Publishing Ltd** | Legal company (No. 16548159) |

Internal package names: `genus-desktop`, `genusns-registry`, `genusns-publisher`.

Do not rename Genus desktop to GENUS//NS.

---

## Architectural law

**Genus already is the creative application. GENUS//NS is the publication layer.**

GENUS//NS must **not** reimplement:

- music generation / candidate generation
- Genre Genesis swarm
- Refine UI / DSP modules / Ollama refine agent
- Let’s Submit querying
- podcast generation
- Genus Playlist auto-add
- MusicGlyph
- marketing.berta.one

GENUS//NS **does**:

```text
Ingest → Provenance archive → Experiment Registry → Release Builder
→ Distribution Kit → Public Website → External DSP links
(+ manual Ditto Music upload)
```

---

## Canonical workflow

```text
Genre Genesis → Compose → select → Refine (Analyse → named DSP → re-analyse)
→ operator accepts → Send to GENUS//NS → ingest snapshot → auto cover + kit
→ operator uploads kit to Ditto Music → DSP links → Publish
```

**Automated by GENUS//NS:** hash verify, provenance archive, genome-wheel cover
(title + artist `GENUS//NS` + label `0dB_Labs`), Ditto kit assembly, registry record.

**Manual only:** Ditto Music upload (and pasting DSP links once live).

## Rights policy (default autonomous GENUS work)

Composition publishing royalties are **not claimed**. Master-side distribution
revenue may still be **collected**. See [`docs/RIGHTS_POLICY.md`](RIGHTS_POLICY.md)
and package `@genusns/rights`. Do not invent a human composer for distributor forms.

Refine changes the **performance layer only**; composition/arrangement remain intact. That distinction must appear in provenance.

---

## Publisher bridge (Genus desktop)

Package in humanizer monorepo: `genusns_publisher/` (flat package, consistent with `genus/`, `music_foundry/`).

- `GenusNSPublisherClient`: auth, session, collect, hash, upload, resume, commit, return id
- CLI: `genus publish genusns` (`--dry-run`, `--include-private`, `--release`, `--status`)
- UI: **Send to GENUS//NS…** (after selected realisation + final WAV + genome/manifest)
- Immutable snapshot: `.genusns-export/` — never mount desktop filesystem on the server
- Local mapping: `genus_digest` ↔ `genusns_id` ↔ `canonical_id` ↔ revision
- Publication one-way; updates create **proposed revisions**, never silent mutation
- Final packages (archive / public / press / distribution) are built by **GENUS//NS**, not desktop

---

## Exchange formats

| File | Schema | Purpose |
|------|--------|---------|
| `GENUS_PUBLISH.json` | `genus.publish.v1` | Experiment header + workflow flags + asset refs |
| `ASSETS.json` | `genus.assets.v1` | Role, path, sha256, visibility |
| `REFINE_HISTORY.json` | `genus.refine.v1` | Before/after + named DSP actions |
| Stored visual profile | `genusns.visual.v1` | Immutable glyph identity at publish |

Server independently verifies every hash.

---

## Provenance (three layers)

1. **Genre** — swarm, board, digest, law, novelty  
2. **Realisation** — generator, settings, candidate selection  
3. **Performance / master** — Refine, named DSP, deltas, master accept  

Human decision points (at minimum): genome approved, candidate selected, refinement accepted, release approved, release published.

---

## Metrics language (non-negotiable)

Never display Genus performance realism / synthetic trace / MERT as “AI probability”.

Let’s Submit results, if supplied by desktop, are **external evaluation**, default **PRIVATE**, never a publication gate.

Public copy must caveat Genus meters as internal performance-realism measurements — not proof of human vs AI authorship.

Analysis tiers 0 / 1 / 2 are stored, not re-implemented. Tier 2 must not be sold as finished science.

Tier-0 embedded metadata detections (e.g. “made with suno”) survive master cleaning in the registry.

---

## Genre Genesis privilege

Public experiments privilege compiled genome artefacts (`genre_definition.json`, `MANIFEST.json`, `tuning.json`, form graph, math law, novelty) over provider prompt text.

---

## Product story

Genre Genesis invents musical laws; Compose instantiates them; Refine measures and changes performance; humans make explicit selections. Prefer this over “fully autonomous AI album”.

---

## Out of scope forever (unless separately requested)

Genus Playlist auto-feed · MusicGlyph absorption · marketing.berta.one core · bidirectional desktop sync · browser WAV analysis when authoritative events exist.

---

## Website

The public site is part of the experiment. See **Living Interface**.

Signature features:

1. **Genome Glyph** — permanent visual identity from musical law  
2. **LISTEN / LAW / TRACE** — hear, inspect species, see provenance  
3. **Registry Field** — population of species, not a discography list  

Design test: *The website should behave as though it is another realisation of the experiment.*
