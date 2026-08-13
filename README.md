# GENUS//NS

Publication layer, experiment registry, and living interface for Genus desktop experiments.

- **Genus** = desktop laboratory (`humanizer` monorepo)
- **GENUS//NS** = this repository / artist
- **Neural Syntax** = operator / parent identity
- **0dB_Labs** = label

See [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md), [`docs/LIVING_INTERFACE.md`](docs/LIVING_INTERFACE.md), [`docs/SITE_DESCRIPTION.md`](docs/SITE_DESCRIPTION.md).

## Local

```bash
pnpm install
pnpm test
pnpm covers      # covers + artist.png from first genome (00D88E)
pnpm pipeline   # kits + per-species zips + master zip
pnpm dev
```

Dev UI: [http://localhost:3456](http://localhost:3456)

## Operator drop (everything for Ditto)

After `pnpm pipeline`:

| Path | Contents |
|------|----------|
| `data/OPERATOR_DROP/GENUSNS_DITTO_ALL.zip` | All kits in one archive |
| `data/OPERATOR_DROP/artist.png` | Artist mark (first genome **00D88E**) |
| `data/READY_FOR_DITTO/<ID>.zip` | One zip per species |
| `data/READY_FOR_DITTO/<ID>/` | Unzipped kit: cover, artist, metadata, provenance |
| `apps/web/public/covers/*.png` | Site covers |
| `apps/web/public/identity/artist.png` | Site artist image |

**Only manual step:** upload cover + audio (+ artist profile image) to **Ditto Music**.

## Covers & artist

- Every track cover: genome **wheel** + title + `GENUS//NS` + `0dB_Labs`
- Artist image: wheel from **first compiled genome** `GENUS//NS:00D88E` (24-EDO)

## Stripe (Coolify env — use 0dblabs.com until genusns is live)

```
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_SITE_URL=https://0dblabs.com
```

- Live webhook: `https://0dblabs.com/api/webhooks/stripe` (endpoint `we_1S1VVx6MQAjxm2yo92OaYjwJ`)
- `/services` — commission Checkout
- `POST /api/checkout` — sessions (tracks + services)
- `POST /api/webhooks/stripe` — order fulfilment
- LISTEN: master from Contabo `data/` when present, else Web Audio genome audition

## Where audio lives

| Role | Location |
|------|----------|
| Site listen / download masters | Contabo Coolify volume `/app/data` (`masters/`, `READY_FOR_DITTO/<ID>/audio/`) |
| Dev convenience | `apps/web/public/audio/<id>.mp3` |
| Streaming stores (Spotify etc.) | After **manual** Ditto upload — not Contabo |

## Contabo Coolify

Deploy **before** a custom genusns domain is ready. Coolify gives you a public URL immediately; point DNS / Stripe later.

| Setting | Value |
|---------|--------|
| Source | GitHub `luigipascal/GenusNS` · branch `main` |
| Build pack | Dockerfile (repo root) |
| Port | `3000` |
| Volume | host path → `/app/data` · env `GENUSNS_DATA_DIR=/app/data` |
| Domain (interim) | Coolify FQDN, or `genus.0dblabs.com` / reverse-proxy on `0dblabs.com` |

**Env (live — paste from local `.env`, never commit):**

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=https://<your-coolify-or-0dblabs-host>
GENUSNS_DATA_DIR=/app/data
```

After the first successful deploy, set Stripe webhook URL to  
`https://<that-host>/api/webhooks/stripe` (currently aimed at `0dblabs.com` until this app is mounted there).
