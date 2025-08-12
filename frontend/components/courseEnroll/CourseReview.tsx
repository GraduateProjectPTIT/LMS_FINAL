import React from 'react';

interface Review {
    user: {
        name: string;
        avatar: string;
    };
    rating: number;
    comment: string;
    commentDate: string;
    _id: string;
}

interface CourseReviewsProps {
    reviews: Review[];
    ratings: number;
}

const CourseReviews = ({ reviews, ratings }: CourseReviewsProps) => {
    // Function to render stars based on rating
    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`h-5 w-5 ${star <= rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                            }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 py-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Student Reviews</h2>

            {reviews.length > 0 ? (
                <div className="space-y-8">
                    <div className="flex items-center">
                        <div className="mr-4">
                            <span className="text-3xl font-bold text-gray-900">{ratings.toFixed(1)}</span>
                            <div className="mt-1">{renderStars(ratings)}</div>
                            <p className="text-sm text-gray-500 mt-1">{reviews.length} reviews</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div key={review._id} className="flex space-x-4">
                                <div className="flex-shrink-0">
                                    <img
                                        className="h-10 w-10 rounded-full"
                                        src={review.user.avatar}
                                        alt={review.user.name}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center mb-1">
                                        <h4 className="font-medium text-gray-900 mr-2">
                                            {review.user.name}
                                        </h4>
                                        <span className="text-xs text-gray-500">
                                            {review.commentDate}
                                        </span>
                                    </div>
                                    <div className="mb-2">{renderStars(review.rating)}</div>
                                    <p className="text-gray-700">{review.comment}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No reviews yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Be the first to review this course!
                    </p>
                </div>
            )}
        </div>
    );
};

export default CourseReviews;