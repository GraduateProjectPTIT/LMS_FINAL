"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaCcPaypal, FaCcStripe } from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import toast from 'react-hot-toast'
import { CartItem } from "@/type"
import { MdOutlinePayment } from "react-icons/md";

interface CartData {
    items: CartItem[];
    savedForLater: CartItem[];
    totalItems: number;
    totalPrice: number;
}

interface CheckoutSummaryProps {
    cart: CartData;
    selectedPaymentMethod: 'paypal' | 'stripe' | 'zalopay';
}

const CheckoutSummary = ({ cart, selectedPaymentMethod }: CheckoutSummaryProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Calculate pricing
    const originalPrice = cart.items.reduce((total, item) => {
        return total + (item.estimatedPrice || item.price);
    }, 0);

    const discount = originalPrice - cart.totalPrice;
    const finalPrice = cart.totalPrice;

    const handleProceedPayment = async () => {
        if (cart.totalItems === 0) {
            toast.error("Your cart is empty");
            return;
        }

        setLoading(true);

        try {
            const courseIds = cart.items.map(item => item._id);

            switch (selectedPaymentMethod) {
                case 'paypal':
                    await handlePayPalCheckout(courseIds);
                    break;
                case 'stripe':
                    await handleStripeCheckout(courseIds);
                    break;
                case 'zalopay':
                    await handleZaloPayCheckout(courseIds);
                    break;
                default:
                    toast.error("Please select a payment method");
            }
        } catch (error: any) {
            console.error("Payment error:", error);
            toast.error(error.message || "Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePayPalCheckout = async (courseIds: string[]) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/paypal/create-checkout-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ courseIds }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to create PayPal checkout session");
        }

        // Redirect to PayPal
        const approveLink = data.paypalLinks?.find((link: any) => link.rel === 'approve');
        if (approveLink) {
            window.location.href = approveLink.href;
        } else {
            throw new Error("PayPal approval link not found");
        }
    };

    const handleStripeCheckout = async (courseIds: string[]) => {
        if (!courseIds || courseIds.length === 0) {
            throw new Error("No course selected for Stripe payment");
        }

        const primaryCourseId = courseIds[0];

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/stripe/create-checkout-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ courseId: primaryCourseId }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to create Stripe checkout session");
        }

        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error("Stripe checkout URL not found");
        }
    };

    const handleZaloPayCheckout = async (courseIds: string[]) => {
        // TODO: Implement ZaloPay checkout when backend is ready
        toast.error("ZaloPay payment is coming soon!");

        // Placeholder for future ZaloPay implementation
        /*
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/zalopay/create-checkout-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ courseIds }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to create ZaloPay checkout session");
        }

        // Redirect to ZaloPay
        if (data.payUrl) {
            window.location.href = data.payUrl;
        }
        */
    };

    const getPaymentIcon = () => {
        switch (selectedPaymentMethod) {
            case 'paypal':
                return <FaCcPaypal size={18} />;
            case 'stripe':
                return <FaCcStripe size={18} />;
            case 'zalopay':
                return <SiZalo size={18} />;
            default:
                return <MdOutlinePayment size={18} />;
        }
    };

    const getPaymentLabel = () => {
        switch (selectedPaymentMethod) {
            case 'paypal':
                return 'Pay with PayPal';
            case 'stripe':
                return 'Pay with Stripe';
            case 'zalopay':
                return 'Pay with ZaloPay';
            default:
                return 'Complete Payment';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                Order Summary
            </h2>

            {/* Order Details */}
            <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Items ({cart.totalItems})</span>
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

            {/* Payment Button */}
            <button
                onClick={handleProceedPayment}
                disabled={loading || cart.totalItems === 0}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white transition-all transform hover:scale-105 ${cart.totalItems === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : loading
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
            >
                {getPaymentIcon()}
                {loading ? 'Processing...' : getPaymentLabel()}
            </button>

            {/* Terms */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                By completing your purchase, you agree to our{' '}
                <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Privacy Policy
                </a>
            </p>
        </div>
    )
}

export default CheckoutSummary