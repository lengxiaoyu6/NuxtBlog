FROM node:20-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

ARG APT_MIRROR

RUN corepack enable \
  && if [ -n "$APT_MIRROR" ]; then \
    sed -i "s|http://deb.debian.org|$APT_MIRROR|g" /etc/apt/sources.list.d/debian.sources; \
  fi \
  && apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps

ARG NPM_REGISTRY

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN if [ -n "$NPM_REGISTRY" ]; then \
    export COREPACK_NPM_REGISTRY="$NPM_REGISTRY" \
    && npm config set registry "$NPM_REGISTRY" \
    && pnpm config set registry "$NPM_REGISTRY"; \
  fi \
  && pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build

COPY . .
RUN pnpm exec prisma generate
RUN pnpm exec nuxt prepare
RUN pnpm build

FROM base AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/docker ./docker
COPY --from=build /app/.env.example ./.env.example

RUN chmod +x ./docker/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
