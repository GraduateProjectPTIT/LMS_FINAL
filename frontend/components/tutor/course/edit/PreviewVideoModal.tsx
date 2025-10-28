import React, { useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

interface PreviewVideoModalProps {
    showPreviewModal: boolean;
    videoUrl: string;
    onClose: () => void;
}

const PreviewVideoModal = ({ showPreviewModal, videoUrl, onClose }: PreviewVideoModalProps) => {
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

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
    }, [showPreviewModal, handleEscape]);

    if (!showPreviewModal || !videoUrl) return null;

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
                    {videoUrl ? (
                        <video
                            className="w-full h-full object-cover"
                            controls
                            autoPlay
                            src={videoUrl}
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

export default PreviewVideoModal;