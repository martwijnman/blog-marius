import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    ArrowRight,
    BookOpen,
    CalendarDays,
    Eye,
    Sparkles,
} from 'lucide-react';
import CategoryBadge from '@/components/category-badge';
import SiteFooter from '@/components/site-footer';
import SiteHeader, { scrollToSection } from '@/components/site-header';
import {
    countWords,
    fetchPublishedPosts,
    formatDate,
    getPostDate,
    getPreview,
    getReadTime,
} from '@/lib/blog';
import type { Post } from '@/lib/blog';

type SectionTitleProps = {
    label: string;
    title: string;
    text?: string;
};

type PostCardProps = {
    post: Post;
    index: number;
};

function SectionTitle({ label, title, text }: SectionTitleProps) {
    return (
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-8 md:flex-row md:items-end md:justify-between dark:border-neutral-800">
            <div>
                <p className="mb-2 text-xs font-medium tracking-[0.25em] text-neutral-500 uppercase">
                    {label}
                </p>
                <h2 className="font-serif text-4xl text-neutral-950 dark:text-neutral-100">
                    {title}
                </h2>
            </div>

            {text && (
                <p className="max-w-sm text-sm leading-6 text-neutral-500 md:text-right">
                    {text}
                </p>
            )}
        </div>
    );
}

function LoadingMessage({ text }: { text: string }) {
    return (
        <div className="border-y border-neutral-200 py-12 text-center text-sm text-neutral-500 dark:border-neutral-800">
            {text}
        </div>
    );
}

function EmptyMessage({ text }: { text: string }) {
    return (
        <div className="border-y border-neutral-200 py-12 text-center text-sm text-neutral-500 dark:border-neutral-800">
            {text}
        </div>
    );
}

function LatestPostCard({ post, index }: PostCardProps) {
    return (
        <Link
            href={`/posts/${post.id}`}
            id={`post-${post.slug}`}
            className="group flex min-h-80 flex-col justify-between border-b border-neutral-200 p-6 text-left transition-colors hover:bg-neutral-950 md:border-r md:last:border-r-0 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
            <div className="flex items-center justify-between text-xs font-medium tracking-[0.25em] text-neutral-500 uppercase">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>{formatDate(getPostDate(post))}</span>
            </div>

            <CategoryBadge
                category={post.category}
                className="mt-6 self-start transition-colors group-hover:border-neutral-500 group-hover:text-neutral-300"
            />

            <div className="mt-8 flex flex-col gap-4">
                <h3 className="font-serif text-2xl leading-tight text-neutral-950 transition-colors group-hover:text-white dark:text-neutral-100">
                    {post.title}
                </h3>
                <p className="line-clamp-3 text-sm leading-6 text-neutral-500 transition-colors group-hover:text-neutral-300">
                    {getPreview(post)}
                </p>
            </div>

            <div className="mt-10 flex items-center justify-between text-xs font-medium tracking-[0.2em] text-neutral-500 uppercase transition-colors group-hover:text-neutral-300">
                <span>{getReadTime(post)}</span>
                <ArrowRight
                    size={20}
                    strokeWidth={1.5}
                    className="transition-transform group-hover:translate-x-1"
                />
            </div>
        </Link>
    );
}

