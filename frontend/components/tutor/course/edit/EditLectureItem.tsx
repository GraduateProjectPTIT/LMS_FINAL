"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash2, Plus, Clock } from 'lucide-react';
import EditVideoUploader from './EditVideoUploader';
import EditConvertDurationModal from './EditConvertDurationModal';
import { ICreateLecture, IBaseLink, IVideoUpload } from '@/type';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import toast from 'react-hot-toast';
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from 'lucide-react';

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
    autoDetectedDuration?: number;
    isManuallyEdited?: boolean;
}

interface EditLectureItemProps {
    id: string;
    lecture: IEditLecture;
    lectureIndex: number;
    sectionIndex: number;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onRemove: () => void;
    onUpdateLecture: (updater: IEditLecture | ((prevLecture: IEditLecture) => IEditLecture)) => void;
}

const EditLectureItem = ({
    id,
    lecture,
    lectureIndex,
    sectionIndex,
    isCollapsed,
    onToggleCollapse,
    onRemove,
    onUpdateLecture
}: EditLectureItemProps) => {

    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

    // hooks cho drag-and-drop
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const { uploadVideo, cancelCurrentUpload } = useVideoUpload();

    const handleFieldChange = <K extends keyof IEditLecture>(
        field: K,
        value: IEditLecture[K]
    ) => {
        onUpdateLecture(prev => ({ ...prev, [field]: value }));
    };

    const getVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('video/')) {
                reject(new Error('Not a video file'));
                return;
            }

            const video = document.createElement('video');
            video.preload = 'metadata';

            // Timeout để tránh hang
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Timeout loading video metadata'));
            }, 10000); // 10 giây timeout

            const cleanup = () => {
                clearTimeout(timeout);
                if (video.src) {
                    URL.revokeObjectURL(video.src);
                }
            };

            video.onloadedmetadata = () => {
                cleanup();
                const duration = video.duration;

                if (isNaN(duration) || duration <= 0) {
                    reject(new Error('Invalid video duration'));
                    return;
                }

                resolve(duration);
            };

            video.onerror = () => {
                cleanup();
                reject(new Error('Failed to load video metadata'));
            };

            try {
                video.src = URL.createObjectURL(file);
            } catch (error) {
                cleanup();
                reject(new Error('Failed to create object URL'));
            }
        });
    };

    const handleVideoSelect = async (file: File) => {
        try {
            // BƯỚC 1: Lấy duration từ file trước
            let videoDurationSeconds = 0;

            try {
                videoDurationSeconds = await getVideoDuration(file);
                videoDurationSeconds = Math.ceil(videoDurationSeconds); // Làm tròn lên

                toast.success(`Video duration detected: ${videoDurationSeconds} seconds`);
            } catch (durationError) {
                console.warn('Could not get video duration:', durationError);
                toast.error('Could not detect video duration. You can set it manually after upload.');
            }

            // BƯỚC 2: Bắt đầu upload với duration đã có và giữ nguyên trong suốt quá trình upload
            onUpdateLecture(prev => ({
                ...prev,
                videoLength: videoDurationSeconds, // Set duration ngay từ đầu
                autoDetectedDuration: videoDurationSeconds, // Lưu auto-detected duration riêng
                isUploading: true,
                uploadProgress: 0,
            }));

            // BƯỚC 3: Upload video
            const videoData = await uploadVideo(file, (progress) => {
                onUpdateLecture(prev => ({
                    ...prev,
                    uploadProgress: progress,
                    isUploading: true,
                }));
            });

            // BƯỚC 4: Hoàn thành upload
            if (videoData) {
                onUpdateLecture(prev => ({
                    ...prev,
                    video: videoData,
                    videoLength: videoDurationSeconds, // Giữ nguyên duration đã detect
                    autoDetectedDuration: videoDurationSeconds, // Lưu auto-detected duration
                    isUploading: false,
                    uploadProgress: 0,
                }));

                const successMessage = videoDurationSeconds > 0
                    ? `Video uploaded successfully! Duration: ${videoDurationSeconds} seconds`
                    : 'Video uploaded successfully! Please set duration manually.';

                toast.success(successMessage);
            } else {
                // Upload failed - clear states
                onUpdateLecture(prev => ({
                    ...prev,
                    isUploading: false,
                    uploadProgress: 0,
                }));
            }

        } catch (error: any) {
            console.error('Video upload error:', error);
            toast.error('Video upload failed');

            onUpdateLecture(prev => ({
                ...prev,
                isUploading: false,
                uploadProgress: 0,
            }));
        }
    };

    const handleCancelUpload = () => {
        cancelCurrentUpload();

        onUpdateLecture(prev => ({
            ...prev,
            isUploading: false,
            uploadProgress: 0,
        }));
    };

    const handleRemoveVideo = () => {
        onUpdateLecture(prev => ({
            ...prev,
            video: { public_id: "", url: "" },
            autoDetectedDuration: undefined // Clear auto-detected duration khi remove video
        }));
        toast.success('Video removed');
    };

    const handleConvertDuration = (seconds: number) => {
        onUpdateLecture(prev => ({
            ...prev,
            videoLength: seconds,
            // Nếu user dùng convert khác với auto-detected, đánh dấu là manually edited
            ...(prev.autoDetectedDuration && seconds !== prev.autoDetectedDuration ? {
                isManuallyEdited: true
            } : {})
        }));
        toast.success(`Duration set to ${seconds} seconds`);
    };

    // Handle video length change - clear auto-detected state when user manually inputs
    const handleVideoLengthChange = (value: number) => {
        onUpdateLecture(prev => ({
            ...prev,
            videoLength: value,
            // Nếu user tự nhập khác với auto-detected, thì clear auto-detected state
            ...(prev.autoDetectedDuration && value !== prev.autoDetectedDuration ? {
                isManuallyEdited: true
            } : {})
        }));
    };

    const validateCurrentLinks = (): boolean => {
        if (!lecture.videoLinks || lecture.videoLinks.length === 0) {
            return true;
        }

        const lastLink = lecture.videoLinks[lecture.videoLinks.length - 1];
        if (!lastLink.title.trim() || !lastLink.url.trim()) {
            toast.error("Please complete the current resource link before adding a new one");
            return false;
        }

        // Optional: Validate URL format
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(lastLink.url.trim())) {
            toast.error("Please enter a valid URL (starting with http:// or https://)");
            return false;
        }

        return true;
    };

    const handleAddLink = () => {
        // Kiểm tra link hiện tại có hợp lệ không trước khi thêm mới
        if (!validateCurrentLinks()) {
            return;
        }

        onUpdateLecture(prev => {
            const currentLinks = prev.videoLinks ?? [];
            return {
                ...prev,
                videoLinks: [...currentLinks, { title: "", url: "" }]
            };
        });
    };

    const handleRemoveLink = (linkIndex: number) => {
        onUpdateLecture(prev => {
            const currentLinks = prev.videoLinks ?? [];
            if (currentLinks.length <= 1) {
                toast.success("Resource links removed");
                const { videoLinks, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                videoLinks: currentLinks.filter((_, index) => index !== linkIndex)
            };
        });
    };

    const handleLinkChange = (linkIndex: number, field: keyof IBaseLink, value: string) => {
        onUpdateLecture(prev => {
            const currentLinks = prev.videoLinks ?? [];
            const updatedLinks = currentLinks.map((link, index) =>
                index === linkIndex ? { ...link, [field]: value } : link
            );
            return { ...prev, videoLinks: updatedLinks };
        });
    };

    const hasVideoLinks = lecture.videoLinks && lecture.videoLinks.length > 0;

    // Kiểm tra xem duration hiện tại có phải là auto-detected không
    const isAutoDetected = lecture.video?.url &&
        lecture.autoDetectedDuration &&
        lecture.videoLength === lecture.autoDetectedDuration &&
        !lecture.isManuallyEdited;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="border border-gray-300 dark:border-slate-700 rounded-lg p-4 mb-4 bg-white dark:bg-slate-800 shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div className='flex items-center gap-2'>
                    <div {...attributes} {...listeners} className="cursor-grab touch-none p-1">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
                        Lecture #{lectureIndex + 1}
                    </h3>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={onToggleCollapse}
                        className='hover:bg-gray-100 dark:hover:bg-slate-600'
                    >
                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onRemove}
                        className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
                    >
                        <Trash2 size={18} />
                    </Button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="flex flex-col gap-5 mt-4">
                    {/* Title */}
                    <div className='flex flex-col gap-2'>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Lecture Title
                            <span className='text-red-600'> *</span>
                        </Label>
                        <Input
                            value={lecture.videoTitle}
                            onChange={(e) => handleFieldChange("videoTitle", e.target.value)}
                            placeholder="Enter lecture title"
                            className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                    </div>

                    {/* Description */}
                    <div className='flex flex-col gap-2'>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Lecture Description
                            <span className='text-red-600'> *</span>
                        </Label>
                        <textarea
                            value={lecture.videoDescription}
                            onChange={(e) => handleFieldChange("videoDescription", e.target.value)}
                            placeholder="Enter lecture description"
                            className="border border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 p-3 rounded-lg resize-y min-h-[72px] focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                            rows={3}
                        />
                    </div>

                    {/* Video Upload */}
                    <div className='flex flex-col gap-2'>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Video Content
                            <span className='text-red-600'> *</span>
                        </Label>
                        <EditVideoUploader
                            video={lecture.video}
                            isUploading={lecture.isUploading || false}
                            uploadProgress={lecture.uploadProgress || 0}
                            onVideoSelect={handleVideoSelect}
                            onRemoveVideo={handleRemoveVideo}
                            onCancelUpload={handleCancelUpload}
                        />
                    </div>

                    {/* Video Length */}
                    <div className='flex flex-col gap-2'>
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Video Length (in seconds)
                                <span className='text-red-600'> *</span>
                            </Label>
                            {isAutoDetected && (
                                <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                    Auto-detected
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Input
                                    type="number"
                                    value={lecture.videoLength || ""}
                                    onChange={(e) => handleVideoLengthChange(Number(e.target.value))}
                                    placeholder="Duration will be auto-detected when you upload video"
                                    className={`border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 ${isAutoDetected
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-600'
                                        : ''
                                        }`}
                                    min="0"
                                    step="1"
                                />
                                {isAutoDetected && (
                                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                        <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                                    </div>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsConvertModalOpen(true)}
                                className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/30"
                                title="Convert from mm:ss or hh:mm:ss format"
                            >
                                <Clock size={18} className="mr-2" />
                                Convert
                            </Button>
                        </div>

                        {!lecture.video?.url && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Upload a video to automatically detect duration, or enter manually / use Convert button
                            </p>
                        )}

                        {/* Hiển thị auto-detected duration để user tham khảo khi đã tự nhập */}
                        {lecture.autoDetectedDuration &&
                            lecture.videoLength !== lecture.autoDetectedDuration &&
                            lecture.isManuallyEdited && (
                                <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                    💡 Auto-detected duration was: {lecture.autoDetectedDuration} seconds
                                </p>
                            )}
                    </div>

                    {/* Additional Resources */}
                    <div className='flex flex-col gap-3'>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Additional Resources & Links
                        </Label>

                        {!hasVideoLinks ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddLink}
                                className="w-fit bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/30"
                            >
                                <Plus size={16} className="mr-2" />
                                Add Resource Link
                            </Button>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {lecture.videoLinks!.map((link: IBaseLink, linkIndex: number) => (
                                        <div key={linkIndex} className="flex gap-2 items-start">
                                            <div className="flex-1 space-y-2">
                                                <Input
                                                    value={link.title}
                                                    onChange={(e) => handleLinkChange(linkIndex, "title", e.target.value)}
                                                    placeholder="Resource Title"
                                                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                                                />
                                                <Input
                                                    value={link.url}
                                                    onChange={(e) => handleLinkChange(linkIndex, "url", e.target.value)}
                                                    placeholder="Resource URL (https://...)"
                                                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleRemoveLink(linkIndex)}
                                                className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddLink}
                                    className="w-fit bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/30"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Add Another Resource Link
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Convert Duration Modal */}
            <EditConvertDurationModal
                isOpen={isConvertModalOpen}
                onClose={() => setIsConvertModalOpen(false)}
                onConvert={handleConvertDuration}
            />
        </div>
    );
};

export default EditLectureItem;