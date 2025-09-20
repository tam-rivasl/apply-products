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

### Public API at a Glance

`GET /api/products` supports pagination (max 5 items) and filters: name, category, brand, model, color, currency, sku, stock, price, priceMin, priceMax.
Soft-deleted items never reappear after synchronisation.

Mutations (`POST`, `PATCH`, `DELETE`) and report endpoints require a bearer token.

## Getting Started

### 1. Clone & install
```bash
git clone <repository-url>
cd apply-products
yarn install
```

### 2. Environment variables (.env)
```
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=apply_products

JWT_SECRET=dev_secret
JWT_EXPIRES_IN=1h

CONTENTFUL_SPACE_ID=9xs1613l9f7v
CONTENTFUL_ACCESS_TOKEN=I-ThsT55eE_B3sCUWEQyDT4VqVO3x__20ufuie9usns
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_CONTENT_TYPE=product

SYNC_CRON=0 * * * *
SYNC_PAGE_SIZE=100
HTTP_TIMEOUT_MS=15000
HTTP_RETRIES=3
```

### 3. Database migrations
```bash
yarn migration:run
```

### 4. Run the API
```bash
yarn start:dev
```
Server runs at http://localhost:3000 (Swagger at http://localhost:3000/api/docs).

## Docker workflow

```bash
docker-compose up --build
```

- Starts PostgreSQL (db) and the API (api).
- entrypoint waits for DB, runs migrations, then starts dist build.

Stop with `docker-compose down`.

## Tests & Quality

```bash
yarn test
yarn test:cov
yarn lint
```

GitHub Actions (.github/workflows/ci.yml) runs lint, build, migrations and coverage on every push/PR.

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

Bearer header: Authorization: Bearer <token>.

> Need the OpenAPI contract offline? Check `api/docs/openapi.yaml` for the latest specification consumed by Swagger.

### Column selection (`select`)

`GET /api/products` accepts a `select` parameter (comma-separated string or multiple values) to return only the specified columns.  

Example:  
`?select=name,price,stock`  
This will return each product with only those fields.


## Sync behaviour

- Cron expression defaults to hourly (0 * * * *).
- SyncStateRepository stores last successful cursor to resume incremental fetches.
- Soft-deleted records are excluded from upserts.

## Useful scripts

```bash
yarn build
yarn start:prod
yarn migration:run:dist
yarn migration:revert
```

## Notes

- Node 20 (Active LTS) + NestJS 10.
- TypeScript everywhere (app, tests, config).
- Coverage > 90% (statements/branches/functions/lines).
- Swagger tags grouped by module for demo clarity.

Happy hacking!