function PopularPostRow({ post, index }: PostCardProps) {
    return (
        <Link
            href={`/posts/${post.id}`}
            className="group flex w-full items-center justify-between gap-6 py-6 text-left lg:pl-10"
        >
            <div className="flex items-center gap-5">
                <span className="text-xs font-semibold tracking-[0.25em] text-neutral-500 uppercase">
                    {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                    <h3 className="font-serif text-2xl text-neutral-950 transition-colors group-hover:text-neutral-500 dark:text-neutral-100">
                        {post.title}
                    </h3>
                    <p className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                            <Eye className="size-3" />
                            {post.views ?? 0} views
                        </span>
                        <span>{getReadTime(post)}</span>
                        <CategoryBadge category={post.category} />
                    </p>
                </div>
            </div>
            <ArrowRight
                className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
                strokeWidth={1.5}
            />
        </Link>
    );
}

export default function Welcome() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);

    useEffect(() => {
        async function loadPosts() {
            setPosts(await fetchPublishedPosts());
            setIsLoadingPosts(false);
        }

        void loadPosts();
    }, []);

    // Arriving from another page with /#popular etc. does not trigger the
    // browser's own hash jump, so scroll once the page is mounted.
    useEffect(() => {
        const sectionId = window.location.hash.slice(1);

        if (sectionId) {
            scrollToSection(sectionId);
        }
    }, []);

    const publishedPosts = posts;
    const latestPosts = publishedPosts.slice(0, 3);
    const popularPosts = [...publishedPosts]
        .sort(
            (firstPost, secondPost) =>
                (secondPost.views ?? 0) - (firstPost.views ?? 0),
        )
        .slice(0, 3);

    const totalViews = publishedPosts.reduce(
        (total, post) => total + (post.views ?? 0),
        0,
    );
    const totalWords = publishedPosts.reduce(
        (total, post) => total + countWords(post.content),
        0,
    );
    const totalReadMinutes = Math.ceil(totalWords / 200);

    return (
        <>
            <Head title="Home" />
            <div className="min-h-screen bg-background text-foreground">
                <SiteHeader />

                <main id="top">
                    <section className="px-4 py-8 sm:px-6 lg:px-8">
                        <div className="relative mx-auto min-h-[580px] max-w-6xl overflow-hidden bg-neutral-900">
                            <img
                                src="/hero/hero.png"
                                alt="Concrete architectural exterior"
                                className="absolute inset-0 h-full w-full object-cover grayscale"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

                            <div className="relative flex min-h-[580px] flex-col justify-end gap-10 p-6 sm:p-10 lg:p-14">
                                <div className="max-w-3xl text-white">
                                    <p className="mb-5 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-neutral-300 uppercase">
                                        <Sparkles className="size-3" />
                                        Welcome to my blog
                                    </p>

                                    <h1 className="font-serif text-4xl leading-tight sm:text-5xl lg:text-7xl">
                                        Thoughts, ideas and stories from my
                                        journey
                                    </h1>

                                    <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-200 sm:text-base">
                                        A personal space where I share what I
                                        learn, create and discover in
                                        technology, design and everyday life.
                                    </p>

                                    <a
                                        href="#posts"
                                        onClick={(event) => {
                                            if (scrollToSection('posts')) {
                                                event.preventDefault();
                                            }
                                        }}
                                        className="mt-8 inline-flex items-center gap-3 border border-white bg-white px-5 py-3 text-sm font-medium text-neutral-950 transition hover:bg-transparent hover:text-white"
                                    >
                                        Explore posts
                                        <ArrowRight
                                            size={18}
                                            strokeWidth={1.5}
                                        />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mx-auto mt-6 grid max-w-6xl border border-neutral-200 text-neutral-950 sm:grid-cols-3 dark:border-neutral-800 dark:text-neutral-100">
                            <div className="border-b border-neutral-200 p-5 sm:border-r sm:border-b-0 dark:border-neutral-800">
                                <p className="font-serif text-3xl">
                                    {publishedPosts.length}
                                </p>
                                <span className="mt-1 block text-[10px] font-semibold tracking-[0.24em] text-neutral-500 uppercase">
                                    Published posts
                                </span>
                            </div>
                            <div className="border-b border-neutral-200 p-5 sm:border-r sm:border-b-0 dark:border-neutral-800">
                                <p className="font-serif text-3xl">
                                    {totalReadMinutes}
                                </p>
                                <span className="mt-1 block text-[10px] font-semibold tracking-[0.24em] text-neutral-500 uppercase">
                                    Read minutes
                                </span>
                            </div>
                            <div className="p-5">
                                <p className="font-serif text-3xl">
                                    {totalViews}
                                </p>
                                <span className="mt-1 block text-[10px] font-semibold tracking-[0.24em] text-neutral-500 uppercase">
                                    Views
                                </span>
                            </div>
                        </div>
                    </section>

                    <section
                        id="posts"
                        className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col gap-8 px-6 py-16"
                    >
                        <SectionTitle label="Latest" title="Posts" />

                        {isLoadingPosts && (
                            <LoadingMessage text="Loading posts..." />
                        )}

                        {!isLoadingPosts && latestPosts.length === 0 && (
                            <EmptyMessage text="No published posts yet." />
                        )}

                        {!isLoadingPosts && latestPosts.length > 0 && (
                            <div className="grid grid-cols-1 border-t border-neutral-200 md:grid-cols-3 dark:border-neutral-800">
                                {latestPosts.map((post, index) => (
                                    <LatestPostCard
                                        key={post.id}
                                        post={post}
                                        index={index}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-4 border-t border-neutral-200 pt-8 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                            <p className="text-sm leading-6 text-neutral-500">
                                Looking for something older? The archive holds
                                every published post.
                            </p>

                            <Link
                                href="/archive"
                                className="inline-flex items-center gap-3 self-start border border-neutral-950 px-5 py-3 text-xs font-semibold tracking-[0.22em] text-neutral-950 uppercase transition hover:bg-neutral-950 hover:text-white dark:border-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-neutral-950"
                            >
                                View all posts
                                <ArrowRight size={16} strokeWidth={1.5} />
                            </Link>
                        </div>
                    </section>

                    <section
                        id="popular"
                        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16"
                    >
                        <div className="grid border-y border-neutral-200 lg:grid-cols-[0.8fr_1.2fr] dark:border-neutral-800">
                            <div className="border-b border-neutral-200 py-8 lg:border-r lg:border-b-0 lg:pr-10 dark:border-neutral-800">
                                <p className="mb-2 text-xs font-medium tracking-[0.25em] text-neutral-500 uppercase">
                                    From the API
                                </p>
                                <h2 className="font-serif text-4xl text-neutral-950 dark:text-neutral-100">
                                    Popular Posts
                                </h2>
                            </div>

                            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {isLoadingPosts && (
                                    <div className="py-8 text-sm text-neutral-500 lg:pl-10">
                                        Loading popular posts...
                                    </div>
                                )}

                                {!isLoadingPosts &&
                                    popularPosts.length === 0 && (
                                        <div className="py-8 text-sm text-neutral-500 lg:pl-10">
                                            No popular posts yet.
                                        </div>
                                    )}

                                {!isLoadingPosts &&
                                    popularPosts.map((post, index) => (
                                        <PopularPostRow
                                            key={post.id}
                                            post={post}
                                            index={index}
                                        />
                                    ))}
                            </div>
                        </div>
                    </section>

                    <section
                        id="about"
                        className="mx-auto grid w-full max-w-6xl scroll-mt-24 gap-8 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
                    >
                        <div className="border-y border-neutral-200 py-8 dark:border-neutral-800">
                            <p className="mb-4 text-xs font-medium tracking-[0.25em] text-neutral-500 uppercase">
                                About
                            </p>
                            <p className="font-serif text-3xl leading-snug text-neutral-950 sm:text-4xl dark:text-neutral-100">
                                Every project teaches something new. This blog
                                is where I document that journey.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="border border-neutral-200 p-5 dark:border-neutral-800">
                                <BookOpen className="mb-6 size-5 text-neutral-500" />
                                <h3 className="font-serif text-xl">Writing</h3>
                                <p className="mt-3 text-sm leading-6 text-neutral-500">
                                    Notes, stories and lessons collected while
                                    building and learning.
                                </p>
                            </div>
                            <div className="border border-neutral-200 p-5 dark:border-neutral-800">
                                <CalendarDays className="mb-6 size-5 text-neutral-500" />
                                <h3 className="font-serif text-xl">Progress</h3>
                                <p className="mt-3 text-sm leading-6 text-neutral-500">
                                    Reflections on ideas, momentum and the small
                                    details that matter.
                                </p>
                            </div>
                            <div className="border border-neutral-200 p-5 dark:border-neutral-800">
                                <Sparkles className="mb-6 size-5 text-neutral-500" />
                                <h3 className="font-serif text-xl">
                                    Discovery
                                </h3>
                                <p className="mt-3 text-sm leading-6 text-neutral-500">
                                    A place for experiments, observations and
                                    things worth revisiting.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>

                <SiteFooter />
            </div>
        </>
    );
}
