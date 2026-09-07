<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use App\Models\PostView;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class PostSeeder extends Seeder
{
    /** Countries the fake audience comes from. */
    private const COUNTRIES = ['NL', 'BE', 'DE', 'GB', 'US', 'FR', 'ES', 'PL'];

    private const DEVICES = ['Desktop', 'Mobile', 'Tablet'];

    private const REFERRERS = [
        null,
        'https://www.google.com/',
        'https://news.ycombinator.com/',
        'https://x.com/',
        'https://www.linkedin.com/feed/',
        'https://duckduckgo.com/',
    ];

    public function run(): void
    {
        $categories = Category::query()->pluck('id')->all();

        $posts = collect()
            ->merge(Post::factory()->count(12)->create(['category_id' => fn () => fake()->randomElement($categories)]))
            ->merge(Post::factory()->draft()->count(3)->create(['category_id' => fn () => fake()->randomElement($categories)]))
            ->merge(Post::factory()->archived()->count(2)->create(['category_id' => fn () => fake()->randomElement($categories)]));

        foreach ($posts as $post) {
            if ($post->status !== 'published') {
                continue;
            }

            $this->seedTraffic($post);
        }
    }

    /**
     * Give a post a plausible tail of views, likes and comments, all dated
     * between its publication and today so the analytics trends have shape.
     */
    private function seedTraffic(Post $post): void
    {
        $start = Carbon::parse($post->created_at);
        $viewCount = random_int(20, 180);
        $visitors = [];

        for ($i = 0; $i < $viewCount; $i++) {
            $visitor = 'visitor-'.random_int(1, 400);
            $visitors[] = $visitor;
            $seenAt = Carbon::instance(fake()->dateTimeBetween($start, 'now'));

            PostView::query()->forceCreate([
                'post_id' => $post->id,
                'visitor_id' => $visitor,
                'country_code' => fake()->randomElement(self::COUNTRIES),
                'device' => fake()->randomElement(self::DEVICES),
                'referrer' => fake()->randomElement(self::REFERRERS),
                'read_seconds' => fake()->boolean(70) ? random_int(15, 600) : 0,
                'created_at' => $seenAt,
                'updated_at' => $seenAt,
            ]);
        }

        $likers = collect($visitors)->unique()->shuffle()->take(random_int(2, 25));

        foreach ($likers as $liker) {
            Like::query()->forceCreate([
                'post_id' => $post->id,
                'visitor_id' => $liker,
                'created_at' => fake()->dateTimeBetween($start, 'now'),
                'updated_at' => now(),
            ]);
        }

        for ($i = 0, $commentCount = random_int(0, 6); $i < $commentCount; $i++) {
            $writtenAt = Carbon::instance(fake()->dateTimeBetween($start, 'now'));

            Comment::query()->forceCreate([
                'post_id' => $post->id,
                'email' => fake()->safeEmail(),
                'comment' => fake()->sentence(nbWords: 14),
                'created_at' => $writtenAt,
                'updated_at' => $writtenAt,
            ]);
        }

        $post->forceFill([
            'views' => PostView::query()->where('post_id', $post->id)->count(),
            'likes' => $likers->count(),
        ])->save();
    }
}
