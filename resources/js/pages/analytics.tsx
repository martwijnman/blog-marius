'use client';

import { Head } from '@inertiajs/react';
import { AreaChart, BarChart, DonutChart, LineChart } from '@mantine/charts';
import type { ReactNode } from 'react';
import { analytics } from '@/routes';
import { useAppearance } from '@/hooks/use-appearance';
import WorldMap from '@/components/WorldMap';
import type { CountryMarker } from '@/components/WorldMap';

/**
 * Categorical palette, validated for colour-vision deficiency against both the
 * light (#ffffff) and dark (#0a0a0a) card surfaces. Slots are assigned in fixed
 * order and never cycled — a chart that would need a ninth colour folds its tail
 * into a single "Other" slice instead.
 */
const PALETTE = {
    light: [
        '#2a78d6',
        '#eb6834',
        '#1baf7a',
        '#eda100',
        '#e87ba4',
        '#008300',
        '#4a3aa7',
        '#e34948',
    ],
    dark: [
        '#3987e5',
        '#d95926',
        '#199e70',
        '#c98500',
        '#d55181',
        '#008300',
        '#9085e9',
        '#e66767',
    ],
} as const;

type PostStatus = 'draft' | 'published' | 'archived';

type Totals = {
    posts: number;
    published: number;
    drafts: number;
    archived: number;
    views: number;
    trackedViews: number;
    readers: number;
    likes: number;
    comments: number;
    avgReadSeconds: number;
    engagementRate: number;
    viewsDelta: number | null;
    likesDelta: number | null;
    commentsDelta: number | null;
};

type TimePoint = {
    date: string;
    label: string;
    views: number;
    likes: number;
    comments: number;
};

type TopPost = {
    id: number;
    title: string;
    slug: string;
    status: PostStatus;
    category: string | null;
    views: number;
    likes: number;
    comments: number;
    engagement: number;
};

type Country = CountryMarker & { code: string };

type NamedCount = { name: string; views: number };

type Stats = {
    window: number;
    totals: Totals;
    timeseries: TimePoint[];
    topPosts: TopPost[];
    countries: Country[];
    devices: NamedCount[];
    referrers: NamedCount[];
    categories: { name: string; posts: number; views: number; likes: number }[];
    statuses: { name: string; posts: number }[];
    readTime: { label: string; views: number }[];
    publishing: { label: string; posts: number }[];
    weekdays: { label: string; views: number }[];
    hours: { label: string; views: number }[];
};

type Props = {
    stats: Stats;
};

const numberFormat = new Intl.NumberFormat('nl-NL');

function formatNumber(value: number) {
    return numberFormat.format(value);
}

function formatDuration(seconds: number) {
    if (seconds <= 0) {
        return '—';
    }

    if (seconds < 60) {
        return `${seconds}s`;
    }

    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function hasData(rows: { views?: number; posts?: number }[]) {
    return rows.some((row) => (row.views ?? row.posts ?? 0) > 0);
}

function Card({
    title,
    description,
    className = '',
    children,
}: {
    title: string;
    description: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            className={`flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-5 dark:border-sidebar-border ${className}`}
        >
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="mt-4 flex-1">{children}</div>
        </section>
    );
}

function Empty({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-sidebar-border/70 px-4 text-center text-sm text-muted-foreground">
            {children}
        </div>
    );
}

function Delta({ value }: { value: number | null }) {
    if (value === null) {
        return (
            <span className="text-xs text-muted-foreground">
                no earlier data
            </span>
        );
    }

    const isUp = value >= 0;

    return (
        <span
            className={`text-xs font-semibold ${isUp ? 'text-green-500' : 'text-red-400'}`}
        >
            {isUp ? '▲' : '▼'} {Math.abs(value)}% vs previous period
        </span>
    );
}

function Tile({
    label,
    value,
    hint,
    delta,
}: {
    label: string;
    value: string;
    hint?: string;
    delta?: number | null;
}) {
    return (
        <div className="rounded-xl border border-sidebar-border/70 bg-background p-5 dark:border-sidebar-border">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            <div className="mt-2">
                {delta !== undefined ? (
                    <Delta value={delta} />
                ) : (
                    <span className="text-xs text-muted-foreground">
                        {hint}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function Analytics({ stats }: Props) {
    const { resolvedAppearance } = useAppearance();
    const colors = PALETTE[resolvedAppearance];

    const { totals } = stats;

    const trackingGap = totals.views - totals.trackedViews;

    const donut = (rows: NamedCount[]) =>
        rows.map((row, index) => ({
            name: row.name,
            value: row.views,
            color: colors[index % colors.length],
        }));

    return (
        <>
            <Head title="Analytics" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl">Analytics</h1>
                        <p className="text-muted-foreground">
                            How your posts are read — trends cover the last{' '}
                            {stats.window} days.
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {formatNumber(totals.posts)} posts ·{' '}
                        {formatNumber(totals.published)} published
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                    <Tile
                        label="Views"
                        value={formatNumber(totals.views)}
                        delta={totals.viewsDelta}
                    />
                    <Tile
                        label="Unique readers"
                        value={formatNumber(totals.readers)}
                        hint="one visitor per day"
                    />
                    <Tile
                        label="Likes"
                        value={formatNumber(totals.likes)}
                        delta={totals.likesDelta}
                    />
                    <Tile
                        label="Comments"
                        value={formatNumber(totals.comments)}
                        delta={totals.commentsDelta}
                    />
                    <Tile
                        label="Avg. read time"
                        value={formatDuration(totals.avgReadSeconds)}
                        hint="measured on leave"
                    />
                    <Tile
                        label="Engagement"
                        value={`${totals.engagementRate}%`}
                        hint="likes + comments per view"
                    />
                </div>

                <Card
                    title="Traffic over time"
                    description={`Views, likes and comments per day over the last ${stats.window} days`}
                >
                    {hasData(stats.timeseries) ? (
                        <LineChart
                            h={280}
                            data={stats.timeseries}
                            dataKey="label"
                            curveType="monotone"
                            strokeWidth={2}
                            withDots={false}
                            withLegend
                            tickLine="x"
                            gridAxis="y"
                            series={[
                                {
                                    name: 'views',
                                    label: 'Views',
                                    color: colors[0],
                                },
                                {
                                    name: 'likes',
                                    label: 'Likes',
                                    color: colors[1],
                                },
                                {
                                    name: 'comments',
                                    label: 'Comments',
                                    color: colors[2],
                                },
                            ]}
                        />
                    ) : (
                        <Empty>
                            No activity recorded yet in this period. Views are
                            registered when someone opens a post.
                        </Empty>
                    )}

                    {trackingGap > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            {formatNumber(trackingGap)} older views are counted
                            in the totals but have no per-day detail — they
                            predate visit tracking.
                        </p>
                    )}
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card
                        title="Top posts"
                        description="Most viewed posts, all time"
                    >
                        {hasData(stats.topPosts) ? (
                            <BarChart
                                h={300}
                                data={stats.topPosts.slice(0, 8)}
                                dataKey="title"
                                orientation="vertical"
                                gridAxis="x"
                                withBarValueLabel
                                yAxisProps={{ width: 140 }}
                                barProps={{ radius: 4 }}
                                series={[
                                    {
                                        name: 'views',
                                        label: 'Views',
                                        color: colors[0],
                                    },
                                ]}
                            />
                        ) : (
                            <Empty>No views recorded yet.</Empty>
                        )}
                    </Card>

                    <Card
                        title="Traffic sources"
                        description="Where readers arrived from"
                    >
                        {stats.referrers.length > 0 ? (
                            <BarChart
                                h={300}
                                data={stats.referrers}
                                dataKey="name"
                                orientation="vertical"
                                gridAxis="x"
                                withBarValueLabel
                                yAxisProps={{ width: 140 }}
                                barProps={{ radius: 4 }}
                                series={[
                                    {
                                        name: 'views',
                                        label: 'Visits',
                                        color: colors[1],
                                    },
                                ]}
                            />
                        ) : (
                            <Empty>
                                No referrer data yet. Direct visits and links
                                show up here once posts are opened.
                            </Empty>
                        )}
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card
                        title="Devices"
                        description="What readers browse on"
                    >
                        {stats.devices.length > 0 ? (
                            <DonutChart
                                mx="auto"
                                size={200}
                                thickness={26}
                                paddingAngle={2}
                                data={donut(stats.devices)}
                                withTooltip
                                tooltipDataSource="segment"
                                withLabels
                                withLegend
                                chartLabel={`${formatNumber(totals.trackedViews)} visits`}
                            />
                        ) : (
                            <Empty>No device data yet.</Empty>
                        )}
                    </Card>

                    <Card
                        title="Reading depth"
                        description="How long readers stay on a post"
                    >
                        {hasData(stats.readTime) ? (
                            <BarChart
                                h={220}
                                data={stats.readTime}
                                dataKey="label"
                                gridAxis="y"
                                withBarValueLabel
                                barProps={{ radius: 4 }}
                                series={[
                                    {
                                        name: 'views',
                                        label: 'Visits',
                                        color: colors[2],
                                    },
                                ]}
                            />
                        ) : (
                            <Empty>
                                Read time is reported when a reader leaves a
                                post. Nothing measured yet.
                            </Empty>
                        )}
                    </Card>

                    <Card
                        title="Library"
                        description="Posts by status"
                    >
                        {totals.posts > 0 ? (
                            <DonutChart
                                mx="auto"
                                size={200}
                                thickness={26}
                                paddingAngle={2}
                                data={stats.statuses.map((row, index) => ({
                                    name: row.name,
                                    value: row.posts,
                                    color: colors[index],
                                }))}
                                withTooltip
                                tooltipDataSource="segment"
                                withLabels
                                withLegend
                                chartLabel={`${formatNumber(totals.posts)} posts`}
                            />
                        ) : (
                            <Empty>No posts yet.</Empty>
                        )}
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card
                        title="Audience"
                        description="Where in the world your readers are"
                    >
                        <WorldMap markers={stats.countries} />

                        {stats.countries.length > 0 && (
                            <ul className="mt-4 flex flex-col gap-2">
                                {stats.countries.slice(0, 6).map((country) => (
                                    <li
                                        key={country.code}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span>{country.name}</span>
                                        <span className="font-semibold tabular-nums">
                                            {formatNumber(country.views)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <div className="flex flex-col gap-4">
                        <Card
                            title="Best day to publish"
                            description="Visits by day of the week"
                        >
                            {hasData(stats.weekdays) ? (
                                <BarChart
                                    h={180}
                                    data={stats.weekdays}
                                    dataKey="label"
                                    gridAxis="y"
                                    withBarValueLabel
                                    barProps={{ radius: 4 }}
                                    series={[
                                        {
                                            name: 'views',
                                            label: 'Visits',
                                            color: colors[3],
                                        },
                                    ]}
                                />
                            ) : (
                                <Empty>No visits recorded yet.</Empty>
                            )}
                        </Card>

                        <Card
                            title="Reading hours"
                            description="Visits by hour of the day"
                        >
                            {hasData(stats.hours) ? (
                                <AreaChart
                                    h={180}
                                    data={stats.hours}
                                    dataKey="label"
                                    curveType="monotone"
                                    strokeWidth={2}
                                    withDots={false}
                                    gridAxis="y"
                                    series={[
                                        {
                                            name: 'views',
                                            label: 'Visits',
                                            color: colors[4],
                                        },
                                    ]}
                                />
                            ) : (
                                <Empty>No visits recorded yet.</Empty>
                            )}
                        </Card>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card
                        title="Categories"
                        description="Views per category"
                    >
                        {hasData(stats.categories) ? (
                            <BarChart
                                h={240}
                                data={stats.categories}
                                dataKey="name"
                                orientation="vertical"
                                gridAxis="x"
                                withBarValueLabel
                                yAxisProps={{ width: 120 }}
                                barProps={{ radius: 4 }}
                                series={[
                                    {
                                        name: 'views',
                                        label: 'Views',
                                        color: colors[6],
                                    },
                                ]}
                            />
                        ) : (
                            <Empty>No categorised views yet.</Empty>
                        )}
                    </Card>

                    <Card
                        title="Publishing cadence"
                        description="Posts created per month, last 12 months"
                    >
                        {hasData(stats.publishing) ? (
                            <BarChart
                                h={240}
                                data={stats.publishing}
                                dataKey="label"
                                gridAxis="y"
                                withBarValueLabel
                                barProps={{ radius: 4 }}
                                series={[
                                    {
                                        name: 'posts',
                                        label: 'Posts',
                                        color: colors[5],
                                    },
                                ]}
                            />
                        ) : (
                            <Empty>No posts created in this period.</Empty>
                        )}
                    </Card>
                </div>

                {/* The table is also the accessible fallback for every chart
                    above: the same numbers, readable without colour. */}
                <Card
                    title="All posts"
                    description="Every post with its views, likes, comments and engagement rate"
                >
                    {stats.topPosts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-sidebar-border/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">
                                            Post
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Category
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Status
                                        </th>
                                        <th className="py-2 pr-4 text-right font-medium">
                                            Views
                                        </th>
                                        <th className="py-2 pr-4 text-right font-medium">
                                            Likes
                                        </th>
                                        <th className="py-2 pr-4 text-right font-medium">
                                            Comments
                                        </th>
                                        <th className="py-2 text-right font-medium">
                                            Engagement
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.topPosts.map((post) => (
                                        <tr
                                            key={post.id}
                                            className="border-b border-sidebar-border/40 last:border-0"
                                        >
                                            <td className="max-w-56 truncate py-2 pr-4">
                                                {post.title}
                                            </td>
                                            <td className="py-2 pr-4 text-muted-foreground">
                                                {post.category ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-muted-foreground">
                                                {post.status}
                                            </td>
                                            <td className="py-2 pr-4 text-right tabular-nums">
                                                {formatNumber(post.views)}
                                            </td>
                                            <td className="py-2 pr-4 text-right tabular-nums">
                                                {formatNumber(post.likes)}
                                            </td>
                                            <td className="py-2 pr-4 text-right tabular-nums">
                                                {formatNumber(post.comments)}
                                            </td>
                                            <td className="py-2 text-right tabular-nums">
                                                {post.engagement}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <Empty>No posts yet.</Empty>
                    )}
                </Card>
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
