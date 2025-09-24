"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Star, Clock, BookOpen, Users, Trash2, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import MissingImage from "@/public/missing_image.jpg"
import { CartItem } from "@/type"
import { useRouter } from 'next/navigation'

interface CartItemsProps {
    items: CartItem[];
    refreshCart: () => void;
}

const CartItems = ({ items, refreshCart }: CartItemsProps) => {

    const router = useRouter();
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    const setItemLoading = (itemId: string, loading: boolean) => {
        setLoadingStates(prev => ({ ...prev, [itemId]: loading }));
    };

    const handleRemoveFromCart = async (courseId: string) => {
        try {
            setItemLoading(courseId, true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/cart/remove/${courseId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to remove item from cart");
                return;
            }

            toast.success("Course removed from cart");
            refreshCart();
        } catch (error: any) {
            toast.error(error.message || "Failed to remove item from cart");
        } finally {
            setItemLoading(courseId, false);
        }
    };

    const handleMoveToSaved = async (courseId: string) => {
        try {
            setItemLoading(courseId, true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/cart/move-to-saved/${courseId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to move item to saved for later");
                return;
            }

            toast.success("Course moved to saved for later");
            refreshCart();
        } catch (error: any) {
            toast.error(error.message || "Failed to move item to saved for later");
        } finally {
            setItemLoading(courseId, false);
        }
    };

    const getValidThumbnail = (thumbnailUrl?: string) => {
        return thumbnailUrl || MissingImage;
    };

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div
                    onClick={() => router.push(`/course-overview/${item._id}`)}
                    key={item._id}
                    className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow duration-200 bg-gray-50 dark:bg-gray-700"
                >
                    {/* Course Image */}
                    <div className="flex-shrink-0">
                        <div className="w-full sm:w-70 h-40 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <Image
                                src={getValidThumbnail(item.thumbnail?.url)}
                                alt={item.name || "Course Image"}
                                width={160}
                                height={160}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                quality={85}
                            />
                        </div>
                    </div>

                    {/* Course Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row justify-between">
                            <div className="flex flex-col gap-3">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2">
                                    {item.name}
                                </h3>

                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    By {item.instructorName || 'Unknown Instructor'}
                                </p>

                                {/* Course Stats */}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleRemoveFromCart(item._id);
                                        }}
                                        disabled={loadingStates[item._id]}
                                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        <Trash2 size={14} />
                                        {loadingStates[item._id] ? 'Removing...' : 'Remove'}
                                    </button>

                                    <span className="text-gray-300 dark:text-gray-600">|</span>

                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleMoveToSaved(item._id);
                                        }}
                                        disabled={loadingStates[item._id]}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        <Heart size={14} />
                                        {loadingStates[item._id] ? 'Moving...' : 'Save for Later'}
                                    </button>
                                </div>
                            </div>

                            {/* Price Section */}
                            <div className="flex flex-col items-end justify-start mt-4 sm:mt-0 sm:ml-4">
                                <div className="text-right">
                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        ${item.price}
                                    </div>
                                    {item.estimatedPrice && item.estimatedPrice > item.price && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                            ${item.estimatedPrice}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default CartItems