"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { FaReply, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import Loader from '../Loader'
import { isValidImageUrl } from "@/utils/handleImage";
import Image from 'next/image'
import { User } from 'lucide-react'
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getFieldStatus, getFieldBorderClass, getFieldIcon } from "@/utils/formFieldHelpers";
import { IoAlertCircleOutline } from 'react-icons/io5'

interface User {
    _id: string;
    name: string;
    avatar: {
        public_id?: string;
        url: string;
    };
}

interface Reply {
    _id: string;
    content: string;
    parentId: string;
    createdAt: string;
    updatedAt: string;
    userId: User;
}

interface Comment {
    _id: string;
    content: string;
    parentId: null;
    createdAt: string;
    updatedAt: string;
    userId: User;
    replies: Reply[];
}

interface LectureQuestionsProps {
    courseId: string;
    contentId: string;
}

const commentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment cannot exceed 1000 characters").trim(),
});

const replySchema = z.object({
    content: z.string().min(1, "Reply cannot be empty").max(1000, "Reply cannot exceed 1000 characters").trim(),
});

type CommentFormValues = z.infer<typeof commentSchema>;
type ReplyFormValues = z.infer<typeof replySchema>;

const LectureQuestions = ({ courseId, contentId }: LectureQuestionsProps) => {

    const {
        register: registerComment,
        handleSubmit: handleSubmitComment,
        watch: watchComment,
        reset: resetComment,
        formState: { errors: commentErrors, isValid: isCommentValid, touchedFields: touchedComment }
    } = useForm<CommentFormValues>({
        resolver: zodResolver(commentSchema),
        mode: "onChange",
        defaultValues: {
            content: '',
        }
    });

    const {
        register: registerReply,
        handleSubmit: handleSubmitReply,
        watch: watchReply,
        reset: resetReply,
        formState: { errors: replyErrors, isValid: isReplyValid, touchedFields: touchedReply }
    } = useForm<ReplyFormValues>({
        resolver: zodResolver(replySchema),
        mode: "onChange",
        defaultValues: {
            content: '',
        }
    });

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
    const [isReplySubmitting, setIsReplySubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch comments
    const fetchComments = useCallback(async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/${courseId}/lectures/${contentId}/comments?page=${page}&limit=10`,
                {
                    method: "GET",
                    credentials: 'include',
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                setComments(data.paginatedResult.data);
                setCurrentPage(data.paginatedResult.meta.currentPage);
                setTotalPages(data.paginatedResult.meta.totalPages);

                // Auto-expand comments with replies
                const commentsWithReplies = new Set<string>(
                    data.paginatedResult.data
                        .filter((c: Comment) => c.replies.length > 0)
                        .map((c: Comment) => c._id)
                );
                setExpandedComments(commentsWithReplies);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    }, [courseId, contentId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // Add new question
    const handleAddQuestion = async (data: CommentFormValues) => {
        if (isCommentSubmitting) return;

        setIsCommentSubmitting(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/add_comment_to_lecture`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        comment: data.content,
                        courseId,
                        contentId,
                    }),
                }
            );

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                resetComment();
                fetchComments(currentPage); // Refresh comments
            } else {
                console.error('Failed to add question:', responseData.message);
            }
        } catch (error) {
            console.error('Error adding question:', error);
        } finally {
            setIsCommentSubmitting(false);
        }
    };

    // Add reply to comment
    const handleAddReply = async (commentId: string, data: ReplyFormValues) => {

        if (isReplySubmitting) return;

        setIsReplySubmitting(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/add_reply_to_comment`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        reply: data.content,
                        courseId,
                        contentId,
                        commentId,
                    }),
                }
            );

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                resetReply();
                setReplyingTo(null);
                fetchComments(currentPage); // Refresh comments
            } else {
                console.error('Failed to add reply:', responseData.message);
            }
        } catch (error) {
            console.error('Error adding reply:', error);
        } finally {
            setIsReplySubmitting(false);
        }
    };

    // Toggle comment expansion
    const toggleExpanded = (commentId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const fieldComment = (name: keyof CommentFormValues, opts?: { isArrayField?: boolean }) => {
        const status = getFieldStatus(name, touchedComment, commentErrors, watchComment(), opts);
        return {
            border: getFieldBorderClass(status),
            icon: getFieldIcon(status)
        }
    }

    const fieldReply = (name: keyof ReplyFormValues, opts?: { isArrayField?: boolean }) => {
        const status = getFieldStatus(name, touchedReply, replyErrors, watchReply(), opts);
        return {
            border: getFieldBorderClass(status),
            icon: getFieldIcon(status)
        }
    }

    if (loading) {
        return (
            <Loader />
        );
    }

    return (
        <div className="space-y-6">
            {/* Add new question form */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Ask a Question
                </h3>
                <form onSubmit={handleSubmitComment(handleAddQuestion)} className="space-y-3">
                    <div className="relative">
                        <textarea
                            {...registerComment("content")}
                            placeholder="Type your question here..."
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none ${fieldComment("content").border}`}
                            rows={3}
                            disabled={isCommentSubmitting}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    handleSubmitComment(handleAddQuestion)();
                                }
                            }}
                        />
                        {touchedComment.content && (
                            <div className="absolute right-3 top-3">
                                {fieldComment("content").icon}
                            </div>
                        )}
                    </div>

                    {commentErrors.content && (
                        <div className="flex items-center gap-2">
                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                            <p className="text-red-400 text-[12px]">{commentErrors.content.message}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(watchComment('content') || '').length}/1000
                        </span>
                        <button
                            type="submit"
                            disabled={isCommentSubmitting || !isCommentValid}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                        >
                            {isCommentSubmitting ? 'Posting...' : 'Post Question'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Comments list */}
            <div className="space-y-4">
                {comments.map((comment) => (
                    <div
                        key={comment._id}
                        className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
                    >
                        {/* Comment header */}
                        <div className="flex items-start gap-3">
                            {/* Avatar */}
                            {
                                comment.userId.avatar.url && isValidImageUrl(comment.userId.avatar.url) ? (
                                    <div className='relative w-10 h-10'>
                                        <Image
                                            src={comment.userId.avatar.url}
                                            alt={comment.userId.name || 'User'}
                                            fill
                                            sizes="40px"
                                            style={{ objectFit: "cover" }}
                                            className="rounded-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                                        <User size={48} className="text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                )
                            }
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {comment.userId.name}
                                    </span>
                                    <span className="text-[12px] text-gray-500 dark:text-gray-400">
                                        {formatDate(comment.createdAt)}
                                    </span>
                                </div>
                                <p className="mt-1 text-gray-700 dark:text-gray-300">
                                    {comment.content}
                                </p>

                                {/* Reply button */}
                                <div className="flex items-center gap-4 mt-3">
                                    <button
                                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                    >
                                        <FaReply size={12} />
                                        Reply
                                    </button>

                                    {comment.replies.length > 0 && (
                                        <button
                                            onClick={() => toggleExpanded(comment._id)}
                                            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        >
                                            {expandedComments.has(comment._id) ? (
                                                <>
                                                    <FaChevronUp size={12} />
                                                    Hide {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronDown size={12} />
                                                    Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Reply form */}
                                {replyingTo === comment._id && (
                                    <form
                                        onSubmit={handleSubmitReply((data) => handleAddReply(comment._id, data))}
                                        className="mt-3 ml-4 space-y-2"
                                    >
                                        <div className="relative">
                                            <textarea
                                                {...registerReply("content")}
                                                placeholder="Write your reply..."
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none text-sm ${fieldReply("content").border}`}
                                                rows={2}
                                                disabled={isReplySubmitting}
                                            />
                                            {touchedReply.content && (
                                                <div className="absolute right-3 top-2">
                                                    {fieldReply("content").icon}
                                                </div>
                                            )}
                                        </div>

                                        {replyErrors.content && (
                                            <div className="flex items-center gap-2">
                                                <IoAlertCircleOutline className="text-red-400 text-sm" />
                                                <p className="text-red-400 text-[12px]">{replyErrors.content.message}</p>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {(watchReply('content') || '').length}/1000
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        resetReply();
                                                    }}
                                                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isReplySubmitting || !isReplyValid}
                                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    {isReplySubmitting ? 'Posting...' : 'Post Reply'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {/* Replies */}
                                {expandedComments.has(comment._id) && comment.replies.length > 0 && (
                                    <div className="mt-4 ml-4 space-y-3 border-l-2 border-gray-200 dark:border-slate-700 pl-4">
                                        {comment.replies.map((reply) => (
                                            <div key={reply._id} className="flex items-start gap-3">
                                                <img
                                                    src={reply.userId.avatar.url}
                                                    alt={reply.userId.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                            {reply.userId.name}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(reply.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                                        {reply.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => fetchComments(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => fetchComments(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                        Next
                    </button>
                </div>
            )}

            {comments.length === 0 && !loading && (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                        No questions yet. Be the first to ask!
                    </p>
                </div>
            )}
        </div>
    );
};

export default LectureQuestions;