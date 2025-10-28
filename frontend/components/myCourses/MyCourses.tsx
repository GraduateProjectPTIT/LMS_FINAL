"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { SiGoogleclassroom } from "react-icons/si";
import { FaGraduationCap, FaBookmark, FaFilter, FaSearch } from 'react-icons/fa';
import { IBaseCategory, ICourseCreator, IImageAsset } from '@/type';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Loader from '../Loader';
import MyCoursesFilter from './MyCoursesFilter';
import MyCoursesPagination from './MyCoursesPagination';

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

const MyCourses = () => {
    const [enrolledCourses, setEnrolledCourses] = useState<IEnrolledCourse[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<IEnrolledCourse[]>([]);
    const [pagination, setPagination] = useState<IPagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed'>('all');
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
            setFilteredCourses(data.courses || []);
            setPagination(data.pagination || null);

        } catch (error: any) {
            console.log("Error fetching enrolled courses:", error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchUserEnrolledCourses(pagination?.page, pagination?.limit);
    }, [pagination?.page, pagination?.limit]);

    // Filter courses based on search and status
    useEffect(() => {
        let filtered = enrolledCourses;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.course.creatorId.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status
        if (filterStatus === 'completed') {
            filtered = filtered.filter(item => item.completed);
        } else if (filterStatus === 'in-progress') {
            filtered = filtered.filter(item => !item.completed);
        }

        setFilteredCourses(filtered);
    }, [searchQuery, filterStatus, enrolledCourses]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="w-full py-8">
            {/* Search and Filter Section */}
            <Card className="theme-mode border-gray-200 dark:border-slate-600 mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search courses or instructors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex gap-2">
                            <Button
                                variant={filterStatus === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus('all')}
                                className="flex items-center gap-2"
                            >
                                <FaFilter size={12} />
                                All
                            </Button>
                            <Button
                                variant={filterStatus === 'in-progress' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus('in-progress')}
                            >
                                In Progress
                            </Button>
                            <Button
                                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus('completed')}
                            >
                                Completed
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Courses List */}
            <Card className="theme-mode border-gray-200 dark:border-slate-600">
                <CardContent className="p-6">
                    {isLoading ? (
                        <Loader />
                    ) : filteredCourses.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 p-8 text-center">
                            <SiGoogleclassroom size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                            <h3 className="text-lg font-semibold mb-2">
                                {enrolledCourses.length === 0 ? 'No Enrolled Courses Yet' : 'No Courses Found'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {enrolledCourses.length === 0
                                    ? 'Start your learning journey by enrolling in a course'
                                    : 'Try adjusting your search or filter criteria'}
                            </p>
                            {enrolledCourses.length === 0 && (
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
                        <div className="space-y-4">
                            {filteredCourses.map((item) => (
                                <div
                                    key={item.course._id}
                                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
                                >
                                    <div className="flex flex-col md:flex-row gap-4 p-4">
                                        {/* Thumbnail */}
                                        <div className="w-full md:w-64 h-40 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-700">
                                            <Image
                                                src={item.course.thumbnail?.url || '/placeholder-course.png'}
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
                                                    <h3 className="text-xl font-semibold line-clamp-2 hover:text-blue-500 transition-colors">
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
                                            <div className="flex justify-end items-center">
                                                {
                                                    item.progress === 0 && (
                                                        <Button
                                                            size="default"
                                                            onClick={() => router.push(`/course-enroll/${item.course._id}`)}
                                                            className='hover:cursor-pointer shadow-sm hover:shadow-md transition-shadow'
                                                        >
                                                            Start Learning
                                                        </Button>
                                                    )
                                                }

                                                {
                                                    item.progress !== 0 && !item.completed && (
                                                        <Button
                                                            size="default"
                                                            onClick={() => router.push(`/course-enroll/${item.course._id}`)}
                                                            className='hover:cursor-pointer shadow-sm hover:shadow-md transition-shadow'
                                                        >
                                                            Continue Learning
                                                        </Button>
                                                    )
                                                }

                                                {
                                                    item.progress === 100 && item.completed && (
                                                        <div className='flex justify-center items-center gap-5'>
                                                            <Button
                                                                size="default"
                                                                onClick={() => router.push(`/review/${item.course._id}`)}
                                                                className='hover:cursor-pointer shadow-sm hover:shadow-md transition-shadow'
                                                            >
                                                                Review Course
                                                            </Button>
                                                            <Button
                                                                size="default"
                                                                onClick={() => router.push(`/course-enroll/${item.course._id}`)}
                                                                className='hover:cursor-pointer shadow-sm hover:shadow-md transition-shadow'
                                                            >
                                                                Continue Learning
                                                            </Button>
                                                        </div>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MyCourses;