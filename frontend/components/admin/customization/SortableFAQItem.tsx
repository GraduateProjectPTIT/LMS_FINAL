"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type FAQ = {
    id: string;
    question: string;
    answer: string;
};

interface SortableFAQItemProps {
    id: string;
    faq: FAQ;
    index: number;
    expanded: boolean;
    onToggle: () => void;
    handleQuestionChange: (index: number, value: string) => void;
    handleAnswerChange: (index: number, value: string) => void;
    removeFAQ: (index: number) => void;
}

const SortableFAQItem = ({
    id,
    faq,
    index,
    expanded,
    onToggle,
    handleQuestionChange,
    handleAnswerChange,
    removeFAQ,
}: SortableFAQItemProps) => {
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
            className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900 mb-4"
        >
            {/* HEADER: chứa drag-handle, input câu hỏi, nút xóa & nút toggle */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4">
                {/* Drag Handle: kéo-thả ở đây */}
                <div {...attributes} {...listeners} className="cursor-grab touch-none p-2">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                </div>

                {/* Input câu hỏi */}
                <div className="flex-1" onClick={onToggle}>
                    <Input
                        placeholder="Enter question here ..."
                        value={faq.question}
                        onChange={(e) => handleQuestionChange(index, e.target.value)}
                        className="border border-slate-300 dark:border-slate-500 pl-2 text-xs md:text-base font-medium focus:ring-0 shadow-none focus:shadow-none dark:text-white bg-transparent"
                        onClick={(e) => e.stopPropagation()} // tránh toggle khi click vào input
                        required
                    />
                </div>

                {/* Nút xoá + nút thu gọn/mở rộng */}
                <div className="flex items-center space-x-2 ml-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeFAQ(index);
                        }}
                        className="h-8 w-8 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-200 dark:hover:bg-red-900/70 hover:cursor-pointer"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div onClick={onToggle} className="cursor-pointer p-1">
                        {expanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                    </div>
                </div>
            </div>

            {/* Input trả lời câu hỏi */}
            {expanded && (
                <div className="p-4 border-t dark:border-gray-700">
                    <Label
                        htmlFor={`answer-${index}`}
                        className="block mb-2 text-sm font-medium dark:text-gray-200"
                    >
                        Answer
                    </Label>
                    <textarea
                        id={`answer-${index}`}
                        value={faq.answer}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        placeholder="Enter answer here ..."
                        className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-y"
                        required
                    />
                </div>
            )}
        </div>
    );
};

export default SortableFAQItem;
