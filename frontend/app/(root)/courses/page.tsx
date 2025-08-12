'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import CourseFilters from '@/components/courses/CourseFilters';
import CourseViewControls from '@/components/courses/CourseViewControls';
import CourseGrid from '@/components/courses/CourseGrid';
import CoursePagination from '@/components/courses/CoursePagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { Course } from '@/type';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

const CoursesPage = () => {

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);

    const [categoryFilter, setCategoryFilter] = useState('all');
    const [levelFilter, setLevelFilter] = useState('all');
    const [priceFilter, setPriceFilter] = useState('all');
    const [sortBy, setSortBy] = useState('default');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const searchParams = useSearchParams();
    const searchTerm = searchParams?.get('search') || '';

    const handleSearchCourses = async () => {
        if (!searchTerm.trim()) {
            setCourses([]);
            return;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/search_course?query=${searchTerm}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || "Failed to search courses");
                throw new Error(data.message || "Failed to search courses");
            } else {
                setCourses(data.courses)
                setNotFound(Array.isArray(data.courses) && data.courses.length === 0);
            }
        } catch (error: any) {
            toast.error("Failed to search courses");
            console.error("Error searching courses:", error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (searchTerm) {
            handleSearchCourses();
        }
    }, [searchTerm])

    // Get unique categories and levels
    const { categories, levels } = useMemo(() => {
        const uniqueCategories = [...new Set(courses.map(course => course.categories).filter(Boolean))];
        const uniqueLevels = [...new Set(courses.map(course => course.level).filter(Boolean))];

        return {
            categories: uniqueCategories,
            levels: uniqueLevels,
        };
    }, [courses]);

    // Filter and sort courses
    const filteredAndSortedCourses = useMemo(() => {
        let filtered = courses.filter(course => {
            // Category filter
            if (categoryFilter !== 'all' && course.categories !== categoryFilter) {
                return false;
            }

            // Level filter
            if (levelFilter !== 'all' && course.level !== levelFilter) {
                return false;
            }

            // Price filter
            if (priceFilter !== 'all') {
                const price = course.price;
                switch (priceFilter) {
                    case 'free':
                        if (price !== 0) return false;
                        break;
                    case '0-25':
                        if (price < 0 || price > 25) return false;
                        break;
                    case '25-50':
                        if (price < 25 || price > 50) return false;
                        break;
                    case '50-100':
                        if (price < 50 || price > 100) return false;
                        break;
                    case '100+':
                        if (price < 100) return false;
                        break;
                }
            }

            return true;
        });

        // Sort courses
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'rating':
                    return b.ratings - a.ratings;
                case 'popularity':
                    return b.purchased - a.purchased;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [courses, categoryFilter, levelFilter, priceFilter, sortBy]);

    // Pagination
    const totalResults = filteredAndSortedCourses.length;
    const totalPages = Math.ceil(totalResults / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCourses = filteredAndSortedCourses.slice(startIndex, endIndex);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [categoryFilter, levelFilter, priceFilter, sortBy, itemsPerPage]);

    // Clear all filters
    const clearFilters = () => {
        setCategoryFilter('all');
        setLevelFilter('all');
        setPriceFilter('all');
        setSortBy('default');
    };

    const handleViewDemo = (url: string) => {
        if (url && url !== 'test url' && url !== 'test') {
            window.open(url, '_blank');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'>
                    <div className="flex items-center justify-center h-96">
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-8 py-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-600 dark:text-slate-300" />
                            <span className="text-slate-700 dark:text-slate-200 font-medium">Loading courses...</span>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'>
                    <div className="container mx-auto px-4 py-8">
                        <Alert variant="destructive" className="max-w-md mx-auto shadow-lg border-red-200 dark:border-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Error loading courses: {error}
                                <button
                                    onClick={handleSearchCourses}
                                    className="ml-2 underline font-medium hover:no-underline transition-all"
                                >
                                    Try again
                                </button>
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </Layout>
        );
    }

    if (notFound) {
        return (
            <Layout>
                <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center'>
                    <div className="flex flex-col items-center gap-4">
                        <Search className="w-12 h-12 text-slate-400" />
                        <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                            No courses found for "<span className="text-blue-600 dark:text-blue-400">{searchTerm}</span>"
                        </span>
                        <button
                            onClick={handleSearchCourses}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-2"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className='min-h-screen theme-mode dark:theme-mode'>
                <div className="container">
                    <div className='flex flex-col gap-4 py-8'>

                        <CourseFilters
                            categoryFilter={categoryFilter}
                            onCategoryChange={setCategoryFilter}
                            levelFilter={levelFilter}
                            onLevelChange={setLevelFilter}
                            priceFilter={priceFilter}
                            onPriceChange={setPriceFilter}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            onClearFilters={clearFilters}
                            categories={categories}
                            levels={levels}
                        />

                        <CourseViewControls
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            totalResults={totalResults}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            itemsPerPage={itemsPerPage}
                        />

                        <CourseGrid
                            courses={paginatedCourses}
                            viewMode={viewMode}
                            onViewDemo={handleViewDemo}
                        />

                        <CoursePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default CoursesPage;