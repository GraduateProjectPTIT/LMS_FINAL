"use client"

import React from 'react'
import Link from 'next/link';
import { X } from 'lucide-react';

interface SidebarMenuPanelProps {
    closeMainMenu: () => void;
    isMobileMenuOpen: boolean
}

const SidebarMenuPanel = ({ closeMainMenu, isMobileMenuOpen }: SidebarMenuPanelProps) => {

    // Menu items for the mobile menu
    const menuItems = [
        { name: 'Home', url: '/' },
        { name: 'Policy', url: '/policy' },
        { name: 'About Us', url: '/about' },
    ];

    return (
        <div className={`fixed top-0 left-0 w-[50%] max-w-[300px] h-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 p-3 z-50 shadow-lg transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className='text-xl font-bold'>Menu</h2>
                <X onClick={closeMainMenu} className='w-6 h-6 hover:text-red-500 cursor-pointer' />
            </div>

            <div className='flex flex-col gap-4'>
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.url}
                        className='text-[16px] p-2 rounded hover:bg-blue-500 dark:hover:bg-[#161b22] hover:text-white hover:font-semibold transition-colors duration-200'
                        onClick={closeMainMenu}
                    >
                        {item.name}
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default SidebarMenuPanel