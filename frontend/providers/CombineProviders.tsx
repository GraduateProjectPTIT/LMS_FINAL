'use client'

import React from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import ReduxProvider from '@/providers/ReduxProvider'
import TokenRefresher from '@/providers/TokenRefresher'
import ClientSessionProvider from '@/providers/ClientSessionProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ClientSessionProvider>
            <ReduxProvider>
                <ThemeProvider>
                    <TokenRefresher />
                    {children}
                </ThemeProvider>
            </ReduxProvider>
        </ClientSessionProvider>
    )
}