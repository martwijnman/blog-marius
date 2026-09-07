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
     * Top countries by tracked visit, tail folded into "Other". Each row carries
     * its share of the located total so the UI never has to divide.
     *
     * @param  Collection<int, PostView>  $views
     * @return array<int, array<string, mixed>>
     */
    private function countries(Collection $views): array
    {
        $located = $views->filter(fn (PostView $view) => filled($view->country_code));
        $total = $located->count();

        if ($total === 0) {
            return [];
        }

        $grouped = $located
            ->groupBy(fn (PostView $view) => strtoupper($view->country_code))
            ->map(fn (Collection $group) => $group->count())
            ->sortDesc();

        $rows = $grouped
            ->take(self::TOP_N)
            ->map(fn (int $count, string $code) => [
                'code' => $code,
                'name' => self::COUNTRY_NAMES[$code] ?? $code,
                'views' => $count,
                'share' => round(($count / $total) * 100, 1),
            ])
            ->values()
            ->all();

        $rest = $grouped->slice(self::TOP_N)->sum();

        if ($rest > 0) {
            $rows[] = [
                'code' => 'OTHER',
                'name' => 'Other',
                'views' => $rest,
                'share' => round(($rest / $total) * 100, 1),
            ];
        }

        return $rows;
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
     * Readable names for the country codes an edge proxy is likely to report.
     * Anything outside this list falls back to the raw two-letter code.
     *
     * @var array<string, string>
     */
    private const COUNTRY_NAMES = [
        'NL' => 'Netherlands',
        'BE' => 'Belgium',
        'DE' => 'Germany',
        'FR' => 'France',
        'GB' => 'United Kingdom',
        'IE' => 'Ireland',
        'ES' => 'Spain',
        'PT' => 'Portugal',
        'IT' => 'Italy',
        'CH' => 'Switzerland',
        'AT' => 'Austria',
        'PL' => 'Poland',
        'CZ' => 'Czechia',
        'SE' => 'Sweden',
        'NO' => 'Norway',
        'DK' => 'Denmark',
        'FI' => 'Finland',
        'UA' => 'Ukraine',
        'RU' => 'Russia',
        'TR' => 'Türkiye',
        'GR' => 'Greece',
        'RO' => 'Romania',
        'US' => 'United States',
        'CA' => 'Canada',
        'MX' => 'Mexico',
        'BR' => 'Brazil',
        'AR' => 'Argentina',
        'CL' => 'Chile',
        'CO' => 'Colombia',
        'ZA' => 'South Africa',
        'NG' => 'Nigeria',
        'EG' => 'Egypt',
        'MA' => 'Morocco',
        'AE' => 'United Arab Emirates',
        'IL' => 'Israel',
        'IN' => 'India',
        'PK' => 'Pakistan',
        'CN' => 'China',
        'JP' => 'Japan',
        'KR' => 'South Korea',
        'ID' => 'Indonesia',
        'SG' => 'Singapore',
        'TH' => 'Thailand',
        'VN' => 'Vietnam',
        'PH' => 'Philippines',
        'AU' => 'Australia',
        'NZ' => 'New Zealand',
    ];
}
