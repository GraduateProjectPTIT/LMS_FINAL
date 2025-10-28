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
import CourseActions from './CourseActions';
import { HiOutlineBookOpen } from "react-icons/hi";

interface ICategory {
    _id: string;
    title: string;
}

interface IThumbnail {
    public_id: string;
    url: string;
}

interface ICreator {
    _id: string;
    name: string;
    email: string;
    avatar: {
        public_id?: string;
        url: string;
    };
    bio?: string;
}

interface ICourseData {
    _id: string;
    name: string;
    description: string;
    categories: ICategory[];
    price: number;
    estimatedPrice: number;
    thumbnail: IThumbnail;
    tags: string;
    level: string;
    ratings: number;
    purchased: number;
    creatorId: ICreator;
    createdAt: string;
    updatedAt: string;
}

interface CoursesTableProps {
    courses: ICourseData[];
    onDelete: (course: ICourseData) => void;
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

    // Display skeleton when isLoading is true
    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Creator</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Estimated Price</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Ratings</TableHead>
                                <TableHead>Purchased</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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
                                <TableHead>Course Name</TableHead>
                                <TableHead>Creator</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Estimated Price</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Ratings</TableHead>
                                <TableHead>Purchased</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8">
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="text-gray-400 dark:text-gray-600">
                                            <HiOutlineBookOpen className="h-12 w-12" />
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
                            <TableHead className='border-r'>Course Name</TableHead>
                            <TableHead className='border-r'>Creator</TableHead>
                            <TableHead className='border-r'>Price</TableHead>
                            <TableHead className='border-r'>Estimated Price</TableHead>
                            <TableHead className='border-r'>Level</TableHead>
                            <TableHead className='border-r'>Ratings</TableHead>
                            <TableHead className='border-r'>Purchased</TableHead>
                            <TableHead className='border-r'>Created At</TableHead>
                            <TableHead className="w-16 text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {courses.map((course) => (
                            <TableRow key={course._id}>
                                {/* Course Name */}
                                <TableCell className='border-r'>
                                    <div className="max-w-[300px]">
                                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate" title={course.name}>
                                            {course.name}
                                        </p>
                                    </div>
                                </TableCell>
                                {/* Creator */}
                                <TableCell className='border-r'>
                                    <div className="max-w-[150px]">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate block" title={course.creatorId?.name}>
                                            {course.creatorId?.name || 'N/A'}
                                        </span>
                                    </div>
                                </TableCell>
                                {/* Price */}
                                <TableCell className='border-r'>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {formatPrice(course.price)}
                                    </span>
                                </TableCell>
                                {/* Estimated Price */}
                                <TableCell className='border-r'>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {formatPrice(course.estimatedPrice)}
                                    </span>
                                </TableCell>
                                {/* Level */}
                                <TableCell className='border-r'>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {course.level}
                                    </span>
                                </TableCell>
                                {/* Ratings */}
                                <TableCell className='border-r'>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {course.ratings.toFixed(1)}
                                    </span>
                                </TableCell>
                                {/* Purchased */}
                                <TableCell className='border-r'>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {course.purchased}
                                    </span>
                                </TableCell>
                                {/* Created At */}
                                <TableCell className='border-r'>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {formatDate(course.createdAt)}
                                    </span>
                                </TableCell>
                                {/* Actions */}
                                <TableCell>
                                    <div className='w-full h-full flex justify-center items-center'>
                                        <CourseActions course={course} onDelete={onDelete} />
                                    </div>
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