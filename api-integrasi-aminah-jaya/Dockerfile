# Builder Stage
FROM rust:slim-bookworm AS builder
RUN apt-get update && apt-get install -y pkg-config libssl-dev git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Cargo.toml and Cargo.lock first to cache dependencies
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to allow dependency compilation caching
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy real source code
COPY src ./src

# Build the real application
# Touch main.rs to force cargo to rebuild it
RUN touch src/main.rs
RUN cargo build --release

# Production Stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the compiled binary from builder
COPY --from=builder /app/target/release/api-integrasi-aminah-jaya ./api-integrasi-aminah-jaya

ENV PORT=8002
ENV RUST_LOG=info

EXPOSE 8002

CMD ["./api-integrasi-aminah-jaya"]
