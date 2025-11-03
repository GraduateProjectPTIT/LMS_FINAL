"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { SiGoogleclassroom } from "react-icons/si";
import { FaGraduationCap } from 'react-icons/fa';
import { IBaseCategory, ICourseCreator, IImageAsset } from '@/type';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Loader from '../Loader';
import MyCoursesFilter from './MyCoursesFilter';
import MyCoursesPagination from './MyCoursesPagination';
import toast from 'react-hot-toast';
import { getValidThumbnail } from '@/utils/handleImage'

interface ICourse {
    _id: string;
    name: string;
    description: string;
    overview: string;
    thumbnail: IImageAsset;
    categories: IBaseCategory[];
    price: number;
    estimatedPrice: number;
    tags: string;
    level: string;
    ratings: number;
    purchased: number;
    creatorId: ICourseCreator;
    createdAt: string;
    updatedAt: string;
}

interface IEnrolledCourse {
    course: ICourse;
    progress: number;
    completed: boolean;
    enrolledAt: string;
}

interface IPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface FilterState {
    filterStatus: 'all' | 'in-progress' | 'completed';
    selectedCategory: string;
    selectedLevel: string;
    sortBy: string;
}

const MyCourses = () => {
    const [enrolledCourses, setEnrolledCourses] = useState<IEnrolledCourse[]>([]);
    const [pagination, setPagination] = useState<IPagination>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [isLoading, setIsLoading] = useState(true);

    // Search states
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    // Filter states - Draft and Applied
    const [draftFilters, setDraftFilters] = useState<FilterState>({
        filterStatus: 'all',
        selectedCategory: 'all',
        selectedLevel: 'all',
        sortBy: 'enrolledAt-desc'
    });

    const [appliedFilters, setAppliedFilters] = useState<FilterState>({
        filterStatus: 'all',
        selectedCategory: 'all',
        selectedLevel: 'all',
        sortBy: 'enrolledAt-desc'
    });

    // Data for filter options
    const [allCategories, setAllCategories] = useState<IBaseCategory[]>([]);
    const [allLevels, setAllLevels] = useState<string[]>([]);

    const router = useRouter();

    // Fetch categories and levels
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [categoriesRes, levelsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/categories`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/levels`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    })
                ]);

                const categoriesData = await categoriesRes.json();
                const levelsData = await levelsRes.json();

                if (categoriesRes.ok) setAllCategories(categoriesData.categories || []);
                if (levelsRes.ok) setAllLevels(levelsData.levels || []);
            } catch (error: any) {
                console.log("Error fetching filter options:", error.message);
            }
        };

        fetchFilterOptions();
    }, []);

    // Build query string for API based on APPLIED filters
    const buildQueryString = useCallback(() => {
        const params = new URLSearchParams();

        params.set('page', pagination.page.toString());
        params.set('limit', pagination.limit.toString());

        // Use appliedSearch instead of searchQuery
        if (appliedSearch.trim()) params.set('keyword', appliedSearch.trim());

        if (appliedFilters.filterStatus === 'completed') {
            params.set('completed', 'true');
        } else if (appliedFilters.filterStatus === 'in-progress') {
            params.set('completed', 'false');
        }

        if (appliedFilters.selectedCategory !== 'all') {
            params.set('categoryIds', appliedFilters.selectedCategory);
        }

        if (appliedFilters.selectedLevel !== 'all') {
            params.set('level', appliedFilters.selectedLevel);
        }

        const [sortField, sortOrder] = appliedFilters.sortBy.split('-');
        params.set('sortBy', sortField);
        params.set('sortOrder', sortOrder);

        return params.toString();
    }, [pagination.page, pagination.limit, appliedSearch, appliedFilters]);

    // Fetch enrolled courses
    const fetchUserEnrolledCourses = useCallback(async () => {
        try {
            setIsLoading(true);
            const queryString = buildQueryString();

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/student/enrolled_courses?${queryString}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to fetch enrolled courses");
                return;
            }

            setEnrolledCourses(data.courses || []);
            setPagination(data.pagination || pagination);

        } catch (error: any) {
            toast.error("Error fetching enrolled courses");
            console.log("Error fetching enrolled courses:", error.message);
        } finally {
            setIsLoading(false);
        }
    }, [buildQueryString]);

    // Fetch courses when applied filters or pagination changes
    useEffect(() => {
        fetchUserEnrolledCourses();
    }, [fetchUserEnrolledCourses]);

    // Handler functions for search
    const handleSearchChange = (value: string) => {
        setSearchInput(value);
    };

    const handleSearchSubmit = () => {
        const trimmed = searchInput.trim();
        setSearchInput(trimmed);
        setAppliedSearch(trimmed);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setAppliedSearch('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Handler functions for filters
    const handleDraftFiltersChange = (newFilters: Partial<FilterState>) => {
        setDraftFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleApplyFilters = () => {
        setAppliedFilters(draftFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleClearFilters = () => {
        const defaultFilters: FilterState = {
            filterStatus: 'all',
            selectedCategory: 'all',
            selectedLevel: 'all',
            sortBy: 'enrolledAt-desc'
        };

        setDraftFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Individual filter removal handlers
    const handleRemoveStatusFilter = () => {
        const updatedFilters = { ...appliedFilters, filterStatus: 'all' as const };
        setDraftFilters(updatedFilters);
        setAppliedFilters(updatedFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleRemoveCategoryFilter = () => {
        const updatedFilters = { ...appliedFilters, selectedCategory: 'all' };
        setDraftFilters(updatedFilters);
        setAppliedFilters(updatedFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleRemoveLevelFilter = () => {
        const updatedFilters = { ...appliedFilters, selectedLevel: 'all' };
        setDraftFilters(updatedFilters);
        setAppliedFilters(updatedFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleRemoveSortFilter = () => {
        const updatedFilters = { ...appliedFilters, sortBy: 'enrolledAt-desc' };
        setDraftFilters(updatedFilters);
        setAppliedFilters(updatedFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Pagination handlers
    const handlePageChange = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, page }));
    }, []);

    const handleItemsPerPageChange = useCallback((limit: number) => {
        setPagination(prev => ({ ...prev, limit, page: 1 }));
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isNotFound = !isLoading && enrolledCourses.length === 0;
    const hasFiltersApplied = appliedSearch || appliedFilters.filterStatus !== 'all' || appliedFilters.selectedCategory !== 'all' || appliedFilters.selectedLevel !== 'all' || appliedFilters.sortBy !== 'enrolledAt-desc';

    return (
        <div className="w-full py-8">
            {/* Filter Section */}
            <MyCoursesFilter
                searchInput={searchInput}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                onClearSearch={handleClearSearch}
                currentSearch={appliedSearch}
                draftFilters={draftFilters}
                appliedFilters={appliedFilters}
                onFilterChange={handleDraftFiltersChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                onRemoveStatusFilter={handleRemoveStatusFilter}
                onRemoveCategoryFilter={handleRemoveCategoryFilter}
                onRemoveLevelFilter={handleRemoveLevelFilter}
                onRemoveSortFilter={handleRemoveSortFilter}
                categories={allCategories}
                levels={allLevels}
            />

            {/* Courses List */}
            <Card className="theme-mode border-gray-200 dark:border-slate-600">
                <CardContent className="p-6">
                    {isLoading ? (
                        <Loader />
                    ) : isNotFound ? (
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 p-8 text-center">
                            <SiGoogleclassroom size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                            <h3 className="text-lg font-semibold mb-2">
                                {hasFiltersApplied ? 'No Courses Found' : 'No Enrolled Courses Yet'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {hasFiltersApplied
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Start your learning journey by enrolling in a course'}
                            </p>
                            {hasFiltersApplied ? (
                                <Button
                                    variant="outline"
                                    className="w-full md:w-auto"
                                    onClick={handleClearFilters}
                                >
                                    Clear Filters
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full md:w-auto"
                                    onClick={() => router.push('/')}
                                >
                                    Browse Courses
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {enrolledCourses.map((item) => (
                                    <div
                                        key={item.course._id}
                                        className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
                                    >
                                        <div className="flex flex-col md:flex-row gap-4 p-4">
                                            {/* Thumbnail */}
                                            <div className="w-full md:w-64 h-40 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-700">
                                                <Image
                                                    src={getValidThumbnail(item.course.thumbnail?.url)}
                                                    alt={item.course.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {item.completed && (
                                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                                        ✓ Completed
                                                    </div>
                                                )}
                                            </div>

                                            {/* Course Info */}
                                            <div className="flex-1 flex flex-col justify-between gap-4">
                                                <div className='flex flex-col gap-3'>
                                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                                        <h3 className="text-xl font-semibold line-clamp-2">
                                                            {item.course.name}
                                                        </h3>
                                                        <Badge variant="outline" className="text-xs dark:border-slate-600">
                                                            {item.course.level}
                                                        </Badge>
                                                    </div>

                                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                        <FaGraduationCap className="text-blue-500" />
                                                        Instructor: <span className="font-medium">{item.course.creatorId.name}</span>
                                                    </p>

                                                    {/* Progress Bar */}
                                                    <div>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                                {item.progress}% complete
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                Enrolled: {formatDate(item.enrolledAt)}
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={item.progress}
                                                            className={`h-2.5 bg-gray-200
                                                                ${item.progress < 30
                                                                    ? '[&>div]:bg-red-500'
                                                                    : item.progress < 70
                                                                        ? '[&>div]:bg-yellow-400'
                                                                        : '[&>div]:bg-green-500'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <div className="flex justify-between md:justify-end items-center">
                                                    {item.progress === 0 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push(`/course-enroll/${item.course._id}`)}
                                                            className='flex items-center gap-2 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/70'
                                                        >
                                                            Start Learning
                                                        </Button>
                                                    )}

                                                    {item.progress !== 0 && !item.completed && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push(`/course-enroll/${item.course._id}`)}
                                                            className='flex items-center gap-2 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/70'
                                                        >
                                                            Continue Learning
                                                        </Button>
                                                    )}

                                                    {item.progress === 100 && item.completed && (
                                                        <div className='flex justify-center items-center gap-5'>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.push(`/review/${item.course._id}`)}
                                                                className='flex items-center gap-2 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/70'
                                                            >
                                                                Review Course
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.push(`/course-enroll/${item.course._id}`)}
                                                                className='flex items-center gap-2 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/70'
                                                            >
                                                                Continue Learning
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <MyCoursesPagination
                                currentPage={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={pagination.limit}
                                onItemsPerPageChange={handleItemsPerPageChange}
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MyCourses;