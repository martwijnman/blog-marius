<?php

use App\Http\Controllers\AnalyticsController;
use App\Models\Post;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
