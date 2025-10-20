"use client";

import React from "react";
import { X, Calendar, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    contentHtml: string;
    shortDescription: string;
    tags: string;
    coverImage: string;
    status: "draft" | "published";
}

export default function PostPreview({
    isOpen,
    onClose,
    title,
    contentHtml,
    shortDescription,
    tags,
    coverImage,
    status,
}: PostPreviewProps) {
    if (!isOpen) return null;

    const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col m-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Post Preview
                        </h2>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${status === "published"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                }`}
                        >
                            {status === "published" ? "Published" : "Draft"}
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <article className="max-w-4xl mx-auto">
                        {/* Cover Image */}
                        {coverImage && (
                            <div className="mb-8 rounded-lg overflow-hidden">
                                <img
                                    src={coverImage}
                                    alt={title}
                                    className="w-full h-auto max-h-96 object-cover"
                                />
                            </div>
                        )}

                        {/* Title */}
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {title || "Untitled Post"}
                        </h1>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Author Name</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{currentDate}</span>
                            </div>
                        </div>

                        {/* Short Description */}
                        {shortDescription && (
                            <div className="mb-8 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border-l-4 border-blue-500">
                                <p className="text-gray-700 dark:text-gray-300 italic">
                                    {shortDescription}
                                </p>
                            </div>
                        )}

                        {/* Tags */}
                        {tagList.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mb-8">
                                <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                {tagList.map((tag, index) => (
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
                            dangerouslySetInnerHTML={{
                                __html: contentHtml || "<p>No content yet...</p>",
                            }}
                        />
                    </article>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}