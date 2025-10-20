import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ISummary {
    totalUsers: number;
    totalTutors: number;
    totalStudents: number;
}

interface UserRoleChartProps {
    summary: ISummary;
}

const UserRoleChart = ({ summary }: UserRoleChartProps) => {
    const data = [
        { name: "Tutors", value: summary.totalTutors },
        { name: "Students", value: summary.totalStudents },
        { name: "Others", value: summary.totalUsers - summary.totalTutors - summary.totalStudents },
    ].filter(item => item.value > 0); // Only show categories with values

    const COLORS = {
        Tutors: "#9333ea",      // purple-600
        Students: "#16a34a",    // green-600
        Others: "#64748b",      // slate-500
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const percentage = ((payload[0].value / summary.totalUsers) * 100).toFixed(1);
            return (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {payload[0].name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Count: <span className="font-medium">{payload[0].value}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Percentage: <span className="font-medium">{percentage}%</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-sm font-semibold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="theme-mode rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    User Distribution
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Breakdown of users by role
                </p>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[entry.name as keyof typeof COLORS]}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value, entry: any) => (
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {value} ({entry.payload.value})
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-4">
                    {data.map((item) => {
                        const percentage = ((item.value / summary.totalUsers) * 100).toFixed(1);
                        return (
                            <div key={item.name} className="text-center">
                                <div
                                    className="w-3 h-3 rounded-full mx-auto mb-2"
                                    style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.name}
                                </p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {percentage}%
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default UserRoleChart;