<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Environment variables opschonen
|--------------------------------------------------------------------------
|
| De environment variables van dit project staan bij Vercel opgeslagen met
| omliggende witruimte. Dat is verraderlijk: een waarde van alleen een spatie
| is in PHP truthy, dus env('X', 'default') en zelfs env('X') ?: 'default'
| geven hem gewoon door. Laravel bouwt daar vervolgens een drivernaam mee op
| (Str::studly(' ') is een lege string), en dan valt de hele applicatie om met
| een onbegrijpelijke ArgumentCountError.
|
| Dit draait voordat de config geladen wordt: elke waarde wordt getrimd, en
| wat daarna leeg is wordt verwijderd zodat de default uit config/ het weer
| overneemt. Kan weg zodra de variabelen bij Vercel schoon staan.
|
*/

$names = array_unique(array_merge(
    array_keys(getenv()),
    array_keys($_ENV),
    array_keys($_SERVER),
));

foreach ($names as $name) {
    if (! is_string($name) || str_starts_with($name, 'HTTP_') || preg_match('/^[A-Z][A-Z0-9_]*$/', $name) !== 1) {
        continue;
    }

    $value = $_SERVER[$name] ?? $_ENV[$name] ?? getenv($name);

    if (! is_string($value) || $value === trim($value)) {
        continue;
    }

    if (($trimmed = trim($value)) === '') {
        unset($_ENV[$name], $_SERVER[$name]);
        putenv($name);

        continue;
    }

    $_ENV[$name] = $_SERVER[$name] = $trimmed;
    putenv($name.'='.$trimmed);
}

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Vercel zit als reverse proxy voor de container en geeft het schema
        // door via X-Forwarded-Proto. Zonder dit denkt Laravel dat elke
        // request over http binnenkomt en genereert het asset-URL's met
        // http://, die vanaf een https-pagina niet geladen worden.
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();


