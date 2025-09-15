"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

import SortableCategoryItem, { type Category } from "./SortableCategoryItem";

import {
    DndContext, // Trình bao bọc chính cho kéo thả.
    closestCenter, // Thuật toán phát hiện va chạm.
    KeyboardSensor, // Cảm biến kéo thả bằng bàn phím.
    PointerSensor, // Cảm biến kéo thả bằng chuột/chạm.
    useSensor, // Hook để tạo một cảm biến.
    useSensors, // Hook để tạo nhiều cảm biến.
    DragEndEvent, // Type cho sự kiện kết thúc kéo.
} from "@dnd-kit/core";

import {
    arrayMove, // Hàm sắp xếp lại mảng.
    SortableContext, // Context cho các mục sắp xếp.
    sortableKeyboardCoordinates, // Kích hoạt sắp xếp bằng phím.
    verticalListSortingStrategy, // Chiến lược sắp xếp danh sách dọc.
} from "@dnd-kit/sortable";

const CustomizeCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [originalCategories, setOriginalCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [categoriesExist, setCategoriesExist] = useState(false);

    // DND-KIT: cảm biến (chuột + bàn phím)
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Fetch layout Categories từ server
    const fetchCategoriesLayout = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/get_layout/Categories`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );
            const data = await res.json();
            if (!res.ok) {
                console.log(data.message ?? "Failed to fetch Categories layout");
            }
            if (res.ok && data.layout?.categories?.length > 0) {
                setCategoriesExist(true);
                const categoriesWithId: Category[] = data.layout.categories.map((category: any, idx: number) => ({
                    ...category,
                    id: category._id || Date.now().toString() + idx
                }));
                setCategories(categoriesWithId);
                setOriginalCategories(JSON.parse(JSON.stringify(categoriesWithId)));
            } else {
                // Nếu không có categories, tạo một category mặc định
                const defaultCategory: Category = { id: Date.now().toString(), title: "" };
                setCategories([defaultCategory]);
                setOriginalCategories([defaultCategory]);
            }
        } catch (err: any) {
            console.log(err?.message ?? err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Categories khi component mount
    useEffect(() => {
        fetchCategoriesLayout();
    }, []);

    // cập nhật title tại đúng vị trí được sửa
    const handleTitleChange = (index: number, value: string): void => {
        setCategories((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], title: value };
            return next;
        });
    };

    const addCategory = (): void => {
        const newCategory: Category = { id: Date.now().toString(), title: "" };
        setCategories([...categories, newCategory]);
    };

    const removeCategory = (index: number): void => {
        if (categories.length <= 1) {
            toast.error("You need at least one category");
            return;
        }
        setCategories(categories.filter((_, i) => i !== index));
    };

    // Kiểm tra có thay đổi không
    const isCategoriesChanges = (current: Category[], original: Category[]): boolean => {
        if (current.length !== original.length) return false;
        return current.every(
            (item, i) =>
                item.title.trim() === original[i]?.title.trim()
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const isValid = categories.every(
            (category) => category.title.trim() !== ""
        );
        if (!isValid) {
            toast.error("All category titles must be filled out");
            return;
        }

        if (isCategoriesChanges(categories, originalCategories)) {
            toast("No changes detected!");
            return;
        }

        setLoading(true);
        try {
            const categoryData = {
                type: "Categories",
                categories: categories.map(({ title }) => ({ title })),
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/update_layout`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(categoryData),
                }
            );

            const data = await res.json();
            if (res.ok) {
                toast.success(`Categories ${categoriesExist ? "updated" : "created"} successfully`);
                await fetchCategoriesLayout();
            } else {
                toast.error(data?.message ?? "Failed to save categories");
            }
        } catch (err) {
            console.error("Error saving categories:", err);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Drag end (khi thả item)
    const handleDragEnd = (event: DragEndEvent): void => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                if (oldIndex === -1 || newIndex === -1) return items;
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <div>
            <Card className="theme-mode w-full border border-gray-300 dark:border-slate-600 shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-center">
                        Customize Categories
                    </CardTitle>
                    <CardDescription className="text-center dark:text-gray-400">
                        {categoriesExist
                            ? "Update and reorder your website categories"
                            : "Create categories for your website"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Bọc danh sách bằng DndContext để cho phép drag-drop */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={categories.map((category) => category.id)} strategy={verticalListSortingStrategy}>
                                {categories.map((category, index) => (
                                    <SortableCategoryItem
                                        key={category.id}
                                        id={category.id}
                                        category={category}
                                        index={index}
                                        handleTitleChange={handleTitleChange}
                                        removeCategory={removeCategory}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {/* Nút thêm Category */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addCategory}
                            className="w-full cursor-pointer border-dashed"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Category
                        </Button>

                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Tip:</span> Drag and drop categories to reorder them. The order shown here will be used on your website.
                            </p>
                        </div>

                        {/* Nút submit */}
                        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : categoriesExist ? (
                                "Update Categories"
                            ) : (
                                "Create Categories"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomizeCategories;