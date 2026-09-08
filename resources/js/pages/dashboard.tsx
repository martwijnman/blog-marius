'use client';

import { Head } from '@inertiajs/react';
import {
    Button,
    Checkbox,
    Flex,
    MultiSelect,
    Pagination,
    Select,
    Table,
    TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { FaPen, FaFile, FaCircle, FaComment, FaTrash } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ImageIcon } from 'lucide-react';
import { dashboard } from '@/routes';
import { fetchCategories } from '@/lib/blog';
import type { Category } from '@/lib/blog';
import ShowPost from './posts/show-post';
import CreatePost from './posts/create-post';
import EditPost from './posts/edit-post';
import 'swiper/css';
import { fetchAllImages, getImageSrc } from './posts/upload-images';
import type { PostImage } from './posts/upload-images';

type PostStatus = 'draft' | 'published' | 'archived';

/** One dropdown drives both bulk actions: set a status, or delete. */
type BulkAction = '' | PostStatus | 'delete';

const PAGE_SIZE_OPTIONS = ['5', '10', '25', '50'];

const bulkActions = [
    {
        group: 'Change status',
        items: [
            { value: 'draft', label: 'Set to draft' },
            { value: 'published', label: 'Set to published' },
            { value: 'archived', label: 'Set to archived' },
        ],
    },
    {
        group: 'Danger zone',
        items: [{ value: 'delete', label: 'Delete selected' }],
    },
];

export interface Post {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    status: PostStatus;
    category_id: number | null;
    category?: Category | null;
    created_at: string | null;
}

export default function Dashboard() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [imagesByPostId, setImagesByPostId] = useState<
        Record<number, PostImage[]>
    >({});

    // images import
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    async function loadPostImages(loadedPosts: Post[]) {
        if (loadedPosts.length === 0) {
            setImagesByPostId({});

            return;
        }

        setIsLoadingImages(true);

        try {
            const grouped: Record<number, PostImage[]> = {};

            for (const image of await fetchAllImages()) {
                (grouped[image.post_id] ??= []).push(image);
            }

            setImagesByPostId(grouped);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Images can not be loaded';

            notifications.show({
                title: 'Fail loading images',
                message,
                color: 'red',
            });
            setImagesByPostId({});
        } finally {
            setIsLoadingImages(false);
        }
    }
    async function loadPosts() {
        setIsLoading(true);

        try {
            const response = await fetch('/api/posts', {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                notifications.show({
                    title: 'Fail loading posts',
                    message: 'Posts can not be load',
                    color: 'red',
                });
            }

            const loadedPosts = (await response.json()) as Post[];
            setPosts(loadedPosts);
            await loadPostImages(loadedPosts);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Posts can not be load';

            notifications.show({
                title: 'Fail loading posts',
                message,
                color: 'red',
            });
        } finally {
            setIsLoading(false);
        }
    }

    // filter and queries
    const [sortQuery, setSortQuery] = useState('');
    const [statusQuery, setStatusQuery] = useState('');

    const filteredPosts = [...posts]
        .sort((a, b) => {
            if (sortQuery === 'Date') {
                return (
                    new Date(b.created_at || '').getTime() -
                    new Date(a.created_at || '').getTime()
                );
            }

            if (sortQuery === 'Alphabet') {
                return a.title.localeCompare(b.title);
            }

            return 0;
        })
        .filter((post) => {
            const matchesSearch = post.title
                .toLowerCase()
                .includes(search.toLowerCase());
            const matchesStatus =
                !statusQuery ||
                post.status.toLowerCase() === statusQuery.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    const [activePage, setActivePage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));

    // Clamp: after deleting or filtering, activePage can point past the last
    // page — without this the table renders an empty slice with no way back.
    const currentPage = Math.min(activePage, totalPages);

    const paginatedPosts = filteredPosts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const handleSortChange = (value: string[]) => {
        setSortQuery(value[0] || '');
        setActivePage(1);
    };

    const handleStatusChange = (value: string[]) => {
        setStatusQuery(value[0] || '');
        setActivePage(1);
    };

    async function deletePost(post: Post) {
        const response = await fetch(`/api/posts/${post.id}`, {
            method: 'DELETE',
            headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
            notifications.show({
                title: `Fail deleting ${post.title}`,
                message: 'Post can not be deleted',
                color: 'red',
            });

            return;
        }

        notifications.hide('delete-post'); // avoid double notification

        notifications.show({
            id: 'delete-post',
            title: 'Post deleted',
            message: 'Post successfully deleted',
            color: 'green',
        });

        setPosts((currentPosts) =>
            currentPosts.filter((currentPost) => currentPost.id !== post.id),
        );
    }

    useEffect(() => {
        void loadPosts();
    }, []);

    useEffect(() => {
        async function loadCategories() {
            setCategories(await fetchCategories());
        }

        void loadCategories();
    }, []);

    // select
    const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
    const allSelected =
        paginatedPosts.length > 0 &&
        paginatedPosts.every((post) => selectedPosts.includes(post.id));
    const [bulkAction, setBulkAction] = useState<BulkAction>('');
    const [isBulkRunning, setIsBulkRunning] = useState(false);

    const indeterminate =
        selectedPosts.some((id) =>
            filteredPosts.some((post) => post.id === id),
        ) && !allSelected;

    const handleSelect = (id: number, checked: boolean) => {
        if (id == null) {
            console.warn('Post zonder id — selectie werkt niet correct');

            return;
        }

        setSelectedPosts((prev) =>
            checked
                ? prev.includes(id)
                    ? prev
                    : [...prev, id]
                : prev.filter((postId) => postId !== id),
        );
    };

    async function bulkUpdateStatus(status: PostStatus) {
        const response = await fetch('/api/posts/bulk-status', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                ids: selectedPosts,
                status,
            }),
        });

        if (!response.ok) {
            notifications.show({
                title: 'Update failed',
                message: 'The status could not be updated',
                color: 'red',
            });

            return;
        }

        setPosts((currentPosts) =>
            currentPosts.map((post) =>
                selectedPosts.includes(post.id) ? { ...post, status } : post,
            ),
        );

        setSelectedPosts([]);

        notifications.show({
            title: 'Status updated',
            message: 'The status was updated successfully',
            color: 'green',
        });
    }

    async function bulkDeletePosts() {
        if (selectedPosts.length === 0) {
            return;
        }

        const response = await fetch('/api/posts/bulk-delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                ids: selectedPosts,
            }),
        });

        if (!response.ok) {
            notifications.show({
                title: 'Delete failed',
                message: 'The posts could not be deleted',
                color: 'red',
            });

            return;
        }

        setPosts((currentPosts) =>
            currentPosts.filter((post) => !selectedPosts.includes(post.id)),
        );

        setSelectedPosts([]);

        notifications.show({
            title: 'Posts deleted',
            message: 'The selected posts were deleted successfully',
            color: 'green',
        });
    }

    async function applyBulkAction() {
        if (selectedPosts.length === 0 || bulkAction === '' || isBulkRunning) {
            return;
        }

        setIsBulkRunning(true);

        try {
            if (bulkAction === 'delete') {
                await bulkDeletePosts();
            } else {
                await bulkUpdateStatus(bulkAction);
            }

            setBulkAction('');
        } finally {
            setIsBulkRunning(false);
        }
    }

    // reader view
    const [readerPost, setReaderPost] = useState<Post | null>(null);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedPosts(paginatedPosts.map((post) => post.id));
        } else {
            setSelectedPosts([]);
        }
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-xl border p-5">
                            <FaPen size={23} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl">Blogs</h1>
                            <p>Create, manage and orginase your posts</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <CreatePost
                            onSaved={loadPosts}
                            categories={categories}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 md:p-5">
                        <div className="flex items-center gap-3 md:gap-4">
                            <FaFile className="h-11 w-11 rounded-2xl md:h-14 md:w-14 bg-blue-500/20 p-2.5 md:p-3 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.45)] ring-2 ring-blue-500/40" />
                            <div>
                                <p className="text-sm text-gray-400">
                                    Total Posts
                                </p>
                                <h2 className="text-2xl font-bold md:text-3xl">
                                    {posts.length}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 md:p-5">
                        <div className="flex items-center gap-3 md:gap-4">
                            <FaCircle className="h-11 w-11 rounded-2xl md:h-14 md:w-14 bg-green-500/20 p-2.5 md:p-3 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.45)] ring-2 ring-green-500/40" />
                            <div>
                                <p className="text-sm text-gray-400">
                                    Published
                                </p>
                                <h2 className="text-2xl font-bold md:text-3xl">
                                    {
                                        posts.filter(
                                            (post) =>
                                                post.status === 'published',
                                        ).length
                                    }
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 md:p-5">
                        <div className="flex items-center gap-3 md:gap-4">
                            <FaPen className="h-11 w-11 rounded-2xl md:h-14 md:w-14 bg-yellow-500/20 p-2.5 md:p-3 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.45)] ring-2 ring-yellow-500/40" />
                            <div>
                                <p className="text-sm text-gray-400">Drafts</p>
                                <h2 className="text-2xl font-bold md:text-3xl">
                                    {
                                        posts.filter(
                                            (post) => post.status === 'draft',
                                        ).length
                                    }
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 md:p-5">
                        <div className="flex items-center gap-3 md:gap-4">
                            <FaComment className="h-11 w-11 rounded-2xl md:h-14 md:w-14 bg-purple-500/20 p-2.5 md:p-3 text-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.45)] ring-2 ring-purple-500/40" />
                            <div>
                                <p className="text-sm text-gray-400">
                                    Comments
                                </p>
                                <h2 className="text-2xl font-bold md:text-3xl">0</h2>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <div className="flex flex-col gap-4">
                        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-[400px]">
                                <TextInput
                                    className="w-full"
                                    placeholder="Search blog..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setActivePage(1);
                                    }}
                                />
                                <MultiSelect
                                    className="w-full"
                                    placeholder="Choose status"
                                    data={['published', 'draft', 'archived']}
                                    value={statusQuery ? [statusQuery] : []}
                                    onChange={handleStatusChange}
                                />
                            </div>
                            <div className="flex w-full flex-row lg:w-auto">
                                <MultiSelect
                                    className="w-full"
                                    placeholder="Sort"
                                    data={['Date', 'Alphabet', 'Views']}
                                    value={sortQuery ? [sortQuery] : []}
                                    onChange={handleSortChange}
                                />
                            </div>
                        </div>

                        {selectedPosts.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-sidebar-border/70 bg-background p-3">
                                <span className="text-sm text-gray-400">
                                    {selectedPosts.length} selected
                                </span>

                                <Select
                                    placeholder="Choose action"
                                    data={bulkActions}
                                    value={bulkAction || null}
                                    onChange={(value) =>
                                        setBulkAction(
                                            (value ?? '') as BulkAction,
                                        )
                                    }
                                    disabled={isBulkRunning}
                                    w={220}
                                />

                                <Button
                                    variant="white"
                                    onClick={() => void applyBulkAction()}
                                    disabled={bulkAction === ''}
                                    loading={isBulkRunning}
                                    color={
                                        bulkAction === 'delete' ? 'red' : 'dark'
                                    }
                                >
                                    Apply
                                </Button>

                                <Button
                                    variant="white"
                                    color="dark"
                                    onClick={() => {
                                        setSelectedPosts([]);
                                        setBulkAction('');
                                    }}
                                    disabled={isBulkRunning}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}

                        {/* Negen kolommen passen niet op een telefoon. Onder
                            md tonen we dezelfde posts als kaarten, met
                            tapdoelen die groot genoeg zijn voor een duim. */}
                        <ul className="flex flex-col gap-3 md:hidden">
                            {paginatedPosts.map((post) => {
                                const postImages =
                                    imagesByPostId[post.id] ?? [];
                                const cover = postImages[0];

                                return (
                                    <li
                                        key={post.id}
                                        className="rounded-xl border border-sidebar-border/70 bg-background p-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                size="sm"
                                                className="mt-1"
                                                checked={selectedPosts.includes(
                                                    post.id,
                                                )}
                                                onChange={(event) =>
                                                    handleSelect(
                                                        post.id,
                                                        event.currentTarget
                                                            .checked,
                                                    )
                                                }
                                                aria-label={`Select ${post.title}`}
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setReaderPost(post)
                                                }
                                                className="flex min-w-0 flex-1 items-start gap-3 text-left"
                                            >
                                                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                                                    {cover ? (
                                                        <img
                                                            src={getImageSrc(
                                                                cover.path,
                                                            )}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-neutral-500">
                                                            <ImageIcon className="size-5" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium">
                                                        {post.title}
                                                    </p>
                                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                                        {post.excerpt ??
                                                            post.content}
                                                    </p>
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-[11px] ${
                                                                post.status ===
                                                                'published'
                                                                    ? 'bg-green-500/15 text-green-500'
                                                                    : post.status ===
                                                                        'draft'
                                                                      ? 'bg-yellow-500/15 text-yellow-500'
                                                                      : 'bg-neutral-500/15 text-neutral-400'
                                                            }`}
                                                        >
                                                            {post.status}
                                                        </span>
                                                        <span>
                                                            {post.created_at?.split(
                                                                'T',
                                                            )[0] ?? '-'}
                                                        </span>
                                                        {postImages.length >
                                                            0 && (
                                                            <span>
                                                                {
                                                                    postImages.length
                                                                }{' '}
                                                                {postImages.length ===
                                                                1
                                                                    ? 'image'
                                                                    : 'images'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="mt-3 flex items-center justify-end gap-1 border-t border-sidebar-border/70 pt-2">
                                            <div className="flex h-10 w-10 items-center justify-center">
                                                <EditPost
                                                    post={post}
                                                    onSaved={loadPosts}
                                                    categories={categories}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setReaderPost(post)
                                                }
                                                aria-label={`Read ${post.title}`}
                                                className="flex h-10 w-10 items-center justify-center text-muted-foreground"
                                            >
                                                <FaFile size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void deletePost(post)
                                                }
                                                aria-label={`Delete ${post.title}`}
                                                className="flex h-10 w-10 items-center justify-center text-muted-foreground"
                                            >
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}

                            {!isLoading && paginatedPosts.length === 0 && (
                                <li className="rounded-xl border border-sidebar-border/70 py-10 text-center text-sm text-muted-foreground">
                                    {posts.length === 0
                                        ? 'No posts yet.'
                                        : 'No posts match your filters.'}
                                </li>
                            )}

                            {isLoading && (
                                <li className="rounded-xl border border-sidebar-border/70 py-10 text-center text-sm text-muted-foreground">
                                    Loading posts...
                                </li>
                            )}
                        </ul>

                        <div className="hidden overflow-x-auto md:block">
                        <Table
                            stickyHeader
                            striped="odd"
                            highlightOnHover
                            verticalSpacing={8}
                            horizontalSpacing="xs"
                            fz="xs"
                            withTableBorder
                            className="table-fixed"
                        >
                            <Table.Thead>
                                <Table.Tr p="xs">
                                    <Table.Th
                                        className="w-10 text-center"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div
                                            className="flex justify-center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                size="xs"
                                                checked={allSelected}
                                                indeterminate={indeterminate}
                                                onChange={(event) => {
                                                    event.stopPropagation();
                                                    handleSelectAll(
                                                        event.currentTarget
                                                            .checked,
                                                    );
                                                }}
                                            />
                                        </div>
                                    </Table.Th>
                                    <Table.Th className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase w-28">Title</Table.Th>
                                    <Table.Th className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase w-36">Excerpt</Table.Th>
                                    <Table.Th className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase w-36">Content</Table.Th>
                                    <Table.Th className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase w-36">Slug</Table.Th>
                                    <Table.Th className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase w-24">Status</Table.Th>
                                    <Table.Th className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase w-20 text-center">Images</Table.Th>
                                    <Table.Th className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase w-28">Published at</Table.Th>
                                    <Table.Th className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase w-24 text-center">Action</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {paginatedPosts.map((post) => {
                                    const postImages =
                                        imagesByPostId[post.id] ?? [];

                                    return (
                                        <Table.Tr
                                            key={post.id}
                                            className="cursor-pointer"
                                            onClick={() => setReaderPost(post)}
                                        >
                                            <Table.Td
                                                className="w-10 text-center align-middle"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div
                                                    className="flex justify-center"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Checkbox
                                                        size="xs"
                                                        checked={selectedPosts.includes(
                                                            post.id,
                                                        )}
                                                        onChange={(event) => {
                                                            event.stopPropagation();
                                                            handleSelect(
                                                                post.id,
                                                                event
                                                                    .currentTarget
                                                                    .checked,
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </Table.Td>
                                            <Table.Td className="truncate align-middle font-medium text-foreground">
                                                {post.title}
                                            </Table.Td>
                                            <Table.Td className="truncate align-middle text-muted-foreground">
                                                {post.excerpt ?? '-'}
                                            </Table.Td>
                                            <Table.Td className="truncate align-middle text-muted-foreground">
                                                {post.content}
                                            </Table.Td>
                                            <Table.Td className="truncate align-middle font-mono text-[11px] text-muted-foreground">
                                                {post.slug}
                                            </Table.Td>
                                            <Table.Td className="align-middle">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                                        post.status ===
                                                        'published'
                                                            ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                                            : post.status ===
                                                                'draft'
                                                              ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                                                              : 'bg-neutral-500/15 text-neutral-500'
                                                    }`}
                                                >
                                                    {post.status}
                                                </span>
                                            </Table.Td>
                                            <Table.Td className="align-middle">
                                                {/* Fixed box: without it the
                                                    Swiper stretches the row to
                                                    the images' natural height. */}
                                                <div className="h-10 w-16 overflow-hidden rounded-md border border-dashed border-sidebar-border/70">
                                                    {isLoadingImages && (
                                                        <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                                                            Loading...
                                                        </div>
                                                    )}

                                                    {!isLoadingImages &&
                                                        postImages.length ===
                                                            0 && (
                                                            <div className="flex h-full items-center justify-center text-neutral-500">
                                                                <ImageIcon className="size-5" />
                                                            </div>
                                                        )}

                                                    {!isLoadingImages &&
                                                        postImages.length >
                                                            0 && (
                                                            <Swiper
                                                                slidesPerView={
                                                                    1
                                                                }
                                                                className="h-full w-full"
                                                            >
                                                                {postImages.map(
                                                                    (
                                                                        image,
                                                                        index,
                                                                    ) => (
                                                                        <SwiperSlide
                                                                            key={
                                                                                image.id
                                                                            }
                                                                        >
                                                                            <img
                                                                                src={getImageSrc(
                                                                                    image.path,
                                                                                )}
                                                                                alt={`${post.title} image ${index + 1}`}
                                                                                className="h-10 w-16 object-cover grayscale transition duration-500 hover:grayscale-0 dark:brightness-75 dark:contrast-125"
                                                                            />
                                                                        </SwiperSlide>
                                                                    ),
                                                                )}
                                                            </Swiper>
                                                        )}
                                                </div>
                                            </Table.Td>
                                            <Table.Td className="align-middle text-muted-foreground tabular-nums">
                                                {post.created_at?.split(
                                                    'T',
                                                )[0] ?? '-'}
                                            </Table.Td>
                                            <Table.Td
                                                className="align-middle"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Flex
                                                    align="center"
                                                    justify="center"
                                                    gap={2}
                                                    wrap="nowrap"
                                                >
                                                    <EditPost
                                                        post={post}
                                                        onSaved={loadPosts}
                                                        categories={categories}
                                                    />
                                                    <button
                                                        type="button"
                                                        aria-label={`Read ${post.title}`}
                                                        onClick={() =>
                                                            setReaderPost(post)
                                                        }
                                                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                                    >
                                                        <FaFile size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label={`Delete ${post.title}`}
                                                        onClick={() =>
                                                            void deletePost(
                                                                post,
                                                            )
                                                        }
                                                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </Flex>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                                {!isLoading && paginatedPosts.length === 0 && (
                                    <Table.Tr>
                                        <Table.Td
                                            colSpan={9}
                                            className="w-full py-10 text-center text-muted-foreground"
                                        >
                                            {posts.length === 0
                                                ? 'No posts yet.'
                                                : 'No posts match your filters.'}
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                                {isLoading && (
                                    <Table.Tr>
                                        <Table.Td
                                            colSpan={9}
                                            className="w-full py-10 text-center text-muted-foreground"
                                        >
                                            Loading posts...
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                        </div>

                        {!isLoading && filteredPosts.length > 0 && (
                            <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>
                                        {(currentPage - 1) * pageSize + 1}–
                                        {Math.min(
                                            currentPage * pageSize,
                                            filteredPosts.length,
                                        )}{' '}
                                        of {filteredPosts.length}
                                    </span>
                                    <Select
                                        data={PAGE_SIZE_OPTIONS}
                                        value={String(pageSize)}
                                        onChange={(value) => {
                                            setPageSize(Number(value) || 10);
                                            setActivePage(1);
                                        }}
                                        allowDeselect={false}
                                        w={80}
                                        size="xs"
                                    />
                                    <span>per page</span>
                                </div>

                                <Pagination
                                    total={totalPages}
                                    value={currentPage}
                                    onChange={setActivePage}
                                    classNames={{
                                        control:
                                            'data-[active]:!border-neutral-950 data-[active]:!bg-neutral-950 data-[active]:!text-white dark:data-[active]:!border-neutral-100 dark:data-[active]:!bg-neutral-100 dark:data-[active]:!text-neutral-950',
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {readerPost && (
                <ShowPost
                    key={readerPost.id}
                    post={readerPost}
                    open
                    withTrigger={false}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setReaderPost(null);
                        }
                    }}
                />
            )}
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
