"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, Copy, Users, ArrowRightToLine } from "lucide-react";
import toast from 'react-hot-toast';
import Link from "next/link";

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

interface StudentActionsProps {
    student: IStudentData;
}

const StudentActions = ({ student }: StudentActionsProps) => {

    const handleCopyId = () => {
        navigator.clipboard.writeText(student._id);
        toast.success("Student ID copied to clipboard");
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
                <DropdownMenuItem className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    View Student Details
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                    <Trash2 className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20" />
                    Remove Student
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default StudentActions