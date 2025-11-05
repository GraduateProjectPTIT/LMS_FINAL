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
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { type Category } from "./SortableCategoryItem";
import DeleteCategoryModal from "./DeleteCategoryModal";

const CustomizeCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [originalCategories, setOriginalCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [categoriesExist, setCategoriesExist] = useState(false);

    // State cho delete modal
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        categoryId: "",
        categoryTitle: "",
        categoryIndex: -1,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Categories từ API
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/category/get_all_categories`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );
            const data = await res.json();

            if (!res.ok) {
                console.log(data.message ?? "Failed to fetch categories");
            }

            if (res.ok && data.success && data.categories?.length > 0) {
                setCategoriesExist(true);
                // Chuyển đổi dữ liệu từ API sang format Category
                const categoriesWithId: Category[] = data.categories.map((category: any) => ({
                    id: category._id,
                    title: category.title
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

    useEffect(() => {
        fetchCategories();
    }, []);

    // Cập nhật title tại đúng vị trí được sửa
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

    // Mở modal xác nhận xóa
    const removeCategory = (index: number): void => {
        if (categories.length <= 1) {
            toast.error("You need at least one category");
            return;
        }

        const category = categories[index];

        // Nếu là category mới (chưa lưu vào DB), xóa trực tiếp
        const isNewCategory = !originalCategories.find(orig => orig.id === category.id);
        if (isNewCategory) {
            setCategories(categories.filter((_, i) => i !== index));
            toast.success("Category removed");
            return;
        }

        // Nếu là category đã tồn tại, mở modal xác nhận
        setDeleteModal({
            isOpen: true,
            categoryId: String(category.id),
            categoryTitle: category.title,
            categoryIndex: index,
        });
    };

    // Xử lý xóa category từ DB
    const handleDeleteCategory = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/category/delete_category/${deleteModal.categoryId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.message ?? `Failed to delete "${deleteModal.categoryTitle}"`);
                return;
            }

            // Xóa thành công
            setCategories(categories.filter((_, i) => i !== deleteModal.categoryIndex));
            setOriginalCategories(originalCategories.filter(cat => cat.id !== deleteModal.categoryId));
            toast.success(`Category "${deleteModal.categoryTitle}" deleted successfully`);

            // Đóng modal
            setDeleteModal({
                isOpen: false,
                categoryId: "",
                categoryTitle: "",
                categoryIndex: -1,
            });
        } catch (err) {
            console.error("Error deleting category:", err);
            toast.error("Something went wrong");
        } finally {
            setIsDeleting(false);
        }
    };

    // Đóng modal
    const closeDeleteModal = () => {
        if (!isDeleting) {
            setDeleteModal({
                isOpen: false,
                categoryId: "",
                categoryTitle: "",
                categoryIndex: -1,
            });
        }
    };

    // Kiểm tra duplicate title trong danh sách hiện tại
    const hasDuplicateTitles = (): boolean => {
        const titles = categories.map(cat => cat.title.trim().toLowerCase());
        const uniqueTitles = new Set(titles);
        return titles.length !== uniqueTitles.size;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate: tất cả category phải có title
        const isValid = categories.every(
            (category) => category.title.trim() !== ""
        );
        if (!isValid) {
            toast.error("All category titles must be filled out");
            return;
        }

        // Validate: không được có title trùng nhau
        if (hasDuplicateTitles()) {
            toast.error("Category titles must be unique");
            return;
        }

        // Tìm những category đã thay đổi title
        const changedCategories = categories.filter((category) => {
            const original = originalCategories.find(orig => orig.id === category.id);
            return original && original.title.trim() !== category.title.trim();
        });

        // Tìm những category mới (không có trong original)
        const newCategories = categories.filter((category) => {
            return !originalCategories.find(orig => orig.id === category.id);
        });

        if (changedCategories.length === 0 && newCategories.length === 0) {
            toast("No changes detected!");
            return;
        }

        setLoading(true);
        try {
            let hasError = false;

            // 1. Update các category đã thay đổi
            for (const category of changedCategories) {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/category/update_category/${category.id}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ title: category.title.trim() }),
                    }
                );

                if (!res.ok) {
                    const data = await res.json();
                    toast.error(data?.message ?? `Failed to update "${category.title}"`);
                    hasError = true;
                    break;
                }
            }

            if (hasError) {
                setLoading(false);
                await fetchCategories(); // Refresh để hiển thị trạng thái đúng
                return;
            }

            // 2. Tạo các category mới
            for (const category of newCategories) {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/category/create_category`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ title: category.title.trim() }),
                    }
                );

                if (!res.ok) {
                    const data = await res.json();
                    toast.error(data?.message ?? `Failed to create "${category.title}"`);
                    hasError = true;
                    break;
                }
            }

            if (!hasError) {
                if (changedCategories.length > 0) {
                    toast.success(`Updated ${changedCategories.length} category(ies)`);
                }
                if (newCategories.length > 0) {
                    toast.success(`Created ${newCategories.length} new category(ies)`);
                }
            }

            // Refresh categories sau khi hoàn thành
            await fetchCategories();
        } catch (err) {
            console.error("Error saving categories:", err);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
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
                            ? "Update your website categories"
                            : "Create categories for your website"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Danh sách categories */}
                        <div className="space-y-4">
                            {categories.map((category, index) => (
                                <div
                                    key={category.id}
                                    className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                >
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            placeholder="Category title"
                                            value={category.title}
                                            onChange={(e) => handleTitleChange(index, e.target.value)}
                                            className="w-full border border-slate-300 dark:border-slate-500"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        size="icon"
                                        onClick={() => removeCategory(index)}
                                        className="shrink-0 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-400 hover:bg-red-500 dark:hover:bg-red-700 hover:cursor-pointer text-gray-500 hover:text-white dark:text-black dark:hover:text-white"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Nút thêm Category */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addCategory}
                            className="w-full cursor-pointer border-dashed border-gray-600"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Category
                        </Button>

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

            {/* Delete Confirmation Modal */}
            <DeleteCategoryModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteCategory}
                categoryTitle={deleteModal.categoryTitle}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default CustomizeCategories;