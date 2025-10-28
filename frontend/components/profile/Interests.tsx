"use client"

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateSuccess } from '@/redux/user/userSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FaEdit, FaCheck } from 'react-icons/fa';
import { IoAlertCircleOutline } from "react-icons/io5";
import toast from 'react-hot-toast';

interface Category {
    _id: string;
    title: string;
}

interface InterestsProps {
    user: any;
}

const Interests = ({ user }: InterestsProps) => {
    const dispatch = useDispatch();
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const MAX_SELECTIONS = 5;

    // Khởi tạo selectedCategories từ user.expertise trong redux
    useEffect(() => {
        if (user?.interests) {
            setSelectedCategories(user.interests);
        }
    }, [user]);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/category/get_all_categories`);
            const data = await response.json();

            if (data.success) {
                setCategories(data.categories);
            } else {
                toast.error("Failed to load categories");
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Failed to load categories");
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = () => {
        setIsEditing(true);
        fetchCategories();
    };

    const cancelEditing = () => {
        setIsEditing(false);
        // Reset lại selectedCategories về trạng thái ban đầu từ user.interests
        if (user?.interests) {
            setSelectedCategories(user.interests);
        }
    };

    const toggleCategory = (categoryTitle: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryTitle)) {
                // Remove category
                return prev.filter(title => title !== categoryTitle);
            } else {
                // Add category only if under limit
                if (prev.length >= MAX_SELECTIONS) {
                    toast.error(`You can select maximum ${MAX_SELECTIONS} interests`);
                    return prev;
                }
                return [...prev, categoryTitle];
            }
        });
    };

    const handleSubmit = async () => {
        if (selectedCategories.length === 0) {
            toast.error("Please select at least one interest");
            return;
        }

        setIsSubmitting(true);

        try {
            const interestIds = selectedCategories.map(title => {
                const category = categories.find(cat => cat.title === title);
                return category ? category._id : null;
            }).filter(Boolean);

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/student/student-profile-register`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    interests: interestIds
                }),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to save interests");
            }

            toast.success("Interests updated successfully!");
            dispatch(updateSuccess(data.student));
            setIsEditing(false);
        } catch (error: any) {
            console.error("Error saving interests:", error);
            toast.error(error.message || "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full theme-mode border-gray-200 dark:border-slate-600 shadow-md dark:shadow-slate-600">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl md:text-2xl font-bold">Learning Interests</CardTitle>
                    </div>
                    {!isEditing && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={startEditing}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <FaEdit size={16} /> Edit Interests
                        </Button>
                    )}
                </div>
                <CardDescription>
                    Choose topics you're interested in learning. This helps us recommend the best courses for you.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {!isEditing ? (
                    // Display Mode - Simply show user.interests titles
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Your Current Interests</h3>

                        {user?.interests && user.interests.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {user.interests.map((title: string, index: number) => (
                                    <Badge
                                        key={index}
                                        className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1"
                                    >
                                        {title}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                                <IoAlertCircleOutline className="text-blue-500" size={20} />
                                <p className="text-gray-600 dark:text-gray-400">
                                    You haven't selected any interests yet. Click "Edit Interests" to add some!
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Edit Mode
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">Select Your Interests</h3>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                        Select up to {MAX_SELECTIONS} categories ({selectedCategories.length}/{MAX_SELECTIONS} selected)
                                    </p>
                                </div>

                                {/* Categories Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {categories.map((category) => {
                                        const isSelected = selectedCategories.includes(category.title);
                                        const isDisabled = !isSelected && selectedCategories.length >= MAX_SELECTIONS;

                                        return (
                                            <div
                                                key={category._id}
                                                onClick={() => !isDisabled && toggleCategory(category.title)}
                                                className={`
                                                    relative p-4 border-2 rounded-lg transition-all duration-200 
                                                    ${isDisabled
                                                        ? 'cursor-not-allowed opacity-50 border-gray-200 dark:border-gray-700'
                                                        : 'cursor-pointer hover:shadow-sm'
                                                    }
                                                    ${isSelected
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-slate-200 dark:border-gray-600 hover:border-slate-300'
                                                    }
                                                `}
                                            >
                                                <div className="text-center">
                                                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {category.title}
                                                    </h3>
                                                </div>

                                                {/* Selection indicator */}
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2">
                                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <FaCheck className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Selected count warning */}
                                {selectedCategories.length >= MAX_SELECTIONS && (
                                    <div className="text-center">
                                        <p className="text-sm text-orange-500 dark:text-orange-400">
                                            Maximum number of interests reached ({MAX_SELECTIONS})
                                        </p>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-3 justify-end pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={cancelEditing}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={selectedCategories.length === 0 || isSubmitting}
                                        className="bg-blue-500 hover:bg-blue-600"
                                    >
                                        {isSubmitting ? "Saving..." : "Save Interests"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default Interests;