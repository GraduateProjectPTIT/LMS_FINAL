import React from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

interface CourseFiltersProps {
    categoryFilter: string;
    onCategoryChange: (value: string) => void;
    levelFilter: string;
    onLevelChange: (value: string) => void;
    priceFilter: string;
    onPriceChange: (value: string) => void;
    sortBy: string;
    onSortChange: (value: string) => void;
    onClearFilters: () => void;
    categories: string[];
    levels: string[];
}

const CourseFilters: React.FC<CourseFiltersProps> = ({
    categoryFilter,
    onCategoryChange,
    levelFilter,
    onLevelChange,
    priceFilter,
    onPriceChange,
    sortBy,
    onSortChange,
    onClearFilters,
    categories,
    levels,
}) => {
    // Check if any filters are active (excluding default values)
    const hasActiveFilters =
        categoryFilter !== 'all' ||
        levelFilter !== 'all' ||
        priceFilter !== 'all' ||
        sortBy !== 'default';

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Filters</h3>
                </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Category
                    </label>
                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100 appearance-none pr-10"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
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
                            value={levelFilter}
                            onChange={(e) => onLevelChange(e.target.value)}
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

                {/* Price Filter */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Price Range
                    </label>
                    <div className="relative">
                        <select
                            value={priceFilter}
                            onChange={(e) => onPriceChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100 appearance-none pr-10"
                        >
                            <option value="all">All Prices</option>
                            <option value="free">Free</option>
                            <option value="0-25">$0 - $25</option>
                            <option value="25-50">$25 - $50</option>
                            <option value="50-100">$50 - $100</option>
                            <option value="100+">$100+</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Sort Filter */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Sort By
                    </label>
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100 appearance-none pr-10"
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

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Active filters:</span>

                        {categoryFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                Category: {categoryFilter}
                                <button
                                    onClick={() => onCategoryChange('all')}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {levelFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full">
                                Level: {levelFilter}
                                <button
                                    onClick={() => onLevelChange('all')}
                                    className="hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {priceFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                                Price: {priceFilter === 'free' ? 'Free' :
                                    priceFilter === '0-25' ? '$0-$25' :
                                        priceFilter === '25-50' ? '$25-$50' :
                                            priceFilter === '50-100' ? '$50-$100' :
                                                priceFilter === '100+' ? '$100+' : priceFilter}
                                <button
                                    onClick={() => onPriceChange('all')}
                                    className="hover:bg-purple-200 dark:hover:bg-purple-800/50 rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {sortBy !== 'default' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                                Sort: {sortBy === 'price-low' ? 'Price Low-High' :
                                    sortBy === 'price-high' ? 'Price High-Low' :
                                        sortBy === 'rating' ? 'Highest Rated' :
                                            sortBy === 'popularity' ? 'Most Popular' : sortBy}
                                <button
                                    onClick={() => onSortChange('default')}
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
    );
};

export default CourseFilters;