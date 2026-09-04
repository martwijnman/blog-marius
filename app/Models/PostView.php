<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostView extends Model
{
    protected $fillable = [
        'post_id',
        'visitor_id',
        'country_code',
        'device',
        'referrer',
        'read_seconds',
    ];
}
