import React, { useState } from 'react';
import { Button } from '../ui/button';
import { FaSearch } from 'react-icons/fa';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterState {
    filterStatus: 'all' | 'in-progress' | 'completed';
    selectedCategory: string;
    selectedLevel: string;
    sortBy: string;
}

interface MyCoursesFilterProps {
    searchInput: string;
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void;
    onClearSearch: () => void;
    currentSearch: string;
    draftFilters: FilterState;
    appliedFilters: FilterState;
    onFilterChange: (filters: Partial<FilterState>) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
    onRemoveStatusFilter: () => void;
    onRemoveCategoryFilter: () => void;
    onRemoveLevelFilter: () => void;
    onRemoveSortFilter: () => void;
    categories: { _id: string; title: string }[];
    levels: string[];
}

const MyCoursesFilter = ({
    searchInput,
    onSearchChange,
    onSearchSubmit,
    onClearSearch,
    currentSearch,
    draftFilters,
    appliedFilters,
    onFilterChange,
    onApplyFilters,
    onClearFilters,
    onRemoveStatusFilter,
    onRemoveCategoryFilter,
    onRemoveLevelFilter,
    onRemoveSortFilter,
    categories,
    levels
}: MyCoursesFilterProps) => {
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

    const handleApplyClick = () => {
        onApplyFilters();
        setIsFilterOpen(false);
    };

    // Kiểm tra active filters dựa trên appliedFilters
    const hasActiveFilters =
        appliedFilters.filterStatus !== 'all' ||
        appliedFilters.selectedCategory !== 'all' ||
        appliedFilters.selectedLevel !== 'all' ||
        appliedFilters.sortBy !== 'enrolledAt-desc';

    const getActiveFiltersCount = () => {
        let count = 0;
        if (appliedFilters.filterStatus !== 'all') count++;
        if (appliedFilters.selectedCategory !== 'all') count++;
        if (appliedFilters.selectedLevel !== 'all') count++;
        if (appliedFilters.sortBy !== 'enrolledAt-desc') count++;
        return count;
    };

    // Kiểm tra xem có thay đổi giữa draft và applied filters không
    const hasUnappliedChanges = () => {
        return JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);
    };

    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'in-progress': return 'In Progress';
            case 'completed': return 'Completed';
            default: return 'All';
        }
    };

    const getSortLabel = (sort: string) => {
        switch (sort) {
            case 'enrolledAt-desc': return 'Recently Enrolled';
            case 'enrolledAt-asc': return 'Oldest Enrolled';
            case 'name-asc': return 'Name (A-Z)';
            case 'name-desc': return 'Name (Z-A)';
            case 'ratings-desc': return 'Highest Rating';
            case 'ratings-asc': return 'Lowest Rating';
            default: return sort;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
            <div className="p-4 sm:p-6">
                {/* Search Bar - Always visible */}
                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search courses or instructors..."
                                value={searchInput}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyPress}
                                className="w-full h-[40px] pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={onClearSearch}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={toggleFilter}
                            className="flex items-center h-[40px] gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-gray-300 dark:border-slate-600 rounded-md cursor-pointer hover:opacity-75"
                        >
                            <Filter className="w-5 h-5" />
                            <span className="">Filters</span>
                            {hasActiveFilters && (
                                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                    {getActiveFiltersCount()}
                                </span>
                            )}
                            {isFilterOpen ? (
                                <ChevronUp className="w-4 h-4 ml-1" />
                            ) : (
                                <ChevronDown className="w-4 h-4 ml-1" />
                            )}
                        </button>
                    </div>
                </form>

                {/* Current Search Display */}
                {currentSearch && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                        Showing results for: <span className="font-semibold text-blue-800 dark:text-blue-200">"{currentSearch}"</span>
                    </div>
                )}

                {/* Filter Toggle Button */}
                <div className="flex items-center justify-between">
                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Clear All
                        </button>
                    )}
                </div>

                {/* Collapsible Filter Section */}
                {isFilterOpen && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Status Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={draftFilters.filterStatus}
                                        onChange={(e) => onFilterChange({ filterStatus: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100 appearance-none pr-10"
                                    >
                                        <option value="all">All Courses</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Category
                                </label>
                                <div className="relative">
                                    <select
                                        value={draftFilters.selectedCategory}
                                        onChange={(e) => onFilterChange({ selectedCategory: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100 appearance-none pr-10"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.title}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Level Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Level
                                </label>
                                <div className="relative">
                                    <select
                                        value={draftFilters.selectedLevel}
                                        onChange={(e) => onFilterChange({ selectedLevel: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100 appearance-none pr-10"
                                    >
                                        <option value="all">All Levels</option>
                                        {levels.map((level) => (
                                            <option key={level} value={level}>
                                                {level}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Sort By */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Sort By
                                </label>
                                <div className="relative">
                                    <select
                                        value={draftFilters.sortBy}
                                        onChange={(e) => onFilterChange({ sortBy: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100 appearance-none pr-10"
                                    >
                                        <option value="enrolledAt-desc">Recently Enrolled</option>
                                        <option value="enrolledAt-asc">Oldest Enrolled</option>
                                        <option value="name-asc">Name (A-Z)</option>
                                        <option value="name-desc">Name (Z-A)</option>
                                        <option value="ratings-desc">Highest Rating</option>
                                        <option value="ratings-asc">Lowest Rating</option>
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
                )}

                {/* Active Filters Display - dựa trên appliedFilters */}
                {hasActiveFilters && !isFilterOpen && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Active filters:</span>

                            {appliedFilters.filterStatus !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                    Status: {getStatusLabel(appliedFilters.filterStatus)}
                                    <button
                                        onClick={onRemoveStatusFilter}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}

                            {appliedFilters.selectedCategory !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full">
                                    Category: {categories.find(c => c._id === appliedFilters.selectedCategory)?.title || appliedFilters.selectedCategory}
                                    <button
                                        onClick={onRemoveCategoryFilter}
                                        className="hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}

                            {appliedFilters.selectedLevel !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                                    Level: {appliedFilters.selectedLevel}
                                    <button
                                        onClick={onRemoveLevelFilter}
                                        className="hover:bg-purple-200 dark:hover:bg-purple-800/50 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}

                            {appliedFilters.sortBy !== 'enrolledAt-desc' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                                    Sort: {getSortLabel(appliedFilters.sortBy)}
                                    <button
                                        onClick={onRemoveSortFilter}
                                        className="hover:bg-orange-200 dark:hover:bg-orange-800/50 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCoursesFilter;