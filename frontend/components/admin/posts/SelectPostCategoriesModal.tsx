"use client"

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { FaCheck } from "react-icons/fa"

interface Category {
    _id: string;
    title: string;
}

interface SelectPostCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCategories: string[];
    onSave: (categories: string[]) => void;
}

const SelectPostCategoriesModal = ({
    isOpen,
    onClose,
    selectedCategories,
    onSave
}: SelectPostCategoriesModalProps) => {

    const [categories, setCategories] = useState<Category[]>([]);
    const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const MAX_SELECTIONS = 5;

    // Fetch categories from API
    useEffect(() => {
        if (isOpen) {
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
            // Initialize temp selection with current selected categories
            setTempSelectedCategories(selectedCategories);
        }
    }, [isOpen, selectedCategories]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsLoading(true);
        }
    }, [isOpen]);

    // Handle modal backdrop click
    const handleModalClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Toggle category selection
    const toggleCategory = (categoryId: string) => {
        setTempSelectedCategories(prev => {
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

    // Handle save categories
    const handleSave = () => {
        onSave(tempSelectedCategories);
        onClose();
    };

    // Handle cancel
    const handleCancel = () => {
        setTempSelectedCategories(selectedCategories);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-0 bg-black/50 backdrop-blur-sm"
            onClick={handleModalClick}
        >
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
                <button
                    onClick={handleCancel}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>

                <div className="p-6 overflow-y-auto max-h-[90vh]">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="text-center space-y-4 mt-8">
                                <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
                                    Select Post Categories
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                    Choose categories that best describe your post content. This helps readers find relevant content.
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    Select up to {MAX_SELECTIONS} categories
                                </p>
                            </div>

                            {/* Categories Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {categories.map((category) => {
                                    const isSelected = tempSelectedCategories.includes(category._id);
                                    const isDisabled = !isSelected && tempSelectedCategories.length >= MAX_SELECTIONS;

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
                                    {tempSelectedCategories.length} of {MAX_SELECTIONS} categories selected
                                    {tempSelectedCategories.length >= MAX_SELECTIONS && (
                                        <span className="text-orange-500 dark:text-orange-400 ml-2">
                                            (Maximum reached)
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8">
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                >
                                    Save Categories
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelectPostCategoriesModal;