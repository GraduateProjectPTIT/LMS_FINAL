"use client"

import { BookOpen, ChevronRight, Heart, Star } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import Image from 'next/image';


const RecommendCourse = () => {

    const relatedCourses = [
        {
            id: 1,
            title: "Advanced Techniques Masterclass",
            thumbnail: null,
            instructor: "Dr. Alex Morgan",
            rating: 4.8,
            reviewCount: 356,
            price: 89.99,
            estimatedPrice: 129.99
        },
        {
            id: 2,
            title: "Complete Beginner to Pro",
            thumbnail: null,
            instructor: "Prof. Emily Rivera",
            rating: 4.9,
            reviewCount: 528,
            price: 94.99,
            estimatedPrice: 149.99
        },
        {
            id: 3,
            title: "Practical Projects Bootcamp",
            thumbnail: null,
            instructor: "David Chen",
            rating: 4.7,
            reviewCount: 412,
            price: 79.99,
            estimatedPrice: 119.99
        }
    ];

    return (
        <>
            <div className="border-gray-200 dark:border-gray-800 md:mt-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Related Courses</h2>
                    <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center">
                        <span>View All</span>
                        <ChevronRight size={18} className="ml-1" />
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedCourses.map((course) => (
                        <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transition-all hover:-translate-y-1 hover:shadow-lg">
                            <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                                {course.thumbnail ? (
                                    <Image
                                        src={course.thumbnail}
                                        alt={course.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        style={{ objectFit: "cover" }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen size={48} className="text-gray-400 dark:text-gray-500" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                                    <Heart size={18} className="text-gray-400 hover:text-red-500 cursor-pointer" />
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <a href="#">{course.title}</a>
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {course.instructor}
                                </p>
                                <div className="flex items-center mb-3">
                                    <span className="text-yellow-500 font-bold mr-1">{course.rating}</span>
                                    <div className="flex mr-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={14}
                                                className={`${star <= Math.round(course.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({course.reviewCount})</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-lg font-bold text-gray-800 dark:text-white">${course.price}</span>
                                        {course.estimatedPrice && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through ml-2">
                                                ${course.estimatedPrice}
                                            </span>
                                        )}
                                    </div>
                                    <a href="#" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">View</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

export default RecommendCourse