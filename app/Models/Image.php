<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Image extends Model
{
    protected $fillable = [
        'post_id',
        'path',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
