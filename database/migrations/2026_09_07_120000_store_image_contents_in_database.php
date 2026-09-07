<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Afbeeldingen gingen naar storage/app/public. Dat werkt niet op een platform
 * dat de app in meerdere containers draait en de schijf bij elke deploy
 * weggooit: het bestand belandt op de schijf van de ene container terwijl de
 * browser hem bij een andere ophaalt. De bytes gaan daarom de database in,
 * die wel gedeeld en blijvend is.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('images', function (Blueprint $table) {
            $table->string('mime_type')->nullable();
            $table->binary('contents')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('images', function (Blueprint $table) {
            $table->dropColumn(['mime_type', 'contents']);
        });
    }
};
