#!/bin/sh
# BELANGRIJK: deze entrypoint mag NOOIT afbreken.
# Als dit script met een foutcode stopt, sterft de container en geeft Vercel
# FUNCTION_INVOCATION_FAILED op elke pagina. Elke stap hieronder mag dus
# falen; we loggen het en starten de webserver hoe dan ook.
# Wat er misging is daarna te lezen op /__boot?key=<BOOT_LOG_KEY>.

BOOT_LOG=/tmp/boot.log
: > "$BOOT_LOG"

log() {
    echo "$@" >> "$BOOT_LOG"
    echo "boot: $@" >&2
}

run() {
    log "--- $* ---"
    out=$("$@" 2>&1)
    code=$?
    log "$out"
    log "exit=$code"
    return 0
}

log "entrypoint start $(date -u +%FT%TZ)"

# Vercel injecteert DATABASE_URL pas op runtime. Staat die er, dan is
# Postgres de echte database, ook als DB_CONNECTION niet is meegekopieerd.
if [ -n "${DB_URL:-}" ] || [ -n "${DATABASE_URL:-}" ]; then
    if [ -z "${DB_CONNECTION:-}" ] || [ "$(echo "${DB_CONNECTION}" | tr -d '[:space:]')" = "" ]; then
        DB_CONNECTION=pgsql
        export DB_CONNECTION
    fi
fi
log "DB_CONNECTION=${DB_CONNECTION:-<leeg>} DATABASE_URL=$([ -n "${DATABASE_URL:-}" ] && echo aanwezig || echo leeg)"

# De image bevat een config-cache die op SQLite is gebouwd; die moet weg.
run php artisan config:clear
run php artisan view:clear

if [ "$(echo "${DB_CONNECTION:-}" | tr -d '[:space:]')" = "pgsql" ]; then
    run php artisan migrate --force
    run php artisan db:seed --force
fi

log "entrypoint klaar, webserver start"

exec "$@"
