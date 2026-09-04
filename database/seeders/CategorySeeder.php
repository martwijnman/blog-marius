<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Technology', 'slug' => 'technology', 'description' => 'Code, tools and everything I build.'],
            ['name' => 'Design', 'slug' => 'design', 'description' => 'Layout, type and visual details.'],
            ['name' => 'Personal', 'slug' => 'personal', 'description' => 'Notes from everyday life.'],
            ['name' => 'Learning', 'slug' => 'learning', 'description' => 'Lessons picked up along the way.'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
