"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, Copy, CheckCircle, XCircle } from "lucide-react";
import toast from 'react-hot-toast';
import Link from "next/link";

interface PostActionProps {
    postId: string;
    postStatus: "draft" | "published";
    postSlug: string;
    onToggleStatus: () => void;
    onDelete: () => void;
}

const PostAction = ({
    postId,
    postStatus,
    postSlug,
    onToggleStatus,
    onDelete
}: PostActionProps) => {
    const handleCopyId = () => {
        navigator.clipboard.writeText(postId);
        toast.success("Post ID copied to clipboard");
    };

    const isPublished = postStatus === "published";

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
                    Copy Post ID
                </DropdownMenuItem>

                <Link href={`/posts/${postSlug}`}>
                    <DropdownMenuItem className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        View Post
                    </DropdownMenuItem>
                </Link>

                <Link href={`/admin/posts/edit/${postId}`}>
                    <DropdownMenuItem className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Post
                    </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={onToggleStatus}
                    className={`cursor-pointer ${isPublished
                        ? "text-orange-600 focus:text-orange-600 focus:bg-orange-50 dark:focus:bg-orange-900/20"
                        : "text-green-600 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-900/20"
                        }`}
                >
                    {isPublished ? (
                        <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Unpublish Post
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Publish Post
                        </>
                    )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={onDelete}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default PostAction;