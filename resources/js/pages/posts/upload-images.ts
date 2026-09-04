export interface PostImage {
    id: number;
    post_id: number;
    path: string;
}

export const getImageSrc = (path: string) => {
    if (path.startsWith('http') || path.startsWith('/')) {
        return path;
    }

    return `/storage/${path}`;
};

export async function fetchImages(postId: number): Promise<PostImage[]> {
    const response = await fetch(`/api/images/${postId}`, {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Images can not be loaded');
    }

    return (await response.json()) as PostImage[];
}

/** All images in one request, grouped by post id by the caller. */
export async function fetchAllImages(): Promise<PostImage[]> {
    const response = await fetch('/api/images', {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Images can not be loaded');
    }

    return (await response.json()) as PostImage[];
}

export async function uploadImages(
    postId: number,
    files: File[],
): Promise<PostImage[]> {
    const formData = new FormData();
    formData.append('post_id', String(postId));
    files.forEach((file) => formData.append('images[]', file));

    const response = await fetch('/api/images', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Images can not be uploaded');
    }

    return (await response.json()) as PostImage[];
}

export async function deleteImage(imageId: number): Promise<void> {
    const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Image can not be deleted');
    }
}
