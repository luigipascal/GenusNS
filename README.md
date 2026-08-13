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

## Stripe (Coolify env)

```
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_SITE_URL=https://your-domain
```

- `/services` — commission offerings
- `POST /api/checkout` — Checkout Sessions (tracks + services)

## Contabo Coolify

| Setting | Value |
|---------|--------|
| Build pack | Dockerfile |
| Port | `3000` |
| Volume | `/app/data` → `GENUSNS_DATA_DIR` |
