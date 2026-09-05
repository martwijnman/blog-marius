export type CountryMarker = {
    name: string;
    views: number;
    /** Position on the map box, in percentages. Null for unmapped countries. */
    x: number | null;
    y: number | null;
};

type Props = {
    markers?: CountryMarker[];
};

export default function WorldMap({ markers = [] }: Props) {
    const total = markers.reduce((sum, marker) => sum + marker.views, 0);
    const plotted = markers.filter(
        (marker): marker is CountryMarker & { x: number; y: number } =>
            marker.x !== null && marker.y !== null,
    );

    return (
        <div className="w-full overflow-hidden border border-neutral-200 bg-white text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                        Audience map
                    </p>
                    <p className="mt-1 font-serif text-2xl">{total} readers</p>
                </div>
                <div className="h-10 w-10 border border-neutral-200 dark:border-neutral-800" />
            </div>

            <div className="relative aspect-[16/9] w-full bg-neutral-50 dark:bg-neutral-900">
                <svg
                    viewBox="0 0 1000 560"
                    role="img"
                    aria-label="World audience map"
                    className="h-full w-full"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <rect width="1000" height="560" className="fill-neutral-50 dark:fill-neutral-900" />
                    <path
                        d="M146 195 104 169 119 128 184 112 246 134 291 164 273 209 215 224Z"
                        className="fill-neutral-300 dark:fill-neutral-700"
                    />
                    <path
                        d="M264 247 325 253 352 301 329 371 287 443 237 386 229 316Z"
                        className="fill-neutral-300 dark:fill-neutral-700"
                    />
                    <path
                        d="M456 154 527 122 620 142 660 198 606 242 523 230 448 209Z"
                        className="fill-neutral-300 dark:fill-neutral-700"
                    />
                    <path
                        d="M519 246 586 252 637 305 610 393 548 421 502 352Z"
                        className="fill-neutral-300 dark:fill-neutral-700"
                    />
                    <path
                        d="M651 165 762 139 874 179 899 247 803 282 702 246Z"
                        className="fill-neutral-300 dark:fill-neutral-700"
                    />
                    <path
                        d="M733 289 806 308 839 367 792 417 717 380Z"
                        className="fill-neutral-300 dark:fill-neutral-700"
                    />
                    <path
                        d="M815 416 884 432 908 483 850 500 789 468Z"
                        className="fill-neutral-300 dark:fill-neutral-700"
                    />
                    <path
                        d="M90 466 C257 429 388 430 496 459 C636 497 765 504 928 461"
                        className="fill-none stroke-neutral-300 dark:stroke-neutral-700"
                        strokeWidth="2"
                        strokeDasharray="6 10"
                    />
                </svg>

                {plotted.map((marker) => (
                    <div
                        key={marker.name}
                        title={`${marker.name}: ${marker.views}`}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                    >
                        <div className="relative flex items-center justify-center">
                            <span className="absolute h-8 w-8 animate-ping border border-neutral-950 opacity-20 dark:border-neutral-100" />
                            <span className="relative h-3 w-3 bg-neutral-950 dark:bg-neutral-100" />
                        </div>
                    </div>
                ))}
            </div>

            {markers.length > 0 ? (
                <div className="grid grid-cols-2 border-t border-neutral-200 dark:border-neutral-800 sm:grid-cols-4">
                    {markers.slice(0, 4).map((marker) => (
                        <div
                            key={marker.name}
                            className="border-b border-r border-neutral-200 p-3 last:border-r-0 dark:border-neutral-800 sm:border-b-0"
                        >
                            <p className="truncate text-sm font-medium">{marker.name}</p>
                            <p className="mt-1 text-xs text-neutral-500">{marker.views} readers</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="border-t border-neutral-200 p-4 text-xs text-neutral-500 dark:border-neutral-800">
                    No location data yet. Countries are read from the edge proxy
                    (Cloudflare or Vercel), so they stay empty in local development.
                </p>
            )}
        </div>
    );
}
