"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
        public_id: string;
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
    selectedLevel: string;
    selectedCategory: string;
    priceRange: string;
    sortBy: string;
}

const CoursesData = () => {
    const [allCourses, setAllCourses] = useState<ICourseData[]>([]);
    const [levels, setLevels] = useState<string[]>([]);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter states
    const [filters, setFilters] = useState<FilterState>({
        selectedLevel: "",
        selectedCategory: "",
        priceRange: "all",
        sortBy: "default"
    });

    // Client-side pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<ICourseData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch all courses from server
    const fetchAllCourses = useCallback(async () => {
        try {
            setIsLoading(true);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/tutor/my_courses`,
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

    // Fetch levels
    const fetchLevels = useCallback(async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/levels`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            const data = await res.json();

            if (res.ok && data.success) {
                setLevels(data.levels || []);
            }
        } catch (err: any) {
            console.log("Error fetching levels:", err?.message || err);
        }
    }, []);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/categories`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            const data = await res.json();

            if (res.ok && data.success) {
                setCategories(data.categories || []);
            }
        } catch (err: any) {
            console.log("Error fetching categories:", err?.message || err);
        }
    }, []);

    // Helper function to parse price range
    const getPriceRangeFilter = (priceRange: string) => {
        switch (priceRange) {
            case '0-25':
                return { min: 0, max: 25 };
            case '25-50':
                return { min: 25, max: 50 };
            case '50-100':
                return { min: 50, max: 100 };
            case '100+':
                return { min: 100, max: Infinity };
            default:
                return { min: 0, max: Infinity };
        }
    };

    // Sort function
    const sortCourses = (courses: ICourseData[], sortBy: string) => {
        if (sortBy === 'default') return courses;

        const sorted = [...courses];

        switch (sortBy) {
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            case 'date-newest':
                return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case 'date-oldest':
                return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case 'rating':
                return sorted.sort((a, b) => b.ratings - a.ratings);
            case 'popularity':
                return sorted.sort((a, b) => b.purchased - a.purchased);
            default:
                return sorted;
        }
    };

    // Filter and search courses
    const filteredCourses = useMemo(() => {
        let filtered = allCourses;

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(course =>
                course.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply level filter
        if (filters.selectedLevel) {
            filtered = filtered.filter(course =>
                course.level === filters.selectedLevel
            );
        }

        // Apply category filter
        if (filters.selectedCategory) {
            filtered = filtered.filter(course =>
                Array.isArray(course.categories) &&
                course.categories.some(cat => cat._id === filters.selectedCategory)
            );
        }

        // Apply price range filter
        if (filters.priceRange && filters.priceRange !== 'all') {
            const { min, max } = getPriceRangeFilter(filters.priceRange);
            filtered = filtered.filter(course =>
                course.price >= min && course.price <= max
            );
        }

        // Apply sorting
        if (filters.sortBy && filters.sortBy !== 'default') {
            filtered = sortCourses(filtered, filters.sortBy);
        }

        return filtered;
    }, [allCourses, searchQuery, filters]);

    // Client-side pagination for filtered courses
    const paginatedCourses = useMemo(() => {
        const startIndex = (page - 1) * limit;
        return filteredCourses.slice(startIndex, startIndex + limit);
    }, [filteredCourses, page, limit]);

    // Pagination info for filtered courses
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

    // Fetch data when component mounts
    useEffect(() => {
        fetchAllCourses();
        fetchLevels();
        fetchCategories();
    }, [fetchAllCourses, fetchLevels, fetchCategories]);

    // Reset page when search query or filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, filters]);

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

    // Filter handlers
    const handleFilterChange = (newFilters: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleClearFilters = () => {
        setFilters({
            selectedLevel: "",
            selectedCategory: "",
            priceRange: "all",
            sortBy: "default"
        });
    };

    // Pagination handlers
    const handlePageChange = (nextPage: number) => setPage(nextPage);
    const handleLimitChange = (nextLimit: number) => {
        setPage(1);
        setLimit(nextLimit);
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
                    headers: {
                        "Content-Type": "application/json"
                    },
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

            // Update courses list after deletion
            fetchAllCourses();
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
                    Manage and track your created courses
                </p>
            </div>

            <SearchCourses
                searchQuery={searchInput}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                onClearSearch={handleClearSearch}
                currentSearch={searchQuery}
                // Filter props
                levels={levels}
                categories={categories}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
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

            {!isLoading && (searchQuery || filters.selectedLevel || filters.selectedCategory) && filteredCourses.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        No courses found with current search and filter criteria
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