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
import toast from 'react-hot-toast';
import Link from "next/link";

interface PostActionProps {
    postId: string;
    postStatus: "draft" | "published";
    postSlug: string;
    onDelete: () => void;
}

const PostAction = ({
    postId,
    postStatus,
    postSlug,
    onDelete
}: PostActionProps) => {
    const handleCopyId = () => {
        navigator.clipboard.writeText(postId);
        toast.success("Post ID copied to clipboard");
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

                <DropdownMenuItem
                    onClick={onDelete}
                    className="cursor-pointer text-red-600 focus:text-red-600 "
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default PostAction;