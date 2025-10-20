"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface PaginationStudentsProps {
    pagination: PaginationInfo;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    isLoading?: boolean;
}

const PaginationStudents = ({
    pagination,
    onPageChange,
    onLimitChange,
    isLoading = false
}: PaginationStudentsProps) => {
    const { page, limit, total, totalPages, hasNextPage, hasPrevPage } = pagination;

    const handleFirstPage = () => {
        if (!hasPrevPage) return;
        onPageChange(1);
    };

    const handlePrevPage = () => {
        if (!hasPrevPage) return;
        onPageChange(page - 1);
    };

    const handleNextPage = () => {
        if (!hasNextPage) return;
        onPageChange(page + 1);
    };

    const handleLastPage = () => {
        if (!hasNextPage) return;
        onPageChange(totalPages);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLimit = Number(e.target.value);
        onLimitChange(newLimit);
    };

    return (
        <div className="flex flex-row items-center justify-between gap-2 md:gap-4 py-4">
            {/* Page size selector */}
            <div className="flex items-center space-x-2">
                <span className="hidden md:block text-sm text-gray-600 dark:text-gray-300">
                    Rows per page:
                </span>
                <span className="block md:hidden text-sm text-gray-600 dark:text-gray-300">
                    Rows :
                </span>
                <select
                    value={limit}
                    onChange={handleLimitChange}
                    disabled={isLoading}
                    className="border border-gray-300 dark:border-slate-500 rounded px-2 py-1 text-sm bg-white dark:bg-slate-800 disabled:opacity-50"
                >
                    {[5, 10, 20, 30, 40, 50].map(size => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center space-x-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFirstPage}
                    disabled={!hasPrevPage || isLoading}
                    className="h-8 w-8 p-0 hover:cursor-pointer"
                    title="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={!hasPrevPage || isLoading}
                    className="h-8 w-8 p-0 hover:cursor-pointer"
                    title="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-1 px-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        Page {page} of {totalPages}
                    </span>
                    <span className="hidden md:inline text-sm text-gray-500 dark:text-gray-400">
                        ({total} students)
                    </span>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasNextPage || isLoading}
                    className="h-8 w-8 p-0 hover:cursor-pointer"
                    title="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLastPage}
                    disabled={!hasNextPage || isLoading}
                    className="h-8 w-8 p-0 hover:cursor-pointer"
                    title="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default PaginationStudents;