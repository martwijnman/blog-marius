<?php

$rounds = filter_var(env('BCRYPT_ROUNDS', 12), FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 4, 'max_range' => 31],
]);

return [
    'bcrypt' => [
        // Empty or invalid deployment variables must not break password rehashing.
        'rounds' => $rounds === false ? 12 : $rounds,
        'verify' => env('HASH_VERIFY', true),
        'limit' => env('BCRYPT_LIMIT', null),
    ],
];
