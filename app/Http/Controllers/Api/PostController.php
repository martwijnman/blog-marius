<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index()
    {
        return response()->json(Post::with('category')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string'],
            'slug' => ['required', 'string'],
            'excerpt' => ['nullable', 'string'],
            'content' => ['required', 'string'],
            'status' => ['required', 'in:draft,published,archived'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        return response()->json(Post::create($data), 201);
    }

    public function show(string $id)
    {
        return response()->json(Post::with('category')->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $data = $request->validate([
            'title' => ['required', 'string'],
            'slug' => ['required', 'string'],
            'excerpt' => ['nullable', 'string'],
            'content' => ['required', 'string'],
            'status' => ['required', 'in:draft,published,archived'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        $post = Post::findOrFail($id);
        $post->update($data);

        return response()->json($post->load('category'));
    }

    public function destroy(string $id)
    {
        $post = Post::findOrFail($id);
        $post->delete();

        return response()->noContent();
    }

    public function bulkDestroy(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:posts,id'],
        ]);

        Post::whereIn('id', $data['ids'])->delete();

        return response()->json([
            'message' => 'Posts deleted successfully',
        ]);
    }

    public function bulkUpdateStatus(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:posts,id'],
            'status' => ['required', 'in:draft,published,archived'],
        ]);

        Post::whereIn('id', $data['ids'])
            ->update([
                'status' => $data['status'],
            ]);

        return response()->json([
            'message' => 'Status updated successfully',
        ]);
    }
}
