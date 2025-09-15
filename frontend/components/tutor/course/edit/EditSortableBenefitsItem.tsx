"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface EditSortableBenefitsItemProps {
    id: string;
    benefit: { title: string };
    index: number;
    onRemove: (index: number) => void;
}

const EditSortableBenefitsItem = ({
    id,
    benefit,
    index,
    onRemove,
}: EditSortableBenefitsItemProps) => {
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
            className="flex gap-2 items-center"
        >
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="cursor-grab touch-none p-1">
                <GripVertical className="h-4 w-4 text-gray-400" />
            </div>

            {/* Benefit Content */}
            <span className="flex-1 py-2 px-3 border border-gray-200 dark:border-slate-500 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm">
                {benefit?.title}
            </span>

            {/* Remove Button */}
            <Button
                type="button"
                variant="ghost"
                onClick={() => onRemove(index)}
                className="p-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20"
            >
                <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
        </div>
    );
};

export default EditSortableBenefitsItem;