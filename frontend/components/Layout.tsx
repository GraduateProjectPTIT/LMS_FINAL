'use client'
import React from 'react'
import Header from '@/sections/Header'
import Footer from '@/sections/Footer'

const Layout = ({ children }: { children: React.ReactNode }) => {

    return (
        <>
            <Header />
            <main>{children}</main>
            <Footer />
        </>
    )
}

export default Layout