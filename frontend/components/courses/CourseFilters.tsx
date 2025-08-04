import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Filter, ChevronUp, ChevronDown } from 'lucide-react';

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

const CourseFilters = ({
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
}: CourseFiltersProps) => {

    const [openShowFilters, setOpenShowFilters] = useState(true);


    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
                <div className='flex justify-between items-center'>
                    <div className="flex items-center gap-3">
                        <Filter className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                            Filter Courses
                        </h3>
                    </div>
                    <ChevronDown
                        onClick={() => setOpenShowFilters(!openShowFilters)}
                        className={`hover:cursor-pointer transition-transform duration-300 ${openShowFilters ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${openShowFilters ? 'max-h-[900px] opacity-100 p-6' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className='flex flex-col lg:flex-row lg:items-center gap-4'>
                        {/* Category Filter */}
                        <Select value={categoryFilter} onValueChange={onCategoryChange}>
                            <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-700 focus:border-slate-500 dark:focus:border-slate-400 rounded-lg">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
                                <SelectItem value="all" className="hover:bg-slate-50 dark:hover:bg-slate-700">All Categories</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Level Filter */}
                        <Select value={levelFilter} onValueChange={onLevelChange}>
                            <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-700 focus:border-slate-500 dark:focus:border-slate-400 rounded-lg">
                                <SelectValue placeholder="All Levels" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
                                <SelectItem value="all" className="hover:bg-slate-50 dark:hover:bg-slate-700">All Levels</SelectItem>
                                {levels.map((level) => (
                                    <SelectItem key={level} value={level} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                        {level}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Price Filter */}
                        <Select value={priceFilter} onValueChange={onPriceChange}>
                            <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-700 focus:border-slate-500 dark:focus:border-slate-400 rounded-lg">
                                <SelectValue placeholder="All Prices" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
                                <SelectItem value="all" className="hover:bg-slate-50 dark:hover:bg-slate-700">All Prices</SelectItem>
                                <SelectItem value="free" className="hover:bg-slate-50 dark:hover:bg-slate-700">Free</SelectItem>
                                <SelectItem value="0-25" className="hover:bg-slate-50 dark:hover:bg-slate-700">$0 - $25</SelectItem>
                                <SelectItem value="25-50" className="hover:bg-slate-50 dark:hover:bg-slate-700">$25 - $50</SelectItem>
                                <SelectItem value="50-100" className="hover:bg-slate-50 dark:hover:bg-slate-700">$50 - $100</SelectItem>
                                <SelectItem value="100+" className="hover:bg-slate-50 dark:hover:bg-slate-700">$100+</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort By */}
                        <Select value={sortBy} onValueChange={onSortChange}>
                            <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-700 focus:border-slate-500 dark:focus:border-slate-400 rounded-lg">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
                                <SelectItem value="default" className="hover:bg-slate-50 dark:hover:bg-slate-700">Default</SelectItem>
                                <SelectItem value="price-low" className="hover:bg-slate-50 dark:hover:bg-slate-700">Price: Low to High</SelectItem>
                                <SelectItem value="price-high" className="hover:bg-slate-50 dark:hover:bg-slate-700">Price: High to Low</SelectItem>
                                <SelectItem value="rating" className="hover:bg-slate-50 dark:hover:bg-slate-700">Highest Rated</SelectItem>
                                <SelectItem value="popularity" className="hover:bg-slate-50 dark:hover:bg-slate-700">Most Popular</SelectItem>
                            </SelectContent>
                        </Select>

                    </div>

                    <div className="">
                        <Button
                            variant="outline"
                            onClick={onClearFilters}
                            className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                            <X className="h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default CourseFilters;