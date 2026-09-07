<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Deze seeder draait ook tijdens de Docker-build op Vercel, waar composer
     * met --no-dev installeert. User::factory() kan daar niet: die roept fake()
     * aan en fakerphp/faker is een require-dev package. Daarom de gebruiker
     * hier direct aanmaken, zonder factory.
     */
    public function run(): void
    {
        $this->call(CategorySeeder::class);

        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                // Wordt gehasht door de 'hashed' cast op het User-model.
                'password' => 'password',
            ],
        );

        if (is_null($user->email_verified_at)) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }
    }
}
