"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    courseName: string;
    isDeleting: boolean;
}

const DeleteCourseModal = ({
    isOpen,
    onClose,
    onConfirm,
    courseName,
    isDeleting
}: DeleteCourseModalProps) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Delete Course
                        </h3>
                    </div>
                </div>
                <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to delete this course? This action cannot be undone.
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-700 p-2 rounded">
                        "{courseName}"
                    </p>
                </div>
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteCourseModal;
