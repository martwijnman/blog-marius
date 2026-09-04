<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Post $post)
    {
        return response()->json(
            $post->comments()
                ->latest()
                ->get()
                ->map(fn (Comment $comment) => [
                    'id' => $comment->id,
                    'post_id' => $comment->post_id,
                    'comment' => $comment->comment,
                    'created_at' => $comment->created_at,
                ])
        );
    }

    public function store(Request $request, Post $post)
    {
        $data = $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        $comment = $post->comments()->create([
            'email' => '',
            'comment' => $data['comment'],
        ]);

        return response()->json([
            'id' => $comment->id,
            'post_id' => $comment->post_id,
            'comment' => $comment->comment,
            'created_at' => $comment->created_at,
        ], 201);
    }
}
