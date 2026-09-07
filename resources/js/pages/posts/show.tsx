import { Head, Link } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    CalendarDays,
    Heart,
    ImageIcon,
    Send,
    Sparkles,
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import CategoryBadge from '@/components/category-badge';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { formatDate, getPostDate, getReadTime } from '@/lib/blog';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/blog';

type Props = {
    post: Post;
};

type PostImage = {
    id: number;
    post_id: number;
    path: string;
};

type LikeState = {
    post_id: number;
    likes: number;
    liked: boolean;
};

type PostComment = {
    id: number;
    post_id: number;
    comment: string;
    created_at: string | null;
};

function getDevice() {
    const agent = navigator.userAgent;

    if (/iPad|Tablet|PlayBook|Silk/i.test(agent)) {
        return 'Tablet';
    }

    return /Mobi|Android|iPhone|iPod/i.test(agent) ? 'Mobile' : 'Desktop';
}

function getImageSrc(path: string) {
    if (path.startsWith('http') || path.startsWith('/')) {
        return path;
    }

    return `/media/${path}`;
}

export default function ShowPostPage({ post }: Props) {
    const [images, setImages] = useState<PostImage[]>([]);
    const [comments, setComments] = useState<PostComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingImages, setIsLoadingImages] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [isSavingComment, setIsSavingComment] = useState(false);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [likes, setLikes] = useState(post.likes ?? 0);
    const [hasLiked, setHasLiked] = useState(false);
    const [isTogglingLike, setIsTogglingLike] = useState(false);

    const paragraphs = useMemo(
        () =>
            post.content
                .split('\n')
                .filter((paragraph) => paragraph.trim().length > 0),
        [post.content],
    );

    useEffect(() => {
        async function loadImages() {
            setIsLoadingImages(true);

            const response = await fetch(`/api/images/${post.id}`, {
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                const loadedImages = (await response.json()) as PostImage[];
                setImages(
                    loadedImages.filter((image) => image.post_id === post.id),
                );
            }

            setIsLoadingImages(false);
        }

        async function loadComments() {
            setIsLoadingComments(true);

            const response = await fetch(`/api/posts/${post.id}/comments`, {
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                setComments((await response.json()) as PostComment[]);
            }

            setIsLoadingComments(false);
        }

        async function loadLikes() {
            const response = await fetch(`/api/posts/${post.id}/likes`, {
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                const state = (await response.json()) as LikeState;
                setLikes(state.likes);
                setHasLiked(state.liked);
            }
        }

        const openedAt = Date.now();

        function visit(readSeconds: number) {
            return {
                referrer: document.referrer || null,
                device: getDevice(),
                read_seconds: readSeconds,
            };
        }

        async function registerView() {
            await fetch(`/api/posts/${post.id}/view`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(visit(0)),
            });
        }

        // Report how long the reader stayed. sendBeacon survives the page being
        // closed, which a regular fetch does not.
        function reportReadTime() {
            const readSeconds = Math.round((Date.now() - openedAt) / 1000);

            if (readSeconds < 1) {
                return;
            }

            navigator.sendBeacon?.(
                `/api/posts/${post.id}/view`,
                new Blob([JSON.stringify(visit(readSeconds))], {
                    type: 'application/json',
                }),
            );
        }

        function handleVisibilityChange() {
            if (document.visibilityState === 'hidden') {
                reportReadTime();
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        void loadImages();
        void loadComments();
        void loadLikes();
        void registerView();

        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
            reportReadTime();
        };
    }, [post.id]);

    async function toggleLike() {
        if (isTogglingLike) {
            return;
        }

        setIsTogglingLike(true);

        const response = await fetch(`/api/posts/${post.id}/likes`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        });

        if (response.ok) {
            const state = (await response.json()) as LikeState;
            setLikes(state.likes);
            setHasLiked(state.liked);
        }

        setIsTogglingLike(false);
    }

    async function saveComment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const comment = newComment.trim();

        if (!comment) {
            return;
        }

        setIsSavingComment(true);
        setCommentError(null);

        const response = await fetch(`/api/posts/${post.id}/comments`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment }),
        });

        if (response.ok) {
            const savedComment = (await response.json()) as PostComment;
            setComments((currentComments) => [
                savedComment,
                ...currentComments,
            ]);
            setNewComment('');
        } else {
            setCommentError('Your comment could not be saved.');
        }

        setIsSavingComment(false);
    }

    return (
        <>
            <Head title={post.title} />
            <div className="min-h-screen bg-background text-foreground">
                <SiteHeader />

                <article>
                    <header className="border-b border-neutral-200 dark:border-neutral-800">
                        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
                            <Link
                                href="/archive"
                                className="inline-flex items-center gap-2 self-start text-xs font-semibold tracking-[0.22em] text-neutral-500 uppercase transition hover:text-neutral-950 dark:hover:text-neutral-100"
                            >
                                <ArrowLeft
                                    className="size-4"
                                    strokeWidth={1.5}
                                />
                                All posts
                            </Link>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium tracking-[0.24em] text-neutral-500 uppercase">
                                <span className="inline-flex items-center gap-2">
                                    <CalendarDays className="size-4" />
                                    {formatDate(getPostDate(post))}
                                </span>
                                <span>{getReadTime(post)}</span>
                                <CategoryBadge category={post.category} />
                            </div>

                            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
                                <div className="flex flex-col gap-5">
                                    <p className="text-xs font-semibold tracking-[0.3em] text-neutral-500 uppercase">
                                        Journal entry
                                    </p>
                                    <h1 className="font-serif text-4xl leading-tight text-neutral-950 sm:text-6xl dark:text-neutral-100">
                                        {post.title}
                                    </h1>
                                    {post.excerpt && (
                                        <p className="max-w-3xl text-base leading-8 text-neutral-600 sm:text-lg dark:text-neutral-400">
                                            {post.excerpt}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 border border-neutral-200 text-center dark:border-neutral-800">
                                    <div className="border-r border-neutral-200 px-4 py-5 dark:border-neutral-800">
                                        <p className="font-serif text-3xl">
                                            {images.length}
                                        </p>
                                        <p className="mt-1 text-[10px] font-semibold tracking-[0.22em] text-neutral-500 uppercase">
                                            Images
                                        </p>
                                    </div>
                                    <div className="border-r border-neutral-200 px-4 py-5 dark:border-neutral-800">
                                        <p className="font-serif text-3xl">
                                            {comments.length}
                                        </p>
                                        <p className="mt-1 text-[10px] font-semibold tracking-[0.22em] text-neutral-500 uppercase">
                                            Comments
                                        </p>
                                    </div>
                                    <div className="px-4 py-5">
                                        <p className="font-serif text-3xl">
                                            {likes}
                                        </p>
                                        <p className="mt-1 text-[10px] font-semibold tracking-[0.22em] text-neutral-500 uppercase">
                                            Likes
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="flex min-w-0 flex-col gap-10">
                            <section className="overflow-hidden border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
                                {isLoadingImages && (
                                    <div className="flex aspect-[16/9] items-center justify-center text-sm text-neutral-500">
                                        Images loading...
                                    </div>
                                )}

                                {!isLoadingImages && images.length === 0 && (
                                    <div className="flex aspect-[16/9] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-neutral-500">
                                        <ImageIcon className="size-8" />
                                        No images added to this post yet.
                                    </div>
                                )}

                                {!isLoadingImages && images.length > 0 && (
                                    <Swiper>
                                        {images.map((image, index) => (
                                            <SwiperSlide key={image.id}>
                                                <img
                                                    src={getImageSrc(
                                                        image.path,
                                                    )}
                                                    alt={`${post.title} image ${index + 1}`}
                                                    className="aspect-[16/9] w-full object-cover grayscale transition duration-500 hover:grayscale-0 dark:brightness-75 dark:contrast-125"
                                                />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                )}
                            </section>

                            <section className="prose prose-neutral dark:prose-invert max-w-none text-base leading-8 text-neutral-800 dark:text-neutral-200">
                                {paragraphs.map((paragraph, index) => (
                                    <p key={`${post.id}-${index}`}>
                                        {paragraph}
                                    </p>
                                ))}
                            </section>
                        </div>

                        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
                            <button
                                type="button"
                                onClick={() => void toggleLike()}
                                disabled={isTogglingLike}
                                aria-pressed={hasLiked}
                                className={cn(
                                    'inline-flex items-center justify-center gap-3 border px-4 py-4 text-xs font-semibold tracking-[0.22em] uppercase transition disabled:cursor-not-allowed disabled:opacity-50',
                                    hasLiked
                                        ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                                        : 'border-neutral-200 hover:border-neutral-950 dark:border-neutral-800 dark:hover:border-neutral-100',
                                )}
                            >
                                <Heart
                                    className={cn(
                                        'size-4',
                                        hasLiked && 'fill-current',
                                    )}
                                    strokeWidth={1.5}
                                />
                                {hasLiked ? 'Liked' : 'Like this post'}
                                <span className="font-serif text-sm tracking-normal normal-case">
                                    {likes}
                                </span>
                            </button>

                            <form
                                onSubmit={saveComment}
                                className="flex flex-col gap-3 border border-neutral-200 p-5 dark:border-neutral-800"
                            >
                                <h2 className="text-xs font-semibold tracking-[0.22em] text-neutral-500 uppercase">
                                    Leave a comment
                                </h2>

                                <textarea
                                    value={newComment}
                                    onChange={(event) =>
                                        setNewComment(event.target.value)
                                    }
                                    rows={4}
                                    placeholder="Share your thoughts"
                                    className="w-full resize-y border border-neutral-200 bg-transparent p-3 text-sm outline-none placeholder:text-neutral-500 dark:border-neutral-800"
                                />

                                {commentError && (
                                    <p className="text-xs text-red-500">
                                        {commentError}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        isSavingComment ||
                                        newComment.trim() === ''
                                    }
                                    className="inline-flex items-center justify-center gap-2 border border-neutral-950 px-4 py-3 text-xs font-semibold tracking-[0.22em] text-neutral-950 uppercase transition hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-neutral-950"
                                >
                                    {isSavingComment ? 'Saving...' : 'Post'}
                                    <Send
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                </button>
                            </form>

                            <section className="border border-neutral-200 dark:border-neutral-800">
                                {isLoadingComments ? (
                                    <div className="p-5 text-sm text-neutral-500">
                                        Comments loading...
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-5 text-center text-sm text-neutral-500">
                                        <Sparkles className="size-5" />
                                        No comments yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {comments.map((comment) => (
                                            <article
                                                key={comment.id}
                                                className="p-5"
                                            >
                                                <p className="text-sm leading-6 text-neutral-800 dark:text-neutral-200">
                                                    {comment.comment}
                                                </p>
                                                <time className="mt-3 block text-[10px] font-semibold tracking-[0.2em] text-neutral-500 uppercase">
                                                    {formatDate(
                                                        comment.created_at,
                                                    )}
                                                </time>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </aside>
                    </div>
                </article>

                <SiteFooter />
            </div>
        </>
    );
}
