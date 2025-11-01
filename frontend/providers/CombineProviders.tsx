'use client'

import React from 'react';
import { ThemeProvider } from '@/providers/ThemeProvider';
import ReduxProvider from '@/providers/ReduxProvider';
import TokenRefresher from '@/providers/TokenRefresher';
import ClientSessionProvider from '@/providers/ClientSessionProvider';
import NotificationProvider from './NotificationProvider';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

function InnerProviders({ children }: { children: React.ReactNode }) {
    const { isLoggedIn } = useSelector((s: RootState) => s.user)

    return (
        <>
            {/* Chỉ mount NotificationProvider khi đã login */}
            {isLoggedIn ? (
                <NotificationProvider>
                    <ThemeProvider>
                        <TokenRefresher />
                        {children}
                    </ThemeProvider>
                </NotificationProvider>
            ) : (
                <ThemeProvider>
                    <TokenRefresher />
                    {children}
                </ThemeProvider>
            )}
        </>
    )
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ClientSessionProvider>
            <ReduxProvider>
                <InnerProviders>{children}</InnerProviders>
            </ReduxProvider>
        </ClientSessionProvider>
    )
}