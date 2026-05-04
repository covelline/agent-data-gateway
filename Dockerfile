FROM oven/bun:1.3-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY proxy/package.json proxy/
COPY dashboard/package.json dashboard/
COPY mock-api/package.json mock-api/
RUN bun install --frozen-lockfile

FROM oven/bun:1.3-slim
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json ./
COPY packages packages
COPY proxy proxy
COPY dashboard dashboard
COPY mock-api mock-api
ENV NODE_ENV=production
