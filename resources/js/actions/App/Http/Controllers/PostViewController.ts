import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PostViewController::store
 * @see app/Http/Controllers/PostViewController.php:13
 * @route '/api/posts/{post}/view'
 */
export const store = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/posts/{post}/view',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PostViewController::store
 * @see app/Http/Controllers/PostViewController.php:13
 * @route '/api/posts/{post}/view'
 */
store.url = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostViewController::store
 * @see app/Http/Controllers/PostViewController.php:13
 * @route '/api/posts/{post}/view'
 */
store.post = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PostViewController::store
 * @see app/Http/Controllers/PostViewController.php:13
 * @route '/api/posts/{post}/view'
 */
    const storeForm = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PostViewController::store
 * @see app/Http/Controllers/PostViewController.php:13
 * @route '/api/posts/{post}/view'
 */
        storeForm.post = (args: { post: string | number } | [post: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const PostViewController = { store }

export default PostViewController