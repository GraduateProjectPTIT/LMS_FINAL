"use client"

import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/redux/store'
import { getCartStart, getCartSuccess, getCartFailure } from '@/redux/cart/cartSlice'
import CheckoutInformation from './CheckoutInformation'
import CheckoutSummary from './CheckoutSummary'
import Loader from '../Loader'
import toast from 'react-hot-toast'
import { CartItem } from "@/type"

interface CartData {
    items: CartItem[];
    savedForLater: CartItem[];
    totalItems: number;
    totalPrice: number;
}

const CheckoutContent = () => {
    const { currentUser } = useSelector((state: RootState) => state.user);
    const { loading } = useSelector((state: RootState) => state.cart);
    const dispatch = useDispatch();

    const [cart, setCart] = useState<CartData>({
        items: [],
        savedForLater: [],
        totalItems: 0,
        totalPrice: 0
    });

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | 'stripe' | 'zalopay'>('paypal');

    const handleGetUserCart = async () => {
        try {
            dispatch(getCartStart());
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/cart`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            const data = await res.json();

            if (!res.ok) {
                dispatch(getCartFailure(data.message || "Cannot get user cart"));
                toast.error(data.message || "Cannot get user cart");
                return;
            }

            setCart(data.cart);
            dispatch(getCartSuccess(data.cart));
        } catch (error: any) {
            dispatch(getCartFailure(error.message || "Cannot get user cart"));
            toast.error(error.message || "Cannot get user cart");
        }
    };

    useEffect(() => {
        if (currentUser) {
            handleGetUserCart();
        }
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader />
            </div>
        );
    }

    if (cart.totalItems === 0) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                    Your cart is empty
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Add some courses to your cart to proceed with checkout
                </p>
                <button
                    onClick={() => window.history.back()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                    Continue Shopping
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="my-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    Checkout
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Complete your purchase to access your makeup tutorial courses
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <CheckoutInformation
                        cartItems={cart.items}
                        selectedPaymentMethod={selectedPaymentMethod}
                        onPaymentMethodChange={setSelectedPaymentMethod}
                    />
                </div>

                <div className="lg:col-span-1">
                    <CheckoutSummary
                        cart={cart}
                        selectedPaymentMethod={selectedPaymentMethod}
                    />
                </div>
            </div>
        </>
    )
}

export default CheckoutContent