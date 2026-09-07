<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Image;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ImageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(string $post_id)
    {
        $images = Image::where('post_id', $post_id)->get();

        return response()->json($images);
    }

    /**
     * Every image at once, so a list view does not need one request per post.
     */
    public function all()
    {
        return response()->json(Image::all());
    }

    /**
     * Store one or more uploaded images for a post.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'post_id' => ['required', 'integer'],
            'images' => ['required', 'array'],
            // 10 MB, passend bij upload_max_filesize=12M in de Dockerfile.
            // Een telefoonfoto is al snel 5-8 MB en werd op 5120 geweigerd.
            'images.*' => ['file', 'image', 'max:10240'],
        ]);

        abort_unless($this->postExists($data['post_id']), 404, 'Post not found');

        $images = collect($request->file('images'))->map(function ($file) use ($data) {
            $path = $file->store('posts/'.$data['post_id'], 'public');

            return Image::create([
                'post_id' => $data['post_id'],
                'path' => $path,
            ]);
        });

        return response()->json($images->values(), 201);
    }

    /**
     * The posts table has no id column on sqlite, so fall back to rowid.
     */
    private function postExists(int $postId): bool
    {
        if (Schema::hasColumn('posts', 'id')) {
            return Post::whereKey($postId)->exists();
        }

        return DB::table('posts')->whereRaw('rowid = ?', [$postId])->exists();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $image = Image::findOrFail($id);

        Storage::disk('public')->delete($image->path);
        $image->delete();

        return response()->noContent();
    }
}
