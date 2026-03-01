FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY prisma prisma
RUN pnpm install --frozen-lockfile --filter api...

FROM deps AS build
COPY . .
RUN pnpm --filter api build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/prisma ./prisma
COPY apps/api/package.json apps/api/package.json
EXPOSE 40001
CMD ["node", "apps/api/dist/main.js"]
