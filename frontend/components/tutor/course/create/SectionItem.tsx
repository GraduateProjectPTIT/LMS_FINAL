"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import LectureItem from './LectureItem';
import { ICreateSection, ICreateLecture } from '@/type';
import toast from 'react-hot-toast';
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

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SectionItemProps {
    section: ICreateSection;
    sectionIndex: number;
    canRemoveSection: boolean;
    collapsedStates: { [key: string]: boolean };
    onSectionChange: (updatedSection: ICreateSection) => void;
    onRemoveSection: () => void;
    onToggleLectureCollapse: (sectionIndex: number, lectureIndex: number) => void;
    // Thêm props cho drag-and-drop
    id: string;
}

const SectionItem = ({
    section,
    sectionIndex,
    canRemoveSection,
    collapsedStates,
    onSectionChange,
    onRemoveSection,
    onToggleLectureCollapse,
    id
}: SectionItemProps) => {

    // Hook của dnd-kit để làm item này draggable
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Style hiệu ứng kéo
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        lectureIndex: number | null;
        lectureTitle: string;
    }>({
        isOpen: false,
        lectureIndex: null,
        lectureTitle: ''
    });

    const handleSectionTitleChange = (value: string) => {
        const updatedSection = { ...section, sectionTitle: value };
        onSectionChange(updatedSection);
    };

    // Hàm kiểm tra xem lecture có đầy đủ thông tin bắt buộc không
    const isLectureComplete = (lecture: ICreateLecture): boolean => {
        return !!(
            lecture.videoTitle.trim() &&
            lecture.videoDescription.trim() &&
            lecture.video.url &&
            lecture.video.public_id &&
            lecture.videoLength > 0
        );
    };

    // Hàm kiểm tra xem có lecture nào chưa hoàn thành không
    const hasIncompleteLectures = (): boolean => {
        return section.sectionContents.some(lecture => !isLectureComplete(lecture));
    };

    const handleAddLecture = () => {
        // Kiểm tra xem có lecture nào chưa hoàn thành không
        if (hasIncompleteLectures()) {
            toast.error("Please complete all existing lectures before adding a new one");
            return;
        }

        const newLecture: ICreateLecture = {
            id: generateTempId(),
            videoTitle: "",
            videoDescription: "",
            video: { public_id: "", url: "" },
            videoLength: 0,
            isUploading: false,
            uploadProgress: 0
        };

        const updatedSection = {
            ...section,
            sectionContents: [...section.sectionContents, newLecture]
        };
        onSectionChange(updatedSection);
    };

    const handleRemoveLecture = (lectureIndex: number) => {
        // Nếu chỉ còn 1 lecture thì không cho xóa
        if (section.sectionContents.length === 1) {
            toast.error("A section must have at least one lecture");
            return;
        }

        setDeleteModal({
            isOpen: true,
            lectureIndex,
            lectureTitle: section.sectionContents[lectureIndex].videoTitle || `Lecture ${lectureIndex + 1}`
        });
    };

    const confirmDeleteLecture = () => {
        if (deleteModal.lectureIndex !== null) {
            const updatedSection = {
                ...section,
                sectionContents: section.sectionContents.filter((_, index) => index !== deleteModal.lectureIndex)
            };
            onSectionChange(updatedSection);
            toast.success("Lecture deleted successfully");
        }
    };

    const handleUpdateLecture = (lectureIndex: number, updatedLecture: ICreateLecture) => {
        const updatedSection = {
            ...section,
            sectionContents: section.sectionContents.map((lecture, index) =>
                index === lectureIndex ? updatedLecture : lecture
            )
        };
        onSectionChange(updatedSection);
    };

    // Đếm số lecture đã hoàn thành
    const completedLecturesCount = section.sectionContents.filter(isLectureComplete).length;
    const totalLecturesCount = section.sectionContents.length;

    const handleLectureDragEnd = (event: DragEndEvent): void => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const oldIndex = section.sectionContents.findIndex(lecture => lecture.id === active.id);
            const newIndex = section.sectionContents.findIndex(lecture => lecture.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return;

            const updatedSection = {
                ...section,
                sectionContents: arrayMove(section.sectionContents, oldIndex, newIndex)
            };
            onSectionChange(updatedSection);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 md:p-6 flex flex-col gap-4 bg-gray-50 dark:bg-slate-800/50"
        >
            {/* Section Header */}
            <div className="flex items-center justify-between gap-4">
                {/* Drag Handle */}
                <div {...attributes} {...listeners} className="cursor-grab touch-none p-2">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Section #{sectionIndex + 1} - Title*
                    </Label>
                    <Input
                        value={section.sectionTitle}
                        onChange={(e) => handleSectionTitleChange(e.target.value)}
                        placeholder={`Enter section ${sectionIndex + 1} title`}
                        className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-800"
                    />
                </div>
                {canRemoveSection && (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onRemoveSection}
                        className="mt-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        title="Remove this section"
                    >
                        <Trash2 size={18} />
                    </Button>
                )}
            </div>

            {/* Section Statistics */}
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 p-2 rounded border">
                <div className="flex items-center justify-between">
                    <span className="font-medium">
                        {section.sectionContents.length} lecture{section.sectionContents.length !== 1 ? 's' : ''} in this section
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${completedLecturesCount === totalLecturesCount
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                        {completedLecturesCount}/{totalLecturesCount} completed
                    </span>
                </div>
            </div>

            {/* Lectures */}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleLectureDragEnd}
            >
                <SortableContext
                    items={section.sectionContents.map(lecture => lecture.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {section.sectionContents.map((lecture, lectureIndex) => (
                            <LectureItem
                                key={lecture.id}
                                id={lecture.id}
                                lecture={lecture}
                                lectureIndex={lectureIndex}
                                sectionIndex={sectionIndex}
                                isCollapsed={collapsedStates[`${sectionIndex}-${lectureIndex}`] || false}
                                onToggleCollapse={() => onToggleLectureCollapse(sectionIndex, lectureIndex)}
                                onRemove={() => handleRemoveLecture(lectureIndex)}
                                onUpdateLecture={(updatedLecture) => handleUpdateLecture(lectureIndex, updatedLecture)}
                            />
                        ))}
                        {/* Add Lecture Button */}
                        <button
                            type="button"
                            onClick={handleAddLecture}
                            disabled={hasIncompleteLectures()}
                            className={`w-full h-[50px] border-dashed border-2 py-6 rounded-md font-medium transition-colors duration-200 flex items-center justify-center ${hasIncompleteLectures()
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-700 cursor-not-allowed'
                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/30 cursor-pointer'
                                }`}
                            title={hasIncompleteLectures() ? "Complete all existing lectures first" : "Add new lecture"}
                        >
                            <Plus size={18} className="mr-2" />
                            Add New Lecture to Section {sectionIndex + 1}
                            {hasIncompleteLectures() && (
                                <span className="ml-2 text-sm">
                                    (Complete existing lectures first)
                                </span>
                            )}
                        </button>
                    </div>
                </SortableContext>
            </DndContext>

            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, lectureIndex: null, lectureTitle: '' })}
                onConfirm={confirmDeleteLecture}
                title="Delete Lecture"
                description="Are you sure you want to delete this lecture? This action cannot be undone and will remove the video and all associated content."
                itemName={deleteModal.lectureTitle}
            />
        </div>
    );
};

export default SectionItem;