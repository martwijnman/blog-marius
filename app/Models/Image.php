<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Image extends Model
{
    protected $fillable = [
        'post_id',
        'path',
        'mime_type',
        'contents',
    ];

    /**
     * De bytes horen nooit in een JSON-antwoord: dat zou elke lijst met
     * afbeeldingen megabytes groot maken.
     */
    protected $hidden = [
        'contents',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Postgres geeft bytea terug als stream, sqlite als string.
     */
    public function binaryContents(): ?string
    {
        $contents = $this->contents;

        if (is_resource($contents)) {
            return stream_get_contents($contents);
        }

        return $contents;
    }
}
