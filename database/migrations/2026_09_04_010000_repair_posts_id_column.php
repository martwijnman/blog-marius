<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $columns = [
        'title',
        'slug',
        'excerpt',
        'content',
        'status',
        'views',
        'likes',
        'created_at',
        'updated_at',
    ];

    /**
     * The posts table lost its id column, which breaks every Eloquent lookup
     * (show, update, destroy). Rebuild it from the sqlite rowid so existing
     * post ids - and the image rows pointing at them - stay valid.
     */
    public function up(): void
    {
        if (Schema::hasColumn('posts', 'id') && ! Schema::hasTable('posts_without_id')) {
            return;
        }

        if (! Schema::hasTable('posts_without_id')) {
            Schema::rename('posts', 'posts_without_id');
            DB::statement('drop index if exists posts_slug_unique');
        }

        if (! Schema::hasColumn('posts', 'id')) {
            $this->createPostsTable();
        }

        $list = implode(', ', $this->columns);

        // Posts written after the table was rebuilt but before this ran; they
        // get fresh ids so the original ids stay free.
        $recent = DB::table('posts')->get($this->columns);
        DB::table('posts')->delete();

        foreach (DB::table('posts_without_id')->selectRaw("rowid as id, $list")->get() as $row) {
            DB::table('posts')->insert((array) $row);
        }

        foreach ($recent as $row) {
            DB::table('posts')->insert((array) $row);
        }

        Schema::drop('posts_without_id');

        DB::statement('create unique index if not exists posts_slug_unique on posts (slug)');
    }

    public function down(): void
    {
        // The previous state was a broken table; there is nothing to restore.
    }

    private function createPostsTable(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->integer('views')->default(0);
            $table->integer('likes')->default(0);
            $table->timestamps();
        });
    }
};
