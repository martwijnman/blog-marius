'use client';

import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import type { Category } from '@/lib/blog';
import type { Post } from '../dashboard';
import { mergeFiles, uploadImages } from './upload-images';

type PostForm = Pick<
    Post,
    'title' | 'slug' | 'excerpt' | 'content' | 'status' | 'category_id'
> & {
    images: File[];
};

type Props = {
    onSaved?: () => void | Promise<void>;
    categories: Category[];
};

const initialForm: PostForm = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft',
    category_id: null,
    images: [],
};

export default function CreatePost({ onSaved, categories }: Props) {
    const [form, setForm] = useState<PostForm>(initialForm);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);

    // createObjectURL hoorde niet in de render thuis: die draaide bij elke
    // toetsaanslag opnieuw en liet telkens een blob-URL achter die nooit werd
    // vrijgegeven. Nu wordt er per bestand precies een gemaakt, en opgeruimd
    // zodra de selectie verandert of het formulier verdwijnt.
    const previews = useMemo(
        () =>
            form.images.map((image) => ({
                key: `${image.name}-${image.lastModified}`,
                name: image.name,
                url: URL.createObjectURL(image),
            })),
        [form.images],
    );

    useEffect(() => {
        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [previews]);

    const updateForm = (field: keyof PostForm, value: string) => {
        setForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));
    };

    const handleImages = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.currentTarget.files;

        if (!files) {
            return;
        }

        setForm((current) => ({
            ...current,
            images: mergeFiles(current.images, files),
        }));

        // Leegmaken, anders vuurt change niet als je hetzelfde bestand
        // nogmaals kiest.
        event.currentTarget.value = '';
    };

    const removeImage = (key: string) => {
        setForm((current) => ({
            ...current,
            images: current.images.filter(
                (image) => `${image.name}-${image.lastModified}` !== key,
            ),
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (isSaving) {
            return;
        }

        setError(null);
        setIsSaving(true);

        try {
            const { images, ...postData } = form;

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                throw new Error('There is something missing');
            }

            const createdPost = (await response.json()) as Post;

            if (images.length > 0) {
                await uploadImages(createdPost.id, images);
            }

            notifications.show({
                id: 'create-post-result',
                title: 'Blog posted',
                message: 'The blog has been saved.',
                color: 'green',
            });

            setForm(initialForm);
            setFileInputKey((current) => current + 1);
            await onSaved?.();
        } catch (submitError: unknown) {
            const message =
                submitError instanceof Error
                    ? submitError.message
                    : 'Blog kan niet worden opgeslagen.';

            setError(message);
            notifications.show({
                id: 'create-post-result',
                title: 'Fail posting the blog',
                message,
                color: 'red',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button type="button">+ Create a blog</Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="flex w-full max-w-lg flex-col p-4 sm:max-w-lg"
            >
                <SheetTitle>Post a new blog</SheetTitle>
                <SheetDescription>Make a new blog</SheetDescription>

                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col gap-4"
                >
                    {/* Alleen de velden scrollen; de knop hieronder blijft
                        altijd in beeld, ook met een afbeeldingsvoorbeeld. */}
                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
                        <div className="grid gap-2">
                            <Label htmlFor="post-title">Title</Label>
                            <Input
                                id="post-title"
                                value={form.title}
                                onChange={(event) =>
                                    updateForm(
                                        'title',
                                        event.currentTarget.value,
                                    )
                                }
                                placeholder="Title"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="post-slug">Slug</Label>
                            <Input
                                id="post-slug"
                                value={form.slug}
                                onChange={(event) =>
                                    updateForm(
                                        'slug',
                                        event.currentTarget.value,
                                    )
                                }
                                placeholder="my-first-post"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="post-excerpt">Excerpt</Label>
                            <textarea
                                id="post-excerpt"
                                className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={form.excerpt ?? ''}
                                onChange={(event) =>
                                    updateForm(
                                        'excerpt',
                                        event.currentTarget.value,
                                    )
                                }
                                placeholder="Short summary"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="post-content">Content</Label>
                            <textarea
                                id="post-content"
                                className="min-h-36 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={form.content}
                                onChange={(event) =>
                                    updateForm(
                                        'content',
                                        event.currentTarget.value,
                                    )
                                }
                                placeholder="Content"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="post-status">Status</Label>
                            <select
                                id="post-status"
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={form.status}
                                onChange={(event) =>
                                    updateForm(
                                        'status',
                                        event.currentTarget.value,
                                    )
                                }
                            >
                                <option value="draft">draft</option>
                                <option value="published">published</option>
                                <option value="archived">archived</option>
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="post-category">Category</Label>
                            <select
                                id="post-category"
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={form.category_id ?? ''}
                                onChange={(event) => {
                                    const { value } = event.currentTarget;

                                    setForm((currentForm) => ({
                                        ...currentForm,
                                        category_id: value
                                            ? Number(value)
                                            : null,
                                    }));
                                }}
                            >
                                <option value="">No category</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="post-images">Images</Label>
                            <input
                                key={fileInputKey}
                                id="post-images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImages}
                                className="text-sm"
                            />

                            {previews.length > 0 && (
                                <div className="grid grid-cols-6 gap-2">
                                    {previews.map((preview) => (
                                        <div
                                            key={preview.key}
                                            className="relative"
                                        >
                                            <img
                                                src={preview.url}
                                                alt={preview.name}
                                                className="aspect-square w-full rounded-md object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeImage(preview.key)
                                                }
                                                className="absolute -top-1 -right-1 rounded-full bg-foreground/80 px-1.5 text-xs leading-5 text-background"
                                                aria-label={`Remove ${preview.name}`}
                                            >
                                                x
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t pt-4">
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Submit'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
