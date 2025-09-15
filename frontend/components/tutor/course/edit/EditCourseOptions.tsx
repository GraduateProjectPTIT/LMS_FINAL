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
import EditSortableBenefitsItem from './EditSortableBenefitsItem';
import EditSortablePrerequisites from './EditSortablePrerequisites'
import { generateTempId } from '@/utils/generateId';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { FiPlusCircle } from "react-icons/fi";
import { Separator } from '@/components/ui/separator';
import { IoAlertCircleOutline } from "react-icons/io5";

// Interface cho benefits và prerequisites từ MongoDB
interface IEditBenefits {
    _id?: string; // MongoDB ID cho items có sẵn
    id?: string;  // Temp ID cho items mới
    title: string;
}

interface IEditPrerequisites {
    _id?: string; // MongoDB ID cho items có sẵn
    id?: string;  // Temp ID cho items mới
    title: string;
}

const editCourseOptionsSchema = z.object({
    benefits: z.array(
        z.object({
            _id: z.string().optional(),
            id: z.string().optional(),
            title: z.string().min(1, "Benefit cannot be empty").max(200, "Benefit must not exceed 200 characters")
        }))
        .min(1, "Please add at least one benefit")
        .max(10, "You can add up to 10 benefits only"),
    prerequisites: z.array(
        z.object({
            _id: z.string().optional(),
            id: z.string().optional(),
            title: z.string().min(1, "Prerequisite cannot be empty").max(200, "Prerequisite must not exceed 200 characters")
        }))
        .min(1, "Please add at least one prerequisite")
        .max(10, "You can add up to 10 prerequisites only")
});

type EditCourseOptionsFormValues = z.infer<typeof editCourseOptionsSchema>;

interface EditCourseOptionsProps {
    active: number,
    setActive: (active: number) => void,
    benefits: IEditBenefits[],
    setBenefits: (benefits: IEditBenefits[]) => void,
    prerequisites: IEditPrerequisites[],
    setPrerequisites: (prerequisites: IEditPrerequisites[]) => void
}

const EditCourseOptions = ({
    active,
    setActive,
    benefits,
    setBenefits,
    prerequisites,
    setPrerequisites
}: EditCourseOptionsProps) => {

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
    } = useForm<EditCourseOptionsFormValues>({
        resolver: zodResolver(editCourseOptionsSchema),
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

        const currentBenefits = watchedFields.benefits || [];

        if (currentBenefits.length >= 10) {
            toast.error("You can add up to 10 benefits only");
            return;
        }

        // Tạo benefit mới với temp ID (vì chưa có trong database)
        const newBenefitItem: IEditBenefits = {
            id: generateTempId(), // Chỉ tạo tempId cho item mới
            title: newBenefit.trim()
        };

        const updatedBenefits = [...currentBenefits, newBenefitItem];
        setValue('benefits', updatedBenefits, { shouldValidate: true });
        setBenefits(updatedBenefits);
        setNewBenefit("");

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

        // Tạo prerequisite mới với temp ID (vì chưa có trong database)
        const newPrerequisiteItem: IEditPrerequisites = {
            id: generateTempId(), // Chỉ tạo tempId cho item mới
            title: newPrerequisite.trim()
        };

        const updatedPrerequisites = [...currentPrerequisites, newPrerequisiteItem];
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

    const onSubmit = async (data: EditCourseOptionsFormValues) => {
        try {
            setBenefits(data.benefits);
            setPrerequisites(data.prerequisites);

            toast.success("Course options validated successfully!");
            setActive(active + 1);
        } catch (error: any) {
            toast.error("Something went wrong. Please try again.");
        }
    };

    const field = (name: keyof EditCourseOptionsFormValues, opts?: { isArrayField?: boolean }) => {
        const status = getFieldStatus(name, touchedFields, errors, watchedFields, opts);
        return {
            border: getFieldBorderClass(status),
            icon: getFieldIcon(status)
        }
    }

    // Hàm lấy unique identifier cho drag and drop
    const getBenefitId = (benefit: IEditBenefits) => {
        return benefit._id || benefit.id || '';
    };

    const getPrerequisiteId = (prerequisite: IEditPrerequisites) => {
        return prerequisite._id || prerequisite.id || '';
    };

    const handleBenefitsDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const currentBenefits = watchedFields.benefits || [];
            const oldIndex = currentBenefits.findIndex(item => getBenefitId(item) === active.id);
            const newIndex = currentBenefits.findIndex(item => getBenefitId(item) === over.id);

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
            const oldIndex = currentPrerequisites.findIndex(item => getPrerequisiteId(item) === active.id);
            const newIndex = currentPrerequisites.findIndex(item => getPrerequisiteId(item) === over.id);

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
                                        <div className={`space-y-4 ${field("benefits", { isArrayField: true }).border ? 'border rounded-md p-4 ' + field("benefits", { isArrayField: true }).border : ''}`}>
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleBenefitsDragEnd}
                                            >
                                                <SortableContext
                                                    items={(benefitsField.value || []).map(item => getBenefitId(item))}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {(benefitsField.value || []).map((benefit, index) => (
                                                        <EditSortableBenefitsItem
                                                            key={getBenefitId(benefit)}
                                                            id={getBenefitId(benefit)}
                                                            benefit={benefit}
                                                            index={index}
                                                            onRemove={handleRemoveBenefit}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        </div>

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
                                                    items={(prerequisitesField.value || []).map(item => getPrerequisiteId(item))}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {(prerequisitesField.value || []).map((prerequisite, index) => (
                                                        <EditSortablePrerequisites
                                                            key={getPrerequisiteId(prerequisite)}
                                                            id={getPrerequisiteId(prerequisite)}
                                                            prerequisite={prerequisite}
                                                            index={index}
                                                            onRemove={handleRemovePrerequisite}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        </div>

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
                        {isSubmitting ? "Updating..." : "Next"}
                    </Button>
                </div>
            </div>
        </form>
    )
}

export default EditCourseOptions