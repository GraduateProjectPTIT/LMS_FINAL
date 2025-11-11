"use client"
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterState {
    sortBy: string;
    sortOrder: string;
    status: string;
}

interface SearchCoursesProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void;
    onClearSearch: () => void;
    currentSearch?: string;
    filters: FilterState; // Draft filters
    appliedFilters: FilterState; // Applied filters
    onFilterChange: (filters: Partial<FilterState>) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
    onRemoveSortFilter: () => void;
    onRemoveStatusFilter: () => void;
}

const SearchCourses = ({
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    onClearSearch,
    currentSearch = "",
    filters,
    appliedFilters,
    onFilterChange,
    onApplyFilters,
    onClearFilters,
    onRemoveSortFilter,
    onRemoveStatusFilter
}: SearchCoursesProps) => {
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

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;

        // Parse the combined sort value
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

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ status: e.target.value });
    };

    const handleApplyClick = () => {
        onApplyFilters();
        setIsFilterOpen(false);
    }

    // Kiểm tra active filters dựa trên appliedFilters
    const hasActiveFilters = (
        appliedFilters.sortBy !== 'createdAt' ||
        appliedFilters.sortOrder !== 'desc' ||
        appliedFilters.status !== 'all'
    );

    const getActiveFiltersCount = () => {
        let count = 0;
        if (appliedFilters.sortBy !== 'createdAt' || appliedFilters.sortOrder !== 'desc') count++;
        if (appliedFilters.status !== 'all') count++;
        return count;
    };

    // Kiểm tra xem có thay đổi giữa draft và applied filters không
    const hasUnappliedChanges = () => {
        return JSON.stringify(filters) !== JSON.stringify(appliedFilters);
    }

    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
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
            'default': 'Default (Newest)',
            'name-asc': 'Name: A to Z',
            'name-desc': 'Name: Z to A',
            'date-newest': 'Newest',
            'date-oldest': 'Oldest',
        };
        return sortLabels[value] || value;
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
                                placeholder="Search courses by name or tags..."
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
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Course Filters</h3>
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
                            {/* Sort By Filter */}
                            <div className="flex flex-col gap-2">
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
                                        <option value="name-asc">Name: A to Z</option>
                                        <option value="name-desc">Name: Z to A</option>
                                        <option value="date-newest">Newest</option>
                                        <option value="date-oldest">Oldest</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.status}
                                        onChange={handleStatusChange}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                        <option value="retired">Retired</option>
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

                    {(appliedFilters.sortBy !== 'createdAt' || appliedFilters.sortOrder !== 'desc') && (
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

export default SearchCourses;