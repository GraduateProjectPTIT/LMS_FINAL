"use client"
import React, { useState, useEffect } from 'react'
import { IBaseCategory } from '@/type'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CategoryCarousel = () => {

    const router = useRouter();
    const [categories, setCategories] = useState<IBaseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    const handleFetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/category/get_all_categories`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                console.log("Fetching categories failed: ", data.message);
                return;
            }
            setCategories(data.categories);
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        handleFetchCategories();
    }, []);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Reset currentIndex khi thay đổi screen size
    useEffect(() => {
        setCurrentIndex(0);
    }, [isMobile]);

    const categoriesPerSlide = isMobile ? 2 : 8;
    const maxSlides = Math.max(1, Math.ceil(categories.length / categoriesPerSlide));

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % maxSlides);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? maxSlides - 1 : prev - 1));
    };

    const CategorySkeleton = () => (
        <div className="flex-shrink-0 w-full md:w-64 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <Skeleton className="h-6 w-full" />
        </div>
    );

    const SkeletonGrid = () => (
        <div className="flex flex-col gap-6">
            {/* Desktop skeleton - 2 rows x 4 columns */}
            <div className="hidden md:flex gap-6 justify-center">
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
            </div>
            <div className="hidden md:flex gap-6 justify-center">
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
            </div>
            {/* Mobile skeleton - 2 rows x 1 column */}
            <div className="flex md:hidden flex-col gap-6 items-center">
                <CategorySkeleton />
                <CategorySkeleton />
            </div>
        </div>
    );

    // Kiểm tra có cần hiển thị navigation buttons không
    const shouldShowNavigation = categories.length > categoriesPerSlide;

    const handleSelectCategory = (categoryId: string) => {
        router.push(`/courses/search?category=${categoryId}`);
    }

    return (
        <div className='h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30 py-16'>
            <div className='container relative max-w-6xl px-4'>
                {loading ? (
                    <SkeletonGrid />
                ) : categories.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No categories available</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Navigation Buttons */}
                        {shouldShowNavigation && (
                            <>
                                <button
                                    onClick={prevSlide}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 md:-translate-x-4 z-10 bg-white dark:bg-slate-800 shadow-lg rounded-full p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 md:translate-x-4 z-10 bg-white dark:bg-slate-800 shadow-lg rounded-full p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                </button>
                            </>
                        )}

                        {/* Categories Grid Container with Animation */}
                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-800 md:duration-1000 ease-in-out"
                                style={{
                                    transform: `translateX(-${currentIndex * 100}%)`
                                }}
                            >
                                {Array.from({ length: maxSlides }).map((_, slideIndex) => {
                                    const startIndex = slideIndex * categoriesPerSlide;
                                    const slideCategories = categories.slice(startIndex, startIndex + categoriesPerSlide);

                                    return (
                                        <div key={slideIndex} className="w-full flex-shrink-0">
                                            {/* Desktop Layout: 2 rows x 4 columns */}
                                            <div className="hidden md:flex flex-col gap-6">
                                                {/* Top row */}
                                                <div className="flex gap-6 justify-center">
                                                    {slideCategories.slice(0, 4).map((category, index) => (
                                                        <div
                                                            onClick={() => handleSelectCategory(category._id)}
                                                            key={startIndex + index}
                                                            className="flex-shrink-0 w-64 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-slate-700 p-6 cursor-pointer"
                                                        >
                                                            <h3 className="font-semibold text-gray-900 dark:text-white text-center">
                                                                {category.title}
                                                            </h3>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Bottom row */}
                                                {slideCategories.length > 4 && (
                                                    <div className="flex gap-6 justify-center">
                                                        {slideCategories.slice(4, 8).map((category, index) => (
                                                            <div
                                                                onClick={() => handleSelectCategory(category._id)}
                                                                key={startIndex + 4 + index}
                                                                className="flex-shrink-0 w-64 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-slate-700 p-6 cursor-pointer"
                                                            >
                                                                <h3 className="font-semibold text-gray-900 dark:text-white text-center">
                                                                    {category.title}
                                                                </h3>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mobile Layout: 2 rows x 1 column */}
                                            <div className="flex md:hidden flex-col gap-6 items-center px-20">
                                                {slideCategories.map((category, index) => (
                                                    <div
                                                        onClick={() => handleSelectCategory(category._id)}
                                                        key={startIndex + index}
                                                        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-slate-700 p-6 cursor-pointer"
                                                    >
                                                        <h3 className="font-semibold text-gray-900 dark:text-white text-center">
                                                            {category.title}
                                                        </h3>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Carousel Indicators */}
                        {shouldShowNavigation && (
                            <div className="flex justify-center mt-8 space-x-2">
                                {Array.from({ length: maxSlides }).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentIndex(index)}
                                        className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentIndex
                                            ? 'bg-blue-500 w-8'
                                            : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CategoryCarousel