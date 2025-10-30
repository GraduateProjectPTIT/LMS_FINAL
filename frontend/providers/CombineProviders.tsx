'use client'

import React from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import ReduxProvider from '@/providers/ReduxProvider'
import TokenRefresher from '@/providers/TokenRefresher'
import ClientSessionProvider from '@/providers/ClientSessionProvider'
import NotificationProvider from './NotificationProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ClientSessionProvider>
            <ReduxProvider>
                <NotificationProvider>
                    <ThemeProvider>
                        <TokenRefresher />
                        {children}
                    </ThemeProvider>
                </NotificationProvider>
            </ReduxProvider>
        </ClientSessionProvider>
    )
}