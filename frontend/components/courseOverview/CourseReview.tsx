"use client"

import { ChevronDown, User, Send } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import { isValidImageUrl } from '@/utils/handleImage';

interface IReview {
    _id: string;
    userId: {
        _id: string;
        name: string;
        avatar: {
            public_id?: string;
            url: string;
        };
    };
    rating: number;
    comment: string;
    replies: IReplyReview[];
    createdAt: string;
    updatedAt: string;
}

interface IReplyReview {
    _id: string;
    userId: {
        _id: string;
        name: string;
        avatar: {
            public_id?: string;
            url: string;
        };
    };
    answer: string;
    createdAt: string;
    updatedAt: string;
}

interface ICourseReviewProps {
    isCreator: boolean;
    courseId: string;
    focusReviewId?: string;
}

const CourseReview = ({ isCreator, courseId, focusReviewId }: ICourseReviewProps) => {
    const [reviews, setReviews] = useState<IReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
    const [loadingReply, setLoadingReply] = useState<string | null>(null);

    const REVIEWS_PER_PAGE = 3;
    const [currentPage, setCurrentPage] = useState(0);
    const [hasScrolledToFocus, setHasScrolledToFocus] = useState(false);
    const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(null);

    // Fetch reviews from API
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/${courseId}/reviews?page=1&limit=50`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            const data = await res.json();

            if (!res.ok) {
                console.log("Fetching reviews failed: ", data.message);
                return;
            }

            setReviews(data.paginatedResult?.data || []);
        } catch (error: any) {
            console.log("Error fetching reviews:", error.message);
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Calculate rating statistics
    const calculateRatingStats = () => {
        if (reviews.length === 0) return { average: 0, distribution: [0, 0, 0, 0, 0] };

        const distribution = [0, 0, 0, 0, 0];
        let totalRating = 0;

        reviews.forEach(review => {
            totalRating += review.rating;
            distribution[review.rating - 1]++;
        });

        const average = totalRating / reviews.length;
        const percentages = distribution.map(count =>
            reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
        );

        return { average, distribution: percentages };
    };

    const { average, distribution } = calculateRatingStats();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    const handleReplyClick = (reviewId: string) => {
        setActiveReplyId(activeReplyId === reviewId ? null : reviewId);
    };

    const handleReplyTextChange = (reviewId: string, text: string) => {
        setReplyTexts(prev => ({ ...prev, [reviewId]: text }));
    };

    const handleSubmitReply = async (reviewId: string) => {
        const comment = replyTexts[reviewId]?.trim();

        if (!comment) {
            toast.error('Please enter a reply');
            return;
        }

        setLoadingReply(reviewId);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/add_review_answer`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    comment,
                    courseId,
                    reviewId
                })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Failed to submit reply');
                return;
            }

            toast.success('Reply submitted successfully');

            // Clear reply text and close reply box
            setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
            setActiveReplyId(null);

            // Fetch reviews again to show new reply
            await fetchReviews();

        } catch (error: any) {
            console.error('Error submitting reply:', error);
            toast.error(error.message || 'Failed to submit reply');
        } finally {
            setLoadingReply(null);
        }
    };

    const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
    const startIndex = currentPage * REVIEWS_PER_PAGE;
    const endIndex = Math.min(startIndex + REVIEWS_PER_PAGE, reviews.length);
    const displayedReviews = reviews.slice(startIndex, endIndex);

    useEffect(() => {
        // nếu không có focusReviewId hoặc chưa có reviews thì bỏ qua
        if (!focusReviewId || reviews.length === 0) return;

        const index = reviews.findIndex((r) => r._id === focusReviewId);
        if (index === -1) return;

        const page = Math.floor(index / REVIEWS_PER_PAGE);
        setCurrentPage(page); // ví dụ index=8, REVIEWS_PER_PAGE=3 => page=2 => hiển thị reviews[6..8]
    }, [focusReviewId, reviews]);

    useEffect(() => {
        if (!focusReviewId || hasScrolledToFocus || reviews.length === 0) return;

        const index = reviews.findIndex((r) => r._id === focusReviewId);
        if (index === -1) return;

        const page = Math.floor(index / REVIEWS_PER_PAGE);
        // chỉ scroll khi đang ở đúng page
        if (currentPage !== page) return;

        const el = document.getElementById(`review-${focusReviewId}`);
        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHasScrolledToFocus(true);
        setHighlightedReviewId(focusReviewId);

        const timeoutId = setTimeout(() => {
            setHighlightedReviewId(null);
        }, 4000);

        return () => clearTimeout(timeoutId);

    }, [focusReviewId, reviews, currentPage, hasScrolledToFocus]);

    // Scroll to top of review list when page changes (except when focusing on a specific review)
    useEffect(() => {
        const reviewSection = document.getElementById('review-list-section');
        if (reviewSection && !focusReviewId) {
            reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentPage, focusReviewId]);

    useEffect(() => {
        setCurrentPage(0);
        setHasScrolledToFocus(false);
        setHighlightedReviewId(null);
    }, [courseId]);


    if (loading) {
        return (
            <div className="border-gray-200 dark:border-gray-800 md:mt-12">
                <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Student Reviews</h2>
                <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="border-gray-200 dark:border-gray-800 md:mt-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Student Reviews</h2>

            <div className="flex flex-col lg:flex-row gap-8 mb-12">
                {/* Review Summary */}
                <div className="lg:w-1/3 h-[400px] bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col items-center">
                        <div className="text-5xl font-bold text-gray-800 dark:text-white mb-2">
                            {average.toFixed(1)}
                        </div>
                        <div className="flex mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={24}
                                    className={star <= Math.round(average) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"}
                                />
                            ))}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Course Rating • {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
                        </p>

                        {/* Rating Distribution */}
                        <div className="w-full space-y-3">
                            {[5, 4, 3, 2, 1].map((rating, index) => (
                                <div key={rating} className="flex items-center gap-3">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-1/6">
                                        {rating} star{rating !== 1 ? 's' : ''}
                                    </div>
                                    <div className="w-4/6 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className="bg-yellow-400 h-2.5 rounded-full transition-all duration-300"
                                            style={{ width: `${distribution[4 - index]}%` }}>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 w-1/6">
                                        {distribution[4 - index]}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Review List */}
                <div className="lg:w-2/3" id="review-list-section">
                    {reviews.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700 text-center">
                            <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to review this course!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {displayedReviews.map((review) => (
                                <div
                                    key={review._id}
                                    id={`review-${review._id}`}
                                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 ${highlightedReviewId === review._id ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''}`}
                                >
                                    <div className="flex items-start">
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900 mr-4 flex-shrink-0">
                                            {review.userId?.avatar?.url && isValidImageUrl(review.userId.avatar.url) ? (
                                                <Image
                                                    src={review.userId.avatar.url}
                                                    alt={review.userId.name}
                                                    fill
                                                    sizes="48px"
                                                    style={{ objectFit: "cover" }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User size={24} className="text-indigo-600 dark:text-indigo-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-gray-800 dark:text-white">
                                                    {review.userId?.name || 'Anonymous'}
                                                </h4>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(review.createdAt)}
                                                </span>
                                            </div>
                                            <div className="flex my-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        size={16}
                                                        className={`${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="mt-2 text-gray-700 dark:text-gray-300">{review.comment}</p>

                                            {/* Display Replies */}
                                            {review.replies && review.replies.length > 0 && (
                                                <div className="mt-4 space-y-3 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                                                    {review.replies.map((reply, index) => (
                                                        <div key={index} className="flex items-start gap-3">
                                                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900 flex-shrink-0">
                                                                {reply.userId?.avatar?.url && isValidImageUrl(reply.userId.avatar.url) ? (
                                                                    <Image
                                                                        src={reply.userId.avatar.url}
                                                                        alt={reply.userId.name}
                                                                        fill
                                                                        sizes="32px"
                                                                        style={{ objectFit: "cover" }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <User size={16} className="text-indigo-600 dark:text-indigo-300" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-sm text-gray-800 dark:text-white">
                                                                        {reply.userId?.name || 'Instructor'}
                                                                    </span>
                                                                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full">
                                                                        Instructor
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {formatDate(reply.createdAt)}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                                                    {reply.answer}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reply Button and Form for Creator */}
                                            {isCreator && (
                                                <div className="mt-3">
                                                    {activeReplyId !== review._id ? (
                                                        <button
                                                            onClick={() => handleReplyClick(review._id)}
                                                            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-indigo-300 font-medium hover:cursor-pointer"
                                                        >
                                                            Reply
                                                        </button>
                                                    ) : (
                                                        <div className="mt-3 space-y-2">
                                                            <textarea
                                                                value={replyTexts[review._id] || ''}
                                                                onChange={(e) => handleReplyTextChange(review._id, e.target.value)}
                                                                placeholder="Write your reply..."
                                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent resize-none"
                                                                rows={3}
                                                            />
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveReplyId(null);
                                                                        setReplyTexts(prev => ({ ...prev, [review._id]: '' }));
                                                                    }}
                                                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                                                    disabled={loadingReply === review._id}
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSubmitReply(review._id)}
                                                                    disabled={loadingReply === review._id || !replyTexts[review._id]?.trim()}
                                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    {loadingReply === review._id ? (
                                                                        <>
                                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                            Sending...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Send size={16} />
                                                                            Send Reply
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-center items-center gap-2">
                            {/* Previous Button */}
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className="px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            >
                                Previous
                            </button>

                            {/* Page Numbers */}
                            <div className="flex gap-2">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === i
                                            ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                            : 'border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseReview;