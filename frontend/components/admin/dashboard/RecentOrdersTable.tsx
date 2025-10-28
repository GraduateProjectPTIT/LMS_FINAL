import React from "react";
import { Calendar, CheckCircle } from "lucide-react";

interface IPaymentInfo {
    id: string;
    status: string;
    amount: number;
    currency: string;
    payer_id: string;
    order_token: string;
}

interface IOrderItem {
    courseId: string;
    price: number;
    _id: string;
}

interface IRecentOrder {
    _id: string;
    payment_method: string;
    payment_info: IPaymentInfo;
    createdAt: string;
    items: IOrderItem[];
    total: number;
    userId: string;
}

interface RecentOrdersTableProps {
    orders: IRecentOrder[];
}

const RecentOrdersTable = ({ orders }: RecentOrdersTableProps) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'paypal':
                return '💳';
            case 'stripe':
                return '💰';
            default:
                return '💵';
        }
    };

    const getStatusBadge = (status: string) => {
        if (status.toLowerCase() === 'succeeded') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Succeeded
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                {status}
            </span>
        );
    };

    return (
        <div className="theme-mode rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Orders
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Latest successful transactions
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Order ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Payment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Date
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No recent orders found
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                                            #{order._id.slice(-8).toUpperCase()}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="mr-2 text-lg">
                                                {getPaymentMethodIcon(order.payment_method)}
                                            </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                                                {order.payment_method}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(order.total, order.payment_info.currency)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(order.payment_info.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                            <Calendar className="w-4 h-4 mr-1.5" />
                                            {formatDate(order.createdAt)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentOrdersTable;