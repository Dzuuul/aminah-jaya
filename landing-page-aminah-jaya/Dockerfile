# Multi-stage Dockerfile for SolidStart v1
# Builder stage
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN npm install -g pnpm
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else npm install; fi

# Copy source code
COPY . .

# Build the project
ENV NITRO_PRESET=node-server
RUN pnpm run build || npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app

# Install only production dependencies
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN npm install -g pnpm
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --prod --frozen-lockfile; else npm install --production; fi

# Copy build outputs
COPY --from=builder /app/.output ./.output

ENV PORT=3003
ENV HOST=0.0.0.0
ENV NODE_ENV=production
EXPOSE 3003
CMD ["node", ".output/server/index.mjs"]