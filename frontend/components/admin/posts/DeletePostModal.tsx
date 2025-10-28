"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface DeletePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    postTitle: string;
    postId: string;
}

export default function DeletePostModal({
    isOpen,
    onClose,
    onConfirm,
    postTitle,
    postId,
}: DeletePostModalProps) {
    const [deleting, setDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (confirmText.toLowerCase() !== "delete") {
            toast.error('Please type "delete" to confirm');
            return;
        }

        setDeleting(true);
        try {
            await onConfirm();
            setConfirmText("");
            onClose();
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete post");
        } finally {
            setDeleting(false);
        }
    };

    const handleClose = () => {
        if (!deleting) {
            setConfirmText("");
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && !deleting) {
            handleClose();
        } else if (e.key === "Enter" && confirmText.toLowerCase() === "delete") {
            handleDelete();
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
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Delete Post
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
                    {/* Post Info */}
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            You are about to delete:
                        </p>
                        <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                            <p className="font-semibold text-gray-900 dark:text-white truncate" title={postTitle}>
                                {postTitle}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                                ID: {postId}
                            </p>
                        </div>
                    </div>

                    {/* Confirmation Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Type <span className="font-bold text-red-600 dark:text-red-400">delete</span> to confirm:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type 'delete' here"
                            disabled={deleting}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md
                bg-white dark:bg-slate-900 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-red-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            autoFocus
                        />
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
                        disabled={deleting || confirmText.toLowerCase() !== "delete"}
                        className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {deleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Post"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}