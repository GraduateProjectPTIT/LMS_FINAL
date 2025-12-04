"use client"

import React, { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight, Clock, BookOpen, Users, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getValidThumbnail } from '@/utils/handleImage'
import { formatDuration } from '@/utils/convertToMinutes'

interface IPurchasedCourse {
    _id: string;
    name: string;
    thumbnail: {
        url: string;
    };
    price: number;
    estimatedPrice: number;
    enrolledCounts: number;
    totalLectures: number;
    totalDuration: number;
}

const TopPurchasedCourses = () => {
    const router = useRouter();
    const [courses, setCourses] = useState<IPurchasedCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const limit = 8;

    const fetchTopPurchasedCourses = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/top-purchased?limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch top purchased courses');
            }
            setCourses(data.courses);
        } catch (error: any) {
            console.error("Error fetching top purchased courses:", error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTopPurchasedCourses();
    }, []);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    useEffect(() => {
        setCurrentIndex(0);
    }, [isMobile]);

    const coursesPerSlide = isMobile ? 1 : 4;
    const maxSlides = Math.max(1, Math.ceil(courses.length / coursesPerSlide));

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % maxSlides);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? maxSlides - 1 : prev - 1));
    };

    const CourseSkeleton = () => (
        <div className="flex-shrink-0 w-full md:w-72 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        </div>
    );

    const SkeletonGrid = () => (
        <div className="flex gap-6 justify-center">
            <div className="hidden md:flex gap-6">
                <CourseSkeleton />
                <CourseSkeleton />
                <CourseSkeleton />
                <CourseSkeleton />
            </div>
            <div className="flex md:hidden">
                <CourseSkeleton />
            </div>
        </div>
    );

    const shouldShowNavigation = courses.length > coursesPerSlide;

    const handleSelectCourse = (courseId: string) => {
        router.push(`/course-overview/${courseId}`);
    }

    return (
        <div id="top-purchased-courses" className='py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30'>
            <div className='container max-w-6xl px-4 mx-auto'>
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                        Top Purchased Courses
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Explore our most popular courses chosen by students worldwide
                    </p>
                </div>

                {loading ? (
                    <SkeletonGrid />
                ) : courses.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No courses available</p>
                    </div>
                ) : (
                    <div className="relative">
                        {shouldShowNavigation && (
                            <>
                                {/* <button
                                    onClick={prevSlide}
                                    className="hidden md:block md:absolute -left-10 top-1/2 -translate-y-1/2 md:translate-x-4 z-10 bg-white dark:bg-slate-800 shadow-lg rounded-full p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                </button> */}
                                <button
                                    onClick={nextSlide}
                                    className="hidden md:block md:absolute right-0 top-1/2 -translate-y-1/2 md:translate-x-4 z-10 bg-white dark:bg-slate-800 shadow-lg rounded-full p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                </button>
                            </>
                        )}

                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-800 md:duration-1000 ease-in-out"
                                style={{
                                    transform: `translateX(-${currentIndex * 100}%)`
                                }}
                            >
                                {Array.from({ length: maxSlides }).map((_, slideIndex) => {
                                    const startIndex = slideIndex * coursesPerSlide;
                                    const slideCourses = courses.slice(startIndex, startIndex + coursesPerSlide);

                                    return (
                                        <div key={slideIndex} className="w-full flex-shrink-0">
                                            <div className="flex gap-6 justify-center px-4 md:px-0">
                                                {slideCourses.map((course, index) => (
                                                    <div
                                                        onClick={() => handleSelectCourse(course._id)}
                                                        key={startIndex + index}
                                                        className="flex-shrink-0 w-full md:w-80 bg-white dark:bg-slate-800 rounded-xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-slate-700 overflow-hidden cursor-pointer"
                                                    >
                                                        <div className="relative h-48 w-full bg-gray-200 dark:bg-slate-700">
                                                            <Image
                                                                src={getValidThumbnail(course.thumbnail?.url)}
                                                                alt={course.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="(max-width: 768px) 100vw, 320px"
                                                            />
                                                        </div>
                                                        <div className="p-4">
                                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 h-12">
                                                                {course.name}
                                                            </h3>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                                                                        ${course.estimatedPrice}
                                                                    </span>
                                                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                                        ${course.price}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="w-4 h-4" />
                                                                    <span>{course.enrolledCounts}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <BookOpen className="w-4 h-4" />
                                                                    <span>{course.totalLectures}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span>{formatDuration(course.totalDuration)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {shouldShowNavigation && (
                            <div className="flex md:hidden justify-center mt-8 space-x-2">
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

export default TopPurchasedCourses