import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PostController::bulkUpdateStatus
 * @see app/Http/Controllers/Api/PostController.php:74
 * @route '/api/posts/bulk-status'
 */
export const bulkUpdateStatus = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: bulkUpdateStatus.url(options),
    method: 'patch',
})

bulkUpdateStatus.definition = {
    methods: ["patch"],
    url: '/api/posts/bulk-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\PostController::bulkUpdateStatus
 * @see app/Http/Controllers/Api/PostController.php:74
 * @route '/api/posts/bulk-status'
 */
bulkUpdateStatus.url = (options?: RouteQueryOptions) => {
    return bulkUpdateStatus.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PostController::bulkUpdateStatus
 * @see app/Http/Controllers/Api/PostController.php:74
 * @route '/api/posts/bulk-status'
 */
bulkUpdateStatus.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: bulkUpdateStatus.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\PostController::bulkUpdateStatus
 * @see app/Http/Controllers/Api/PostController.php:74
 * @route '/api/posts/bulk-status'
 */
    const bulkUpdateStatusForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bulkUpdateStatus.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PostController::bulkUpdateStatus
 * @see app/Http/Controllers/Api/PostController.php:74
 * @route '/api/posts/bulk-status'
 */
        bulkUpdateStatusForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bulkUpdateStatus.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    bulkUpdateStatus.form = bulkUpdateStatusForm
/**
* @see \App\Http\Controllers\Api\PostController::bulkDestroy
 * @see app/Http/Controllers/Api/PostController.php:60
 * @route '/api/posts/bulk-delete'
 */
export const bulkDestroy = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: bulkDestroy.url(options),
    method: 'delete',
})

bulkDestroy.definition = {
    methods: ["delete"],
    url: '/api/posts/bulk-delete',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\PostController::bulkDestroy
 * @see app/Http/Controllers/Api/PostController.php:60
 * @route '/api/posts/bulk-delete'
 */
bulkDestroy.url = (options?: RouteQueryOptions) => {
    return bulkDestroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PostController::bulkDestroy
 * @see app/Http/Controllers/Api/PostController.php:60
 * @route '/api/posts/bulk-delete'
 */
bulkDestroy.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: bulkDestroy.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\PostController::bulkDestroy
 * @see app/Http/Controllers/Api/PostController.php:60
 * @route '/api/posts/bulk-delete'
 */
    const bulkDestroyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bulkDestroy.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PostController::bulkDestroy
 * @see app/Http/Controllers/Api/PostController.php:60
 * @route '/api/posts/bulk-delete'
 */
        bulkDestroyForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bulkDestroy.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    bulkDestroy.form = bulkDestroyForm
/**
* @see \App\Http\Controllers\Api\PostController::index
 * @see app/Http/Controllers/Api/PostController.php:11
 * @route '/api/posts'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/posts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PostController::index
 * @see app/Http/Controllers/Api/PostController.php:11
 * @route '/api/posts'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PostController::index
 * @see app/Http/Controllers/Api/PostController.php:11
 * @route '/api/posts'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\PostController::index
 * @see app/Http/Controllers/Api/PostController.php:11
 * @route '/api/posts'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\PostController::index
 * @see app/Http/Controllers/Api/PostController.php:11
 * @route '/api/posts'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\PostController::index
 * @see app/Http/Controllers/Api/PostController.php:11
 * @route '/api/posts'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\PostController::index
 * @see app/Http/Controllers/Api/PostController.php:11
 * @route '/api/posts'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Api\PostController::store
 * @see app/Http/Controllers/Api/PostController.php:16
 * @route '/api/posts'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/posts',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PostController::store
 * @see app/Http/Controllers/Api/PostController.php:16
 * @route '/api/posts'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PostController::store
 * @see app/Http/Controllers/Api/PostController.php:16
 * @route '/api/posts'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\PostController::store
 * @see app/Http/Controllers/Api/PostController.php:16
 * @route '/api/posts'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PostController::store
 * @see app/Http/Controllers/Api/PostController.php:16
 * @route '/api/posts'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\PostController::show
 * @see app/Http/Controllers/Api/PostController.php:30
 * @route '/api/posts/{post}'
 */
export const show = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/posts/{post}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PostController::show
 * @see app/Http/Controllers/Api/PostController.php:30
 * @route '/api/posts/{post}'
 */
show.url = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { post: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    post: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        post: args.post,
                }

    return show.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PostController::show
 * @see app/Http/Controllers/Api/PostController.php:30
 * @route '/api/posts/{post}'
 */
show.get = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\PostController::show
 * @see app/Http/Controllers/Api/PostController.php:30
 * @route '/api/posts/{post}'
 */
show.head = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\PostController::show
 * @see app/Http/Controllers/Api/PostController.php:30
 * @route '/api/posts/{post}'
 */
    const showForm = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\PostController::show
 * @see app/Http/Controllers/Api/PostController.php:30
 * @route '/api/posts/{post}'
 */
        showForm.get = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\PostController::show
 * @see app/Http/Controllers/Api/PostController.php:30
 * @route '/api/posts/{post}'
 */
        showForm.head = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\Api\PostController::update
 * @see app/Http/Controllers/Api/PostController.php:35
 * @route '/api/posts/{post}'
 */
export const update = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/api/posts/{post}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Api\PostController::update
 * @see app/Http/Controllers/Api/PostController.php:35
 * @route '/api/posts/{post}'
 */
update.url = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { post: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    post: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        post: args.post,
                }

    return update.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PostController::update
 * @see app/Http/Controllers/Api/PostController.php:35
 * @route '/api/posts/{post}'
 */
update.put = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Api\PostController::update
 * @see app/Http/Controllers/Api/PostController.php:35
 * @route '/api/posts/{post}'
 */
update.patch = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\PostController::update
 * @see app/Http/Controllers/Api/PostController.php:35
 * @route '/api/posts/{post}'
 */
    const updateForm = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PostController::update
 * @see app/Http/Controllers/Api/PostController.php:35
 * @route '/api/posts/{post}'
 */
        updateForm.put = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\PostController::update
 * @see app/Http/Controllers/Api/PostController.php:35
 * @route '/api/posts/{post}'
 */
        updateForm.patch = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Api\PostController::destroy
 * @see app/Http/Controllers/Api/PostController.php:52
 * @route '/api/posts/{post}'
 */
export const destroy = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/posts/{post}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\PostController::destroy
 * @see app/Http/Controllers/Api/PostController.php:52
 * @route '/api/posts/{post}'
 */
destroy.url = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { post: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    post: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        post: args.post,
                }

    return destroy.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PostController::destroy
 * @see app/Http/Controllers/Api/PostController.php:52
 * @route '/api/posts/{post}'
 */
destroy.delete = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\PostController::destroy
 * @see app/Http/Controllers/Api/PostController.php:52
 * @route '/api/posts/{post}'
 */
    const destroyForm = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PostController::destroy
 * @see app/Http/Controllers/Api/PostController.php:52
 * @route '/api/posts/{post}'
 */
        destroyForm.delete = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const PostController = { bulkUpdateStatus, bulkDestroy, index, store, show, update, destroy }

export default PostController