#!/bin/sh
# Start van de container op een host met een gekoppeld volume (Fly.io).
#
# Het volume hangt op /mnt/data en is bij de eerste start leeg en van root. Hier
# wordt alles klaargezet wat blijvend moet zijn: de SQLite-database en de
# storage-map met de geuploade afbeeldingen. Daarna pas migreren en starten.
set -e

# Bewust niet /data: FrankenPHP gebruikt /data/caddy al in de image.
DATA_DIR="${DATA_DIR:-/mnt/data}"

if [ -d "$DATA_DIR" ]; then
    mkdir -p \
        "$DATA_DIR/database" \
        "$DATA_DIR/storage/app/public" \
        "$DATA_DIR/storage/framework/cache/data" \
        "$DATA_DIR/storage/framework/sessions" \
        "$DATA_DIR/storage/framework/views" \
        "$DATA_DIR/storage/logs"

    # De database moet bestaan voordat sqlite hem opent.
    [ -f "$DATA_DIR/database/database.sqlite" ] || touch "$DATA_DIR/database/database.sqlite"

    if [ "$(id -u)" = "0" ]; then
        chown -R www-data:www-data "$DATA_DIR"
    fi
fi

# Als root: terugzakken naar www-data. setpriv zit in util-linux en is in het
# basisimage aanwezig; is hij er onverhoopt niet, dan draaien we door als root
# in plaats van de container te laten crashen.
drop_privileges() {
    if [ "$(id -u)" != "0" ]; then
        return 1
    fi

    command -v setpriv >/dev/null 2>&1
}

run_as_app() {
    if drop_privileges; then
        setpriv --reuid=www-data --regid=www-data --init-groups "$@"
    else
        "$@"
    fi
}

# public/storage wijst naar storage/app/public, dat nu op het volume staat.
run_as_app php artisan storage:link --force

# Migraties horen bij het opstarten, niet bij de build: de database staat op
# het volume en wordt dus niet meer met de image meegeleverd.
run_as_app php artisan migrate --force

if drop_privileges; then
    exec setpriv --reuid=www-data --regid=www-data --init-groups "$@"
fi

exec "$@"
