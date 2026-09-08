'use client';

import { Button, Select, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { FaCog, FaTrash } from 'react-icons/fa';
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from '@/components/ui/sheet';
import type { Category } from '@/lib/blog';
import type { Post } from '../dashboard';
import {
    deleteImage,
    fetchImages,
    getImageSrc,
    mergeFiles,
    fileKey,
    uploadImages,
} from './upload-images';
import type { PostImage } from './upload-images';

type PostForm = Pick<
    Post,
    'title' | 'slug' | 'excerpt' | 'content' | 'status' | 'category_id'
>;

type Props = {
    post: Post;
    onSaved: () => void | Promise<void>;
    categories: Category[];
};

export default function EditPost({ post, onSaved, categories }: Props) {
    const [form, setForm] = useState<PostForm>({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? '',
        content: post.content,
        status: post.status,
        category_id: post.category_id ?? null,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [images, setImages] = useState<PostImage[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [fileInputKey, setFileInputKey] = useState(0);

    // Zie create-post: controlled, en het tandwiel is nu een echte knop.
    // Als los <svg> was hij niet met het toetsenbord te bereiken en op een
    // telefoon nauwelijks te raken.
    const [isOpen, setIsOpen] = useState(false);

    async function loadImages() {
        try {
            setImages(await fetchImages(post.id));
        } catch (error: unknown) {
            notifications.show({
                title: 'Fail loading images',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Images can not be loaded',
                color: 'red',
            });
        }
    }

    useEffect(() => {
        void loadImages();
    }, [post.id]);

    /**
     * event.currentTarget.files is een LIVE FileList: hij hoort bij het input-
     * element en loopt leeg zodra we `value` wissen. React voert de updater van
     * setState pas later uit, dus tegen die tijd zat er niets meer in en werd
     * er geen enkele foto toegevoegd - op mobiel viel dat het hardst op. Eerst
     * kopieren naar een echte array, daarna pas het veld leegmaken.
     */
    const handleImages = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const files = Array.from(input.files ?? []);

        // Leegmaken, anders vuurt change niet als je hetzelfde bestand
        // nogmaals kiest.
        input.value = '';

        if (files.length === 0) {
            return;
        }

        setNewImages((current) => mergeFiles(current, files));
    };

    const removeNewImage = (index: number) => {
        setNewImages((current) =>
            current.filter((_, position) => position !== index),
        );
    };

    const removeImage = async (image: PostImage) => {
        try {
            await deleteImage(image.id);
            setImages((current) =>
                current.filter((item) => item.id !== image.id),
            );
        } catch (error: unknown) {
            notifications.show({
                title: 'Fail deleting image',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Image can not be deleted',
                color: 'red',
            });
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);

        try {
            const response = await fetch(`/api/posts/${post.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                throw new Error('Blog kan niet worden bijgewerkt');
            }

            if (newImages.length > 0) {
                const uploaded = await uploadImages(post.id, newImages);
                setImages((current) => [...current, ...uploaded]);
                setNewImages([]);
                setFileInputKey((current) => current + 1);
            }

            notifications.show({
                title: 'Approved',
                message: 'Blog is edited',
                color: 'green',
            });

            await onSaved();
        } catch (error: unknown) {
            notifications.show({
                title: 'Fail',
                message:
                    error instanceof Error
                        ? error.message
                        : "Blog can't be edited",
                color: 'red',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                aria-label={`Edit ${post.title}`}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
                <FaCog size={14} />
            </button>

            <SheetContent
                side="right"
                className="flex w-full max-w-lg flex-col p-4 sm:max-w-lg"
            >
                <SheetTitle>Edit {post.title}</SheetTitle>
                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col gap-4"
                >
                    {/* Bestaande afbeeldingen duwden het bestandsveld en de
                        Submit-knop buiten beeld; alleen dit deel scrollt. */}
                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
                        <TextInput
                            label="Title"
                            value={form.title}
                            onChange={(event) => {
                                const { value } = event.currentTarget;

                                setForm((currentForm) => ({
                                    ...currentForm,
                                    title: value,
                                }));
                            }}
                            required
                        />

                        <TextInput
                            label="Slug"
                            value={form.slug}
                            onChange={(event) => {
                                const { value } = event.currentTarget;

                                setForm((currentForm) => ({
                                    ...currentForm,
                                    slug: value,
                                }));
                            }}
                            required
                        />

                        <Textarea
                            label="Excerpt"
                            value={form.excerpt ?? ''}
                            onChange={(event) => {
                                const { value } = event.currentTarget;

                                setForm((currentForm) => ({
                                    ...currentForm,
                                    excerpt: value,
                                }));
                            }}
                        />

                        <Textarea
                            label="Content"
                            value={form.content}
                            onChange={(event) => {
                                const { value } = event.currentTarget;

                                setForm((currentForm) => ({
                                    ...currentForm,
                                    content: value,
                                }));
                            }}
                            minRows={6}
                            required
                        />

                        <Select
                            label="Category"
                            data={[
                                { value: '', label: 'No category' },
                                ...categories.map((category) => ({
                                    value: String(category.id),
                                    label: category.name,
                                })),
                            ]}
                            value={
                                form.category_id ? String(form.category_id) : ''
                            }
                            onChange={(value) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    category_id: value ? Number(value) : null,
                                }))
                            }
                        />

                        <Select
                            label="Status"
                            data={['draft', 'published', 'archived']}
                            value={form.status}
                            onChange={(value) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    status: (value ??
                                        'draft') as Post['status'],
                                }))
                            }
                        />

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">
                                Images
                            </label>

                            {images.length > 0 && (
                                <div className="grid grid-cols-6 gap-2">
                                    {images.map((image) => (
                                        <div
                                            key={image.id}
                                            className="relative"
                                        >
                                            <img
                                                src={getImageSrc(image.path)}
                                                alt={post.title}
                                                className="aspect-square w-full rounded-md object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void removeImage(image)
                                                }
                                                className="absolute top-1 right-1 rounded-full bg-black/70 p-1.5 text-white"
                                                aria-label="Delete image"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <input
                                key={fileInputKey}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImages}
                                className="text-sm"
                            />

                            {newImages.length > 0 && (
                                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                                    {newImages.map((file, index) => (
                                        <li
                                            key={fileKey(file)}
                                            className="flex items-center justify-between gap-2"
                                        >
                                            <span className="truncate">
                                                {file.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeNewImage(index)
                                                }
                                                className="shrink-0 underline"
                                            >
                                                remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <Button
                            type="submit"
                            color="dark"
                            loading={isSaving}
                            fullWidth
                        >
                            Submit
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
