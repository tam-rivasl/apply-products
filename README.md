# Apply Products API

REST API built with NestJS that synchronises Product entries from Contentful into PostgreSQL every hour, exposes a public catalogue and a private reporting surface.

## Features

- **Product Management**: Public read endpoints with filtering/pagination (max 5 items) and private JWT-protected mutations
- **Contentful Integration**: Automatic hourly sync from Contentful into PostgreSQL
- **Authentication**: JWT-based login issuing bearer tokens
- **Database**: PostgreSQL + TypeORM with soft-delete support
- **API Documentation**: Swagger UI available at /api/docs
- **Scheduled Sync**: Cron job (default hourly) with resumable cursors via SyncState
- **Docker Support**: Dockerfile + docker-compose orchestrating API and database
- **Testing**: Jest suite with >90% coverage
- **Security**: Helmet, DTO validation, and structured logging

## Prerequisites

- Node.js 20.x (Active LTS)
- Yarn 1.22.x (Classic). If you use Yarn Berry, run `yarn config set nodeLinker node-modules`
- PostgreSQL 15+ reachable from your machine, or Docker Desktop with Compose v2
- Contentful credentials (Space ID and delivery access token) for synchronisation jobs

## Local setup (step-by-step)

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd apply-products
   yarn install
   ```

2. **Configure environment variables**

   - Copy the `.env` template from the repository root or create a new one following the example below.
   - Adjust database credentials so they match your PostgreSQL instance.
   - Fill the Contentful variables only if you plan to run the sync locally.

   ```
   NODE_ENV=development
   PORT=3000

   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=postgres
   DB_PASS=postgres
   DB_NAME=apply_products

   JWT_SECRET=dev_secret
   JWT_EXPIRES_IN=1h

   CONTENTFUL_SPACE_ID=<your_contentful_space>
   CONTENTFUL_ACCESS_TOKEN=<your_contentful_token>
   CONTENTFUL_ENVIRONMENT=master
   CONTENTFUL_CONTENT_TYPE=product

   SYNC_CRON=0 * * * *
   SYNC_PAGE_SIZE=100
   HTTP_TIMEOUT_MS=15000
   HTTP_RETRIES=3
   ```

   > Tip: on Windows prefer `DB_HOST=127.0.0.1` to avoid IPv6 resolution issues with `localhost`.

3. **Start PostgreSQL**

   - **Docker (recommended)**

     ```bash
     docker compose up -d db
     ```

     Wait until `docker compose ps` shows the `db` service as healthy.

   - **Native installation**

     Ensure PostgreSQL is running and listening on the host and port configured in the `.env`.

4. **Prepare the database**

   - Make sure the database exists. Creating it again is safe.

     ```bash
     # Docker
     docker compose exec db psql -U postgres -c "CREATE DATABASE apply_products;"

     # Native
     createdb -U postgres apply_products
     ```

   - The migrations enable the `pgcrypto`, `unaccent`, and `pg_trgm` extensions. Run them with a role that can create extensions, or pre-create them manually:

     ```bash
     psql -U postgres -d apply_products -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
     psql -U postgres -d apply_products -c "CREATE EXTENSION IF NOT EXISTS unaccent;"
     psql -U postgres -d apply_products -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
     ```

   > Windows: if `psql` is not recognized, call it with the full path (for example "C:\Program Files\PostgreSQL\16\bin\psql.exe" ...) or add PostgreSQL's bin directory to your PATH. When using Docker you can run `docker compose exec db psql ...`.
   > macOS: if you installed PostgreSQL with Homebrew, ensure `/opt/homebrew/bin` (Apple Silicon) or `/usr/local/bin` is on your PATH, or invoke `psql` using the absolute path.

5. **Run migrations**

   ```bash
   yarn migration:run
   ```

   The command uses `src/data-source.ts` together with `dotenv/config`, so it will pick up the `.env` file automatically. If you see connection errors, confirm the database is reachable and that the credentials in `.env` are correct.

6. **Start the API**

   ```bash
   yarn start:dev
   ```

   The server listens on http://localhost:3000 and exposes Swagger at http://localhost:3000/api/docs.

## Production deploy (manual servers)

1. Copy your `.env` file to the target machine and set `NODE_ENV=production`.
2. Install dependencies (you can skip dev dependencies):

   ```bash
   yarn install --production
   ```

3. Build the project:

   ```bash
   yarn build
   ```

4. Run migrations against the compiled bundle:

   ```bash
   yarn migration:run:dist
   ```

5. Start the API:

   ```bash
   yarn start:prod
   ```

   Pair this with a process manager such as `pm2`, `systemd`, or a container orchestrator.

## Docker workflow

```bash
docker compose up --build
```

- Starts PostgreSQL (`db`) and the API (`api`).
- The entrypoint waits for the database, runs migrations, and then starts the compiled build.
- Stop everything with `docker compose down`.

## Tests & Quality

```bash
yarn test
yarn test:cov
yarn lint
```

GitHub Actions (`.github/workflows/ci.yml`) runs lint, build, migrations, and coverage on every push/PR.

## API Quickstart

| Module | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| Auth | POST /api/auth/login | No | Returns JWT (optional email payload). |
| Products | GET /api/products | No | Filters + pagination (<=5). |
| Products | POST /api/products | Yes | Create product (Bearer token). |
| Products | PATCH /api/products/:id | Yes | Update product. |
| Products | DELETE /api/products/id/:id | Yes | Soft delete product. |
| Reports | GET /api/reports/overview | Yes | Percentages (deleted, priced/no-price, date range). |
| Reports | GET /api/reports/by-category | Yes | Category breakdown in date window. |

Bearer header: `Authorization: Bearer <token>`.

> Need the OpenAPI contract offline? Check `api/docs/openapi.yaml` for the latest specification consumed by Swagger.

### Column selection (`select`)

`GET /api/products` accepts a `select` parameter (comma-separated string or multiple values) to return only the specified columns.

Example:  
`?select=name,price,stock`  
This returns each product with only those fields.

## Sync behaviour

- Cron expression defaults to hourly (0 * * * *).
- `SyncStateRepository` stores the last successful cursor to resume incremental fetches.
- Soft-deleted records are excluded from upserts.

## Useful scripts

```bash
yarn build
yarn start:prod
yarn migration:run
yarn migration:run:dist
yarn migration:revert
```

## Notes

- Node 20 (Active LTS) + NestJS 10.
- TypeScript everywhere (app, tests, config).
- Coverage > 90% (statements/branches/functions/lines).
- Swagger tags grouped by module for demo clarity.

Happy hacking!


