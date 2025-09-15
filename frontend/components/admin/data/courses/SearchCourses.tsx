"use client"
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchCoursesProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void;
    onClearSearch: () => void;
    currentSearch?: string; // Giá trị search hiện tại đang được áp dụng
}

const SearchCourses = ({
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    onClearSearch,
    currentSearch = "",
}: SearchCoursesProps) => {
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

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between py-4">
            <form onSubmit={handleSubmit} className="relative flex-1 max-w-sm">
                <div className="relative flex">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            className="pl-10 pr-10 border border-gray-300 dark:border-slate-500"
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
                        className="ml-2 px-4 py-2"
                        disabled={!searchQuery.trim()}
                    >
                        Search
                    </Button>
                </div>
            </form>

            {currentSearch && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    Showing results for: <span className="font-medium">"{currentSearch}"</span>
                </div>
            )}
        </div>
    );
};

export default SearchCourses;