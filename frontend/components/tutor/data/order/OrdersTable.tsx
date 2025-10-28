"use client"

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ShoppingCart } from 'lucide-react';
import OrderActions from './OrderActions';

interface IPaymentInfo {
    id: string;
    status: string;
    amount: number;
    currency: string;
    payer_id?: string;
    order_token?: string;
}

interface IOrderItem {
    courseId: string;
    price: number;
    _id: string;
}

interface IOrderResponse {
    _id: string;
    payment_info: IPaymentInfo;
    payment_method: string;
    userId: string;
    items: IOrderItem[];
    total: number;
    emailSent: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

interface OrdersTableProps {
    orders: IOrderResponse[];
    isLoading?: boolean;
    selectedOrderId: string | null;
    setSelectedOrderId: React.Dispatch<React.SetStateAction<string | null>>;
    setOpenOrderDetailModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const OrdersTable = ({
    orders,
    isLoading = false,
    selectedOrderId,
    setSelectedOrderId,
    setOpenOrderDetailModal
}: OrdersTableProps) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = "inline-flex items-center font-medium";
        switch (status.toLowerCase()) {
            case 'succeeded':
                return `${baseClasses} text-green-800 dark:text-green-200`;
            case 'pending':
                return `${baseClasses} text-yellow-800 dark:text-yellow-200`;
            case 'failed':
                return `${baseClasses} text-red-800 dark:text-red-200`;
            default:
                return `${baseClasses} text-gray-800 dark:text-gray-200`;
        }
    };

    const getPaymentMethodBadge = (method: string) => {
        const baseClasses = "inline-flex items-center font-medium";
        switch (method.toLowerCase()) {
            case 'paypal':
                return `${baseClasses} text-blue-800 dark:text-blue-200`;
            case 'stripe':
                return `${baseClasses} text-purple-800 dark:text-purple-200`;
            case 'momo':
                return `${baseClasses} text-pink-800 dark:text-pink-200`;
            default:
                return `${baseClasses} text-gray-800 dark:text-gray-200`;
        }
    };

    // Display skeleton when isLoading is true
    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="text-gray-400 dark:text-gray-600">
                                            <ShoppingCart className="h-12 w-12" />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400">No orders found</p>
                                        <p className="text-sm text-gray-400 dark:text-gray-600">Try adjusting your search criteria</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='border-r'>Order ID</TableHead>
                            <TableHead className='border-r text-center'>Payment Method</TableHead>
                            <TableHead className='border-r text-center'>Status</TableHead>
                            <TableHead className='border-r text-center'>Amount</TableHead>
                            <TableHead className='border-r text-center'>Items</TableHead>
                            <TableHead className='border-r'>Created At</TableHead>
                            <TableHead className="w-16 text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order._id}>
                                {/* Order ID */}
                                <TableCell className='border-r'>
                                    <div className="max-w-[200px]">
                                        <p className="text-sm font-mono text-gray-900 dark:text-white truncate" title={order._id}>
                                            {order._id}
                                        </p>
                                    </div>
                                </TableCell>

                                {/* Payment Method */}
                                <TableCell className='border-r'>
                                    <div className="flex justify-center">
                                        <span className={getPaymentMethodBadge(order.payment_method)}>
                                            {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* Status */}
                                <TableCell className='border-r'>
                                    <div className="flex justify-center">
                                        <span className={getStatusBadge(order.payment_info.status)}>
                                            {order.payment_info.status.charAt(0).toUpperCase() + order.payment_info.status.slice(1)}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* Amount */}
                                <TableCell className='border-r text-center'>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(order.payment_info.amount, order.payment_info.currency)}
                                    </div>
                                </TableCell>

                                {/* Items Count */}
                                <TableCell className='border-r text-center'>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                    </span>
                                </TableCell>

                                {/* Created At */}
                                <TableCell className='border-r'>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        {formatDate(order.createdAt)}
                                    </div>
                                </TableCell>

                                {/* Actions */}
                                <TableCell>
                                    <div className='w-full h-full flex justify-center items-center'>
                                        <OrderActions
                                            order={order}
                                            selectedOrderId={selectedOrderId}
                                            setSelectedOrderId={setSelectedOrderId}
                                            setOpenOrderDetailModal={setOpenOrderDetailModal}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default OrdersTable;