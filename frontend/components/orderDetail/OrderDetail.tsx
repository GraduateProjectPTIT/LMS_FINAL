"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { getValidThumbnail, isValidImageUrl } from "@/utils/handleImage";
import { User } from 'lucide-react';

interface IPaymentInfo {
    id: string;
    status: string;
    amount: number;
    currency: string;
    payer_id: string;
    order_token: string;
    paid_at?: string;
}

interface IAvatar {
    public_id: string;
    url: string;
}

interface ICreator {
    _id: string;
    name: string;
    email: string;
    avatar: IAvatar;
}

interface IOrderItem {
    _id: string;
    name: string;
    price: number;
    thumbnail: {
        public_id: string;
        url: string;
    };
    creatorId: ICreator;
}

interface IUser {
    _id: string;
    name: string;
    email: string;
    avatar: IAvatar;
}

interface IOrder {
    _id: string;
    payment_method: string;
    payment_info: IPaymentInfo;
    items: IOrderItem[];
    total: number;
    userId: IUser;
    createdAt: string;
    updatedAt: string;
    emailSent: boolean;
    notificationSent?: boolean;
}

interface IOrderDetailProps {
    orderId: string;
}

const OrderDetail = ({ orderId }: IOrderDetailProps) => {
    const [order, setOrder] = useState<IOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/order/get_user_order_detail/${orderId}`,
                    {
                        method: 'GET',
                        headers: { 
                            'Content-Type': 'application/json' 
                        },
                        credentials: 'include',
                    }
                );

                const data = await res.json();

                if (!res.ok) {
                    toast.error(data.message || "Failed to fetch order details");
                    return;
                }

                if (data.success && data.order) {
                    setOrder(data.order);
                }
            } catch (error: any) {
                toast.error("Error fetching order details");
                console.error("Error fetching order details:", error.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetail();
        }
    }, [orderId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatPrice = (price: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(price);
    };

    if (isLoading) {
        return (
            <div className="w-full py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400">Loading order details...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="w-full py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <Card className="border-2 border-gray-200 dark:border-slate-600">
                        <CardContent className="p-12 text-center">
                            <h3 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
                                Order Not Found
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                The order you're looking for doesn't exist or you don't have permission to view it.
                            </p>
                            <Button
                                variant="default"
                                onClick={() => router.push('/order-history')}
                            >
                                Back to Order History
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        ← Back
                    </Button>
                </div>

                {/* Single Card with all information */}
                <Card className="bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600">
                    <CardContent className="p-8">
                        {/* Order Information Section */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-700">
                                Order Information
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Order ID:
                                    </p>
                                    <p className="text-base text-slate-900 dark:text-slate-100">
                                        {order._id}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Order Date:
                                    </p>
                                    <p className="text-base text-slate-900 dark:text-slate-100">
                                        {formatDate(order.createdAt)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Payment Method:
                                    </p>
                                    <p className="text-base text-slate-900 dark:text-slate-100 uppercase">
                                        {order.payment_method}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Total Amount:
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {formatPrice(order.total, order.payment_info.currency)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Payment Status:
                                    </p>
                                    <p className="text-base font-semibold text-green-600 dark:text-green-400 uppercase">
                                        {order.payment_info.status}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information Section */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-700">
                                Customer Information
                            </h2>

                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                                        {order.userId.avatar?.url && isValidImageUrl(order.userId.avatar.url) ? (
                                            <Image
                                                src={order.userId.avatar.url}
                                                alt={order.userId.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                                                <User size={48} className="text-indigo-600 dark:text-indigo-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Name:</p>
                                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                            {order.userId.name}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Email:</p>
                                    <p className="text-base text-slate-900 dark:text-slate-100">
                                        {order.userId.email}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Customer ID:</p>
                                    <p className="text-base text-slate-900 dark:text-slate-100">
                                        {order.userId._id}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Purchased Courses Section */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-700">
                                Purchased Courses ({order.items.length})
                            </h2>

                            <div className="space-y-6">
                                {order.items.map((item) => (
                                    <div
                                        key={item._id}
                                        onClick={() => router.push(`/course-overview/${item._id}`)}
                                        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
                                    >
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Course Thumbnail */}
                                            <div className="relative w-full lg:w-72 h-48 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                                                <Image
                                                    src={getValidThumbnail(item.thumbnail.url)}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            {/* Course Details */}
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                                        Course Name:
                                                    </p>
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                                        {item.name}
                                                    </h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                                            Course ID:
                                                        </p>
                                                        <p className="text-base text-slate-900 dark:text-slate-100">
                                                            {item._id}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                                            Price:
                                                        </p>
                                                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                                            {formatPrice(item.price, order.payment_info.currency)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Instructor Info */}
                                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                                        Instructor:
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                                                            {item.creatorId.avatar?.url ? (
                                                                <Image
                                                                    src={item.creatorId.avatar.url}
                                                                    alt={item.creatorId.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-base font-bold text-slate-600 dark:text-slate-300">
                                                                    {item.creatorId.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                                                {item.creatorId.name}
                                                            </p>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                {item.creatorId.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Details Section */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-700">
                                Payment Details
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Transaction ID:
                                    </p>
                                    <p className="text-base text-slate-900 dark:text-slate-100 break-all">
                                        {order.payment_info.id}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Order Token:
                                    </p>
                                    <p className="text-base text-slate-900 dark:text-slate-100">
                                        {order.payment_info.order_token}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Payer ID:
                                    </p>
                                    <p className="text-base text-slate-900 dark:text-slate-100">
                                        {order.payment_info.payer_id}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Payment Amount:
                                    </p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {formatPrice(order.payment_info.amount, order.payment_info.currency)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Currency:
                                    </p>
                                    <p className="text-base text-slate-900 dark:text-slate-100 uppercase">
                                        {order.payment_info.currency}
                                    </p>
                                </div>

                                {order.payment_info.paid_at && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                            Payment Date:
                                        </p>
                                        <p className="text-base text-slate-900 dark:text-slate-100">
                                            {formatDate(order.payment_info.paid_at)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OrderDetail;