<?php

namespace Database\Factories;

use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = rtrim(fake()->sentence(nbWords: 6), '.');
        $createdAt = fake()->dateTimeBetween('-6 months', 'now');

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1, 99999),
            'excerpt' => fake()->sentence(nbWords: 18),
            'content' => collect(fake()->paragraphs(nb: 6))->implode("\n\n"),
            'status' => 'published',
            'views' => 0,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => 'draft']);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => 'archived']);
    }
}
