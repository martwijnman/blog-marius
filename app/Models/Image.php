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
     * Maakt een afbeelding aan inclusief de ruwe bytes.
     *
     * Op Postgres is `contents` een bytea. PDO bindt een gewone PHP-string als
     * tekst, waarna de server hem als UTF-8 probeert te lezen en op de eerste
     * niet-tekstbyte afknapt met SQLSTATE[22021]. De bytes staan vervolgens in
     * de foutmelding, dus zelfs de errorpagina is dan niet meer te encoderen -
     * de upload eindigde als een kale 500. Bytea wil een LOB-binding, en die
     * kan alleen buiten Eloquent om.
     */
    public static function createWithBinary(array $attributes, string $bytes): self
    {
        $connection = static::query()->getConnection();

        if ($connection->getDriverName() !== 'pgsql') {
            return static::create($attributes + ['contents' => $bytes]);
        }

        $image = static::create($attributes);

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $bytes);
        rewind($stream);

        try {
            $statement = $connection->getPdo()->prepare(
                'update images set contents = :contents where id = :id'
            );
            $statement->bindParam(':contents', $stream, \PDO::PARAM_LOB);
            $statement->bindValue(':id', $image->getKey(), \PDO::PARAM_INT);
            $statement->execute();
        } finally {
            fclose($stream);
        }

        return $image;
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
