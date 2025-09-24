"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Tag, CreditCard, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { CartItem } from "@/type"
import ClearCartModal from './ClearCartModal'

interface CartSummaryProps {
    totalItems: number;
    totalPrice: number;
    cartItems: CartItem[];
}

const CartSummary = ({ totalItems, totalPrice, cartItems }: CartSummaryProps) => {
    const router = useRouter();
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [loadingClear, setLoadingClear] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);

    // Calculate original price (estimated prices)
    const originalPrice = cartItems.reduce((total, item) => {
        return total + (item.estimatedPrice || item.price);
    }, 0);

    const discount = originalPrice - totalPrice;
    const finalPrice = totalPrice;

    const handleCheckout = async () => {
        if (totalItems === 0) {
            toast.error("Your cart is empty");
            return;
        }

        setLoadingCheckout(true);
        try {
            router.push('/checkout');
        } catch (error: any) {
            toast.error(error.message || "Failed to proceed to checkout");
        } finally {
            setLoadingCheckout(false);
        }
    };

    const handleClearCartClick = () => {
        if (totalItems === 0) {
            toast.error("Your cart is already empty");
            return;
        }
        setShowClearModal(true);
    };

    const handleClearCartConfirm = async () => {
        setLoadingClear(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/cart/clear`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to clear cart");
                return;
            }

            toast.success("Cart cleared successfully");
            setShowClearModal(false);
            // Refresh the page or trigger parent update
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || "Failed to clear cart");
        } finally {
            setLoadingClear(false);
        }
    };

    const handleModalClose = () => {
        if (!loadingClear) {
            setShowClearModal(false);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    Order Summary
                </h2>

                {/* Order Details */}
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Items ({totalItems})</span>
                        <span>${originalPrice.toFixed(2)}</span>
                    </div>

                    {discount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Discount</span>
                            <span>-${discount.toFixed(2)}</span>
                        </div>
                    )}

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div className="flex justify-between text-lg font-semibold text-gray-800 dark:text-white">
                        <span>Total</span>
                        <span>${finalPrice.toFixed(2)}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleCheckout}
                        disabled={loadingCheckout || totalItems === 0}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white transition-all transform hover:scale-105 ${totalItems === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : loadingCheckout
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                            }`}
                    >
                        <CreditCard size={18} />
                        {loadingCheckout ? 'Processing...' : 'Checkout'}
                    </button>

                    {totalItems > 0 && (
                        <button
                            onClick={handleClearCartClick}
                            disabled={loadingClear}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 size={16} />
                            Clear Cart
                        </button>
                    )}
                </div>
            </div>

            {/* Clear Cart Modal */}
            <ClearCartModal
                isOpen={showClearModal}
                onClose={handleModalClose}
                onConfirm={handleClearCartConfirm}
                loading={loadingClear}
                totalItems={totalItems}
            />
        </>
    )
}

export default CartSummary