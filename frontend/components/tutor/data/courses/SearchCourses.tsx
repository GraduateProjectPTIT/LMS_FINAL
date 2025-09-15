"use client"
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ICategory {
    _id: string;
    title: string;
}

interface FilterState {
    selectedLevel: string;
    selectedCategory: string;
    priceRange: string;
    sortBy: string;
}

interface SearchCoursesProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void;
    onClearSearch: () => void;
    currentSearch?: string;
    // Filter props
    levels: string[];
    categories: ICategory[];
    filters: FilterState;
    onFilterChange: (filters: Partial<FilterState>) => void;
    onClearFilters: () => void;
}

const SearchCourses = ({
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    onClearSearch,
    currentSearch = "",
    levels,
    categories,
    filters,
    onFilterChange,
    onClearFilters,
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

    const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ selectedLevel: e.target.value });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ selectedCategory: e.target.value });
    };

    const handlePriceRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ priceRange: e.target.value });
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ sortBy: e.target.value });
    };

    const hasActiveFilters = filters.selectedLevel || filters.selectedCategory ||
        (filters.priceRange && filters.priceRange !== 'all') ||
        (filters.sortBy && filters.sortBy !== 'default');

    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.selectedLevel) count++;
        if (filters.selectedCategory) count++;
        if (filters.priceRange && filters.priceRange !== 'all') count++;
        if (filters.sortBy && filters.sortBy !== 'default') count++;
        return count;
    };

    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };

    const getPriceRangeLabel = (value: string) => {
        const priceLabels: Record<string, string> = {
            'all': 'All Prices',
            '0-25': '$0 - $25',
            '25-50': '$25 - $50',
            '50-100': '$50 - $100',
            '100+': '$100+'
        };
        return priceLabels[value] || value;
    };

    const getSortLabel = (value: string) => {
        const sortLabels: Record<string, string> = {
            'default': 'Default',
            'price-low': 'Price: Low to High',
            'price-high': 'Price: High to Low',
            'date-newest': 'Newest',
            'date-oldest': 'Oldest',
            'rating': 'Highest Rated',
            'popularity': 'Most Popular'
        };
        return sortLabels[value] || value;
    };

    return (
        <div className="py-4 space-y-4">
            {/* Search and Filter Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Search Section - Left */}
                <form onSubmit={handleSubmit} className="relative flex-1 max-w-md">
                    <div className="relative flex">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search courses..."
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
                            className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={!searchQuery.trim()}
                        >
                            Search
                        </Button>
                    </div>
                </form>

                {/* Filter Toggle Button - Right */}
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={toggleFilter}
                        className="flex items-center gap-2 border-gray-300 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
                            {hasActiveFilters && (
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {getActiveFiltersCount()} active filter{getActiveFiltersCount() !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Level Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Level
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.selectedLevel}
                                        onChange={handleLevelChange}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                                    >
                                        <option value="">All Levels</option>
                                        {levels.map(level => (
                                            <option key={level} value={level}>
                                                {level}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Category
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.selectedCategory}
                                        onChange={handleCategoryChange}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(category => (
                                            <option key={category._id} value={category._id}>
                                                {category.title}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Price Range Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Price Range
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.priceRange || 'all'}
                                        onChange={handlePriceRangeChange}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                                    >
                                        <option value="all">All Prices</option>
                                        <option value="0-25">$0 - $25</option>
                                        <option value="25-50">$25 - $50</option>
                                        <option value="50-100">$50 - $100</option>
                                        <option value="100+">$100+</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Sort By Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Sort By
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.sortBy || 'default'}
                                        onChange={handleSortChange}
                                        className="w-full border border-gray-300 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                                    >
                                        <option value="default">Default</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="date-newest">Newest</option>
                                        <option value="date-oldest">Oldest</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="popularity">Most Popular</option>
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                                Reset All Filters
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={toggleFilter}
                                    className="border-gray-300 dark:border-slate-800"
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    onClick={toggleFilter}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
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

                    {filters.selectedLevel && (
                        <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>Level: {filters.selectedLevel}</span>
                            <button
                                onClick={() => onFilterChange({ selectedLevel: "" })}
                                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {filters.selectedCategory && (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>Category: {categories.find(cat => cat._id === filters.selectedCategory)?.title}</span>
                            <button
                                onClick={() => onFilterChange({ selectedCategory: "" })}
                                className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {filters.priceRange && filters.priceRange !== 'all' && (
                        <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>Price: {getPriceRangeLabel(filters.priceRange)}</span>
                            <button
                                onClick={() => onFilterChange({ priceRange: 'all' })}
                                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {filters.sortBy && filters.sortBy !== 'default' && (
                        <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span>Sort: {getSortLabel(filters.sortBy)}</span>
                            <button
                                onClick={() => onFilterChange({ sortBy: 'default' })}
                                className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchCourses;