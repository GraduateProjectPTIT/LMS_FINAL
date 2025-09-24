'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import CourseFilters from '@/components/courses/CourseFilters';
import CourseViewControls from '@/components/courses/CourseViewControls';
import CourseGrid from '@/components/courses/CourseGrid';
import CoursePagination from '@/components/courses/CoursePagination';
import PreviewVideoModal from '@/components/courses/PreviewVideoModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Search } from 'lucide-react';
import { IBaseCategory, ICourseSearchResponse } from '@/type';
import toast from 'react-hot-toast';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Loader from '@/components/Loader';

interface SearchFilters {
    keyword: string;
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
    if (f.keyword.trim()) params.set('keyword', f.keyword.trim());
    if (f.category !== 'all') params.set('category', f.category);
    if (f.level !== 'all') params.set('level', f.level);
    if (f.priceMin) params.set('priceMin', f.priceMin);
    if (f.priceMax) params.set('priceMax', f.priceMax);
    if (f.sort !== 'default') {
        params.set('sort', mapSortForApi ? (sortMapping[f.sort] ?? 'default') : f.sort);
    }
    return params.toString();
};

const SearchCoursesPage = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentUrl = useMemo(() => {
        const params = searchParams?.toString();
        return params ? `${pathname}?${params}` : pathname;
    }, [pathname, searchParams]);

    const [courses, setCourses] = useState<ICourseSearchResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // AbortController refs để hủy request khi cần
    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [filters, setFilters] = useState<SearchFilters>({
        keyword: searchParams?.get('keyword') || '',
        category: searchParams?.get('category') || 'all',
        level: searchParams?.get('level') || 'all',
        priceMin: searchParams?.get('priceMin') || '',
        priceMax: searchParams?.get('priceMax') || '',
        sort: searchParams?.get('sort') || 'default'
    });

    const [categories, setCategories] = useState<IBaseCategory[]>([]);
    const [levels, setLevels] = useState<string[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Cleanup function for AbortController and debounce timeout
    const cleanup = useCallback(() => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Clear debounce timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // update URL khi filter thay đổi
    const updateURL = useCallback(
        (newFilters: SearchFilters) => {
            const queryString = buildQueryString(newFilters, false);
            const newURL = queryString ? `${pathname}?${queryString}` : pathname;
            router.push(newURL!, { scroll: false });
        },
        [pathname, router]
    );

    const handleSearchCourses = useCallback(async (searchFilters: SearchFilters, signal?: AbortSignal) => {
        // Nếu không có từ khóa, clear kết quả và không gọi API
        // if (!searchFilters.keyword.trim()) {
        //     setCourses([]);
        //     setLoading(false);
        //     setError(null);
        //     return;
        // }

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
                signal,
            });

            if (signal?.aborted) {
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to search courses");
                console.log("Fail to search courses")
                setError(data.message || "Failed to search courses");
            } else {
                setCourses(data.courses || []);
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
                return;
            }

            toast.error("Failed to search courses");
            console.error("Error searching courses:", error.message);
            setError(error.message);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, []);

    // Debounced search function
    const debouncedSearch = useCallback((searchFilters: SearchFilters) => {
        cleanup(); // Cancel previous request and timeout

        // For non-keyword filters, search immediately
        const isKeywordChange = searchFilters.keyword !== filters.keyword;
        const delay = isKeywordChange ? 500 : 0; // 500ms delay for keyword, immediate for other filters

        debounceTimeoutRef.current = setTimeout(() => {
            // Create new AbortController for this request
            abortControllerRef.current = new AbortController();
            handleSearchCourses(searchFilters, abortControllerRef.current.signal);
        }, delay);
    }, [filters.keyword, handleSearchCourses, cleanup]);

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
            keyword: searchParams?.get('keyword') || searchParams?.get('query') || '',
            category: searchParams?.get('category') || 'all',
            level: searchParams?.get('level') || 'all',
            priceMin: searchParams?.get('priceMin') || '',
            priceMax: searchParams?.get('priceMax') || '',
            sort: searchParams?.get('sort') || 'default',
        };

        setFilters(prev => {
            if (JSON.stringify(urlFilters) !== JSON.stringify(prev)) {
                return urlFilters;
            }
            return prev;
        });
    }, [searchParams]);

    // Gọi debounced search khi filters đổi
    useEffect(() => {
        debouncedSearch(filters);
    }, [filters, debouncedSearch]);

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
        if (priceMin === '0' && priceMax === '25') return '0-25';
        if (priceMin === '25' && priceMax === '50') return '25-50';
        if (priceMin === '50' && priceMax === '100') return '50-100';
        if (priceMin === '100' && !priceMax) return '100+';
        return 'all';
    }, [filters]);

    const clearFiltersExceptKeyword = useCallback(() => {
        const cleared: SearchFilters = {
            keyword: filters.keyword,
            category: 'all',
            level: 'all',
            priceMin: '',
            priceMax: '',
            sort: 'default',
        };
        setFilters(cleared);
        updateURL(cleared);
    }, [filters.keyword, updateURL]);

    const isNotFound = !loading && !error && totalResults === 0;

    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<ICourseSearchResponse | null>(null);

    return (
        <Layout>
            <div className='min-h-screen theme-mode'>
                <div className="container">
                    {/* Nếu đang tải */}
                    {loading && <Loader />}

                    {/* Nếu có lỗi */}
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

                    {/* Nếu thành công */}
                    {!loading && !error && (
                        <div className='space-y-6 py-6'>
                            {filters.keyword && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                                    <p className="text-blue-800 dark:text-blue-200">
                                        Search results for: <strong>"{filters.keyword}"</strong>
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
                                onClearFilters={clearFiltersExceptKeyword}
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
                                        onClick={clearFiltersExceptKeyword}
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
                                        currentUrl={currentUrl}
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

                {showPreviewModal && selectedCourse?.videoDemo.url && (
                    <PreviewVideoModal
                        showPreviewModal={showPreviewModal}
                        videoUrl={selectedCourse?.videoDemo.url}
                        onClose={() => setShowPreviewModal(false)}
                    />
                )}
            </div>
        </Layout>
    );
};

export default SearchCoursesPage;