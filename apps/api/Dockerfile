# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY patches patches
COPY apps/api/package.json apps/api/
COPY packages/api-client/package.json packages/api-client/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/database/package.json packages/database/
COPY packages/design-tokens/package.json packages/design-tokens/

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages packages

RUN pnpm db:generate \
  && pnpm --filter @bidplace/api... build \
  && cp packages/database/src/generated/prisma/*.node packages/database/dist/generated/prisma/ \
  && pnpm --filter @bidplace/api --config.allow-unused-patches=true deploy --prod --legacy /out

FROM node:22-bookworm-slim AS production
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /out/ ./

EXPOSE 3001
CMD ["node", "dist/main.js"]
