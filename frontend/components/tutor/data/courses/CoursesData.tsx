"use client";

import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import SearchCourses from "./SearchCourses";
import CoursesTable from "./CoursesTable";
import PaginationCourses from "./PaginationCourses";
import DeleteCourseModal from "./DeleteCourseModal";

interface PaginationInfo {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

interface ICategory {
    _id: string;
    title: string;
}

interface IThumbnail {
    public_id: string;
    url: string;
}

interface ICreator {
    _id: string;
    name: string;
    email: string;
    avatar: {
        public_id?: string;
        url: string;
    };
    bio?: string;
}

interface ICourseData {
    _id: string;
    name: string;
    description: string;
    categories: ICategory[];
    price: number;
    estimatedPrice: number;
    thumbnail: IThumbnail;
    tags: string;
    level: string;
    ratings: number;
    purchased: number;
    creatorId: ICreator;
    createdAt: string;
    updatedAt: string;
}

interface FilterState {
    sortBy: string;
    sortOrder: string;
}

const CoursesData = () => {
    const [allCourses, setAllCourses] = useState<ICourseData[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 10
    });
    const [loading, setLoading] = useState(false);

    // Search states
    const [searchInput, setSearchInput] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    // Filter states
    const [draftFilters, setDraftFilters] = useState<FilterState>({
        sortBy: "createdAt",
        sortOrder: "desc"
    });

    const [appliedFilters, setAppliedFilters] = useState<FilterState>({
        sortBy: "createdAt",
        sortOrder: "desc"
    });

    // Modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<ICourseData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Build query parameters
    const buildQueryParams = useCallback(() => {
        const params = new URLSearchParams();

        // Always include page and limit
        params.set('page', pagination.currentPage.toString());
        params.set('limit', pagination.pageSize.toString());

        // Add search keyword if present
        if (appliedSearch.trim()) {
            params.set('keyword', appliedSearch.trim());
        }

        // Add sort parameters
        if (appliedFilters.sortBy && appliedFilters.sortBy !== 'default') {
            params.set('sortBy', appliedFilters.sortBy);
            params.set('sortOrder', appliedFilters.sortOrder);
        }

        return params.toString();
    }, [pagination.currentPage, pagination.pageSize, appliedSearch, appliedFilters]);

    // Fetch courses from API
    const handleFetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = buildQueryParams();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/tutor/my_courses?${queryParams}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: 'include',
                }
            );

            const coursesData = await res.json();

            if (!res.ok) {
                toast.error(coursesData.message || "Failed to fetch courses");
                console.log("Fetching courses failed: ", coursesData.message);
                return;
            }

            setAllCourses(coursesData.paginatedResult.data || []);
            setPagination({
                totalItems: coursesData.paginatedResult.meta.totalItems,
                totalPages: coursesData.paginatedResult.meta.totalPages,
                currentPage: coursesData.paginatedResult.meta.currentPage,
                pageSize: coursesData.paginatedResult.meta.pageSize
            });
        } catch (error: any) {
            toast.error("Error fetching courses");
            console.log("Get all courses error:", error?.message || error);
        } finally {
            setLoading(false);
        }
    }, [buildQueryParams]);

    // Fetch data when component mounts or when dependencies change
    useEffect(() => {
        handleFetchCourses();
    }, [handleFetchCourses]);

    const handleDraftFiltersChange = (newFilers: Partial<FilterState>) => {
        setDraftFilters(prev => ({ ...prev, ...newFilers }));
    }

    const handleApplyFilters = () => {
        setAppliedFilters(draftFilters);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
    };

    const handleSearchSubmit = () => {
        const trimmed = searchInput.trim();
        setSearchInput(trimmed);
        setAppliedSearch(trimmed); // Thêm dòng này để trigger fetch API
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset về trang 1 khi search mới
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setAppliedSearch("");
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleClearFilters = () => {
        const defaultFilters: FilterState = {
            sortBy: "createdAt",
            sortOrder: "desc"
        };

        setDraftFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleRemoveSortFilter = () => {
        setDraftFilters(prev => ({
            ...prev,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        }));
        setAppliedFilters(prev => ({
            ...prev,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
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

    // Delete handlers
    const handleDeleteClick = (course: ICourseData) => {
        setCourseToDelete(course);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!courseToDelete) return;

        try {
            setIsDeleting(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/delete_course/${courseToDelete._id}`,
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to delete course");
                console.log("Delete course failed: ", data.message);
                return;
            }

            toast.success("Course deleted successfully");
            setIsDeleteModalOpen(false);
            setCourseToDelete(null);

            // Refresh courses list after deletion
            handleFetchCourses();
        } catch (err: any) {
            toast.error("Error deleting course");
            console.log(err?.message || err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
        setCourseToDelete(null);
    };

    // Create pagination info for the PaginationCourses component
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
                    Manage and track all courses
                </p>
            </div>

            <SearchCourses
                searchQuery={searchInput}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                onClearSearch={handleClearSearch}
                currentSearch={appliedSearch}
                // Filter props
                filters={draftFilters}
                appliedFilters={appliedFilters}
                onFilterChange={handleDraftFiltersChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                onRemoveSortFilter={handleRemoveSortFilter}
            />

            <CoursesTable
                courses={allCourses}
                onDelete={handleDeleteClick}
                isLoading={loading}
            />

            {!loading && allCourses.length > 0 && (
                <PaginationCourses
                    pagination={paginationInfo}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    isLoading={loading}
                />
            )}

            <DeleteCourseModal
                isOpen={isDeleteModalOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                courseName={courseToDelete?.name || ""}
                courseId={courseToDelete?._id || ""}
            />
        </div>
    );
};

export default CoursesData;