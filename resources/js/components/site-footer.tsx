import { Link } from '@inertiajs/react';
import { navLinks } from '@/components/site-header';

export default function SiteFooter() {
    return (
        <footer className="flex flex-col gap-10 border-t border-neutral-800 px-6 py-10 text-sm text-neutral-400 md:flex-row md:items-start md:justify-between md:px-10">
            <h2 className="font-serif text-2xl text-neutral-300 transition-colors">
                Journal.
            </h2>

            <div className="grid w-full max-w-xl grid-cols-1 gap-8 sm:grid-cols-3">
                <div>
                    <h2 className="mb-3 text-xs font-medium tracking-[0.25em] text-neutral-500 uppercase">
                        Navigation
                    </h2>
                    <div className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.target}
                                href={
                                    link.target.startsWith('#')
                                        ? `/${link.target}`
                                        : link.target
                                }
                                className="transition hover:text-neutral-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="mb-3 text-xs font-medium tracking-[0.25em] text-neutral-500 uppercase">
                        Posts
                    </h2>
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/#posts"
                            className="transition hover:text-neutral-200"
                        >
                            Newest posts
                        </Link>
                        <Link
                            href="/#popular"
                            className="transition hover:text-neutral-200"
                        >
                            Most viewed
                        </Link>
                        <Link
                            href="/archive"
                            className="transition hover:text-neutral-200"
                        >
                            All posts
                        </Link>
                    </div>
                </div>
            </div>

            <div className="shrink-0 text-left md:text-right">
                <h3 className="mb-3 text-xs font-medium tracking-[0.25em] text-neutral-500 uppercase">
                    2026 Journal
                </h3>
                <p className="text-xs font-medium tracking-[0.25em] text-neutral-500 uppercase">
                    All rights
                </p>
            </div>
        </footer>
    );
}
