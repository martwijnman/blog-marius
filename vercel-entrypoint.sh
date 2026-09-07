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
    # Neon geeft twee hosts: de pooler (PgBouncer, transaction mode) en een
    # directe verbinding. Over de pooler mislukken migraties: DDL en de
    # prepared statements die Laravel gebruikt overleven het poolen niet, en
    # Postgres gooit daarna 25P02 op elk volgend statement in de transactie.
    # Migreren en seeden gaat daarom over de UNPOOLED url; de webserver zelf
    # blijft de pooler gebruiken, want die heeft de connectiepool wel nodig.
    for candidate in "${DATABASE_URL_UNPOOLED:-}" "${POSTGRES_URL_NON_POOLING:-}" "${POSTGRES_URL_NO_SSL:-}"; do
        if [ -n "$candidate" ]; then
            DB_URL="$candidate"
            export DB_URL
            log "migreren via directe (unpooled) verbinding"
            break
        fi
    done
    if [ -z "${DB_URL:-}" ]; then
        log "LET OP: geen unpooled url gevonden, migreren via de pooler"
    fi

    run php artisan migrate --force
    run php artisan db:seed --force

    # De webserver draait weer gewoon over de pooler.
    unset DB_URL
fi

log "entrypoint klaar, webserver start"

exec "$@"
