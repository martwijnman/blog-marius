import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ImageController::all
 * @see app/Http/Controllers/Api/ImageController.php:28
 * @route '/api/images'
 */
export const all = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: all.url(options),
    method: 'get',
})

all.definition = {
    methods: ["get","head"],
    url: '/api/images',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ImageController::all
 * @see app/Http/Controllers/Api/ImageController.php:28
 * @route '/api/images'
 */
all.url = (options?: RouteQueryOptions) => {
    return all.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ImageController::all
 * @see app/Http/Controllers/Api/ImageController.php:28
 * @route '/api/images'
 */
all.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: all.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ImageController::all
 * @see app/Http/Controllers/Api/ImageController.php:28
 * @route '/api/images'
 */
all.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: all.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ImageController::all
 * @see app/Http/Controllers/Api/ImageController.php:28
 * @route '/api/images'
 */
    const allForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: all.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ImageController::all
 * @see app/Http/Controllers/Api/ImageController.php:28
 * @route '/api/images'
 */
        allForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: all.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ImageController::all
 * @see app/Http/Controllers/Api/ImageController.php:28
 * @route '/api/images'
 */
        allForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: all.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    all.form = allForm
/**
* @see \App\Http\Controllers\Api\ImageController::index
 * @see app/Http/Controllers/Api/ImageController.php:18
 * @route '/api/images/{post_id}'
 */
export const index = (args: { post_id: string | number } | [post_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/images/{post_id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ImageController::index
 * @see app/Http/Controllers/Api/ImageController.php:18
 * @route '/api/images/{post_id}'
 */
index.url = (args: { post_id: string | number } | [post_id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { post_id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    post_id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        post_id: args.post_id,
                }

    return index.definition.url
            .replace('{post_id}', parsedArgs.post_id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ImageController::index
 * @see app/Http/Controllers/Api/ImageController.php:18
 * @route '/api/images/{post_id}'
 */
index.get = (args: { post_id: string | number } | [post_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ImageController::index
 * @see app/Http/Controllers/Api/ImageController.php:18
 * @route '/api/images/{post_id}'
 */
index.head = (args: { post_id: string | number } | [post_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ImageController::index
 * @see app/Http/Controllers/Api/ImageController.php:18
 * @route '/api/images/{post_id}'
 */
    const indexForm = (args: { post_id: string | number } | [post_id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ImageController::index
 * @see app/Http/Controllers/Api/ImageController.php:18
 * @route '/api/images/{post_id}'
 */
        indexForm.get = (args: { post_id: string | number } | [post_id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ImageController::index
 * @see app/Http/Controllers/Api/ImageController.php:18
 * @route '/api/images/{post_id}'
 */
        indexForm.head = (args: { post_id: string | number } | [post_id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Api\ImageController::store
 * @see app/Http/Controllers/Api/ImageController.php:36
 * @route '/api/images'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/images',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ImageController::store
 * @see app/Http/Controllers/Api/ImageController.php:36
 * @route '/api/images'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ImageController::store
 * @see app/Http/Controllers/Api/ImageController.php:36
 * @route '/api/images'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ImageController::store
 * @see app/Http/Controllers/Api/ImageController.php:36
 * @route '/api/images'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ImageController::store
 * @see app/Http/Controllers/Api/ImageController.php:36
 * @route '/api/images'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\ImageController::destroy
 * @see app/Http/Controllers/Api/ImageController.php:73
 * @route '/api/images/{image}'
 */
export const destroy = (args: { image: string | number } | [image: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/images/{image}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\ImageController::destroy
 * @see app/Http/Controllers/Api/ImageController.php:73
 * @route '/api/images/{image}'
 */
destroy.url = (args: { image: string | number } | [image: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { image: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    image: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        image: args.image,
                }

    return destroy.definition.url
            .replace('{image}', parsedArgs.image.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ImageController::destroy
 * @see app/Http/Controllers/Api/ImageController.php:73
 * @route '/api/images/{image}'
 */
destroy.delete = (args: { image: string | number } | [image: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\ImageController::destroy
 * @see app/Http/Controllers/Api/ImageController.php:73
 * @route '/api/images/{image}'
 */
    const destroyForm = (args: { image: string | number } | [image: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ImageController::destroy
 * @see app/Http/Controllers/Api/ImageController.php:73
 * @route '/api/images/{image}'
 */
        destroyForm.delete = (args: { image: string | number } | [image: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const ImageController = { all, index, store, destroy }

export default ImageController