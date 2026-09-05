<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use App\Models\PostView;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    /** Length of the trend window, in days. */
    private const WINDOW = 30;

    /** How many rows a "top N" list shows before the rest folds into Other. */
    private const TOP_N = 6;

    /**
     * The whole dashboard is one payload. A personal blog holds a few thousand
     * rows at most, so everything is loaded once and aggregated in PHP rather
     * than fired off as a dozen separate GROUP BY queries.
     */
    public function index(): Response
    {
        $posts = Post::query()->with('category')->get();
        $views = PostView::query()->get();
        $likes = Like::query()->get();
        $comments = Comment::query()->get();

        return Inertia::render('analytics', [
            'stats' => [
                'window' => self::WINDOW,
                'totals' => $this->totals($posts, $views, $likes, $comments),
                'timeseries' => $this->timeseries($views, $likes, $comments),
                'topPosts' => $this->topPosts($posts, $views, $likes, $comments),
                'countries' => $this->countries($views),
                'devices' => $this->breakdown($views, fn (PostView $view) => $view->device ?: 'Unknown'),
                'referrers' => $this->breakdown($views, fn (PostView $view) => $this->referrerLabel($view->referrer)),
                'categories' => $this->categories($posts, $views, $likes),
                'statuses' => $this->statuses($posts),
                'readTime' => $this->readTime($views),
                'publishing' => $this->publishing($posts),
                'weekdays' => $this->weekdays($views),
                'hours' => $this->hours($views),
            ],
        ]);
    }

    /**
     * @param  Collection<int, Post>  $posts
     * @param  Collection<int, PostView>  $views
     * @param  Collection<int, Like>  $likes
     * @param  Collection<int, Comment>  $comments
     * @return array<string, mixed>
     */
    private function totals(Collection $posts, Collection $views, Collection $likes, Collection $comments): array
    {
        // posts.views is the counter the public page increments; post_views holds
        // one row per visitor per day and is what every breakdown below reads.
        $counted = (int) $posts->sum('views');
        $tracked = $views->count();

        $read = $views->where('read_seconds', '>', 0);

        return [
            'posts' => $posts->count(),
            'published' => $posts->where('status', 'published')->count(),
            'drafts' => $posts->where('status', 'draft')->count(),
            'archived' => $posts->where('status', 'archived')->count(),
            'views' => max($counted, $tracked),
            'trackedViews' => $tracked,
            'readers' => $views->pluck('visitor_id')->unique()->count(),
            'likes' => $likes->count(),
            'comments' => $comments->count(),
            'avgReadSeconds' => $read->isEmpty() ? 0 : (int) round($read->avg('read_seconds')),
            'engagementRate' => $tracked === 0
                ? 0.0
                : round((($likes->count() + $comments->count()) / $tracked) * 100, 1),
            'viewsDelta' => $this->delta($views),
            'likesDelta' => $this->delta($likes),
            'commentsDelta' => $this->delta($comments),
        ];
    }

    /**
     * Percentage change of this window against the one before it. Null when the
     * previous window is empty — "+100%" against nothing is noise, not a trend.
     *
     * @param  Collection<int, mixed>  $records
     */
    private function delta(Collection $records): ?float
    {
        $now = Carbon::now();
        $current = $this->countBetween($records, $now->copy()->subDays(self::WINDOW), $now);
        $previous = $this->countBetween(
            $records,
            $now->copy()->subDays(self::WINDOW * 2),
            $now->copy()->subDays(self::WINDOW)
        );

        if ($previous === 0) {
            return null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    /**
     * @param  Collection<int, mixed>  $records
     */
    private function countBetween(Collection $records, Carbon $from, Carbon $to): int
    {
        return $records
            ->filter(fn ($record) => $record->created_at?->between($from, $to))
            ->count();
    }

    /**
     * @param  Collection<int, PostView>  $views
     * @param  Collection<int, Like>  $likes
     * @param  Collection<int, Comment>  $comments
     * @return array<int, array<string, mixed>>
     */
    private function timeseries(Collection $views, Collection $likes, Collection $comments): array
    {
        $viewsByDay = $this->countByDay($views);
        $likesByDay = $this->countByDay($likes);
        $commentsByDay = $this->countByDay($comments);

        $series = [];

        for ($day = self::WINDOW - 1; $day >= 0; $day--) {
            $date = Carbon::today()->subDays($day);
            $key = $date->toDateString();

            $series[] = [
                'date' => $key,
                'label' => $date->format('j M'),
                'views' => $viewsByDay[$key] ?? 0,
                'likes' => $likesByDay[$key] ?? 0,
                'comments' => $commentsByDay[$key] ?? 0,
            ];
        }

        return $series;
    }

    /**
     * @param  Collection<int, mixed>  $records
     * @return array<string, int>
     */
    private function countByDay(Collection $records): array
    {
        return $records
            ->filter(fn ($record) => $record->created_at !== null)
            ->groupBy(fn ($record) => $record->created_at->toDateString())
            ->map(fn (Collection $group) => $group->count())
            ->all();
    }

    /**
     * @param  Collection<int, Post>  $posts
     * @param  Collection<int, PostView>  $views
     * @param  Collection<int, Like>  $likes
     * @param  Collection<int, Comment>  $comments
     * @return array<int, array<string, mixed>>
     */
    private function topPosts(Collection $posts, Collection $views, Collection $likes, Collection $comments): array
    {
        $viewsByPost = $views->groupBy('post_id')->map->count();
        $likesByPost = $likes->groupBy('post_id')->map->count();
        $commentsByPost = $comments->groupBy('post_id')->map->count();

        return $posts
            ->map(function (Post $post) use ($viewsByPost, $likesByPost, $commentsByPost) {
                $postViews = max((int) $post->views, $viewsByPost[$post->id] ?? 0);
                $postLikes = $likesByPost[$post->id] ?? 0;
                $postComments = $commentsByPost[$post->id] ?? 0;

                return [
                    'id' => $post->id,
                    'title' => $post->title ?: $post->slug,
                    'slug' => $post->slug,
                    'status' => $post->status,
                    'category' => $post->category?->name,
                    'views' => $postViews,
                    'likes' => $postLikes,
                    'comments' => $postComments,
                    'engagement' => $postViews === 0
                        ? 0.0
                        : round((($postLikes + $postComments) / $postViews) * 100, 1),
                ];
            })
            ->sortByDesc('views')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, PostView>  $views
     * @return array<int, array<string, mixed>>
     */
    private function countries(Collection $views): array
    {
        return $views
            ->filter(fn (PostView $view) => filled($view->country_code))
            ->groupBy(fn (PostView $view) => strtoupper($view->country_code))
            ->map(fn (Collection $group, string $code) => [
                'code' => $code,
                'name' => self::COUNTRIES[$code]['name'] ?? $code,
                'x' => self::COUNTRIES[$code]['x'] ?? null,
                'y' => self::COUNTRIES[$code]['y'] ?? null,
                'views' => $group->count(),
            ])
            ->sortByDesc('views')
            ->values()
            ->all();
    }

    /**
     * Top N by volume with the tail folded into a single "Other" row, so a chart
     * never has to invent a ninth categorical colour.
     *
     * @param  Collection<int, PostView>  $views
     * @return array<int, array<string, mixed>>
     */
    private function breakdown(Collection $views, callable $key): array
    {
        $grouped = $views
            ->groupBy($key)
            ->map(fn (Collection $group) => $group->count())
            ->sortDesc();

        $top = $grouped->take(self::TOP_N);
        $rest = $grouped->slice(self::TOP_N)->sum();

        $rows = $top
            ->map(fn (int $count, string $name) => ['name' => $name, 'views' => $count])
            ->values()
            ->all();

        if ($rest > 0) {
            $rows[] = ['name' => 'Other', 'views' => $rest];
        }

        return $rows;
    }

    private function referrerLabel(?string $referrer): string
    {
        if (blank($referrer)) {
            return 'Direct';
        }

        $host = parse_url($referrer, PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            return 'Direct';
        }

        $host = preg_replace('/^www\./', '', $host);

        return $host === request()->getHost() ? 'Internal' : $host;
    }

    /**
     * @param  Collection<int, Post>  $posts
     * @param  Collection<int, PostView>  $views
     * @param  Collection<int, Like>  $likes
     * @return array<int, array<string, mixed>>
     */
    private function categories(Collection $posts, Collection $views, Collection $likes): array
    {
        $viewsByPost = $views->groupBy('post_id')->map->count();
        $likesByPost = $likes->groupBy('post_id')->map->count();

        return $posts
            ->groupBy(fn (Post $post) => $post->category?->name ?? 'Uncategorised')
            ->map(fn (Collection $group, string $name) => [
                'name' => $name,
                'posts' => $group->count(),
                'views' => $group->sum(fn (Post $post) => max((int) $post->views, $viewsByPost[$post->id] ?? 0)),
                'likes' => $group->sum(fn (Post $post) => $likesByPost[$post->id] ?? 0),
            ])
            ->sortByDesc('views')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Post>  $posts
     * @return array<int, array<string, mixed>>
     */
    private function statuses(Collection $posts): array
    {
        return collect(['published', 'draft', 'archived'])
            ->map(fn (string $status) => [
                'name' => ucfirst($status),
                'posts' => $posts->where('status', $status)->count(),
            ])
            ->all();
    }

    /**
     * @param  Collection<int, PostView>  $views
     * @return array<int, array<string, mixed>>
     */
    private function readTime(Collection $views): array
    {
        $buckets = [
            '0–15s' => fn (int $seconds) => $seconds < 15,
            '15–60s' => fn (int $seconds) => $seconds >= 15 && $seconds < 60,
            '1–3 min' => fn (int $seconds) => $seconds >= 60 && $seconds < 180,
            '3–10 min' => fn (int $seconds) => $seconds >= 180 && $seconds < 600,
            '10 min+' => fn (int $seconds) => $seconds >= 600,
        ];

        $measured = $views->where('read_seconds', '>', 0);

        return collect($buckets)
            ->map(fn (callable $matches, string $label) => [
                'label' => $label,
                'views' => $measured->filter(fn (PostView $view) => $matches((int) $view->read_seconds))->count(),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Post>  $posts
     * @return array<int, array<string, mixed>>
     */
    private function publishing(Collection $posts): array
    {
        $byMonth = $posts
            ->filter(fn (Post $post) => $post->created_at !== null)
            ->groupBy(fn (Post $post) => $post->created_at->format('Y-m'))
            ->map(fn (Collection $group) => $group->count());

        $months = [];

        for ($month = 11; $month >= 0; $month--) {
            $date = Carbon::today()->startOfMonth()->subMonths($month);

            $months[] = [
                'label' => $date->format('M y'),
                'posts' => $byMonth[$date->format('Y-m')] ?? 0,
            ];
        }

        return $months;
    }

    /**
     * @param  Collection<int, PostView>  $views
     * @return array<int, array<string, mixed>>
     */
    private function weekdays(Collection $views): array
    {
        $byWeekday = $views
            ->filter(fn (PostView $view) => $view->created_at !== null)
            ->groupBy(fn (PostView $view) => $view->created_at->dayOfWeekIso)
            ->map(fn (Collection $group) => $group->count());

        return collect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
            ->map(fn (string $label, int $index) => [
                'label' => $label,
                'views' => $byWeekday[$index + 1] ?? 0,
            ])
            ->all();
    }

    /**
     * @param  Collection<int, PostView>  $views
     * @return array<int, array<string, mixed>>
     */
    private function hours(Collection $views): array
    {
        $byHour = $views
            ->filter(fn (PostView $view) => $view->created_at !== null)
            ->groupBy(fn (PostView $view) => (int) $view->created_at->format('G'))
            ->map(fn (Collection $group) => $group->count());

        return collect(range(0, 23))
            ->map(fn (int $hour) => [
                'label' => str_pad((string) $hour, 2, '0', STR_PAD_LEFT),
                'views' => $byHour[$hour] ?? 0,
            ])
            ->all();
    }

    /**
     * Name and rough map position (percentages of the world map box) for the
     * country codes an edge proxy is likely to report.
     *
     * @var array<string, array{name: string, x: float, y: float}>
     */
    private const COUNTRIES = [
        'NL' => ['name' => 'Netherlands', 'x' => 49.5, 'y' => 30.0],
        'BE' => ['name' => 'Belgium', 'x' => 48.8, 'y' => 31.5],
        'DE' => ['name' => 'Germany', 'x' => 51.5, 'y' => 30.5],
        'FR' => ['name' => 'France', 'x' => 47.5, 'y' => 34.0],
        'GB' => ['name' => 'United Kingdom', 'x' => 46.5, 'y' => 28.0],
        'IE' => ['name' => 'Ireland', 'x' => 44.5, 'y' => 28.5],
        'ES' => ['name' => 'Spain', 'x' => 45.5, 'y' => 37.0],
        'PT' => ['name' => 'Portugal', 'x' => 43.5, 'y' => 37.5],
        'IT' => ['name' => 'Italy', 'x' => 52.0, 'y' => 36.0],
        'CH' => ['name' => 'Switzerland', 'x' => 50.5, 'y' => 32.5],
        'AT' => ['name' => 'Austria', 'x' => 52.0, 'y' => 32.0],
        'PL' => ['name' => 'Poland', 'x' => 54.0, 'y' => 29.5],
        'CZ' => ['name' => 'Czechia', 'x' => 52.5, 'y' => 30.5],
        'SE' => ['name' => 'Sweden', 'x' => 53.0, 'y' => 24.0],
        'NO' => ['name' => 'Norway', 'x' => 51.0, 'y' => 23.0],
        'DK' => ['name' => 'Denmark', 'x' => 51.0, 'y' => 27.5],
        'FI' => ['name' => 'Finland', 'x' => 56.0, 'y' => 22.5],
        'UA' => ['name' => 'Ukraine', 'x' => 57.5, 'y' => 30.0],
        'RU' => ['name' => 'Russia', 'x' => 68.0, 'y' => 24.0],
        'TR' => ['name' => 'Türkiye', 'x' => 58.0, 'y' => 36.0],
        'GR' => ['name' => 'Greece', 'x' => 55.0, 'y' => 37.0],
        'RO' => ['name' => 'Romania', 'x' => 55.5, 'y' => 32.0],
        'US' => ['name' => 'United States', 'x' => 22.0, 'y' => 36.0],
        'CA' => ['name' => 'Canada', 'x' => 22.0, 'y' => 25.0],
        'MX' => ['name' => 'Mexico', 'x' => 19.0, 'y' => 45.0],
        'BR' => ['name' => 'Brazil', 'x' => 33.0, 'y' => 63.0],
        'AR' => ['name' => 'Argentina', 'x' => 30.0, 'y' => 75.0],
        'CL' => ['name' => 'Chile', 'x' => 28.0, 'y' => 74.0],
        'CO' => ['name' => 'Colombia', 'x' => 27.0, 'y' => 55.0],
        'ZA' => ['name' => 'South Africa', 'x' => 53.5, 'y' => 76.0],
        'NG' => ['name' => 'Nigeria', 'x' => 48.5, 'y' => 53.0],
        'EG' => ['name' => 'Egypt', 'x' => 56.0, 'y' => 42.0],
        'MA' => ['name' => 'Morocco', 'x' => 44.0, 'y' => 41.0],
        'AE' => ['name' => 'United Arab Emirates', 'x' => 62.5, 'y' => 44.0],
        'IL' => ['name' => 'Israel', 'x' => 57.5, 'y' => 40.0],
        'IN' => ['name' => 'India', 'x' => 68.0, 'y' => 45.0],
        'PK' => ['name' => 'Pakistan', 'x' => 66.0, 'y' => 41.0],
        'CN' => ['name' => 'China', 'x' => 75.0, 'y' => 36.0],
        'JP' => ['name' => 'Japan', 'x' => 84.0, 'y' => 36.0],
        'KR' => ['name' => 'South Korea', 'x' => 81.0, 'y' => 36.0],
        'ID' => ['name' => 'Indonesia', 'x' => 77.0, 'y' => 60.0],
        'SG' => ['name' => 'Singapore', 'x' => 74.5, 'y' => 56.0],
        'TH' => ['name' => 'Thailand', 'x' => 74.0, 'y' => 48.0],
        'VN' => ['name' => 'Vietnam', 'x' => 75.5, 'y' => 47.0],
        'PH' => ['name' => 'Philippines', 'x' => 79.0, 'y' => 49.0],
        'AU' => ['name' => 'Australia', 'x' => 83.0, 'y' => 70.0],
        'NZ' => ['name' => 'New Zealand', 'x' => 92.0, 'y' => 78.0],
    ];
}
