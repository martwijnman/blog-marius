<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LikeController extends Controller
{
    public function show(Request $request, Post $post)
    {
        return response()->json($this->state($post, $this->visitorId($request)));
    }

    public function store(Request $request, Post $post)
    {
        $visitorId = $this->visitorId($request);

        $like = Like::where('post_id', $post->id)
            ->where('visitor_id', $visitorId)
            ->first();

        if ($like) {
            $like->delete();
        } else {
            Like::create([
                'post_id' => $post->id,
                'visitor_id' => $visitorId,
            ]);
        }

        return response()->json($this->state($post, $visitorId));
    }

    /**
     * Keep the posts.likes counter in sync with the likes table so the
     * dashboard can read the total without an extra query.
     */
    private function state(Post $post, string $visitorId): array
    {
        $likes = Like::where('post_id', $post->id)->count();

        DB::table('posts')->where('id', $post->id)->update(['likes' => $likes]);

        return [
            'post_id' => $post->id,
            'likes' => $likes,
            'liked' => Like::where('post_id', $post->id)
                ->where('visitor_id', $visitorId)
                ->exists(),
        ];
    }

    private function visitorId(Request $request): string
    {
        return hash('sha256', $request->ip().$request->userAgent());
    }
}
