FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter web...

FROM deps AS build
COPY . .
RUN pnpm --filter web build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN corepack enable
COPY --from=build /app/apps/web/.output ./apps/web/.output
COPY apps/web/package.json apps/web/package.json
EXPOSE 40000
CMD ["node", "apps/web/.output/server/index.mjs"]
