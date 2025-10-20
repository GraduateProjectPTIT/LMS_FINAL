"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardStats from "./DashboardStats";
import RecentUsersTable from "./RecentUsersTable";
import RecentOrdersTable from "./RecentOrdersTable";
import UserRoleChart from "./UserRoleChart";
import RevenueChart from "./RevenueChart";
import Loader from "@/components/Loader";

interface ISummary {
    totalUsers: number;
    totalTutors: number;
    totalStudents: number;
    totalCourses: number;
    totalOrders: number;
    totalRevenue: number;
}

interface IAvatar {
    public_id?: string;
    url: string;
}

interface IRecentUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar: IAvatar;
    createdAt: string;
}

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

interface IDashboardData {
    success: boolean;
    summary: ISummary;
    recentUsers: IRecentUser[];
    recentPaidOrders: IRecentOrder[];
}

const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/admin/dashboard/summary`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to fetch dashboard data");
                return;
            }

            setDashboardData(data);
        } catch (error: any) {
            toast.error("Error loading dashboard");
            console.error("Dashboard error:", error?.message || error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return <Loader />;
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Failed to load dashboard data</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl uppercase font-bold text-gray-900 dark:text-white">
                    Dashboard Overview
                </h1>
            </div>

            {/* Stats Cards */}
            <DashboardStats summary={dashboardData.summary} />

            {/* Revenue Chart - Full Width */}
            <div className="mt-6">
                <RevenueChart initialRange="30d" />
            </div>

            {/* Charts & Tables Section */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Role Chart - Takes 1 column */}
                <div className="lg:col-span-1">
                    <UserRoleChart summary={dashboardData.summary} />
                </div>

                {/* Recent Users Table - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <RecentUsersTable users={dashboardData.recentUsers} />
                </div>
            </div>

            {/* Recent Orders Table - Full width */}
            <div className="mt-6">
                <RecentOrdersTable orders={dashboardData.recentPaidOrders} />
            </div>
        </div>
    );
};

export default AdminDashboard;