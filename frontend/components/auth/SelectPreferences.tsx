"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FaCheck } from "react-icons/fa"
import ConfirmSkipModal from './ConfirmSkipModal'

interface Category {
    _id: string;
    title: string;
}

interface SelectPreferencesProps {
    selectedRole: 'student' | 'tutor' | null;
    setRegistrationStep: (step: number) => void;
}

const SelectPreferences = ({ selectedRole, setRegistrationStep }: SelectPreferencesProps) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSkipModal, setShowSkipModal] = useState(false);
    const router = useRouter();

    const MAX_SELECTIONS = 5;

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
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

        fetchCategories();
    }, []);

    // Toggle category selection
    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                // Remove category
                return prev.filter(id => id !== categoryId);
            } else {
                // Add category only if under limit
                if (prev.length >= MAX_SELECTIONS) {
                    toast.error(`You can select maximum ${MAX_SELECTIONS} categories`);
                    return prev;
                }
                return [...prev, categoryId];
            }
        });
    };

    // Handle submit preferences
    const handleSubmit = async () => {
        if (selectedCategories.length === 0) {
            toast.error("Please select at least one preference");
            return;
        }

        setIsSubmitting(true);

        try {
            const endpoint = selectedRole === 'student'
                ? '/api/user/student-profile-register'
                : '/api/user/tutor-profile-register';

            const bodyKey = selectedRole === 'student' ? 'interests' : 'expertise';

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    [bodyKey]: selectedCategories
                }),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to save preferences");
            }

            toast.success("Preferences saved successfully!");
            router.replace("/"); // Redirect to homepage or dashboard
        } catch (error: any) {
            console.error("Error saving preferences:", error);
            toast.error(error.message || "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle skip button click
    const handleSkipClick = () => {
        setShowSkipModal(true);
    };

    // Handle confirmed skip
    const handleConfirmSkip = () => {
        setShowSkipModal(false);
        router.replace("/login");
    };

    // Handle cancel skip
    const handleCancelSkip = () => {
        setShowSkipModal(false);
    };

    const getTitle = () => {
        return selectedRole === 'student'
            ? 'Select Your Interests'
            : 'Select Your Expertise';
    };

    const getDescription = () => {
        return selectedRole === 'student'
            ? 'Choose topics you\'re interested in learning. This helps us recommend the best courses for you.'
            : 'Select areas where you have expertise. This helps students find you more easily.';
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto space-y-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h2 className="text-2xl md:text-3xl font-semibold">{getTitle()}</h2>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {getDescription()}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        Select up to {MAX_SELECTIONS} categories
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories.map((category) => {
                        const isSelected = selectedCategories.includes(category._id);
                        const isDisabled = !isSelected && selectedCategories.length >= MAX_SELECTIONS;

                        return (
                            <div
                                key={category._id}
                                onClick={() => !isDisabled && toggleCategory(category._id)}
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

                {/* Selected count */}
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedCategories.length} of {MAX_SELECTIONS} categories selected
                        {selectedCategories.length >= MAX_SELECTIONS && (
                            <span className="text-orange-500 dark:text-orange-400 ml-2">
                                (Maximum reached)
                            </span>
                        )}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8">
                    <button
                        onClick={handleSkipClick}
                        className="button order-2"
                        disabled={isSubmitting}
                    >
                        Skip for now
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={selectedCategories.length === 0 || isSubmitting}
                        className="button-disabled order-1 sm:order-3"
                    >
                        {isSubmitting ? "Saving..." : "Complete Registration"}
                    </button>
                </div>
            </div>

            {/* Skip Confirmation Modal */}
            <ConfirmSkipModal
                isOpen={showSkipModal}
                onClose={handleCancelSkip}
                onConfirm={handleConfirmSkip}
                selectedRole={selectedRole}
            />
        </>
    );
};

export default SelectPreferences;