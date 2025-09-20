#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] waiting for database..."
until nc -z "${DB_HOST:-postgres}" "${DB_PORT:-5432}"; do
  sleep 1
done

echo "[entrypoint] running migrations..."
if [ -d "/app/dist" ]; then
  yarn migration:run:dist
else
  yarn migration:run
fi

echo "[entrypoint] starting app..."
if [ -d "/app/dist" ]; then
  node dist/main.js
else
  yarn start:dev
fi
