import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import '@mantine/core/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import '@mantine/notifications/styles.css';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../query";

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <MantineProvider forceColorScheme="dark">
            <QueryClientProvider client={queryClient}>
                <Notifications position="top-right" zIndex={1000} />
                <AuthLayoutTemplate title={title} description={description}>
                    {children}
                </AuthLayoutTemplate>
            </QueryClientProvider>
        </MantineProvider>
    );
}
