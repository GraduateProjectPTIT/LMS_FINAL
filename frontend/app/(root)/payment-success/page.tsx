"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, Users, BookOpen, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

interface CourseData {
    id: string;
    name: string;
    price: number;
    description: string;
    thumbnail?: string;
    instructor?: string;
    duration?: string;
    studentsEnrolled?: number;
}

interface PaymentData {
    id: string;
    amount: number;
    currency: string;
}

interface OrderData {
    orderId: string;
    courseId: string;
    amount: number;
    currency: string;
}

const PaymentSuccess = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [processed, setProcessed] = useState(false);

    useEffect(() => {
        const token = searchParams?.get('token');
        if (token && typeof window !== 'undefined') {
            const storageKey = `paypal_success_${token}`;
            const already = sessionStorage.getItem(storageKey);
            if (already) {
                setLoading(false);
                return;
            }
        }

        if (processed) return;
        setProcessed(true);

        const processPayment = async () => {
            try {
                const courseId = searchParams?.get('courseId');
                const courseIds = searchParams?.get('courseIds');
                const token = searchParams?.get('token');
                const paymentId = searchParams?.get('paymentId');

                // Handle different payment methods
                if (token) {
                    // PayPal payment
                    await handlePayPalSuccess(courseId, courseIds, token);
                } else if (paymentId) {
                    // Stripe payment (future implementation)
                    await handleStripeSuccess(courseId, courseIds, paymentId);
                } else {
                    // Check for other payment method parameters
                    const orderInfo = searchParams?.get('orderInfo');
                    if (orderInfo) {
                        // ZaloPay payment (future implementation)
                        await handleZaloPaySuccess(courseId, courseIds, orderInfo);
                    } else {
                        setError('Invalid payment parameters');
                    }
                }
            } catch (error: any) {
                console.error('Payment processing error:', error);
                setError(error.message || 'Failed to process payment');
                toast.error(error.message || 'Payment processing failed');
            } finally {
                setLoading(false);
            }
        };

        processPayment();
    }, [processed, searchParams]);

    const handlePayPalSuccess = async (courseId: string | null | undefined, courseIds: string | null | undefined, token: string) => {
        const payload = {
            token,
            ...(courseId ? { courseId } : {}),
            ...(courseIds ? { courseIds: courseIds.split(',') } : {})
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/paypal/success`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Payment verification failed");
        }

        setPaymentData(data.payment);

        if (typeof window !== 'undefined') {
            const storageKey = `paypal_success_${token}`;
            sessionStorage.setItem(storageKey, '1');
        }

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    const handleStripeSuccess = async (courseId: string | null | undefined, courseIds: string | null | undefined, paymentId: string) => {
        // TODO: Implement when Stripe is ready
        toast.success("Stripe payment completed!");
        setPaymentData({
            id: paymentId,
            amount: 0,
            currency: 'USD'
        });
    };

    const handleZaloPaySuccess = async (courseId: string | null | undefined, courseIds: string | null | undefined, orderInfo: string) => {
        // TODO: Implement when ZaloPay is ready
        toast.success("ZaloPay payment completed!");
        setPaymentData({
            id: orderInfo,
            amount: 0,
            currency: 'VND'
        });
    };

    const handleGoToCourses = () => {
        router.push('/my-courses');
    };

    const handleBackToHome = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <div className="theme-mode min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                        Processing Your Payment
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Please wait while we verify your payment...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="theme-mode min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="max-w-md mx-auto text-center p-6">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                        Payment Error
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {error}
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/cart')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Return to Cart
                        </button>
                        <button
                            onClick={() => router.push('/support')}
                            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="theme-mode min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto flex flex-col gap-8">
                    {/* Success Header */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                            Payment Successful!
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Thank you for your purchase. Your makeup courses are now available!
                        </p>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                            Payment Details
                        </h2>
                        {paymentData && (
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
                                    <span className="font-mono text-sm text-gray-800 dark:text-white">
                                        {paymentData.id}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                                    <span className="font-semibold text-gray-800 dark:text-white">
                                        ${paymentData.amount.toFixed(2)} {paymentData.currency}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                        <CheckCircle size={16} />
                                        Completed
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                                    <span className="text-gray-800 dark:text-white">
                                        {new Date().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Next Steps */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                            What's Next?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                <span className="text-blue-700 dark:text-blue-300">Access your courses instantly</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                <span className="text-blue-700 dark:text-blue-300">Learn at your own pace</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                <span className="text-blue-700 dark:text-blue-300">Get lifetime access</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleGoToCourses}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <BookOpen size={20} />
                            Go to My Courses
                            <ArrowRight size={16} />
                        </button>
                        <button
                            onClick={handleBackToHome}
                            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;