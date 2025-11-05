"use client";

import React from 'react';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';

interface AllNotificationsPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const AllNotificationsPagination = ({
    currentPage,
    totalPages,
    onPageChange
}: AllNotificationsPaginationProps) => {
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 13;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 7) {
                for (let i = 1; i <= 11; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 6) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 10; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 4; i <= currentPage + 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePageClick = (page: number | string) => {
        if (typeof page === 'number') {
            onPageChange(page);
        }
    };

    return (
        <div className="flex items-center justify-center gap-1 my-8 py-4">
            {/* Previous Button */}
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${currentPage === 1
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer'
                    }`}
            >
                <MdNavigateBefore size={20} />
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((page, index) => (
                <button
                    key={index}
                    onClick={() => handlePageClick(page)}
                    className={`flex items-center justify-center min-w-9 h-9 px-2 rounded-md text-sm font-medium transition-colors ${page === currentPage
                        ? 'bg-blue-500 text-white'
                        : page === '...'
                            ? 'bg-transparent text-gray-400 dark:text-gray-600 cursor-default'
                            : 'bg-white dark:bg-gray-800 text-gray-700 border dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                        }`}
                >
                    {page}
                </button>
            ))}

            {/* Next Button */}
            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${currentPage === totalPages
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer'
                    }`}
            >
                <MdNavigateNext size={20} />
            </button>
        </div>
    );
};

export default AllNotificationsPagination;