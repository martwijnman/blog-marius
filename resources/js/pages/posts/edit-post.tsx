'use client';

import { Button, Select, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { FaCog, FaTrash } from 'react-icons/fa';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import type { Category } from '@/lib/blog';
import type { Post } from '../dashboard';
import {
    deleteImage,
    fetchImages,
    getImageSrc,
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

    const handleImages = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.currentTarget.files;

        if (!files) {
            return;
        }

        setNewImages(Array.from(files));
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
        <Sheet>
            <SheetTrigger asChild>
                <FaCog size={14} />
            </SheetTrigger>

            <SheetContent
                side="right"
                className="w-full max-w-lg p-4 sm:max-w-lg"
            >
                <SheetTitle>Edit {post.title}</SheetTitle>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <TextInput
                        label="Title"
                        value={form.title}
                        onChange={(event) =>
                            setForm((currentForm) => ({
                                ...currentForm,
                                title: event.currentTarget.value,
                            }))
                        }
                        required
                    />

                    <TextInput
                        label="Slug"
                        value={form.slug}
                        onChange={(event) =>
                            setForm((currentForm) => ({
                                ...currentForm,
                                slug: event.currentTarget.value,
                            }))
                        }
                        required
                    />

                    <Textarea
                        label="Excerpt"
                        value={form.excerpt ?? ''}
                        onChange={(event) =>
                            setForm((currentForm) => ({
                                ...currentForm,
                                excerpt: event.currentTarget.value,
                            }))
                        }
                    />

                    <Textarea
                        label="Content"
                        value={form.content}
                        onChange={(event) =>
                            setForm((currentForm) => ({
                                ...currentForm,
                                content: event.currentTarget.value,
                            }))
                        }
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
                        value={form.category_id ? String(form.category_id) : ''}
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
                                status: (value ?? 'draft') as Post['status'],
                            }))
                        }
                    />

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Images</label>

                        {images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {images.map((image) => (
                                    <div key={image.id} className="relative">
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
                    </div>

                    <Button type="submit" loading={isSaving}>
                        Submit
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
