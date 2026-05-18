# Multi-stage Dockerfile for SolidStart v1
# Builder stage
FROM oven/bun:alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
ENV NITRO_PRESET=node-server
RUN bun run build

# Production stage
FROM node:22-alpine
WORKDIR /app

# Install only production dependencies
COPY package.json ./
RUN npm install --production

# Copy build outputs
COPY --from=builder /app/.output ./.output

ENV PORT=3001
ENV HOST=0.0.0.0
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", ".output/server/index.mjs"]
