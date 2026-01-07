"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { HiOutlineClipboardList } from "react-icons/hi";
import { format } from "timeago.js";

interface IUser {
    _id: string;
    name: string;
    email: string;
    avatar?: {
        public_id?: string;
        url: string;
    };
}

interface ICourse {
    _id: string;
    name: string;
}

interface IAssessment {
    status: string;
    passed?: boolean;
    feedback?: string;
}

interface IAssessmentData {
    _id: string;
    userId: IUser;
    courseId: ICourse;
    assessment: IAssessment;
    createdAt: string;
    updatedAt: string;
}

interface AssessmentsTableProps {
    assessments: IAssessmentData[];
    onGrade: (assessment: IAssessmentData) => void;
    isLoading?: boolean;
}

const AssessmentsTable = ({
    assessments,
    onGrade,
    isLoading = false,
}: AssessmentsTableProps) => {
    const getStatusBadge = (assessment: IAssessment) => {
        if (assessment.status === "graded") {
            return assessment.passed ? (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    Passed
                </span>
            ) : (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                    Failed
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                {assessment.status}
            </span>
        );
    };

    // Display skeleton when isLoading is true
    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md border border-gray-200 dark:border-slate-700">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="border-r">Student</TableHead>
                                <TableHead className="border-r">Course</TableHead>
                                <TableHead className="border-r">Status</TableHead>
                                <TableHead className="border-r">Submitted At</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell className="border-r">
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="border-r">
                                        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell className="border-r">
                                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                    </TableCell>
                                    <TableCell className="border-r">
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-center">
                                            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    if (!assessments || assessments.length === 0) {
        return (
            <div className="w-full">
                <div className="rounded-md border border-gray-200 dark:border-slate-700">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="border-r">Student</TableHead>
                                <TableHead className="border-r">Course</TableHead>
                                <TableHead className="border-r">Status</TableHead>
                                <TableHead className="border-r">Submitted At</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="text-gray-400 dark:text-gray-600">
                                            <HiOutlineClipboardList className="h-12 w-12" />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            No assessments found
                                        </p>
                                        <p className="text-sm text-gray-400 dark:text-gray-600">
                                            Student submissions will appear here
                                        </p>
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
            <div className="rounded-md border border-gray-200 dark:border-slate-700">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="border-r">Student</TableHead>
                            <TableHead className="border-r">Course</TableHead>
                            <TableHead className="border-r">Status</TableHead>
                            <TableHead className="border-r">Submitted At</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assessments.map((item) => (
                            <TableRow key={item._id}>
                                {/* Student */}
                                <TableCell className="border-r">
                                    <div>
                                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                                            {item.userId.name}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {item.userId.email}
                                        </p>
                                    </div>
                                </TableCell>

                                {/* Course */}
                                <TableCell className="border-r">
                                    <div className="max-w-[300px]">
                                        <p
                                            className="text-sm text-gray-900 dark:text-white truncate"
                                            title={item.courseId.name}
                                        >
                                            {item.courseId.name}
                                        </p>
                                    </div>
                                </TableCell>

                                {/* Status */}
                                <TableCell className="border-r">
                                    {getStatusBadge(item.assessment)}
                                </TableCell>

                                {/* Submitted At */}
                                <TableCell className="border-r">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {format(item.updatedAt)}
                                    </span>
                                </TableCell>

                                {/* Action */}
                                <TableCell>
                                    <div className="flex justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onGrade(item)}
                                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        >
                                            {item.assessment.status === "graded"
                                                ? "View / Edit"
                                                : "Grade"}
                                        </Button>
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

export default AssessmentsTable;