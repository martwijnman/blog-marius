<?php

use App\Http\Controllers\AnalyticsController;
use App\Models\Image;
use App\Models\Post;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/*
 * Afbeeldingen worden hier uitgeserveerd in plaats van via de
 * public/storage-symlink. Die symlink is op Windows vaak stuk (aanmaken
 * vereist adminrechten) en bestaat niet in een verse container, waardoor
 * elke foto een 404 werd. Deze route leest het bestand gewoon van de disk.
 */
Route::get('/media/{path}', function (string $path) {
    // {path} vangt alles inclusief slashes, dus ../ hier expliciet weren.
    abort_if(str_contains($path, '..'), 404);

    $image = Image::where('path', $path)->first();

    if ($image && ($contents = $image->binaryContents()) !== null) {
        return response($contents, 200, [
            'Content-Type' => $image->mime_type ?: 'application/octet-stream',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    // Afbeeldingen van voor de overstap staan nog op schijf.
    abort_unless(Storage::disk('public')->exists($path), 404);

    return Storage::disk('public')->response($path);
})->where('path', '.*')->name('media');

/*
 * Diagnose-route. Op Vercel blijven de Runtime Logs leeg, dus zonder dit
 * eindpunt is een opstartfout van de container onzichtbaar. Raakt geen
 * sessie of view aan, zodat hij ook werkt als de rest 500't.
 * Aanroepen met ?key=blog-diag-2026.
 */
Route::get('/__boot', function () {
    abort_unless(request('key') === 'blog-diag-2026', 404);

    $lines = [];
    $lines[] = 'default connection: '.config('database.default');
    $lines[] = 'DATABASE_URL env: '.(env('DATABASE_URL') ? 'aanwezig' : 'leeg');
    $lines[] = 'SESSION_DRIVER: '.config('session.driver');
    $lines[] = 'pdo drivers: '.implode(',', \PDO::getAvailableDrivers());
    // Alleen de NAMEN, nooit de waarden: hier staan wachtwoorden in.
    $dbEnvNames = array_values(array_filter(
        array_keys($_SERVER),
        fn ($n) => is_string($n) && preg_match('/^(DATABASE_|POSTGRES_|PG|DB_)/', $n) === 1
    ));
    sort($dbEnvNames);
    $lines[] = 'db-gerelateerde env vars (namen): '.implode(', ', $dbEnvNames);

    try {
        $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
        $lines[] = 'DB verbinding: OK ('.$pdo->getAttribute(\PDO::ATTR_SERVER_VERSION).')';
        $tables = \Illuminate\Support\Facades\DB::connection()->getSchemaBuilder()->getTableListing();
        $lines[] = 'tabellen: '.implode(', ', $tables);
        $lines[] = 'posts: '.\Illuminate\Support\Facades\DB::table('posts')->count();
        $lines[] = 'images: '.\Illuminate\Support\Facades\DB::table('images')->count();
    } catch (\Throwable $e) {
        $lines[] = 'DB FOUT: '.get_class($e).': '.$e->getMessage();
    }

    // ?action=probe: Laravel voert de eerste migratie in een transactie uit,
    // dus de echte fout wordt overschreven door 25P02. Hier draaien we de
    // statements los van elkaar, zodat de onderdrukte fout zichtbaar wordt.
    if (request('action') === 'probe') {
        $lines[] = str_repeat('=', 40);
        $lines[] = 'ALLE RELATIES (incl. views/sequences):';
        try {
            $rows = \Illuminate\Support\Facades\DB::select(
                "select n.nspname as schema, c.relname as naam, c.relkind as soort
                 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname not in ('pg_catalog', 'information_schema')
                   and n.nspname not like 'pg_%'
                 order by 1, 2"
            );
            foreach ($rows as $row) {
                $lines[] = '  '.$row->schema.'.'.$row->naam.' ['.$row->soort.']';
            }
        } catch (\Throwable $e) {
            $lines[] = '  FOUT: '.$e->getMessage();
        }

        $lines[] = str_repeat('-', 40);
        $lines[] = 'search_path / user / rechten:';
        foreach ([
            'search_path' => 'show search_path',
            'current_user' => 'select current_user as v',
            'current_schema' => 'select current_schema() as v',
            'create op public' => "select has_schema_privilege(current_user, 'public', 'CREATE') as v",
        ] as $label => $sql) {
            try {
                $r = (array) \Illuminate\Support\Facades\DB::selectOne($sql);
                $lines[] = '  '.$label.': '.json_encode(array_values($r));
            } catch (\Throwable $e) {
                $lines[] = '  '.$label.': FOUT '.$e->getMessage();
            }
        }

        $lines[] = str_repeat('-', 40);
        $lines[] = 'losse statements (elk in eigen try/catch):';
        $statements = [
            'drop probe' => 'drop table if exists "__probe_users"',
            'create probe' => 'create table "__probe_users" ("id" bigserial not null primary key, "email" varchar(255) not null)',
            'unique probe' => 'alter table "__probe_users" add constraint "__probe_users_email_unique" unique ("email")',
            'opruimen' => 'drop table if exists "__probe_users"',
            'create users (echte statement)' => 'create table "users" ("id" bigserial not null primary key, "name" varchar(255) not null, "email" varchar(255) not null, "email_verified_at" timestamp(0) without time zone null, "password" varchar(255) not null, "remember_token" varchar(100) null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null)',
        ];
        foreach ($statements as $label => $sql) {
            try {
                \Illuminate\Support\Facades\DB::statement($sql);
                $lines[] = '  OK   '.$label;
            } catch (\Throwable $e) {
                $lines[] = '  FOUT '.$label.': '.$e->getMessage();
            }
        }
    }

    $lines[] = str_repeat('=', 40);
    $lines[] = is_readable('/tmp/boot.log') ? (string) file_get_contents('/tmp/boot.log') : 'geen /tmp/boot.log';

    return response(implode("\n", $lines), 200, ['Content-Type' => 'text/plain; charset=utf-8']);
})->name('boot_diag');

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/archive', 'posts/archive')->name('posts_archive');

Route::get('/posts/{post}', function (Post $post) {
    return Inertia::render('posts/show', [
        'post' => $post,
    ]);
})->name('posts_show_public');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::redirect('analystics', 'analytics')->name('analystics');
    Route::get('analytics', [AnalyticsController::class, 'index'])->name('analytics');
});

require __DIR__.'/settings.php';
