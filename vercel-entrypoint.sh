#!/bin/sh
# De build-stage draait migraties tegen het SQLite-bestand in de image, want
# daar staat DB_CONNECTION=sqlite hard gezet. Tegen de echte database (Neon
# Postgres) kan dat alleen bij het opstarten, want pas dan zijn DATABASE_URL
# en DB_CONNECTION uit Vercel beschikbaar.
#
# Migraties zijn idempotent, dus dit mag bij elke koude start draaien. Faalt
# het, dan gaat de container toch door: een tijdelijk databaseprobleem mag de
# site niet volledig platleggen, dan krijg je alleen een nette Laravel-fout.
set -e

if [ -n "$DATABASE_URL" ] || [ "$DB_CONNECTION" = "pgsql" ]; then
    php artisan migrate --force || echo "entrypoint: migrate mislukt, ga door" >&2
    php artisan db:seed --force || echo "entrypoint: seed mislukt, ga door" >&2
fi

exec "$@"
