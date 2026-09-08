export interface PostImage {
    id: number;
    post_id: number;
    path: string;
}

/**
 * Een tweede keer bestanden kiezen verving de eerste selectie, waardoor je
 * alleen meerdere foto's kon toevoegen als je ze in een keer selecteerde.
 * Nieuwe bestanden worden nu toegevoegd, met dubbele eruit.
 */
/**
 * Sleutel van een gekozen bestand. Twee foto's die vlak na elkaar met de
 * camera zijn gemaakt kunnen dezelfde naam en lastModified hebben, dus de
 * grootte hoort erbij - anders vallen ze in de preview op dezelfde React-key
 * en verwijdert het kruisje de verkeerde foto.
 */
export const fileKey = (file: File) =>
    `${file.name}-${file.size}-${file.lastModified}`;

export function mergeFiles(current: File[], added: FileList | File[]): File[] {
    const identity = fileKey;

    const seen = new Set(current.map(identity));
    const merged = [...current];

    for (const file of Array.from(added)) {
        if (!seen.has(identity(file))) {
            seen.add(identity(file));
            merged.push(file);
        }
    }

    return merged;
}

export const getImageSrc = (path: string) => {
    if (path.startsWith('http') || path.startsWith('/')) {
        return path;
    }

    return `/media/${path}`;
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
