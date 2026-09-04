import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { dashboard, login, register } from '@/routes';
import { cn } from '@/lib/utils';

type NavLink = {
    label: string;
    /** Section id on the home page, or an absolute path for a real page. */
    target: string;
};

export const navLinks: NavLink[] = [
    { label: 'Home', target: '#top' },
    { label: 'Latest', target: '#posts' },
    { label: 'Popular', target: '#popular' },
    { label: 'Archive', target: '/archive' },
    { label: 'About', target: '#about' },
];

function isSectionLink(link: NavLink) {
    return link.target.startsWith('#');
}

export function scrollToSection(id: string) {
    const section = document.getElementById(id);

    if (!section) {
        return false;
    }

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (window.history.replaceState) {
        window.history.replaceState(null, '', `#${id}`);
    }

    return true;
}

type NavItemProps = {
    link: NavLink;
    className?: string;
    onNavigate?: () => void;
};

function NavItem({ link, className, onNavigate }: NavItemProps) {
    const { url } = usePage();
    const isHome = url === '/' || url.startsWith('/#') || url.startsWith('/?');

    if (!isSectionLink(link)) {
        return (
            <Link href={link.target} className={className} onClick={onNavigate}>
                {link.label}
            </Link>
        );
    }

    const sectionId = link.target.slice(1);

    // On the home page the sections exist, so scroll to them. Anywhere else we
    // send the visitor back home with the hash, and the home page scrolls on load.
    if (!isHome) {
        return (
            <Link
                href={`/${link.target}`}
                className={className}
                onClick={onNavigate}
            >
                {link.label}
            </Link>
        );
    }

    return (
        <a
            href={link.target}
            className={className}
            onClick={(event) => {
                if (scrollToSection(sectionId)) {
                    event.preventDefault();
                }

                onNavigate?.();
            }}
        >
            {link.label}
        </a>
    );
}

export default function SiteHeader() {
    const { auth } = usePage().props;
    const user = auth.user;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const linkClasses =
        'transition hover:text-neutral-950 dark:hover:text-neutral-100';

    return (
        <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-5 px-6 py-5">
                <Link
                    href="/"
                    className="font-serif text-xl text-neutral-950 transition-colors dark:text-neutral-100"
                >
                    Journal.
                </Link>

                <div className="hidden items-center gap-8 text-xs font-semibold tracking-[0.22em] text-neutral-500 uppercase md:flex">
                    {navLinks.map((link) => (
                        <NavItem
                            key={link.target}
                            link={link}
                            className={linkClasses}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2 text-sm">
                    {user ? (
                        <Link
                            href={dashboard()}
                            className="rounded-md border border-border px-3 py-2 font-medium transition hover:bg-accent"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="rounded-md px-3 py-2 font-medium transition hover:bg-accent"
                            >
                                Log in
                            </Link>
                            <Link
                                href={register()}
                                className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground transition hover:opacity-90"
                            >
                                Register
                            </Link>
                        </>
                    )}

                    <button
                        type="button"
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen((open) => !open)}
                        className="rounded-md p-2 transition hover:bg-accent md:hidden"
                    >
                        {isMenuOpen ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </button>
                </div>
            </nav>

            <div
                className={cn(
                    'border-t border-border/70 md:hidden',
                    isMenuOpen ? 'block' : 'hidden',
                )}
            >
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 text-xs font-semibold tracking-[0.22em] text-neutral-500 uppercase">
                    {navLinks.map((link) => (
                        <NavItem
                            key={link.target}
                            link={link}
                            className={linkClasses}
                            onNavigate={() => setIsMenuOpen(false)}
                        />
                    ))}
                </div>
            </div>
        </header>
    );
}
