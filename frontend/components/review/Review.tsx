"use client"

import React, { useState } from 'react'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// Zod schema
const reviewSchema = z.object({
    review: z.string()
        .min(20, "Review must be at least 20 characters long")
        .max(1000, "Review must not exceed 1000 characters")
        .trim()
})

type ReviewFormData = z.infer<typeof reviewSchema>

const Review = ({ courseId }: { courseId: string }) => {
    const router = useRouter()
    const [rating, setRating] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset
    } = useForm<ReviewFormData>({
        resolver: zodResolver(reviewSchema),
        mode: 'onChange'
    })

    const reviewValue = watch('review', '')

    const onSubmit = async (data: ReviewFormData) => {
        if (rating === 0) {
            toast.error("Please select a rating")
            return
        }

        setIsSubmitting(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/add_review/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    review: data.review,
                    rating: rating
                })
            })

            const responseData = await res.json()

            if (!res.ok) {
                toast.error(responseData.message || "Failed to submit review")
                return
            }

            toast.success("Review submitted successfully!")
            setRating(0)
            reset()

            router.push('/my-courses')

        } catch (error: any) {
            toast.error(error.message || "Failed to submit review")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="p-6 mb-8">
            <div className='container'>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                    Help Us Improve - Leave a Review
                </h2>

                {/* Guidelines */}
                <div className="my-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
                        Review Guidelines
                    </h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>• Be honest and constructive in your feedback</li>
                        <li>• Focus on your learning experience and course content</li>
                        <li>• Avoid offensive language or personal attacks</li>
                        <li>• Share specific examples when possible</li>
                    </ul>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Rating Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                            Rate this course
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        size={32}
                                        className={`${star <= rating
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300 dark:text-gray-600'
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                You rated this course {rating} out of 5 stars
                            </p>
                        )}
                    </div>

                    {/* Review Text Area */}
                    <div className="mb-6">
                        <label
                            htmlFor="review"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                        >
                            Your Review
                        </label>
                        <textarea
                            id="review"
                            rows={6}
                            {...register('review')}
                            placeholder="Share your experience with this course. What did you learn? How was the instructor? Would you recommend it to others?"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-colors ${errors.review
                                ? 'border-red-500 dark:border-red-500'
                                : 'border-gray-300 dark:border-gray-600'
                                }`}
                        />
                        <div className="flex justify-between items-center mt-2">
                            <div className="flex-1">
                                {errors.review ? (
                                    <p className="text-sm text-red-500">
                                        {errors.review.message}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Minimum 20 characters required
                                    </p>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {reviewValue?.length || 0}/1000
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting || rating === 0}
                        className={`w-full md:w-auto px-8 py-3 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all
                            ${isSubmitting || rating === 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Review