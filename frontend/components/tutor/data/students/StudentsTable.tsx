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
import Image from 'next/image';
import { HiOutlineUserGroup } from "react-icons/hi";
import { CheckCircle2, Circle } from "lucide-react";
import StudentActions from './StudentActions';

interface IAvatar {
    public_id?: string;
    url: string;
}

interface IUser {
    _id: string;
    name: string;
    email: string;
    avatar: IAvatar;
}

interface IStudentData {
    _id: string;
    userId: IUser;
    progress: number;
    completed: boolean;
    enrolledAt: string;
}

interface StudentsTableProps {
    students: IStudentData[];
    isLoading?: boolean;
}

const StudentsTable = ({
    students,
    isLoading = false
}: StudentsTableProps) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'text-green-600 dark:text-green-400';
        if (progress >= 50) return 'text-blue-600 dark:text-blue-400';
        if (progress >= 20) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    const getProgressBgColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-blue-500';
        if (progress >= 20) return 'bg-yellow-500';
        return 'bg-gray-300 dark:bg-gray-600';
    };

    // Display skeleton when isLoading is true
    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Enrolled At</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    if (!students || students.length === 0) {
        return (
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Enrolled At</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="text-gray-400 dark:text-gray-600">
                                            <HiOutlineUserGroup className="h-12 w-12" />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400">No students found</p>
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
                            <TableHead className='border-r'>Student</TableHead>
                            <TableHead className='border-r'>Email</TableHead>
                            <TableHead className='border-r'>Progress</TableHead>
                            <TableHead className='border-r'>Status</TableHead>
                            <TableHead>Enrolled At</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student._id}>
                                {/* Student Info with Avatar */}
                                <TableCell className='border-r'>
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                            {student.userId?.avatar?.url ? (
                                                <Image
                                                    src={student.userId.avatar.url}
                                                    alt={student.userId.name || 'Student'}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold">
                                                    {student.userId?.name?.charAt(0).toUpperCase() || 'S'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="max-w-[200px]">
                                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate" title={student.userId?.name}>
                                                {student.userId?.name || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Email */}
                                <TableCell className='border-r'>
                                    <div className="max-w-[250px]">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate block" title={student.userId?.email}>
                                            {student.userId?.email || 'N/A'}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* Progress */}
                                <TableCell className='border-r'>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${getProgressBgColor(student.progress)}`}
                                                style={{ width: `${student.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className={`text-sm font-medium ${getProgressColor(student.progress)}`}>
                                            {student.progress}%
                                        </span>
                                    </div>
                                </TableCell>

                                {/* Status */}
                                <TableCell className='border-r'>
                                    <div className="flex items-center gap-2">
                                        {student.completed ? (
                                            <>
                                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                                    Completed
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    In Progress
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Enrolled At */}
                                <TableCell>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {formatDate(student.enrolledAt)}
                                    </span>
                                </TableCell>

                                <TableCell>
                                    <div className='w-full h-full flex justify-center items-center'>
                                        <StudentActions student={student} />
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

export default StudentsTable;