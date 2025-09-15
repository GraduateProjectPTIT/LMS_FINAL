"use client"

import React from 'react'
import { FaTimes, FaInfoCircle } from 'react-icons/fa'

interface ConfirmSkipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    selectedRole: 'student' | 'tutor' | null;
}

const ConfirmSkipModal = ({ isOpen, onClose, onConfirm, selectedRole }: ConfirmSkipModalProps) => {
    if (!isOpen) return null;

    const getTitle = () => {
        return selectedRole === 'student'
            ? 'Skip Interest Selection?'
            : 'Skip Expertise Selection?';
    };

    const getDescription = () => {
        return selectedRole === 'student'
            ? 'You can set up your interests later in Profile Management to get better course recommendations.'
            : 'You can set up your expertise areas later in Profile Management to help students find you more easily.';
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Modal */}
                <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <FaTimes className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {/* Icon */}
                    <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mx-auto mb-4">
                        <FaInfoCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                    </div>

                    {/* Content */}
                    <div className="text-center space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {getTitle()}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                            {getDescription()}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Continue Setup
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                        >
                            Skip for Now
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ConfirmSkipModal;