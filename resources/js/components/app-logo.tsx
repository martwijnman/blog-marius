import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2 font-semibold">
            <AppLogoIcon className="h-8 w-8 fill-current text-black dark:text-white" />
            <span>Blog Marius</span>
        </div>
    );
}