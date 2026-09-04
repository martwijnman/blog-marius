<?php

use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\ImageController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\PostViewController;
use Illuminate\Support\Facades\Route;

Route::post('posts/{post}/view', [PostViewController::class, 'store']);
Route::get('posts/{post}/comments', [CommentController::class, 'index']);
Route::post('posts/{post}/comments', [CommentController::class, 'store']);
Route::get('posts/{post}/likes', [LikeController::class, 'show']);
Route::post('posts/{post}/likes', [LikeController::class, 'store']);
Route::get('images', [ImageController::class, 'all']);
Route::get('images/{post_id}', [ImageController::class, 'index']);
Route::post('images', [ImageController::class, 'store']);
Route::delete('images/{image}', [ImageController::class, 'destroy']);

Route::patch('/posts/bulk-status', [PostController::class, 'bulkUpdateStatus']);
Route::delete('/posts/bulk-delete', [PostController::class, 'bulkDestroy']);
Route::apiResource('posts', PostController::class);
Route::apiResource('categories', CategoryController::class)->except(['show']);
