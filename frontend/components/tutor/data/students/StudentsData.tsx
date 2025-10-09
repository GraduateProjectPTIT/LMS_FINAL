"use client";

import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import SearchStudents from "./SearchStudents";
import StudentsTable from "./StudentsTable";
import PaginationStudents from "./PaginationStudents";

interface PaginationInfo {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

interface IAvatar {
    public_id?: string;
    url: string;
}

interface IUser {
    _id: string;
    name: string;
    email: string;
    avatar: IAvatar;
}

interface IStudentData {
    _id: string;
    userId: IUser;
    progress: number;
    completed: boolean;
    enrolledAt: string;
}

interface FilterState {
    sortBy: string;
    sortOrder: string;
}

interface StudentsDataProps {
    courseId: string;
}

const StudentsData = ({ courseId }: StudentsDataProps) => {

    const [allStudents, setAllStudents] = useState<IStudentData[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 10
    });
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter states
    const [filters, setFilters] = useState<FilterState>({
        sortBy: "createdAt",
        sortOrder: "desc"
    });

    // Build query parameters
    const buildQueryParams = useCallback(() => {
        const params = new URLSearchParams();

        // Always include page and limit
        params.set('page', pagination.currentPage.toString());
        params.set('limit', pagination.pageSize.toString());

        // Add search keyword if present
        if (searchQuery.trim()) {
            params.set('keyword', searchQuery.trim());
        }

        // Add sort parameters
        if (filters.sortBy && filters.sortBy !== 'default') {
            params.set('sortBy', filters.sortBy);
            params.set('sortOrder', filters.sortOrder);
        }

        return params.toString();
    }, [pagination.currentPage, pagination.pageSize, searchQuery, filters]);

    // Fetch students from API
    const handleFetchStudents = useCallback(async () => {
        if (!courseId) {
            toast.error("Course ID is required");
            return;
        }

        setLoading(true);
        try {
            const queryParams = buildQueryParams();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/${courseId}/students?${queryParams}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: 'include',
                }
            );

            const studentsData = await res.json();

            if (!res.ok) {
                toast.error(studentsData.message || "Failed to fetch students");
                console.log("Fetching students failed: ", studentsData.message);
                return;
            }

            setAllStudents(studentsData.paginatedResult.data || []);
            setPagination({
                totalItems: studentsData.paginatedResult.meta.totalItems,
                totalPages: studentsData.paginatedResult.meta.totalPages,
                currentPage: studentsData.paginatedResult.meta.currentPage,
                pageSize: studentsData.paginatedResult.meta.pageSize
            });
        } catch (error: any) {
            toast.error("Error fetching students");
            console.log("Get all students error:", error?.message || error);
        } finally {
            setLoading(false);
        }
    }, [courseId, buildQueryParams]);

    // Fetch data when component mounts or when dependencies change
    useEffect(() => {
        handleFetchStudents();
    }, [handleFetchStudents]);

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        if (pagination.currentPage !== 1) {
            setPagination(prev => ({ ...prev, currentPage: 1 }));
        }
    }, [searchQuery, filters]);

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
    };

    const handleSearchSubmit = () => {
        setSearchQuery(searchInput.trim());
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setSearchQuery("");
    };

    const handleFilterChange = (newFilters: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleClearFilters = () => {
        setFilters({
            sortBy: "createdAt",
            sortOrder: "desc"
        });
    };

    // Pagination handlers
    const handlePageChange = (nextPage: number) => {
        setPagination(prev => ({ ...prev, currentPage: nextPage }));
    };

    const handleLimitChange = (nextLimit: number) => {
        setPagination(prev => ({
            ...prev,
            currentPage: 1,
            pageSize: nextLimit
        }));
    };

    // Create pagination info for the PaginationStudents component
    const paginationInfo = {
        page: pagination.currentPage,
        limit: pagination.pageSize,
        total: pagination.totalItems,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.currentPage < pagination.totalPages,
        hasPrevPage: pagination.currentPage > 1,
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mt-1 uppercase font-semibold">
                    Manage and track all students in this course
                </p>
            </div>

            <SearchStudents
                searchQuery={searchInput}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                onClearSearch={handleClearSearch}
                currentSearch={searchQuery}
                // Filter props
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            <StudentsTable
                students={allStudents}
                isLoading={loading}
            />

            {!loading && allStudents.length > 0 && (
                <PaginationStudents
                    pagination={paginationInfo}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    isLoading={loading}
                />
            )}
        </div>
    );
};

export default StudentsData;