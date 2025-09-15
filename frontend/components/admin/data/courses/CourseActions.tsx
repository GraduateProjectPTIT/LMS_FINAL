"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, Copy } from "lucide-react";
import { ICourseListItem } from "@/type";
import toast from 'react-hot-toast';
import Link from "next/link";

interface CourseActionsProps {
    course: ICourseListItem;
    onDelete: (course: ICourseListItem) => void;
}

const CourseActions = ({
    course,
    onDelete
}: CourseActionsProps) => {
    const handleCopyId = () => {
        navigator.clipboard.writeText(course._id);
        toast.success("Course ID copied to clipboard");
    };

    const handleDelete = () => {
        onDelete(course);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyId} className="cursor-pointer">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Course ID
                </DropdownMenuItem>

                <Link href={`/course/${course._id}`}>
                    <DropdownMenuItem className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                </Link>

                <Link href={`/tutor/courses/edit/${course._id}`}>
                    <DropdownMenuItem className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Course
                    </DropdownMenuItem>
                </Link>

                <DropdownMenuItem
                    onClick={handleDelete}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Course
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default CourseActions;