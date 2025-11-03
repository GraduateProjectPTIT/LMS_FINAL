"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image';
import { Calendar, User, Tag, ArrowLeft } from 'lucide-react';
import Loader from '../Loader';
import { getValidThumbnail, isValidImageUrl } from "@/utils/handleImage";
import Link from 'next/link';
import { Button } from '../ui/button';

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
}

const PostContent = ({ slug }: { slug: string }) => {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPost = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/public/posts/${slug}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch post');
            }
            setPost(data.post);
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return <Loader />;
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            Post not found
                        </h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/posts">
                    <Button type="button" variant="outline" size="sm" className="gap-2 mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </Link>

                {/* Cover Image */}
                {post.coverImage?.url && (
                    <div className="mb-8 rounded-lg overflow-hidden">
                        <div className="relative w-full h-auto max-h-96">
                            <Image
                                src={getValidThumbnail(post.coverImage.url)}
                                alt={post.title}
                                width={1200}
                                height={600}
                                className="w-full h-auto object-cover"
                                priority
                            />
                        </div>
                    </div>
                )}

                {/* Title */}
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {post.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
                    {/* Author */}
                    <div className="flex items-center gap-2">
                        {post.authorId?.avatar?.url && isValidImageUrl(post.authorId.avatar.url) ? (
                            <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                <Image
                                    src={post.authorId.avatar.url}
                                    alt={post.authorId.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <User className="h-4 w-4" />
                        )}
                        <span>{post.authorId?.name || 'Author'}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(post.createdAt)}</span>
                    </div>
                </div>

                {/* Short Description */}
                {post.shortDescription && (
                    <div className="mb-8 p-4 bg-gray-100 dark:bg-slate-800 rounded-lg border-l-4 border-blue-500">
                        <p className="text-gray-700 dark:text-gray-300 italic">
                            {post.shortDescription}
                        </p>
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-8">
                        <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        {post.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div
                    className="prose prose-lg dark:prose-invert max-w-none
                        prose-headings:text-gray-900 dark:prose-headings:text-white
                        prose-p:text-gray-700 dark:prose-p:text-gray-300
                        prose-a:text-blue-600 dark:prose-a:text-blue-400
                        prose-strong:text-gray-900 dark:prose-strong:text-white
                        prose-code:text-gray-900 dark:prose-code:text-white
                        prose-pre:bg-gray-900 dark:prose-pre:bg-slate-950
                        prose-img:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                />
            </article>
        </div>
    );
};

export default PostContent;