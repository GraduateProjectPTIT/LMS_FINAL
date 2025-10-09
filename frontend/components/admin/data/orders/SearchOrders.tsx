"use client"
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search, X, Filter, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void;
    onClearSearch: () => void;
    currentSearch?: string;
    paymentStatuses: string[];
    paymentMethods: string[];
    filters: FilterState;
    onFilterChange: (filters: Partial<FilterState>) => void;
    onClearFilters: () => void;
}

const SearchOrders = ({
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    onClearSearch,
    currentSearch = "",
    paymentStatuses,
    paymentMethods,
    filters,
    onFilterChange,
    onClearFilters,
}: SearchOrdersProps) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSearchSubmit();
        } else if (e.key === 'Escape') {
            onClearSearch();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearchSubmit();
    };

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

        if (value === 'default') {
            onFilterChange({ sortBy: 'createdAt', sortOrder: 'desc' });
        } else if (value === 'date-newest') {
            onFilterChange({ sortBy: 'createdAt', sortOrder: 'desc' });
        } else if (value === 'date-oldest') {
            onFilterChange({ sortBy: 'createdAt', sortOrder: 'asc' });
        } else if (value === 'name-asc') {
            onFilterChange({ sortBy: 'name', sortOrder: 'asc' });
        } else if (value === 'name-desc') {
            onFilterChange({ sortBy: 'name', sortOrder: 'desc' });
        }
    };

    const hasActiveFilters =
        (filters.status && filters.status !== 'all') ||
        (filters.method && filters.method !== 'all') ||
        filters.dateFrom ||
        filters.dateTo ||
        (filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc');

    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.status && filters.status !== 'all') count++;
        if (filters.method && filters.method !== 'all') count++;
        if (filters.dateFrom) count++;
        if (filters.dateTo) count++;
        if (filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') count++;
        return count;
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
        if (filters.sortBy === 'createdAt' && filters.sortOrder === 'desc') return 'date-newest';
        if (filters.sortBy === 'createdAt' && filters.sortOrder === 'asc') return 'date-oldest';
        if (filters.sortBy === 'name' && filters.sortOrder === 'asc') return 'name-asc';
        if (filters.sortBy === 'name' && filters.sortOrder === 'desc') return 'name-desc';
        return 'default';
    };

    const getSortLabel = (value: string) => {
        const sortLabels: Record<string, string> = {
            'default': 'Default',
            'name-asc': 'Payer Name: A to Z',
            'name-desc': 'Payer Name: Z to A',
            'date-newest': 'Newest',
            'date-oldest': 'Oldest',
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
            {/* Search and Filter Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Search Section */}
                <form onSubmit={handleSubmit} className="relative flex-1 max-w-md">
                    <div className="relative flex">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search by email, user ID, course ID..."
                                value={searchQuery}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyPress}
                                className="pl-10 pr-10 border border-gray-300 dark:border-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {searchQuery && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearSearch}
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
                            disabled={!searchQuery.trim()}
                        >
                            Search
                        </Button>
                    </div>
                </form>

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

            {/* Current Search Display */}
            {currentSearch && (
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    Showing results for: <span className="font-semibold text-blue-800 dark:text-blue-200">"{currentSearch}"</span>
                </div>
            )}

            {/* Filter Section - Collapsible */}
            {isFilterOpen && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800/30 shadow-lg">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Order Filters</h3>
                            </div>
                            {hasActiveFilters && (
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {getActiveFiltersCount()} active filter{getActiveFiltersCount() !== 1 ? 's' : ''}
                                </span>
                            )}
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
                                    Sort By
                                </label>
                                <div className="relative">
                                    <select
                                        value={getSortValue()}
                                        onChange={handleSortChange}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                                    >
                                        <option value="default">Default (Newest)</option>
                                        <option value="name-asc">Payer Name: A to Z</option>
                                        <option value="name-desc">Payer Name: Z to A</option>
                                        <option value="date-newest">Newest</option>
                                        <option value="date-oldest">Oldest</option>
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 hover:cursor-pointer"
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
                                    onClick={toggleFilter}
                                    className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active filters:</span>

                    {filters.status && filters.status !== 'all' && (
                        <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>Status: {getStatusLabel(filters.status)}</span>
                            <button
                                onClick={() => onFilterChange({ status: 'all' })}
                                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 hover:cursor-pointer" />
                            </button>
                        </div>
                    )}

                    {filters.method && filters.method !== 'all' && (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>Method: {getMethodLabel(filters.method)}</span>
                            <button
                                onClick={() => onFilterChange({ method: 'all' })}
                                className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 hover:cursor-pointer" />
                            </button>
                        </div>
                    )}

                    {filters.dateFrom && (
                        <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>From: {formatDateDisplay(filters.dateFrom)}</span>
                            <button
                                onClick={() => onFilterChange({ dateFrom: '' })}
                                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 hover:cursor-pointer" />
                            </button>
                        </div>
                    )}

                    {filters.dateTo && (
                        <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>To: {formatDateDisplay(filters.dateTo)}</span>
                            <button
                                onClick={() => onFilterChange({ dateTo: '' })}
                                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 hover:cursor-pointer" />
                            </button>
                        </div>
                    )}

                    {(filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') && (
                        <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>Sort: {getSortLabel(getSortValue())}</span>
                            <button
                                onClick={() => onFilterChange({ sortBy: 'createdAt', sortOrder: 'desc' })}
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