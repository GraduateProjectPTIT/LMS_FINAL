"use client"
import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from 'react-hot-toast';

interface FilterState {
    status: string;
    method: string;
    dateFrom: string;
    dateTo: string;
    sortBy: string;
    sortOrder: string;
}

interface SearchOrdersProps {
    paymentStatuses: string[];
    paymentMethods: string[];
    filters: FilterState; // Draft filters
    appliedFilters: FilterState; // Applied filters
    onFilterChange: (filters: Partial<FilterState>) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
    onRemoveFilter: (filterKey: keyof FilterState) => void;
    onRemoveSortFilter: () => void;
}

const SearchOrders = ({
    paymentStatuses,
    paymentMethods,
    filters,
    appliedFilters,
    onFilterChange,
    onApplyFilters,
    onClearFilters,
    onRemoveFilter,
    onRemoveSortFilter
}: SearchOrdersProps) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ status: e.target.value });
    };

    const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ method: e.target.value });
    };

    const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDateFrom = e.target.value;
        if (filters.dateTo && newDateFrom > filters.dateTo) {
            toast.error("Start date cannot be after end date.");
            return;
        }
        onFilterChange({ dateFrom: newDateFrom });
    };

    const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDateTo = e.target.value;
        if (filters.dateFrom && newDateTo < filters.dateFrom) {
            toast.error("End date cannot be before start date.");
            return;
        }
        onFilterChange({ dateTo: newDateTo });
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;

        if (value === 'newest') {
            onFilterChange({ sortBy: 'createdAt', sortOrder: 'desc' });
        } else if (value === 'oldest') {
            onFilterChange({ sortBy: 'createdAt', sortOrder: 'asc' });
        }
    };

    const handleApplyClick = () => {
        onApplyFilters();
        setIsFilterOpen(false);
    };

    // Kiểm tra active filters dựa trên appliedFilters
    const hasActiveFilters =
        (appliedFilters.status && appliedFilters.status !== 'all') ||
        (appliedFilters.method && appliedFilters.method !== 'all') ||
        appliedFilters.dateFrom ||
        appliedFilters.dateTo ||
        appliedFilters.sortOrder !== 'desc';

    const getActiveFiltersCount = () => {
        let count = 0;
        if (appliedFilters.status && appliedFilters.status !== 'all') count++;
        if (appliedFilters.method && appliedFilters.method !== 'all') count++;
        if (appliedFilters.dateFrom) count++;
        if (appliedFilters.dateTo) count++;
        if (appliedFilters.sortOrder !== 'desc') count++;
        return count;
    };

    // Kiểm tra xem có thay đổi giữa draft và applied filters không
    const hasUnappliedChanges = () => {
        return JSON.stringify(filters) !== JSON.stringify(appliedFilters);
    };

    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };

    const getStatusLabel = (value: string) => {
        const statusLabels: Record<string, string> = {
            'all': 'All Status',
            'succeeded': 'Succeeded',
            'pending': 'Pending',
            'failed': 'Failed'
        };
        return statusLabels[value] || value;
    };

    const getMethodLabel = (value: string) => {
        const methodLabels: Record<string, string> = {
            'all': 'All Methods',
            'paypal': 'PayPal',
            'stripe': 'Stripe',
            'momo': 'MoMo'
        };
        return methodLabels[value] || value;
    };

    const getSortValue = () => {
        if (filters.sortOrder === 'desc') return 'newest';
        if (filters.sortOrder === 'asc') return 'oldest';
        return 'newest';
    };

    const getSortLabel = (value: string) => {
        const sortLabels: Record<string, string> = {
            'newest': 'Newest First',
            'oldest': 'Oldest First',
        };
        return sortLabels[value] || value;
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="py-4 space-y-4">
            {/* Filter Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-end">
                {/* Filter Toggle Button */}
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={toggleFilter}
                        className="flex items-center gap-2 border-gray-300 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 hover:cursor-pointer"
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                {getActiveFiltersCount()}
                            </span>
                        )}
                        {isFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClearFilters}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 hover:cursor-pointer"
                        >
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Section - Collapsible */}
            {isFilterOpen && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800/30 shadow-lg">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Order Filters</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {hasActiveFilters && (
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {getActiveFiltersCount()} active filter{getActiveFiltersCount() !== 1 ? 's' : ''}
                                    </span>
                                )}
                                {hasUnappliedChanges() && (
                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full font-medium">
                                        Unsaved changes
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Payment Status Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Payment Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.status}
                                        onChange={handleStatusChange}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                                    >
                                        <option value="all">All Status</option>
                                        {paymentStatuses.map(status => (
                                            <option key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Payment Method Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Payment Method
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.method}
                                        onChange={handleMethodChange}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                                    >
                                        <option value="all">All Methods</option>
                                        {paymentMethods.map(method => (
                                            <option key={method} value={method}>
                                                {method.charAt(0).toUpperCase() + method.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Date From Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    From Date
                                </label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={handleDateFromChange}
                                        max={filters.dateTo || undefined}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Date To Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    To Date
                                </label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={handleDateToChange}
                                        min={filters.dateFrom || undefined}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Sort By Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex flex-col gap-2 max-w-xs">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Sort By Date
                                </label>
                                <div className="relative">
                                    <select
                                        value={getSortValue()}
                                        onChange={handleSortChange}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClearFilters}
                                disabled={!hasActiveFilters}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Reset All Filters
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={toggleFilter}
                                    className="border-gray-300 dark:border-slate-800 hover:cursor-pointer"
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleApplyClick}
                                    className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
                                    disabled={!hasUnappliedChanges()}
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filters Display - dựa trên appliedFilters */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active filters:</span>

                    {appliedFilters.status && appliedFilters.status !== 'all' && (
                        <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>Status: {getStatusLabel(appliedFilters.status)}</span>
                            <button
                                onClick={() => onRemoveFilter('status')}
                                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 hover:cursor-pointer" />
                            </button>
                        </div>
                    )}

                    {appliedFilters.method && appliedFilters.method !== 'all' && (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>Method: {getMethodLabel(appliedFilters.method)}</span>
                            <button
                                onClick={() => onRemoveFilter('method')}
                                className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 hover:cursor-pointer" />
                            </button>
                        </div>
                    )}

                    {appliedFilters.dateFrom && (
                        <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>From: {formatDateDisplay(appliedFilters.dateFrom)}</span>
                            <button
                                onClick={() => onRemoveFilter('dateFrom')}
                                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 hover:cursor-pointer" />
                            </button>
                        </div>
                    )}

                    {appliedFilters.dateTo && (
                        <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>To: {formatDateDisplay(appliedFilters.dateTo)}</span>
                            <button
                                onClick={() => onRemoveFilter('dateTo')}
                                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 hover:cursor-pointer" />
                            </button>
                        </div>
                    )}

                    {appliedFilters.sortOrder !== 'desc' && (
                        <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>Sort: {getSortLabel(getSortValue())}</span>
                            <button
                                onClick={onRemoveSortFilter}
                                className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 hover:cursor-pointer" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchOrders;