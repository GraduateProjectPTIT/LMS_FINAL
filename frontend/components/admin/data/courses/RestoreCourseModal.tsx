"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, X, Loader2 } from 'lucide-react';

interface RestoreCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    courseName: string;
    courseId?: string;
    isRestoring: boolean;
}

const RestoreCourseModal = ({
    isOpen,
    onClose,
    onConfirm,
    courseName,
    courseId,
    isRestoring
}: RestoreCourseModalProps) => {
    if (!isOpen) return null;

    const handleRestore = async () => {
        await onConfirm();
    };

    const handleClose = () => {
        if (!isRestoring) {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && !isRestoring) {
            handleClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-lg shadow-2xl overflow-hidden"
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Restore Course
                        </h2>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        disabled={isRestoring}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-4">
                    {/* Course Info */}
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            You are about to restore:
                        </p>
                        <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                            <p className="font-semibold text-gray-900 dark:text-white truncate" title={courseName}>
                                {courseName}
                            </p>
                            {courseId && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                                    ID: {courseId}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Info Message */}
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">
                            This course will be restored and made available to students again. All course content and data will remain intact.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isRestoring}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleRestore}
                        disabled={isRestoring}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRestoring ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Restoring...
                            </>
                        ) : (
                            <>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore Course
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RestoreCourseModal;