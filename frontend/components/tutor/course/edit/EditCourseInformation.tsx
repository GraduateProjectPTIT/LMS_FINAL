"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { splitComma, hasDuplicatesCI, tagRegex, escapeRegExp } from "@/utils/courseHelpers";
import { IBaseCategory, ICreateCourseInformation } from '@/type';
import { getFieldStatus, getFieldBorderClass, getFieldIcon, preprocessStringToNumber } from "@/utils/formFieldHelpers";
import { useCategoryAutofill } from '@/hooks/useCategoryAutoFill';
import EditVideoUploader from './EditVideoUploader';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Sparkles, Upload, X, ChevronDown } from 'lucide-react';
import { IoAlertCircleOutline } from "react-icons/io5";

const editCourseSchema = z
    .object({
        name: z.string().min(5, "Course name must be at least 5 characters").max(100, "Course name must not exceed 100 characters"),
        description: z.string().min(150, "Description must be at least 150 characters").max(1000, "Description must not exceed 1000 characters"),
        categories: z.array(z.string())
            .min(1, "Please select at least one category")
            .max(5, "You can select up to 5 categories only"),
        price: z.preprocess(
            preprocessStringToNumber,
            z.number({
                required_error: "Price is required",
                invalid_type_error: "Please enter a valid number",
            }).min(0, "Price must be a non-negative number")
        ),
        estimatedPrice: z.preprocess(
            preprocessStringToNumber,
            z.number({
                required_error: "Estimated price is required",
                invalid_type_error: "Please enter a valid number",
            }).min(0, "Estimated price must be a non-negative number")
        ),
        tags: z.string()
            .trim()
            .min(1, "Tags field cannot be empty")
            .refine(val => !/,$/.test(val.trim()), "Remove trailing comma") // Check dấu phẩy cuối
            .refine(val => !/^,/.test(val.trim()), "Remove leading comma") // Check dấu phẩy đầu  
            .refine(val => !/,,/.test(val), "Remove double commas") // Check dấu phẩy kép
            .refine(val => !/,\s*,/.test(val), "Remove commas with spaces between them") // Check dấu phẩy có khoảng trắng
            .refine(val => {
                const tags = splitComma(val);
                return tags.every(tag => tag.trim().length > 0);
            }, "Remove empty tags (tags with only spaces)")
            .refine(val => splitComma(val).length >= 1, "Please add at least one tag")
            .refine(val => splitComma(val).length <= 5, "You can add up to 5 tags only")
            .refine(val => !hasDuplicatesCI(splitComma(val)), "Duplicate tags are not allowed")
            .refine(val => splitComma(val).every(t => t.length >= 2 && t.length <= 30), "Each tag must be 2–30 characters")
            .refine(val => splitComma(val).every(t => tagRegex.test(t)), "Tags may only contain letters, numbers, spaces, '-' and '&'"),
        level: z.string().trim().min(1, "Please specify course level"),
        videoDemo: z.object({
            public_id: z.string().min(1, "Please upload a demo video"),
            url: z.string().url("Invalid video URL")
        }),
        thumbnail: z.union([
            z.string().min(1, "Please upload a course thumbnail"), // New upload (base64)
            z.object({
                public_id: z.string(),
                url: z.string().url()
            }) // Existing thumbnail from server
        ])
    })
    .refine(d => typeof d.price === 'number' && typeof d.estimatedPrice === 'number' && d.estimatedPrice >= d.price, {
        message: 'Estimated price must be greater than or equal to actual price',
        path: ['estimatedPrice'],
    });

type EditCourseFormValues = z.infer<typeof editCourseSchema>;

interface EditCourseInformationProps {
    courseInfo: any,
    setCourseInfo: (courseInfo: any) => void,
    active: number,
    setActive: (active: number) => void,
    thumbnailPreview: string,
    setThumbnailPreview: (thumbnailPreview: string) => void,
    allCategories: any[],
    allLevels: string[],
    isUploadingDemo: boolean,
    setIsUploadingDemo: (uploading: boolean) => void,
    uploadProgress: number,
    setUploadProgress: (progress: number) => void,
    uploadVideo: (file: File, onProgress: (progress: number) => void) => Promise<any>,
    cancelCurrentUpload: () => void,
}

