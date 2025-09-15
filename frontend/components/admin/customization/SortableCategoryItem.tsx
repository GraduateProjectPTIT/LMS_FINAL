"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { UniqueIdentifier } from "@dnd-kit/core";

export type Category = {
    id: UniqueIdentifier;
    title: string;
};

interface SortableCategoryItemProps {
    id: UniqueIdentifier;
    category: Category;
    index: number;
    handleTitleChange: (index: number, value: string) => void;
    removeCategory: (index: number) => void;
}

const SortableCategoryItem = ({
    id,
    category,
    index,
    handleTitleChange,
    removeCategory,
}: SortableCategoryItemProps) => {
    // Hook của dnd-kit để làm item này draggable
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    // Style hiệu ứng kéo
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-slate-700 rounded-lg shadow-sm mb-3"
        >
            {/* Drag Handle: kéo-thả ở đây */}
            <div {...attributes} {...listeners} className="cursor-grab touch-none p-1">
                <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            {/* Input title */}
            <div className="flex-1">
                <Input
                    placeholder="Enter category title"
                    value={category.title}
                    onChange={(e) => handleTitleChange(index, e.target.value)}
                    className="border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                />
            </div>

            {/* Nút xóa */}
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
    );
};

export default SortableCategoryItem;