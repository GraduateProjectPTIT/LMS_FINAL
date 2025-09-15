"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Video, CheckCircle, X, StopCircle } from 'lucide-react';
import { IVideoUpload } from '@/type';
import toast from 'react-hot-toast';
import PreviewVideoModal from './PreviewVideoModal';

interface VideoUploaderProps {
    video?: IVideoUpload;
    isUploading: boolean;
    uploadProgress: number;
    onVideoSelect: (file: File) => void;
    onRemoveVideo?: () => void;
    onCancelUpload?: () => void;
    className?: string;
}

const VideoUploader = ({
    video,
    isUploading,
    uploadProgress,
    onVideoSelect,
    onRemoveVideo,
    onCancelUpload,
    className = ""
}: VideoUploaderProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset file input
        e.target.value = '';

        // Validate file type
        if (!file.type.startsWith('video/')) {
            toast.error('Please select a valid video file');
            return;
        }

        // Validate file size (max 100MB for chunked upload)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            toast.error('Video file size should not exceed 100MB');
            return;
        }

        onVideoSelect(file);
    };

    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleCancelUpload = () => {
        if (onCancelUpload) {
            onCancelUpload();
            toast.success('Upload cancelled');
        }
    };

    // Check if we have a successfully uploaded video (not empty/default values)
    const hasUploadedVideo = video && video.public_id && video.url && video.public_id !== "" && video.url !== "";

    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // If video is uploaded and not uploading
    if (hasUploadedVideo && !isUploading) {
        return (
            <>
                <div className={`border-2 border-dashed border-green-300 dark:border-green-600 rounded-lg p-4 bg-green-50 dark:bg-green-900/20 ${className}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                    Video uploaded successfully
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreviewModal(true)}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Preview
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleButtonClick}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Replace
                            </Button>
                            {onRemoveVideo && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onRemoveVideo}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
                {showPreviewModal && (
                    <PreviewVideoModal
                        showPreviewModal={showPreviewModal}
                        videoUrl={video?.url || ''}
                        onClose={() => setShowPreviewModal(false)}
                    />
                )}
            </>
        );
    }

    // If uploading
    if (isUploading) {
        return (
            <div className={`border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 ${className}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin">
                            <Upload className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                            Uploading video...
                        </span>
                    </div>
                    {onCancelUpload && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelUpload}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                            <StopCircle className="w-4 h-4 mr-1" />
                            Cancel
                        </Button>
                    )}
                </div>
                <Progress value={uploadProgress} className="w-full h-2 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {uploadProgress.toFixed(1)}% completed
                </p>
            </div>
        );
    }

    // Default state - no video uploaded
    return (
        <div className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-colors ${className}`}>
            <div className="text-center">
                <Video className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Upload Video Content
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Select a video file (max 100MB). Large files will be uploaded in chunks.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Supported formats: MP4, MOV, AVI, MKV, WebM
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleButtonClick}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Video
                </Button>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
};

export default VideoUploader;