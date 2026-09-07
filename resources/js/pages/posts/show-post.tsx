'use client';

import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import type { Post } from '../dashboard';
import { FaFile } from 'react-icons/fa';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { CalendarDays, ImageIcon, MessageCircle, Send, Sparkles } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

type Props = {
    post: Post;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    withTrigger?: boolean;
};

export interface ReaderImage {
    id: number;
    post_id: number;
    path: string;
}

type ReaderComment = {
    id: number;
    post_id: number;
    comment: string;
    created_at: string | null;
};

const getReadTime = (content: string) => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;

    return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

const formatDate = (date: string | null) => {
    if (!date) {
        return 'No date';
    }

    return new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(date));
};

export default function ShowPost({ post, open, onOpenChange, withTrigger = true }: Props) {
    const [images, setImages] = useState<ReaderImage[]>([]);
    const [comments, setComments] = useState<ReaderComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingImages, setIsLoadingImages] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [isSavingComment, setIsSavingComment] = useState(false);

    const postImages = useMemo(
        () => images.filter((image) => image.post_id === post.id),
        [images, post.id],
    );

    const paragraphs = useMemo(
        () => post.content.split('\n').filter((paragraph) => paragraph.trim().length > 0),
        [post.content],
    );

    async function loadImages() {
        setIsLoadingImages(true);

        try {
            const response = await fetch(`/api/images/${post.id}`, {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Images can not be loaded');
            }

            const loadedImages = (await response.json()) as ReaderImage[];
            setImages(loadedImages);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Images can not be loaded';

            notifications.show({
                title: 'Fail loading images',
                message,
                color: 'red',
            });
        } finally {
            setIsLoadingImages(false);
        }
    }

    async function loadComments() {
        setIsLoadingComments(true);

        try {
            const response = await fetch(`/api/posts/${post.id}/comments`, {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Comments can not be loaded');
            }

            const loadedComments = (await response.json()) as ReaderComment[];
            setComments(loadedComments);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Comments can not be loaded';

            notifications.show({
                title: 'Fail loading comments',
                message,
                color: 'red',
            });
        } finally {
            setIsLoadingComments(false);
        }
    }

    async function saveComment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const comment = newComment.trim();

        if (!comment) {
            return;
        }

        setIsSavingComment(true);

        try {
            const response = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ comment }),
            });

            if (!response.ok) {
                throw new Error('Comment can not be saved');
            }

            const savedComment = (await response.json()) as ReaderComment;
            setComments((currentComments) => [savedComment, ...currentComments]);
            setNewComment('');

            notifications.show({
                title: 'Comment saved',
                message: 'Your comment has been added.',
                color: 'green',
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Comment can not be saved';

            notifications.show({
                title: 'Fail saving comment',
                message,
                color: 'red',
            });
        } finally {
            setIsSavingComment(false);
        }
    }

    useEffect(() => {
        void loadImages();
        void loadComments();
    }, [post.id]);

    const getImageSrc = (path: string) => {
        if (path.startsWith('http') || path.startsWith('/')) {
            return path;
        }

        return `/media/${path}`;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {withTrigger && (
                <SheetTrigger asChild>
                    <FaFile size={20} />
                </SheetTrigger>
            )}

            <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-5xl">
                <SheetTitle className="sr-only">Details {post.title}</SheetTitle>
                        <article className="min-h-full bg-background text-foreground">
                            <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                                <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-10">
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">
                                        <span className="inline-flex items-center gap-2">
                                            <CalendarDays className="size-4" />
                                            {formatDate(post.created_at)}
                                        </span>
                                        <span>{getReadTime(post.content)}</span>
                                    </div>
                
                                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
                                        <div className="flex flex-col gap-5">
                                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                                                Journal entry
                                            </p>
                                            <h1 className="font-serif text-4xl leading-tight text-neutral-950 dark:text-neutral-100 sm:text-6xl">
                                                {post.title}
                                            </h1>
                                            {post.excerpt && (
                                                <p className="max-w-3xl text-base leading-8 text-neutral-600 dark:text-neutral-400 sm:text-lg">
                                                    {post.excerpt}
                                                </p>
                                            )}
                                        </div>
                
                                        <div className="grid grid-cols-2 border border-neutral-200 text-center dark:border-neutral-800">
                                            <div className="border-r border-neutral-200 px-4 py-5 dark:border-neutral-800">
                                                <p className="font-serif text-3xl">{postImages.length}</p>
                                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                                                    Images
                                                </p>
                                            </div>
                                            <div className="px-4 py-5">
                                                <p className="font-serif text-3xl">{comments.length}</p>
                                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                                                    Comments
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </header>
                
                            <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
                                <div className="flex min-w-0 flex-col gap-10">
                                    <section className="overflow-hidden border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
                                        {isLoadingImages && (
                                            <div className="flex aspect-[16/9] items-center justify-center text-sm text-neutral-500">
                                                Images loading...
                                            </div>
                                        )}
                
                                        {!isLoadingImages && postImages.length === 0 && (
                                            <div className="flex aspect-[16/9] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-neutral-500">
                                                <ImageIcon className="size-8" />
                                                No images added to this post yet.
                                            </div>
                                        )}
                
                                        {!isLoadingImages && postImages.length > 0 && (
                                            <Swiper>
                                                {postImages.map((image, index) => (
                                                    <SwiperSlide key={image.id}>
                                                        <img
                                                            src={getImageSrc(image.path)}
                                                            alt={`${post.title} image ${index + 1}`}
                                                            className="aspect-[16/9] w-full object-cover grayscale transition duration-500 hover:grayscale-0 dark:brightness-75 dark:contrast-125"
                                                        />
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>
                                        )}
                                    </section>
                
                                    <section className="prose prose-neutral max-w-none text-base leading-8 text-neutral-800 dark:prose-invert dark:text-neutral-200">
                                        {paragraphs.map((paragraph, index) => (
                                            <p key={`${post.id}-${index}`}>{paragraph}</p>
                                        ))}
                                    </section>
                                </div>
                
                                <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">


                                    <section className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                                        {isLoadingComments ? (
                                            <div className="p-5 text-sm text-neutral-500">Comments loading...</div>
                                        ) : comments.length === 0 ? (
                                            <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-5 text-center text-sm text-neutral-500">
                                                <Sparkles className="size-5" />
                                                No comments yet.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                                {comments.map((comment) => (
                                                    <article key={comment.id} className="p-5">
                                                        <p className="text-sm leading-6 text-neutral-800 dark:text-neutral-200">
                                                            {comment.comment}
                                                        </p>
                                                        <time className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                                            {formatDate(comment.created_at)}
                                                        </time>
                                                    </article>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </aside>
                            </div>
                        </article>
            </SheetContent>
        </Sheet>
    );
}
