import type { Category } from '@/lib/blog';
import { cn } from '@/lib/utils';

type Props = {
    category?: Category | null;
    className?: string;
};

export default function CategoryBadge({ category, className }: Props) {
    if (!category) {
        return null;
    }

    return (
        <span
            className={cn(
                'inline-flex items-center border border-neutral-300 px-2 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase dark:border-neutral-700',
                className,
            )}
        >
            {category.name}
        </span>
    );
}
