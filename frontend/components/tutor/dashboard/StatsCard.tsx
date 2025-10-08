import React from "react";

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    iconBgColor: string;
    prefix?: string;
}

const StatsCard = ({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
    prefix = "",
}: StatsCardProps) => {
    return (
        <div className="theme-mode rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                </div>
                <div className={`${iconBgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
            </div>
        </div>
    );
};

export default StatsCard;