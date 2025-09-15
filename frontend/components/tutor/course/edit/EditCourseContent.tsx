"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { FiPlusCircle } from "react-icons/fi";
import { Separator } from '@/components/ui/separator';
import EditSectionItem from './EditSectionItem';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
    DndContext, closestCenter,
    KeyboardSensor, PointerSensor,
    useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove, SortableContext,
    sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { generateTempId } from '@/utils/generateId';

interface IEditSection {
    _id?: string; // MongoDB ID cho sections có sẵn
    id?: string;  // Temp ID cho sections mới
    sectionTitle: string;
    sectionContents: IEditLecture[];
}

interface IEditLecture {
    _id?: string; // MongoDB ID cho lectures có sẵn
    id?: string;  // Temp ID cho lectures mới
    videoTitle: string;
    videoDescription: string;
    video: { public_id?: string; url: string };
    videoLength: number;
    videoLinks?: { title: string; url: string }[];
    isUploading?: boolean;
    uploadProgress?: number;
}

interface EditCourseContentProps {
    active: number;
    setActive: (active: number) => void;
    courseData: IEditSection[];
    setCourseData: (newData: IEditSection[]) => void;
}

interface CollapsedState {
    [key: string]: boolean;
}

const EditCourseContent = ({ active, setActive, courseData, setCourseData }: EditCourseContentProps) => {
    const [collapsedStates, setCollapsedStates] = useState<CollapsedState>({});
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        sectionIndex: number | null;
        sectionTitle: string;
    }>({
        isOpen: false,
        sectionIndex: null,
        sectionTitle: ''
    });

    // Hàm kiểm tra xem lecture có đầy đủ thông tin bắt buộc không
    const isLectureComplete = (lecture: IEditLecture): boolean => {
        return !!(
            lecture.videoTitle.trim() &&
            lecture.videoDescription.trim() &&
            lecture.video.url &&
            lecture.video.public_id &&
            lecture.videoLength > 0
        );
    };

    // Hàm kiểm tra xem section có đầy đủ thông tin bắt buộc không
    const isSectionComplete = (section: IEditSection): boolean => {
        if (!section.sectionTitle.trim()) {
            return false;
        }

        // Kiểm tra tất cả lectures trong section đã hoàn thành chưa
        return section.sectionContents.every(lecture => isLectureComplete(lecture));
    };

    // Hàm kiểm tra xem có section nào chưa hoàn thành không
    const hasIncompleteSections = (): boolean => {
        return courseData.some(section => !isSectionComplete(section));
    };

    const validateCourseData = (courseData: IEditSection[]): string | null => {
        for (let sectionIndex = 0; sectionIndex < courseData.length; sectionIndex++) {
            const section = courseData[sectionIndex];

            if (!section.sectionTitle.trim()) {
                return `Section ${sectionIndex + 1} title is required`;
            }

            for (let lectureIndex = 0; lectureIndex < section.sectionContents.length; lectureIndex++) {
                const lecture = section.sectionContents[lectureIndex];

                // Xác thực tiêu đề, mô tả, video và độ dài video
                if (!lecture.videoTitle.trim()) {
                    return `Lecture title is required in Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}`;
                }
                if (!lecture.videoDescription.trim()) {
                    return `Lecture description is required in Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}`;
                }
                if (!lecture.video?.url || !lecture.video?.public_id) {
                    return `Video is required in Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}`;
                }
                if (!lecture.videoLength || lecture.videoLength <= 0) {
                    return `Video length is required in Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}`;
                }

                // Xác thực các link tài nguyên (nếu có)
                if (lecture.videoLinks && lecture.videoLinks.length > 0) {
                    for (let linkIndex = 0; linkIndex < lecture.videoLinks.length; linkIndex++) {
                        const link = lecture.videoLinks[linkIndex];

                        if (!link.title.trim()) {
                            return `Resource link title is required in Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}, Link ${linkIndex + 1}`;
                        }
                        if (!link.url.trim()) {
                            return `Resource link URL is required in Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}, Link ${linkIndex + 1}`;
                        }

                        // Optional: Validate URL format
                        const urlPattern = /^https?:\/\/.+/;
                        if (!urlPattern.test(link.url.trim())) {
                            return `Resource link URL must be a valid URL (starting with http:// or https://) in Section ${sectionIndex + 1}, Lecture ${lectureIndex + 1}, Link ${linkIndex + 1}`;
                        }
                    }
                }
            }
        }
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1) Chặn nếu còn video đang upload
        const hasUploading = courseData.some(s =>
            s.sectionContents.some(l => l.isUploading)
        );
        if (hasUploading) {
            toast.error("Please wait for all uploads to finish");
            return;
        }

        // 2) Xác thực dữ liệu
        const errorMessage = validateCourseData(courseData);
        if (errorMessage) {
            toast.error(errorMessage);
            return;
        }

        toast.success("Course contents validated successfully!");
        setActive(active + 1);
    };

    const handleToggleLectureCollapse = (sectionIndex: number, lectureIndex: number) => {
        const key = `${sectionIndex}-${lectureIndex}`;
        setCollapsedStates(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // DND-KIT: cảm biến (chuột + bàn phím)
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Drag end (khi thả section) → reorder theo id
    const handleDragEnd = (event: DragEndEvent): void => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const oldIndex = courseData.findIndex((item) => getSectionId(item) === active.id);
            const newIndex = courseData.findIndex((item) => getSectionId(item) === over.id);
            if (oldIndex === -1 || newIndex === -1) return;
            setCourseData(arrayMove(courseData, oldIndex, newIndex));
        }
    };

    const getSectionId = (section: IEditSection) => {
        return section._id || section.id || '';
    };

    const handleAddNewSection = () => {
        if (hasIncompleteSections()) {
            toast.error("Please complete all existing sections before adding a new one");
            return;
        }

        const newSection: IEditSection = {
            id: generateTempId(), // Chỉ tạo tempId cho section mới
            sectionTitle: "",
            sectionContents: [
                {
                    id: generateTempId(), // Chỉ tạo tempId cho lecture mới
                    videoTitle: "",
                    videoDescription: "",
                    video: { public_id: "", url: "" },
                    videoLength: 0,
                    isUploading: false,
                    uploadProgress: 0
                }
            ]
        };

        setCourseData([...courseData, newSection]);
    };

    const handleRemoveSection = (sectionId: string) => {
        if (courseData.length === 1) {
            toast.error("You need at least one section");
            return;
        }

        const sectionIndex = courseData.findIndex(s => getSectionId(s) === sectionId);
        setDeleteModal({
            isOpen: true,
            sectionIndex,
            sectionTitle: courseData[sectionIndex].sectionTitle || `Section ${sectionIndex + 1}`
        });
    };

    const confirmDeleteSection = () => {
        if (deleteModal.sectionIndex !== null) {
            const updatedData = courseData.filter((_, index) => index !== deleteModal.sectionIndex);
            setCourseData(updatedData);
            toast.success("Section deleted successfully");
        }
    };

    const handleSectionChange = (sectionId: string, updatedSection: IEditSection) => {
        const updatedData = courseData.map((section) =>
            getSectionId(section) === sectionId ? updatedSection : section
        );
        setCourseData(updatedData);
    };

    // Đếm số section đã hoàn thành
    const completedSectionsCount = courseData.filter(isSectionComplete).length;
    const totalSectionsCount = courseData.length;

    return (
        <div className="rounded-lg border border-gray-400 dark:border-slate-500 shadow-md dark:shadow-slate-700 flex flex-col gap-8 p-4">
            <h1 className="text-2xl text-black dark:text-white font-bold">Course Content</h1>

            {/* Course Statistics */}
            {courseData.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 p-3 rounded border">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">
                            {totalSectionsCount} section{totalSectionsCount !== 1 ? 's' : ''} in this course
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${completedSectionsCount === totalSectionsCount
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                            {completedSectionsCount}/{totalSectionsCount} sections completed
                        </span>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
                {courseData.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-300 py-8">
                        No sections added yet. Click below to add your first section.
                    </div>
                ) : (
                    <div className="space-y-6">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={courseData.map((section) => getSectionId(section))}
                                strategy={verticalListSortingStrategy}
                            >
                                {courseData.map((section: IEditSection, sectionIndex: number) => (
                                    <EditSectionItem
                                        key={getSectionId(section)}
                                        id={getSectionId(section)}
                                        section={section}
                                        sectionIndex={sectionIndex}
                                        canRemoveSection={courseData.length > 1}
                                        collapsedStates={collapsedStates}
                                        onSectionChange={(updatedSection) => handleSectionChange(getSectionId(section), updatedSection)}
                                        onRemoveSection={() => handleRemoveSection(getSectionId(section))}
                                        onToggleLectureCollapse={handleToggleLectureCollapse}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                )}

                {/* Add New Section Button */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddNewSection}
                    disabled={hasIncompleteSections()}
                    className={`w-full border-dashed border-2 py-6 ${hasIncompleteSections()
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-700 cursor-not-allowed'
                        : 'bg-green-100/70 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800/30 cursor-pointer'
                        }`}
                    title={hasIncompleteSections() ? "Complete all existing sections first" : "Add new section"}
                >
                    <FiPlusCircle size={18} className="mr-2" />
                    Add New Section
                    {hasIncompleteSections() && (
                        <span className="ml-2 text-sm">
                            (Complete existing sections first)
                        </span>
                    )}
                </Button>

                <Separator className="border border-gray-300 dark:border-slate-500 mt-6" />

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-2">
                    <Button
                        type="button"
                        onClick={() => setActive(active - 1)}
                        variant="outline"
                        className='w-[100px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white rounded-lg cursor-pointer'
                    >
                        Back
                    </Button>
                    <Button
                        type="submit"
                        className='w-[100px] bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer'
                    >
                        Continue
                    </Button>
                </div>
            </form>

            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, sectionIndex: null, sectionTitle: '' })}
                onConfirm={confirmDeleteSection}
                title="Delete Section"
                description="Are you sure you want to delete this section? This action cannot be undone and will remove all lectures in this section."
                itemName={deleteModal.sectionTitle}
            />
        </div>
    );
};

export default EditCourseContent;