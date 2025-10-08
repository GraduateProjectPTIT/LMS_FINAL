import React from "react";
import { Users, UserCheck, GraduationCap, BookOpen, ShoppingCart, DollarSign } from "lucide-react";
import StatsCard from "./StatsCard";

interface ISummary {
    totalUsers: number;
    totalTutors: number;
    totalStudents: number;
    totalCourses: number;
    totalOrders: number;
    totalRevenue: number;
}

interface DashboardStatsProps {
    summary: ISummary;
}

const DashboardStats = ({ summary }: DashboardStatsProps) => {
    const stats = [
        {
            title: "Total Users",
            value: summary.totalUsers,
            icon: Users,
            iconColor: "text-blue-600",
            iconBgColor: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
            title: "Total Tutors",
            value: summary.totalTutors,
            icon: UserCheck,
            iconColor: "text-purple-600",
            iconBgColor: "bg-purple-100 dark:bg-purple-900/20",
        },
        {
            title: "Total Students",
            value: summary.totalStudents,
            icon: GraduationCap,
            iconColor: "text-green-600",
            iconBgColor: "bg-green-100 dark:bg-green-900/20",
        },
        {
            title: "Total Courses",
            value: summary.totalCourses,
            icon: BookOpen,
            iconColor: "text-orange-600",
            iconBgColor: "bg-orange-100 dark:bg-orange-900/20",
        },
        {
            title: "Total Orders",
            value: summary.totalOrders,
            icon: ShoppingCart,
            iconColor: "text-pink-600",
            iconBgColor: "bg-pink-100 dark:bg-pink-900/20",
        },
        {
            title: "Total Revenue",
            value: summary.totalRevenue,
            icon: DollarSign,
            iconColor: "text-emerald-600",
            iconBgColor: "bg-emerald-100 dark:bg-emerald-900/20",
            prefix: "$",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
                <StatsCard
                    key={index}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    iconColor={stat.iconColor}
                    iconBgColor={stat.iconBgColor}
                    prefix={stat.prefix}
                />
            ))}
        </div>
    );
};

export default DashboardStats;