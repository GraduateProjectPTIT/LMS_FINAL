"use client"

import { BookOpen, ChevronDown, ChevronRight, Heart, Star, User } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import Image from 'next/image';

const CoureReview = () => {

    const mockReviews = [
        {
            id: 1,
            name: "Sarah Johnson",
            avatar: null,
            rating: 5,
            date: "2 weeks ago",
            comment: "This course exceeded my expectations! The instructor explains complex concepts in a way that's easy to understand, and the practical exercises helped solidify my learning. Highly recommended for anyone looking to master this subject."
        },
        {
            id: 2,
            name: "Michael Chen",
            avatar: null,
            rating: 4,
            date: "1 month ago",
            comment: "Great course with lots of practical examples. The only reason I'm giving 4 stars instead of 5 is that some sections could use more in-depth explanations. Otherwise, the content is excellent and very valuable."
        },
        {
            id: 3,
            name: "Emma Williams",
            avatar: null,
            rating: 5,
            date: "3 months ago",
            comment: "As a beginner, I found this course perfect for my needs. The step-by-step approach made it easy to follow along, and I appreciated the challenges that pushed me to apply what I learned. I feel much more confident now!"
        }
    ];

    return (
        <>
            <div className="border-gray-200 dark:border-gray-800 md:mt-12">
                <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Student Reviews</h2>

                <div className="flex flex-col lg:flex-row gap-8 mb-12">
                    {/* Review Summary */}
                    <div className="lg:w-1/3 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col items-center">
                            <div className="text-5xl font-bold text-gray-800 dark:text-white mb-2">5.0</div>
                            <div className="flex mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={24} className="text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">Course Rating • 427 Reviews</p>

                            {/* Rating Distribution */}
                            <div className="w-full space-y-3">
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <div key={rating} className="flex items-center gap-3">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-1/6">{rating} stars</div>
                                        <div className="w-4/6 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                            <div
                                                className="bg-yellow-400 h-2.5 rounded-full"
                                                style={{
                                                    width: rating === 5 ? '85%' :
                                                        rating === 4 ? '12%' :
                                                            rating === 3 ? '2%' :
                                                                rating === 2 ? '0.5%' : '0.5%'
                                                }}>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 w-1/6">
                                            {rating === 5 ? '85%' :
                                                rating === 4 ? '12%' :
                                                    rating === 3 ? '2%' :
                                                        rating === 2 ? '0.5%' : '0.5%'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Review List */}
                    <div className="lg:w-2/3">
                        <div className="space-y-6">
                            {mockReviews.map((review) => (
                                <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-start">
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900 mr-4 flex-shrink-0">
                                            {review.avatar ? (
                                                <Image
                                                    src={review.avatar}
                                                    alt={review.name}
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
                                                <h4 className="font-bold text-gray-800 dark:text-white">{review.name}</h4>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{review.date}</span>
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
                                            <div className="mt-3 flex items-center gap-3">
                                                <button className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                                    <span>Helpful?</span>
                                                </button>
                                                <span className="text-gray-400">|</span>
                                                <button className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                                    <span>Report</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 text-center">
                            <button className="inline-flex items-center px-6 py-3 border border-indigo-300 dark:border-indigo-700 rounded-lg text-base font-medium text-indigo-600 dark:text-indigo-400 bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                                <span>See All Reviews</span>
                                <ChevronDown size={18} className="ml-2" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CoureReview