"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SoftDeleteCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, removeFromCarts: boolean, notify: boolean) => Promise<void> | void;
    courseName: string;
    courseId?: string;
}

const SoftDeleteCourseModal = ({
    isOpen,
    onClose,
    onConfirm,
    courseName,
    courseId
}: SoftDeleteCourseModalProps) => {
    const [deleting, setDeleting] = useState(false);
    const [reason, setReason] = useState("");
    const [removeFromCarts, setRemoveFromCarts] = useState(true);
    const [notify, setNotify] = useState(true);

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (!reason.trim()) {
            toast.error('Please provide a reason for retiring this course');
            return;
        }

        if (reason.trim().length < 10) {
            toast.error('Reason must be at least 10 characters');
            return;
        }

        setDeleting(true);
        try {
            await onConfirm(reason.trim(), removeFromCarts, notify);
            setReason("");
            setRemoveFromCarts(true);
            setNotify(true);
            onClose();
        } catch (error: any) {
            toast.error(error?.message || "Failed to retire course");
        } finally {
            setDeleting(false);
        }
    };

    const handleClose = () => {
        if (!deleting) {
            setReason("");
            setRemoveFromCarts(true);
            setNotify(true);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && !deleting) {
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
                            Delete Course
                        </h2>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        disabled={deleting}
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
                            You are about to delete:
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

                    {/* Warning Message */}
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-lg">
                        <p className="text-sm text-orange-800 dark:text-orange-300">
                            This course will be soft deleted (retired). It won't be permanently removed but will be hidden from students.
                        </p>
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Reason for retiring <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Outdated content, replaced by 2026 edition"
                            disabled={deleting}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md
                                bg-white dark:bg-slate-900 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-orange-500 focus:border-transparent
                                disabled:opacity-50 disabled:cursor-not-allowed
                                placeholder:text-gray-400 dark:placeholder:text-gray-500
                                resize-none"
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Minimum 10 characters. This reason will be logged for record keeping.
                        </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 pt-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={removeFromCarts}
                                onChange={(e) => setRemoveFromCarts(e.target.checked)}
                                disabled={deleting}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-slate-600 
                                    text-orange-600 focus:ring-orange-500 focus:ring-offset-0
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Remove from student carts
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Remove this course from all student shopping carts
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notify}
                                onChange={(e) => setNotify(e.target.checked)}
                                disabled={deleting}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-slate-600 
                                    text-orange-600 focus:ring-orange-500 focus:ring-offset-0
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Notify enrolled students
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Send notification to students currently enrolled in this course
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting || !reason.trim() || reason.trim().length < 10}
                        className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {deleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Retiring...
                            </>
                        ) : (
                            "Retire Course"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SoftDeleteCourseModal;