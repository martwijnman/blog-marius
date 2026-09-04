import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, Search } from 'lucide-react';
import CategoryBadge from '@/components/category-badge';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import {
    fetchCategories,
    fetchPublishedPosts,
    formatDate,
    getPostDate,
    getPostYear,
    getPreview,
    getReadTime,
} from '@/lib/blog';
import type { Category, Post } from '@/lib/blog';

type SortOption = 'newest' | 'oldest' | 'popular';

const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'popular', label: 'Most viewed' },
];

function ArchivePostRow({ post, index }: { post: Post; index: number }) {
    return (
        <Link
            href={`/posts/${post.id}`}
            className="group grid w-full gap-4 py-6 text-left md:grid-cols-[64px_160px_minmax(0,1fr)_160px] md:items-center"
        >
            <span className="text-xs font-semibold tracking-[0.25em] text-neutral-500 uppercase">
                {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                {formatDate(getPostDate(post))}
            </span>
            <div>
                <h2 className="font-serif text-2xl text-neutral-950 transition-colors group-hover:text-neutral-500 dark:text-neutral-100">
                    {post.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
                    {getPreview(post)}
                </p>
                <CategoryBadge category={post.category} className="mt-3" />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase md:justify-end">
                <span className="inline-flex items-center gap-1 tracking-normal normal-case">
                    <Eye className="size-3" />
                    {post.views ?? 0}
                </span>
                <span>{getReadTime(post)}</span>
                <ArrowRight
                    className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
                    strokeWidth={1.5}
                />
            </div>
        </Link>
    );
}

export default function Archive() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [search, setSearch] = useState('');
    const [year, setYear] = useState('all');
    const [category, setCategory] = useState(
        () =>
            new URLSearchParams(window.location.search).get('category') ??
            'all',
    );
    const [sort, setSort] = useState<SortOption>('newest');

    useEffect(() => {
        async function loadPosts() {
            setPosts(await fetchPublishedPosts());
            setIsLoadingPosts(false);
        }

        async function loadCategories() {
            setCategories(await fetchCategories());
        }

        void loadPosts();
        void loadCategories();
    }, []);

    const years = useMemo(() => {
        const found = new Set<number>();

        posts.forEach((post) => {
            const postYear = getPostYear(post);

            if (postYear) {
                found.add(postYear);
            }
        });

        return [...found].sort((first, second) => second - first);
    }, [posts]);

    const visiblePosts = useMemo(() => {
        const term = search.trim().toLowerCase();

        const filtered = posts.filter((post) => {
            const matchesYear =
                year === 'all' || String(getPostYear(post)) === year;

            const matchesCategory =
                category === 'all' ||
                String(post.category_id ?? 'none') === category;

            const matchesSearch =
                term === '' ||
                post.title.toLowerCase().includes(term) ||
                getPreview(post).toLowerCase().includes(term);

            return matchesYear && matchesCategory && matchesSearch;
        });

        // The API response is already sorted newest first.
        if (sort === 'oldest') {
            return [...filtered].reverse();
        }

        if (sort === 'popular') {
            return [...filtered].sort(
                (firstPost, secondPost) =>
                    (secondPost.views ?? 0) - (firstPost.views ?? 0),
            );
        }

        return filtered;
    }, [category, posts, search, sort, year]);

    return (
        <>
            <Head title="All posts" />
            <div className="min-h-screen bg-background text-foreground">
                <SiteHeader />

                <main className="mx-auto w-full max-w-6xl px-6 py-16">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-neutral-500 uppercase transition hover:text-neutral-950 dark:hover:text-neutral-100"
                    >
                        <ArrowLeft className="size-4" strokeWidth={1.5} />
                        Back home
                    </Link>

                    <div className="mt-8 flex flex-col gap-4 border-b border-neutral-200 pb-8 md:flex-row md:items-end md:justify-between dark:border-neutral-800">
                        <div>
                            <p className="mb-2 text-xs font-medium tracking-[0.25em] text-neutral-500 uppercase">
                                Archive
                            </p>
                            <h1 className="font-serif text-4xl text-neutral-950 sm:text-5xl dark:text-neutral-100">
                                All Posts
                            </h1>
                        </div>

                        <p className="max-w-sm text-sm leading-6 text-neutral-500 md:text-right">
                            Every published story, searchable and sortable.
                        </p>
                    </div>

                    <div className="grid gap-4 border-b border-neutral-200 py-6 md:grid-cols-[minmax(0,1fr)_repeat(3,160px)] dark:border-neutral-800">
                        <label className="flex items-center gap-3 border border-neutral-200 px-4 py-3 dark:border-neutral-800">
                            <Search className="size-4 shrink-0 text-neutral-500" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search posts"
                                className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
                            />
                        </label>

                        <select
                            value={category}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                            aria-label="Filter by category"
                            className="border border-neutral-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-neutral-800"
                        >
                            <option value="all">All categories</option>
                            {categories.map((option) => (
                                <option
                                    key={option.id}
                                    value={String(option.id)}
                                >
                                    {option.name}
                                </option>
                            ))}
                            <option value="none">Uncategorised</option>
                        </select>

                        <select
                            value={year}
                            onChange={(event) => setYear(event.target.value)}
                            aria-label="Filter by year"
                            className="border border-neutral-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-neutral-800"
                        >
                            <option value="all">All years</option>
                            {years.map((option) => (
                                <option key={option} value={String(option)}>
                                    {option}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sort}
                            onChange={(event) =>
                                setSort(event.target.value as SortOption)
                            }
                            aria-label="Sort posts"
                            className="border border-neutral-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-neutral-800"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <p className="py-6 text-xs font-semibold tracking-[0.22em] text-neutral-500 uppercase">
                        {isLoadingPosts
                            ? 'Loading posts...'
                            : `${visiblePosts.length} of ${posts.length} posts`}
                    </p>

                    {!isLoadingPosts && visiblePosts.length === 0 && (
                        <div className="border-y border-neutral-200 py-12 text-center text-sm text-neutral-500 dark:border-neutral-800">
                            No posts match your search.
                        </div>
                    )}

                    {!isLoadingPosts && visiblePosts.length > 0 && (
                        <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                            {visiblePosts.map((post, index) => (
                                <ArchivePostRow
                                    key={post.id}
                                    post={post}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </main>

                <SiteFooter />
            </div>
        </>
    );
}
