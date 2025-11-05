"use client"

import { RootState } from '@/redux/store'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getCartSuccess, getCartStart, getCartFailure } from '@/redux/cart/cartSlice'
import CartSummary from './CartSummary'
import CartContent from './CartContent'
import RecommendedCourses from './RecommendedCourses'
import toast from 'react-hot-toast'
import { CartItem } from "@/type"

interface CartData {
    items: CartItem[];
    savedForLater: CartItem[];
    totalItems: number;
    totalPrice: number;
}

const Cart = () => {
    const { currentUser } = useSelector((state: RootState) => state.user);
    const dispatch = useDispatch();

    const [cart, setCart] = useState<CartData>({
        items: [],
        savedForLater: [],
        totalItems: 0,
        totalPrice: 0
    });

    const handleGetUserCart = useCallback(async () => {
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
    }, [dispatch]);

    const refreshCart = () => {
        handleGetUserCart();
    }

    useEffect(() => {
        if (currentUser) {
            handleGetUserCart();
        }
    }, [currentUser, handleGetUserCart]);

    return (
        <div className="theme-mode min-h-screen">
            <div className='container'>
                <div className="my-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Shopping Cart</h1>
                </div>

                <div className='flex flex-col gap-8'>
                    <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
                        <div className='col-span-1 lg:col-span-3'>
                            <CartContent
                                cartItems={cart.items}
                                savedForLaterItems={cart.savedForLater}
                                refreshCart={refreshCart}
                            />
                        </div>
                        <div className='col-span-1'>
                            <CartSummary
                                totalItems={cart.totalItems}
                                totalPrice={cart.totalPrice}
                                cartItems={cart.items}
                            />
                        </div>
                    </div>
                    <RecommendedCourses />
                </div>
            </div>
        </div>
    )
}

export default Cart