"use client"

import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getFieldStatus, getFieldBorderClass, getFieldIcon } from "@/utils/formFieldHelpers";
import {
    DndContext, closestCenter,
    KeyboardSensor, PointerSensor,
    useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove, SortableContext,
    sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableBenefitsItem from './SortableBenefitsItem';
import SortablePrerequisitesItem from './SortablePrerequisites'
import { generateTempId } from '@/utils/generateId';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { FiPlusCircle } from "react-icons/fi";
import { Separator } from '@/components/ui/separator';
import { IoAlertCircleOutline } from "react-icons/io5";
import { ICreateBenefits, ICreatePrerequisites } from '@/type';

const courseOptionsSchema = z.object({
    benefits: z.array(
        z.object({
            id: z.string(),
            title: z.string().min(1, "Benefit cannot be empty").max(200, "Benefit must not exceed 200 characters")
        }))
        .min(1, "Please add at least one benefit")
        .max(10, "You can add up to 10 benefits only"),
    prerequisites: z.array(
        z.object({
            id: z.string(),
            title: z.string().min(1, "Prerequisite cannot be empty").max(200, "Prerequisite must not exceed 200 characters")
        }))
        .min(1, "Please add at least one prerequisite")
        .max(10, "You can add up to 10 prerequisites only")
});

type CourseOptionsFormValues = z.infer<typeof courseOptionsSchema>;

interface CourseOptionsProps {
    active: number,
    setActive: (active: number) => void,
    benefits: ICreateBenefits[],
    setBenefits: (benefits: ICreateBenefits[]) => void,
    prerequisites: ICreatePrerequisites[],
    setPrerequisites: (prerequisites: ICreatePrerequisites[]) => void
}

const CourseOptions = ({
    active,
    setActive,
    benefits,
    setBenefits,
    prerequisites,
    setPrerequisites
}: CourseOptionsProps) => {

    const [newBenefit, setNewBenefit] = useState("");
    const [newPrerequisite, setNewPrerequisite] = useState("");

    const {
        handleSubmit,
        control,
        watch,
        setValue,
        trigger,
        formState: {
            isSubmitting,
            errors,
            touchedFields
        }
    } = useForm<CourseOptionsFormValues>({
        resolver: zodResolver(courseOptionsSchema),
        mode: "onChange",
        defaultValues: {
            benefits: benefits.length > 0 ? benefits : [],
            prerequisites: prerequisites.length > 0 ? prerequisites : []
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const watchedFields = watch();

    const handleChangeBenefitsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewBenefit(e.target.value);
    }

    const handleChangePrerequisitesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewPrerequisite(e.target.value);
    }

    const handleAddBenefit = async () => {
        if (newBenefit.trim() === "") {
            toast.error("Benefit cannot be empty");
            return;
        }

        if (newBenefit.trim().length > 200) {
            toast.error("Benefit must not exceed 200 characters");
            return;
        }

        // Lấy danh sách benefit hiện tại từ react-hook-form
        const currentBenefits = watchedFields.benefits || [];

        if (currentBenefits.length >= 10) {
            toast.error("You can add up to 10 benefits only");
            return;
        }

        // Tạo mảng mới gồm benefit cũ + benefit mới
        const updatedBenefits = [...currentBenefits, {
            id: generateTempId(),
            title: newBenefit.trim()
        }];
        // Cập nhật lại field "benefits" trong react-hook-form
        setValue('benefits', updatedBenefits, { shouldValidate: true });
        // Cập nhật state từ component cha
        setBenefits(updatedBenefits);
        // Reset input về rỗng
        setNewBenefit("");

        // YÊU CẦU react-hook-form chạy validate ngay lập tức cho field 'benefits'
        await trigger('benefits');
    };

    const handleRemoveBenefit = async (index: number) => {
        const currentBenefits = watchedFields.benefits || [];
        const updatedBenefits = currentBenefits.filter((_, i) => i !== index);
        setValue('benefits', updatedBenefits, { shouldValidate: true });
        setBenefits(updatedBenefits);
        await trigger('benefits');
    };

    const handleAddPrerequisite = async () => {
        if (newPrerequisite.trim() === "") {
            toast.error("Prerequisite cannot be empty");
            return;
        }

        if (newPrerequisite.trim().length > 200) {
            toast.error("Prerequisite must not exceed 200 characters");
            return;
        }

        const currentPrerequisites = watchedFields.prerequisites || [];

        if (currentPrerequisites.length >= 10) {
            toast.error("You can add up to 10 prerequisites only");
            return;
        }

        const updatedPrerequisites = [...currentPrerequisites, {
            id: generateTempId(),
            title: newPrerequisite.trim()
        }];
        setValue('prerequisites', updatedPrerequisites, { shouldValidate: true });
        setPrerequisites(updatedPrerequisites);
        setNewPrerequisite("");

        await trigger('prerequisites');
    };

    const handleRemovePrerequisite = async (index: number) => {
        const currentPrerequisites = watchedFields.prerequisites || [];
        const updatedPrerequisites = currentPrerequisites.filter((_, i) => i !== index);
        setValue('prerequisites', updatedPrerequisites, { shouldValidate: true });
        setPrerequisites(updatedPrerequisites);

        await trigger('prerequisites');
    };

    const handleBackButton = () => {
        setActive(active - 1);
    }

    const onSubmit = async (data: CourseOptionsFormValues) => {
        try {
            setBenefits(data.benefits);
            setPrerequisites(data.prerequisites);

            toast.success("Course options validated successfully!");
            setActive(active + 1);
        } catch (error: any) {
            toast.error("Something went wrong. Please try again.");
        }
    };

    const field = (name: keyof CourseOptionsFormValues, opts?: { isArrayField?: boolean }) => {
        const status = getFieldStatus(name, touchedFields, errors, watchedFields, opts);
        return {
            border: getFieldBorderClass(status),
            icon: getFieldIcon(status)
        }
    }

    const handleBenefitsDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const currentBenefits = watchedFields.benefits || [];
            const oldIndex = currentBenefits.findIndex(item => item.id === active.id);
            const newIndex = currentBenefits.findIndex(item => item.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedBenefits = arrayMove(currentBenefits, oldIndex, newIndex);
                setValue('benefits', reorderedBenefits, { shouldValidate: true });
                setBenefits(reorderedBenefits);
                await trigger('benefits');
            }
        }
    };

    const handlePrerequisitesDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const currentPrerequisites = watchedFields.prerequisites || [];
            const oldIndex = currentPrerequisites.findIndex(item => item.id === active.id);
            const newIndex = currentPrerequisites.findIndex(item => item.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedPrerequisites = arrayMove(currentPrerequisites, oldIndex, newIndex);
                setValue('prerequisites', reorderedPrerequisites, { shouldValidate: true });
                setPrerequisites(reorderedPrerequisites);
                await trigger('prerequisites');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="w-full flex flex-col gap-8">
                {/* Benefits Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-black dark:text-white">Course Benefits</h2>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(watchedFields.benefits || []).length}/10 added
                        </span>
                    </div>
                    <Label className="text-gray-500">
                        Specify what students will gain from taking this course
                    </Label>

                    {/* Add New Benefit */}
                    <div className="flex gap-3">
                        <Input
                            type="text"
                            placeholder="e.g., Learn professional makeup techniques"
                            value={newBenefit}
                            onChange={handleChangeBenefitsInput}
                            className="border-gray-300 dark:border-gray-500"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddBenefit();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddBenefit}
                            className="bg-gray-200 dark:bg-slate-500 hover:bg-gray-300 dark:hover:bg-slate-600 whitespace-nowrap"
                            disabled={(watchedFields.benefits || []).length >= 10}
                        >
                            <FiPlusCircle className="w-4 h-4 mr-2" />
                            <span>Add</span>
                        </Button>
                    </div>

                    {
                        (watchedFields.benefits || []).length > 0 && (
                            <Controller
                                name="benefits"
                                control={control}
                                render={({ field: benefitsField }) => (
                                    <div className="space-y-4">
                                        {/* Benefits List with DND */}
                                        <div className={`space-y-4 ${field("benefits", { isArrayField: true }).border ? 'border rounded-md p-4 ' + field("benefits", { isArrayField: true }).border : ''}`}>
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleBenefitsDragEnd}
                                            >
                                                <SortableContext
                                                    items={(benefitsField.value || []).map(item => item.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {(benefitsField.value || []).map((benefit, index) => (
                                                        <SortableBenefitsItem
                                                            key={benefit.id}
                                                            id={benefit.id}
                                                            benefit={benefit}
                                                            index={index}
                                                            onRemove={handleRemoveBenefit}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        </div>

                                        {/* Status Icon */}
                                        {(benefitsField.value || []).length > 0 && (
                                            <div className="flex justify-end">
                                                {field("benefits", { isArrayField: true }).icon}
                                            </div>
                                        )}
                                    </div>
                                )}
                            />
                        )
                    }

                    {/* Benefits Error */}
                    {errors.benefits && (
                        <div className="flex items-center gap-2 mt-1">
                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                            <p className="text-red-400 text-[12px]">{errors.benefits.message}</p>
                        </div>
                    )}
                </div>

                <Separator className='border-theme' />

                {/* Prerequisites Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Course Prerequisites</h2>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(watchedFields.prerequisites || []).length}/10 added
                        </span>
                    </div>
                    <Label className="text-gray-500">
                        List any knowledge, tools, or experience students should have before starting
                    </Label>

                    {/* Add New Prerequisite */}
                    <div className="flex gap-3">
                        <Input
                            type="text"
                            placeholder="e.g., Basic knowledge of skincare routines"
                            value={newPrerequisite}
                            onChange={handleChangePrerequisitesInput}
                            className="border-gray-300 dark:border-gray-500"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddPrerequisite();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddPrerequisite}
                            className="bg-gray-200 dark:bg-slate-500 hover:bg-gray-300 dark:hover:bg-slate-600 whitespace-nowrap"
                            disabled={(watchedFields.prerequisites || []).length >= 10}
                        >
                            <FiPlusCircle className="w-4 h-4 mr-2" />
                            <span>Add</span>
                        </Button>
                    </div>

                    {
                        (watchedFields.prerequisites || []).length > 0 && (
                            <Controller
                                name="prerequisites"
                                control={control}
                                render={({ field: prerequisitesField }) => (
                                    <div className="space-y-4">
                                        {/* Prerequisites List with DND */}
                                        <div className={`space-y-4 ${field("prerequisites", { isArrayField: true }).border ? 'border rounded-md p-4 ' + field("prerequisites", { isArrayField: true }).border : ''}`}>
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handlePrerequisitesDragEnd}
                                            >
                                                <SortableContext
                                                    items={(prerequisitesField.value || []).map(item => item.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {(prerequisitesField.value || []).map((prerequisite, index) => (
                                                        <SortablePrerequisitesItem
                                                            key={prerequisite.id}
                                                            id={prerequisite.id}
                                                            prerequisite={prerequisite}
                                                            index={index}
                                                            onRemove={handleRemovePrerequisite}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        </div>

                                        {/* Status Icon */}
                                        {(prerequisitesField.value || []).length > 0 && (
                                            <div className="flex justify-end">
                                                {field("prerequisites", { isArrayField: true }).icon}
                                            </div>
                                        )}
                                    </div>
                                )}
                            />
                        )
                    }

                    {/* Prerequisites Error */}
                    {errors.prerequisites && (
                        <div className="flex items-center gap-2 mt-1">
                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                            <p className="text-red-400 text-[12px]">{errors.prerequisites.message}</p>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    <Button
                        type="button"
                        onClick={handleBackButton}
                        className='w-[100px] bg-gray-200 hover:bg-blue-200 text-black rounded-[10px] cursor-pointer'
                    >
                        Previous
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className='w-[100px] bg-gray-200 hover:bg-blue-200 text-black rounded-[10px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {isSubmitting ? "Validating..." : "Next"}
                    </Button>
                </div>
            </div>
        </form>
    )
}

export default CourseOptions