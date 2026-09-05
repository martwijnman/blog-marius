<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The posts.id repair renamed `posts` to `posts_without_id` before rebuilding it.
 * SQLite rewrote every foreign key that pointed at `posts` to point at that
 * temporary name, which no longer exists — so inserts into `post_views` and
 * `comments` have been failing ever since. Rebuild both tables with a correct
 * foreign key, carrying the existing rows over.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'sqlite') {
            return;
        }

        $this->rebuild('post_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->string('visitor_id', 64);
            $table->string('country_code', 2)->nullable();
            $table->string('device')->nullable();
            $table->string('referrer')->nullable();
            $table->unsignedInteger('read_seconds')->default(0);
            $table->timestamps();

            $table->index(['post_id', 'created_at']);
        }, ['id', 'post_id', 'visitor_id', 'country_code', 'device', 'referrer', 'read_seconds', 'created_at', 'updated_at']);

        $this->rebuild('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->string('comment');
            $table->timestamps();
        }, ['id', 'post_id', 'email', 'comment', 'created_at', 'updated_at']);
    }

    public function down(): void
    {
        // The broken foreign key is not worth restoring.
    }

    /**
     * @param  array<int, string>  $columns
     */
    private function rebuild(string $table, Closure $definition, array $columns): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        $sql = (string) DB::table('sqlite_master')
            ->where('type', 'table')
            ->where('name', $table)
            ->value('sql');

        if (! str_contains($sql, 'posts_without_id')) {
            return;
        }

        $carried = array_values(array_filter(
            $columns,
            fn (string $column) => Schema::hasColumn($table, $column)
        ));

        Schema::withoutForeignKeyConstraints(function () use ($table, $definition, $carried) {
            // SQLite carries the indexes along with the rename, and their names
            // would then collide with the ones the fresh table declares.
            $this->dropIndexes($table);

            Schema::rename($table, $table.'_broken_fk');
            Schema::create($table, $definition);

            $list = implode(', ', array_map(fn (string $column) => '"'.$column.'"', $carried));

            DB::statement("insert into \"{$table}\" ({$list}) select {$list} from \"{$table}_broken_fk\"");

            Schema::drop($table.'_broken_fk');
        });
    }

    private function dropIndexes(string $table): void
    {
        $indexes = DB::table('sqlite_master')
            ->where('type', 'index')
            ->where('tbl_name', $table)
            ->whereNotNull('sql')
            ->pluck('name');

        foreach ($indexes as $index) {
            DB::statement('drop index if exists "'.$index.'"');
        }
    }
};
