"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ICourseListItem } from "@/type";
import toast from "react-hot-toast";
import SearchCourses from "./SearchCourses";
import CoursesTable from "./CoursesTable";
import PaginationCourses from "./PaginationCourses";
import CourseModal from "./CourseModal";

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

const CoursesData = () => {
    const [allCourses, setAllCourses] = useState<ICourseListItem[]>([]); // Tất cả courses từ server
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(""); // Input value
    const [searchQuery, setSearchQuery] = useState(""); // Actual search query

    // Client-side pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<ICourseListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch tất cả courses từ server (không phân trang)
    const fetchAllCourses = useCallback(async () => {
        try {
            setIsLoading(true);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/admin/courses?page=1&limit=10`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to fetch courses");
                console.log("Fetching courses failed: ", data.message);
                return;
            }

            setAllCourses(data.courses || []);
        } catch (err: any) {
            toast.error("Error fetching courses");
            console.log(err?.message || err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Filter courses based on search query
    const filteredCourses = useMemo(() => {
        if (!searchQuery.trim()) return allCourses;

        return allCourses.filter(course =>
            course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (Array.isArray(course.categories) && course.categories.some((cat: any) =>
                cat.title?.toLowerCase().includes(searchQuery.toLowerCase())
            )) ||
            (Array.isArray(course.tags) && course.tags.some((tag: string) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
            ))
        );
    }, [allCourses, searchQuery]);

    // Client-side pagination cho filtered courses
    const paginatedCourses = useMemo(() => {
        const startIndex = (page - 1) * limit;
        return filteredCourses.slice(startIndex, startIndex + limit);
    }, [filteredCourses, page, limit]);

    // Pagination info cho filtered courses
    const pagination: PaginationInfo = useMemo(() => {
        const total = filteredCourses.length;
        const totalPages = Math.ceil(total / limit);

        return {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }, [filteredCourses.length, page, limit]);

    // Fetch data khi component mount
    useEffect(() => {
        fetchAllCourses();
    }, [fetchAllCourses]);

    // Reset page khi search query thay đổi
    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    // Search handlers
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

    // Pagination handlers
    const handlePageChange = (nextPage: number) => setPage(nextPage);
    const handleLimitChange = (nextLimit: number) => {
        setPage(1);
        setLimit(nextLimit);
    };

    // Delete handlers
    const handleDeleteClick = (course: ICourseListItem) => {
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

            // Cập nhật danh sách courses sau khi xóa
            setAllCourses(prev => prev.filter(course => course._id !== courseToDelete._id));
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

    return (
        <div className="w-full p-4">
            <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mt-1 uppercase font-semibold">
                    Manage All Courses
                </p>
            </div>

            <SearchCourses
                searchQuery={searchInput}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                onClearSearch={handleClearSearch}
                currentSearch={searchQuery}
            />

            <CoursesTable
                courses={paginatedCourses}
                onDelete={handleDeleteClick}
                isLoading={isLoading}
            />

            {!isLoading && paginatedCourses.length > 0 && (
                <PaginationCourses
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    isLoading={isLoading}
                />
            )}

            {!isLoading && searchQuery && filteredCourses.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        No courses found for "{searchQuery}"
                    </p>
                </div>
            )}

            {!isLoading && allCourses.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        You haven't created any courses yet.
                    </p>
                </div>
            )}

            <CourseModal
                isOpen={isDeleteModalOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                courseName={courseToDelete?.name || ""}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default CoursesData;