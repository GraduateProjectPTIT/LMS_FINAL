"use client"

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
    X,
    User,
    Mail,
    Calendar,
    CreditCard,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    FileText,
    ShoppingCart,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isValidImageUrl } from '@/utils/handleImage';

interface IMedia {
    public_id?: string;
    url: string;
}

interface ICreator {
    _id: string;
    name: string;
    email: string;
    avatar: IMedia;
}

interface ICourse {
    _id: string;
    name: string;
    price: number;
    thumbnail: IMedia;
    creatorId: ICreator;
}

interface IOrderItem {
    courseId: string;
    price: number;
    _id: string;
    course: ICourse;
}

interface IPaymentInfo {
    id: string;
    status: string;
    amount: number;
    currency: string;
    payer_id?: string;
    order_token?: string;
}

interface IUserInfo {
    _id: string;
    name: string;
    email: string;
    avatar: IMedia;
}

interface IOrderDetail {
    _id: string;
    payment_info: IPaymentInfo;
    payment_method: string;
    userId: IUserInfo;
    items: IOrderItem[];
    total: number;
    emailSent: boolean;
    createdAt: string;
    updatedAt: string;
}

interface IOrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | null;
}

const OrderDetailModal = ({ isOpen, onClose, orderId }: IOrderDetailModalProps) => {
    const [order, setOrder] = useState<IOrderDetail | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    const handleModalClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const fetchOrderDetail = useCallback(async () => {
        if (!orderId) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/order/get_order_detail/${orderId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to fetch order details");
                return;
            }

            setOrder(data.order);
        } catch (error: any) {
            toast.error("Error fetching order details");
            console.error("Get order detail error:", error?.message || error);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';

            if (orderId) {
                fetchOrderDetail();
            }
        } else {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
            setOrder(null);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, orderId, handleEscape, fetchOrderDetail]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'succeeded':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'succeeded':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <AlertCircle className="h-5 w-5 text-gray-500" />;
        }
    };

    const getPaymentMethodDisplay = (method: string) => {
        return method.charAt(0).toUpperCase() + method.slice(1);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleModalClick}
        >
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                ))}
                            </div>
                        </div>
                    ) : order ? (
                        <div className="space-y-6">
                            {/* Order ID and Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Order ID
                                    </span>
                                    <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mt-1 break-all">
                                        {order._id}
                                    </p>
                                </div>

                                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                        Payment Status
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(order.payment_info.status)}
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.payment_info.status)}`}>
                                            {order.payment_info.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Information */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Customer Information
                                </h3>
                                <div className="flex items-start space-x-4">
                                    <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                        {order.userId?.avatar?.url && isValidImageUrl(order.userId.avatar.url) ? (
                                            <Image
                                                src={order.userId.avatar.url}
                                                alt={order.userId.name}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <User className="h-8 w-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {order.userId?.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            <Mail className="h-4 w-4" />
                                            {order.userId?.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Information */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {getPaymentMethodDisplay(order.payment_method)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</span>
                                        <span className="text-xs font-mono text-gray-900 dark:text-white">
                                            {order.payment_info.id}
                                        </span>
                                    </div>

                                    {order.payment_info.payer_id && (
                                        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Payer ID</span>
                                            <span className="text-xs font-mono text-gray-900 dark:text-white">
                                                {order.payment_info.payer_id}
                                            </span>
                                        </div>
                                    )}

                                    {order.payment_info.order_token && (
                                        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Order Token</span>
                                            <span className="text-xs font-mono text-gray-900 dark:text-white">
                                                {order.payment_info.order_token}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Email Sent</span>
                                        <div className="flex items-center gap-2">
                                            {order.emailSent ? (
                                                <>
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Yes</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                    <span className="text-sm font-medium text-red-600 dark:text-red-400">No</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Order Items ({order.items.length})
                                </h3>
                                <div className="space-y-4">
                                    {order.items.map((item) => (
                                        <div
                                            key={item._id}
                                            className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                                        >
                                            {/* Course Thumbnail */}
                                            <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                                {item.course?.thumbnail?.url && isValidImageUrl(item.course.thumbnail.url) ? (
                                                    <Image
                                                        src={item.course.thumbnail.url}
                                                        alt={item.course.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="128px"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Package className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Course Details */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                                    {item.course?.name}
                                                </h4>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                        {item.course?.creatorId?.avatar?.url && isValidImageUrl(item.course.creatorId.avatar.url) ? (
                                                            <Image
                                                                src={item.course.creatorId.avatar.url}
                                                                alt={item.course.creatorId.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="24px"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <User className="h-3 w-3 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span>{item.course?.creatorId?.name}</span>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    ${item.price.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                    <span className="text-gray-900 dark:text-white">
                                        ${order.payment_info.amount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Total
                                    </span>
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        ${order.total.toFixed(2)} {order.payment_info.currency}
                                    </span>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Created At
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDate(order.createdAt)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Updated At
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDate(order.updatedAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No order data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;