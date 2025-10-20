"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Copy, Trash2, Mail } from "lucide-react";
import toast from 'react-hot-toast';
import Link from "next/link";

interface IMedia {
    public_id?: string;
    url: string;
}

interface ISocial {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
}

interface IUserResponse {
    _id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    isSurveyCompleted: boolean;
    avatar: IMedia;
    socials: ISocial;
    createdAt: string;
    updatedAt: string;
}

interface UsersActionsProps {
    user: IUserResponse;
    onDelete: (user: IUserResponse) => void;
}

const UsersActions = ({
    user,
    onDelete
}: UsersActionsProps) => {
    const handleCopyId = () => {
        navigator.clipboard.writeText(user._id);
        toast.success("User ID copied to clipboard");
    };

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(user.email);
        toast.success("Email copied to clipboard");
    };

    const handleDelete = () => {
        onDelete(user);
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
                    Copy User ID
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleCopyEmail} className="cursor-pointer">
                    <Mail className="mr-2 h-4 w-4" />
                    Copy Email
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={handleDelete}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UsersActions;