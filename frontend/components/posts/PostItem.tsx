"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BookmarkIcon, User } from 'lucide-react';
import { BsThreeDots } from 'react-icons/bs';
import { getValidThumbnail, isValidImageUrl } from "@/utils/handleImage";

interface PostAuthor {
    _id: string;
    name: string;
    avatar: {
        public_id?: string;
        url: string;
    };
}

interface PostItemProps {
    post: {
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
    };
}

const PostItem = ({ post }: PostItemProps) => {

    const router = useRouter();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
            return `${diffDays} days ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} months ago`;
        } else {
            return date.toLocaleDateString('en-US');
        }
    };

    return (
        <div onClick={() => router.push(`/posts/${post.slug}`)} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col gap-4 p-4 hover:cursor-pointer">
            {/* Header */}
            <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-100 dark:border-blue-900 shadow-md">
                        {post.authorId?.avatar?.url && isValidImageUrl(post.authorId.avatar.url) ? (
                            <Image
                                src={post.authorId.avatar.url}
                                alt={post.authorId.name || "Instructor"}
                                fill
                                sizes="128px"
                                style={{ objectFit: "cover" }}
                                className="rounded-full"
                            />
                        ) : (
                            <div className="w-full h-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                                <User size={48} className="text-indigo-600 dark:text-indigo-300" />
                            </div>
                        )}
                    </div>
                    <p className='font-semibold text-[16px]'>{post?.authorId?.name || "Author"}</p>
                </div>
                <div className='flex items-center gap-2'>
                    <BookmarkIcon className='w-5 h-5 text-gray-700 dark:text-slate-300' />
                    <BsThreeDots className='w-5 h-5 text-gray-700 dark:text-slate-300' />
                </div>
            </div>

            {/* Body */}
            <div className='flex w-full justify-between items-center gap-10'>
                <div className='w-full md:w-3/4 flex flex-col items-start gap-3'>
                    <h3 className='font-semibold text-lg'>{post?.title}</h3>
                    <p className='text-gray-600'>{post?.shortDescription}</p>
                    <div className='flex items-center gap-2 text-sm'>
                        <span className='bg-gray-100 dark:bg-slate-500 py-2 px-4 rounded-xl'>{post?.tags.join(", ")}</span>
                        <span className='text-gray-400 dark:text-slate-500'>|</span>
                        <span>{formatDate(post?.createdAt)}</span>
                        <span className='text-gray-400 dark:text-slate-500'>|</span>
                        <span>{post?.readingTimeMinutes} min read</span>
                    </div>
                </div>
                <div className='hidden md:w-1/4 md:block relative h-50 rounded-lg overflow-hidden'>
                    <Image
                        src={getValidThumbnail(post?.coverImage?.url)}
                        alt={post?.title || "Post Image"}
                        fill
                        priority
                        className="group-hover:scale-105 transition-transform duration-500 object-cover"
                        quality={100}
                    />
                </div>
            </div>
        </div>
    );
};

export default PostItem;