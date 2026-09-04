'use client';

import { Head } from '@inertiajs/react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { analytics } from '@/routes';
import { DonutChart, BarChart, AreaChart } from '@mantine/charts'
import WorldMap from '../components/WorldMap'

type PostStatus = 'draft' | 'published' | 'archived';

export interface Post {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    status: PostStatus;
    created_at: string | null;
    likes: number;
    views: number;
}

export default function Analytics() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const mostLikedPosts = [...posts]
        .filter((post) => post.likes > 0)
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 5);

    const mostLikedData = mostLikedPosts.map((post, index) => ({
        name: post.title || post.slug,
        value: post.likes,
        color: ['blue.6', 'cyan.6', 'teal.6', 'green.6', 'lime.6'][index],
    }));

    const totalLikes = mostLikedPosts.reduce((total, post) => total + post.likes, 0);
    const mostViewedPosts = [...posts]
        .filter((post) => post.views > 0)
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

    const mostViewedData = mostViewedPosts.map((post, index) => ({
        name: post.title || post.slug,
        value: post.views,
        color: ['violet.6', 'grape.6', 'pink.6', 'red.6', 'orange.6'][index],
    }));

    const totalViews = mostViewedPosts.reduce((total, post) => total + post.views, 0);

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



    useEffect(() => {
        void loadPosts();
    }, []);
    
    return (
        <>
            <Head title="Analytics" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                <div className="flex justify-between">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl">Analytics</h1>
                        <p>See important data of your posts</p>
                    </div>
                </div>

                <div className="grid min-h-[320px] flex-1 grid-cols-1 gap-4 md:grid-cols-6">
                    <div className="min-h-64 rounded-xl border border-sidebar-border/70 p-5 md:col-span-3 dark:border-sidebar-border">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">Audience</h2>
                            <p className="text-sm text-muted-foreground">Posts with the most likes</p>
                            <p className='p-6'>
                                <WorldMap />
                            </p>
                        </div>
                    </div>

                                        <div className="min-h-64 rounded-xl border border-sidebar-border/70 p-5 md:col-span-3 dark:border-sidebar-border">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">Most viewed</h2>
                            <p className="text-sm text-muted-foreground">Posts with the most views</p>
                        </div>

                        {mostViewedData.length > 0 ? (
                            <DonutChart
                                mt="lg"
                                mx="auto"
                                size={220}
                                thickness={28}
                                paddingAngle={4}
                                data={mostViewedData}
                                withTooltip
                                tooltipDataSource="segment"
                                withLegend
                                chartLabel={`${totalViews} views`}
                            />
                        ) : (
                            <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                                {isLoading ? 'Loading views...' : 'No views yet.'}
                            </div>
                        )}
                    </div>

                    <div className="min-h-52 rounded-xl border border-sidebar-border/70 p-5 md:col-span-2 dark:border-sidebar-border">
                        <h2></h2>
                    </div>

                    <div className="min-h-52 rounded-xl border border-sidebar-border/70 p-5 md:col-span-2 dark:border-sidebar-border">
                        <h2></h2>
                    </div>

                    <div className="min-h-52 rounded-xl border border-sidebar-border/70 p-5 md:col-span-2 dark:border-sidebar-border">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">Most liked</h2>
                            <p className="text-sm text-muted-foreground">Posts with the most likes</p>
                        </div>

                        {mostLikedData.length > 0 ? (
                            <DonutChart
                                mt="lg"
                                mx="auto"
                                size={220}
                                thickness={28}
                                paddingAngle={4}
                                data={mostLikedData}
                                withTooltip
                                tooltipDataSource="segment"
                                withLegend
                                chartLabel={`${totalLikes} likes`}
                            />
                        ) : (
                            <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                                {isLoading ? 'Loading likes...' : 'No likes yet.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
Analytics.layout = {
    breadcrumbs: [
        {
            title: 'Analytics',
            href: analytics(),
        },
    ],
};

