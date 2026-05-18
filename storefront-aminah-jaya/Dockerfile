# Multi-stage Dockerfile for SolidStart v1
# Builder stage
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Build the project
ENV NITRO_PRESET=node-server
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app

# Install only production dependencies
COPY package.json ./
RUN npm install --production

# Copy build outputs
COPY --from=builder /app/.output ./.output

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
