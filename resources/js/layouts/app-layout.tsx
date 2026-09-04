import ErrorBoundary from '@/components/error-boundary';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <MantineProvider forceColorScheme="dark">
            <Notifications />
            <AppLayoutTemplate breadcrumbs={breadcrumbs}>
                <ErrorBoundary>{children}</ErrorBoundary>
            </AppLayoutTemplate>
        </MantineProvider>
    );
}
