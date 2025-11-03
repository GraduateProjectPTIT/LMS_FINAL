import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface MyCoursesPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (itemsPerPage: number) => void;
}

const MyCoursesPagination = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
}: MyCoursesPaginationProps) => {
    const getVisiblePages = () => {
        if (totalPages <= 1) return [1];

        const delta = 2;
        const middle: number[] = [];

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            middle.push(i);
        }

        const pages: (number | string)[] = [1];

        if (middle.length && middle[0] > 2) pages.push('...');
        pages.push(...middle);
        if (middle.length && middle[middle.length - 1] < totalPages - 1) pages.push('...');

        if (totalPages > 1) pages.push(totalPages);
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            {/* Items per page */}
            <div className="flex items-center gap-4">
                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Items per page:
                        </span>
                        <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
                            <SelectTrigger className="w-20 h-8 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
                                <SelectItem value="5" className="hover:bg-slate-50 dark:hover:bg-slate-700">5</SelectItem>
                                <SelectItem value="10" className="hover:bg-slate-50 dark:hover:bg-slate-700">10</SelectItem>
                                <SelectItem value="20" className="hover:bg-slate-50 dark:hover:bg-slate-700">20</SelectItem>
                                <SelectItem value="30" className="hover:bg-slate-50 dark:hover:bg-slate-700">30</SelectItem>
                                <SelectItem value="50" className="hover:bg-slate-50 dark:hover:bg-slate-700">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-1 flex items-center gap-1">
                    {/* First Page */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1 || totalPages === 1}
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    {/* Previous Page */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || totalPages === 1}
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page Numbers */}
                    {getVisiblePages().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <span className="px-2 py-1 text-slate-500 dark:text-slate-400 text-sm">
                                    ...
                                </span>
                            ) : (
                                <button
                                    onClick={() => onPageChange(page as number)}
                                    className={`h-8 rounded-[10px] min-w-[32px] px-2 text-sm transition-all hover:cursor-pointer ${currentPage === page
                                        ? 'bg-gray-300 dark:bg-slate-300 text-slate-700 dark:text-slate-900 shadow-sm'
                                        : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}

                    {/* Next Page */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 1}
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Last Page */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 1}
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MyCoursesPagination;