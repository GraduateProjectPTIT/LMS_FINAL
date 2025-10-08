import React from "react";
import { BookOpen, Users, DollarSign } from "lucide-react";
import StatsCard from "./StatsCard";

interface ISummary {
    myCoursesCount: number;
    myStudentsCount: number;
    myRevenue: number;
}

interface DashboardStatsProps {
    summary: ISummary;
}

const DashboardStats = ({ summary }: DashboardStatsProps) => {
    const stats = [
        {
            title: "My Courses",
            value: summary.myCoursesCount,
            icon: BookOpen,
            iconColor: "text-blue-600",
            iconBgColor: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
            title: "My Students",
            value: summary.myStudentsCount,
            icon: Users,
            iconColor: "text-purple-600",
            iconBgColor: "bg-purple-100 dark:bg-purple-900/20",
        },
        {
            title: "Total Earnings",
            value: summary.myRevenue,
            icon: DollarSign,
            iconColor: "text-emerald-600",
            iconBgColor: "bg-emerald-100 dark:bg-emerald-900/20",
            prefix: "$",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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