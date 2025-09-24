"use client"

import React from 'react'
import CartItems from './CartItems'
import SavedItems from './SavedItems'
import { CartItem } from "@/type"

interface CartContentProps {
    cartItems: CartItem[];
    savedForLaterItems: CartItem[];
    refreshCart: () => void;
}

const CartContent = ({ cartItems, savedForLaterItems, refreshCart }: CartContentProps) => {

    return (
        <div className="flex flex-col gap-6">
            {/* Cart Items Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {cartItems.length} Course{cartItems.length !== 1 ? 's' : ''} in Cart
                    </h2>
                </div>
                <div className="p-6">
                    {cartItems.length > 0 ? (
                        <CartItems
                            items={cartItems}
                            refreshCart={refreshCart}
                        />
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">
                                Your cart is empty
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">
                                Keep shopping to find a course!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Saved for Later Section */}
            {savedForLaterItems.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                            Saved for Later ({savedForLaterItems.length})
                        </h2>
                    </div>
                    <div className="p-6">
                        <SavedItems
                            items={savedForLaterItems}
                            refreshCart={refreshCart}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default CartContent