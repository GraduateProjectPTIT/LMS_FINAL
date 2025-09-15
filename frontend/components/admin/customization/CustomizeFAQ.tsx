"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

import SortableFAQItem, { type FAQ } from "./SortableFAQItem";

// DND-KIT
import {
    DndContext, closestCenter,
    KeyboardSensor, PointerSensor,
    useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove, SortableContext,
    sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Helper tạo id tạm khi client thêm mới (chưa có _id từ DB)
const genTempId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}-${Math.random()}`;

const CustomizeFAQ: React.FC = () => {
    // Danh sách FAQ
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    // Snapshot bản gốc để so sánh thay đổi
    const [originalFaqs, setOriginalFaqs] = useState<FAQ[]>([]);

    const [loading, setLoading] = useState(false);
    const [faqExists, setFaqExists] = useState(false);

    // Multi-expand: lưu tập các ID đang mở 
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // DND-KIT: cảm biến (chuột + bàn phím)
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Fetch layout FAQ từ server khi mount
    useEffect(() => {
        void fetchFAQLayout();
    }, []);

    // Fetch layout FAQ
    const fetchFAQLayout = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/get_layout/FAQ`,
                { method: "GET", credentials: "include" }
            );
            const data = await res.json();
            if (!res.ok) {
                console.log(data.message ?? "Failed to fetch FAQ layout");
                return;
            }

            if (data.layout?.faq?.length > 0) {
                setFaqExists(true);
                const faqsWithId: FAQ[] = data.layout.faq.map((faq: any) => ({
                    id: faq._id as string,
                    question: faq.question as string,
                    answer: faq.answer as string,
                }));
                setFaqs(faqsWithId);
                setOriginalFaqs(faqsWithId.map((f) => ({ ...f })));
                setExpandedIds(new Set()); // không auto mở gì
            } else {
                setFaqExists(false);
                setFaqs([]);
                setOriginalFaqs([]);
                setExpandedIds(new Set());
            }
        } catch (err: any) {
            console.log(err?.message ?? err);
        } finally {
            setLoading(false);
        }
    };

    // cập nhật question tại đúng vị trí được sửa
    const handleQuestionChange = (index: number, value: string): void => {
        setFaqs((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], question: value };
            return next;
        });
    };

    // cập nhật answer tại đúng vị trí được sửa
    const handleAnswerChange = (index: number, value: string): void => {
        setFaqs((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], answer: value };
            return next;
        });
    };

    // Toggle theo ID: bật/tắt trong Set
    const toggleAccordion = (id: string): void => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Thêm 1 FAQ trống (id tạm). Mặc định MỞ item mới (xóa dòng setExpandedIds nếu không muốn auto mở)
    const addFAQ = (): void => {
        const newFaq: FAQ = { id: genTempId(), question: "", answer: "" };
        setFaqs((prev) => [...prev, newFaq]);
        setExpandedIds((prev) => {
            const next = new Set(prev);
            next.add(newFaq.id);
            return next;
        });
    };

    // Xoá 1 FAQ theo index — nếu xoá item đang mở thì loại khỏi Set
    const removeFAQ = (index: number): void => {
        if (faqs.length <= 1) {
            toast.error("You need at least one FAQ item");
            return;
        }
        const removed = faqs[index];
        setFaqs((prev) => prev.filter((_, i) => i !== index));
        setExpandedIds((prev) => {
            const next = new Set(prev);
            next.delete(removed.id);
            return next;
        });
    };

    // Kiểm tra có thay đổi không (so sánh theo thứ tự để coi reorder là “thay đổi”)
    const isUnchanged = (current: FAQ[], original: FAQ[]): boolean => {
        if (current.length !== original.length) return false;
        return current.every(
            (item, i) =>
                item.question.trim() === original[i]?.question.trim() &&
                item.answer.trim() === original[i]?.answer.trim()
        );
    };

    // Submit form (update toàn bộ danh sách)
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate rỗng
        const isValid = faqs.every(
            (faq) => faq.question.trim() !== "" && faq.answer.trim() !== ""
        );
        if (!isValid) {
            toast.error("All questions and answers must be filled out");
            return;
        }

        // Không có thay đổi gì
        if (isUnchanged(faqs, originalFaqs)) {
            toast("No changes detected!");
            return;
        }

        setLoading(true);
        try {
            const faqData = {
                type: "FAQ",
                faq: faqs.map(({ question, answer }) => ({ question, answer })),
            };

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/update_layout`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(faqData),
                }
            );

            const data = await res.json();
            if (res.ok) {
                toast.success(`FAQs ${faqExists ? "updated" : "created"} successfully`);
                await fetchFAQLayout();
            } else {
                toast.error(data?.message ?? "Failed to save FAQs");
            }
        } catch (err) {
            console.error("Error saving FAQs:", err);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Drag end (khi thả item) → reorder theo id
    const handleDragEnd = (event: DragEndEvent): void => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            setFaqs((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                if (oldIndex === -1 || newIndex === -1) return items;
                return arrayMove(items, oldIndex, newIndex);
            });
            // expandedIds giữ theo id → không cần xử lý thêm
        }
    };

    return (
        <div>
            <Card className="theme-mode w-full border border-gray-300 dark:border-slate-600 shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-center">
                        Customize FAQ Section
                    </CardTitle>
                    <CardDescription className="text-center dark:text-gray-400">
                        {faqExists
                            ? "Update and reorder your website FAQs"
                            : "Create FAQs for your website"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Bọc danh sách bằng DndContext để cho phép drag-drop */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={faqs.map((faq) => faq.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {faqs.map((faq, index) => (
                                    <SortableFAQItem
                                        key={faq.id}
                                        id={faq.id}
                                        faq={faq}
                                        index={index}
                                        expanded={expandedIds.has(faq.id)}
                                        onToggle={() => toggleAccordion(faq.id)}
                                        handleQuestionChange={handleQuestionChange}
                                        handleAnswerChange={handleAnswerChange}
                                        removeFAQ={removeFAQ}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {/* Nút thêm FAQ */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addFAQ}
                            className="w-full cursor-pointer border-dashed"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New FAQ
                        </Button>

                        {/* Nút submit */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : faqExists ? (
                                "Update FAQs"
                            ) : (
                                "Create FAQs"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomizeFAQ;
