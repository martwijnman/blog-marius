<?php

use App\Http\Controllers\AnalyticsController;
use App\Models\Post;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/*
 * Afbeeldingen worden hier uitgeserveerd in plaats van via de
 * public/storage-symlink. Die symlink is op Windows vaak stuk (aanmaken
 * vereist adminrechten) en bestaat niet in een verse container, waardoor
 * elke foto een 404 werd. Deze route leest het bestand gewoon van de disk.
 */
Route::get('/media/{path}', function (string $path) {
    // {path} vangt alles inclusief slashes, dus ../ hier expliciet weren.
    abort_if(str_contains($path, '..'), 404);
    abort_unless(Storage::disk('public')->exists($path), 404);

    return Storage::disk('public')->response($path);
})->where('path', '.*')->name('media');

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/archive', 'posts/archive')->name('posts_archive');

Route::get('/posts/{post}', function (Post $post) {
    return Inertia::render('posts/show', [
        'post' => $post,
    ]);
})->name('posts_show_public');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::redirect('analystics', 'analytics')->name('analystics');
    Route::get('analytics', [AnalyticsController::class, 'index'])->name('analytics');
});

require __DIR__.'/settings.php';
