"use client"

import React from 'react'
import Image from 'next/image'
import { PlayCircle, Clock, Users, Star, BookOpen } from 'lucide-react'
import { CartItem } from "@/type"

interface OrderDetailsProps {
    cartItems: CartItem[];
}

const OrderDetails = ({ cartItems }: OrderDetailsProps) => {
    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No items in your order</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {cartItems.map((item, index) => (
                <div
                    key={item._id || index}
                    className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600"
                >
                    {/* Course Thumbnail */}
                    <div className="flex-shrink-0">
                        <div className="relative w-full sm:w-24 h-32 sm:h-16 bg-gradient-to-br from-pink-400 to-purple-600 rounded-lg overflow-hidden">
                            {item.thumbnail ? (
                                <Image
                                    src={item.thumbnail.url}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayCircle className="text-white/80" size={24} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">
                            {item.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {item.ratings !== undefined && item.ratings !== null && (
                                <div className="flex items-center gap-1">
                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                    <span>{item.ratings}</span>
                                </div>
                            )}

                            {item.totalTime && (
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>{item.totalTime}</span>
                                </div>
                            )}

                            {item.totalLectures && (
                                <div className="flex items-center gap-1">
                                    <BookOpen size={14} />
                                    <span>{item.totalLectures} lectures</span>
                                </div>
                            )}

                            {item.level && (
                                <div className="flex items-center gap-1">
                                    <Users size={14} />
                                    <span>{item.level}</span>
                                </div>
                            )}
                        </div>

                        {item.instructorName && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                By {item.instructorName}
                            </p>
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="flex-shrink-0 text-right">
                        <div className="flex flex-col items-end gap-1">
                            {item.estimatedPrice && item.estimatedPrice > item.price && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                    ${item.estimatedPrice.toFixed(2)}
                                </span>
                            )}
                            <span className="text-lg font-bold text-gray-800 dark:text-white">
                                ${item.price.toFixed(2)}
                            </span>
                            {item.estimatedPrice && item.estimatedPrice > item.price && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    Save ${(item.estimatedPrice - item.price).toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default OrderDetails