const EditCourseInformation = ({
    courseInfo,
    setCourseInfo,
    active,
    setActive,
    thumbnailPreview,
    setThumbnailPreview,
    allCategories,
    allLevels,
    isUploadingDemo,
    setIsUploadingDemo,
    uploadProgress,
    setUploadProgress,
    uploadVideo,
    cancelCurrentUpload
}: EditCourseInformationProps) => {
    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        reset,
        formState: {
            isSubmitting,
            errors,
            touchedFields
        }
    } = useForm<EditCourseFormValues>({
        resolver: zodResolver(editCourseSchema),
        mode: "onChange",
        defaultValues: {
            name: '',
            description: '',
            categories: [],
            price: undefined,
            estimatedPrice: undefined,
            tags: '',
            level: '',
            videoDemo: { public_id: "", url: "" },
            thumbnail: ''
        }
    })

    useEffect(() => {
        reset({
            name: courseInfo?.name || '',
            description: courseInfo?.description || '',
            categories: courseInfo?.categories || [],
            price: courseInfo?.price ?? undefined,
            estimatedPrice: courseInfo?.estimatedPrice ?? undefined,
            tags: courseInfo?.tags || '',
            level: courseInfo?.level || '',
            videoDemo: courseInfo?.videoDemo || { public_id: "", url: "" },
            thumbnail: courseInfo?.thumbnail || ''
        });
    }, [courseInfo, reset]);

    const watchedFields = watch();

    const [showAllCategories, setShowAllCategories] = useState(false);
    const [autoFilled, setAutoFilled] = useState(false);

    const { autoFill } = useCategoryAutofill(allCategories);

    // Tự động select categories dựa trên keywords trong description
    const onAutoFillClick = () => {
        const description = watchedFields.description || "";
        const currentCategories = watchedFields.categories || [];

        if (!description.trim()) {
            toast.error("Please enter a description first");
            return;
        }

        const finalCategories = autoFill(description, currentCategories, 5);

        if (finalCategories.length === currentCategories.length) {
            toast("All matching categories were already selected");
            return;
        }

        setValue("categories", finalCategories, { shouldValidate: true });
        setAutoFilled(true);
        const addedCount = finalCategories.length - currentCategories.length;
        toast.success(`Added ${addedCount} categories automatically!`);
    };

    const handleCategoryToggle = (categoryId: string, currentCategories: string[]) => {
        setAutoFilled(false);
        const isSelected = currentCategories.includes(categoryId);

        let updatedCategories;

        if (isSelected) {
            // Nếu đã chọn -> Bỏ chọn (xóa khỏi mảng)
            updatedCategories = currentCategories.filter(id => id !== categoryId);
        } else {
            // Nếu chưa chọn -> Thêm vào mảng
            if (currentCategories.length >= 5) {
                toast.error("You can only select up to 5 categories!");
                return; // Dừng lại nếu đã đủ 5
            }
            updatedCategories = [...currentCategories, categoryId];
        }

        // Cập nhật state của form
        setValue('categories', updatedCategories, { shouldValidate: true });
    };

    // tạo map 1 lần theo allCategories
    const categoryMap = useMemo(() => new Map(allCategories.map(c => [c._id, c.title])), [allCategories]);

    // Tìm tên category từ ID
    const getCategoryNameById = (categoryId: string) => categoryMap.get(categoryId) ?? categoryId;

    const maxMB = 2;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    const processFile = (file: File) => {
        // Chỉ cho phép file ảnh
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed!");
            return;
        }

        // Check loại file
        if (!allowedTypes.includes(file.type)) {
            toast.error("Only JPG, JPEG, and PNG formats are accepted!");
            return;
        }

        // Giới hạn dung lượng ảnh
        if (file.size > maxMB * 1024 * 1024) {
            toast.error(`Image size must not exceed ${maxMB}MB!`);
            return;
        }

        // Đọc file và chuyển thành base64
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                // Cập nhật state preview cho UI và các bước sau
                setThumbnailPreview(reader.result);
                // Cập nhật giá trị vào form để validate và submit
                setValue('thumbnail', reader.result, { shouldValidate: true });
            }
        };
        reader.readAsDataURL(file);
    };

    const [dragging, setDragging] = useState(false);

    const handleDragOver = (e: any) => {
        e.preventDefault();
        setDragging(true);
    }

    const handleDragLeave = (e: any) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const removeImage = () => {
        setThumbnailPreview('');
        setValue('thumbnail', '', { shouldValidate: true });
        setCourseInfo({ ...courseInfo, thumbnail: '' }); // luôn clear, dù trước đó là string hay object
        toast.success("Thumbnail removed successfully");
    };

    const onSubmit = async (data: EditCourseFormValues) => {
        try {
            // cập nhật data từ form vào courseInfo
            setCourseInfo({
                ...courseInfo,
                ...data
            });

            toast.success("Course information validated successfully!");
            setActive(active + 1);
        } catch (error: any) {
            toast.error("Something went wrong. Please try again.");
        }
    };

    const field = (name: keyof EditCourseFormValues, opts?: { isArrayField?: boolean }) => {
        const status = getFieldStatus(name, touchedFields, errors, watchedFields, opts);
        return {
            border: getFieldBorderClass(status),
            icon: getFieldIcon(status)
        }
    }

    const handleVideoSelect = async (file: File) => {
        try {
            setIsUploadingDemo(true);
            setUploadProgress(0);

            const videoData = await uploadVideo(file, (progress) => {
                setUploadProgress(progress);
            });

            if (videoData) {
                setValue('videoDemo', videoData, { shouldValidate: true });
                toast.success('Demo video uploaded successfully!');
            }
        } catch (error: any) {
            console.error('Video upload error:', error);
            toast.error('Video upload failed');
        } finally {
            setIsUploadingDemo(false);
            setUploadProgress(0);
        }
    };

    const handleCancelVideoUpload = () => {
        cancelCurrentUpload();
        setIsUploadingDemo(false);
        setUploadProgress(0);
        toast.success('Upload cancelled');
    };

    const handleRemoveVideo = () => {
        setValue('videoDemo', { public_id: "", url: "" }, { shouldValidate: true });
        toast.success('Demo video removed');
    };

    const thumbValue = watch("thumbnail");

    const getThumbnailUrl = () => {
        if (thumbnailPreview) return thumbnailPreview;

        if (typeof thumbValue === 'object' && thumbValue?.url) return thumbValue.url; // nếu là object (server) thì trả về url
        if (typeof thumbValue === 'string') return thumbValue; // nếu là string (base64) thì trả về luôn
        return '';
    };

    const hasImage = () => {
        if (thumbnailPreview) return true;
        if (typeof thumbValue === 'object' && thumbValue?.url) return true;
        if (typeof thumbValue === 'string' && thumbValue.length > 0) return true;
        return false;
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className='flex flex-col gap-[20px]'>
                {/* name */}
                <div className='flex flex-col gap-[10px]'>
                    <Label htmlFor="name">Course Name</Label>
                    <div className="relative">
                        <Input
                            {...register("name")}
                            id='name'
                            placeholder='How to use mascara'
                            type="text"
                            className={field("name").border}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {field("name").icon}
                        </div>
                    </div>
                    {errors.name && (
                        <div className="flex items-center gap-2 mt-1">
                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                            <p className="text-red-400 text-[12px]">{errors.name.message}</p>
                        </div>
                    )}
                </div>

                {/* description */}
                <div className='flex flex-col gap-[10px]'>
                    <Label htmlFor="description">Course Description</Label>
                    <div className="relative">
                        <textarea
                            {...register("description")}
                            id="description"
                            rows={3}
                            placeholder="Unlock the secrets to flawless lashes with our comprehensive course on how to use mascara like a pro. Whether you're a beginner or looking to refine your makeup skills, this course is designed to teach you everything you need to know about applying mascara effectively and achieving stunning results."
                            className={`w-full rounded-md border text-sm p-2 pr-8 md:pr-10 bg-transparent resize-y min-h-[72px] ${field("description").border}`}
                        />
                        <div className="absolute right-3 top-3">
                            {field("description").icon}
                        </div>
                    </div>
                    {errors.description && (
                        <div className="flex items-center gap-2 mt-1">
                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                            <p className="text-red-400 text-[12px]">{errors.description.message}</p>
                        </div>
                    )}
                </div>

                {/* categories */}
                <div className='flex flex-col gap-[10px]'>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="categories">Course Categories</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={onAutoFillClick}
                                className="text-xs h-7 px-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                disabled={!watchedFields.description?.trim()}
                            >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Auto Fill
                            </Button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {(watchedFields.categories || []).length}/5 selected
                            </span>
                        </div>
                    </div>

                    <Controller
                        name="categories"
                        control={control}
                        render={({ field: categoriesField }) => (
                            <div className="space-y-4">
                                {/* Categories Grid */}
                                <div className={`border rounded-md p-4 ${field("categories", { isArrayField: true }).border}`}>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {allCategories
                                            .slice(0, showAllCategories ? allCategories.length : 9)
                                            .map((category) => {
                                                const currentCategories = categoriesField.value || [];
                                                const isSelected = currentCategories.includes(category._id);
                                                const isDisabled = currentCategories.length >= 5 && !isSelected;

                                                return (
                                                    <label
                                                        key={category._id}
                                                        className={`flex items-center p-3 rounded-lg transition-colors duration-150 
                                                            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                                                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            disabled={isDisabled}
                                                            onChange={() => handleCategoryToggle(category._id, currentCategories)}
                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mr-3"
                                                        />
                                                        <span className={`text-sm select-none ${isSelected
                                                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {category.title}
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        }
                                    </div>

                                    {/* Show More/Less Button */}
                                    {allCategories.length > 9 && (
                                        <div className="mt-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowAllCategories(!showAllCategories)}
                                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none hover:cursor-pointer"
                                            >
                                                {showAllCategories ? 'Show Less' : `Show More`}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Categories - Simple Tags */}
                                {categoriesField.value && categoriesField.value.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        {
                                            autoFilled && (
                                                <span className="text-xs text-gray-400 mt-1">
                                                    Please review the selected categories after using Auto Fill.
                                                </span>
                                            )
                                        }
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            Selected Categories:
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {categoriesField.value.map((categoryId: string) => (
                                                <div
                                                    key={categoryId}
                                                    className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm"
                                                >
                                                    <span>{getCategoryNameById(categoryId)}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCategoryToggle(categoryId, categoriesField.value)}
                                                        className="hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none ml-1"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Status Icon */}
                                <div className="flex justify-end">
                                    {field("categories", { isArrayField: true }).icon}
                                </div>
                            </div>
                        )}
                    />

                    {errors.categories && (
                        <div className="flex items-center gap-2 mt-1">
                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                            <p className="text-red-400 text-[12px]">{errors.categories.message}</p>
                        </div>
                    )}
                </div>

                {/* price + estimated price */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-[20px]'>
                    {/* price */}
                    <div className='flex flex-col gap-[10px]'>
                        <Label htmlFor="price">Course Price</Label>
                        <div className="relative">
                            <Input
                                {...register("price")}
                                id='price'
                                placeholder='30'
                                type="text"
                                inputMode="decimal" // Hiện bàn phím số trên mobile
                                className={field("price").border}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {field("price").icon}
                            </div>
                        </div>
                        {errors.price && (
                            <div className="flex items-center gap-2 mt-1">
                                <IoAlertCircleOutline className="text-red-400 text-sm" />
                                <p className="text-red-400 text-[12px]">{errors.price.message}</p>
                            </div>
                        )}
                    </div>
                    {/* estimated price */}
                    <div className='flex flex-col gap-[10px]'>
                        <Label htmlFor="estimatedPrice">Estimated Price</Label>
                        <div className="relative">
                            <Input
                                {...register("estimatedPrice")}
                                id='estimatedPrice'
                                placeholder='30'
                                type="text"
                                inputMode="decimal" // Hiện bàn phím số trên mobile
                                className={field("estimatedPrice").border}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {field("estimatedPrice").icon}
                            </div>
                        </div>
                        {errors.estimatedPrice && (
                            <div className="flex items-center gap-2 mt-1">
                                <IoAlertCircleOutline className="text-red-400 text-sm" />
                                <p className="text-red-400 text-[12px]">{errors.estimatedPrice.message}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* tags */}
                <div className='flex flex-col gap-[10px]'>
                    <Label htmlFor="tags">Course Tags</Label>
                    <div className="relative">
                        <Input
                            {...register("tags")}
                            id='tags'
                            placeholder='Makeup Basics, Mascara Techniques, Beauty Skills'
                            type="text"
                            className={field("tags").border}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {field("tags").icon}
                        </div>
                    </div>
                    {errors.tags && (
                        <div className="flex items-center gap-2 mt-1">
                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                            <p className="text-red-400 text-[12px]">{errors.tags.message}</p>
                        </div>
                    )}
                </div>

                {/* levels */}
                <div className='flex flex-col gap-[10px]'>
                    <Label htmlFor="level">Course Level</Label>
                    <Controller
                        name="level"
                        control={control}
                        render={({ field: levelField }) => (
                            <div className="relative">
                                <select
                                    {...levelField}
                                    id='level'
                                    className={`w-full rounded-lg border text-sm bg-white dark:bg-slate-800/20 p-3 pr-10 appearance-none cursor-pointer transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${field("level").border}`}
                                >
                                    <option value="" disabled className="text-gray-400">
                                        Select a course level
                                    </option>
                                    {allLevels.map((level) => (
                                        <option key={level} value={level} className="text-gray-900 dark:text-gray-100">
                                            {level}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                    {field("level").icon}
                                </div>
                            </div>
                        )}
                    />
                    {errors.level && (
                        <div className="flex items-center gap-2 mt-1">
                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                            <p className="text-red-400 text-[12px]">{errors.level.message}</p>
                        </div>
                    )}
                </div>

                {/* demo video */}
                <div className='flex flex-col gap-[10px]'>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Demo Video
                    </Label>
                    <Controller
                        name="videoDemo"
                        control={control}
                        render={({ field }) => (
                            <EditVideoUploader
                                video={field.value}
                                isUploading={isUploadingDemo}
                                uploadProgress={uploadProgress}
                                onVideoSelect={handleVideoSelect}
                                onRemoveVideo={handleRemoveVideo}
                                onCancelUpload={handleCancelVideoUpload}
                                className="w-full md:w-[500px]"
                            />
                        )}
                    />
                    {errors.videoDemo && (
                        <div className="flex items-center gap-2 mt-1">
                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                            <p className="text-red-400 text-[12px]">
                                {errors.videoDemo.public_id?.message || "Please upload a demo video"}
                            </p>
                        </div>
                    )}
                </div>

                {/* thumbnail */}
                <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Course Thumbnail
                    </Label>
                    <Input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                    />

                    <div
                        className={`mt-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center transition-colors w-full md:w-[500px]
                                    ${dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
                                    hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                                    dark:text-gray-300`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {hasImage() ? (
                            <>
                                <div className="rounded-lg relative overflow-hidden w-full shadow-md border dark:border-gray-700">
                                    <div className="w-full h-64">
                                        <Image
                                            src={getThumbnailUrl()}
                                            alt="thumbnail"
                                            fill
                                            sizes="100vw"
                                            priority
                                            style={{ objectFit: 'contain' }}
                                            className="object-contain max-w-full max-h-full"
                                        />
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <label
                                        htmlFor="file-input"
                                        className="text-xs text-blue-600 cursor-pointer dark:text-blue-400 hover:underline"
                                    >
                                        Change image
                                    </label>
                                    <p onClick={removeImage} className="text-xs text-red-500 dark:text-red-400 cursor-pointer hover:underline">
                                        Delete image
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className='text-center'>
                                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                                <div className="text-sm font-medium">
                                    Drag and drop an image here, or{' '}
                                    <label htmlFor="file-input" className="text-blue-600 cursor-pointer dark:text-blue-400 hover:underline">
                                        browse
                                    </label>
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Recommended size: 1920 x 600px. Max 2MB
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Error message for thumbnail */}
                    {errors.thumbnail && (
                        <div className="flex items-center gap-2 mt-1">
                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                            <p className="text-red-400 text-[12px]">{errors.thumbnail.message}</p>
                        </div>
                    )}

                </div>

                {/* next button */}
                <div className='flex justify-end'>
                    <Button
                        type='submit'
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

export default EditCourseInformation