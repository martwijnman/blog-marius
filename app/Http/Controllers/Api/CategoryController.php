<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(
            Category::withCount([
                'posts as posts_count',
                'posts as published_posts_count' => fn ($query) => $query->where('status', 'published'),
            ])->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        return response()->json(Category::create($data), 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $this->validated($request, $category);

        $category->update($data);

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        // The posts keep existing, they just lose their category.
        Post::where('category_id', $category->id)->update(['category_id' => null]);

        $category->delete();

        return response()->noContent();
    }

    /**
     * @return array{name: string, slug: string, description: string|null}
     */
    private function validated(Request $request, ?Category $category = null): array
    {
        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category),
            ],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['name'], $category);

        return $data;
    }

    private function uniqueSlug(string $name, ?Category $category): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $suffix = 2;

        while (
            Category::where('slug', $slug)
                ->when($category, fn ($query) => $query->whereKeyNot($category->getKey()))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
