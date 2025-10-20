"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { SiGoogleclassroom } from "react-icons/si";
import { FaGraduationCap, FaClock, FaBookmark, FaStar } from 'react-icons/fa';
import { IBaseCategory, ICourseCreator, IImageAsset } from '@/type';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Loader from '../Loader';

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

const EnrolledCourses = () => {
    const [enrolledCourses, setEnrolledCourses] = useState<IEnrolledCourse[]>([]);
    const [pagination, setPagination] = useState<IPagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchUserEnrolledCourses = async (page?: number, limit?: number) => {
        try {
            setIsLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/student/enrolled_courses?page=${page}&limit=20`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            const data = await res.json();

            if (!res.ok) {
                console.log("Failed to fetch enrolled courses:", data.message);
                return;
            }

            setEnrolledCourses(data.courses || []);
            setPagination(data.pagination || null);

        } catch (error: any) {
            console.log("Error fetching enrolled courses:", error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchUserEnrolledCourses(pagination?.page, pagination?.limit);
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateCompletedCourses = () => {
        return enrolledCourses.filter(item => item.completed).length;
    };

    return (
        <Card className="w-full theme-mode border-gray-200 dark:border-slate-600 shadow-md dark:shadow-slate-600">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <SiGoogleclassroom className="text-blue-500" size={22} />
                    <CardTitle className="text-2xl font-bold">Enrolled Courses</CardTitle>
                </div>
                <CardDescription>Track your progress in enrolled courses</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Statistics */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2 p-2 px-4 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
                        <FaGraduationCap className="text-blue-500" />
                        <span className="font-medium text-sm">{enrolledCourses.length} Courses</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 px-4 rounded-full bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700">
                        <FaBookmark className="text-purple-500" />
                        <span className="font-medium text-sm">{calculateCompletedCourses()} Completed</span>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <Loader />
                ) : enrolledCourses.length === 0 ? (
                    /* Empty State */
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 p-8 text-center">
                        <SiGoogleclassroom size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                        <h3 className="text-lg font-semibold mb-2">No Enrolled Courses Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Start your learning journey by enrolling in a course
                        </p>
                        <Button
                            variant="outline"
                            className="w-full md:w-auto"
                            onClick={() => router.push('/')}
                        >
                            Find Courses
                        </Button>
                    </div>
                ) : (
                    /* Course List */
                    <div className="space-y-4">
                        {enrolledCourses.map((item) => (
                            <div
                                key={item.course._id}
                                className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                            >
                                <div className="flex flex-col md:flex-row gap-4 p-4">
                                    {/* Thumbnail */}
                                    <div className="w-full md:w-48 h-32 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-700">
                                        <Image
                                            src={item.course.thumbnail?.url || '/placeholder-course.png'}
                                            alt={item.course.name}
                                            fill
                                            className="object-cover"
                                        />
                                        {item.completed && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                Completed
                                            </div>
                                        )}
                                    </div>

                                    {/* Course Info */}
                                    <div className="flex-1 flex flex-col justify-between gap-5">
                                        <div className='flex flex-col gap-2'>
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <h3 className="text-lg font-semibold line-clamp-2">
                                                    {item.course.name}
                                                </h3>
                                                <Badge variant="outline" className="text-xs dark:border-slate-600">
                                                    {item.course.level}
                                                </Badge>
                                            </div>

                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Instructor: {item.course.creatorId.name}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-medium">
                                                        {item.progress}% complete
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Enrolled: {formatDate(item.enrolledAt)}
                                                    </span>
                                                </div>
                                                <Progress value={item.progress} className="h-2" />
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex justify-end items-center">
                                            <Button
                                                size="sm"
                                                onClick={() => router.push(`/course-enroll/${item.course._id}`)}
                                                className='hover:cursor-pointer'
                                            >
                                                {item.progress === 0 ? 'Start Learning' : 'Continue Learning'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default EnrolledCourses;