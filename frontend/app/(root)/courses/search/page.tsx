'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import CourseFilters from '@/components/courses/CourseFilters';
import CourseViewControls from '@/components/courses/CourseViewControls';
import CourseGrid from '@/components/courses/CourseGrid';
import CoursePagination from '@/components/courses/CoursePagination';
import CoursePreviewModal from '@/components/courses/CoursePreviewModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Search } from 'lucide-react';
import { Course } from '@/type';
import toast from 'react-hot-toast';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Loader from '@/components/Loader';

interface SearchFilters {
    query: string;
    category: string;
    level: string;
    priceMin: string;
    priceMax: string;
    sort: string;
}

const sortMapping: Record<string, string> = {
    'price-low': 'price_asc',
    'price-high': 'price_desc',
    'date-newest': 'newest',
    'date-oldest': 'oldest',
    'rating': 'rating',
    'popularity': 'popular',
    'default': 'default',
};

const buildQueryString = (f: SearchFilters, mapSortForApi = false) => {
    const params = new URLSearchParams();
    if (f.query.trim()) params.set('query', f.query.trim());
    if (f.category !== 'all') params.set('category', f.category);
    if (f.level !== 'all') params.set('level', f.level);
    if (f.priceMin) params.set('priceMin', f.priceMin);
    if (f.priceMax) params.set('priceMax', f.priceMax);
    if (f.sort !== 'default') {
        params.set('sort', mapSortForApi ? (sortMapping[f.sort] ?? 'default') : f.sort);
    }
    return params.toString();
};

const CoursesPage = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<SearchFilters>({
        query: searchParams?.get('query') || '',
        category: searchParams?.get('category') || 'all',
        level: searchParams?.get('level') || 'all',
        priceMin: searchParams?.get('priceMin') || '',
        priceMax: searchParams?.get('priceMax') || '',
        sort: searchParams?.get('sort') || 'default'
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [categories, setCategories] = useState<string[]>([]);
    const [levels, setLevels] = useState<string[]>([]);

    // update URL khi filter thay đổi
    const updateURL = useCallback(
        (newFilters: SearchFilters) => {
            const queryString = buildQueryString(newFilters, false);
            const newURL = queryString ? `${pathname}?${queryString}` : pathname;
            router.push(newURL!, { scroll: false });
        },
        [pathname, router]
    );

    const handleSearchCourses = useCallback(async (searchFilters: SearchFilters) => {
        if (!searchFilters.query.trim()) {
            setCourses([]);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const apiParams = buildQueryString(searchFilters, true);

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/search?${apiParams}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to search courses");
                console.log("Fail to search courses")
            } else {
                setCourses(data.courses || []);
            }
        } catch (error: any) {
            toast.error("Failed to search courses");
            console.error("Error searching courses:", error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [])

    const handleGetAllCategories = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/categories`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                console.log("Fail to get all categories")
            }
            setCategories(data.categories);
        } catch (error) {
            console.log("Error fetching categories:", error);
        }
    }, []);

    const handleGetAllLevels = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/levels`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                console.log("Fail to get all levels")
            }
            setLevels(data.levels);
        } catch (error) {
            console.log("Error fetching levels:", error);
        }
    }, []);

    useEffect(() => {
        handleGetAllCategories();
        handleGetAllLevels();
    }, [handleGetAllCategories, handleGetAllLevels]);

    // Chỉ setFilters nếu khác với state hiện tại
    useEffect(() => {
        const urlFilters: SearchFilters = {
            query: searchParams?.get('query') || '',
            category: searchParams?.get('category') || 'all',
            level: searchParams?.get('level') || 'all',
            priceMin: searchParams?.get('priceMin') || '',
            priceMax: searchParams?.get('priceMax') || '',
            sort: searchParams?.get('sort') || 'default',
        };
        if (JSON.stringify(urlFilters) !== JSON.stringify(filters)) {
            setFilters(urlFilters);
        }
    }, [searchParams, filters]);

    // Gọi search khi filters đổi
    useEffect(() => {
        handleSearchCourses(filters);
    }, [filters, handleSearchCourses]);

    const totalResults = courses.length;
    const totalPages = useMemo(() => Math.max(1, Math.ceil(totalResults / itemsPerPage)), [totalResults, itemsPerPage]);
    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return courses.slice(start, start + itemsPerPage);
    }, [courses, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, itemsPerPage]);

    const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        updateURL(newFilters);
    }, [filters, updateURL]);

    const handlePriceFilterChange = useCallback((priceRange: string) => {
        const ranges: Record<string, { priceMin: string; priceMax: string }> = {
            free: { priceMin: '0', priceMax: '0' },
            '0-25': { priceMin: '0', priceMax: '25' },
            '25-50': { priceMin: '25', priceMax: '50' },
            '50-100': { priceMin: '50', priceMax: '100' },
            '100+': { priceMin: '100', priceMax: '' },
            all: { priceMin: '', priceMax: '' },
        };
        const { priceMin, priceMax } = ranges[priceRange] ?? { priceMin: '', priceMax: '' };
        const newFilters = { ...filters, priceMin, priceMax };
        setFilters(newFilters);
        updateURL(newFilters);
    }, [filters, updateURL]);

    const getCurrentPriceFilter = useCallback(() => {
        const { priceMin, priceMax } = filters;
        if (!priceMin && !priceMax) return 'all';
        if (priceMin === '0' && priceMax === '0') return 'free';
        if (priceMin === '0' && priceMax === '25') return '0-25';
        if (priceMin === '25' && priceMax === '50') return '25-50';
        if (priceMin === '50' && priceMax === '100') return '50-100';
        if (priceMin === '100' && !priceMax) return '100+';
        return 'all';
    }, [filters]);

    const clearFilters = useCallback(() => {
        const cleared: SearchFilters = {
            query: filters.query,
            category: 'all',
            level: 'all',
            priceMin: '',
            priceMax: '',
            sort: 'default',
        };
        setFilters(cleared);
        updateURL(cleared);
    }, [filters.query, updateURL]);

    const isNotFound = !loading && !error && !!filters.query && totalResults === 0;

    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState({});

    console.log(selectedCourse)
    console.log(showPreviewModal)

    return (
        <Layout>
            <div className='min-h-screen theme-mode dark:theme-mode'>
                <div className="container">
                    {loading && <Loader />}
                    {!loading && error && (
                        <Alert variant="destructive" className="max-w-md mx-auto shadow-lg border-red-200 dark:border-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Error searching courses: {error}
                                <button
                                    onClick={() => handleSearchCourses(filters)}
                                    className="ml-2 underline font-medium hover:no-underline transition-all"
                                >
                                    Try again
                                </button>
                            </AlertDescription>
                        </Alert>
                    )}
                    {!loading && !error && (
                        <div className='space-y-6 py-6'>
                            {filters.query && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                                    <p className="text-blue-800 dark:text-blue-200">
                                        Search results for: <strong>"{filters.query}"</strong>
                                        {totalResults > 0 && (
                                            <span className="ml-2 text-sm text-blue-600 dark:text-blue-300">
                                                ({totalResults} courses found)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}

                            <CourseFilters
                                categoryFilter={filters.category}
                                onCategoryChange={(value) => handleFilterChange('category', value)}
                                levelFilter={filters.level}
                                onLevelChange={(value) => handleFilterChange('level', value)}
                                priceFilter={getCurrentPriceFilter()}
                                onPriceChange={handlePriceFilterChange}
                                sortBy={filters.sort}
                                onSortChange={(value) => handleFilterChange('sort', value)}
                                onClearFilters={clearFilters}
                                categories={categories}
                                levels={levels}
                            />

                            {isNotFound ? (
                                <div className="flex flex-col items-center gap-4 py-16">
                                    <Search className="w-12 h-12 text-slate-400" />
                                    <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                                        No course match your searching
                                    </span>
                                    <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                                        Try adjusting your search terms or filters to find what you're looking for.
                                    </p>
                                    <button
                                        onClick={clearFilters}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-2"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <CourseViewControls
                                        viewMode={viewMode}
                                        onViewModeChange={setViewMode}
                                        totalResults={totalResults}
                                        currentPage={currentPage}
                                        itemsPerPage={itemsPerPage}
                                    />

                                    <CourseGrid
                                        courses={paginatedCourses}
                                        viewMode={viewMode}
                                        setShowPreviewModal={setShowPreviewModal}
                                        setSelectedCourse={setSelectedCourse}
                                    />

                                    <CoursePagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                        itemsPerPage={itemsPerPage}
                                        onItemsPerPageChange={setItemsPerPage}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>

                {showPreviewModal && (
                    <CoursePreviewModal
                        showPreviewModal={showPreviewModal}
                        course={selectedCourse}
                        onClose={() => setShowPreviewModal(false)}
                    />
                )}
            </div>
        </Layout>
    );
};

export default CoursesPage;