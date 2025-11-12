"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    userName?: string;
    userEmail?: string;
}

const DeleteAccountModal = ({
    isOpen,
    onClose,
    onConfirm,
    userName,
    userEmail
}: DeleteAccountModalProps) => {
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') {
            toast.error('Please type "DELETE" to confirm (in uppercase)');
            return;
        }

        if (!agreeToTerms) {
            toast.error('Please confirm that you understand the consequences');
            return;
        }

        try {
            setIsDeleting(true);
            await onConfirm();

            // Reset form
            setConfirmText("");
            setAgreeToTerms(false);
        } catch (error) {
            console.error('Delete account error:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            setConfirmText("");
            setAgreeToTerms(false);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && !isDeleting) {
            handleClose();
        }
    };

    const canDelete = confirmText === 'DELETE' && agreeToTerms;

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
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Delete Account
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
                    {/* Account Info */}
                    {(userName || userEmail) && (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                You are about to delete the following account:
                            </p>
                            <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                                {userName && (
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {userName}
                                    </p>
                                )}
                                {userEmail && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {userEmail}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Confirmation Checkbox */}
                    <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreeToTerms}
                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                disabled={isDeleting}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-slate-600 
                                    text-red-600 focus:ring-red-500 focus:ring-offset-0
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    I understand that this action cannot be undone and all my data will be permanently deleted
                                </p>
                            </div>
                        </label>

                        {/* Confirmation Input */}
                        <div className="space-y-2 pt-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Type <span className="font-mono font-bold bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded text-red-600 dark:text-red-400">DELETE</span> to confirm <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type DELETE here (in uppercase)"
                                disabled={isDeleting}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md
                                    bg-white dark:bg-slate-900 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-red-500 focus:border-transparent
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                                    text-sm font-mono"
                            />
                        </div>
                    </div>
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
                        className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting Account...
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete My Account Permanently
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;