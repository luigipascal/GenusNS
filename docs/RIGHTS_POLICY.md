# GENUS//NS — Composition Rights, Credits and Revenue Policy

**Status:** fundamental domain rule  
**Nature:** project policy — not an automated legal determination

See also: package `@genusns/rights`, Studio `/studio`, TRACE on `/g/[id]`.

## Distinctions (never collapse)

1. Composition / songwriting rights  
2. Sound-recording / master rights  
3. Human creative contributions  
4. Machine-generated musical material  
5. Distribution (master) revenue  
6. Publishing / composer revenue  

Do not use a single `copyright_owner` field for all of the above.

## Default autonomous GENUS release

```text
COMPOSITION AUTHORSHIP:     MACHINE_GENERATED_NOT_CLAIMED
COMPOSER / SONGWRITER:      NOT CLAIMED  (claimedAuthors = [])
PUBLISHING REGISTRATION:    OFF
MASTER REVENUE COLLECTION:  COLLECT
```

`MACHINE_GENERATED_NOT_CLAIMED` means GENUS//NS is intentionally not making a
conventional composer/songwriter royalty claim. It does **not** encode a
global legal conclusion that “no copyright exists anywhere.”

## Project defaults

```text
DEFAULT_MACHINE_COMPOSITION_AUTHORSHIP_STATUS = MACHINE_GENERATED_NOT_CLAIMED
DEFAULT_MACHINE_PUBLISHING_ROYALTY_STATUS     = NOT_CLAIMED_MACHINE_GENERATED
DEFAULT_MASTER_REVENUE_COLLECTION            = COLLECT
```

## Do not

- Invent Neural Syntax / GENUS / Rondanini / an AI model as composer to fill a form
- Equate master ownership with composition authorship
- Treat Refine, prompts, or operator selection as automatic composer claims
- Credit AI systems as legal persons (`Composer: Suno`, etc.) — use `systemsUsed` provenance
- Claim “public domain” / “copyright-free” / “AI owns the copyright” unless manually established
- Fail readiness validation solely because composer is empty when unclaimed is intentional
- Automate legal declarations to Ditto / Symphonic — kits are factual; humans submit

## Component-level exceptions

- Human lyrics ≠ whole work becomes human-authored composition  
- Human performance of a machine composition ≠ composition authorship claim  
- Future collaborative works may use `HUMAN_AI_COLLABORATIVE` / `HUMAN_AUTHORED` via operator confirmation only  

## Package artefacts

Every Ditto kit includes:

- `RIGHTS.json`
- `AI_DISCLOSURE.txt` (editable; no “no copyright” claim)
- `README_RIGHTS.txt`
- `RELEASE_SHEET.json` (authorship / publishing / master columns)
- `DISTRIBUTOR_COMPOSER_WARNING.txt` when no composer is claimed
- `provenance/RIGHTS_POLICY_CONFIRMED.json`
- `provenance/RIGHTS_VALIDATION.json`

## Studio

`/studio` — Rights stage: “How was the composition created?”  
Concise acknowledgement only (`Confirm composition status`). No legal popup theatre.

## Validation

| Condition | Result |
|-----------|--------|
| Machine not-claimed + empty composers | **PASS** — Composition royalties intentionally not claimed |
| Human-authored + empty composers | **WARNING** — no invention |
| AI name as claimed author | **ERROR** |

## Future revenue categories

Keep master and composition income separate (`MASTER_*` vs `COMPOSITION_*`).  
Do not dump all income under a single `royalties` bucket.

## Publisher

Legal publisher for GENUS//NS and this site:

**Rondanini Publishing Ltd t/a 0dB_Labs**

Company imprint is not composition authorship. Do not invent a composer from the publisher name.

