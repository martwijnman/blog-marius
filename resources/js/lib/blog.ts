export type PostStatus = 'draft' | 'published' | 'archived';

export type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    posts_count?: number;
    published_posts_count?: number;
};

export type Post = {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    status: PostStatus;
    created_at: string | null;
    published_at?: string | null;
    views?: number;
    likes?: number;
    category_id?: number | null;
    category?: Category | null;
};

export function getPostDate(post: Post) {
    return post.published_at ?? post.created_at;
}

export function formatDate(date: string | null | undefined) {
    if (!date) {
        return 'No date';
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}

export function countWords(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getReadTime(post: Post) {
    const minutes = Math.ceil(countWords(post.content) / 200);

    return `${Math.max(1, minutes)} min read`;
}

export function getPreview(post: Post) {
    return post.excerpt ?? post.content;
}

export function getPostYear(post: Post) {
    const date = getPostDate(post);

    return date ? new Date(date).getFullYear() : null;
}

export function sortByNewest(posts: Post[]) {
    return [...posts].sort((firstPost, secondPost) => {
        const firstDate = new Date(getPostDate(firstPost) ?? 0).getTime();
        const secondDate = new Date(getPostDate(secondPost) ?? 0).getTime();

        return secondDate - firstDate;
    });
}

export async function fetchPublishedPosts() {
    const response = await fetch('/api/posts', {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        return [];
    }

    const posts = (await response.json()) as Post[];

    return sortByNewest(posts.filter((post) => post.status === 'published'));
}

export async function fetchCategories() {
    const response = await fetch('/api/categories', {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        return [];
    }

    return (await response.json()) as Category[];
}
