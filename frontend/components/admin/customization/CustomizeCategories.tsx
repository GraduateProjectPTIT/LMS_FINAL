"use client"

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react';

const CustomizeCategories = () => {

    const [originalCategories, setOriginalCategories] = useState([]);
    const [categories, setCategories] = useState([
        { title: '' }
    ]);
    const [loading, setLoading] = useState(false);
    const [categoriesExist, setCategoriesExist] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    useEffect(() => {
        fetchCategoriesLayout();
    }, []);

    const fetchCategoriesLayout = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/get_layout/Categories`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                console.log(data.message);
            } else {
                const { layout } = data;

                if (layout && layout.categories && layout.categories.length > 0) {
                    setCategoriesExist(true);
                    setCategories(layout.categories);
                    setOriginalCategories(layout.categories);
                }
            }
        } catch (error) {
            console.error('Error fetching categories layout:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTitleChange = (index: any, value: any) => {
        const newCategories = [...categories];
        newCategories[index].title = value;
        setCategories(newCategories);
    };

    const addCategory = () => {
        setCategories([...categories, { title: '' }]);
    };

    const removeCategory = (index: any) => {
        if (categories.length > 1) {
            const newCategories = categories.filter((_, i) => i !== index);
            setCategories(newCategories);
        } else {
            toast.error("You need at least one category");
        }
    };

    const handleDragStart = (e: any, index: any) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Add a delay to change the opacity (improves visual feedback)
        setTimeout(() => {
            setIsDragging(true);
        }, 0);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDraggedItemIndex(null);
    };

    const handleDragOver = (e: any, index: any) => {
        e.preventDefault();
        if (draggedItemIndex === null) return;

        // Don't do anything if hovering over the same item
        if (draggedItemIndex === index) return;

        // Reorder the items
        const newCategories = [...categories];
        const draggedItem = newCategories[draggedItemIndex];
        newCategories.splice(draggedItemIndex, 1);
        newCategories.splice(index, 0, draggedItem);

        setCategories(newCategories);
        setDraggedItemIndex(index);
    };

    const isCategoriesChanges = (a: any[], b: any[]) => {
        if (a.length !== b.length) return false;
        return a.every((item, index) =>
            item.title.trim() === b[index].title.trim()
        );
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        // Validate inputs
        const isValid = categories.every(category => category.title.trim() !== '');
        if (!isValid) {
            toast.error("All category titles must be filled out");
            return;
        }

        if (isCategoriesChanges(categories, originalCategories)) {
            toast("No changes detected!");
            return;
        }

        try {
            setLoading(true);

            const categoryData = {
                type: 'Categories',
                categories: categories.map(({ title }) => ({ title }))
            };

            if (categoriesExist) {
                // Update existing Categories
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/update_layout`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(categoryData)
                });

                const data = await res.json();

                if (!res.ok) {
                    console.log(data.message);
                    toast.error('Failed to update categories');
                    return;
                } else {
                    toast.success('Categories updated successfully');
                    fetchCategoriesLayout();
                }
            } else {
                // Create new Categories layout
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/create_layout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(categoryData)
                });

                const data = await res.json();

                if (!res.ok) {
                    console.log(data.message);
                    toast.error('Failed to create categories');
                    return;
                } else {
                    toast.success('Categories created successfully');
                    setCategoriesExist(true);
                    fetchCategoriesLayout();
                }
            }
        } catch (error) {
            console.error('Error saving categories:', error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Card className="w-full border border-gray-300 dark:border-slate-600 shadow-md light-mode dark:dark-mode">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-center">Customize Categories</CardTitle>
                    <CardDescription className="text-center dark:text-gray-400">
                        {categoriesExist ? 'Update your website categories' : 'Create categories for your website'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            {categories.map((category, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center space-x-3 p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-slate-700 rounded-lg 
                                        ${isDragging && draggedItemIndex === index ? 'opacity-50' : 'opacity-100'} `}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                >
                                    <div
                                        className="cursor-grab p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        onMouseDown={(e) => e.preventDefault()}
                                    >
                                        <GripVertical className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Enter category title"
                                            value={category.title}
                                            onChange={(e) => handleTitleChange(index, e.target.value)}
                                            className="border border-theme dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeCategory(index)}
                                        className="h-8 w-8 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addCategory}
                            className="w-full cursor-pointer border-dashed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 dark:text-gray-200"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Category
                        </Button>

                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Tip:</span> Drag and drop categories to reorder them. The order shown here will be used on your website.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full cursor-pointer font-medium transition-colors bg-blue-600 hover:bg-blue-600/70 dark:bg-blue-600 dark:hover:bg-blue-600/70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                categoriesExist ? 'Update Categories' : 'Create Categories'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default CustomizeCategories