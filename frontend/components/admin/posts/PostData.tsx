"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus } from "lucide-react";
import { HiOutlineDocument } from "react-icons/hi";
import { IImageAsset } from "@/type";
import PostAction from "./PostAction";
import toast from "react-hot-toast";
import DeletePostModal from "./DeletePostModal";

interface Author {
    _id: string;
    name: string;
    email: string;
    avatar: IImageAsset;
};

interface Post {
    _id: string;
    title: string;
    slug: string;
    status: "draft" | "published";
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    authorId: Author;
    coverImage?: IImageAsset;
    readingTimeMinutes: number;
};

interface PaginationInfo {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

const PostsData = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 10
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (page: number, limit: number) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/post?page=${page}&limit=${limit}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: 'include',
                }
            );
            const responseData = await res.json();
            if (!res.ok) {
                throw new Error(responseData.message || 'Failed to fetch posts');
            }

            setPosts(responseData.paginatedResult.data || []);
            setPagination({
                totalItems: responseData.paginatedResult.meta.totalItems ?? 0,
                totalPages: responseData.paginatedResult.meta.totalPages ?? 0,
                currentPage: responseData.paginatedResult.meta.currentPage ?? page,
                pageSize: responseData.paginatedResult.meta.pageSize ?? limit
            });
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || "Error loading data");
            console.error("Fetch posts error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(pagination.currentPage, pagination.pageSize);
    }, [pagination.currentPage, pagination.pageSize]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            // hour: '2-digit',
            // minute: '2-digit'
        });
    };

    // Pagination handlers
    const handlePageChange = (nextPage: number) => {
        setPagination(prev => ({ ...prev, currentPage: nextPage }));
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLimit = Number(e.target.value);
        setPagination(prev => ({
            ...prev,
            currentPage: 1,
            pageSize: newLimit
        }));
    };

    const handleFirstPage = () => {
        if (pagination.currentPage > 1) {
            handlePageChange(1);
        }
    };

    const handlePrevPage = () => {
        if (pagination.currentPage > 1) {
            handlePageChange(pagination.currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (pagination.currentPage < pagination.totalPages) {
            handlePageChange(pagination.currentPage + 1);
        }
    };

    const handleLastPage = () => {
        if (pagination.currentPage < pagination.totalPages) {
            handlePageChange(pagination.totalPages);
        }
    };

    const hasPrevPage = pagination.currentPage > 1;
    const hasNextPage = pagination.currentPage < pagination.totalPages;

    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        post: Post | null;
    }>({
        isOpen: false,
        post: null,
    });

    const handleDeletePost = (post: Post) => {
        setDeleteModal({ isOpen: true, post });
    };

    const confirmDelete = async () => {
        if (!deleteModal.post) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/post/${deleteModal.post._id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.message || "Failed to delete post");
            }

            toast.success("Post deleted successfully");

            // Refresh data
            await fetchData(pagination.currentPage, pagination.pageSize);
        } catch (error: any) {
            throw error; // Modal sẽ xử lý
        }
    };

    return (
        <div className="w-full p-4">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 uppercase font-semibold">
                        Manage and track all posts
                    </p>
                </div>
                <Link href="/admin/posts/create">
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer">
                        <Plus className="h-4 w-4" />
                        Create Post
                    </Button>
                </Link>
            </div>

            {/* Table */}
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className='border-r'>Title</TableHead>
                                <TableHead className='border-r text-center'>Status</TableHead>
                                <TableHead className='border-r'>Tags</TableHead>
                                <TableHead className='border-r'>Author</TableHead>
                                <TableHead className='border-r'>Created At</TableHead>
                                <TableHead className='border-r text-center'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                // Loading skeleton
                                [...Array(5)].map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell className='border-r'>
                                            <div className="space-y-2">
                                                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                            </div>
                                        </TableCell>
                                        <TableCell className='border-r'>
                                            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
                                        </TableCell>
                                        <TableCell className='border-r'>
                                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </TableCell>
                                        <TableCell className='border-r'>
                                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </TableCell>
                                        <TableCell className='border-r'>
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </TableCell>
                                        <TableCell className='border-r'>
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : error ? (
                                // Error state
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="flex flex-col items-center space-y-2">
                                            <p className="text-red-500 dark:text-red-400">{error}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : posts.length === 0 ? (
                                // Empty state
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="text-gray-400 dark:text-gray-600">
                                                <HiOutlineDocument className="h-12 w-12" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400">No posts found</p>
                                            <p className="text-sm text-gray-400 dark:text-gray-600">Create your first post to get started</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                // Data rows
                                posts.map((post) => (
                                    <TableRow key={post._id}>
                                        {/* Title & Slug */}
                                        <TableCell className='border-r'>
                                            <div className="max-w-[400px]">
                                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate" title={post.title}>
                                                    {post.title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={`/${post.slug}`}>
                                                    /{post.slug}
                                                </p>
                                            </div>
                                        </TableCell>
                                        {/* Status */}
                                        <TableCell className='border-r'>
                                            <div className="flex justify-center">
                                                <span className={
                                                    post.status === "published"
                                                        ? "px-3 py-1 text-xs uppercase font-semibold  text-green-600  dark:text-green-300"
                                                        : "px-3 py-1 text-xs uppercase font-semibold text-gray-700  dark:text-gray-300"
                                                }>
                                                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* Tags */}
                                        <TableCell className='border-r'>
                                            <div className="max-w-[200px]">
                                                <span className="text-sm text-gray-600 dark:text-gray-300 truncate block" title={post.tags?.join(", ")}>
                                                    {post.tags && post.tags.length > 0 ? post.tags.join(", ") : "-"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* Author */}
                                        <TableCell className='border-r'>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {post.authorId?.name || "-"}
                                            </span>
                                        </TableCell>
                                        {/* Created At */}
                                        <TableCell className='border-r'>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {formatDate(post.createdAt)}
                                            </span>
                                        </TableCell>
                                        <TableCell className='w-full h-full flex justify-center items-center'>
                                            <PostAction
                                                postId={post._id}
                                                postStatus={post.status}
                                                postSlug={post.slug}
                                                onDelete={() => handleDeletePost(post)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {!loading && posts.length > 0 && (
                <div className="flex flex-row items-center justify-between gap-2 md:gap-4 py-4">
                    {/* Page size selector */}
                    <div className="flex items-center space-x-2">
                        <span className="hidden md:block text-sm text-gray-600 dark:text-gray-300">
                            Rows per page:
                        </span>
                        <span className="block md:hidden text-sm text-gray-600 dark:text-gray-300">
                            Rows :
                        </span>
                        <select
                            value={pagination.pageSize}
                            onChange={handleLimitChange}
                            disabled={loading}
                            className="border border-gray-300 dark:border-slate-500 rounded px-2 py-1 text-sm bg-white dark:bg-slate-800 disabled:opacity-50"
                        >
                            {[5, 10, 20, 30, 40, 50].map(size => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center space-x-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFirstPage}
                            disabled={!hasPrevPage || loading}
                            className="h-8 w-8 p-0 hover:cursor-pointer"
                            title="First page"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={!hasPrevPage || loading}
                            className="h-8 w-8 p-0 hover:cursor-pointer"
                            title="Previous page"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center space-x-1 px-3">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <span className="hidden md:inline text-sm text-gray-500 dark:text-gray-400">
                                ({pagination.totalItems} posts)
                            </span>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={!hasNextPage || loading}
                            className="h-8 w-8 p-0 hover:cursor-pointer"
                            title="Next page"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLastPage}
                            disabled={!hasNextPage || loading}
                            className="h-8 w-8 p-0 hover:cursor-pointer"
                            title="Last page"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <DeletePostModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, post: null })}
                onConfirm={confirmDelete}
                postTitle={deleteModal.post?.title || ""}
                postId={deleteModal.post?._id || ""}
            />
        </div>
    );
}

export default PostsData;