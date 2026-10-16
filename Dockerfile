# Build the static site, then serve it with Caddy. Railway builds this automatically.
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Build tools, only needed if better-sqlite3 has no prebuilt binary for this platform.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Public analytics settings are baked into the static pages at build time (Railway passes service variables as build arguments).
ARG NUXT_PUBLIC_UMAMI_HOST
ARG NUXT_PUBLIC_UMAMI_ID
ARG NUXT_PUBLIC_UMAMI_DOMAINS
ENV NUXT_PUBLIC_UMAMI_HOST=$NUXT_PUBLIC_UMAMI_HOST \
    NUXT_PUBLIC_UMAMI_ID=$NUXT_PUBLIC_UMAMI_ID \
    NUXT_PUBLIC_UMAMI_DOMAINS=$NUXT_PUBLIC_UMAMI_DOMAINS
RUN pnpm generate

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/.output/public /srv
EXPOSE 8080
