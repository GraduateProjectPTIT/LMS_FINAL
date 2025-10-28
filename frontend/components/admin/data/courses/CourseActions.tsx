"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Eye, Copy } from "lucide-react";
import toast from 'react-hot-toast';
import Link from "next/link";

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

interface CourseActionsProps {
    course: ICourseData;
    onDelete: (course: ICourseData) => void;
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

                <Link href={`/course-overview/${course._id}`}>
                    <DropdownMenuItem className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        View Course
                    </DropdownMenuItem>
                </Link>

                <Link href={`/course-enroll/${course._id}`}>
                    <DropdownMenuItem className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        Enroll Course
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