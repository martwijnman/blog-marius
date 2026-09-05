<?php

namespace App\Http\Controllers;

use App\Models\PostView;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PostViewController extends Controller
{
    public function store(Request $request, string $post)
    {
        $data = $request->validate([
            'device' => ['nullable', 'string', 'max:255'],
            'referrer' => ['nullable', 'string', 'max:2048'],
            'read_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $postExists = Schema::hasColumn('posts', 'id')
            ? DB::table('posts')->where('id', $post)->exists()
            : DB::table('posts')->whereRaw('rowid = ?', [$post])->exists();

        abort_unless($postExists, 404);

        $visitorId = hash(
            'sha256',
            $request->ip().$request->userAgent().now()->toDateString()
        );

        $shouldIncrementViews = cache()->add(
            "post-viewed:{$post}:{$visitorId}",
            true,
            now()->addDay()
        );

        try {
            $view = PostView::firstOrCreate(
                [
                    'post_id' => (int) $post,
                    'visitor_id' => $visitorId,
                ],
                [
                    'country_code' => $this->countryCode($request),
                    'device' => $data['device'] ?? null,
                    'referrer' => $data['referrer'] ?? null,
                    'read_seconds' => $data['read_seconds'] ?? 0,
                ]
            );

            $shouldIncrementViews = $view->wasRecentlyCreated;

            // The page pings again when the reader leaves, to report how long
            // they stayed. Keep the longest visit of the day.
            if (! $view->wasRecentlyCreated) {
                $view->fill([
                    'country_code' => $view->country_code ?: $this->countryCode($request),
                    'device' => $view->device ?: ($data['device'] ?? null),
                    'referrer' => $view->referrer ?: ($data['referrer'] ?? null),
                    'read_seconds' => max((int) $view->read_seconds, (int) ($data['read_seconds'] ?? 0)),
                ])->save();
            }
        } catch (QueryException) {
            // Keep counting the view when the legacy post_views foreign key is invalid.
        }

        if ($shouldIncrementViews) {
            if (Schema::hasColumn('posts', 'id')) {
                DB::table('posts')->where('id', $post)->increment('views');
            } else {
                DB::table('posts')->whereRaw('rowid = ?', [$post])->increment('views');
            }
        }

        return response()->noContent();
    }

    /**
     * Country of the visitor, as reported by whichever edge proxy is in front
     * of the app. Null in local development — there is no proxy to ask.
     */
    private function countryCode(Request $request): ?string
    {
        $code = $request->header('CF-IPCountry')
            ?? $request->header('X-Vercel-IP-Country');

        return $code && strlen($code) === 2 && $code !== 'XX'
            ? strtoupper($code)
            : null;
    }
}
