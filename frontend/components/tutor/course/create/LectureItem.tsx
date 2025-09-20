"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import VideoUploader from './VideoUploader';
import { ICreateLecture, IBaseLink, IVideoUpload } from '@/type';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import toast from 'react-hot-toast';
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from 'lucide-react';

interface LectureItemProps {
    id: string;
    lecture: ICreateLecture;
    lectureIndex: number;
    sectionIndex: number;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onRemove: () => void;
    onUpdateLecture: (updatedLecture: ICreateLecture) => void;
}

const LectureItem = ({
    id,
    lecture,
    lectureIndex,
    sectionIndex,
    isCollapsed,
    onToggleCollapse,
    onRemove,
    onUpdateLecture
}: LectureItemProps) => {

    // hooks cho drag-and-drop
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const { uploadVideo, cancelCurrentUpload } = useVideoUpload();

    const handleFieldChange = <K extends keyof ICreateLecture>(
        field: K,
        value: ICreateLecture[K]
    ) => {
        const updatedLecture = { ...lecture, [field]: value };
        onUpdateLecture(updatedLecture);
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
            console.log('Processing video file:', {
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                type: file.type
            });

            // BƯỚC 1: Lấy duration từ file trước
            let videoDurationSeconds = 0;
            let durationMinutes = 0;

            try {
                videoDurationSeconds = await getVideoDuration(file);
                durationMinutes = Math.ceil(videoDurationSeconds / 60); // Làm tròn lên

                console.log('Video duration:', {
                    seconds: videoDurationSeconds,
                    minutes: durationMinutes
                });

                toast.success(`Video duration detected: ${durationMinutes} minutes`);
            } catch (durationError) {
                console.warn('Could not get video duration:', durationError);
                toast.error('Could not detect video duration. You can set it manually after upload.');
            }

            // BƯỚC 2: Bắt đầu upload với duration đã có và giữ nguyên trong suốt quá trình upload
            const updatedLecture = {
                ...lecture,
                videoLength: durationMinutes, // Set duration ngay từ đầu
                autoDetectedDuration: durationMinutes, // Lưu auto-detected duration riêng
                isUploading: true,
                uploadProgress: 0,
            };
            onUpdateLecture(updatedLecture);

            // BƯỚC 3: Upload video
            const videoData = await uploadVideo(file, (progress) => {
                onUpdateLecture({
                    ...lecture,
                    videoLength: durationMinutes, // Giữ nguyên duration trong suốt quá trình upload
                    autoDetectedDuration: durationMinutes, // Giữ nguyên auto-detected duration
                    uploadProgress: progress,
                    isUploading: true,
                });
            });

            // BƯỚC 4: Hoàn thành upload
            if (videoData) {
                const finalUpdatedLecture = {
                    ...lecture,
                    video: videoData,
                    videoLength: durationMinutes, // Giữ nguyên duration đã detect
                    autoDetectedDuration: durationMinutes, // Lưu auto-detected duration để hiển thị
                    isUploading: false,
                    uploadProgress: 0,
                };

                onUpdateLecture(finalUpdatedLecture);

                const successMessage = durationMinutes > 0
                    ? `Video uploaded successfully! Duration: ${durationMinutes} minutes`
                    : 'Video uploaded successfully! Please set duration manually.';

                toast.success(successMessage);
            } else {
                // Upload failed - clear states
                const updatedLecture = {
                    ...lecture,
                    isUploading: false,
                    uploadProgress: 0,
                };
                onUpdateLecture(updatedLecture);
            }

        } catch (error: any) {
            console.error('Video upload error:', error);
            toast.error('Video upload failed');

            const updatedLecture = {
                ...lecture,
                isUploading: false,
                uploadProgress: 0,
            };
            onUpdateLecture(updatedLecture);
        }
    };

    const handleCancelUpload = () => {
        cancelCurrentUpload();

        // Clear upload states
        const updatedLecture = {
            ...lecture,
            isUploading: false,
            uploadProgress: 0,
        };
        onUpdateLecture(updatedLecture);
    };

    const handleRemoveVideo = () => {
        const updatedLecture = {
            ...lecture,
            video: { public_id: "", url: "" },
            autoDetectedDuration: undefined // Clear auto-detected duration khi remove video
        };
        onUpdateLecture(updatedLecture);
        toast.success('Video removed');
    };

    // Handle video length change - clear auto-detected state when user manually inputs
    const handleVideoLengthChange = (value: number) => {
        const updatedLecture = {
            ...lecture,
            videoLength: value,
            // Nếu user tự nhập khác với auto-detected, thì clear auto-detected state
            ...(lecture.autoDetectedDuration && value !== lecture.autoDetectedDuration ? {
                isManuallyEdited: true
            } : {})
        };
        onUpdateLecture(updatedLecture);
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

        // Nếu chưa có videoLinks, tạo mảng mới với 1 link
        const currentLinks = lecture.videoLinks ?? [];
        const updatedLinks = [...currentLinks, { title: "", url: "" }];
        const updatedLecture = { ...lecture, videoLinks: updatedLinks };
        onUpdateLecture(updatedLecture);
    };

    const handleRemoveLink = (linkIndex: number) => {
        const currentLinks = lecture.videoLinks ?? [];
        if (currentLinks.length <= 1) {
            // Nếu chỉ còn 1 link, xóa luôn videoLinks array
            const updatedLecture = { ...lecture, videoLinks: undefined };
            onUpdateLecture(updatedLecture);
            toast.success("Resource links removed");
            return;
        }

        const updatedLinks = currentLinks.filter((_, index) => index !== linkIndex);
        const updatedLecture = { ...lecture, videoLinks: updatedLinks };
        onUpdateLecture(updatedLecture);
    };

    const handleLinkChange = (linkIndex: number, field: keyof IBaseLink, value: string) => {
        const currentLinks = lecture.videoLinks ?? [];
        const updatedLinks = currentLinks.map((link, index) =>
            index === linkIndex ? { ...link, [field]: value } : link
        );
        const updatedLecture = { ...lecture, videoLinks: updatedLinks };
        onUpdateLecture(updatedLecture);
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
                        <VideoUploader
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
                                Video Length (in minutes)
                                <span className='text-red-600'> *</span>
                            </Label>
                            {isAutoDetected && (
                                <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                    Auto-detected
                                </span>
                            )}
                        </div>

                        <div className="relative">
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
                                step="0.1"
                            />

                            {isAutoDetected && (
                                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                                </div>
                            )}
                        </div>

                        {!lecture.video?.url && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Upload a video to automatically detect duration
                            </p>
                        )}

                        {/* Hiển thị auto-detected duration để user tham khảo khi đã tự nhập */}
                        {lecture.autoDetectedDuration &&
                            lecture.videoLength !== lecture.autoDetectedDuration &&
                            lecture.isManuallyEdited && (
                                <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                    💡 Auto-detected duration was: {lecture.autoDetectedDuration} {lecture.autoDetectedDuration === 1 ? 'minute' : 'minutes'}
                                </p>
                            )}
                    </div>

                    {/* Additional Resources */}
                    <div className='flex flex-col gap-3'>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Additional Resources & Links
                        </Label>

                        {/* Nếu chưa có videoLinks hoặc rỗng, chỉ hiện button */}
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
                            // Nếu đã có videoLinks, hiển thị như bình thường
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
        </div>
    );
};

export default LectureItem;