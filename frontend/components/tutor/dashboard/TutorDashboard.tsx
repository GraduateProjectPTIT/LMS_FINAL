"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardStats from "./DashboardStats";
import RecentEnrollmentsTable from "./RecentEnrollmentsTable";
import RevenueChart from "./RevenueChart";
import Loader from "@/components/Loader";

interface ISummary {
    myCoursesCount: number;
    myStudentsCount: number;
    myRevenue: number;
}

interface IAvatar {
    public_id?: string;
    url: string;
}

interface IEnrolledUser {
    avatar: IAvatar;
    _id: string;
    name: string;
    email: string;
}

interface IRecentEnrollment {
    _id: string;
    userId: IEnrolledUser;
    courseId: string;
    enrolledAt: string;
}

interface IDashboardData {
    success: boolean;
    summary: ISummary;
    recentEnrollments: IRecentEnrollment[];
}

const TutorDashboard = () => {
    const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/tutor/dashboard/summary`,
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
                    Tutor Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Track your courses performance and earnings
                </p>
            </div>

            {/* Stats Cards */}
            <DashboardStats summary={dashboardData.summary} />

            {/* Revenue Chart - Full Width */}
            <div className="mt-6">
                <RevenueChart initialRange="30d" />
            </div>

            {/* Recent Enrollments Table - Full width */}
            <div className="mt-6">
                <RecentEnrollmentsTable enrollments={dashboardData.recentEnrollments} />
            </div>
        </div>
    );
};

export default TutorDashboard;