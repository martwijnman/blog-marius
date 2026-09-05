<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Events\ConnectionFailed;
use Illuminate\Http\Client\Events\RequestSending;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureHttpClient();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Outside production, no outbound call is worth the whole 30 second PHP
     * budget: a stalled one takes the page down with a fatal that names
     * whatever file the timer happened to land in, never the URL. Cap the
     * wait and log where each request went, so a hang is a log line.
     */
    protected function configureHttpClient(): void
    {
        if (app()->isProduction()) {
            return;
        }

        Http::globalOptions([
            'connect_timeout' => 2,
            'timeout' => 5,
        ]);

        Event::listen(fn (RequestSending $event) => Log::debug(
            'Outbound HTTP request',
            ['url' => $event->request->url()],
        ));

        Event::listen(fn (ConnectionFailed $event) => Log::warning(
            'Outbound HTTP request failed',
            ['url' => $event->request->url()],
        ));
    }
}
