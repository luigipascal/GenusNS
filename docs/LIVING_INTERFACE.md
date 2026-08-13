# GENUS//NS — Living Interface

**Status:** supersedes conventional website-design assumptions in the platform specification.  
**Parent:** `docs/MASTER_SPEC.md`

---

## Core principle

Every published experiment contains a formal musical genome. That genome drives layout, motion, geometry, colour accents, and playback visualisation.

```text
EDO                  → radial segmentation
cycle_length         → rhythmic repetition
accent residues      → visual emphasis
Euclidean rhythm     → pulse pattern
form graph           → spatial topology
spectral centroid    → visual energy / luminance
inharmonicity        → geometric irregularity
roughness            → surface disturbance
BPM                  → animation pulse
event density        → visual population
digest               → deterministic random seed
```

The interface for `GENUS//NS:288FBD` must not look exactly like another experiment. Same design system; different visual behaviour.

**The website should behave as though it is another realisation of the experiment.**

---

## Anti-patterns (forbidden)

Record-label template · Spotify clone · AI startup · SaaS dashboard · music blog · scientific database with cards · generic dark-mode portfolio · purple→cyan AI gradients · equaliser bars / Winamp spectra · autoplay audio · manifesto above the fold.

Studio may remain conventional (tables, forms). Public site must not.

---

## Behavioural states

| State | Behaviour |
|-------|-----------|
| **Dormant** | Nothing playing — slow drift, quiet life |
| **Active** | Pointer/scroll perturbs the system |
| **Playing** | Synchronised to experiment metadata + playback (+ optional timeline) |

No autoplay. User starts sound. Respect `prefers-reduced-motion` and motion-safety (no BPM strobing).

---

## Signature systems

### Genome Engine (`@genusns/genome-visuals`)

`createGenomeVisualProfile(experiment)` → deterministic `GenomeVisualProfile`.  
Seeded PRNG from digest — no `Math.random()` for canonical visuals.  
Version: `genusns.visual.v1`. Store profile at publish for glyph immutability.

### Genome Glyph

SVG identity from EDO / degrees / cycle / accents / graph / digest.  
Works at 32×32 and poster scale. Deterministic. Not a QR code.

### LISTEN / LAW / TRACE

Experiment page modes — immersive playback, formal specification, provenance.

### Registry Field

Default `/registry` view: species in a parameter map (documented as **visual parameter map**, not learned similarity). Also INDEX + TIMELINE.

---

## Modules

| Module | Role | Preferred render |
|--------|------|------------------|
| `GenomeGlyph` | Identity | SVG |
| `RhythmOrbit` | Cycle + Euclidean + accents | SVG |
| `PitchLattice` | EDO degrees | SVG |
| `FormGraph` | Weighted digraph | SVG |
| `SpectralSurface` | Centroid / inharmonicity / roughness | SVG / WebGL |

WebGL (R3F) only for Field / Taxonomy / immersive surface. Always SVG fallback.

---

## Colour & type

Base: near-black, charcoal, off-white, grey.  
`createExperimentPalette(digest)` → bounded OKLCH accents (WCAG for text).  
Display grotesk + machine mono via `next/font`. Treat `//` in GENUS//NS as structural operator.

---

## Implementation order

1. Design tokens  
2. Genome Engine + Glyph + lattices (fixture **288FBD**)  
3. Experiment page modes  
4. Registry FIELD / INDEX / TIMELINE  
5. Homepage (live structure)  
6. Playback mode  
7. Comparison morph  
8. Taxonomy  

Canonical design test fixture: **GENUS//NS:288FBD** (36-EDO, cycle 13, accents 7/11, Euclid 3/13, 93.18 BPM, 598 events).

---

## Copy vocabulary

Prefer: THE LAW · THE REALISATION · THE TRACE · SPECIFICATION · SPECIES RECORD.  
Avoid: revolutionary, AI-powered, unleash, reimagine, groundbreaking.

Homepage should provoke; Method explains; Transparency clarifies; Registry proves; music demonstrates.

---

## Full detail index

Sections 1–78 of the Living Interface brief (homepage sequence, comparison, taxonomy, posters, OG cards, Data Mode `D`, Raw `{}`, quality tiers, visual timeline schema, exhibition mode, etc.) are normative requirements for subsequent phases. This file is the condensed controlling summary; expand into tickets without diluting the three signature features.
