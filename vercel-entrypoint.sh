#!/bin/sh

set -eu

echo "Starting Laravel..."

# Vercel injects these variables only at runtime. If a Neon URL exists but
# DB_CONNECTION was not copied into Vercel, use PostgreSQL automatically.
if [ -n "${DB_URL:-}" ] || [ -n "${DATABASE_URL:-}" ]; then
    export DB_CONNECTION="${DB_CONNECTION:-pgsql}"
fi

# Do not use a stale cached config from the image during a Vercel deploy.
php artisan config:clear
php artisan view:clear

if [ "${DB_CONNECTION:-}" = "pgsql" ]; then
    echo "PostgreSQL detected, running migrations..."
    php artisan migrate --force
    echo "Migrations finished."
fi

exec "$@"