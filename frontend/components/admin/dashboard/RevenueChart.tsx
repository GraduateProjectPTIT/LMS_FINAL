import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface IRevenueSeries {
    _id: {
        year: number;
        month: number;
        day?: number;
    };
    revenue: number;
}

interface IRevenueData {
    success: boolean;
    range: string;
    series: IRevenueSeries[];
}

interface RevenueChartProps {
    initialRange?: "30d" | "12m";
}

const RevenueChart = ({ initialRange = "30d" }: RevenueChartProps) => {
    const [revenueData, setRevenueData] = useState<IRevenueData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedRange, setSelectedRange] = useState<"30d" | "12m">(initialRange);

    useEffect(() => {
        fetchRevenueData(selectedRange);
    }, [selectedRange]);

    const fetchRevenueData = async (range: "30d" | "12m") => {
        try {
            setLoading(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/admin/dashboard/revenue?range=${range}`,
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
                toast.error(data.message || "Failed to fetch revenue data");
                return;
            }

            setRevenueData(data);
        } catch (error: any) {
            toast.error("Error loading revenue data");
            console.error("Revenue error:", error?.message || error);
        } finally {
            setLoading(false);
        }
    };

    const formatChartData = () => {
        if (!revenueData || !revenueData.series) return [];

        return revenueData.series.map((item) => {
            let label = "";
            if (selectedRange === "30d" && item._id.day) {
                // Format: "Oct 7"
                label = new Date(item._id.year, item._id.month - 1, item._id.day).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                });
            } else {
                // Format: "Oct 2025"
                label = new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                });
            }

            return {
                date: label,
                revenue: item.revenue,
            };
        });
    };

    const getTotalRevenue = () => {
        if (!revenueData || !revenueData.series) return 0;
        return revenueData.series.reduce((sum, item) => sum + item.revenue, 0);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {payload[0].payload.date}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Revenue: <span className="font-medium text-emerald-600">${payload[0].value.toLocaleString()}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const chartData = formatChartData();

    return (
        <div className="theme-mode rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Revenue Analytics
                            </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Track your platform's revenue over time
                        </p>
                    </div>

                    {/* Range Selector */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setSelectedRange("30d")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedRange === "30d"
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setSelectedRange("12m")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedRange === "12m"
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            12 Months
                        </button>
                    </div>
                </div>

                {/* Total Revenue Display */}
                <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue:</span>
                    <span className="text-2xl font-bold text-emerald-600">
                        ${getTotalRevenue().toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="p-6">
                {loading ? (
                    <div className="h-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-80 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <Calendar className="w-12 h-12 mb-3 opacity-50" />
                        <p>No revenue data available for this period</p>
                    </div>
                ) : (
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ fill: '#10b981', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueChart;