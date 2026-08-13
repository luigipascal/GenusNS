# GENUS//NS

Publication layer, experiment registry, and living interface for Genus desktop experiments.

- **Genus** = desktop laboratory (`humanizer` monorepo)
- **GENUS//NS** = this repository
- **Neural Syntax** = operator / parent identity

See [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) and [`docs/LIVING_INTERFACE.md`](docs/LIVING_INTERFACE.md).

## Local

```bash
pnpm install
pnpm test
pnpm dev
```

Dev UI: [http://localhost:3456](http://localhost:3456)

Design fixture: `GENUS//NS:288FBD` — 36-EDO · cycle 13 · Euclid 3/13 · accents 7,11.

## Contabo Coolify

Deploy from this GitHub repo with the root `Dockerfile`.

| Setting | Value |
|---------|--------|
| Build pack | Dockerfile |
| Port | `3000` |
| Health | HTTP `/` |

Coolify will build the Next.js standalone image. Backend ingest / registry DB are not in this repo yet — the current site serves the living interface from compiled genome fixtures.

When adding Postgres / object storage later, provision them as Coolify resources on the same Contabo host and inject env vars (never commit secrets).
