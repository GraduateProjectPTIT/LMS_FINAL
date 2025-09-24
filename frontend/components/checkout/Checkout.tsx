"use client"

import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import CheckoutHeader from './CheckoutHeader'
import CheckoutContent from './CheckoutContent'

const Checkout = () => {
    const { currentUser } = useSelector((state: RootState) => state.user); // double-check mặc dù đã có Protected ở page rồi
    const { loading } = useSelector((state: RootState) => state.cart);

    return (
        <div className="theme-mode min-h-screen bg-gray-50 dark:bg-gray-900">
            <CheckoutHeader />

            <div className="container mx-auto px-4 py-8">
                {currentUser ? (
                    <CheckoutContent />
                ) : (
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                            Please login to continue
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            You need to be logged in to complete your purchase
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Checkout