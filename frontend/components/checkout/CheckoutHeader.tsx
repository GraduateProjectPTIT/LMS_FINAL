"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import Image from 'next/image'
import Logo from "@/assets/logo-lms.png"

const CheckoutHeader = () => {
    const router = useRouter();

    const handleCancel = () => {
        router.push('/cart');
    };

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Image
                            onClick={() => router.push("/")}
                            src={Logo}
                            alt="LMS Logo"
                            width={120}
                            height={40}
                            className="h-10 w-auto hover:cursor-pointer"
                            priority
                        />
                    </div>

                    {/* Cancel Button */}
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                        <span className="hidden sm:inline">Cancel</span>
                    </button>
                </div>
            </div>
        </header>
    )
}

export default CheckoutHeader