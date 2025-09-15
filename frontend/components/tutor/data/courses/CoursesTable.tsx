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
import Image from 'next/image';
import { Calendar, DollarSign, Star, Users } from 'lucide-react';
import Loader from "@/components/Loader";
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
        public_id: string;
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

    // hiển thị skeleton khi isLoading là true
    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Estimated Price</TableHead>
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
                                <TableHead>Course Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Estimated Price</TableHead>
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
                            <TableHead>Course Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Estimated Price</TableHead>
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
                                    <div className="max-w-[300px]">
                                        <p className="font-medium text-sm truncate" title={course.name}>
                                            {course.name}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="flex items-center space-x-1">
                                        {formatPrice(course.price)}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="flex items-center space-x-1">
                                        {formatPrice(course.estimatedPrice)}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="flex items-center space-x-1">
                                        {course.level}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-sm">{course.ratings}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-sm">{course.purchased}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-1">
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