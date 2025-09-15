"use client"

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ICourseListItem } from "@/type";
import CourseActions from './CourseActions';
import Image from 'next/image';
import { Calendar, DollarSign, Star, Users } from 'lucide-react';
import Loader from "@/components/Loader";

interface CoursesTableProps {
    courses: ICourseListItem[];
    onDelete: (course: ICourseListItem) => void;
    isLoading?: boolean;
}

const CoursesTable = ({
    courses,
    onDelete,
    isLoading = false
}: CoursesTableProps) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCategories = (categories: any[]) => {
        if (!categories || categories.length === 0) return 'No categories';
        return categories.map(cat => cat.title).join(', ');
    };

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Image</TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Categories</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Ratings</TableHead>
                                <TableHead>Purchased</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    if (!courses || courses.length === 0) {
        return (
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Image</TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Categories</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Ratings</TableHead>
                                <TableHead>Purchased</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8">
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="text-gray-400 dark:text-gray-600">
                                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400">No courses found</p>
                                        <p className="text-sm text-gray-400 dark:text-gray-600">Try adjusting your search criteria</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">Image</TableHead>
                            <TableHead>Course Name</TableHead>
                            <TableHead>Categories</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Ratings</TableHead>
                            <TableHead>Purchased</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-16">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {courses.map((course) => (
                            <TableRow key={course._id}>
                                <TableCell>
                                    <div className="w-12 h-12 relative rounded overflow-hidden">
                                        <Image
                                            src={course.thumbnail?.url || '/placeholder-course.jpg'}
                                            alt={course.name}
                                            fill
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="max-w-[200px]">
                                        <p className="font-medium text-sm truncate" title={course.name}>
                                            {course.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1" title={course.description}>
                                            {course.description}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="max-w-[150px]">
                                        <p className="text-sm truncate" title={formatCategories(course.categories)}>
                                            {formatCategories(course.categories)}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-1">
                                        <DollarSign className="h-3 w-3 text-green-600" />
                                        <span className="font-medium">{formatPrice(course.price)}</span>
                                    </div>
                                    {course.estimatedPrice != null && course.estimatedPrice > course.price && (
                                        <p className="text-xs text-gray-500 line-through">
                                            {formatPrice(course.estimatedPrice)}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-1`}>
                                        {course.level}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-1">
                                        <Star className="h-3 w-3 text-yellow-500" />
                                        <span className="text-sm">{course.ratings}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-1">
                                        <Users className="h-3 w-3 text-blue-500" />
                                        <span className="text-sm">{course.purchased}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-3 w-3 text-gray-500" />
                                        <span className="text-sm">{formatDate(course.createdAt)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <CourseActions course={course} onDelete={onDelete} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default CoursesTable;