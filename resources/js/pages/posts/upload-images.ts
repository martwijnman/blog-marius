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
        throw new Error(await uploadErrorMessage(response));
    }

    return (await response.json()) as PostImage[];
}

/**
 * De server weet precies waarom een upload faalt - te groot, verkeerd type,
 * niet schrijfbaar. Die reden doorgeven in plaats van een generieke melding,
 * anders is er vanaf de voorkant niets te zien behalve "het lukt niet".
 */
async function uploadErrorMessage(response: Response): Promise<string> {
    try {
        const body = (await response.json()) as {
            message?: string;
            errors?: Record<string, string[]>;
        };

        const firstError = Object.values(body.errors ?? {})[0]?.[0];

        if (firstError) {
            return firstError;
        }

        if (body.message) {
            return body.message;
        }
    } catch {
        // Geen JSON terug - dan alleen de status.
    }

    if (response.status === 413) {
        return 'The image is too large for the server.';
    }

    return `Images can not be uploaded (HTTP ${response.status})`;
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
