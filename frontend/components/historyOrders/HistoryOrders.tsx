"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Loader from '../Loader';
import HistoryOrdersPagination from './HistoryOrdersPagination';
import toast from 'react-hot-toast';

interface IPaymentInfo {
    id: string;
    status: string;
    amount: number;
    currency: string;
    payer_id: string;
    order_token: string;
    paid_at?: string;
}

interface IOrderItem {
    courseId: string;
    price: number;
    _id: string;
    courseName: string;
}

interface IUser {
    _id: string;
    name: string;
    email: string;
    avatar: {
        public_id: string;
        url: string;
    };
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

interface IPaginationMeta {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

const HistoryOrders = () => {
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [pagination, setPagination] = useState<IPaginationMeta>({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 10
    });
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();

    const buildQueryString = useCallback(() => {
        const params = new URLSearchParams();
        params.set('page', pagination.currentPage.toString());
        params.set('limit', pagination.pageSize.toString());
        return params.toString();
    }, [pagination.currentPage, pagination.pageSize]);

    const fetchOrderHistory = useCallback(async () => {
        try {
            setIsLoading(true);
            const queryString = buildQueryString();

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/order/get_user_orders?${queryString}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to fetch order history");
                return;
            }

            if (data.success && data.paginatedResult) {
                setOrders(data.paginatedResult.data || []);
                setPagination(data.paginatedResult.meta || {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: 1,
                    pageSize: 10
                });
            }

        } catch (error: any) {
            toast.error("Error fetching order history");
            console.log("Error fetching order history:", error.message);
        } finally {
            setIsLoading(false);
        }
    }, [buildQueryString]);

    useEffect(() => {
        fetchOrderHistory();
    }, [fetchOrderHistory]);

    const handlePageChange = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    }, []);

    const handleItemsPerPageChange = useCallback((pageSize: number) => {
        setPagination(prev => ({ ...prev, pageSize, currentPage: 1 }));
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(price);
    };

    const isNotFound = !isLoading && orders.length === 0;

    return (
        <div className="w-full py-8 px-4">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Order History
                </h1>
            </div>

            {/* Orders List */}
            <Card className="theme-mode border-gray-200 dark:border-slate-600">
                <CardContent className="p-6">
                    {isLoading ? (
                        <Loader />
                    ) : isNotFound ? (
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 p-12 text-center">
                            <h3 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
                                No Orders Yet
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                You haven't purchased any courses yet. Start learning today!
                            </p>
                            <Button
                                variant="default"
                                className="px-8 py-2"
                                onClick={() => router.push('/')}
                            >
                                Browse Courses
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-6">
                                {orders.map((order, orderIndex) => (
                                    <div
                                        key={order._id}
                                        onClick={() => router.push(`/order-detail/${order._id}`)}
                                        className="bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-200 dark:border-slate-600 p-6 transition-colors"
                                    >
                                        {/* Order Header Section */}
                                        <div className="mb-6 pb-6 border-b-2 border-gray-200 dark:border-slate-700">
                                            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                                {/* Left Side - Order Info */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                                            Order #{orderIndex + 1}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            Placed on {formatDate(order.createdAt)}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex gap-2">
                                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[100px]">
                                                                Order ID:
                                                            </span>
                                                            <span className="text-sm font-mono text-slate-800 dark:text-slate-200">
                                                                {order._id}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[100px]">
                                                                Payment Method:
                                                            </span>
                                                            <span className="text-sm text-slate-800 dark:text-slate-200 uppercase">
                                                                {order.payment_method}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Side - Total Amount */}
                                                <div className="lg:text-right">
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                                        Total Amount
                                                    </p>
                                                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                                        {formatPrice(order.total, order.payment_info.currency)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items Section */}
                                        <div className="mb-6">
                                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                                Purchased Courses ({order.items.length})
                                            </h4>

                                            <div className="space-y-3">
                                                {order.items.map((item, index) => (
                                                    <div
                                                        key={item._id}
                                                        className="bg-slate-50 dark:bg-slate-900/40 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="space-y-2">
                                                                    <div className="flex gap-2">
                                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[80px]">
                                                                            Course Name:
                                                                        </span>
                                                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                            {item.courseName}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[80px]">
                                                                            Course ID:
                                                                        </span>
                                                                        <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                                                                            {item.courseId}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[80px]">
                                                                            Price:
                                                                        </span>
                                                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                            {formatPrice(item.price, order.payment_info.currency)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="sm:ml-4">
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        router.push(`/course-overview/${item.courseId}`);
                                                                    }}
                                                                    className="w-full sm:w-auto hover:cursor-pointer"
                                                                >
                                                                    View Course
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Payment Details Section */}
                                        <div className="pt-6 border-t-2 border-gray-200 dark:border-slate-700">
                                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">
                                                Payment Details
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[120px]">
                                                            Transaction ID:
                                                        </span>
                                                        <span className="text-sm font-mono text-slate-800 dark:text-slate-200 break-all">
                                                            {order.payment_info.id}
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[120px]">
                                                            Payment Status:
                                                        </span>
                                                        <span className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase">
                                                            {order.payment_info.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {order.payment_info.payer_id && (
                                                        <div className="flex gap-2">
                                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[120px]">
                                                                Payer ID:
                                                            </span>
                                                            <span className="text-sm font-mono text-slate-800 dark:text-slate-200 break-all">
                                                                {order.payment_info.payer_id}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[120px]">
                                                            Currency:
                                                        </span>
                                                        <span className="text-sm text-slate-800 dark:text-slate-200 uppercase">
                                                            {order.payment_info.currency}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="mt-8">
                                <HistoryOrdersPagination
                                    currentPage={pagination.currentPage}
                                    totalPages={pagination.totalPages}
                                    onPageChange={handlePageChange}
                                    itemsPerPage={pagination.pageSize}
                                    onItemsPerPageChange={handleItemsPerPageChange}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default HistoryOrders;