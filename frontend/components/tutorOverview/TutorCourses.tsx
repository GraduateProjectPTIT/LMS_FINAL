"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, Users, Clock } from 'lucide-react';
import { getValidThumbnail } from "@/utils/handleImage";
import { formatDuration } from '@/utils/convertToMinutes';

interface ITutorCourse {
    _id: string;
    name: string;
    overview: string;
    price: number;
    estimatedPrice: number;
    thumbnail: {
        url: string;
    };
    enrolledCounts: number;
    totalLectures: number;
    totalDuration: number;
}

interface ITutorCoursesProps {
    courses: ITutorCourse[];
    loading: boolean;
}

const TutorCourses = ({ courses, loading }: ITutorCoursesProps) => {
    const router = useRouter();

    const CourseSkeleton = () => (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="h-48 w-full bg-gray-300 dark:bg-slate-700 animate-pulse" />
            <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-300 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
                <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-300 dark:bg-slate-700 rounded w-20 animate-pulse" />
                    <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-16 animate-pulse" />
                </div>
                <div className="flex gap-4">
                    <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-20 animate-pulse" />
                    <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-20 animate-pulse" />
                    <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-20 animate-pulse" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <CourseSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (!courses || courses.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-12 border border-gray-200 dark:border-slate-700 text-center">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No courses available yet</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Check back later for new courses</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Courses ({courses.length})
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div
                        key={course._id}
                        onClick={() => router.push(`/course-overview/${course._id}`)}
                        className="bg-white dark:bg-slate-800 rounded-xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-slate-700 overflow-hidden cursor-pointer"
                    >
                        {/* Thumbnail */}
                        <div className="relative h-48 w-full bg-gray-200 dark:bg-slate-700">
                            <Image
                                src={getValidThumbnail(course.thumbnail?.url)}
                                alt={course.name || "Course Image"}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 h-12">
                                {course.name}
                            </h3>

                            {/* Price */}
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

                            {/* Stats */}
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
};

export default TutorCourses;