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
    const [allTags, setAllTags] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [showAllTags, setShowAllTags] = useState(false);
    const [meta, setMeta] = useState<PaginationMeta>({
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10
    });

    const fetchAllPosts = async (page: number, limit: number, tag?: string | null) => {
        setLoading(true);
        try {
            let url = `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/public/posts?page=${page}&limit=${limit}`;
            if (tag) {
                url += `&tag=${encodeURIComponent(tag)}`;
            }

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
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

    const fetchAllTags = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/public/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || 'Error fetching tags');

            setAllTags(data?.tags || []);
        } catch (error: any) {
            console.log("Error fetching tags:", error.message);
        }
    };

    useEffect(() => {
        fetchAllTags();
    }, []);

    useEffect(() => {
        fetchAllPosts(meta.currentPage, meta.pageSize, selectedTag);
    }, [meta.currentPage, meta.pageSize, selectedTag]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        setMeta(prev => ({ ...prev, currentPage: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTagClick = (tag: string) => {
        if (selectedTag === tag) {
            setSelectedTag(null);
        } else {
            setSelectedTag(tag);
            setMeta(prev => ({ ...prev, currentPage: 1 }));
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const displayedTags = showAllTags ? allTags : allTags.slice(0, 10);
    const hasMoreTags = allTags.length > 10;

    const TagsSection = () => (
        <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">View Posts By Tags</h2>
            <div className="flex flex-wrap gap-2">
                {displayedTags.map((tag, index) => (
                    <button
                        key={index}
                        onClick={() => handleTagClick(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${selectedTag === tag
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
            {hasMoreTags && (
                <button
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                    {showAllTags ? 'Show Less' : `Show More (${allTags.length - 10} more)`}
                </button>
            )}
            {selectedTag && (
                <button
                    onClick={() => setSelectedTag(null)}
                    className="mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                    Clear Filter ✕
                </button>
            )}
        </>
    );

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
                    <div className="w-full flex flex-col md:flex-row gap-4">

                        {/* Tags Section on Mobile Screen */}
                        <div className="w-full flex flex-col md:hidden mb-6">
                            <TagsSection />
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col gap-8">
                                {allPosts.map((post, index) => (
                                    <PostItem key={index} post={post} />
                                ))}
                            </div>

                            {/* Always show pagination */}
                            <PostPagination
                                currentPage={meta.currentPage}
                                totalPages={Math.max(meta.totalPages, 1)}
                                onPageChange={handlePageChange}
                            />
                        </div>

                        {/* Tags Section on Desktop Screen */}
                        <div className="w-full md:w-[300px] hidden md:flex md:flex-col">
                            <TagsSection />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Post;