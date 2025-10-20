"use client";
import React, { useEffect, useState } from "react";
import PostItem from "./PostItem";
import PostPagination from "./PostPagination";
import Loader from "../Loader";

interface PostAuthor {
    _id: string;
    name: string;
    avatar: {
        public_id?: string;
        url: string;
    };
}

interface Post {
    _id: string;
    title: string;
    slug: string;
    shortDescription?: string;
    coverImage: {
        public_id?: string;
        url: string;
    };
    tags: string[];
    authorId: PostAuthor;
    createdAt: string;
    contentHtml: string;
    readingTimeMinutes: number;
}

interface PaginationMeta {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

const Post = () => {
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PaginationMeta>({
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10
    });

    const fetchAllPosts = async (page: number, limit: number) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/public/posts?page=${page}&limit=${limit}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                }
            );
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData?.message || 'Error fetching posts');

            setAllPosts(responseData?.paginatedResult?.data || []);
            setMeta(responseData?.paginatedResult?.meta || {
                totalItems: 0,
                totalPages: 1,
                currentPage: 1,
                pageSize: 10
            });
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllPosts(meta.currentPage, meta.pageSize);
    }, [meta.currentPage, meta.pageSize]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="theme-mode min-h-screen">
            <div className="container">
                {/* Header */}
                <div className="my-8">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Featured Posts
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        A curated collection of makeup tutorials and beauty lessons, helping you master techniques from beginner basics to professional styles.
                    </p>
                </div>

                {/* Posts List */}
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <div className="flex flex-col gap-8">
                            {allPosts.map((post) => (
                                <PostItem key={post._id} post={post} />
                            ))}
                        </div>

                        {/* Always show pagination */}
                        <PostPagination
                            currentPage={meta.currentPage}
                            totalPages={Math.max(meta.totalPages, 1)}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Post;