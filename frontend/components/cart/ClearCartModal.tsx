"use client"

import React from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'

interface ClearCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    totalItems: number;
}

const ClearCartModal = ({ isOpen, onClose, onConfirm, loading = false, totalItems }: ClearCartModalProps) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-md w-full transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Clear Cart
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                        Are you sure you want to remove all {totalItems} item{totalItems !== 1 ? 's' : ''} from your cart?
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                        This action cannot be undone.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Clearing...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Clear Cart
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClearCartModal