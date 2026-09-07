import { useAppearance } from '@/hooks/use-appearance';
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../query';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    const { resolvedAppearance } = useAppearance();

    return (
        <MantineProvider forceColorScheme={resolvedAppearance}>
            <QueryClientProvider client={queryClient}>
                <Notifications position="top-right" zIndex={1000} />
                <AuthLayoutTemplate title={title} description={description}>
                    {children}
                </AuthLayoutTemplate>
            </QueryClientProvider>
        </MantineProvider>
    );
}
