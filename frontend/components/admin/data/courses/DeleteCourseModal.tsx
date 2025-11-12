"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Loader2, Trash2, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeleteCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (type: 'soft' | 'hard', reason?: string, removeFromCarts?: boolean, notify?: boolean) => Promise<void> | void;
    courseName: string;
    courseId?: string;
    isDeleting: boolean;
}

type DeleteType = 'soft' | 'hard';

const DeleteCourseModal = ({
    isOpen,
    onClose,
    onConfirm,
    courseName,
    courseId,
    isDeleting
}: DeleteCourseModalProps) => {
    const [deleteType, setDeleteType] = useState<DeleteType>('soft');
    const [reason, setReason] = useState("");
    const [removeFromCarts, setRemoveFromCarts] = useState(true);
    const [notify, setNotify] = useState(true);
    const [confirmText, setConfirmText] = useState("");

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (deleteType === 'soft') {
            if (!reason.trim()) {
                toast.error('Please provide a reason for retiring this course');
                return;
            }
            if (reason.trim().length < 10) {
                toast.error('Reason must be at least 10 characters');
                return;
            }
            await onConfirm('soft', reason.trim(), removeFromCarts, notify);
        } else {
            if (confirmText !== 'delete') {
                toast.error('Please type "delete" to confirm');
                return;
            }
            await onConfirm('hard');
        }

        // Reset form
        setDeleteType('soft');
        setReason("");
        setRemoveFromCarts(true);
        setNotify(true);
        setConfirmText("");
    };

    const handleClose = () => {
        if (!isDeleting) {
            setDeleteType('soft');
            setReason("");
            setRemoveFromCarts(true);
            setNotify(true);
            setConfirmText("");
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && !isDeleting) {
            handleClose();
        }
    };

    const canDelete = deleteType === 'soft'
        ? reason.trim().length >= 10
        : confirmText === 'delete';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-2xl overflow-hidden"
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
                        disabled={isDeleting}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-5">
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

                    {/* Delete Type Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Choose deletion type <span className="text-red-500">*</span>
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Soft Delete Option */}
                            <button
                                type="button"
                                onClick={() => setDeleteType('soft')}
                                disabled={isDeleting}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${deleteType === 'soft'
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                                    : 'border-gray-200 dark:border-slate-600 hover:cursor-pointer'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <div className="flex items-start gap-3">
                                    <Archive className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Soft Delete</p>
                                    </div>
                                </div>
                            </button>

                            {/* Hard Delete Option */}
                            <button
                                type="button"
                                onClick={() => setDeleteType('hard')}
                                disabled={isDeleting}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${deleteType === 'hard'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                                    : 'border-gray-200 dark:border-slate-600 hover:cursor-pointer'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <div className="flex items-start gap-3">
                                    <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Hard Delete</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Soft Delete Form */}
                    {deleteType === 'soft' && (
                        <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-900/30">
                            {/* Reason Input */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Reason for retiring <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g., Outdated content, replaced by 2026 edition"
                                    disabled={isDeleting}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md
                                        bg-white dark:bg-slate-900 text-gray-900 dark:text-white
                                        focus:ring-2 focus:ring-orange-500 focus:border-transparent
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        placeholder:text-gray-400 dark:placeholder:text-gray-500
                                        resize-none text-sm"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Minimum 10 characters. This reason will be logged for record keeping.
                                </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={removeFromCarts}
                                        onChange={(e) => setRemoveFromCarts(e.target.checked)}
                                        disabled={isDeleting}
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
                                        disabled={isDeleting}
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
                    )}

                    {/* Hard Delete Confirmation */}
                    {deleteType === 'hard' && (
                        <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                                        Warning: This action cannot be undone!
                                    </p>
                                    <p className="text-sm text-red-700 dark:text-red-400">
                                        All course data including videos, documents, student enrollments, and progress will be permanently deleted.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Type <span className="font-mono bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded">delete</span> to confirm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Type 'delete' here"
                                    disabled={isDeleting}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md
                                        bg-white dark:bg-slate-900 text-gray-900 dark:text-white
                                        focus:ring-2 focus:ring-red-500 focus:border-transparent
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        placeholder:text-gray-400 dark:placeholder:text-gray-500
                                        text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting || !canDelete}
                        className={`disabled:opacity-50 disabled:cursor-not-allowed text-white ${deleteType === 'soft'
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {deleteType === 'soft' ? 'Retiring...' : 'Deleting...'}
                            </>
                        ) : (
                            <>
                                {deleteType === 'soft' ? (
                                    <>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Retire Course
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Permanently
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteCourseModal;