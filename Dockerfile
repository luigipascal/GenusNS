# GENUS//NS — Coolify / Contabo production image
# Build context: repository root

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/genome-visuals/package.json ./packages/genome-visuals/
COPY packages/pipeline/package.json ./packages/pipeline/
COPY packages/rights/package.json ./packages/rights/
COPY packages/ui/tokens/package.json ./packages/ui/tokens/
# Coolify injects NODE_ENV=production at build-time; that skips
# workspace typescript/devDeps and can break sharp. Force full install.
RUN NODE_ENV=development pnpm install --frozen-lockfile \
  && NODE_ENV=development pnpm rebuild sharp
COPY . .
# Do not bake secrets into the image
RUN rm -f .env .env.local apps/web/.env apps/web/.env.local || true
ENV NEXT_TELEMETRY_DISABLED=1
RUN NODE_ENV=production pnpm --filter @genusns/web build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
# Default; Coolify should override with the mounted volume path
ENV GENUSNS_DATA_DIR=/app/data

# Coolify healthcheck uses curl/wget against localhost:3000
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/data \
  && chown nextjs:nodejs /app/data

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

