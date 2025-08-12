import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { toYouTubeEmbedUrl, isYouTubeUrl } from "@/utils/youtube";

interface CoursePreviewModalProps {
    showPreviewModal: boolean;
    course: any | null;
    onClose: () => void;
}

const CoursePreviewModal = ({ showPreviewModal, course, onClose }: CoursePreviewModalProps) => {

    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleModalClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    useEffect(() => {
        if (showPreviewModal) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        } else {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [showPreviewModal]);

    if (!showPreviewModal || !course) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-0 bg-black/50 backdrop-blur-sm"
            onClick={handleModalClick}
        >
            <div className="relative w-full max-w-4xl bg-slate-900 rounded-lg shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>

                {/* Video Section */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    {course.demoUrl && isYouTubeUrl(course.demoUrl) ? (
                        <iframe
                            src={toYouTubeEmbedUrl(course.demoUrl) || undefined}
                            className="absolute top-0 left-0 w-full h-full"
                            style={{ border: 0 }}
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                    ) : course.demoUrl && course.demoUrl !== 'test url' && course.demoUrl !== 'test' ? (
                        <video
                            className="w-full h-full object-cover"
                            controls
                            autoPlay
                            src={course.demoUrl}
                        >
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center bg-slate-800">
                            <div className="text-center text-white">
                                <div className="w-12 h-12 mx-auto mb-2 opacity-50">
                                    <svg fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <p className="text-lg">Preview not available</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoursePreviewModal;