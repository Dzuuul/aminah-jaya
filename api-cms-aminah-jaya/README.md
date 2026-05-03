# API CMS Aminah Jaya

Backend API for Aminah Jaya Store CMS, built with Rust, Axum, and SQLx.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Docker](https://docs.docker.com/get-docker/)
- [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli)

## Setup

1. **Start Database**:
   ```bash
   docker-compose up -d
   ```

2. **Configuration**:
   Ensure `.env` matches your database settings.

3. **Run Application**:
   ```bash
   cargo run
   ```

## Database Migrations

This project uses `sqlx-cli` for database migrations.

1. **Install SQLx CLI**:
   ```bash
   cargo install sqlx-cli --no-default-features --features postgres
   ```

2. **Run Migrations**:
   ```bash
   sqlx migrate run
   ```

3. **Revert Last Migration**:
   ```bash
   sqlx migrate revert
   ```

4. **Create New Migration**:
   ```bash
   sqlx migrate add <migration_name>
   ```

## API Endpoints

- `POST /api/auth/login`: Authenticate and receive JWT.
- `GET /api/dashboard/stats`: Retrieve dashboard summary statistics.

## Technology Stack

- **Axum**: Web framework.
- **Tokio**: Async runtime.
- **SQLx**: SQL toolkit for Postgres.
- **JSONWebToken**: Authentication.
- **Serde**: Serialization/Deserialization.
